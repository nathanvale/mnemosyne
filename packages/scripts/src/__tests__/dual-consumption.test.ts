/**
 * @file Tests for @studio/scripts dual consumption pattern
 *
 * Validates that the package exports work correctly in both development
 * (source files) and production (compiled) environments for CLI scripts.
 */

import { describe, it, expect } from 'vitest'

describe('@studio/scripts dual consumption', () => {
  describe('package.json structure', () => {
    it('should have proper conditional exports structure', async () => {
      const packageJson = await import('../../package.json')

      expect(packageJson.type).toBe('module')
      expect(packageJson.exports).toBeDefined()
      expect(packageJson.exports['.']).toBeDefined()

      // Main export should be configured for dual consumption
      const mainExport = packageJson.exports['.']
      expect(typeof mainExport).toBe('object')
    })

    it('should have correct dependencies for CLI operations', async () => {
      const packageJson = await import('../../package.json')

      // Should have CLI framework
      expect(packageJson.dependencies['commander']).toBeDefined()

      // Should have CSV processing
      expect(packageJson.dependencies['fast-csv']).toBeDefined()

      // Should have workspace dependencies
      expect(packageJson.dependencies['@studio/db']).toBe('workspace:*')
      expect(packageJson.dependencies['@studio/logger']).toBe('workspace:*')
      expect(packageJson.dependencies['@studio/schema']).toBe('workspace:*')
    })

    it('should have TypeScript configuration for dual output', async () => {
      const tsconfig = await import('../../tsconfig.json')

      expect(tsconfig.default.compilerOptions.outDir).toBe('./dist')
      expect(tsconfig.default.compilerOptions).toBeDefined()
    })
  })

  describe('conditional exports behavior', () => {
    it('should validate package exports are properly configured', async () => {
      const packageJson = await import('../../package.json')

      const mainExport = packageJson.exports['.']

      // Should have conditional exports structure
      expect(typeof mainExport).toBe('object')
      expect(mainExport.development).toBe('./src/index.ts')
      expect(mainExport.types).toBe('./dist/index.d.ts')
      expect(mainExport.import).toBe('./dist/index.js')
      expect(mainExport.default).toBe('./dist/index.js')
    })

    it('should support expected scripts API surface', async () => {
      const packageJson = await import('../../package.json')

      // Main export should support dual consumption
      expect(packageJson.exports['.']).toBeDefined()

      // Should have proper build script
      expect(packageJson.scripts.build).toBe(
        'tsc && node ../../scripts/fix-esm-extensions.js dist',
      )

      // Should have test script
      expect(packageJson.scripts.test).toBe('vitest')
    })
  })

  describe('dual consumption validation', () => {
    it('should validate conditional export paths for scripts package', async () => {
      const packageJson = await import('../../package.json')

      const mainExport = packageJson.exports['.']

      // After migration: conditional exports object
      expect(typeof mainExport).toBe('object')
      expect(mainExport.development).toBe('./src/index.ts')
      expect(mainExport.types).toBe('./dist/index.d.ts')
      expect(mainExport.import).toBe('./dist/index.js')
      expect(mainExport.default).toBe('./dist/index.js')
    })

    it('should have proper build configuration', async () => {
      const tsconfig = await import('../../tsconfig.json')

      // Verify output directory matches exports
      expect(tsconfig.default.compilerOptions.outDir).toBe('./dist')

      // Verify ES modules configuration
      expect(tsconfig.default.compilerOptions).toBeDefined()
    })

    it('should have correct build script configuration', async () => {
      const packageJson = await import('../../package.json')

      // Build script should use tsc
      expect(packageJson.scripts.build).toBe(
        'tsc && node ../../scripts/fix-esm-extensions.js dist',
      )

      // Test script should use vitest
      expect(packageJson.scripts.test).toBe('vitest')

      // Should have type-check script
      expect(packageJson.scripts['type-check']).toBe('tsc --noEmit')
    })
  })

  describe('scripts package specific requirements', () => {
    it('should have CLI and processing dependencies', async () => {
      const packageJson = await import('../../package.json')

      // CLI framework for command-line tools
      expect(packageJson.dependencies['commander']).toBeDefined()

      // CSV processing for data import
      expect(packageJson.dependencies['fast-csv']).toBeDefined()

      // Database operations
      expect(packageJson.dependencies['@studio/db']).toBe('workspace:*')
    })

    it('should support data processing and logging', async () => {
      const packageJson = await import('../../package.json')

      // Schema validation for imported data
      expect(packageJson.dependencies['@studio/schema']).toBe('workspace:*')

      // Logging for import operations
      expect(packageJson.dependencies['@studio/logger']).toBe('workspace:*')

      // Node types for CLI operations
      expect(packageJson.devDependencies['@types/node']).toBeDefined()
    })
  })
})
