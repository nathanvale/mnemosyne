/**
 * @file Tests for @studio/shared dual consumption pattern
 *
 * Validates that the package exports work correctly in both development
 * (source files) and production (compiled) environments.
 */

import { describe, it, expect } from 'vitest'

describe('@studio/shared dual consumption', () => {
  describe('package.json structure', () => {
    it('should have proper conditional exports structure', async () => {
      const packageJson = await import('../../package.json')

      expect(packageJson.type).toBe('module')
      expect(packageJson.exports).toBeDefined()
      expect(packageJson.exports['.']).toBeDefined()

      // Check that exports structure follows the pattern
      const mainExport = packageJson.exports['.']
      expect(
        typeof mainExport === 'string' || typeof mainExport === 'object',
      ).toBe(true)

      // If it's an object, it should have the dual consumption structure
      if (typeof mainExport === 'object') {
        expect(mainExport.development).toBeDefined()
        expect(mainExport.types).toBeDefined()
        expect(mainExport.import).toBeDefined()
        expect(mainExport.default).toBeDefined()
      }
    })

    it('should include required files for distribution', async () => {
      const packageJson = await import('../../package.json')

      expect(packageJson.files).toContain('dist')
      expect(packageJson.files).toContain('src')
    })
  })

  describe('module imports', () => {
    it('should be able to import the main module', async () => {
      // This should not throw
      const sharedModule = await import('../index')
      expect(sharedModule).toBeDefined()
    })
  })
})
