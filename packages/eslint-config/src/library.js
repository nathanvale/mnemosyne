import { baseConfig } from './base.js'

/**
 * ESLint configuration for library packages.
 * Extends the base configuration with library-specific rules.
 */
export const libraryConfig = [
  // Include base configuration
  ...baseConfig,

  // Library specific rules
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.mjs'],
    rules: {
      // Stricter rules for libraries
      'no-console': 'error',
    },
  },
]

export default libraryConfig
