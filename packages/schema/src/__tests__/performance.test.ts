import { describe, it, expect } from 'vitest'

import {
  validateMemory,
  validateParticipant,
  validateBatch,
  isMemory,
  isEmotionalContext,
  transformMemoryToExport,
  normalizeMemory,
} from '../index'
import { EmotionalState, EmotionalTheme } from '../memory/emotional-context'
import { ParticipantRole } from '../memory/participants'
import {
  CommunicationPattern,
  InteractionQuality,
} from '../memory/relationship-dynamics'

describe('Performance Benchmarks', () => {
  // Skip performance benchmarks in Wallaby.js and CI - they can cause timeouts
  if (process.env.WALLABY_WORKER || process.env.CI) {
    it.skip('skipped in Wallaby.js and CI environments', () => {})
    return
  }

  // Create test data
  const createMockMemory = (id: string) => ({
    id: `550e8400-e29b-41d4-a716-44665544${id.padStart(4, '0')}`,
    content: `Test memory content ${id} with some emotional context`,
    timestamp: '2024-01-01T00:00:00.000Z',
    author: {
      id: `author-${id}`,
      name: `Author ${id}`,
      role: ParticipantRole.SELF,
    },
    participants: [
      {
        id: `participant-${id}-1`,
        name: `Participant ${id}-1`,
        role: ParticipantRole.FRIEND,
      },
      {
        id: `participant-${id}-2`,
        name: `Participant ${id}-2`,
        role: ParticipantRole.FAMILY,
      },
    ],
    emotionalContext: {
      primaryEmotion: EmotionalState.JOY,
      secondaryEmotions: [EmotionalState.EXCITEMENT],
      intensity: 0.8,
      valence: 0.7,
      themes: [EmotionalTheme.CELEBRATION],
      indicators: {
        phrases: [`phrase ${id}`],
        emotionalWords: [`word ${id}`],
        styleIndicators: ['!'],
      },
    },
    relationshipDynamics: {
      communicationPattern: CommunicationPattern.SUPPORTIVE,
      interactionQuality: InteractionQuality.POSITIVE,
      powerDynamics: {
        isBalanced: true,
        concerningPatterns: [],
      },
      attachmentIndicators: {
        secure: ['secure'],
        anxious: [],
        avoidant: [],
      },
      healthIndicators: {
        positive: ['positive'],
        negative: [],
        repairAttempts: [],
      },
      connectionStrength: 0.85,
    },
    tags: [`tag-${id}`, 'test', 'benchmark'],
    metadata: {
      processedAt: '2024-01-01T00:00:00.000Z',
      schemaVersion: '2.0',
      source: 'benchmark',
      confidence: 0.9,
    },
  })

  const createMockParticipant = (id: string) => ({
    id: `participant-${id}`,
    name: `Test Participant ${id}`,
    role: ParticipantRole.FRIEND,
  })

  describe('Type Guard Performance', () => {
    it('should validate memory type guards at reasonable speed', () => {
      const memories = Array.from({ length: 1000 }, (_, i) =>
        createMockMemory(i.toString()),
      )

      const startTime = performance.now()

      let validCount = 0
      for (const memory of memories) {
        if (isMemory(memory)) {
          validCount++
        }
      }

      const endTime = performance.now()
      const duration = endTime - startTime
      const rate = memories.length / duration // items per millisecond

      expect(validCount).toBe(1000)
      expect(duration).toBeLessThan(100) // Should complete in less than 100ms
      expect(rate).toBeGreaterThan(10) // Should process at least 10 items per ms

      console.info(
        `Type guard performance: ${memories.length} items in ${duration.toFixed(2)}ms (${rate.toFixed(2)} items/ms)`,
      )
    })

    it('should validate emotional context type guards efficiently', () => {
      const contexts = Array.from(
        { length: 1000 },
        (_, i) => createMockMemory(i.toString()).emotionalContext,
      )

      const startTime = performance.now()

      let validCount = 0
      for (const context of contexts) {
        if (isEmotionalContext(context)) {
          validCount++
        }
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(validCount).toBe(1000)
      expect(duration).toBeLessThan(50) // Should be faster than full memory validation

      console.info(
        `Emotional context type guard: ${contexts.length} items in ${duration.toFixed(2)}ms`,
      )
    })
  })

  describe('Schema Validation Performance', () => {
    it('should validate memories efficiently with Zod', () => {
      const memories = Array.from({ length: 100 }, (_, i) =>
        createMockMemory(i.toString()),
      )

      const startTime = performance.now()

      const results = memories.map((memory) =>
        validateMemory(memory, { includePerformance: true }),
      )

      const endTime = performance.now()
      const duration = endTime - startTime
      const averageTime = duration / memories.length

      expect(results.every((r) => r.isValid)).toBe(true)
      expect(averageTime).toBeLessThan(5) // Should average less than 5ms per validation

      const totalValidationTime = results.reduce(
        (sum, r) => sum + (r.performance?.validationTimeMs || 0),
        0,
      )
      const overheadRatio = (duration - totalValidationTime) / duration

      console.info(
        `Schema validation: ${memories.length} items in ${duration.toFixed(2)}ms (${averageTime.toFixed(2)}ms avg)`,
      )
      console.info(`Validation overhead: ${(overheadRatio * 100).toFixed(1)}%`)

      expect(overheadRatio).toBeLessThan(0.5) // Overhead should be less than 50%
    })

    it('should handle batch validation efficiently', () => {
      const participants = Array.from({ length: 500 }, (_, i) =>
        createMockParticipant(i.toString()),
      )

      const startTime = performance.now()

      const { summary } = validateBatch(participants, validateParticipant, {
        includePerformance: true,
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(summary.validObjects).toBe(500)
      expect(summary.invalidObjects).toBe(0)
      expect(duration).toBeLessThan(200) // Should complete batch in reasonable time

      console.info(
        `Batch validation: ${participants.length} items in ${duration.toFixed(2)}ms`,
      )
      console.info(
        `Average validation time: ${summary.averageValidationTime?.toFixed(3)}ms`,
      )
    })
  })

  describe('Transformation Performance', () => {
    it('should transform memories to export format efficiently', () => {
      const memories = Array.from({ length: 1000 }, (_, i) =>
        createMockMemory(i.toString()),
      )

      const startTime = performance.now()

      const exported = memories.map((memory) => transformMemoryToExport(memory))

      const endTime = performance.now()
      const duration = endTime - startTime
      const rate = memories.length / duration

      expect(exported).toHaveLength(1000)
      expect(duration).toBeLessThan(50) // Should be very fast
      expect(rate).toBeGreaterThan(20) // Should process at least 20 items per ms

      console.info(
        `Export transformation: ${memories.length} items in ${duration.toFixed(2)}ms (${rate.toFixed(2)} items/ms)`,
      )
    })

    it('should normalize memories efficiently', () => {
      const memories = Array.from({ length: 500 }, (_, i) => {
        const memory = createMockMemory(i.toString())
        // Add some disorder to make normalization meaningful
        memory.tags = [`z-tag-${i}`, `a-tag-${i}`, `m-tag-${i}`]
        return memory
      })

      const startTime = performance.now()

      const normalized = memories.map((memory) => normalizeMemory(memory))

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(normalized).toHaveLength(500)
      expect(normalized.every((m) => m.tags[0] <= m.tags[1])).toBe(true) // Verify sorting
      expect(duration).toBeLessThan(100) // Should complete in reasonable time

      console.info(
        `Normalization: ${memories.length} items in ${duration.toFixed(2)}ms`,
      )
    })
  })

  describe('Memory Usage', () => {
    it('should not create excessive memory overhead', () => {
      const memories = Array.from({ length: 100 }, (_, i) =>
        createMockMemory(i.toString()),
      )

      // Measure memory usage if available (browser only)
      const perfWithMemory = performance as {
        memory?: { usedJSHeapSize: number }
      }
      if (typeof window !== 'undefined' && perfWithMemory.memory) {
        const initialMemory = perfWithMemory.memory.usedJSHeapSize

        // Perform various operations
        memories.forEach((memory) => {
          isMemory(memory)
          validateMemory(memory)
          transformMemoryToExport(memory)
          normalizeMemory(memory)
        })

        const finalMemory = perfWithMemory.memory.usedJSHeapSize
        const memoryIncrease = finalMemory - initialMemory

        console.info(
          `Memory usage increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`,
        )

        // Should not increase memory by more than 10MB for 100 operations
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
      } else {
        console.info('Memory measurement not available in this environment')
      }
    })
  })

  describe('Scalability', () => {
    it('should maintain performance with larger datasets', () => {
      const smallDataset = Array.from({ length: 100 }, (_, i) =>
        createMockMemory(i.toString()),
      )
      const largeDataset = Array.from({ length: 1000 }, (_, i) =>
        createMockMemory(i.toString()),
      )

      // Test small dataset
      const smallStart = performance.now()
      smallDataset.forEach((memory) => validateMemory(memory))
      const smallDuration = performance.now() - smallStart
      const smallRate = smallDataset.length / smallDuration

      // Test large dataset
      const largeStart = performance.now()
      largeDataset.forEach((memory) => validateMemory(memory))
      const largeDuration = performance.now() - largeStart
      const largeRate = largeDataset.length / largeDuration

      console.info(
        `Small dataset (${smallDataset.length}): ${smallDuration.toFixed(2)}ms (${smallRate.toFixed(2)} items/ms)`,
      )
      console.info(
        `Large dataset (${largeDataset.length}): ${largeDuration.toFixed(2)}ms (${largeRate.toFixed(2)} items/ms)`,
      )

      // Performance should not degrade significantly with scale
      const performanceDegradation = (smallRate - largeRate) / smallRate
      // Increase threshold for Wallaby.js environment which may have more variance
      // Also account for CI and local development variance
      const degradationThreshold =
        process.env.WALLABY_WORKER === 'true' || process.env.CI ? 0.75 : 0.8
      expect(performanceDegradation).toBeLessThan(degradationThreshold) // Less than 80% degradation (75% for Wallaby/CI)
    })
  })
})
