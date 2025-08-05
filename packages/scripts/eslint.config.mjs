import { libraryConfig } from '@studio/eslint-config/library'

export default [
  ...libraryConfig,
  {
    files: ['src/**/*.ts'],
    rules: {
      // CLI scripts need console for user output
      'no-console': ['error', { allow: ['warn', 'error', 'log', 'info'] }],
    },
  },
]
