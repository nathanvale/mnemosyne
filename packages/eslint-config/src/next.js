import { FlatCompat } from '@eslint/eslintrc'
import storybook from 'eslint-plugin-storybook'
import { dirname } from 'path'
import { fileURLToPath } from 'url'

import { baseConfig } from './base.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

/**
 * ESLint configuration for Next.js applications.
 * Extends the base configuration with Next.js and React specific rules.
 */
export const nextConfig = [
  // Include base configuration
  ...baseConfig,

  // Next.js specific configurations
  ...compat.extends('next/core-web-vitals'),

  // Storybook configuration (if using Storybook)
  ...storybook.configs['flat/recommended'],

  // Next.js specific rules
  {
    rules: {
      // React rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Next.js specific
      '@next/next/no-html-link-for-pages': 'error',
      '@next/next/no-img-element': 'error',

      // Override base rules if needed
      'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
    },
  },

  // Next.js specific ignores
  {
    ignores: ['.next/**/*', 'out/**/*', 'public/**/*', 'storybook-static/**/*'],
  },
]

export default nextConfig
