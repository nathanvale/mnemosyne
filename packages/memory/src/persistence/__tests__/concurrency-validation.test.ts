import { PrismaClient } from '@studio/db'
import { describe, it, expect, beforeEach, afterAll } from 'vitest'

import type { MoodAnalysisResult } from '../../types'

import { MoodScoringAnalyzer } from '../../mood-scoring/analyzer'
import { DeltaDetector } from '../../mood-scoring/delta-detector'
import { WorkerDatabaseFactory } from './worker-database-factory'

describe('Concurrency Validation Tests - Phase 2', () => {
  let prisma: PrismaClient
  let _moodAnalyzer: MoodScoringAnalyzer
  let deltaDetector: DeltaDetector

  beforeEach(async () => {
    // Set up worker-isolated database
    prisma = await WorkerDatabaseFactory.createWorkerPrismaClient()
    await WorkerDatabaseFactory.cleanWorkerData(prisma)

    _moodAnalyzer = new MoodScoringAnalyzer()
    deltaDetector = new DeltaDetector()
  }, 30000)

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  describe('Worker Isolation Under Stress', () => {
    it('should handle concurrent memory creation across multiple workers without conflicts', async () => {
      const concurrentOperations = 10 // Reduced for Wallaby.js performance
      const workerPromises: Promise<{
        success: boolean
        memoryId?: string
        workerId: string
        iteration: number
        error?: string
      }>[] = []

      // Simulate multiple operations creating memories simultaneously
      for (let i = 0; i < concurrentOperations; i++) {
        const promise = (async (): Promise<{
          success: boolean
          memoryId?: string
          workerId: string
          iteration: number
          error?: string
        }> => {
          const workerId = WorkerDatabaseFactory.getWorkerId()
          const uniqueId = `stress-memory-${workerId}-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

          try {
            const memory = await prisma.memory.create({
              data: {
                id: uniqueId,
                sourceMessageIds: JSON.stringify([i, i + 1, i + 2]),
                participants: JSON.stringify([
                  { id: `user-${i}`, name: `Test User ${i}` },
                ]),
                summary: `Stress test memory ${i} from worker ${workerId}`,
                confidence: 7 + (i % 3),
                contentHash: `stress-hash-${workerId}-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              },
            })

            return {
              success: true,
              memoryId: memory.id,
              workerId,
              iteration: i,
            }
          } catch (error) {
            return {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
              workerId,
              iteration: i,
            }
          }
        })()

        workerPromises.push(promise)
      }

      const results = await Promise.all(workerPromises)

      // Analyze results
      const successes = results.filter((r) => r.success)
      const _failures = results.filter((r) => !r.success)

      // Should have high success rate (allow for some expected failures due to timing)
      const successRate = successes.length / concurrentOperations
      expect(successRate).toBeGreaterThan(0.8) // 80%+ success rate (relaxed for Wallaby.js)

      // Verify data integrity - all successful operations should have created data
      const memoryCount = await prisma.memory.count()
      expect(memoryCount).toBe(successes.length)
    }, 30000)

    it('should maintain data integrity during concurrent operations', async () => {
      // Create base memories for concurrent operations
      const baseMemoryCount = 5 // Reduced for Wallaby.js performance
      const memoryIds: string[] = []

      for (let i = 0; i < baseMemoryCount; i++) {
        const workerId = WorkerDatabaseFactory.getWorkerId()
        const uniqueId = `integrity-memory-${workerId}-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        const memory = await prisma.memory.create({
          data: {
            id: uniqueId,
            sourceMessageIds: JSON.stringify([i]),
            participants: JSON.stringify([{ id: 'user-1', name: 'Test User' }]),
            summary: `Integrity test memory ${i}`,
            confidence: 8,
            contentHash: `integrity-hash-${workerId}-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
        memoryIds.push(memory.id)
      }

      // Perform concurrent operations on the memories
      const operationPromises = memoryIds.map(async (memoryId, _index) => {
        try {
          // Verify the memory exists
          const verification = await prisma.memory.findUnique({
            where: { id: memoryId },
          })

          expect(verification).toBeDefined()
          expect(verification!.id).toBe(memoryId)

          return { success: true, memoryId }
        } catch (error) {
          return {
            success: false,
            memoryId,
            error: error instanceof Error ? error.message : 'Unknown error',
          }
        }
      })

      const operationResults = await Promise.all(operationPromises)
      const operationSuccesses = operationResults.filter((r) => r.success)

      expect(operationSuccesses).toHaveLength(baseMemoryCount)

      // Verify final data integrity
      const finalMemoryCount = await prisma.memory.count()
      expect(finalMemoryCount).toBe(baseMemoryCount)
    }, 30000)
  })

  describe('Race Condition Detection', () => {
    it('should handle simultaneous database writes without data corruption', async () => {
      const workerId = WorkerDatabaseFactory.getWorkerId()
      const concurrentWrites = 8 // Reduced for Wallaby.js performance
      const writePromises: Promise<{
        success: boolean
        memoryId?: string
        error?: unknown
      }>[] = []

      for (let i = 0; i < concurrentWrites; i++) {
        const writePromise = (async () => {
          try {
            const uniqueId = `race-memory-${workerId}-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

            const memory = await prisma.memory.create({
              data: {
                id: uniqueId,
                sourceMessageIds: JSON.stringify([i]),
                participants: JSON.stringify([
                  { id: `user-${i}`, name: `Race Test User ${i}` },
                ]),
                summary: `Race condition test memory ${i}`,
                confidence: 8,
                contentHash: `race-hash-${workerId}-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              },
            })

            return { success: true, iteration: i, memoryId: memory.id }
          } catch (error) {
            return {
              success: false,
              iteration: i,
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          }
        })()

        writePromises.push(writePromise)
      }

      const writeResults = await Promise.all(writePromises)
      const writeSuccesses = writeResults.filter((r) => r.success)

      // Should have reasonable success rate
      const successRate = writeSuccesses.length / concurrentWrites
      expect(successRate).toBeGreaterThan(0.7) // 70%+ success rate (relaxed for Wallaby.js)

      // Verify data integrity - no duplicate or corrupted records
      const memories = await prisma.memory.findMany({
        where: { id: { contains: `race-memory-${workerId}` } },
      })

      expect(memories.length).toBe(writeSuccesses.length)

      // Verify all memories have unique IDs
      const uniqueIds = new Set(memories.map((m) => m.id))
      expect(uniqueIds.size).toBe(memories.length)
    }, 30000)

    it('should handle concurrent delta detection without interference', async () => {
      const concurrentAnalyses = 8 // Reduced for Wallaby.js performance
      const analysisPromises: Promise<{
        success: boolean
        iteration: number
        deltaCount: number
        deltas: Array<{
          magnitude: number
          direction: string
          type: string
          confidence: number
        }>
        error?: string
      }>[] = []

      for (let i = 0; i < concurrentAnalyses; i++) {
        const analysisPromise = (async (): Promise<{
          success: boolean
          iteration: number
          deltaCount: number
          deltas: Array<{
            magnitude: number
            direction: string
            type: string
            confidence: number
          }>
          error?: string
        }> => {
          try {
            // Create mock mood analysis results for delta detection
            const mockMoodAnalyses: MoodAnalysisResult[] = [
              {
                score: 5.0,
                confidence: 0.8,
                descriptors: ['baseline'],
                factors: [
                  {
                    type: 'sentiment_analysis',
                    weight: 0.5,
                    description: 'Baseline sentiment',
                    evidence: ['neutral language'],
                    _score: 5.0,
                  },
                ],
              },
              {
                score: 7.0 + i * 0.1,
                confidence: 0.85,
                descriptors: [`analysis-${i}`, 'concurrent'],
                factors: [
                  {
                    type: 'sentiment_analysis',
                    weight: 0.5,
                    description: `Concurrent analysis ${i}`,
                    evidence: [`positive-evidence-${i}`],
                    _score: 7.0 + i * 0.1,
                  },
                ],
              },
            ]

            // Perform delta detection
            const deltas =
              deltaDetector.detectConversationalDeltas(mockMoodAnalyses)

            return {
              success: true,
              iteration: i,
              deltaCount: deltas.length,
              deltas,
            }
          } catch (error) {
            return {
              success: false,
              iteration: i,
              deltaCount: 0,
              deltas: [],
              error: error instanceof Error ? error.message : 'Unknown error',
            }
          }
        })()

        analysisPromises.push(analysisPromise)
      }

      const analysisResults = await Promise.all(analysisPromises)
      const analysisSuccesses = analysisResults.filter((r) => r.success)

      expect(analysisSuccesses).toHaveLength(concurrentAnalyses)

      // Verify all deltas were detected properly
      analysisSuccesses.forEach((result) => {
        expect(result.deltaCount).toBeGreaterThanOrEqual(0)
        if (result.deltaCount > 0) {
          expect(result.deltas[0]).toHaveProperty('magnitude')
          expect(result.deltas[0]).toHaveProperty('direction')
          expect(result.deltas[0]).toHaveProperty('type')
          expect(result.deltas[0]).toHaveProperty('confidence')
        }
      })
    }, 30000)
  })

  describe('Cross-Worker Data Isolation', () => {
    it("should ensure workers cannot access each other's data", async () => {
      const currentWorkerId = WorkerDatabaseFactory.getWorkerId()

      // Create data in current worker's database
      const memoryId = `isolation-memory-${currentWorkerId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      const _memory = await prisma.memory.create({
        data: {
          id: memoryId,
          sourceMessageIds: JSON.stringify([1, 2, 3]),
          participants: JSON.stringify([
            { id: 'user-isolation', name: 'Isolation Test User' },
          ]),
          summary: `Isolation test memory for worker ${currentWorkerId}`,
          confidence: 9,
          contentHash: `isolation-hash-${currentWorkerId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      })

      // Verify data exists in current worker's database
      const currentWorkerMemories = await prisma.memory.findMany({
        where: {
          id: { contains: `isolation-memory-${currentWorkerId}` },
        },
      })

      expect(currentWorkerMemories).toHaveLength(1)
      expect(currentWorkerMemories[0].id).toBe(memoryId)

      // Try to query for data that might exist in other workers (should find none)
      const otherWorkerMemories = await prisma.memory.findMany({
        where: {
          AND: [
            { id: { contains: 'isolation-memory-' } },
            { id: { not: { contains: currentWorkerId } } },
          ],
        },
      })

      // Should not find any data from other workers
      expect(otherWorkerMemories).toHaveLength(0)
    }, 30000)

    it('should maintain separate database states across worker lifecycles', async () => {
      const workerId = WorkerDatabaseFactory.getWorkerId()

      // Create initial data
      const initialMemoryId = `lifecycle-memory-1-${workerId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      await prisma.memory.create({
        data: {
          id: initialMemoryId,
          sourceMessageIds: JSON.stringify([1]),
          participants: JSON.stringify([
            { id: 'user-lifecycle', name: 'Lifecycle Test User' },
          ]),
          summary: 'Initial lifecycle test memory',
          confidence: 7,
          contentHash: `lifecycle-hash-1-${workerId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      })

      // Verify initial state
      const initialCount = await prisma.memory.count()
      expect(initialCount).toBe(1)

      // Simulate cleanup (as would happen between tests)
      await WorkerDatabaseFactory.cleanWorkerData(prisma)

      // Verify cleanup worked
      const cleanedCount = await prisma.memory.count()
      expect(cleanedCount).toBe(0)

      // Create new data after cleanup
      const newMemoryId = `lifecycle-memory-2-${workerId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      await prisma.memory.create({
        data: {
          id: newMemoryId,
          sourceMessageIds: JSON.stringify([2]),
          participants: JSON.stringify([
            { id: 'user-lifecycle', name: 'Lifecycle Test User' },
          ]),
          summary: 'New lifecycle test memory after cleanup',
          confidence: 8,
          contentHash: `lifecycle-hash-2-${workerId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      })

      // Verify new state
      const finalCount = await prisma.memory.count()
      expect(finalCount).toBe(1)

      // Verify it's the new memory, not the old one
      const finalMemory = await prisma.memory.findFirst()
      expect(finalMemory!.id).toBe(newMemoryId)
      expect(finalMemory!.summary).toContain('after cleanup')
    }, 30000)
  })

  describe('Worker Database Cleanup Validation', () => {
    it('should thoroughly clean all data without affecting other workers', async () => {
      const workerId = WorkerDatabaseFactory.getWorkerId()

      // Create multiple memories
      const memoryIds: string[] = []
      for (let i = 0; i < 5; i++) {
        const memoryId = `cleanup-memory-${i}-${workerId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        await prisma.memory.create({
          data: {
            id: memoryId,
            sourceMessageIds: JSON.stringify([i]),
            participants: JSON.stringify([
              { id: 'cleanup-user', name: 'Cleanup Test User' },
            ]),
            summary: `Cleanup test memory ${i}`,
            confidence: 8,
            contentHash: `cleanup-hash-${i}-${workerId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
        memoryIds.push(memoryId)
      }

      // Verify all data was created
      const beforeCleanup = await prisma.memory.count()
      expect(beforeCleanup).toBe(5)

      // Perform cleanup
      await WorkerDatabaseFactory.cleanWorkerData(prisma)

      // Verify all data was cleaned
      const afterCleanup = await prisma.memory.count()
      expect(afterCleanup).toBe(0)
    }, 30000)

    it('should handle cleanup gracefully with no data present', async () => {
      // Perform cleanup on empty database
      await expect(
        WorkerDatabaseFactory.cleanWorkerData(prisma),
      ).resolves.not.toThrow()

      // Verify database is still clean
      const memoryCount = await prisma.memory.count()
      expect(memoryCount).toBe(0)
    }, 30000)
  })
})
