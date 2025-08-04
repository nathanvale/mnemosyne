import { PrismaClient } from '@studio/db'
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest'

import { DeltaHistoryStorageService } from '../delta-history-storage'
import { TestDataFactory } from './test-data-factory'
import { WorkerDatabaseFactory } from './worker-database-factory'

// Test interfaces for delta history tracking
interface MoodDelta {
  magnitude: number
  direction: 'positive' | 'negative' | 'neutral'
  type: 'mood_repair' | 'celebration' | 'decline' | 'plateau'
  confidence: number
  factors: string[]
}

interface TurningPoint {
  timestamp: Date
  type: 'breakthrough' | 'setback' | 'realization' | 'support_received'
  magnitude: number
  description: string
  factors: string[]
}

describe('Delta Detection History Tracking - Task 6.3', () => {
  let storageService: DeltaHistoryStorageService
  let prisma: PrismaClient
  let testDataFactory: TestDataFactory
  let testMemoryId: string
  let testConversationId: string

  beforeAll(async () => {
    // Use worker-specific database for isolation
    prisma = await WorkerDatabaseFactory.createWorkerPrismaClient()
    storageService = new DeltaHistoryStorageService(prisma)
    testDataFactory = new TestDataFactory(prisma)
  })

  afterAll(async () => {
    await WorkerDatabaseFactory.cleanup()
  })

  beforeEach(async () => {
    testConversationId = `test-conversation-${Date.now()}`

    // Clean up any existing test data for isolation
    await WorkerDatabaseFactory.cleanWorkerData(prisma)

    // Create test memory record using TestDataFactory with complete test data
    try {
      const testData = await testDataFactory.createCompleteTestData()
      testMemoryId = testData.memoryId

      // Verify memory was created
      const verifyMemory = await prisma.memory.findUnique({
        where: { id: testMemoryId },
      })

      if (!verifyMemory) {
        throw new Error(`Failed to create memory with id: ${testMemoryId}`)
      }

      console.log(`✅ Memory created successfully: ${testMemoryId}`)
    } catch (error) {
      console.error('❌ Failed to create test memory:', error)
      throw error
    }
  })

  afterEach(async () => {
    // No need to clean up here as we clean in beforeEach
    // and afterAll handles final cleanup
  })

  describe('Delta History Storage with Significance Scoring', () => {
    it('should store delta history with significance scoring based on magnitude and confidence', async () => {
      const deltas: MoodDelta[] = [
        {
          magnitude: 2.5,
          direction: 'positive',
          type: 'mood_repair',
          confidence: 0.8,
          factors: ['support_received', 'positive_reframing'],
        },
        {
          magnitude: 1.8,
          direction: 'negative',
          type: 'decline',
          confidence: 0.7,
          factors: ['stress_factor', 'external_pressure'],
        },
      ]

      const result = await storageService.storeDeltaHistory(
        testMemoryId,
        testConversationId,
        deltas,
        1800000, // 30 minutes
        new Date(),
      )

      expect(result).toHaveLength(2)
      expect(result[0].significance).toBeGreaterThan(0)
      expect(result[1].significance).toBeGreaterThan(0)
      // Mood repair should have higher significance than decline
      expect(result[0].significance).toBeGreaterThan(result[1].significance)
    })

    it('should apply position-based significance weighting', async () => {
      const deltas: MoodDelta[] = [
        {
          magnitude: 2.0,
          direction: 'positive',
          type: 'mood_repair',
          confidence: 0.8,
          factors: ['early_intervention'],
        },
        {
          magnitude: 2.0,
          direction: 'positive',
          type: 'mood_repair',
          confidence: 0.8,
          factors: ['conclusion_insight'],
        },
      ]

      const result = await storageService.storeDeltaHistory(
        testMemoryId,
        testConversationId,
        deltas,
        1800000,
        new Date(),
      )

      expect(result).toHaveLength(2)
      const earlyDelta = result.find((d) => d.deltaSequence === 0)
      const conclusionDelta = result.find((d) => d.deltaSequence === 1)

      // Conclusion deltas should have higher significance, then early, then middle
      expect(conclusionDelta!.significance).toBeGreaterThan(
        earlyDelta!.significance,
      )
    })

    it('should calculate significance with type-based weighting', async () => {
      const deltas: MoodDelta[] = [
        {
          magnitude: 2.0,
          direction: 'positive',
          type: 'mood_repair',
          confidence: 0.8,
          factors: ['therapy_breakthrough'],
        },
        {
          magnitude: 2.0,
          direction: 'positive',
          type: 'celebration',
          confidence: 0.8,
          factors: ['achievement'],
        },
      ]

      const result = await storageService.storeDeltaHistory(
        testMemoryId,
        testConversationId,
        deltas,
        1800000,
        new Date(),
      )

      expect(result).toHaveLength(2)
      const repairDelta = result.find((d) => d.type === 'mood_repair')
      const celebrationDelta = result.find((d) => d.type === 'celebration')

      // Mood repair should have higher significance than celebration
      expect(repairDelta!.significance).toBeGreaterThan(
        celebrationDelta!.significance,
      )
    })
  })

  describe('Temporal Context Analysis', () => {
    it('should track temporal context with relative timestamps and delta relationships', async () => {
      const deltas: MoodDelta[] = [
        {
          magnitude: 1.5,
          direction: 'negative',
          type: 'decline',
          confidence: 0.7,
          factors: ['stress'],
        },
        {
          magnitude: 2.5,
          direction: 'positive',
          type: 'mood_repair',
          confidence: 0.9,
          factors: ['support'],
        },
      ]

      const startTime = new Date()
      const result = await storageService.storeDeltaHistory(
        testMemoryId,
        testConversationId,
        deltas,
        3600000, // 1 hour
        startTime,
      )

      expect(result).toHaveLength(2)

      // Check temporal context structure
      expect(result[0].temporalContext.position).toBe('early')
      expect(result[1].temporalContext.position).toBe('conclusion')
      expect(result[0].temporalContext.precedingDeltas).toBe(0)
      expect(result[1].temporalContext.precedingDeltas).toBe(1)
      expect(result[0].temporalContext.followingDeltas).toBe(1)
      expect(result[1].temporalContext.followingDeltas).toBe(0)
    })

    it('should handle conversations with varying delta densities', async () => {
      const deltas: MoodDelta[] = [
        {
          magnitude: 1.0,
          direction: 'neutral',
          type: 'plateau',
          confidence: 0.6,
          factors: ['stability'],
        },
      ]

      const result = await storageService.storeDeltaHistory(
        testMemoryId,
        testConversationId,
        deltas,
        600000, // 10 minutes
        new Date(),
      )

      expect(result).toHaveLength(1)
      expect(result[0].temporalContext.position).toBe('early') // Single delta defaults to early
      expect(result[0].temporalContext.precedingDeltas).toBe(0)
      expect(result[0].temporalContext.followingDeltas).toBe(0)
    })

    it('should calculate temporal windows for delta sequence analysis', async () => {
      const deltas: MoodDelta[] = Array.from({ length: 5 }, (_, i) => ({
        magnitude: 1.5 + i * 0.2,
        direction: i % 2 === 0 ? 'positive' : 'negative',
        type: 'mood_repair',
        confidence: 0.7 + i * 0.05,
        factors: [`factor_${i}`],
      })) as MoodDelta[]

      const result = await storageService.storeDeltaHistory(
        testMemoryId,
        testConversationId,
        deltas,
        7200000, // 2 hours
        new Date(),
      )

      expect(result).toHaveLength(5)

      // Check position distribution
      const positions = result.map((d) => d.temporalContext.position)
      expect(positions).toContain('early')
      expect(positions).toContain('middle')
      expect(positions).toContain('conclusion')

      // Check relative timestamps increase
      for (let i = 1; i < result.length; i++) {
        expect(result[i].temporalContext.relativeTimestamp).toBeGreaterThan(
          result[i - 1].temporalContext.relativeTimestamp,
        )
      }
    })
  })

  describe('Delta Pattern Storage', () => {
    it('should store delta patterns with significance and confidence metrics', async () => {
      // Create real delta records first
      const { deltaIds } = await testDataFactory.createMoodDeltas({
        memoryId: testMemoryId,
        deltas: [
          {
            magnitude: 2.5,
            direction: 'positive',
            type: 'mood_repair',
            confidence: 0.85,
            factors: ['support', 'breakthrough'],
          },
          {
            magnitude: 1.8,
            direction: 'positive',
            type: 'celebration',
            confidence: 0.9,
            factors: ['achievement'],
          },
          {
            magnitude: 3.0,
            direction: 'positive',
            type: 'mood_repair',
            confidence: 0.8,
            factors: ['recovery'],
          },
        ],
      })

      const metadata = {
        significance: 8.5,
        confidence: 0.85,
        description: 'Recovery sequence pattern',
        duration: 1800000, // 30 minutes
        averageMagnitude: 2.3,
      }

      const result = await storageService.storeDeltaPattern(testMemoryId, {
        type: 'recovery_sequence',
        deltaIds,
        description: metadata.description,
        duration: metadata.duration,
        averageMagnitude: metadata.averageMagnitude,
      })

      expect(result).toBeDefined()
      expect(result.patternType).toBe('recovery_sequence')
      expect(result.significance).toBe(10) // Calculated: 2.3 * 3 * 2.0 = 13.8, capped at 10
      expect(result.confidence).toBe(0.896) // Calculated: 0.7 + min(0.2, 3*0.05) + min(0.1, 2.3*0.02) = 0.7 + 0.15 + 0.046
      expect(result.deltaIds).toEqual(deltaIds)
      expect(result.description).toBe('Recovery sequence pattern')
    })

    it('should rank pattern types by significance appropriately', async () => {
      // Create real deltas for first pattern
      const { deltaIds: deltaIds1 } = await testDataFactory.createMoodDeltas({
        memoryId: testMemoryId,
        deltas: [
          {
            magnitude: 3.0,
            direction: 'positive',
            type: 'mood_repair',
            confidence: 0.9,
            factors: ['recovery'],
          },
          {
            magnitude: 2.5,
            direction: 'positive',
            type: 'celebration',
            confidence: 0.85,
            factors: ['breakthrough'],
          },
        ],
      })

      // Create real deltas for second pattern
      const { deltaIds: deltaIds2 } = await testDataFactory.createMoodDeltas({
        memoryId: testMemoryId,
        deltas: [
          {
            magnitude: 1.5,
            direction: 'neutral',
            type: 'plateau',
            confidence: 0.7,
            factors: ['stability'],
          },
          {
            magnitude: 1.2,
            direction: 'negative',
            type: 'decline',
            confidence: 0.6,
            factors: ['setback'],
          },
        ],
      })

      // Store multiple patterns with different types
      const patterns = [
        {
          type: 'recovery_sequence',
          significance: 9.0,
          deltaIds: deltaIds1,
        },
        {
          type: 'oscillation',
          significance: 6.5,
          deltaIds: deltaIds2,
        },
      ]

      for (const pattern of patterns) {
        await storageService.storeDeltaPattern(testMemoryId, {
          type: pattern.type as 'recovery_sequence' | 'oscillation',
          deltaIds: pattern.deltaIds,
          description: `Test ${pattern.type}`,
          duration: 1800000,
          averageMagnitude: 2.0,
        })
      }

      const retrievedPatterns =
        await storageService.getDeltaPatternsByMemoryId(testMemoryId)

      expect(retrievedPatterns).toHaveLength(2)
      expect(retrievedPatterns[0].patternType).toBe('recovery_sequence') // Higher significance first
      expect(retrievedPatterns[1].patternType).toBe('oscillation') // Lower significance second
    })

    it('should retrieve delta patterns ordered by significance', async () => {
      // Create real deltas for first pattern (lower significance)
      const { deltaIds: deltaIds1 } = await testDataFactory.createMoodDeltas({
        memoryId: testMemoryId,
        deltas: [
          {
            magnitude: 2.0,
            direction: 'positive',
            type: 'mood_repair',
            confidence: 0.7,
            factors: ['support'],
          },
          {
            magnitude: 1.5,
            direction: 'positive',
            type: 'celebration',
            confidence: 0.75,
            factors: ['achievement'],
          },
        ],
      })

      // Create real deltas for second pattern (higher significance)
      const { deltaIds: deltaIds2 } = await testDataFactory.createMoodDeltas({
        memoryId: testMemoryId,
        deltas: [
          {
            magnitude: 3.5,
            direction: 'negative',
            type: 'decline',
            confidence: 0.9,
            factors: ['crisis'],
          },
          {
            magnitude: 2.8,
            direction: 'negative',
            type: 'decline',
            confidence: 0.85,
            factors: ['deterioration'],
          },
        ],
      })

      // Create two patterns with different significance levels
      const pattern1 = await storageService.storeDeltaPattern(testMemoryId, {
        type: 'recovery_sequence',
        deltaIds: deltaIds1,
        description: 'Lower significance pattern',
        duration: 1800000,
        averageMagnitude: 2.0,
      })

      const pattern2 = await storageService.storeDeltaPattern(testMemoryId, {
        type: 'decline_sequence',
        deltaIds: deltaIds2,
        description: 'Higher significance pattern',
        duration: 2400000,
        averageMagnitude: 2.8,
      })

      const retrievedPatterns =
        await storageService.getDeltaPatternsByMemoryId(testMemoryId)

      expect(retrievedPatterns).toHaveLength(2)
      expect(retrievedPatterns[0].significance).toBeGreaterThan(
        retrievedPatterns[1].significance,
      )
      expect(retrievedPatterns[0].id).toBe(pattern2.id) // Higher significance first
      expect(retrievedPatterns[1].id).toBe(pattern1.id) // Lower significance second
    })
  })

  describe('Turning Point Storage with Temporal Context', () => {
    it('should store turning points with temporal context and significance scoring', async () => {
      const turningPoint: TurningPoint = {
        timestamp: new Date(),
        type: 'breakthrough',
        magnitude: 3.5,
        description: 'Major breakthrough in therapy session',
        factors: ['insight', 'emotional_release', 'perspective_shift'],
      }

      const result = await storageService.storeTurningPoint(
        testMemoryId,
        turningPoint,
        {
          position: 'middle',
          precedingMagnitude: 2.0,
          followingMagnitude: 1.5,
          contextDuration: 1800000,
        },
      )

      expect(result).toBeDefined()
      expect(result.type).toBe('breakthrough')
      expect(result.magnitude).toBe(3.5)
      expect(result.significance).toBeGreaterThan(0)
      expect(result.temporalContext).toBeDefined()
      expect(result.temporalContext.position).toBeDefined()
    })

    it('should rank turning point types by significance', async () => {
      const turningPoints = [
        {
          type: 'breakthrough',
          magnitude: 3.0,
          description: 'Major breakthrough',
        },
        {
          type: 'realization',
          magnitude: 3.0,
          description: 'Important realization',
        },
      ]

      const results = []
      for (const tp of turningPoints) {
        const result = await storageService.storeTurningPoint(
          testMemoryId,
          {
            timestamp: new Date(),
            type: tp.type as 'breakthrough' | 'realization',
            magnitude: tp.magnitude,
            description: tp.description,
            factors: ['test_factor'],
          },
          {
            position: 'middle',
            precedingMagnitude: 2.0,
            followingMagnitude: 1.5,
            contextDuration: 1800000,
          },
        )
        results.push(result)
      }

      // Breakthrough should have higher significance than realization
      const breakthrough = results.find((r) => r.type === 'breakthrough')
      const realization = results.find((r) => r.type === 'realization')

      expect(breakthrough!.significance).toBeGreaterThan(
        realization!.significance,
      )
    })

    it('should retrieve turning points ordered by timestamp', async () => {
      const baseTime = new Date()
      const turningPoints = [
        {
          timestamp: new Date(baseTime.getTime() + 3600000), // 1 hour later
          type: 'setback',
          magnitude: 2.0,
          description: 'Later setback',
        },
        {
          timestamp: baseTime,
          type: 'breakthrough',
          magnitude: 3.0,
          description: 'Earlier breakthrough',
        },
      ]

      for (const tp of turningPoints) {
        await storageService.storeTurningPoint(
          testMemoryId,
          {
            timestamp: tp.timestamp,
            type: tp.type as 'breakthrough' | 'setback',
            magnitude: tp.magnitude,
            description: tp.description,
            factors: ['test_factor'],
          },
          {
            position: 'middle',
            precedingMagnitude: 2.0,
            followingMagnitude: 1.5,
            contextDuration: 1800000,
          },
        )
      }

      const retrievedTurningPoints =
        await storageService.getTurningPointsByMemoryId(testMemoryId)

      expect(retrievedTurningPoints).toHaveLength(2)
      expect(retrievedTurningPoints[0].timestamp.getTime()).toBeLessThan(
        retrievedTurningPoints[1].timestamp.getTime(),
      )
      expect(retrievedTurningPoints[0].description).toBe('Earlier breakthrough')
      expect(retrievedTurningPoints[1].description).toBe('Later setback')
    })
  })

  describe('Query Performance and Data Relationships', () => {
    it('should efficiently retrieve deltas by significance threshold', async () => {
      const deltas: MoodDelta[] = [
        {
          magnitude: 4.0, // Increased magnitude to ensure high significance
          direction: 'positive',
          type: 'mood_repair',
          confidence: 1.0, // Maximum confidence
          factors: ['high_significance'],
        },
        {
          magnitude: 3.5, // Increased to ensure this also meets threshold
          direction: 'positive',
          type: 'celebration',
          confidence: 0.9,
          factors: ['medium_significance'],
        },
        {
          magnitude: 1.0,
          direction: 'neutral',
          type: 'plateau',
          confidence: 0.5,
          factors: ['low_significance'],
        },
      ]

      await storageService.storeDeltaHistory(
        testMemoryId,
        testConversationId,
        deltas,
        1800000,
        new Date(),
      )

      const significantDeltas =
        await storageService.getDeltasBySignificance(5.0)

      expect(significantDeltas.length).toBeGreaterThan(0)
      significantDeltas.forEach((delta) => {
        expect(delta.significance).toBeGreaterThanOrEqual(5.0)
      })
    })

    it('should maintain referential integrity between deltas, patterns, and turning points', async () => {
      // Create a complete delta history with patterns and turning points
      const deltas: MoodDelta[] = [
        {
          magnitude: 2.5,
          direction: 'positive',
          type: 'mood_repair',
          confidence: 0.8,
          factors: ['support'],
        },
      ]

      const deltaHistory = await storageService.storeDeltaHistory(
        testMemoryId,
        testConversationId,
        deltas,
        1800000,
        new Date(),
      )

      const pattern = await storageService.storeDeltaPattern(testMemoryId, {
        type: 'recovery_sequence',
        deltaIds: [deltaHistory[0].id],
        description: 'Test pattern',
        duration: 1800000,
        averageMagnitude: 2.5,
      })

      const turningPoint = await storageService.storeTurningPoint(
        testMemoryId,
        {
          timestamp: new Date(),
          type: 'breakthrough',
          magnitude: 3.0,
          description: 'Related breakthrough',
          factors: ['insight'],
        },
        {
          position: 'middle',
          precedingMagnitude: 2.0,
          followingMagnitude: 1.5,
          contextDuration: 1800000,
        },
        deltaHistory[0].id, // Link to the first delta
      )

      // Verify all relationships exist
      expect(deltaHistory[0].memoryId).toBe(testMemoryId)
      expect(pattern.memoryId).toBe(testMemoryId)
      expect(turningPoint.memoryId).toBe(testMemoryId)
      expect(pattern.deltaIds).toContain(deltaHistory[0].id)
      expect(turningPoint.deltaId).toBe(deltaHistory[0].id)
    })
  })
})
