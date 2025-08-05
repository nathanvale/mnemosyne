import { libraryConfig } from '@studio/eslint-config/library'

export default [
  ...libraryConfig,
  {
    files: ['src/logger-demo.tsx', 'src/logging-test.tsx'],
    rules: {
      // Demo files need full console access for demonstration
      'no-console': 'off',
    },
  },
  {
    files: ['src/__stories__/**/*.tsx'],
    rules: {
      // Story files can use console for logging
      'no-console': ['error', { allow: ['warn', 'error', 'log', 'info'] }],
    },
  },
]
