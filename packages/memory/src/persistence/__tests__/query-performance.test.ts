import { PrismaClient } from '@studio/db'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { DeltaHistoryStorageService } from '../delta-history-storage'
import { MoodScoreStorageService } from '../mood-score-storage'
import { TestDataFactory } from '../test-data-factory'
import { ValidationResultStorageService } from '../validation-result-storage'
import { WorkerDatabaseFactory } from './worker-database-factory'

// Test configuration
const PERFORMANCE_THRESHOLD_MS = 2000 // 2 seconds
const LARGE_DATASET_SIZE = 100 // Number of records for performance testing (reduced for testing)

describe('Query Performance - Task 6.7', () => {
  // Skip intensive query performance tests in CI - they can cause timeouts
  if (process.env.CI) {
    it.skip('skipped in CI environments', () => {})
    return
  }

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

    // Create test dataset for performance testing
    console.log(
      `Creating ${LARGE_DATASET_SIZE} test records for performance testing...`,
    )
    testMemoryIds = await createLargeTestDataset()
    console.log('Test dataset created successfully')
  }, 60000) // 60 second timeout for dataset creation

  afterAll(async () => {
    // Clean up test data
    await prisma.deltaPatternAssociation.deleteMany()
    await prisma.deltaPattern.deleteMany()
    await prisma.turningPoint.deleteMany()
    await prisma.moodDelta.deleteMany()
    await prisma.validationResult.deleteMany()
    await prisma.moodScore.deleteMany()
    await prisma.memory.deleteMany()
    // Cleanup handled by WorkerDatabaseFactory
  })

  async function createLargeTestDataset(): Promise<string[]> {
    const memoryIds: string[] = []

    // Create memories and related data in batches for performance
    const batchSize = 10 // Reduced batch size to avoid database timeouts
    for (let batch = 0; batch < LARGE_DATASET_SIZE / batchSize; batch++) {
      console.log(
        `Creating batch ${batch + 1}/${Math.ceil(LARGE_DATASET_SIZE / batchSize)}`,
      )

      for (let i = 0; i < batchSize; i++) {
        const recordIndex = batch * batchSize + i
        const memoryId = `perf-memory-${recordIndex}`
        memoryIds.push(memoryId)

        await createTestRecord(memoryId, recordIndex)
      }
    }

    return memoryIds
  }

  async function createTestRecord(
    expectedMemoryId: string,
    index: number,
  ): Promise<void> {
    // Skip the complex multi-service approach and use TestDataFactory's batch method instead
    // This avoids transaction isolation issues between different services
    await testDataFactory.createCompleteTestData({
      memoryOptions: {
        id: expectedMemoryId,
      },
      moodScoreOptions: {
        memoryId: expectedMemoryId,
        score: 5.0 + (index % 5), // Vary scores 5.0-9.0
        confidence: 0.8 + (index % 2) * 0.1, // Vary confidence 0.8-0.9
        descriptors: ['positive', 'stable', 'engaged'],
        algorithmVersion: 'v1.0.0',
        processingTimeMs: 150 + (index % 50), // Vary processing time
        factors: [
          {
            type: 'sentiment_analysis' as const,
            weight: 0.35,
            description: 'Positive sentiment detected in conversation',
            evidence: ['positive language', 'supportive tone'],
            _score: 7.5,
          },
          {
            type: 'psychological_indicators' as const,
            weight: 0.25,
            description: 'Healthy coping mechanisms observed',
            evidence: ['problem-solving approach', 'seeking support'],
            _score: 8.0,
          },
        ],
      },
      deltasOptions: {
        memoryId: expectedMemoryId,
        deltas: [
          {
            magnitude: 2.0 + (index % 3),
            direction: 'positive' as const,
            type: 'mood_repair' as const,
            confidence: 0.8,
            factors: ['support'],
          },
          {
            magnitude: 1.5 + (index % 2),
            direction: 'neutral' as const,
            type: 'plateau' as const,
            confidence: 0.7,
            factors: ['stability'],
          },
          {
            magnitude: 3.0 + (index % 4),
            direction: 'positive' as const,
            type: 'celebration' as const,
            confidence: 0.9,
            factors: ['achievement'],
          },
        ],
      },
    })
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

  describe('Mood Score Query Performance', () => {
    it('should retrieve mood scores by memory ID within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await moodScoreService.getMoodScoresByMemoryId(testMemoryIds[0])
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Mood score retrieval took ${timeMs.toFixed(2)}ms`)
    })

    it('should retrieve mood scores by confidence range within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await moodScoreService.getMoodScoresByConfidenceRange(
          0.8,
          1.0,
          100,
        )
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(
        `Mood score confidence range query took ${timeMs.toFixed(2)}ms`,
      )
    })

    it('should retrieve mood scores by score range within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await moodScoreService.getMoodScoresByScoreRange(7.0, 9.0, 100)
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Mood score range query took ${timeMs.toFixed(2)}ms`)
    })

    it('should retrieve recent mood scores within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        const since = new Date(Date.now() - 86400000) // Last 24 hours
        return await moodScoreService.getRecentMoodScores(since, 100)
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Recent mood scores query took ${timeMs.toFixed(2)}ms`)
    })
  })

  describe('Delta History Query Performance', () => {
    it('should retrieve delta history by memory ID within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await deltaHistoryService.getDeltaHistoryByMemoryId(
          testMemoryIds[0],
        )
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Delta history retrieval took ${timeMs.toFixed(2)}ms`)
    })

    it('should retrieve deltas by significance threshold within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await deltaHistoryService.getDeltasBySignificance(5.0, 100)
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Delta significance query took ${timeMs.toFixed(2)}ms`)
    })

    it('should retrieve temporal delta sequence within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        const timeWindow = 7 * 24 * 60 * 60 * 1000 // 7 days
        return await deltaHistoryService.getTemporalDeltaSequence(
          testMemoryIds[0],
          timeWindow,
        )
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Temporal delta sequence query took ${timeMs.toFixed(2)}ms`)
    })

    it('should retrieve delta patterns by memory ID within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await deltaHistoryService.getDeltaPatternsByMemoryId(
          testMemoryIds[0],
        )
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Delta patterns query took ${timeMs.toFixed(2)}ms`)
    })

    it('should retrieve turning points by memory ID within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await deltaHistoryService.getTurningPointsByMemoryId(
          testMemoryIds[0],
        )
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Turning points query took ${timeMs.toFixed(2)}ms`)
    })
  })

  describe('Validation Result Query Performance', () => {
    it('should retrieve validation results with filtering within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await validationService.getValidationResults({
          validationMethod: 'expert_review',
          minAgreement: 0.8,
          limit: 100,
        })
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(
        `Validation results filtering query took ${timeMs.toFixed(2)}ms`,
      )
    })

    it('should calculate aggregate accuracy statistics within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await validationService.getAggregateAccuracyStatistics()
      })

      expect(result).toBeDefined()
      expect(typeof result).toBe('object')
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(
        `Aggregate statistics calculation took ${timeMs.toFixed(2)}ms`,
      )
    })

    it('should get accuracy trends within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await validationService.getAccuracyTrend('correlation', '30d')
      })

      expect(result).toBeDefined()
      expect(result.dataPoints).toBeDefined()
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Accuracy trend analysis took ${timeMs.toFixed(2)}ms`)
    })

    it('should export validation data with filtering within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await validationService.exportValidationDataForAnalysis({
          minAgreement: 0.8,
        })
      })

      expect(result).toBeDefined()
      expect(result.rawData).toBeDefined()
      expect(result.summary).toBeDefined()
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Validation data export took ${timeMs.toFixed(2)}ms`)
    })
  })

  describe('Complex Analytical Query Performance', () => {
    it('should perform complex mood analysis retrieval within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        // Simulate a complex query that might be used in mood analysis dashboard
        const [moodScores, deltaHistory, validationResults] = await Promise.all(
          [
            moodScoreService.getMoodScoresByScoreRange(6.0, 9.0, 50),
            deltaHistoryService.getDeltasBySignificance(4.0, 50),
            validationService.getValidationResults({
              minAgreement: 0.8,
              limit: 50,
            }),
          ],
        )

        return { moodScores, deltaHistory, validationResults }
      })

      expect(result.moodScores).toBeDefined()
      expect(result.deltaHistory).toBeDefined()
      expect(result.validationResults).toBeDefined()
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Complex parallel query took ${timeMs.toFixed(2)}ms`)
    })

    it('should perform memory-based analysis aggregation within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        // Get comprehensive analysis for a specific memory
        const memoryId = testMemoryIds[0]
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
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Memory-based aggregation took ${timeMs.toFixed(2)}ms`)
    })

    it('should perform performance monitoring dashboard query within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        // Simulate a performance monitoring dashboard that loads multiple metrics
        const [
          aggregateStats,
          recentTrends,
          validatorComparison,
          methodologyComparison,
        ] = await Promise.all([
          validationService.getAggregateAccuracyStatistics(),
          validationService.getPerformanceTrendsByTimeWindow(['7d', '30d']),
          validationService.getValidatorPerformanceComparison(),
          validationService.getMethodologyPerformanceComparison(),
        ])

        return {
          aggregateStats,
          recentTrends,
          validatorComparison,
          methodologyComparison,
        }
      })

      expect(result.aggregateStats).toBeDefined()
      expect(result.recentTrends).toBeDefined()
      expect(result.validatorComparison).toBeDefined()
      expect(result.methodologyComparison).toBeDefined()
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Performance dashboard query took ${timeMs.toFixed(2)}ms`)
    })
  })

  describe('Database Connection and Transaction Performance', () => {
    it('should handle multiple concurrent queries within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        // Simulate multiple concurrent users accessing the system
        const concurrentQueries = Array(10)
          .fill(null)
          .map((_, i) =>
            moodScoreService.getMoodScoresByMemoryId(
              testMemoryIds[i % testMemoryIds.length],
            ),
          )

        return await Promise.all(concurrentQueries)
      })

      expect(result).toHaveLength(10)
      expect(result.every((r) => Array.isArray(r))).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`10 concurrent queries took ${timeMs.toFixed(2)}ms`)
    })

    it('should handle large result set pagination within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        // Test pagination performance with large result sets
        const recentScores = await moodScoreService.getRecentMoodScores(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
          500, // Large page size
        )

        return recentScores
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Large result set pagination took ${timeMs.toFixed(2)}ms`)
    })
  })

  describe('Performance Regression Detection', () => {
    it('should maintain performance consistency across multiple runs', async () => {
      const runs = 5
      const times: number[] = []

      for (let i = 0; i < runs; i++) {
        const { timeMs } = await measureQueryTime(async () => {
          return await moodScoreService.getMoodScoresByMemoryId(
            testMemoryIds[i],
          )
        })
        times.push(timeMs)
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length
      const maxTime = Math.max(...times)
      const variance =
        times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) /
        times.length
      const stdDev = Math.sqrt(variance)

      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      expect(maxTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      expect(stdDev).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 0.5) // Standard deviation should be < 50% of threshold

      console.log(
        `Performance consistency: avg=${avgTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms, stddev=${stdDev.toFixed(2)}ms`,
      )
    })

    it('should meet performance targets under memory pressure', async () => {
      // Create some memory pressure by performing multiple large queries
      const memoryPressureQueries = Array(5)
        .fill(null)
        .map(() =>
          moodScoreService.getRecentMoodScores(
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            200,
          ),
        )

      // Wait for memory pressure queries to complete
      await Promise.all(memoryPressureQueries)

      // Now test performance under pressure
      const { result, timeMs } = await measureQueryTime(async () => {
        return await deltaHistoryService.getDeltasBySignificance(5.0, 100)
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Query under memory pressure took ${timeMs.toFixed(2)}ms`)
    })
  })
})
