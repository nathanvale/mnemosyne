import { PrismaClient } from '@studio/db'
import { unlinkSync, existsSync, readdirSync } from 'fs'
import { resolve } from 'path'

/**
 * Worker Database Factory - Creates isolated database instances per worker
 *
 * This factory addresses the SQLite concurrency issues by providing each Vitest/Wallaby
 * worker thread with its own isolated SQLite database file. This enables:
 * - Concurrent test execution across workers
 * - True test isolation between workers
 * - Wallaby.js compatibility
 * - 4x faster test execution on multi-core machines
 */

/**
 * Simplifies error messages for cleaner output in Wallaby.js
 */
function simplifyError(error: unknown): string {
  if (!error) return 'Unknown error'

  const errorStr = error.toString()

  // Common Prisma error patterns - simplify them
  if (errorStr.includes('column') && errorStr.includes('does not exist')) {
    const columnMatch = errorStr.match(/column `([^`]+)` does not exist/)
    return columnMatch ? `Missing column: ${columnMatch[1]}` : 'Missing column'
  }

  if (errorStr.includes('UNIQUE constraint failed')) {
    return 'Duplicate entry'
  }

  if (errorStr.includes('database is locked')) {
    return 'Database locked'
  }

  if (errorStr.includes('no such table')) {
    const tableMatch = errorStr.match(/no such table: (\w+)/)
    return tableMatch ? `Missing table: ${tableMatch[1]}` : 'Missing table'
  }

  // For other errors, return first line only
  return errorStr.split('\n')[0]
}
export class WorkerDatabaseFactory {
  private static instances = new Map<string, PrismaClient>()
  private static workerId: string | null = null
  private static cleanupRegistered = false

  /**
   * Gets the current worker ID from environment variables
   * Supports both Vitest and Wallaby.js worker identification
   */
  static getWorkerId(): string {
    if (this.workerId) return this.workerId

    // Debug logging to understand worker identification (suppressed in Wallaby quiet mode)
    if (process.env.TEST_VERBOSE && !process.env.WALLABY_QUIET) {
      console.log('🔍 Worker ID Detection:')
      console.log('  VITEST_WORKER_ID:', process.env.VITEST_WORKER_ID)
      console.log('  WALLABY_WORKER_ID:', process.env.WALLABY_WORKER_ID)
      console.log('  JEST_WORKER_ID:', process.env.JEST_WORKER_ID)
      console.log('  process.pid:', process.pid)
    }

    // Vitest worker ID
    if (process.env.VITEST_WORKER_ID) {
      this.workerId = process.env.VITEST_WORKER_ID
      return this.workerId
    }

    // Wallaby.js worker ID
    if (process.env.WALLABY_WORKER_ID) {
      this.workerId = process.env.WALLABY_WORKER_ID
      return this.workerId
    }

    // Jest worker ID (if needed)
    if (process.env.JEST_WORKER_ID) {
      this.workerId = process.env.JEST_WORKER_ID
      return this.workerId
    }

    // Fallback: Use process ID for worker identification
    // This works for both Vitest (which forks processes) and single-threaded execution
    this.workerId = process.pid.toString()
    if (process.env.TEST_VERBOSE && !process.env.WALLABY_QUIET) {
      console.log('  Using process.pid as worker ID:', this.workerId)
    }
    return this.workerId
  }

  /**
   * Creates a simplified Prisma client for Wallaby.js to avoid SQLite I/O errors
   * Uses worker-specific in-memory database to maintain isolation
   */
  private static async createWallabyPrismaClient(): Promise<PrismaClient> {
    const workerId = this.getWorkerId()
    const wallabyKey = `wallaby-${workerId}`

    // Return existing instance if already created for this worker
    if (this.instances.has(wallabyKey)) {
      return this.instances.get(wallabyKey)!
    }

    // Use worker-specific in-memory SQLite database for Wallaby.js
    // Each worker gets its own isolated in-memory database
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:wallaby-${workerId}?mode=memory&cache=private`,
        },
      },
      log: process.env.WALLABY_QUIET
        ? [] // Completely disable logging during Wallaby runs
        : process.env.TEST_VERBOSE
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    })

    try {
      await prisma.$connect()
      await this.migrateWorkerDatabase(prisma)
      this.instances.set(wallabyKey, prisma)
      return prisma
    } catch (error) {
      try {
        await prisma.$disconnect()
      } catch {
        // Ignore disconnect errors
      }
      throw error
    }
  }

  /**
   * Forces clearing of all cached instances (useful for schema updates)
   */
  static clearCachedInstances(): void {
    for (const [, instance] of this.instances.entries()) {
      try {
        instance.$disconnect()
      } catch {
        // Ignore disconnect errors
      }
    }
    this.instances.clear()
    this.workerId = null
  }

  /**
   * Registers cleanup handlers to prevent database file accumulation
   */
  private static registerCleanupHandlers(): void {
    if (this.cleanupRegistered) return
    this.cleanupRegistered = true

    // Clean up on process exit
    const cleanupOnExit = () => {
      try {
        this.cleanupAllWorkerDatabases()
      } catch {
        // Silent cleanup - don't interfere with process exit
      }
    }

    process.on('exit', cleanupOnExit)
    process.on('SIGINT', cleanupOnExit)
    process.on('SIGTERM', cleanupOnExit)
    process.on('uncaughtException', cleanupOnExit)
  }

  /**
   * Creates or retrieves a worker-specific Prisma client
   * Each worker gets its own SQLite database file for complete isolation
   * Falls back to sequential execution for Wallaby.js due to SQLite I/O issues
   */
  static async createWorkerPrismaClient(): Promise<PrismaClient> {
    // Check if running in Wallaby.js - use simpler approach to avoid disk I/O errors
    if (process.env.WALLABY_WORKER === 'true') {
      return this.createWallabyPrismaClient()
    }

    const workerId = this.getWorkerId()

    // Register cleanup handlers on first use
    this.registerCleanupHandlers()

    // Return existing instance if already created for this worker
    if (this.instances.has(workerId)) {
      return this.instances.get(workerId)!
    }

    // Create worker-specific database file path in a temp directory
    const tmpDir = process.env.TMPDIR || '/tmp'
    const dbPath = resolve(tmpDir, `mnemosyne-test-worker-${workerId}.db`)
    const databaseUrl = `file:${dbPath}`

    // Database will be created in system temp directory - guaranteed write access

    // Create new Prisma client with worker-specific database
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      // Disable query logging in tests for cleaner output
      log: process.env.WALLABY_QUIET
        ? [] // Completely disable logging during Wallaby runs
        : process.env.TEST_VERBOSE
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    })

    try {
      // Connect to the database
      await prisma.$connect()

      // Run migrations to set up the schema for this worker's database
      await this.migrateWorkerDatabase(prisma)

      // Cache the instance for this worker
      this.instances.set(workerId, prisma)

      return prisma
    } catch (error) {
      // If connection fails, ensure we don't cache a broken instance
      try {
        await prisma.$disconnect()
      } catch {
        // Ignore disconnect errors if connection never succeeded
      }
      throw error
    }
  }

  /**
   * Runs database migrations for a worker-specific database
   * Uses Prisma's db push functionality to sync schema to worker database
   */
  private static async migrateWorkerDatabase(
    prisma: PrismaClient,
  ): Promise<void> {
    try {
      // Configure SQLite for better concurrent access
      // WAL mode allows readers and writers to work concurrently
      await prisma.$queryRaw`PRAGMA journal_mode = WAL`

      // Increase busy timeout to 5 seconds to handle concurrent access
      await prisma.$queryRaw`PRAGMA busy_timeout = 5000`

      // Use NORMAL synchronous mode for better performance while maintaining safety
      await prisma.$queryRaw`PRAGMA synchronous = NORMAL`

      // Enable foreign keys
      await prisma.$queryRaw`PRAGMA foreign_keys = ON`

      // Use Prisma's internal schema sync mechanism
      // This is the equivalent of 'prisma db push' but programmatically
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Message" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "timestamp" DATETIME NOT NULL,
          "sender" TEXT NOT NULL,
          "senderId" TEXT,
          "message" TEXT,
          "hash" TEXT NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL
        )
      `

      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "Message_hash_key" ON "Message"("hash")`

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Link" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "url" TEXT NOT NULL,
          "messageId" INTEGER NOT NULL,
          CONSTRAINT "Link_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Asset" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "filename" TEXT NOT NULL,
          "messageId" INTEGER NOT NULL,
          "type" TEXT,
          CONSTRAINT "Asset_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `

      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Memory" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "sourceMessageIds" TEXT NOT NULL,
          "participants" TEXT NOT NULL,
          "summary" TEXT NOT NULL,
          "confidence" INTEGER NOT NULL,
          "contentHash" TEXT NOT NULL,
          "deduplicationMetadata" TEXT,
          "extractedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL,
          "clusteringMetadata" TEXT,
          "lastClusteredAt" DATETIME,
          "clusterParticipationCount" INTEGER NOT NULL DEFAULT 0
        )
      `

      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "Memory_contentHash_key" ON "Memory"("contentHash")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Memory_contentHash_idx" ON "Memory"("contentHash")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Memory_extractedAt_idx" ON "Memory"("extractedAt")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Memory_confidence_idx" ON "Memory"("confidence")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Memory_extractedAt_confidence_idx" ON "Memory"("extractedAt", "confidence")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Memory_createdAt_idx" ON "Memory"("createdAt")`
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Memory_lastClusteredAt_clusterParticipationCount_idx" ON "Memory"("lastClusteredAt", "clusterParticipationCount")`

      // Continue with other essential tables for testing
      await this.createMoodScoringTables(prisma)

      // Create clustering tables for tone-tagged memory clustering
      await this.createClusteringTables(prisma)
    } catch (error) {
      if (process.env.WALLABY_QUIET) {
        console.error(
          `DB migration failed for worker ${this.getWorkerId()}: ${simplifyError(error)}`,
        )
      } else {
        console.error(
          `CRITICAL: Worker database migration failed for worker ${this.getWorkerId()}:`,
          error,
        )
      }
      throw error // Re-throw to prevent using broken database
    }
  }

  /**
   * Creates the mood scoring related tables needed for tests
   */
  private static async createMoodScoringTables(
    prisma: PrismaClient,
  ): Promise<void> {
    // Create tables in dependency order

    // MoodScore table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "MoodScore" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "memoryId" TEXT NOT NULL,
        "score" REAL NOT NULL,
        "confidence" REAL NOT NULL,
        "descriptors" TEXT NOT NULL,
        "algorithmVersion" TEXT NOT NULL,
        "processingTimeMs" INTEGER NOT NULL,
        "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "MoodScore_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "MoodScore_memoryId_idx" ON "MoodScore"("memoryId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "MoodScore_calculatedAt_idx" ON "MoodScore"("calculatedAt")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "MoodScore_score_idx" ON "MoodScore"("score")`

    // MoodFactor table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "MoodFactor" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "moodScoreId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "weight" REAL NOT NULL,
        "description" TEXT NOT NULL,
        "evidence" TEXT NOT NULL,
        "internalScore" REAL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "MoodFactor_moodScoreId_fkey" FOREIGN KEY ("moodScoreId") REFERENCES "MoodScore" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "MoodFactor_moodScoreId_idx" ON "MoodFactor"("moodScoreId")`

    // MoodDelta table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "MoodDelta" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "memoryId" TEXT NOT NULL,
        "conversationId" TEXT,
        "deltaSequence" INTEGER,
        "magnitude" REAL NOT NULL,
        "direction" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "confidence" REAL NOT NULL,
        "factors" TEXT NOT NULL,
        "significance" REAL NOT NULL,
        "temporalContext" TEXT,
        "previousScore" REAL,
        "currentScore" REAL NOT NULL,
        "detectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "MoodDelta_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "MoodDelta_memoryId_idx" ON "MoodDelta"("memoryId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "MoodDelta_significance_idx" ON "MoodDelta"("significance")`

    // DeltaPattern table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "DeltaPattern" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "memoryId" TEXT NOT NULL,
        "patternType" TEXT NOT NULL,
        "significance" REAL NOT NULL,
        "confidence" REAL NOT NULL,
        "description" TEXT NOT NULL,
        "duration" INTEGER NOT NULL,
        "averageMagnitude" REAL NOT NULL,
        "metadata" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "DeltaPattern_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "DeltaPattern_memoryId_idx" ON "DeltaPattern"("memoryId")`

    // DeltaPatternAssociation table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "DeltaPatternAssociation" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "patternId" TEXT NOT NULL,
        "deltaId" TEXT NOT NULL,
        "sequenceOrder" INTEGER NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "DeltaPatternAssociation_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES "DeltaPattern" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "DeltaPatternAssociation_deltaId_fkey" FOREIGN KEY ("deltaId") REFERENCES "MoodDelta" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "DeltaPatternAssociation_patternId_deltaId_key" ON "DeltaPatternAssociation"("patternId", "deltaId")`

    // TurningPoint table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "TurningPoint" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "memoryId" TEXT NOT NULL,
        "deltaId" TEXT,
        "timestamp" DATETIME NOT NULL,
        "type" TEXT NOT NULL,
        "magnitude" REAL NOT NULL,
        "description" TEXT NOT NULL,
        "factors" TEXT NOT NULL,
        "significance" REAL NOT NULL,
        "temporalContext" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TurningPoint_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "TurningPoint_deltaId_fkey" FOREIGN KEY ("deltaId") REFERENCES "MoodDelta" ("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "TurningPoint_memoryId_idx" ON "TurningPoint"("memoryId")`

    // ValidationResult table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ValidationResult" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "memoryId" TEXT NOT NULL,
        "humanScore" REAL NOT NULL,
        "algorithmScore" REAL NOT NULL,
        "agreement" REAL NOT NULL,
        "discrepancy" REAL NOT NULL,
        "validatorId" TEXT NOT NULL,
        "validationMethod" TEXT NOT NULL,
        "feedback" TEXT,
        "biasIndicators" TEXT NOT NULL,
        "accuracyMetrics" TEXT NOT NULL,
        "validatedAt" DATETIME NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ValidationResult_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ValidationResult_memoryId_idx" ON "ValidationResult"("memoryId")`

    // CalibrationHistory table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "CalibrationHistory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "calibrationId" TEXT NOT NULL,
        "adjustmentType" TEXT NOT NULL,
        "targetComponent" TEXT NOT NULL,
        "previousValue" TEXT NOT NULL,
        "newValue" TEXT NOT NULL,
        "performanceMetrics" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "appliedAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `

    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "CalibrationHistory_calibrationId_key" ON "CalibrationHistory"("calibrationId")`

    // QualityMetrics table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "QualityMetrics" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "memoryId" TEXT NOT NULL,
        "overallQuality" REAL NOT NULL,
        "dimensionalQuality" TEXT NOT NULL,
        "confidenceAlignment" REAL NOT NULL,
        "validationConsistency" REAL NOT NULL,
        "evidenceSupport" REAL NOT NULL,
        "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "calculationMethod" TEXT NOT NULL,
        CONSTRAINT "QualityMetrics_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "QualityMetrics_memoryId_idx" ON "QualityMetrics"("memoryId")`

    // EmotionalContext table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "EmotionalContext" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "memoryId" TEXT NOT NULL,
        "primaryMood" TEXT NOT NULL,
        "intensity" INTEGER NOT NULL,
        "themes" TEXT NOT NULL,
        "emotionalMarkers" TEXT NOT NULL,
        "contextualEvents" TEXT NOT NULL,
        "temporalPatterns" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "EmotionalContext_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "EmotionalContext_memoryId_key" ON "EmotionalContext"("memoryId")`

    // RelationshipDynamics table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "RelationshipDynamics" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "memoryId" TEXT NOT NULL,
        "overallDynamics" TEXT NOT NULL,
        "participantDynamics" TEXT NOT NULL,
        "communicationPatterns" TEXT NOT NULL,
        "interactionQuality" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "RelationshipDynamics_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "RelationshipDynamics_memoryId_key" ON "RelationshipDynamics"("memoryId")`

    // ValidationStatus table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ValidationStatus" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "memoryId" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "validator" TEXT,
        "validatedAt" DATETIME,
        "validationRound" INTEGER NOT NULL DEFAULT 1,
        "requiresRefinement" INTEGER NOT NULL DEFAULT 0,
        "refinementSuggestions" TEXT NOT NULL,
        "approvalHistory" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "ValidationStatus_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "ValidationStatus_memoryId_key" ON "ValidationStatus"("memoryId")`

    // AnalysisMetadata table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "AnalysisMetadata" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "memoryId" TEXT NOT NULL,
        "processingDuration" INTEGER NOT NULL,
        "confidence" REAL NOT NULL,
        "qualityMetrics" TEXT NOT NULL,
        "issues" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AnalysisMetadata_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "AnalysisMetadata_memoryId_key" ON "AnalysisMetadata"("memoryId")`
  }

  /**
   * Creates the clustering tables needed for tone-tagged memory clustering tests
   */
  private static async createClusteringTables(
    prisma: PrismaClient,
  ): Promise<void> {
    // MemoryCluster table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "MemoryCluster" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "clusterId" TEXT NOT NULL UNIQUE,
        "clusterTheme" TEXT NOT NULL,
        "emotionalTone" TEXT NOT NULL,
        "coherenceScore" REAL NOT NULL,
        "psychologicalSignificance" REAL NOT NULL,
        "participantPatterns" TEXT NOT NULL,
        "clusterMetadata" TEXT NOT NULL,
        "memoryCount" INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        "lastAnalyzedAt" DATETIME
      )
    `

    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "MemoryCluster_clusterId_key" ON "MemoryCluster"("clusterId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "MemoryCluster_coherenceScore_createdAt_idx" ON "MemoryCluster"("coherenceScore", "createdAt")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "MemoryCluster_psychologicalSignificance_memoryCount_idx" ON "MemoryCluster"("psychologicalSignificance", "memoryCount")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "MemoryCluster_clusterTheme_emotionalTone_idx" ON "MemoryCluster"("clusterTheme", "emotionalTone")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "MemoryCluster_updatedAt_lastAnalyzedAt_idx" ON "MemoryCluster"("updatedAt", "lastAnalyzedAt")`

    // ClusterMembership table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ClusterMembership" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "clusterId" TEXT NOT NULL,
        "memoryId" TEXT NOT NULL,
        "membershipStrength" REAL NOT NULL,
        "contributionScore" REAL NOT NULL,
        "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ClusterMembership_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "MemoryCluster" ("clusterId") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "ClusterMembership_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "ClusterMembership_clusterId_memoryId_key" ON "ClusterMembership"("clusterId", "memoryId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ClusterMembership_clusterId_membershipStrength_idx" ON "ClusterMembership"("clusterId", "membershipStrength")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ClusterMembership_memoryId_contributionScore_idx" ON "ClusterMembership"("memoryId", "contributionScore")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ClusterMembership_membershipStrength_addedAt_idx" ON "ClusterMembership"("membershipStrength", "addedAt")`

    // PatternAnalysis table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "PatternAnalysis" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "patternId" TEXT NOT NULL UNIQUE,
        "clusterId" TEXT NOT NULL,
        "patternType" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "frequency" INTEGER NOT NULL,
        "strength" REAL NOT NULL,
        "confidenceLevel" REAL NOT NULL,
        "psychologicalIndicators" TEXT NOT NULL,
        "emotionalCharacteristics" TEXT NOT NULL,
        "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PatternAnalysis_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "MemoryCluster" ("clusterId") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "PatternAnalysis_patternId_key" ON "PatternAnalysis"("patternId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "PatternAnalysis_patternType_confidenceLevel_idx" ON "PatternAnalysis"("patternType", "confidenceLevel")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "PatternAnalysis_clusterId_strength_idx" ON "PatternAnalysis"("clusterId", "strength")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "PatternAnalysis_confidenceLevel_frequency_idx" ON "PatternAnalysis"("confidenceLevel", "frequency")`

    // ClusterQualityMetrics table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "ClusterQualityMetrics" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "clusterId" TEXT NOT NULL UNIQUE,
        "overallCoherence" REAL NOT NULL,
        "emotionalConsistency" REAL NOT NULL,
        "thematicUnity" REAL NOT NULL,
        "psychologicalMeaningfulness" REAL NOT NULL,
        "incoherentMemoryCount" INTEGER NOT NULL DEFAULT 0,
        "strengthAreas" TEXT NOT NULL,
        "improvementAreas" TEXT NOT NULL,
        "confidenceLevel" REAL NOT NULL,
        "assessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ClusterQualityMetrics_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "MemoryCluster" ("clusterId") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `

    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "ClusterQualityMetrics_clusterId_key" ON "ClusterQualityMetrics"("clusterId")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ClusterQualityMetrics_overallCoherence_assessedAt_idx" ON "ClusterQualityMetrics"("overallCoherence", "assessedAt")`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ClusterQualityMetrics_psychologicalMeaningfulness_confidenceLevel_idx" ON "ClusterQualityMetrics"("psychologicalMeaningfulness", "confidenceLevel")`
  }

  /**
   * Cleans up all worker databases and disconnects clients
   * Should be called in global test teardown
   */
  static async cleanup(): Promise<void> {
    const workerId = this.getWorkerId()

    // Clean up main worker instance
    if (this.instances.has(workerId)) {
      const prisma = this.instances.get(workerId)!

      try {
        // Ensure all pending transactions are completed
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Disconnect the client
        await prisma.$disconnect()
      } catch (error) {
        if (!process.env.WALLABY_QUIET) {
          console.warn(
            `Error disconnecting worker ${workerId} database:`,
            error,
          )
        }
      }

      this.instances.delete(workerId)
    }

    // Clean up Wallaby instance if exists
    const wallabyKey = `wallaby-${workerId}`
    if (this.instances.has(wallabyKey)) {
      const prisma = this.instances.get(wallabyKey)!

      try {
        await prisma.$disconnect()
      } catch (error) {
        if (!process.env.WALLABY_QUIET) {
          console.warn(
            `Error disconnecting Wallaby worker ${workerId} database:`,
            error,
          )
        }
      }

      this.instances.delete(wallabyKey)
    }

    // Clean up the worker's database file
    this.cleanupWorkerDatabaseFile(workerId)
  }

  /**
   * Cleans up database file for a specific worker
   */
  private static cleanupWorkerDatabaseFile(workerId: string): void {
    try {
      const tmpDir = process.env.TMPDIR || '/tmp'
      const dbPath = resolve(tmpDir, `mnemosyne-test-worker-${workerId}.db`)
      const journalPath = `${dbPath}-journal`
      const shmPath = `${dbPath}-shm`
      const walPath = `${dbPath}-wal`

      // Remove SQLite auxiliary files first (gracefully handle missing files)
      const filesToRemove = [journalPath, shmPath, walPath, dbPath]

      for (const filePath of filesToRemove) {
        try {
          if (existsSync(filePath)) {
            unlinkSync(filePath)
          }
        } catch (fileError) {
          // Gracefully handle file removal errors (file might be locked or already removed)
          if (process.env.TEST_VERBOSE && !process.env.WALLABY_QUIET) {
            console.warn(`Could not remove ${filePath}:`, fileError)
          }
        }
      }
    } catch (error) {
      if (!process.env.WALLABY_QUIET) {
        console.warn(
          `Error cleaning up database files for worker ${workerId}:`,
          error,
        )
      }
    }
  }

  /**
   * Cleans up all test worker database files in the system temp directory
   * Useful for bulk cleanup during development
   */
  static cleanupAllWorkerDatabases(): void {
    try {
      const tmpDir = process.env.TMPDIR || '/tmp'

      // Check if temp directory exists
      if (!existsSync(tmpDir)) {
        return // No files to clean if directory doesn't exist
      }

      const files = readdirSync(tmpDir)

      const testDbFiles = files.filter(
        (file) =>
          file.startsWith('mnemosyne-test-worker-') &&
          (file.endsWith('.db') ||
            file.endsWith('.db-journal') ||
            file.endsWith('.db-shm') ||
            file.endsWith('.db-wal')),
      )

      for (const file of testDbFiles) {
        const filePath = resolve(tmpDir, file)
        if (existsSync(filePath)) {
          unlinkSync(filePath)
        }
      }

      if (testDbFiles.length > 0 && !process.env.WALLABY_QUIET) {
        console.log(`Cleaned up ${testDbFiles.length} test database files`)
      }
    } catch (error) {
      if (!process.env.WALLABY_QUIET) {
        console.warn('Error during bulk database cleanup:', error)
      }
    }
  }

  /**
   * Cleans up data in the current worker's database
   * Preserves the schema but removes all data for test isolation
   */
  static async cleanWorkerData(prisma: PrismaClient): Promise<void> {
    try {
      // Clean up all tables in dependency order (children first, then parents)
      // This order respects foreign key constraints
      // Use raw SQL to handle missing tables gracefully

      // Level 4: Most dependent tables
      await this.safeDeleteFromTable(prisma, 'DeltaPatternAssociation')
      await this.safeDeleteFromTable(prisma, 'MoodFactor')
      await this.safeDeleteFromTable(prisma, 'ClusterMembership')
      await this.safeDeleteFromTable(prisma, 'PatternAnalysis')
      await this.safeDeleteFromTable(prisma, 'ClusterQualityMetrics')

      // Level 3: Tables with foreign keys to Level 2
      await this.safeDeleteFromTable(prisma, 'DeltaPattern')
      await this.safeDeleteFromTable(prisma, 'TurningPoint')
      await this.safeDeleteFromTable(prisma, 'MoodDelta')
      await this.safeDeleteFromTable(prisma, 'ValidationResult')
      await this.safeDeleteFromTable(prisma, 'MoodScore')
      await this.safeDeleteFromTable(prisma, 'QualityMetrics')
      await this.safeDeleteFromTable(prisma, 'AnalysisMetadata')

      // Level 2: Tables with foreign keys to Memory
      await this.safeDeleteFromTable(prisma, 'EmotionalContext')
      await this.safeDeleteFromTable(prisma, 'RelationshipDynamics')
      await this.safeDeleteFromTable(prisma, 'ValidationStatus')

      // Level 1: Independent tables and Memory (parent table)
      await this.safeDeleteFromTable(prisma, 'Memory')
      await this.safeDeleteFromTable(prisma, 'CalibrationHistory')
      await this.safeDeleteFromTable(prisma, 'MemoryCluster')

      // Level 0: Base tables
      await this.safeDeleteFromTable(prisma, 'Asset')
      await this.safeDeleteFromTable(prisma, 'Link')
      await this.safeDeleteFromTable(prisma, 'Message')
    } catch (error) {
      if (!process.env.WALLABY_QUIET) {
        console.warn(`Error cleaning worker data:`, error)
      }
      // Continue execution - tests can handle partial cleanup
    }
  }

  /**
   * Safely deletes all data from a table, handling missing tables gracefully
   */
  private static async safeDeleteFromTable(
    prisma: PrismaClient,
    tableName: string,
  ): Promise<void> {
    try {
      // Use Prisma.$executeRawUnsafe for dynamic table names
      await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}"`)
    } catch (error: unknown) {
      // Ignore "table does not exist" errors, but log others
      const prismaError = error as { code?: string; message?: string }
      if (
        prismaError?.code !== 'P2021' &&
        !prismaError?.message?.includes('does not exist')
      ) {
        if (!process.env.WALLABY_QUIET) {
          console.warn(`Error deleting from table ${tableName}:`, error)
        }
      }
    }
  }

  /**
   * Gets the database file path for the current worker
   * Useful for debugging and cleanup
   */
  static getWorkerDatabasePath(): string {
    const workerId = this.getWorkerId()
    const tmpDir = process.env.TMPDIR || '/tmp'
    return resolve(tmpDir, `mnemosyne-test-worker-${workerId}.db`)
  }

  /**
   * Ensures database directory exists and database is properly initialized
   * Helps prevent Wallaby.js startup issues with missing auxiliary files
   */
  static async ensureDatabaseReady(): Promise<void> {
    const workerId = this.getWorkerId()
    const tmpDir = process.env.TMPDIR || '/tmp'
    const dbPath = resolve(tmpDir, `mnemosyne-test-worker-${workerId}.db`)

    try {
      // Check if database exists and is accessible
      if (existsSync(dbPath)) {
        // Database exists, verify it's not corrupted by attempting a simple connection
        const testClient = new PrismaClient({
          datasources: { db: { url: `file:${dbPath}` } },
          log: process.env.WALLABY_QUIET ? [] : ['error'],
        })

        try {
          await testClient.$connect()
          // Touch any missing auxiliary files to prevent Wallaby.js errors
          await this.ensureAuxiliaryFiles(dbPath)
          await testClient.$disconnect()
        } catch (error) {
          // Database may be corrupted, remove it
          if (process.env.TEST_VERBOSE && !process.env.WALLABY_QUIET) {
            console.warn(
              `Removing corrupted database for worker ${workerId}:`,
              error,
            )
          }
          this.cleanupWorkerDatabaseFile(workerId)
        }
      }
    } catch (error) {
      if (process.env.TEST_VERBOSE && !process.env.WALLABY_QUIET) {
        console.warn(
          `Database ready check warning for worker ${workerId}:`,
          error,
        )
      }
    }
  }

  /**
   * Ensures SQLite auxiliary files exist to prevent Wallaby.js access errors
   */
  private static async ensureAuxiliaryFiles(dbPath: string): Promise<void> {
    try {
      const { writeFileSync, existsSync } = await import('fs')
      const walPath = `${dbPath}-wal`
      const shmPath = `${dbPath}-shm`

      // Create empty auxiliary files if they don't exist
      // This prevents Wallaby.js from throwing ENOENT errors
      if (!existsSync(walPath)) {
        writeFileSync(walPath, '')
      }
      if (!existsSync(shmPath)) {
        writeFileSync(shmPath, '')
      }
    } catch (error) {
      // Silently fail - these files will be created by SQLite when needed
      if (process.env.TEST_VERBOSE && !process.env.WALLABY_QUIET) {
        console.warn(`Could not create auxiliary files:`, error)
      }
    }
  }
}
