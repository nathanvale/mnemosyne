import { libraryConfig } from '@studio/eslint-config/library'

export default [
  ...libraryConfig,
  {
    files: ['**/*.test.ts', '**/__tests__/**/*.ts'],
    rules: {
      // Test files need console for debugging and reporting
      'no-console': ['error', { allow: ['warn', 'error', 'log', 'info'] }],
      // Allow unused vars with underscore prefix in tests
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ['src/persistence/__tests__/worker-database-factory.ts', 'src/persistence/test-data-factory.ts'],
    rules: {
      // Database factory files need full console access for debugging
      'no-console': 'off',
    },
  },
]
