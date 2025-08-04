import { FlatCompat } from '@eslint/eslintrc'
import perfectionist from 'eslint-plugin-perfectionist'
import turbo from 'eslint-plugin-turbo'
import { dirname } from 'path'
import tseslint from 'typescript-eslint'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

/**
 * Base ESLint configuration for all packages in the monorepo.
 * Includes Turborepo-specific rules and common settings.
 */
export const baseConfig = [
  // TypeScript ESLint configuration
  ...tseslint.configs.recommended,

  // Turborepo recommended configuration
  turbo.configs['flat/recommended'],

  // Prettier compatibility
  ...compat.extends('prettier'),

  // Perfectionist plugin for consistent imports
  {
    plugins: { perfectionist },
    rules: {
      'perfectionist/sort-imports': 'error',
    },
  },

  // Common rules for all packages
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.mjs'],
    rules: {
      // Turborepo specific rules
      'turbo/no-undeclared-env-vars': 'error',

      // General best practices
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-unused-vars': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
      'prefer-template': 'error',
    },
  },

  // Common ignores
  {
    ignores: [
      'node_modules/**/*',
      'dist/**/*',
      'build/**/*',
      'coverage/**/*',
      '**/*.d.ts',
      '**/*.d.ts.map',
      'generated/**/*',
    ],
  },
]

export default baseConfig
