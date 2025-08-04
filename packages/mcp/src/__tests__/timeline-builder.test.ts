import type { ExtractedMemory } from '@studio/memory'

import { describe, it, expect, beforeEach } from 'vitest'

import { RelationalTimelineBuilder } from '../relational-timeline/builder'

describe('RelationalTimelineBuilder', () => {
  let builder: RelationalTimelineBuilder

  beforeEach(() => {
    builder = new RelationalTimelineBuilder()
  })

  describe('buildTimeline', () => {
    it('should handle empty memories', async () => {
      const result = await builder.buildTimeline([], 'participant-1')

      expect(result.participantId).toBe('participant-1')
      expect(result.events).toEqual([])
      expect(result.keyMoments).toEqual([])
      expect(result.summary).toBe(
        'No emotional events available for timeline construction.',
      )
      expect(result.relationshipDynamics).toEqual([])
    })

    it('should extract mood change events', async () => {
      const memory = createMockMemory({
        moodDelta: {
          magnitude: 2.5,
          direction: 'positive',
          type: 'mood_repair',
          confidence: 0.8,
          factors: ['support received'],
        },
      })

      const result = await builder.buildTimeline([memory], 'participant-1')

      expect(result.events).toHaveLength(1)
      expect(result.events[0].type).toBe('mood_change')
      expect(result.events[0].description).toContain('mood_repair')
      expect(result.events[0].emotionalImpact).toBe(2.5)
    })

    it('should extract relationship shift events', async () => {
      const memory = createMockMemory({
        relationshipQuality: 8,
      })

      const result = await builder.buildTimeline([memory], 'participant-1')

      const relationshipEvents = result.events.filter(
        (e) => e.type === 'relationship_shift',
      )
      expect(relationshipEvents).toHaveLength(1)
      expect(relationshipEvents[0].description).toContain(
        'Positive relationship dynamics',
      )
    })

    it('should extract significant moments', async () => {
      const memory = createMockMemory({
        significance: 9,
      })

      const result = await builder.buildTimeline([memory], 'participant-1')

      const significantEvents = result.events.filter(
        (e) => e.type === 'significant_moment',
      )
      expect(significantEvents).toHaveLength(1)
      expect(significantEvents[0].emotionalImpact).toBe(9)
    })

    it('should extract support exchange events', async () => {
      const memory = createMockMemory({
        patterns: [
          { type: 'support_seeking', significance: 7, confidence: 0.8 },
        ],
      })

      const result = await builder.buildTimeline([memory], 'participant-1')

      const supportEvents = result.events.filter(
        (e) => e.type === 'support_exchange',
      )
      expect(supportEvents).toHaveLength(1)
      expect(supportEvents[0].description).toContain('support_seeking')
    })

    it('should identify key moments from high-impact events', async () => {
      const memory = createMockMemory({
        moodDelta: {
          magnitude: 8,
          direction: 'positive',
          type: 'mood_repair',
          confidence: 0.9,
          factors: ['breakthrough moment'],
        },
        turningPoints: [
          {
            timestamp: new Date(),
            type: 'breakthrough',
            magnitude: 7,
            description: 'Major emotional breakthrough',
            factors: ['self-realization'],
          },
        ],
      })

      const result = await builder.buildTimeline([memory], 'participant-1')

      expect(result.keyMoments).toHaveLength(1)
      expect(result.keyMoments[0].type).toBe('breakthrough')
      expect(result.keyMoments[0].significance).toBe(7)
      expect(result.keyMoments[0].description).toBe(
        'Major emotional breakthrough',
      )
    })

    it('should analyze relationship evolution when enabled', async () => {
      const builderWithEvolution = new RelationalTimelineBuilder({
        includeRelationshipEvolution: true,
        timeWindow: 'month',
      })

      const now = new Date()
      const memories = Array.from({ length: 10 }, (_, i) =>
        createMockMemory({
          timestamp: new Date(now.getTime() - i * 24 * 60 * 60 * 1000), // i days ago
          relationshipQuality: 6 + Math.sin(i) * 2,
        }),
      )

      const result = await builderWithEvolution.buildTimeline(
        memories,
        'participant-1',
      )

      expect(result.relationshipDynamics.length).toBeGreaterThan(0)
      expect(result.relationshipDynamics[0]).toHaveProperty('qualityMetrics')
      expect(result.relationshipDynamics[0]).toHaveProperty(
        'communicationPatterns',
      )
    })

    it('should respect maxEvents configuration', async () => {
      const limitedBuilder = new RelationalTimelineBuilder({
        maxEvents: 3,
      })

      const now = new Date()
      const memories = Array.from({ length: 10 }, (_, i) =>
        createMockMemory({
          significance: 8,
          timestamp: new Date(now.getTime() - i * 24 * 60 * 60 * 1000), // i days ago
          moodDelta: {
            magnitude: 2 + i * 0.5,
            direction: i % 2 === 0 ? 'positive' : 'negative',
            type: 'mood_repair',
            confidence: 0.8,
            factors: [`factor-${i}`],
          },
        }),
      )

      const result = await limitedBuilder.buildTimeline(
        memories,
        'participant-1',
      )

      expect(result.events).toHaveLength(3)
    })

    it('should filter memories by time window', async () => {
      const weeklyBuilder = new RelationalTimelineBuilder({
        timeWindow: 'week',
      })

      const now = new Date()
      const oldMemory = createMockMemory({
        timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        significance: 8,
        moodDelta: {
          magnitude: 3,
          direction: 'positive',
          type: 'mood_repair',
          confidence: 0.8,
          factors: ['old factor'],
        },
      })

      const recentMemory = createMockMemory({
        timestamp: now,
        significance: 8,
        moodDelta: {
          magnitude: 3,
          direction: 'positive',
          type: 'mood_repair',
          confidence: 0.8,
          factors: ['recent factor'],
        },
      })

      const result = await weeklyBuilder.buildTimeline(
        [oldMemory, recentMemory],
        'participant-1',
      )

      const recentEvents = result.events.filter(
        (e) =>
          new Date(e.timestamp).getTime() >
          Date.now() - 7 * 24 * 60 * 60 * 1000,
      )
      expect(recentEvents.length).toBeGreaterThan(0)
    })

    it('should generate meaningful timeline summary', async () => {
      const memories = [
        createMockMemory({
          significance: 8,
          patterns: [
            { type: 'support_seeking', significance: 6, confidence: 0.8 },
          ],
        }),
        createMockMemory({
          significance: 7,
          patterns: [{ type: 'mood_repair', significance: 5, confidence: 0.7 }],
        }),
      ]

      const result = await builder.buildTimeline(memories, 'participant-1')

      expect(result.summary).toContain('emotional events')
      expect(result.summary).not.toBe(
        'No emotional events available for timeline construction.',
      )
    })
  })

  describe('configuration options', () => {
    it('should accept different time windows', () => {
      const yearBuilder = new RelationalTimelineBuilder({
        timeWindow: 'year',
      })

      expect(yearBuilder).toBeInstanceOf(RelationalTimelineBuilder)
    })

    it('should allow disabling relationship evolution', () => {
      const simpleBuilder = new RelationalTimelineBuilder({
        includeRelationshipEvolution: false,
      })

      expect(simpleBuilder).toBeInstanceOf(RelationalTimelineBuilder)
    })
  })
})

// Helper function to create mock memories for timeline testing
function createMockMemory(options: {
  timestamp?: Date
  significance?: number
  moodDelta?: {
    magnitude: number
    direction: 'positive' | 'negative' | 'neutral'
    type: 'mood_repair' | 'celebration' | 'decline' | 'plateau'
    confidence: number
    factors: string[]
  }
  relationshipQuality?: number
  patterns?: Array<{
    type:
      | 'support_seeking'
      | 'mood_repair'
      | 'celebration'
      | 'vulnerability'
      | 'growth'
    significance: number
    confidence: number
  }>
  turningPoints?: Array<{
    timestamp: Date
    type: 'breakthrough' | 'setback' | 'realization' | 'support_received'
    magnitude: number
    description: string
    factors: string[]
  }>
}): ExtractedMemory {
  return {
    id: `memory-${Math.random().toString(36).substr(2, 9)}`,
    content: 'Test timeline memory content',
    timestamp: options.timestamp || new Date(),
    participants: [
      { id: 'participant-1', name: 'Primary User', role: 'primary' },
      { id: 'participant-2', name: 'Support Person', role: 'secondary' },
    ],
    emotionalAnalysis: {
      context: {
        primaryEmotion: 'mixed',
        intensity: 6,
        themes: ['support'],
        valence: 'positive',
        arousal: 'medium',
        confidence: 0.8,
      },
      moodScoring: {
        score: 6,
        descriptors: ['hopeful'],
        confidence: 0.8,
        delta: options.moodDelta,
        factors: [],
      },
      trajectory: {
        points: [],
        direction: 'stable',
        significance: 5,
        turningPoints: options.turningPoints || [],
      },
      patterns: options.patterns || [],
    },
    relationshipDynamics: options.relationshipQuality
      ? {
          quality: options.relationshipQuality,
          trust: options.relationshipQuality * 0.9,
          intimacy: options.relationshipQuality * 0.8,
          patterns: ['supportive', 'collaborative'],
          stability: options.relationshipQuality / 10,
        }
      : undefined,
    significance: {
      overall: options.significance || 5,
      components: {
        emotionalSalience: options.significance || 5,
        relationshipImpact: options.significance || 5,
        contextualImportance: options.significance || 5,
        temporalRelevance: options.significance || 5,
      },
      confidence: 0.8,
      category:
        options.significance && options.significance > 7 ? 'high' : 'medium',
      validationPriority: options.significance || 5,
    },
    processing: {
      extractedAt: new Date(),
      confidence: 0.8,
      quality: {
        overall: 8,
        components: {
          emotionalRichness: 8,
          relationshipClarity: 8,
          contentCoherence: 8,
          contextualSignificance: 8,
        },
        confidence: 0.9,
        issues: [],
      },
      sourceData: {
        id: 'conversation-1',
        messages: [],
        participants: [],
        timestamp: new Date(),
      },
    },
  } as ExtractedMemory
}
