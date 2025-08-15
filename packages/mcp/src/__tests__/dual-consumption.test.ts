/**
 * @file Tests for @studio/mcp dual consumption pattern
 *
 * Validates that the package exports work correctly in both development
 * (source files) and production (compiled) environments for MCP server.
 */

import { describe, it, expect } from 'vitest'

describe('@studio/mcp dual consumption', () => {
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

    it('should have correct dependencies for MCP server', async () => {
      const packageJson = await import('../../package.json')

      // Should have tRPC for server
      expect(packageJson.dependencies['@trpc/server']).toBeDefined()

      // Should have Express for HTTP server
      expect(packageJson.dependencies['express']).toBeDefined()

      // Should have UUID for unique identifiers
      expect(packageJson.dependencies['uuid']).toBeDefined()

      // Should have validation
      expect(packageJson.dependencies['zod']).toBeDefined()

      // Should have workspace dependencies
      expect(packageJson.dependencies['@studio/schema']).toBe('workspace:*')
      expect(packageJson.dependencies['@studio/memory']).toBe('workspace:*')
      expect(packageJson.dependencies['@studio/db']).toBe('workspace:*')
      expect(packageJson.dependencies['@studio/logger']).toBe('workspace:*')
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

    it('should support expected MCP API surface', async () => {
      const packageJson = await import('../../package.json')

      // Main export should support dual consumption
      expect(packageJson.exports['.']).toBeDefined()

      // Should have proper build script
      expect(packageJson.scripts.build).toBe('tsc')

      // Should have test script
      expect(packageJson.scripts.test).toBe('vitest')

      // Should have format:check script
      expect(packageJson.scripts['format:check']).toBe('prettier --check src')
    })
  })

  describe('dual consumption validation', () => {
    it('should validate conditional export paths for MCP package', async () => {
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
      expect(packageJson.scripts.build).toBe('tsc')

      // Dev script should use tsc --watch
      expect(packageJson.scripts.dev).toBe('tsc --watch')

      // Test script should use vitest
      expect(packageJson.scripts.test).toBe('vitest')

      // Should have type-check script
      expect(packageJson.scripts['type-check']).toBe('tsc --noEmit')
    })
  })

  describe('MCP package specific requirements', () => {
    it('should have server and API dependencies', async () => {
      const packageJson = await import('../../package.json')

      // tRPC for typed server endpoints
      expect(packageJson.dependencies['@trpc/server']).toBeDefined()

      // Express for HTTP server
      expect(packageJson.dependencies['express']).toBeDefined()
      expect(packageJson.devDependencies['@types/express']).toBeDefined()

      // UUID for unique identifiers
      expect(packageJson.dependencies['uuid']).toBeDefined()
      expect(packageJson.devDependencies['@types/uuid']).toBeDefined()
    })

    it('should support memory and database operations', async () => {
      const packageJson = await import('../../package.json')

      // Memory operations
      expect(packageJson.dependencies['@studio/memory']).toBe('workspace:*')

      // Database operations
      expect(packageJson.dependencies['@studio/db']).toBe('workspace:*')

      // Schema validation
      expect(packageJson.dependencies['@studio/schema']).toBe('workspace:*')
      expect(packageJson.dependencies['zod']).toBeDefined()

      // Logging for server operations
      expect(packageJson.dependencies['@studio/logger']).toBe('workspace:*')
    })
  })
})
