/**
 * @file Tests for @studio/schema dual consumption pattern
 *
 * Validates that the package exports work correctly in both development
 * (source files) and production (compiled) environments.
 */

import { describe, it, expect } from 'vitest'

describe('@studio/schema dual consumption', () => {
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
    })

    it('should include required files for distribution', async () => {
      const packageJson = await import('../../package.json')

      expect(packageJson.files).toContain('dist')
      expect(packageJson.files).toContain('src')
    })
  })

  describe('core exports availability', () => {
    it('should export core memory types and schemas', async () => {
      const schemaModule = await import('../index')

      // Check core memory exports
      expect(schemaModule.MemorySchema).toBeDefined()
      expect(typeof schemaModule.MemorySchema).toBe('object')

      // Check participant exports
      expect(schemaModule.ParticipantSchema).toBeDefined()
      expect(schemaModule.ParticipantRole).toBeDefined()

      // Check emotional context exports
      expect(schemaModule.EmotionalContextSchema).toBeDefined()
      expect(schemaModule.EmotionalState).toBeDefined()
      expect(schemaModule.EmotionalTheme).toBeDefined()
    })

    it('should export validation types and functions', async () => {
      const schemaModule = await import('../index')

      // Check validation exports
      expect(schemaModule.ValidationStatus).toBeDefined()
      expect(schemaModule.ValidationIssueType).toBeDefined()
      expect(schemaModule.ValidationResultSchema).toBeDefined()

      // Check validation functions
      expect(schemaModule.validateMemory).toBeDefined()
      expect(typeof schemaModule.validateMemory).toBe('function')
      expect(schemaModule.validateEmotionalContext).toBeDefined()
      expect(typeof schemaModule.validateEmotionalContext).toBe('function')
    })

    it('should export utility functions', async () => {
      const schemaModule = await import('../index')

      // Check type guards
      expect(schemaModule.isMemory).toBeDefined()
      expect(typeof schemaModule.isMemory).toBe('function')
      expect(schemaModule.isEmotionalContext).toBeDefined()
      expect(typeof schemaModule.isEmotionalContext).toBe('function')

      // Check transformation functions
      expect(schemaModule.transformMemoryToExport).toBeDefined()
      expect(typeof schemaModule.transformMemoryToExport).toBe('function')
      expect(schemaModule.normalizeMemory).toBeDefined()
      expect(typeof schemaModule.normalizeMemory).toBe('function')
    })

    it('should export constants', async () => {
      const schemaModule = await import('../index')

      expect(schemaModule.SCHEMA_VERSION).toBeDefined()
      expect(schemaModule.CONFIDENCE_THRESHOLDS).toBeDefined()
      expect(schemaModule.QUALITY_THRESHOLDS).toBeDefined()
      expect(schemaModule.EMOTIONAL_INTENSITY).toBeDefined()
    })
  })

  describe('import resolution in different environments', () => {
    it('should resolve imports consistently', async () => {
      // This test verifies that imports work in the current environment
      // Whether it's development (source) or production (compiled)
      const { MemorySchema, isMemory, SCHEMA_VERSION } = await import(
        '../index'
      )

      expect(MemorySchema).toBeDefined()
      expect(isMemory).toBeDefined()
      expect(SCHEMA_VERSION).toBeDefined()

      // Verify they are the expected types
      expect(typeof isMemory).toBe('function')
      expect(typeof SCHEMA_VERSION).toBe('string')
    })

    it('should maintain type information', async () => {
      const { ValidationStatus, EmotionalState } = await import('../index')

      // These should be enums or objects
      expect(ValidationStatus).toBeDefined()
      expect(EmotionalState).toBeDefined()

      // Check that enum-like exports have expected properties
      expect(typeof ValidationStatus).toBe('object')
      expect(typeof EmotionalState).toBe('object')
    })
  })

  describe('dependency handling', () => {
    it('should handle zod dependency correctly', async () => {
      const { MemorySchema } = await import('../index')

      // MemorySchema should be a Zod schema
      expect(MemorySchema).toBeDefined()
      expect(typeof MemorySchema.parse).toBe('function')
      expect(typeof MemorySchema.safeParse).toBe('function')
    })
  })
})
