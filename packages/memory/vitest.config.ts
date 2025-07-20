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
    // setupFiles: ['@studio/test-config/vitest.setup'], // Disabled for now
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
