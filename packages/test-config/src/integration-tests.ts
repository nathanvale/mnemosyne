import { validateMemoryForDatabase, type DatabaseMemoryInput } from '@studio/db'
import {
  createMemoryLogger,
  createSchemaLogger,
  withPerformanceLogging,
} from '@studio/logger'
import { validateMemory, type ValidationResult } from '@studio/schema'
import {
  createMemoryProcessor,
  validateSingleMemory,
  transformLegacyMemory,
} from '@studio/scripts'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import {
  createTestDatabase,
  createTestMemoryInput,
  createTestEmotionalContextInput,
  createTestRelationshipDynamicsInput,
  createTestMemoryDatabase,
  validateTestData,
  type TestDatabase,
} from './database-testing'

/**
 * Comprehensive integration tests for Issue #73
 * Tests schema validation across all packages
 */

describe('Schema Integration Tests', () => {
  let testDb: TestDatabase

  beforeEach(async () => {
    testDb = await createTestDatabase()
  })

  afterEach(async () => {
    await testDb.cleanup()
  })

  describe('Database + Schema Integration', () => {
    it('should create and validate memory with database operations', async () => {
      const memoryDb = createTestMemoryDatabase(testDb.client)

      // Create valid test memory
      const memoryInput = createTestMemoryInput({
        id: 'integration-test-memory',
        summary: 'Integration test memory with schema validation',
      })

      // Create memory in database
      const result = await memoryDb.createMemory(memoryInput)

      expect(result.success).toBe(true)
      expect(result.validation.isValid).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.id).toBe('integration-test-memory')
      expect(result.data!.summary).toBe(
        'Integration test memory with schema validation',
      )
    })

    it('should reject invalid memory data', async () => {
      const memoryDb = createTestMemoryDatabase(testDb.client)

      // Create invalid memory (missing required fields)
      const invalidMemory = {
        id: '', // Invalid: empty string
        sourceMessageIds: [], // Invalid: empty array
        participants: [], // Invalid: empty array
        summary: '', // Invalid: empty string
        confidence: 15, // Invalid: out of range (1-10)
      }

      const result = await memoryDb.createMemory(
        invalidMemory as DatabaseMemoryInput,
      )

      expect(result.success).toBe(false)
      expect(result.validation.isValid).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.data).toBeNull()
    })

    it('should create memory with emotional context and relationship dynamics', async () => {
      const memoryDb = createTestMemoryDatabase(testDb.client)

      // Create memory
      const memoryInput = createTestMemoryInput({
        id: 'full-memory-test',
      })

      const memoryResult = await memoryDb.createMemory(memoryInput)
      expect(memoryResult.success).toBe(true)

      // Create emotional context
      const emotionInput = createTestEmotionalContextInput({
        id: 'emotion-test',
        primaryMood: 'confident',
        intensity: 8,
      })

      const emotionResult = await memoryDb.createEmotionalContext(
        memoryResult.data!.id,
        emotionInput,
      )
      expect(emotionResult.success).toBe(true)

      // Create relationship dynamics
      const dynamicsInput = createTestRelationshipDynamicsInput({
        id: 'dynamics-test',
        communicationPatterns: ['collaborative', 'constructive'],
      })

      const dynamicsResult = await memoryDb.createRelationshipDynamics(
        memoryResult.data!.id,
        dynamicsInput,
      )
      expect(dynamicsResult.success).toBe(true)

      // Verify relationships exist by querying the database directly
      const savedMemory = await testDb.client.memory.findUnique({
        where: { id: memoryResult.data!.id },
        include: {
          emotionalContext: true,
          relationshipDynamics: true,
        },
      })
      expect(savedMemory).toBeDefined()
      expect(savedMemory!.emotionalContext).toBeDefined()
      expect(savedMemory!.relationshipDynamics).toBeDefined()
    })
  })

  describe('Scripts + Schema Integration', () => {
    it('should process batch of memories with validation', async () => {
      const processor = createMemoryProcessor(testDb.client, {
        batchSize: 5,
        validateFirst: true,
        logProgress: false, // Disable logging for tests
      })

      // Create test batch with mixed valid/invalid data
      const testBatch = [
        createTestMemoryInput({ id: 'batch-memory-1' }),
        createTestMemoryInput({ id: 'batch-memory-2' }),
        { id: '', summary: '', confidence: 0 }, // Invalid
        createTestMemoryInput({ id: 'batch-memory-3' }),
        { id: 'invalid', sourceMessageIds: null }, // Invalid
      ]

      const result = await processor.processMemories(testBatch)

      expect(result.processed).toBe(5)
      expect(result.successful).toBe(3) // 3 valid memories
      expect(result.failed).toBe(2) // 2 invalid memories
      expect(result.validationErrors).toBe(2)
      expect(result.databaseErrors).toBe(0)
    })

    it('should validate memories without processing', async () => {
      const processor = createMemoryProcessor(testDb.client)

      const testData = [
        createTestMemoryInput({ id: 'valid-1' }),
        createTestMemoryInput({ id: 'valid-2' }),
        { id: '', summary: '' }, // Invalid
      ]

      const validation = await processor.validateMemories(testData)

      expect(validation.valid).toBe(2)
      expect(validation.invalid).toBe(1)
      expect(validation.validationResults).toHaveLength(3)
      expect(validation.validationResults[0].isValid).toBe(true)
      expect(validation.validationResults[1].isValid).toBe(true)
      expect(validation.validationResults[2].isValid).toBe(false)
    })

    it('should transform legacy memory data', () => {
      const legacyData = {
        id: 'legacy-123',
        content: 'Legacy memory content',
        confidence: 7,
      }

      const transformed = transformLegacyMemory(legacyData)

      expect(transformed.id).toBe('legacy-123')
      expect(transformed.summary).toBe('Legacy memory content')
      expect(transformed.confidence).toBe(7)
      expect(transformed.sourceMessageIds).toEqual(['legacy-content'])
      expect(transformed.participants).toHaveLength(1)
      expect(transformed.participants[0].name).toBe('Legacy User')
    })

    it('should validate single memory correctly', () => {
      const validMemory = createTestMemoryInput()
      const invalidMemory = { id: '', summary: '' }

      const validResult = validateSingleMemory(validMemory)
      const invalidResult = validateSingleMemory(invalidMemory)

      expect(validResult.isValid).toBe(true)
      expect(validResult.errors).toHaveLength(0)

      expect(invalidResult.isValid).toBe(false)
      expect(invalidResult.errors.length).toBeGreaterThan(0)
    })
  })

  describe('Logger + Schema Integration', () => {
    it('should log memory processing events with validation context', async () => {
      const memoryLogger = createMemoryLogger(['integration-test'])
      const schemaLogger = createSchemaLogger(['integration-test'])

      // Test memory validation logging
      const testMemory = createTestMemoryInput()
      const validation = validateMemory(testMemory)

      // These should not throw errors
      expect(() => {
        schemaLogger.logMemoryValidation(validation, {
          dataId: testMemory.id,
          validationTimeMs: 10,
        })
      }).not.toThrow()

      // Test processing event logging
      expect(() => {
        memoryLogger.logMemoryEvent(
          'memory_creation_completed',
          'Memory created successfully',
          {
            memoryId: testMemory.id,
            processingTimeMs: 50,
          },
        )
      }).not.toThrow()
    })

    it('should log performance metrics', async () => {
      const memoryLogger = createMemoryLogger(['performance-test'])

      const testOperation = async () => {
        // Simulate some work
        await new Promise((resolve) => setTimeout(resolve, 10))
        return { result: 'success' }
      }

      const result = await withPerformanceLogging(
        memoryLogger,
        'test-operation',
        testOperation,
        { testContext: true },
      )

      expect(result.result).toBe('success')
    })

    it('should handle validation errors in logging', () => {
      const schemaLogger = createSchemaLogger(['error-test'])

      const failedValidation: ValidationResult = {
        isValid: false,
        errors: [
          {
            field: 'id',
            message: 'ID is required',
            value: '',
            expectedType: 'string',
            code: 'REQUIRED',
          },
        ],
        warnings: [],
      }

      expect(() => {
        schemaLogger.logMemoryValidation(failedValidation, {
          dataId: 'test-error',
        })
      }).not.toThrow()
    })
  })

  describe('Cross-Package Integration', () => {
    it('should complete full memory workflow from form to database', async () => {
      // Simulate memory form submission workflow
      const memoryLogger = createMemoryLogger(['workflow-test'])
      const schemaLogger = createSchemaLogger(['workflow-test'])

      // 1. Form data (simulating UI package)
      const formData = createTestMemoryInput({
        id: 'workflow-memory',
        summary: 'Memory from complete workflow test',
      })

      // 2. Validate form data (schema package)
      const validation = validateMemoryForDatabase(formData)
      schemaLogger.logMemoryValidation(validation, {
        dataId: formData.id,
      })

      expect(validation.isValid).toBe(true)

      // 3. Process through scripts (scripts package)
      const processor = createMemoryProcessor(testDb.client, {
        logProgress: false,
      })

      const processingResult = await processor.processMemories([formData])

      expect(processingResult.successful).toBe(1)
      expect(processingResult.failed).toBe(0)

      // 4. Verify in database (db package)
      const memoryDb = createTestMemoryDatabase(testDb.client)
      const savedMemory = await memoryDb.findMemoryById(formData.id)

      expect(savedMemory).toBeDefined()
      expect(savedMemory!.summary).toBe(formData.summary)

      // 5. Log completion
      memoryLogger.logMemoryEvent(
        'batch_processing_completed',
        'Workflow completed successfully',
        {
          processedCount: 1,
          successCount: 1,
          failureCount: 0,
        },
      )
    })

    it('should handle error scenarios across packages', async () => {
      createMemoryLogger(['error-workflow'])

      // Invalid data that should fail at multiple stages
      const invalidData = {
        id: '', // Fails schema validation
        content: '',
        timestamp: 'invalid-date',
        author: { id: '', name: '', role: 'invalid' },
        participants: [],
        tags: [],
      }

      // 1. Schema validation should fail
      const validation = validateMemory(invalidData)
      expect(validation.isValid).toBe(false)

      // 2. Processing should handle the failure gracefully
      const processor = createMemoryProcessor(testDb.client, {
        continueOnError: true,
        logProgress: false,
      })

      const result = await processor.processMemories([invalidData])

      expect(result.successful).toBe(0)
      expect(result.failed).toBe(1)
      expect(result.validationErrors).toBe(1)

      // 3. Database should remain unchanged
      const allMemories = await testDb.client.memory.findMany()
      expect(allMemories).toHaveLength(0)
    })
  })

  describe('Test Utilities Validation', () => {
    it('should validate that test data utilities create valid data', () => {
      const validation = validateTestData()

      expect(validation.memoryValid).toBe(true)
      expect(validation.emotionValid).toBe(true)
      expect(validation.dynamicsValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should create consistent test data', () => {
      const memory1 = createTestMemoryInput({ id: 'consistent-1' })
      const memory2 = createTestMemoryInput({ id: 'consistent-2' })

      // Should have same structure but different IDs
      expect(memory1.id).not.toBe(memory2.id)
      expect(memory1.sourceMessageIds).toEqual(memory2.sourceMessageIds)
      expect(memory1.participants).toEqual(memory2.participants)
      expect(memory1.confidence).toBe(memory2.confidence)
    })
  })

  describe('Performance and Scale Testing', () => {
    it('should handle batch processing of 100 memories', async () => {
      const processor = createMemoryProcessor(testDb.client, {
        batchSize: 25,
        logProgress: false,
      })

      // Generate 100 valid memories
      const memories = Array.from({ length: 100 }, (_, i) =>
        createTestMemoryInput({
          id: `scale-test-${i}`,
          summary: `Scale test memory ${i}`,
        }),
      )

      const startTime = Date.now()
      const result = await processor.processMemories(memories)
      const duration = Date.now() - startTime

      expect(result.processed).toBe(100)
      expect(result.successful).toBe(100)
      expect(result.failed).toBe(0)
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should validate large memory content efficiently', () => {
      const largeContent = 'A'.repeat(10000) // 10KB of content
      const largeMemory = createTestMemoryInput({
        id: 'large-content-test',
        summary: largeContent,
      })

      const startTime = Date.now()
      const validation = validateSingleMemory(largeMemory)
      const duration = Date.now() - startTime

      expect(validation.isValid).toBe(true)
      expect(duration).toBeLessThan(100) // Should validate within 100ms
    })
  })
})
