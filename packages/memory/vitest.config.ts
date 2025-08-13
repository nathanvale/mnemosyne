import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@studio/logger': resolve(__dirname, '../logger/src'),
      '@studio/db': resolve(__dirname, '../db/src'),
      '@studio/schema': resolve(__dirname, '../schema/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/persistence/__tests__/test-setup.ts'],

    // Use limited concurrency in CI to avoid database issues
    ...(process.env.CI
      ? {
          pool: 'forks',
          poolOptions: {
            forks: {
              maxForks: 1, // Use single worker in CI to avoid SQLite locking issues
              singleFork: true, // Force sequential execution in CI
            },
          },
        }
      : {
          // Enable concurrent execution with worker-isolated databases locally
          pool: 'threads',
          poolOptions: {
            threads: {
              // Allow concurrent execution - each worker gets its own database
              minThreads: 1,
              maxThreads: 4, // Limit to 4 workers for optimal performance
            },
          },
        }),

    // Increase timeout for database operations
    testTimeout: 30000,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
      ],
      thresholds: {
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90,
        },
      },
    },
  },
})
