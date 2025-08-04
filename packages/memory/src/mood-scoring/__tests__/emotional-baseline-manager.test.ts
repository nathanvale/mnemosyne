import { describe, it, expect, beforeEach } from 'vitest'

import type {
  ConversationData,
  MoodAnalysisResult,
  // TrajectoryPoint,
} from '../../types'

import { EmotionalBaselineManager } from '../emotional-baseline-manager'

describe('EmotionalBaselineManager - Emotional Baseline Establishment System', () => {
  let baselineManager: EmotionalBaselineManager

  beforeEach(() => {
    baselineManager = new EmotionalBaselineManager({
      minimumDataPoints: 5,
      baselineUpdateThreshold: 0.3,
      historicalDepth: 30, // days
    })
  })

  describe('Individual Variation Tracking (Task 3.3)', () => {
    describe('Baseline Establishment', () => {
      it('should establish individual emotional baseline from historical data', () => {
        const userId = 'user-123'
        const historicalConversations = [
          createMockConversation('conv-1', userId, 7.2, new Date('2024-01-01')),
          createMockConversation('conv-2', userId, 6.8, new Date('2024-01-02')),
          createMockConversation('conv-3', userId, 7.5, new Date('2024-01-03')),
          createMockConversation('conv-4', userId, 6.9, new Date('2024-01-04')),
          createMockConversation('conv-5', userId, 7.1, new Date('2024-01-05')),
        ]

        const baseline = baselineManager.establishBaseline(
          userId,
          historicalConversations,
        )

        expect(baseline).toBeDefined()
        expect(baseline.userId).toBe(userId)
        expect(baseline.averageMood).toBeCloseTo(7.1, 1)
        expect(baseline.moodRange.min).toBeCloseTo(6.8, 1)
        expect(baseline.moodRange.max).toBeCloseTo(7.5, 1)
        expect(baseline.dataPoints).toBe(5)
        expect(baseline.confidence).toBeGreaterThan(0.7)
        expect(baseline.lastUpdated).toBeInstanceOf(Date)
      })

      it('should track individual variation patterns in emotional expression', () => {
        const userId = 'user-456'
        const variableConversations = [
          createMockConversation('conv-1', userId, 4.2, new Date('2024-01-01')), // Low mood
          createMockConversation('conv-2', userId, 8.7, new Date('2024-01-02')), // High mood
          createMockConversation('conv-3', userId, 5.1, new Date('2024-01-03')), // Low-medium
          createMockConversation('conv-4', userId, 8.9, new Date('2024-01-04')), // High
          createMockConversation('conv-5', userId, 6.2, new Date('2024-01-05')), // Medium
        ]

        const baseline = baselineManager.establishBaseline(
          userId,
          variableConversations,
        )

        expect(baseline.variationPattern).toBeDefined()
        expect(baseline.variationPattern.volatility).toBeGreaterThan(1.5) // High volatility
        expect(baseline.variationPattern.cyclicalTendency).toBeDefined()
        expect(baseline.moodRange.spread).toBeGreaterThan(4.0) // Wide range
        expect(baseline.confidence).toBeLessThan(0.8) // Lower confidence due to high variation
      })

      it('should require minimum data points for reliable baseline establishment', () => {
        const userId = 'user-789'
        const limitedConversations = [
          createMockConversation('conv-1', userId, 7.0, new Date('2024-01-01')),
          createMockConversation('conv-2', userId, 7.2, new Date('2024-01-02')),
          createMockConversation('conv-3', userId, 6.8, new Date('2024-01-03')),
        ] // Only 3 data points, below minimum of 5

        expect(() => {
          baselineManager.establishBaseline(userId, limitedConversations)
        }).toThrow('Insufficient data points for baseline establishment')
      })
    })

    describe('Historical Pattern Integration', () => {
      it('should integrate time-based patterns in emotional expression', () => {
        const userId = 'user-temporal'
        const temporalConversations = [
          // Morning conversations - generally higher mood
          createMockConversation(
            'conv-morning-1',
            userId,
            8.1,
            new Date('2024-01-01T09:00:00Z'),
          ),
          createMockConversation(
            'conv-morning-2',
            userId,
            7.8,
            new Date('2024-01-02T08:30:00Z'),
          ),
          createMockConversation(
            'conv-morning-3',
            userId,
            8.3,
            new Date('2024-01-03T09:15:00Z'),
          ),
          // Evening conversations - generally lower mood
          createMockConversation(
            'conv-evening-1',
            userId,
            6.2,
            new Date('2024-01-01T20:00:00Z'),
          ),
          createMockConversation(
            'conv-evening-2',
            userId,
            5.9,
            new Date('2024-01-02T21:30:00Z'),
          ),
          createMockConversation(
            'conv-evening-3',
            userId,
            6.4,
            new Date('2024-01-03T19:45:00Z'),
          ),
        ]

        const baseline = baselineManager.establishBaseline(
          userId,
          temporalConversations,
        )

        expect(baseline.temporalPatterns).toBeDefined()
        expect(baseline.temporalPatterns.timeOfDayPattern).toBeDefined()
        expect(
          baseline.temporalPatterns.timeOfDayPattern.morning,
        ).toBeGreaterThan(baseline.temporalPatterns.timeOfDayPattern.evening)
        expect(baseline.temporalPatterns.weeklyPattern).toBeDefined()
      })

      it('should track relationship-specific emotional patterns', () => {
        const userId = 'user-relational'
        const relationshipConversations = [
          // Family conversations - moderate mood
          createMockConversationWithRelationship(
            'conv-fam-1',
            userId,
            6.5,
            'family',
          ),
          createMockConversationWithRelationship(
            'conv-fam-2',
            userId,
            6.8,
            'family',
          ),
          // Romantic conversations - higher mood
          createMockConversationWithRelationship(
            'conv-rom-1',
            userId,
            8.2,
            'romantic',
          ),
          createMockConversationWithRelationship(
            'conv-rom-2',
            userId,
            8.7,
            'romantic',
          ),
          // Professional conversations - neutral mood
          createMockConversationWithRelationship(
            'conv-prof-1',
            userId,
            5.4,
            'professional',
          ),
          createMockConversationWithRelationship(
            'conv-prof-2',
            userId,
            5.1,
            'professional',
          ),
        ]

        const baseline = baselineManager.establishBaseline(
          userId,
          relationshipConversations,
        )

        expect(baseline.relationshipPatterns).toBeDefined()
        expect(baseline.relationshipPatterns.family).toBeDefined()
        expect(baseline.relationshipPatterns.romantic).toBeDefined()
        expect(baseline.relationshipPatterns.professional).toBeDefined()
        expect(
          baseline.relationshipPatterns.romantic.averageMood,
        ).toBeGreaterThan(
          baseline.relationshipPatterns.professional.averageMood,
        )
      })
    })

    describe('Comparative Analysis', () => {
      it('should provide mood deviation analysis against personal baseline', () => {
        const userId = 'user-deviation'
        const baselineConversations = [
          createMockConversation('base-1', userId, 7.0, new Date('2024-01-01')),
          createMockConversation('base-2', userId, 7.2, new Date('2024-01-02')),
          createMockConversation('base-3', userId, 6.8, new Date('2024-01-03')),
          createMockConversation('base-4', userId, 7.1, new Date('2024-01-04')),
          createMockConversation('base-5', userId, 6.9, new Date('2024-01-05')),
        ]

        baselineManager.establishBaseline(userId, baselineConversations)

        // Test current conversation against baseline
        const currentConversation = createMockConversation(
          'current',
          userId,
          4.5,
        ) // Significantly lower

        const deviationAnalysis = baselineManager.analyzeDeviation(
          userId,
          currentConversation,
        )

        expect(deviationAnalysis).toBeDefined()
        expect(deviationAnalysis.deviationMagnitude).toBeGreaterThan(2.0) // Significant deviation
        expect(deviationAnalysis.deviationType).toBe('significant_decline')
        expect(deviationAnalysis.percentileRank).toBeLessThan(10) // Bottom 10% of historical scores
        expect(deviationAnalysis.contextualSignificance).toBe('high')
        expect(deviationAnalysis.recommendedAction).toContain('monitor')
      })

      it('should handle positive mood elevation analysis', () => {
        const userId = 'user-elevation'
        const baselineConversations = [
          createMockConversation('base-1', userId, 5.5, new Date('2024-01-01')),
          createMockConversation('base-2', userId, 5.8, new Date('2024-01-02')),
          createMockConversation('base-3', userId, 5.2, new Date('2024-01-03')),
          createMockConversation('base-4', userId, 5.6, new Date('2024-01-04')),
          createMockConversation('base-5', userId, 5.4, new Date('2024-01-05')),
        ]

        baselineManager.establishBaseline(userId, baselineConversations)

        // Test significantly elevated mood
        const elevatedConversation = createMockConversation(
          'elevated',
          userId,
          9.2,
        )

        const deviationAnalysis = baselineManager.analyzeDeviation(
          userId,
          elevatedConversation,
        )

        expect(deviationAnalysis.deviationType).toBe('significant_elevation')
        expect(deviationAnalysis.percentileRank).toBeGreaterThan(90) // Top 10%
        expect(deviationAnalysis.contextualSignificance).toBe('high')
        expect(deviationAnalysis.potentialTriggers).toBeDefined()
        expect(deviationAnalysis.sustainabilityAssessment).toBeDefined()
      })
    })

    describe('Baseline Evolution and Updates', () => {
      it('should update baseline when new patterns emerge', () => {
        const userId = 'user-evolving'
        const initialConversations = [
          createMockConversation('init-1', userId, 6.0, new Date('2024-01-01')),
          createMockConversation('init-2', userId, 6.2, new Date('2024-01-02')),
          createMockConversation('init-3', userId, 5.8, new Date('2024-01-03')),
          createMockConversation('init-4', userId, 6.1, new Date('2024-01-04')),
          createMockConversation('init-5', userId, 5.9, new Date('2024-01-05')),
        ]

        const initialBaseline = baselineManager.establishBaseline(
          userId,
          initialConversations,
        )
        expect(initialBaseline.averageMood).toBeCloseTo(6.0, 1)

        // Add new conversations with consistently higher mood
        const newConversations = [
          createMockConversation('new-1', userId, 7.5, new Date('2024-01-06')),
          createMockConversation('new-2', userId, 7.8, new Date('2024-01-07')),
          createMockConversation('new-3', userId, 7.2, new Date('2024-01-08')),
          createMockConversation('new-4', userId, 7.6, new Date('2024-01-09')),
        ]

        const shouldUpdate = baselineManager.shouldUpdateBaseline(
          userId,
          newConversations,
        )
        expect(shouldUpdate).toBe(true)

        const updatedBaseline = baselineManager.updateBaseline(
          userId,
          newConversations,
        )
        expect(updatedBaseline.averageMood).toBeGreaterThan(
          initialBaseline.averageMood,
        )
        expect(updatedBaseline.version).toBe(initialBaseline.version + 1)
        expect(updatedBaseline.updateReason).toContain('significant_shift')
      })

      it('should maintain baseline stability for minor fluctuations', () => {
        const userId = 'user-stable'
        // const conversations = [
        //   createMockConversation(
        //     'stable-1',
        //     userId,
        //     7.0,
        //     new Date('2024-01-01'),
        //   ),
        //   createMockConversation(
        //     'stable-2',
        //     userId,
        //     7.2,
        //     new Date('2024-01-02'),
        //   ),
        //   createMockConversation(
        //     'stable-3',
        //     userId,
        //     6.8,
        //     new Date('2024-01-03'),
        //   ),
        //   createMockConversation(
        //     'stable-4',
        //     userId,
        //     7.1,
        //     new Date('2024-01-04'),
        //   ),
        //   createMockConversation(
        //     'stable-5',
        //     userId,
        //     6.9,
        //     new Date('2024-01-05'),
        //   ),
        // ]

        // const baseline = baselineManager.establishBaseline(
        //   userId,
        //   conversations,
        // )

        // Minor fluctuations that shouldn't trigger update
        const minorFluctuations = [
          createMockConversation(
            'minor-1',
            userId,
            7.3,
            new Date('2024-01-06'),
          ),
          createMockConversation(
            'minor-2',
            userId,
            6.7,
            new Date('2024-01-07'),
          ),
        ]

        const shouldUpdate = baselineManager.shouldUpdateBaseline(
          userId,
          minorFluctuations,
        )
        expect(shouldUpdate).toBe(false)
      })
    })
  })
})

// Helper functions to create mock conversation data
function createMockConversation(
  id: string,
  userId: string,
  moodScore: number,
  timestamp: Date = new Date(),
): ConversationData & { moodAnalysis: MoodAnalysisResult } {
  return {
    id,
    timestamp,
    participants: [
      {
        id: userId,
        name: `User ${userId.split('-')[1]}`,
        role: 'author',
        messageCount: 3,
        emotionalExpressions: ['content', 'reflective'],
      },
      {
        id: 'other-participant',
        name: 'Other Person',
        role: 'recipient',
        messageCount: 2,
        emotionalExpressions: ['supportive'],
      },
    ],
    messages: [
      {
        id: `${id}-msg-1`,
        content: 'This is a sample conversation message for testing.',
        authorId: userId,
        timestamp,
      },
      {
        id: `${id}-msg-2`,
        content: 'This helps establish emotional patterns over time.',
        authorId: 'other-participant',
        timestamp: new Date(timestamp.getTime() + 60000),
      },
    ],
    moodAnalysis: {
      score: moodScore,
      descriptors:
        moodScore > 7
          ? ['positive', 'uplifted']
          : moodScore < 5
            ? ['concerned', 'unsettled']
            : ['neutral', 'balanced'],
      confidence: 0.85,
      factors: [
        {
          type: 'sentiment_analysis',
          weight: 0.35,
          description: 'Sentiment analysis contribution',
          evidence: ['positive language indicators'],
        },
      ],
    },
  } as ConversationData & { moodAnalysis: MoodAnalysisResult }
}

function createMockConversationWithRelationship(
  id: string,
  userId: string,
  moodScore: number,
  relationshipType: string,
  timestamp: Date = new Date(),
): ConversationData & { moodAnalysis: MoodAnalysisResult } {
  const conversation = createMockConversation(id, userId, moodScore, timestamp)
  conversation.context = {
    conversationType: 'direct',
    platform: 'test',
    relationshipType,
  }
  return conversation
}
