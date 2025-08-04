import { PrismaClient } from '@studio/db'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { DeltaHistoryStorageService } from '../delta-history-storage'
import { MoodScoreStorageService } from '../mood-score-storage'
import { ValidationResultStorageService } from '../validation-result-storage'
import { TestDataFactory } from './test-data-factory'
import { WorkerDatabaseFactory } from './worker-database-factory'

// Test configuration
const LARGE_DATASET_SIZE = 100 // Number of records for schema optimization testing

describe('Database Schema Optimization - Task 6.8', () => {
  let prisma: PrismaClient
  let moodScoreService: MoodScoreStorageService
  let deltaHistoryService: DeltaHistoryStorageService
  let validationService: ValidationResultStorageService
  let testDataFactory: TestDataFactory
  let testMemoryIds: string[]

  beforeAll(async () => {
    // Use worker-specific database for isolation
    prisma = await WorkerDatabaseFactory.createWorkerPrismaClient()

    moodScoreService = new MoodScoreStorageService(prisma)
    deltaHistoryService = new DeltaHistoryStorageService(prisma)
    validationService = new ValidationResultStorageService(prisma)
    testDataFactory = new TestDataFactory(prisma)

    // Clean up any existing test data for isolation
    await WorkerDatabaseFactory.cleanWorkerData(prisma)

    // Create large dataset for performance testing
    console.log(
      `Creating ${LARGE_DATASET_SIZE} test records for schema optimization testing...`,
    )
    testMemoryIds = await createLargeDataset()
    console.log('Test dataset created successfully')
  }, 60000) // 60 second timeout for dataset creation

  afterAll(async () => {
    await WorkerDatabaseFactory.cleanup()
  })

  async function createLargeDataset(): Promise<string[]> {
    const memoryIds: string[] = []

    for (let i = 0; i < LARGE_DATASET_SIZE; i++) {
      // Use TestDataFactory to create complete test data with proper relationships
      const result = await testDataFactory.createCompleteTestData({
        memoryOptions: {
          id: `opt-memory-${i}-${Date.now()}`,
          sourceMessageIds: [i, i + 1, i + 2],
          participants: [{ id: `user${i}`, name: `Test User ${i}` }],
          summary: `Optimization test memory ${i}`,
          confidence: 5 + (i % 5), // Vary confidence 5-9
        },
        moodScoreOptions: {
          score: 3.0 + (i % 7), // Vary scores 3.0-9.0
          confidence: 0.5 + (i % 3) * 0.2, // Vary confidence 0.5-0.9
          descriptors: ['test', 'optimization', 'analysis'],
          algorithmVersion: `v1.${i % 3}.0`, // Vary algorithm versions
          processingTimeMs: 100 + (i % 100),
          factors: [
            {
              type: (
                [
                  'sentiment_analysis',
                  'psychological_indicators',
                  'relationship_context',
                ] as const
              )[i % 3],
              weight: 0.3 + (i % 3) * 0.1,
              description: `Test factor ${i}`,
              evidence: ['test evidence'],
              _score: 5 + (i % 5),
            },
          ],
        },
        deltasOptions: {
          deltas: [
            {
              magnitude: 1.0 + (i % 4),
              direction: (['positive', 'negative', 'neutral'] as const)[i % 3],
              type: (
                ['mood_repair', 'celebration', 'decline', 'plateau'] as const
              )[i % 4],
              confidence: 0.6 + (i % 2) * 0.2,
              factors: ['test_factor'],
            },
          ],
        },
      })
      memoryIds.push(result.memoryId)
      // Create validation result for every 3rd record
      if (i % 3 === 0) {
        await validationService.storeValidationResult({
          memoryId: result.memoryId,
          humanScore: 5.0 + (i % 5),
          algorithmScore: 4.5 + (i % 5),
          agreement: 0.7 + (i % 3) * 0.1,
          discrepancy: 0.3 + (i % 2) * 0.2,
          validatorId: `validator-${i % 3}`,
          validationMethod: (
            ['expert_review', 'crowd_sourced', 'comparative_analysis'] as const
          )[i % 3],
          biasIndicators: [],
          accuracyMetrics: [],
          validatedAt: new Date(Date.now() - i * 900000), // 15 min intervals
        })
      }
    }
    return memoryIds
  }

  function measureQueryTime<T>(
    fn: () => Promise<T>,
  ): Promise<{ result: T; timeMs: number }> {
    return new Promise(async (resolve) => {
      const startTime = performance.now()
      const result = await fn()
      const endTime = performance.now()
      const timeMs = endTime - startTime
      resolve({ result, timeMs })
    })
  }

  describe('Mood Score Index Optimization', () => {
    it('should efficiently query by score range using score index', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await moodScoreService.getMoodScoresByScoreRange(6.0, 9.0, 20)
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(100) // Should be very fast with index
      console.log(`Score range query with index took ${timeMs.toFixed(2)}ms`)
    })

    it('should efficiently query by confidence range using confidence index', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await moodScoreService.getMoodScoresByConfidenceRange(
          0.7,
          1.0,
          20,
        )
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(100) // Should be very fast with index
      console.log(
        `Confidence range query with index took ${timeMs.toFixed(2)}ms`,
      )
    })

    it('should efficiently query recent scores using calculatedAt index', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        const since = new Date(Date.now() - 86400000) // Last 24 hours
        return await moodScoreService.getRecentMoodScores(since, 20)
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(100) // Should be very fast with index
      console.log(
        `Recent scores query with calculatedAt index took ${timeMs.toFixed(2)}ms`,
      )
    })

    it('should efficiently query by memory and time using composite index', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await moodScoreService.getMoodScoresByMemoryId(testMemoryIds[0])
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(50) // Should be extremely fast with specific memory lookup
      console.log(
        `Memory-specific query with composite index took ${timeMs.toFixed(2)}ms`,
      )
    })
  })

  describe('Delta Detection Index Optimization', () => {
    it('should efficiently query deltas by significance using significance index', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await deltaHistoryService.getDeltasBySignificance(3.0, 20)
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(100) // Should be fast with significance index
      console.log(
        `Delta significance query with index took ${timeMs.toFixed(2)}ms`,
      )
    })

    it('should efficiently query delta history by memory using memoryId index', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await deltaHistoryService.getDeltaHistoryByMemoryId(
          testMemoryIds[0],
        )
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(50) // Should be very fast with memory index
      console.log(
        `Delta history by memory query with index took ${timeMs.toFixed(2)}ms`,
      )
    })

    it('should efficiently query temporal delta sequences using composite index', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        const timeWindow = 7 * 24 * 60 * 60 * 1000 // 7 days
        return await deltaHistoryService.getTemporalDeltaSequence(
          testMemoryIds[0],
          timeWindow,
        )
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(100) // Should be fast with memory + time index
      console.log(
        `Temporal delta sequence query with composite index took ${timeMs.toFixed(2)}ms`,
      )
    })

    it('should efficiently query delta patterns using pattern indexes', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await deltaHistoryService.getDeltaPatternsByMemoryId(
          testMemoryIds[0],
        )
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(100) // Should be fast with pattern indexes
      console.log(
        `Delta patterns query with indexes took ${timeMs.toFixed(2)}ms`,
      )
    })

    it('should efficiently query turning points using significance index', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await deltaHistoryService.getTurningPointsByMemoryId(
          testMemoryIds[0],
        )
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(100) // Should be fast with turning point indexes
      console.log(
        `Turning points query with indexes took ${timeMs.toFixed(2)}ms`,
      )
    })
  })

  describe('Validation Result Index Optimization', () => {
    it('should efficiently query by validation method using method index', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await validationService.getValidationResults({
          validationMethod: 'expert_review',
          limit: 10,
        })
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(100) // Should be fast with method index
      console.log(
        `Validation method query with index took ${timeMs.toFixed(2)}ms`,
      )
    })

    it('should efficiently query by agreement range using agreement index', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await validationService.getValidationResults({
          minAgreement: 0.8,
          limit: 10,
        })
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(100) // Should be fast with agreement index
      console.log(
        `Agreement range query with index took ${timeMs.toFixed(2)}ms`,
      )
    })

    it('should efficiently query validator performance using composite indexes', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await validationService.getValidatorPerformanceComparison()
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(150) // Should be reasonably fast with validator indexes
      console.log(
        `Validator performance comparison with indexes took ${timeMs.toFixed(2)}ms`,
      )
    })

    it('should efficiently aggregate statistics using multiple indexes', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await validationService.getAggregateAccuracyStatistics()
      })

      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
      expect(timeMs).toBeLessThan(200) // Should be reasonably fast with various indexes
      console.log(
        `Aggregate statistics calculation with indexes took ${timeMs.toFixed(2)}ms`,
      )
    })
  })

  describe('Complex Multi-Table Query Optimization', () => {
    it('should efficiently perform complex mood analysis dashboard query', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        // Simulate complex dashboard query using multiple optimized indexes
        const [moodScores, significantDeltas, recentValidations] =
          await Promise.all([
            moodScoreService.getMoodScoresByScoreRange(7.0, 10.0, 10),
            deltaHistoryService.getDeltasBySignificance(4.0, 10),
            validationService.getValidationResults({
              minAgreement: 0.8,
              limit: 10,
            }),
          ])

        return { moodScores, significantDeltas, recentValidations }
      })

      expect(result.moodScores).toBeDefined()
      expect(result.significantDeltas).toBeDefined()
      expect(result.recentValidations).toBeDefined()
      expect(timeMs).toBeLessThan(300) // Should be fast with all indexes
      console.log(
        `Complex dashboard query with optimized indexes took ${timeMs.toFixed(2)}ms`,
      )
    })

    it('should efficiently perform comprehensive memory analysis', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        const memoryId = testMemoryIds[0]
        // Comprehensive analysis using memory-specific indexes
        const [moodScores, deltaHistory, patterns, turningPoints] =
          await Promise.all([
            moodScoreService.getMoodScoresByMemoryId(memoryId),
            deltaHistoryService.getDeltaHistoryByMemoryId(memoryId),
            deltaHistoryService.getDeltaPatternsByMemoryId(memoryId),
            deltaHistoryService.getTurningPointsByMemoryId(memoryId),
          ])

        return { moodScores, deltaHistory, patterns, turningPoints }
      })

      expect(result.moodScores).toBeDefined()
      expect(result.deltaHistory).toBeDefined()
      expect(result.patterns).toBeDefined()
      expect(result.turningPoints).toBeDefined()
      expect(timeMs).toBeLessThan(200) // Should be very fast with memory-specific indexes
      console.log(
        `Comprehensive memory analysis with optimized indexes took ${timeMs.toFixed(2)}ms`,
      )
    })
  })

  describe('Index Performance Validation', () => {
    it('should demonstrate index efficiency with concurrent queries', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        // Run multiple different types of queries concurrently
        const concurrentQueries = [
          moodScoreService.getMoodScoresByScoreRange(6.0, 8.0, 5),
          moodScoreService.getMoodScoresByConfidenceRange(0.7, 0.9, 5),
          deltaHistoryService.getDeltasBySignificance(3.0, 5),
          validationService.getValidationResults({
            minAgreement: 0.8,
            limit: 5,
          }),
          moodScoreService.getRecentMoodScores(
            new Date(Date.now() - 86400000),
            5,
          ),
        ]

        return await Promise.all(concurrentQueries)
      })

      expect(result).toHaveLength(5)
      expect(result.every((r) => Array.isArray(r))).toBe(true)
      expect(timeMs).toBeLessThan(500) // Should handle concurrency well with indexes
      console.log(
        `5 concurrent different queries with indexes took ${timeMs.toFixed(2)}ms`,
      )
    })

    it('should maintain performance with repeated queries (index caching)', async () => {
      const runs = 3
      const times: number[] = []

      for (let i = 0; i < runs; i++) {
        const { timeMs } = await measureQueryTime(async () => {
          return await moodScoreService.getMoodScoresByScoreRange(7.0, 9.0, 10)
        })
        times.push(timeMs)
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length
      const maxTime = Math.max(...times)

      expect(avgTime).toBeLessThan(100) // Should maintain good performance
      expect(maxTime).toBeLessThan(150) // No single query should be slow

      console.log(
        `Repeated query performance: avg=${avgTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms`,
      )
    })
  })
})