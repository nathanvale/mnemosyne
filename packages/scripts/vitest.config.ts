import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@studio/schema': path.resolve(__dirname, '../schema/src'),
      '@studio/db': path.resolve(__dirname, '../db/src'),
      '@studio/test-config': path.resolve(__dirname, '../test-config/src'),
      '@studio/logger': path.resolve(__dirname, '../logger/src'),
    },
  },
})
