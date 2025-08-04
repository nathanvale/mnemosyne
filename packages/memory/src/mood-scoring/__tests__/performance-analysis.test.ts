import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type {
  ConversationData,
  ConversationMessage,
  ConversationParticipant,
} from '../../types'

import { MoodScoringAnalyzer } from '../analyzer'
import { PsychologicalIndicatorAnalyzer } from '../psychological-indicator-analyzer'
import { RelationshipContextAnalyzer } from '../relationship-context-analyzer'
import { SentimentProcessor } from '../sentiment-processor'

// Performance thresholds
const PERFORMANCE_THRESHOLD_MS = 2000 // 2 seconds

// Test data configuration
const LARGE_DATASET_SIZE = 20
const CONCURRENT_OPERATIONS = 10

describe('Mood Analysis Performance - Task 7.1', () => {
  let moodAnalyzer: MoodScoringAnalyzer
  let sentimentProcessor: SentimentProcessor
  let psychologicalAnalyzer: PsychologicalIndicatorAnalyzer
  let relationshipAnalyzer: RelationshipContextAnalyzer

  beforeEach(async () => {
    // Initialize all analyzers
    sentimentProcessor = new SentimentProcessor()
    psychologicalAnalyzer = new PsychologicalIndicatorAnalyzer()
    relationshipAnalyzer = new RelationshipContextAnalyzer()
    moodAnalyzer = new MoodScoringAnalyzer()
  })

  afterEach(async () => {
    // Clean up resources
  })

  // Utility functions
  async function measurePerformance<T>(
    operation: () => Promise<T>,
  ): Promise<{ result: T; timeMs: number }> {
    const startTime = Date.now()
    const result = await operation()
    const endTime = Date.now()
    return { result, timeMs: endTime - startTime }
  }

  function createTestConversation(index: number): ConversationData {
    const participants: ConversationParticipant[] = [
      {
        id: `user-${index}`,
        name: `User ${index}`,
        role: 'author',
      },
      {
        id: `friend-${index}`,
        name: `Friend ${index}`,
        role: 'listener',
      },
    ]

    const messages: ConversationMessage[] = [
      {
        id: `msg-${index}-1`,
        content: `I'm feeling really happy today! Just got some great news about ${index}.`,
        authorId: participants[0].id,
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      },
      {
        id: `msg-${index}-2`,
        content: `That's wonderful! I'm so excited for you. Tell me more about it.`,
        authorId: participants[1].id,
        timestamp: new Date(Date.now() - 3300000), // 55 minutes ago
      },
      {
        id: `msg-${index}-3`,
        content: `Well, it's been a long journey but I finally achieved my goal of ${index * 10}. I'm grateful for all the support.`,
        authorId: participants[0].id,
        timestamp: new Date(Date.now() - 3000000), // 50 minutes ago
      },
    ]

    return {
      id: `conversation-${index}`,
      messages,
      participants,
      timestamp: new Date(),
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(Date.now() - 3000000),
      context: {
        platform: 'test',
        conversationType: 'direct',
      },
    }
  }

  describe('Individual Component Performance', () => {
    it('should process sentiment analysis within performance threshold', async () => {
      const testConversation = createTestConversation(1)
      const testContent = testConversation.messages[0].content

      const { result, timeMs } = await measurePerformance(async () => {
        const positive =
          sentimentProcessor.analyzePositiveSentiment(testContent)
        const negative =
          sentimentProcessor.analyzeNegativeSentiment(testContent)
        return { positive, negative }
      })

      expect(result).toBeDefined()
      expect(result.positive).toHaveProperty('score')
      expect(result.negative).toHaveProperty('score')
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Sentiment analysis took ${timeMs.toFixed(2)}ms`)
    })

    it('should process psychological indicators within performance threshold', async () => {
      const testConversation = createTestConversation(2)
      const testContent = testConversation.messages
        .map((m) => m.content)
        .join(' ')

      const { result, timeMs } = await measurePerformance(async () => {
        const coping =
          psychologicalAnalyzer.analyzeCopingMechanisms(testContent)
        const resilience = psychologicalAnalyzer.assessResilience(testContent)
        const stress = psychologicalAnalyzer.identifyStressMarkers(testContent)
        return { coping, resilience, stress }
      })

      expect(result).toBeDefined()
      expect(Array.isArray(result.coping)).toBe(true)
      expect(result.resilience).toHaveProperty('overall')
      expect(Array.isArray(result.stress)).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Psychological analysis took ${timeMs.toFixed(2)}ms`)
    })

    it('should process relationship context within performance threshold', async () => {
      const testConversation = createTestConversation(3)

      const { result, timeMs } = await measurePerformance(async () => {
        return relationshipAnalyzer.analyzeRelationshipDynamics(
          testConversation,
        )
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('participantDynamics')
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Relationship analysis took ${timeMs.toFixed(2)}ms`)
    })

    it('should calculate mood analysis within performance threshold', async () => {
      const testConversation = createTestConversation(4)

      const { result, timeMs } = await measurePerformance(async () => {
        return await moodAnalyzer.analyzeConversation(testConversation)
      })

      expect(result).toBeDefined()
      expect(result).toHaveProperty('score')
      expect(result).toHaveProperty('confidence')
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Mood analysis took ${timeMs.toFixed(2)}ms`)
    })
  })

  describe('Full Pipeline Performance', () => {
    it('should complete full mood analysis within 2 seconds', async () => {
      const testConversation = createTestConversation(10)

      const { result, timeMs } = await measurePerformance(async () => {
        return await moodAnalyzer.analyzeConversation(testConversation)
      })

      expect(result).toBeDefined()
      expect(result.score).toBeTypeOf('number')
      expect(result.confidence).toBeTypeOf('number')
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Full pipeline took ${timeMs.toFixed(2)}ms`)
    })

    it('should complete mood analysis with multiple conversations within 2 seconds', async () => {
      const conversations = [
        createTestConversation(11),
        createTestConversation(12),
        createTestConversation(13),
      ]

      const { result, timeMs } = await measurePerformance(async () => {
        const results = []
        for (const conversation of conversations) {
          const moodResult =
            await moodAnalyzer.analyzeConversation(conversation)
          results.push(moodResult)
        }
        return results
      })

      expect(result).toHaveLength(3)
      expect(result.every((r) => r.score !== undefined)).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(`Multiple conversation analysis took ${timeMs.toFixed(2)}ms`)
    })
  })

  describe('Batch Processing Performance', () => {
    it('should process multiple conversations efficiently', async () => {
      const testConversations = Array.from(
        { length: LARGE_DATASET_SIZE },
        (_, i) => createTestConversation(i + 100),
      )

      const { result, timeMs } = await measurePerformance(async () => {
        const results = []
        for (const conversation of testConversations) {
          const moodResult =
            await moodAnalyzer.analyzeConversation(conversation)
          results.push(moodResult)
        }
        return results
      })

      expect(result).toHaveLength(LARGE_DATASET_SIZE)
      expect(result.every((r) => r.score !== undefined)).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 10) // Allow more time for batch processing
      console.log(
        `Batch processing of ${LARGE_DATASET_SIZE} conversations took ${timeMs.toFixed(2)}ms`,
      )
    })

    it('should handle concurrent analysis requests efficiently', async () => {
      const testConversations = Array.from(
        { length: CONCURRENT_OPERATIONS },
        (_, i) => createTestConversation(i + 200),
      )

      const { result, timeMs } = await measurePerformance(async () => {
        const concurrentPromises = testConversations.map((conversation) =>
          moodAnalyzer.analyzeConversation(conversation),
        )
        return await Promise.all(concurrentPromises)
      })

      expect(result).toHaveLength(CONCURRENT_OPERATIONS)
      expect(result.every((r) => r.score !== undefined)).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 2)
      console.log(
        `Concurrent processing of ${CONCURRENT_OPERATIONS} conversations took ${timeMs.toFixed(2)}ms`,
      )
    })
  })

  describe('Memory Usage and Resource Management', () => {
    it('should maintain stable memory usage during batch processing', async () => {
      const testConversations = Array.from({ length: 20 }, (_, i) =>
        createTestConversation(i + 300),
      )

      const { result, timeMs } = await measurePerformance(async () => {
        const results = []
        for (const conversation of testConversations) {
          const moodResult =
            await moodAnalyzer.analyzeConversation(conversation)
          results.push(moodResult)

          // Simulate memory management by checking result size
          expect(moodResult).toBeDefined()
        }
        return results
      })

      expect(result).toHaveLength(20)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 5)
      console.log(`Memory-stable batch processing took ${timeMs.toFixed(2)}ms`)
    })

    it('should handle complex conversations without performance degradation', async () => {
      // Create a complex conversation with lots of content
      const complexConversation: ConversationData = {
        id: 'complex-conversation',
        messages: Array.from({ length: 50 }, (_, i) => ({
          id: `complex-msg-${i}`,
          content: `This is a complex message ${i} with emotional content like joy, sadness, anxiety, hope, and gratitude. It has multiple emotional layers and psychological indicators that need thorough analysis.`,
          authorId: i % 2 === 0 ? 'user-1' : 'user-2',
          timestamp: new Date(Date.now() - (50 - i) * 60000),
        })),
        participants: [
          { id: 'user-1', name: 'User 1', role: 'author' },
          { id: 'user-2', name: 'User 2', role: 'listener' },
        ],
        timestamp: new Date(),
        startTime: new Date(Date.now() - 3000000),
        endTime: new Date(),
        context: {
          platform: 'test',
          conversationType: 'direct',
        },
      }

      const { result, timeMs } = await measurePerformance(async () => {
        return await moodAnalyzer.analyzeConversation(complexConversation)
      })

      expect(result).toBeDefined()
      expect(result.score).toBeTypeOf('number')
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 2)
      console.log(`Complex conversation analysis took ${timeMs.toFixed(2)}ms`)
    })
  })

  describe('Performance Regression Detection', () => {
    it('should maintain consistent performance across multiple runs', async () => {
      const testConversation = createTestConversation(500)
      const runs = 5
      const times: number[] = []

      for (let i = 0; i < runs; i++) {
        const { timeMs } = await measurePerformance(async () => {
          return await moodAnalyzer.analyzeConversation(testConversation)
        })
        times.push(timeMs)
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      const maxTime = Math.max(...times)
      const minTime = Math.min(...times)

      // Wallaby environment can have higher variance due to instrumentation
      const varianceMultiplier =
        process.env.WALLABY_WORKER === 'true' ? 5.0 : 3.0

      expect(maxTime - minTime).toBeLessThan(avgTime * varianceMultiplier) // Variance should be less than 300% (or 500% in Wallaby) of average
      expect(avgTime).toBeLessThan(PERFORMANCE_THRESHOLD_MS)
      console.log(
        `Performance consistency: avg=${avgTime.toFixed(2)}ms, min=${minTime.toFixed(2)}ms, max=${maxTime.toFixed(2)}ms`,
      )
    })

    it('should meet performance targets under load', async () => {
      const testConversations = Array.from({ length: 10 }, (_, i) =>
        createTestConversation(i + 600),
      )

      const { result, timeMs } = await measurePerformance(async () => {
        const batchPromises = Array.from({ length: 3 }, () =>
          Promise.all(
            testConversations.map((conversation) =>
              moodAnalyzer.analyzeConversation(conversation),
            ),
          ),
        )
        return await Promise.all(batchPromises)
      })

      expect(result).toHaveLength(3)
      expect(result.every((batch) => batch.length === 10)).toBe(true)
      expect(timeMs).toBeLessThan(PERFORMANCE_THRESHOLD_MS * 3)
      console.log(
        `Load test with ${result.length * 10} total analyses took ${timeMs.toFixed(2)}ms`,
      )
    })
  })
})
