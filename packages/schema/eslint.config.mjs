import { libraryConfig } from '@studio/eslint-config/library'

export default [
  ...libraryConfig,
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      // Allow console.info in test files for performance reporting
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
    },
  },
]
