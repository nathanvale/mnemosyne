import { execSync } from 'child_process'
import { existsSync, unlinkSync } from 'fs'
import { resolve } from 'path'

import { PrismaClient } from '../../generated/index.js'

/**
 * Test database setup for @studio/db package
 * Creates isolated test databases with migrations
 */
export class TestDatabaseSetup {
  private static instances = new Map<string, PrismaClient>()
  private static workerId: string | null = null

  /**
   * Gets the current worker ID for test isolation
   */
  static getWorkerId(): string {
    if (this.workerId) return this.workerId

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

    // Fallback to process ID
    this.workerId = process.pid.toString()
    return this.workerId
  }

  /**
   * Creates a test database with migrations applied
   */
  static async createTestDatabase(): Promise<PrismaClient> {
    const workerId = this.getWorkerId()
    const cacheKey = `test-${workerId}`

    // Return cached instance if exists
    if (this.instances.has(cacheKey)) {
      return this.instances.get(cacheKey)!
    }

    // Create database URL
    const tmpDir = process.env.TMPDIR || '/tmp'
    const dbPath = resolve(tmpDir, `mnemosyne-db-test-${workerId}.db`)

    // Remove existing database file to ensure clean state
    try {
      if (existsSync(dbPath)) {
        unlinkSync(dbPath)
      }
    } catch {
      // Ignore errors
    }

    const databaseUrl = `file:${dbPath}`

    // Use db push for test databases (creates schema without migrations)
    const originalDatabaseUrl = process.env.DATABASE_URL
    process.env.DATABASE_URL = databaseUrl

    try {
      // Force create the schema
      execSync(
        `npx prisma db push --force-reset --skip-generate --schema=prisma/schema.prisma`,
        {
          stdio: process.env.TEST_VERBOSE ? 'inherit' : 'pipe',
          cwd: resolve(__dirname, '../..'),
          env: {
            ...process.env,
            DATABASE_URL: databaseUrl,
          },
        },
      )
    } finally {
      // Restore original DATABASE_URL
      if (originalDatabaseUrl) {
        process.env.DATABASE_URL = originalDatabaseUrl
      } else {
        delete process.env.DATABASE_URL
      }
    }

    // Now create the Prisma client
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: process.env.TEST_VERBOSE
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
    })

    try {
      await prisma.$connect()

      // Apply the database triggers that are normally created by migrations
      await this.createDatabaseTriggers(prisma)

      this.instances.set(cacheKey, prisma)
      return prisma
    } catch (error) {
      await prisma.$disconnect()
      throw error
    }
  }

  /**
   * Creates database triggers for memoryCount maintenance
   */
  private static async createDatabaseTriggers(
    prisma: PrismaClient,
  ): Promise<void> {
    // Create trigger to increment memoryCount when a memory is added
    await prisma.$executeRaw`
      CREATE TRIGGER IF NOT EXISTS increment_memory_count_on_insert
      AFTER INSERT ON ClusterMembership
      FOR EACH ROW
      BEGIN
        UPDATE MemoryCluster
        SET memoryCount = memoryCount + 1,
            updatedAt = CURRENT_TIMESTAMP
        WHERE clusterId = NEW.clusterId;
      END
    `

    // Create trigger to decrement memoryCount when a memory is removed
    await prisma.$executeRaw`
      CREATE TRIGGER IF NOT EXISTS decrement_memory_count_on_delete
      AFTER DELETE ON ClusterMembership
      FOR EACH ROW
      BEGIN
        UPDATE MemoryCluster
        SET memoryCount = MAX(0, memoryCount - 1),
            updatedAt = CURRENT_TIMESTAMP
        WHERE clusterId = OLD.clusterId;
      END
    `

    // Create trigger to handle updates when membership is moved between clusters
    await prisma.$executeRaw`
      CREATE TRIGGER IF NOT EXISTS update_memory_count_on_update
      AFTER UPDATE OF clusterId ON ClusterMembership
      FOR EACH ROW
      WHEN OLD.clusterId != NEW.clusterId
      BEGIN
        -- Decrement count from old cluster
        UPDATE MemoryCluster
        SET memoryCount = MAX(0, memoryCount - 1),
            updatedAt = CURRENT_TIMESTAMP
        WHERE clusterId = OLD.clusterId;
        
        -- Increment count in new cluster
        UPDATE MemoryCluster
        SET memoryCount = memoryCount + 1,
            updatedAt = CURRENT_TIMESTAMP
        WHERE clusterId = NEW.clusterId;
      END
    `
  }

  /**
   * Cleans up test data
   */
  static async cleanTestData(prisma: PrismaClient): Promise<void> {
    // Clean in foreign key dependency order
    await prisma.clusterQualityMetrics.deleteMany()
    await prisma.patternAnalysis.deleteMany()
    await prisma.clusterMembership.deleteMany()
    await prisma.memoryCluster.deleteMany()
    await prisma.memory.deleteMany()
  }

  /**
   * Disconnects and cleans up test database
   */
  static async cleanup(prisma: PrismaClient): Promise<void> {
    if (!prisma) return

    try {
      await prisma.$disconnect()

      // Clean up database files
      const workerId = this.getWorkerId()
      const tmpDir = process.env.TMPDIR || '/tmp'
      const dbPath = resolve(tmpDir, `mnemosyne-db-test-${workerId}.db`)

      const filesToRemove = [
        dbPath,
        `${dbPath}-journal`,
        `${dbPath}-shm`,
        `${dbPath}-wal`,
      ]

      for (const file of filesToRemove) {
        try {
          if (existsSync(file)) {
            unlinkSync(file)
          }
        } catch {
          // Ignore errors
        }
      }

      // Remove from cache
      for (const [key, client] of this.instances.entries()) {
        if (client === prisma) {
          this.instances.delete(key)
          break
        }
      }
    } catch (error) {
      console.warn('Error during cleanup:', error)
    }
  }
}
