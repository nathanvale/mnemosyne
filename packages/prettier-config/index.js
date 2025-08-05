/**
 * Shared Prettier configuration for the @studio monorepo
 * Based on the existing .prettierrc configuration
 */
export default {
  arrowParens: 'always',
  printWidth: 80,
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  overrides: [
    {
      files: ['.eslintrc', '.eslintrc.js', '.eslintrc.json'],
      options: {
        trailingComma: 'none',
      },
    },
  ],
}
