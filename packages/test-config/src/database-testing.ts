import { PrismaClient } from '@studio/db'
import {
  type DatabaseMemoryInput,
  type DatabaseEmotionalContextInput,
  type DatabaseRelationshipDynamicsInput,
  createMemoryDatabase,
  validateMemoryForDatabase,
  validateEmotionalContextForDatabase,
  validateRelationshipDynamicsForDatabase,
} from '@studio/db'
import { execSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

/**
 * Configuration for test database creation
 */
export interface TestDatabaseConfig {
  /** Whether to use in-memory SQLite (faster) or temp file (more realistic) */
  mode: 'memory' | 'file'
  /** Whether to enable Prisma query logging during tests */
  enableLogging?: boolean
}

/**
 * Represents a test database instance with cleanup capabilities
 */
export interface TestDatabase {
  /** Prisma client connected to the test database */
  client: PrismaClient
  /** Database connection URL */
  url: string
  /** Clean up the database and disconnect */
  cleanup: () => Promise<void>
}

/**
 * Creates an isolated test database for integration testing.
 *
 * Uses SQLite in-memory by default for speed, or temporary file for more realistic testing.
 * Automatically runs migrations to set up the schema.
 *
 * @param config - Configuration options for the test database
 * @returns TestDatabase instance with client and cleanup function
 *
 * @example
 * ```typescript
 * let testDb: TestDatabase
 *
 * beforeEach(async () => {
 *   testDb = await createTestDatabase()
 * })
 *
 * afterEach(async () => {
 *   await testDb.cleanup()
 * })
 *
 * test('should create message', async () => {
 *   const message = await testDb.client.message.create({
 *     data: { ... }
 *   })
 *   expect(message.id).toBeDefined()
 * })
 * ```
 */
export async function createTestDatabase(
  config: TestDatabaseConfig = { mode: 'memory' },
): Promise<TestDatabase> {
  // Create unique temporary file in system temp directory
  // This avoids cluttering the project prisma folder
  const tempDir = mkdtempSync(join(tmpdir(), 'prisma-test-'))
  const dbFile = join(tempDir, `test-${randomBytes(8).toString('hex')}.db`)
  const url = `file:${dbFile}`

  // Create Prisma client with test database
  const client = new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
    log: config.enableLogging ? ['query', 'info', 'warn', 'error'] : [],
  })

  try {
    // Connect first
    await client.$connect()

    // Push the schema to the test database
    await pushSchema(url)

    // Verify schema was created by checking if tables exist
    try {
      await client.$queryRaw`SELECT name FROM sqlite_master WHERE type='table' AND name='Message'`
    } catch (error) {
      throw new Error(
        `Schema verification failed: ${error instanceof Error ? error.message : String(error)}`,
      )
    }

    return {
      client,
      url,
      cleanup: async () => {
        await client.$disconnect()
        if (tempDir) {
          rmSync(tempDir, { recursive: true, force: true })
        }
      },
    }
  } catch (error) {
    // Clean up on failure
    await client.$disconnect()
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true })
    }
    throw error
  }
}

/**
 * Resets a test database by deleting all data while preserving schema.
 * Deletes data in dependency order to handle foreign key constraints.
 *
 * @param client - Prisma client connected to the test database
 *
 * @example
 * ```typescript
 * beforeEach(async () => {
 *   await resetTestDatabase(testDb.client)
 * })
 * ```
 */
export async function resetTestDatabase(client: PrismaClient): Promise<void> {
  // Delete in dependency order to handle foreign key constraints
  // Memory-related tables must be deleted before Messages due to foreign keys

  // Delete memory-related data first (in reverse dependency order)
  await client.qualityMetrics.deleteMany()
  await client.validationStatus.deleteMany()
  await client.relationshipDynamics.deleteMany()
  await client.emotionalContext.deleteMany()
  await client.memory.deleteMany()

  // Delete original tables (Assets and Links depend on Messages)
  await client.asset.deleteMany()
  await client.link.deleteMany()
  await client.message.deleteMany()
}

/**
 * Seeds a test database with common test data.
 * Useful for tests that need existing data to work with.
 *
 * @param client - Prisma client connected to the test database
 * @returns Object containing created test data
 *
 * @example
 * ```typescript
 * beforeEach(async () => {
 *   await resetTestDatabase(testDb.client)
 *   await seedTestDatabase(testDb.client)
 * })
 * ```
 */
export async function seedTestDatabase(client: PrismaClient) {
  const message1 = await client.message.create({
    data: {
      timestamp: new Date('2025-01-01T10:00:00Z'),
      sender: 'Alice',
      senderId: '+1234567890',
      message: 'Hello world! Check out https://example.com',
      hash: 'test-hash-1',
      links: {
        create: [{ url: 'https://example.com' }],
      },
      assets: {
        create: [{ filename: 'image.jpg' }],
      },
    },
  })

  const message2 = await client.message.create({
    data: {
      timestamp: new Date('2025-01-01T11:00:00Z'),
      sender: 'Bob',
      senderId: '+0987654321',
      message: 'Second test message',
      hash: 'test-hash-2',
    },
  })

  // Create example memory with emotional context
  const memory1 = await client.memory.create({
    data: {
      id: 'test-memory-1',
      sourceMessageIds: JSON.stringify([message1.id, message2.id]),
      participants: JSON.stringify([
        { id: 'alice', name: 'Alice', role: 'self' },
        { id: 'bob', name: 'Bob', role: 'friend' },
      ]),
      summary: 'Friendly conversation with link sharing',
      confidence: 8,
      contentHash: 'test-content-hash-1',
      messages: {
        connect: [{ id: message1.id }, { id: message2.id }],
      },
      emotionalContext: {
        create: {
          id: 'test-emotion-1',
          primaryMood: 'positive',
          intensity: 7,
          themes: JSON.stringify(['connection', 'sharing']),
          emotionalMarkers: JSON.stringify([
            'friendly greeting',
            'helpful sharing',
          ]),
          contextualEvents: JSON.stringify(['link shared']),
          temporalPatterns: JSON.stringify({
            isBuilding: true,
            isResolving: false,
          }),
        },
      },
      relationshipDynamics: {
        create: {
          id: 'test-dynamics-1',
          overallDynamics: JSON.stringify({ connectionStrength: 0.8 }),
          participantDynamics: JSON.stringify([]),
          communicationPatterns: JSON.stringify(['supportive', 'open']),
          interactionQuality: JSON.stringify({
            quality: 'positive',
            indicators: ['sharing'],
          }),
        },
      },
      validationStatus: {
        create: {
          id: 'test-validation-1',
          status: 'approved',
          validator: 'test-system',
          validatedAt: new Date('2025-01-01T12:00:00Z'),
          refinementSuggestions: JSON.stringify([]),
          approvalHistory: JSON.stringify([
            { status: 'approved', timestamp: '2025-01-01T12:00:00Z' },
          ]),
        },
      },
    },
  })

  return {
    message1,
    message2,
    memory1,
  }
}

/**
 * Pushes the Prisma schema to a database URL.
 * Used internally by createTestDatabase to set up the schema.
 */
/**
 * Gets the SQL schema statements that exactly match the current Prisma migrations.
 *
 * IMPORTANT: This schema is derived from the actual migration files:
 * - packages/db/prisma/migrations/20250704085329_init/migration.sql
 * - packages/db/prisma/migrations/20250707003405_add_asset_type_field/migration.sql
 * - packages/db/prisma/migrations/20250720080225_add_memory_schema/migration.sql
 *
 * When Prisma migrations are added, this function MUST be updated to match.
 */
function getPrismaGeneratedSchemaStatements(): string[] {
  return [
    // CreateTable (from 20250704085329_init)
    `CREATE TABLE "Message" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "timestamp" DATETIME NOT NULL,
        "sender" TEXT NOT NULL,
        "senderId" TEXT,
        "message" TEXT,
        "hash" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
    )`,

    // CreateTable (from 20250704085329_init)
    `CREATE TABLE "Link" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "url" TEXT NOT NULL,
        "messageId" INTEGER NOT NULL,
        CONSTRAINT "Link_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )`,

    // CreateTable (from 20250704085329_init + 20250707003405_add_asset_type_field combined)
    `CREATE TABLE "Asset" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "filename" TEXT NOT NULL,
        "messageId" INTEGER NOT NULL,
        "type" TEXT,
        CONSTRAINT "Asset_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )`,

    // CreateIndex (from 20250704085329_init)
    `CREATE UNIQUE INDEX "Message_hash_key" ON "Message"("hash")`,

    // Custom trigger to mimic Prisma's @updatedAt behavior
    `CREATE TRIGGER "Message_updatedAt_trigger" 
    AFTER UPDATE ON "Message"
    FOR EACH ROW
    BEGIN
      UPDATE "Message" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
    END`,

    // Memory schema tables (from 20250720080225_add_memory_schema + 20250720111836_add_memory_deduplication + clustering fields)
    `CREATE TABLE "Memory" (
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
    )`,

    `CREATE TABLE "EmotionalContext" (
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
    )`,

    `CREATE TABLE "RelationshipDynamics" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "memoryId" TEXT NOT NULL,
        "overallDynamics" TEXT NOT NULL,
        "participantDynamics" TEXT NOT NULL,
        "communicationPatterns" TEXT NOT NULL,
        "interactionQuality" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "RelationshipDynamics_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    `CREATE TABLE "ValidationStatus" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "memoryId" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "validator" TEXT,
        "validatedAt" DATETIME,
        "validationRound" INTEGER NOT NULL DEFAULT 1,
        "requiresRefinement" BOOLEAN NOT NULL DEFAULT false,
        "refinementSuggestions" TEXT NOT NULL,
        "approvalHistory" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "ValidationStatus_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    `CREATE TABLE "QualityMetrics" (
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
    )`,

    `CREATE TABLE "_MemoryMessages" (
        "A" TEXT NOT NULL,
        "B" INTEGER NOT NULL,
        CONSTRAINT "_MemoryMessages_A_fkey" FOREIGN KEY ("A") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "_MemoryMessages_B_fkey" FOREIGN KEY ("B") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // Mood scoring tables
    `CREATE TABLE "MoodScore" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "memoryId" TEXT NOT NULL,
        "overallScore" REAL NOT NULL,
        "emotionalDepth" REAL NOT NULL,
        "energyLevel" REAL NOT NULL,
        "socialConnection" REAL NOT NULL,
        "confidence" REAL NOT NULL,
        "emotionalMarkers" TEXT NOT NULL,
        "conversationDynamics" TEXT NOT NULL,
        "scoredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "MoodScore_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    `CREATE TABLE "MoodDelta" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "memoryId" TEXT NOT NULL,
        "previousMemoryId" TEXT NOT NULL,
        "deltaValue" REAL NOT NULL,
        "direction" TEXT NOT NULL,
        "magnitude" TEXT NOT NULL,
        "emotionalShifts" TEXT NOT NULL,
        "contributingFactors" TEXT NOT NULL,
        "temporalDistance" INTEGER NOT NULL,
        "confidenceLevel" REAL NOT NULL,
        "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "MoodDelta_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    `CREATE TABLE "DeltaPattern" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "memoryId" TEXT NOT NULL,
        "patternType" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "strength" REAL NOT NULL,
        "confidence" REAL NOT NULL,
        "temporalContext" TEXT NOT NULL,
        "relatedDeltas" TEXT NOT NULL,
        "identifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "DeltaPattern_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    `CREATE TABLE "TurningPoint" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "memoryId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "significance" REAL NOT NULL,
        "emotionalShift" TEXT NOT NULL,
        "contextualFactors" TEXT NOT NULL,
        "temporalMarkers" TEXT NOT NULL,
        "impactAnalysis" TEXT NOT NULL,
        "confidence" REAL NOT NULL,
        "identifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "TurningPoint_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    `CREATE TABLE "ValidationResult" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "memoryId" TEXT NOT NULL,
        "moodScoreId" TEXT,
        "deltaId" TEXT,
        "patternId" TEXT,
        "turningPointId" TEXT,
        "validationType" TEXT NOT NULL,
        "isValid" BOOLEAN NOT NULL,
        "confidence" REAL NOT NULL,
        "issues" TEXT NOT NULL,
        "suggestions" TEXT NOT NULL,
        "contextualEvidence" TEXT NOT NULL,
        "validatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "ValidationResult_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    `CREATE TABLE "AnalysisMetadata" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "memoryId" TEXT NOT NULL,
        "analysisVersion" TEXT NOT NULL,
        "processingTime" INTEGER NOT NULL,
        "dataCompleteness" REAL NOT NULL,
        "qualityIndicators" TEXT NOT NULL,
        "processingNotes" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "AnalysisMetadata_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // Clustering tables
    `CREATE TABLE "MemoryCluster" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "clusterId" TEXT NOT NULL,
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
    )`,

    `CREATE TABLE "ClusterMembership" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "clusterId" TEXT NOT NULL,
        "memoryId" TEXT NOT NULL,
        "membershipStrength" REAL NOT NULL,
        "contributionScore" REAL NOT NULL,
        "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastReviewedAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "ClusterMembership_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "MemoryCluster" ("clusterId") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "ClusterMembership_memoryId_fkey" FOREIGN KEY ("memoryId") REFERENCES "Memory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    `CREATE TABLE "PatternAnalysis" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "patternId" TEXT NOT NULL,
        "clusterId" TEXT NOT NULL,
        "patternType" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "frequency" INTEGER NOT NULL,
        "strength" REAL NOT NULL,
        "confidenceLevel" REAL NOT NULL,
        "psychologicalIndicators" TEXT NOT NULL,
        "emotionalCharacteristics" TEXT NOT NULL,
        "identifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastUpdatedAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "PatternAnalysis_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "MemoryCluster" ("clusterId") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    `CREATE TABLE "ClusterQualityMetrics" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "clusterId" TEXT NOT NULL,
        "overallCoherence" REAL NOT NULL,
        "emotionalConsistency" REAL NOT NULL,
        "thematicUnity" REAL NOT NULL,
        "psychologicalMeaningfulness" REAL NOT NULL,
        "incoherentMemoryCount" INTEGER NOT NULL,
        "strengthAreas" TEXT NOT NULL,
        "improvementAreas" TEXT NOT NULL,
        "confidenceLevel" REAL NOT NULL,
        "evaluatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        CONSTRAINT "ClusterQualityMetrics_clusterId_fkey" FOREIGN KEY ("clusterId") REFERENCES "MemoryCluster" ("clusterId") ON DELETE CASCADE ON UPDATE CASCADE
    )`,

    // Memory schema indexes (from 20250720080225_add_memory_schema + 20250720111836_add_memory_deduplication)
    `CREATE UNIQUE INDEX "Memory_contentHash_key" ON "Memory"("contentHash")`,
    `CREATE INDEX "Memory_contentHash_idx" ON "Memory"("contentHash")`,
    `CREATE UNIQUE INDEX "EmotionalContext_memoryId_key" ON "EmotionalContext"("memoryId")`,
    `CREATE UNIQUE INDEX "RelationshipDynamics_memoryId_key" ON "RelationshipDynamics"("memoryId")`,
    `CREATE UNIQUE INDEX "ValidationStatus_memoryId_key" ON "ValidationStatus"("memoryId")`,
    `CREATE INDEX "QualityMetrics_memoryId_idx" ON "QualityMetrics"("memoryId")`,
    `CREATE UNIQUE INDEX "_MemoryMessages_AB_unique" ON "_MemoryMessages"("A", "B")`,
    `CREATE INDEX "_MemoryMessages_B_index" ON "_MemoryMessages"("B")`,

    // Mood scoring indexes
    `CREATE UNIQUE INDEX "MoodScore_memoryId_key" ON "MoodScore"("memoryId")`,
    `CREATE INDEX "MoodDelta_memoryId_idx" ON "MoodDelta"("memoryId")`,
    `CREATE INDEX "DeltaPattern_memoryId_idx" ON "DeltaPattern"("memoryId")`,
    `CREATE INDEX "TurningPoint_memoryId_idx" ON "TurningPoint"("memoryId")`,
    `CREATE INDEX "ValidationResult_memoryId_idx" ON "ValidationResult"("memoryId")`,
    `CREATE UNIQUE INDEX "AnalysisMetadata_memoryId_key" ON "AnalysisMetadata"("memoryId")`,

    // Clustering indexes
    `CREATE UNIQUE INDEX "MemoryCluster_clusterId_key" ON "MemoryCluster"("clusterId")`,
    `CREATE INDEX "MemoryCluster_coherenceScore_createdAt_idx" ON "MemoryCluster"("coherenceScore", "createdAt")`,
    `CREATE INDEX "MemoryCluster_psychologicalSignificance_memoryCount_idx" ON "MemoryCluster"("psychologicalSignificance", "memoryCount")`,
    `CREATE INDEX "MemoryCluster_clusterTheme_emotionalTone_idx" ON "MemoryCluster"("clusterTheme", "emotionalTone")`,
    `CREATE INDEX "MemoryCluster_updatedAt_lastAnalyzedAt_idx" ON "MemoryCluster"("updatedAt", "lastAnalyzedAt")`,
    `CREATE UNIQUE INDEX "ClusterMembership_clusterId_memoryId_key" ON "ClusterMembership"("clusterId", "memoryId")`,
    `CREATE INDEX "ClusterMembership_memoryId_idx" ON "ClusterMembership"("memoryId")`,
    `CREATE INDEX "ClusterMembership_membershipStrength_idx" ON "ClusterMembership"("membershipStrength")`,
    `CREATE UNIQUE INDEX "PatternAnalysis_patternId_key" ON "PatternAnalysis"("patternId")`,
    `CREATE INDEX "PatternAnalysis_patternType_confidenceLevel_idx" ON "PatternAnalysis"("patternType", "confidenceLevel")`,
    `CREATE INDEX "PatternAnalysis_clusterId_idx" ON "PatternAnalysis"("clusterId")`,
    `CREATE UNIQUE INDEX "ClusterQualityMetrics_clusterId_key" ON "ClusterQualityMetrics"("clusterId")`,
  ]
}

async function pushSchema(databaseUrl: string): Promise<void> {
  try {
    // For test databases, use direct SQL execution for speed
    if (
      databaseUrl.includes('/tmp/') ||
      databaseUrl.includes('temp') ||
      databaseUrl.includes('test-')
    ) {
      const tempClient = new PrismaClient({
        datasources: { db: { url: databaseUrl } },
      })

      try {
        // Execute each schema statement separately (SQLite can only handle one statement per call)
        const statements = getPrismaGeneratedSchemaStatements()

        for (const statement of statements) {
          await tempClient.$executeRawUnsafe(statement)
        }

        await tempClient.$disconnect()
      } catch (error) {
        await tempClient.$disconnect()
        throw error
      }
    } else {
      // For file databases, use Prisma CLI to ensure perfect alignment
      // Find the schema file by walking up from current directory
      let currentDir = process.cwd()
      let schemaPath: string | undefined

      for (let i = 0; i < 10; i++) {
        const candidatePath = resolve(
          currentDir,
          'packages/db/prisma/schema.prisma',
        )
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require('fs').accessSync(candidatePath)
          schemaPath = candidatePath
          break
        } catch {
          const parentDir = resolve(currentDir, '..')
          if (parentDir === currentDir) break
          currentDir = parentDir
        }
      }

      if (!schemaPath) {
        throw new Error(
          'Could not find schema.prisma file in any parent directory',
        )
      }

      const env = { ...process.env, DATABASE_URL: databaseUrl }
      execSync(
        `npx prisma db push --force-reset --accept-data-loss --schema="${schemaPath}"`,
        {
          cwd: process.cwd(),
          env,
          stdio: 'pipe',
        },
      )
    }
  } catch (error) {
    throw new Error(
      `Failed to push schema to test database: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

/**
 * Schema-validated test data creation utilities
 */

/**
 * Create a valid test memory input with schema validation
 */
export function createTestMemoryInput(
  overrides?: Partial<DatabaseMemoryInput>,
): DatabaseMemoryInput {
  const defaultData: DatabaseMemoryInput = {
    id: `test-memory-${randomBytes(4).toString('hex')}`,
    sourceMessageIds: ['msg-1', 'msg-2'],
    participants: [
      { id: 'alice', name: 'Alice', role: 'self' },
      { id: 'bob', name: 'Bob', role: 'friend' },
    ],
    summary: 'Test memory for validation',
    confidence: 8,
    contentHash: `test-hash-${randomBytes(4).toString('hex')}`,
    extractedAt: new Date(),
  }

  const data = { ...defaultData, ...overrides }

  // Validate the data before returning
  const validation = validateMemoryForDatabase(data)
  if (!validation.isValid) {
    throw new Error(
      `Test memory data is invalid: ${validation.errors.map((e) => e.message).join(', ')}`,
    )
  }

  return data
}

/**
 * Create a valid test emotional context input with schema validation
 */
export function createTestEmotionalContextInput(
  overrides?: Partial<DatabaseEmotionalContextInput>,
): DatabaseEmotionalContextInput {
  const defaultData: DatabaseEmotionalContextInput = {
    id: `test-emotion-${randomBytes(4).toString('hex')}`,
    primaryMood: 'positive',
    intensity: 7,
    themes: ['connection', 'sharing'],
    emotionalMarkers: ['friendly greeting', 'helpful sharing'],
    contextualEvents: ['link shared'],
    temporalPatterns: {
      isBuilding: true,
      isResolving: false,
    },
  }

  const data = { ...defaultData, ...overrides }

  // Validate the data before returning
  const validation = validateEmotionalContextForDatabase(data)
  if (!validation.isValid) {
    throw new Error(
      `Test emotional context data is invalid: ${validation.errors.map((e) => e.message).join(', ')}`,
    )
  }

  return data
}

/**
 * Create a valid test relationship dynamics input with schema validation
 */
export function createTestRelationshipDynamicsInput(
  overrides?: Partial<DatabaseRelationshipDynamicsInput>,
): DatabaseRelationshipDynamicsInput {
  const defaultData: DatabaseRelationshipDynamicsInput = {
    id: `test-dynamics-${randomBytes(4).toString('hex')}`,
    overallDynamics: { connectionStrength: 0.8 },
    participantDynamics: [],
    communicationPatterns: ['supportive', 'open'],
    interactionQuality: {
      quality: 'positive',
      indicators: ['sharing'],
    },
  }

  const data = { ...defaultData, ...overrides }

  // Validate the data before returning
  const validation = validateRelationshipDynamicsForDatabase(data)
  if (!validation.isValid) {
    throw new Error(
      `Test relationship dynamics data is invalid: ${validation.errors.map((e) => e.message).join(', ')}`,
    )
  }

  return data
}

/**
 * Create a memory database instance for testing with validation
 */
export function createTestMemoryDatabase(client: PrismaClient) {
  return createMemoryDatabase(client)
}

/**
 * Seed database with schema-validated memory data
 */
export async function seedMemoryTestData(client: PrismaClient) {
  const memoryDb = createTestMemoryDatabase(client)

  // Create test memory with validation
  const memoryInput = createTestMemoryInput({
    id: 'validated-test-memory-1',
    summary: 'Schema-validated test memory',
  })

  const memoryResult = await memoryDb.createMemory(memoryInput)
  if (!memoryResult.success) {
    throw new Error(`Failed to create test memory: ${memoryResult.error}`)
  }

  // Create emotional context with validation
  const emotionalContextInput = createTestEmotionalContextInput({
    id: 'validated-test-emotion-1',
    primaryMood: 'optimistic',
  })

  const emotionResult = await memoryDb.createEmotionalContext(
    memoryResult.data!.id,
    emotionalContextInput,
  )
  if (!emotionResult.success) {
    throw new Error(
      `Failed to create test emotional context: ${emotionResult.error}`,
    )
  }

  // Create relationship dynamics with validation
  const dynamicsInput = createTestRelationshipDynamicsInput({
    id: 'validated-test-dynamics-1',
  })

  const dynamicsResult = await memoryDb.createRelationshipDynamics(
    memoryResult.data!.id,
    dynamicsInput,
  )
  if (!dynamicsResult.success) {
    throw new Error(
      `Failed to create test relationship dynamics: ${dynamicsResult.error}`,
    )
  }

  return {
    memory: memoryResult.data!,
    emotionalContext: emotionResult.data!,
    relationshipDynamics: dynamicsResult.data!,
  }
}

/**
 * Test utility to validate that test data conforms to schema
 */
export function validateTestData() {
  const testMemory = createTestMemoryInput()
  const testEmotion = createTestEmotionalContextInput()
  const testDynamics = createTestRelationshipDynamicsInput()

  const memoryValidation = validateMemoryForDatabase(testMemory)
  const emotionValidation = validateEmotionalContextForDatabase(testEmotion)
  const dynamicsValidation =
    validateRelationshipDynamicsForDatabase(testDynamics)

  return {
    memoryValid: memoryValidation.isValid,
    emotionValid: emotionValidation.isValid,
    dynamicsValid: dynamicsValidation.isValid,
    errors: [
      ...memoryValidation.errors,
      ...emotionValidation.errors,
      ...dynamicsValidation.errors,
    ],
  }
}
