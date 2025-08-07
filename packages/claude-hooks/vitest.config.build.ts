import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['scripts/**/*.test.ts'],
    globalSetup: ['./scripts/__tests__/setup-build.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'hooks/'],
    },
  },
})
