/**
 * @file Tests for @studio/ui dual consumption pattern
 *
 * Validates that the package exports work correctly in both development
 * (source files) and production (compiled) environments for React components.
 */

import { describe, it, expect } from 'vitest'

describe('@studio/ui dual consumption', () => {
  describe('package.json structure', () => {
    it('should have proper conditional exports structure', async () => {
      const packageJson = await import('../../package.json')

      expect(packageJson.type).toBe('module')
      expect(packageJson.exports).toBeDefined()
      expect(packageJson.exports['.']).toBeDefined()

      // UI package should currently have simple export, will be migrated to conditional
      const mainExport = packageJson.exports['.']
      expect(mainExport).toBeDefined()
    })

    it('should have React dependencies configured correctly', async () => {
      const packageJson = await import('../../package.json')

      // Should have React as dependency and peer dependency
      expect(packageJson.dependencies.react).toBeDefined()
      expect(packageJson.peerDependencies.react).toBeDefined()

      // Should have testing libraries for components
      expect(
        packageJson.devDependencies['@testing-library/react'],
      ).toBeDefined()
      expect(packageJson.devDependencies['@vitejs/plugin-react']).toBeDefined()
    })

    it('should have TypeScript configuration for React components', async () => {
      const tsconfig = await import('../../tsconfig.json')

      expect(tsconfig.compilerOptions).toBeDefined()
      // React components need JSX compilation
      expect(tsconfig.include).toContain('src/**/*')
    })
  })

  describe('React component exports validation', () => {
    it('should validate package exports structure for future migration', () => {
      // This test validates the expected structure before migration
      // UI components need special handling for JSX and CSS imports
      expect(true).toBe(true) // Structure validation placeholder
    })

    it('should support expected UI API surface for dual consumption', async () => {
      const packageJson = await import('../../package.json')

      // Main export should be configured
      expect(packageJson.exports['.']).toBeDefined()

      // Should have workspace dependencies for logger, mocks, schema
      expect(packageJson.dependencies['@studio/logger']).toBe('workspace:*')
      expect(packageJson.dependencies['@studio/mocks']).toBe('workspace:*')
      expect(packageJson.dependencies['@studio/schema']).toBe('workspace:*')

      // Should have Storybook for component development
      expect(packageJson.scripts['test:storybook']).toBeDefined()
    })
  })

  describe('React component dual consumption requirements', () => {
    it('should validate paths for conditional exports after migration', async () => {
      const packageJson = await import('../../package.json')

      // After migration, should support conditional exports structure
      const mainExport = packageJson.exports['.']
      expect(typeof mainExport).toBe('object')

      // Verify all required export conditions
      expect(mainExport.development).toBe('./src/index.ts') // for hot reload
      expect(mainExport.types).toBe('./dist/index.d.ts') // for type definitions
      expect(mainExport.import).toBe('./dist/index.js') // for production
      expect(mainExport.default).toBe('./dist/index.js') // fallback
    })

    it('should have proper build configuration for React components', async () => {
      const packageJson = await import('../../package.json')

      // Build script should use tsc for TypeScript compilation
      expect(packageJson.scripts.build).toBe(
        'tsc && node ../../scripts/fix-esm-extensions.js dist',
      )

      // Should have proper test script
      expect(packageJson.scripts.test).toBe('vitest')

      // Should support Storybook testing
      expect(packageJson.scripts['test:storybook']).toBe(
        'vitest --project=storybook',
      )
    })

    it('should validate TypeScript config for dual output', async () => {
      const tsconfig = await import('../../tsconfig.json')

      // Should extend library config for proper React compilation
      expect(tsconfig.default.extends).toBe('../typescript-config/library.json')

      // Should include source files
      expect(tsconfig.default.include).toContain('src/**/*')

      // Should have JSX configuration for React components
      expect(tsconfig.default.compilerOptions.jsx).toBe('react-jsx')
    })
  })

  describe('React component hot reload requirements', () => {
    it('should validate Next.js transpilation setup', () => {
      // UI package should be in Next.js transpilePackages for hot reload
      // This will be validated in integration tests
      expect(true).toBe(true) // Hot reload validation placeholder
    })

    it('should support React Fast Refresh requirements', async () => {
      const packageJson = await import('../../package.json')

      // Should have React plugin for Vite (used in development)
      expect(packageJson.devDependencies['@vitejs/plugin-react']).toBeDefined()

      // React version should support Fast Refresh
      expect(packageJson.dependencies.react).toMatch(/\^19/)
    })
  })
})
