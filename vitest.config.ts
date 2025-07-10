import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            '@': path.resolve(dirname, 'src'),
            '@studio/db': path.resolve(dirname, 'packages/db/src'),
            '@studio/logger': path.resolve(dirname, 'packages/logger/src'),
            '@studio/scripts': path.resolve(dirname, 'packages/scripts/src'),
            '@studio/test-config': path.resolve(
              dirname,
              'packages/test-config/src',
            ),
            '@studio/ui': path.resolve(dirname, 'packages/ui/src'),
            '@studio/mocks': path.resolve(dirname, 'packages/mocks/src'),
            '@studio/shared': path.resolve(dirname, 'packages/shared/src'),
          },
        },
        plugins: [react()],
        test: {
          environment: 'jsdom', // RTL needs a DOM shim
          globals: true, // `describe`, `it`, etc. in global scope
          setupFiles: './tests/vitest.setup.ts',
          include: ['./**/*.test.ts?(x)'],
        },
      },
      {
        plugins: [
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
            storybookScript: 'pnpm storybook --ci',
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            provider: 'playwright',
            headless: true,
            instances: [{ browser: 'chromium' }],
          },
          setupFiles: ['./.storybook/vitest.setup.ts'],
        },
      },
    ],
  },
})
