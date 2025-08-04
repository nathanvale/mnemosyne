import { PrismaClient } from '@studio/db'
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'

import { MoodScoreStorageService } from '../mood-score-storage'
import { TestDataFactory } from '../test-data-factory'
import { WorkerDatabaseFactory } from './worker-database-factory'

// Test configuration
const PERFORMANCE_THRESHOLD_MS = 2000 // 2 seconds
const TEST_DATASET_SIZE = 50 // Smaller dataset for testing

describe('Query Performance - Task 6.7 (Simplified)', () => {
  let prisma: PrismaClient
  let moodScoreService: MoodScoreStorageService
  let testDataFactory: TestDataFactory
  let testMemoryIds: string[]

  beforeAll(async () => {
    // Use worker-specific database for isolation
    prisma = await WorkerDatabaseFactory.createWorkerPrismaClient()

    moodScoreService = new MoodScoreStorageService(prisma)
    testDataFactory = new TestDataFactory(prisma)
  }, 30000) // 30 second timeout for setup

  beforeEach(async () => {
    // Clean up any existing test data
    await WorkerDatabaseFactory.cleanWorkerData(prisma)

    // Create test dataset for performance testing
    console.log(
      `Creating ${TEST_DATASET_SIZE} test records for performance testing...`,
    )
    testMemoryIds = await createTestDataset()
    console.log('Test dataset created successfully')
  }, 30000) // 30 second timeout for setup

  afterAll(async () => {
    await WorkerDatabaseFactory.cleanup()
  })

  async function createTestDataset(): Promise<string[]> {
    const memoryIds: string[] = []

    for (let i = 0; i < TEST_DATASET_SIZE; i++) {
      const timestamp = Date.now() + i // Ensure unique timestamps
      const randomSuffix = Math.random().toString(36).substring(7)

      // Use TestDataFactory.createMoodScore() which handles Memory creation and foreign key constraints
      const { memoryId } = await testDataFactory.createMoodScore({
        score: 5.0 + (i % 5), // Vary scores 5.0-9.0
        confidence: 0.8 + (i % 2) * 0.1, // Vary confidence 0.8-0.9
        descriptors: ['positive', 'stable', 'engaged'],
        algorithmVersion: 'v1.0.0',
        processingTimeMs: 150 + (i % 50), // Vary processing time
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
      })

      memoryIds.push(memoryId)

      // Add small delay every 10 iterations to ensure timestamp uniqueness
      if (i % 10 === 0 && i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1))
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

  describe('Mood Score Query Performance', () => {
    it('should retrieve mood scores by memory ID within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await moodScoreService.getMoodScoresByMemoryId(testMemoryIds[0])
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Mood score retrieval took ${timeMs.toFixed(2)}ms`)
    })

    it('should retrieve mood scores by confidence range within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        return await moodScoreService.getMoodScoresByConfidenceRange(
          0.8,
          1.0,
          25,
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
        return await moodScoreService.getMoodScoresByScoreRange(7.0, 9.0, 25)
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Mood score range query took ${timeMs.toFixed(2)}ms`)
    })

    it('should retrieve recent mood scores within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        const since = new Date(Date.now() - 86400000) // Last 24 hours
        return await moodScoreService.getRecentMoodScores(since, 25)
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Recent mood scores query took ${timeMs.toFixed(2)}ms`)
    })
  })

  describe('Complex Analytical Query Performance', () => {
    it('should perform complex mood analysis retrieval within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        // Simulate a complex query that might be used in mood analysis dashboard
        const [moodScoresByScore, moodScoresByConfidence] = await Promise.all([
          moodScoreService.getMoodScoresByScoreRange(6.0, 9.0, 20),
          moodScoreService.getMoodScoresByConfidenceRange(0.8, 1.0, 20),
        ])

        return { moodScoresByScore, moodScoresByConfidence }
      })

      expect(result.moodScoresByScore).toBeDefined()
      expect(result.moodScoresByConfidence).toBeDefined()
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Complex parallel query took ${timeMs.toFixed(2)}ms`)
    })

    it('should perform memory-based analysis aggregation within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        // Get comprehensive analysis for a specific memory
        const memoryId = testMemoryIds[0]
        const moodScores =
          await moodScoreService.getMoodScoresByMemoryId(memoryId)
        return { moodScores }
      })

      expect(result.moodScores).toBeDefined()
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Memory-based aggregation took ${timeMs.toFixed(2)}ms`)
    })
  })

  describe('Database Connection and Transaction Performance', () => {
    it('should handle multiple concurrent queries within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        // Simulate multiple concurrent users accessing the system
        const concurrentQueries = Array(5)
          .fill(null)
          .map((_, i) =>
            moodScoreService.getMoodScoresByMemoryId(
              testMemoryIds[i % testMemoryIds.length],
            ),
          )

        return await Promise.all(concurrentQueries)
      })

      expect(result).toHaveLength(5)
      expect(result.every((r) => Array.isArray(r))).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`5 concurrent queries took ${timeMs.toFixed(2)}ms`)
    })

    it('should handle large result set pagination within 2 seconds', async () => {
      const { result, timeMs } = await measureQueryTime(async () => {
        // Test pagination performance with large result sets
        const recentScores = await moodScoreService.getRecentMoodScores(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
          TEST_DATASET_SIZE, // All records
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
      const runs = 3
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
  })
})
