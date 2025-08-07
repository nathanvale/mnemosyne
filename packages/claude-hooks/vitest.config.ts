import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: [
      'scripts/**/*.test.ts', // Build verification tests - run separately with test:build
    ],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'hooks/', 'scripts/**/*.test.ts'],
    },
  },
})
