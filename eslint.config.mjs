import { baseConfig } from '@studio/eslint-config/base'

// Root-level ESLint configuration for the monorepo
export default [
  ...baseConfig,
  {
    // Root-specific ignores
    ignores: [
      'packages/*/dist/**/*',
      'apps/*/dist/**/*',
      'apps/*/.next/**/*',
      'apps/*/build/**/*',
      'packages/db/generated/**/*',
      'packages/db/prisma/wallaby*',
      'pnpm-lock.yaml',
    ],
  },
]
