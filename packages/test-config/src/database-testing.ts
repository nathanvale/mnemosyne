import { PrismaClient } from '@studio/db'
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
  // Assets and Links depend on Messages, so delete them first
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

  return {
    message1,
    message2,
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
