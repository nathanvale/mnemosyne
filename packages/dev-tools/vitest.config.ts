import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Don't reference a setup file that doesn't exist
    // setupFiles: undefined,
  },
})
