import {
  validateMemory,
  validateEmotionalContext,
  validateRelationshipDynamics,
} from '@studio/schema'
import { createMemoryProcessor } from '@studio/scripts'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import {
  createTestMemoryInput,
  createTestEmotionalContextInput,
  createTestRelationshipDynamicsInput,
  createTestDatabase,
  createTestMemoryDatabase,
  type TestDatabase,
} from './database-testing'

/**
 * Performance benchmarks for schema validation across packages
 * Tests for Issue #73 performance requirements
 */

interface BenchmarkResult {
  operation: string
  itemCount: number
  totalTime: number
  averageTime: number
  throughput: number
  memoryUsage?: {
    heapUsed: number
    heapTotal: number
  }
}

/**
 * Measure performance of an operation
 */
async function measurePerformance<T>(
  operation: string,
  itemCount: number,
  fn: () => Promise<T> | T,
): Promise<BenchmarkResult> {
  // Force garbage collection if available
  if (global.gc) {
    global.gc()
  }

  const startMemory = process.memoryUsage()
  const startTime = process.hrtime.bigint()

  await fn()

  const endTime = process.hrtime.bigint()
  const endMemory = process.memoryUsage()

  const totalTime = Number(endTime - startTime) / 1_000_000 // Convert to milliseconds
  const averageTime = totalTime / itemCount
  const throughput = (itemCount / totalTime) * 1000 // items per second

  return {
    operation,
    itemCount,
    totalTime,
    averageTime,
    throughput,
    memoryUsage: {
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      heapTotal: endMemory.heapTotal - startMemory.heapTotal,
    },
  }
}

describe('Schema Validation Performance Benchmarks', () => {
  let testDb: TestDatabase

  beforeEach(async () => {
    testDb = await createTestDatabase()
  })

  afterEach(async () => {
    await testDb.cleanup()
  })

  describe('Schema Validation Performance', () => {
    it('should validate 1000 memories efficiently', async () => {
      const memories = Array.from({ length: 1000 }, (_, i) =>
        createTestMemoryInput({ id: `perf-memory-${i}` }),
      )

      const result = await measurePerformance('memory validation', 1000, () => {
        return memories.map((memory) => validateMemory(memory))
      })

      // Performance expectations
      expect(result.totalTime).toBeLessThan(1000) // Less than 1 second total
      expect(result.averageTime).toBeLessThan(1) // Less than 1ms per validation
      expect(result.throughput).toBeGreaterThan(1000) // More than 1000 validations/second

      console.log('Memory Validation Performance:', {
        totalTime: `${result.totalTime.toFixed(2)}ms`,
        averageTime: `${result.averageTime.toFixed(4)}ms`,
        throughput: `${result.throughput.toFixed(0)} validations/second`,
        memoryUsed: `${(result.memoryUsage!.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      })
    })

    it('should validate emotional contexts efficiently', async () => {
      const contexts = Array.from({ length: 1000 }, (_, i) =>
        createTestEmotionalContextInput({ id: `perf-emotion-${i}` }),
      )

      const result = await measurePerformance(
        'emotional context validation',
        1000,
        () => {
          return contexts.map((context) => validateEmotionalContext(context))
        },
      )

      expect(result.totalTime).toBeLessThan(500) // Less than 500ms total
      expect(result.averageTime).toBeLessThan(0.5) // Less than 0.5ms per validation
      expect(result.throughput).toBeGreaterThan(2000) // More than 2000 validations/second

      console.log('Emotional Context Validation Performance:', {
        totalTime: `${result.totalTime.toFixed(2)}ms`,
        averageTime: `${result.averageTime.toFixed(4)}ms`,
        throughput: `${result.throughput.toFixed(0)} validations/second`,
      })
    })

    it('should validate relationship dynamics efficiently', async () => {
      const dynamics = Array.from({ length: 1000 }, (_, i) =>
        createTestRelationshipDynamicsInput({ id: `perf-dynamics-${i}` }),
      )

      const result = await measurePerformance(
        'relationship dynamics validation',
        1000,
        () => {
          return dynamics.map((dynamic) =>
            validateRelationshipDynamics(dynamic),
          )
        },
      )

      expect(result.totalTime).toBeLessThan(500) // Less than 500ms total
      expect(result.averageTime).toBeLessThan(0.5) // Less than 0.5ms per validation
      expect(result.throughput).toBeGreaterThan(2000) // More than 2000 validations/second

      console.log('Relationship Dynamics Validation Performance:', {
        totalTime: `${result.totalTime.toFixed(2)}ms`,
        averageTime: `${result.averageTime.toFixed(4)}ms`,
        throughput: `${result.throughput.toFixed(0)} validations/second`,
      })
    })
  })

  describe('Database Operations Performance', () => {
    it('should create 100 memories with validation efficiently', async () => {
      const memoryDb = createTestMemoryDatabase(testDb.client)
      const memories = Array.from({ length: 100 }, (_, i) =>
        createTestMemoryInput({ id: `db-perf-memory-${i}` }),
      )

      const result = await measurePerformance(
        'database memory creation',
        100,
        async () => {
          const results = await Promise.all(
            memories.map((memory) => memoryDb.createMemory(memory)),
          )
          // Verify all succeeded
          expect(results.every((r) => r.success)).toBe(true)
          return results
        },
      )

      expect(result.totalTime).toBeLessThan(5000) // Less than 5 seconds total
      expect(result.averageTime).toBeLessThan(50) // Less than 50ms per creation
      expect(result.throughput).toBeGreaterThan(20) // More than 20 creations/second

      console.log('Database Memory Creation Performance:', {
        totalTime: `${result.totalTime.toFixed(2)}ms`,
        averageTime: `${result.averageTime.toFixed(2)}ms`,
        throughput: `${result.throughput.toFixed(1)} creations/second`,
        memoryUsed: `${(result.memoryUsage!.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      })
    })

    it('should handle batch processing efficiently', async () => {
      const processor = createMemoryProcessor(testDb.client, {
        batchSize: 50,
        logProgress: false,
      })

      const memories = Array.from({ length: 500 }, (_, i) =>
        createTestMemoryInput({ id: `batch-perf-memory-${i}` }),
      )

      const result = await measurePerformance(
        'batch memory processing',
        500,
        async () => {
          const processingResult = await processor.processMemories(memories)
          expect(processingResult.successful).toBe(500)
          return processingResult
        },
      )

      expect(result.totalTime).toBeLessThan(10000) // Less than 10 seconds total
      expect(result.averageTime).toBeLessThan(20) // Less than 20ms per memory
      expect(result.throughput).toBeGreaterThan(50) // More than 50 memories/second

      console.log('Batch Processing Performance:', {
        totalTime: `${result.totalTime.toFixed(2)}ms`,
        averageTime: `${result.averageTime.toFixed(2)}ms`,
        throughput: `${result.throughput.toFixed(1)} memories/second`,
        memoryUsed: `${(result.memoryUsage!.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      })
    })
  })

  describe('Memory Usage Benchmarks', () => {
    it('should validate large datasets without excessive memory usage', async () => {
      const largeDataset = Array.from({ length: 5000 }, (_, i) =>
        createTestMemoryInput({
          id: `large-dataset-${i}`,
          summary: `Large dataset memory ${i} with extended content to test memory usage patterns and validation performance under realistic load conditions.`,
        }),
      )

      const initialMemory = process.memoryUsage()

      // Validate in chunks to simulate real-world usage
      const chunkSize = 100
      const results = []

      for (let i = 0; i < largeDataset.length; i += chunkSize) {
        const chunk = largeDataset.slice(i, i + chunkSize)
        const chunkResults = chunk.map((memory) => validateMemory(memory))
        results.push(...chunkResults)

        // Force garbage collection between chunks if available
        if (global.gc && i % 500 === 0) {
          global.gc()
        }
      }

      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed

      // Memory usage should be reasonable (less than 50MB increase)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)

      // All validations should succeed
      expect(results.every((r) => r.isValid)).toBe(true)

      console.log('Large Dataset Memory Usage:', {
        itemCount: largeDataset.length,
        memoryIncrease: `${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
        averageMemoryPerItem: `${(memoryIncrease / largeDataset.length).toFixed(0)} bytes`,
        allValidationsSucceeded: results.every((r) => r.isValid),
      })
    })

    it('should handle concurrent validations efficiently', async () => {
      const concurrentBatches = 10
      const itemsPerBatch = 100

      const batches = Array.from(
        { length: concurrentBatches },
        (_, batchIndex) =>
          Array.from({ length: itemsPerBatch }, (_, itemIndex) =>
            createTestMemoryInput({
              id: `concurrent-${batchIndex}-${itemIndex}`,
            }),
          ),
      )

      const result = await measurePerformance(
        'concurrent validation',
        concurrentBatches * itemsPerBatch,
        async () => {
          // Run all batches concurrently
          const batchPromises = batches.map(async (batch) => {
            return batch.map((memory) => validateMemory(memory))
          })

          const results = await Promise.all(batchPromises)
          return results.flat()
        },
      )

      expect(result.totalTime).toBeLessThan(2000) // Less than 2 seconds total
      expect(result.throughput).toBeGreaterThan(500) // More than 500 validations/second

      console.log('Concurrent Validation Performance:', {
        batches: concurrentBatches,
        itemsPerBatch,
        totalTime: `${result.totalTime.toFixed(2)}ms`,
        throughput: `${result.throughput.toFixed(0)} validations/second`,
        memoryUsed: `${(result.memoryUsage!.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      })
    })
  })

  describe('Regression Prevention', () => {
    it('should maintain consistent performance across multiple runs', async () => {
      const testData = Array.from({ length: 100 }, (_, i) =>
        createTestMemoryInput({ id: `regression-test-${i}` }),
      )

      const runs = 5
      const results: number[] = []

      for (let run = 0; run < runs; run++) {
        const startTime = process.hrtime.bigint()

        testData.forEach((memory) => validateMemory(memory))

        const endTime = process.hrtime.bigint()
        const duration = Number(endTime - startTime) / 1_000_000
        results.push(duration)
      }

      const averageTime = results.reduce((sum, time) => sum + time, 0) / runs
      const maxTime = Math.max(...results)
      const minTime = Math.min(...results)
      const variance = maxTime - minTime

      // Performance should be consistent (variance less than 50% of average)
      expect(variance).toBeLessThan(averageTime * 0.5)

      console.log('Performance Consistency:', {
        runs,
        averageTime: `${averageTime.toFixed(2)}ms`,
        minTime: `${minTime.toFixed(2)}ms`,
        maxTime: `${maxTime.toFixed(2)}ms`,
        variance: `${variance.toFixed(2)}ms`,
        variancePercentage: `${((variance / averageTime) * 100).toFixed(1)}%`,
      })
    })
  })
})

/**
 * Export utility for running performance benchmarks
 */
export async function runPerformanceBenchmarks(): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = []

  // Basic validation benchmarks
  const memories = Array.from({ length: 1000 }, (_, i) =>
    createTestMemoryInput({ id: `benchmark-${i}` }),
  )

  const memoryValidationResult = await measurePerformance(
    'memory validation',
    1000,
    () => memories.map((memory) => validateMemory(memory)),
  )
  results.push(memoryValidationResult)

  return results
}

/**
 * Performance thresholds for CI/CD validation
 */
export const PERFORMANCE_THRESHOLDS = {
  MEMORY_VALIDATION_MS_PER_ITEM: 1,
  EMOTIONAL_CONTEXT_VALIDATION_MS_PER_ITEM: 0.5,
  RELATIONSHIP_DYNAMICS_VALIDATION_MS_PER_ITEM: 0.5,
  DATABASE_CREATION_MS_PER_ITEM: 50,
  BATCH_PROCESSING_ITEMS_PER_SECOND: 50,
  MAX_MEMORY_USAGE_MB: 50,
  CONCURRENT_VALIDATION_ITEMS_PER_SECOND: 500,
} as const
