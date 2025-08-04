import { afterAll, beforeEach } from 'vitest'

import { WorkerDatabaseFactory } from './worker-database-factory'

/**
 * Global test setup for worker-isolated database testing
 * 
 * This setup file is automatically loaded by Vitest and ensures:
 * - Each worker gets its own isolated SQLite database
 * - Clean state between tests within the same worker
 * - Proper cleanup when tests complete
 */

// Global cleanup when all tests in this worker complete
afterAll(async () => {
  await WorkerDatabaseFactory.cleanup()
})

// Note: Data cleanup between tests is handled by individual test suites
// Some tests need data to persist across test cases within a suite
// If you need automatic cleanup, call WorkerDatabaseFactory.cleanWorkerData() in your test's beforeEach

// Export utilities for tests that need direct access
export { WorkerDatabaseFactory }