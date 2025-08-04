import { libraryConfig } from '@studio/eslint-config/library'

export default [
  ...libraryConfig,
  {
    files: ['src/performance-benchmarks.ts'],
    rules: {
      // Performance benchmarks need console for reporting
      'no-console': ['error', { allow: ['warn', 'error', 'log', 'info'] }],
    },
  },
  {
    files: ['src/test-isolation.ts'],
    rules: {
      // Test isolation needs full console access for clearing and mocking
      'no-console': 'off',
    },
  },
]
