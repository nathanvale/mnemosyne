import { libraryConfig } from '@studio/eslint-config/library'

export default [
  ...libraryConfig,
  {
    files: ['src/lib/debug-callsite.ts', 'src/lib/logger-demo.ts'],
    rules: {
      // These files are demos/debug utilities that need console
      'no-console': 'off',
    },
  },
  {
    files: ['src/lib/browser-logger.ts'],
    rules: {
      // Browser logger needs direct console access for all methods
      'no-console': 'off',
    },
  },
]
