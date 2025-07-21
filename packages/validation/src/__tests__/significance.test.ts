import type { Memory } from '@studio/schema'

import {
  EmotionalState,
  EmotionalTheme,
  CommunicationPattern,
  InteractionQuality,
  ParticipantRole,
} from '@studio/schema'
import { describe, it, expect, beforeEach } from 'vitest'

import type { EmotionalSignificanceScore } from '../types'

import { PriorityManager } from '../significance/priority-manager'
import { createSignificanceWeighter } from '../significance/weighter'

describe('Significance Weighter', () => {
  let weighter: ReturnType<typeof createSignificanceWeighter>
  let mockMemory: Memory

  beforeEach(() => {
    weighter = createSignificanceWeighter()

    mockMemory = {
      id: 'test-memory-1',
      content: 'This was a life-changing moment when I announced my engagement',
      timestamp: '2024-01-15T10:30:00.000Z',
      author: { id: 'user-1', name: 'Self' },
      participants: [
        { id: 'user-1', name: 'Self', role: ParticipantRole.SELF },
        { id: 'user-2', name: 'Partner', role: ParticipantRole.PARTNER },
        { id: 'user-3', name: 'Family', role: ParticipantRole.FAMILY },
      ],
      emotionalContext: {
        primaryEmotion: EmotionalState.JOY,
        secondaryEmotions: [EmotionalState.EXCITEMENT],
        intensity: 0.9,
        valence: 0.8,
        themes: [EmotionalTheme.CELEBRATION, EmotionalTheme.CONNECTION],
        indicators: {
          phrases: ['life-changing moment', 'announced my engagement'],
          emotionalWords: ['joy', 'excitement'],
          styleIndicators: ['positive tone', 'milestone language'],
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
          secure: ['celebration', 'announcement'],
          anxious: [],
          avoidant: [],
        },
        healthIndicators: {
          positive: ['shared joy', 'family support'],
          negative: [],
          repairAttempts: [],
        },
        connectionStrength: 0.9,
      },
      tags: ['engagement', 'milestone', 'family'],
      metadata: {
        processedAt: '2024-01-15T11:00:00.000Z',
        schemaVersion: '1.0.0',
        source: 'import',
        confidence: 0.9,
      },
    }
  })

  describe('calculateSignificance', () => {
    it('calculates high significance for milestone memories', () => {
      const result = weighter.calculateSignificance(mockMemory)

      expect(result.overall).toBeGreaterThan(0.5)
      expect(result.factors.emotionalIntensity).toBeGreaterThan(0.7)
      expect(result.factors.relationshipImpact).toBeGreaterThanOrEqual(0.3)
      expect(result.factors.lifeEventSignificance).toBeGreaterThan(0.7)
      expect(result.narrative).toContain('significance')
    })

    it('handles mundane memories with lower significance', () => {
      mockMemory.content = 'Had coffee this morning'
      mockMemory.emotionalContext = {
        primaryEmotion: EmotionalState.NEUTRAL,
        secondaryEmotions: [],
        intensity: 0.3,
        valence: 0.0,
        themes: [],
        indicators: {
          phrases: ['had coffee'],
          emotionalWords: ['morning'],
          styleIndicators: ['casual tone'],
        },
      }
      mockMemory.relationshipDynamics = {
        communicationPattern: CommunicationPattern.FORMAL,
        interactionQuality: InteractionQuality.NEUTRAL,
        powerDynamics: {
          isBalanced: true,
          concerningPatterns: [],
        },
        attachmentIndicators: {
          secure: [],
          anxious: [],
          avoidant: [],
        },
        healthIndicators: {
          positive: [],
          negative: [],
          repairAttempts: [],
        },
        connectionStrength: 0.3,
      }
      mockMemory.tags = ['coffee', 'morning']

      const result = weighter.calculateSignificance(mockMemory)

      expect(result.overall).toBeLessThan(0.5)
      expect(result.factors.lifeEventSignificance).toBeLessThan(0.5)
    })

    it('identifies vulnerable participant situations', () => {
      mockMemory.participants = [
        { id: 'user-1', name: 'Caregiver', role: ParticipantRole.FAMILY },
        { id: 'user-2', name: 'Child', role: ParticipantRole.FAMILY },
      ]
      mockMemory.emotionalContext = {
        ...mockMemory.emotionalContext!,
        themes: [EmotionalTheme.SUPPORT, EmotionalTheme.GROWTH],
      }

      const result = weighter.calculateSignificance(mockMemory)

      expect(result.factors.participantVulnerability).toBeGreaterThanOrEqual(
        0.3,
      )
    })

    it('assigns higher temporal importance to recent memories', () => {
      const recentDate = new Date()
      recentDate.setDate(recentDate.getDate() - 10) // 10 days ago
      mockMemory.timestamp = recentDate.toISOString()

      const result = weighter.calculateSignificance(mockMemory)

      expect(result.factors.temporalImportance).toBeGreaterThan(0.6)
    })

    it('generates meaningful narratives', () => {
      const result = weighter.calculateSignificance(mockMemory)

      expect(result.narrative).toBeTruthy()
      expect(result.narrative).toContain('.')
      expect(result.narrative.length).toBeGreaterThan(20)
    })
  })

  describe('prioritizeMemories', () => {
    it('prioritizes high-significance memories first', () => {
      const lowSigMemory: Memory = {
        ...mockMemory,
        id: 'low-sig',
        content: 'Routine task',
        emotionalContext: {
          primaryEmotion: 'neutral',
          intensity: 0.2,
          emotionalStates: [],
          themes: [],
        },
        tags: [],
      }

      const memories = [lowSigMemory, mockMemory]
      const result = weighter.prioritizeMemories(memories)

      expect(result.memories[0].memory.id).toBe('test-memory-1')
      expect(result.memories[0].priorityRank).toBe(1)
      expect(result.memories[1].priorityRank).toBe(2)
      expect(result.totalCount).toBe(2)
    })

    it('provides appropriate review context', () => {
      const result = weighter.prioritizeMemories([mockMemory])

      const prioritized = result.memories[0]
      expect(prioritized.reviewContext.reviewReason).toBeTruthy()
      expect(prioritized.reviewContext.focusAreas).toBeInstanceOf(Array)
      expect(prioritized.reviewContext.validationHints).toBeInstanceOf(Array)
    })

    it('calculates significance distribution correctly', () => {
      const memories: Memory[] = [
        mockMemory, // high significance
        {
          ...mockMemory,
          id: 'medium',
          emotionalContext: { ...mockMemory.emotionalContext!, intensity: 0.5 },
        },
        {
          ...mockMemory,
          id: 'low',
          content: 'Simple daily task',
          emotionalContext: null,
          relationshipDynamics: null,
          tags: [],
          metadata: { ...mockMemory.metadata, confidence: 0.3 },
        },
      ]

      const result = weighter.prioritizeMemories(memories)

      expect(result.significanceDistribution.medium).toBeGreaterThan(0)
      expect(result.significanceDistribution.low).toBeGreaterThan(0)
      expect(result.totalCount).toBe(3)
    })
  })

  describe('optimizeReviewQueue', () => {
    it('optimizes queue based on available time', () => {
      const queue = {
        id: 'test-queue',
        pendingMemories: [mockMemory],
        resourceAllocation: {
          availableTime: 30, // 30 minutes
          targetDate: '2024-01-16T10:00:00.000Z',
          validatorExpertise: 'intermediate' as const,
        },
      }

      const result = weighter.optimizeReviewQueue(queue)

      expect(result.originalQueue).toBe(queue)
      expect(result.optimizedOrder).toBeInstanceOf(Array)
      expect(result.strategy.name).toBeTruthy()
      expect(result.strategy.expectedOutcomes.estimatedTime).toBeGreaterThan(0)
    })

    it('adjusts strategy based on validator expertise', () => {
      const expertQueue = {
        id: 'expert-queue',
        pendingMemories: Array(10)
          .fill(mockMemory)
          .map((m, i) => ({ ...m, id: `memory-${i}` })),
        resourceAllocation: {
          availableTime: 60,
          targetDate: '2024-01-16T10:00:00.000Z',
          validatorExpertise: 'expert' as const,
        },
      }

      const beginnerQueue = {
        ...expertQueue,
        id: 'beginner-queue',
        resourceAllocation: {
          ...expertQueue.resourceAllocation,
          validatorExpertise: 'beginner' as const,
        },
      }

      const expertResult = weighter.optimizeReviewQueue(expertQueue)
      const beginnerResult = weighter.optimizeReviewQueue(beginnerQueue)

      // Expert should be able to handle more memories in the same time
      expect(expertResult.strategy.expectedOutcomes.estimatedTime).toBeLessThan(
        beginnerResult.strategy.expectedOutcomes.estimatedTime,
      )
    })
  })
})

describe('PriorityManager', () => {
  let manager: PriorityManager
  let mockMemories: Memory[]
  let significanceScores: Map<string, EmotionalSignificanceScore>

  beforeEach(() => {
    manager = new PriorityManager()

    mockMemories = [
      {
        id: 'memory-1',
        content: 'High significance memory',
        timestamp: '2024-01-15T10:00:00.000Z',
        participants: [{ id: 'user-1' }],
        emotionalContext: { primaryEmotion: 'joy' },
        tags: ['important'],
      },
      {
        id: 'memory-2',
        content: 'Low significance memory',
        timestamp: '2024-01-15T11:00:00.000Z',
        participants: [{ id: 'user-1' }],
        emotionalContext: { primaryEmotion: 'neutral' },
        tags: ['routine'],
      },
    ] as Memory[]

    significanceScores = new Map([
      [
        'memory-1',
        {
          overall: 0.9,
          factors: {
            emotionalIntensity: 0.9,
            relationshipImpact: 0.8,
            lifeEventSignificance: 0.9,
            participantVulnerability: 0.3,
            temporalImportance: 0.7,
          },
          narrative: 'Highly significant memory',
        },
      ],
      [
        'memory-2',
        {
          overall: 0.3,
          factors: {
            emotionalIntensity: 0.3,
            relationshipImpact: 0.3,
            lifeEventSignificance: 0.2,
            participantVulnerability: 0.3,
            temporalImportance: 0.5,
          },
          narrative: 'Low significance memory',
        },
      ],
    ])
  })

  describe('createPrioritizedList', () => {
    it('creates correctly ordered priority list', () => {
      const result = manager.createPrioritizedList(
        mockMemories,
        significanceScores,
      )

      expect(result.memories[0].memory.id).toBe('memory-1')
      expect(result.memories[0].priorityRank).toBe(1)
      expect(result.memories[1].memory.id).toBe('memory-2')
      expect(result.memories[1].priorityRank).toBe(2)
    })

    it('includes review context for each memory', () => {
      const result = manager.createPrioritizedList(
        mockMemories,
        significanceScores,
      )

      const highPriorityMemory = result.memories[0]
      expect(highPriorityMemory.reviewContext.reviewReason).toBeTruthy()
      expect(highPriorityMemory.reviewContext.focusAreas).toBeInstanceOf(Array)
      expect(highPriorityMemory.reviewContext.validationHints).toBeInstanceOf(
        Array,
      )
    })

    it('throws error for missing significance scores', () => {
      const incompleteScores = new Map([
        ['memory-1', significanceScores.get('memory-1')!],
      ])

      expect(() => {
        manager.createPrioritizedList(mockMemories, incompleteScores)
      }).toThrow('Missing significance score')
    })
  })

  describe('optimizeQueue', () => {
    it('optimizes queue based on available resources', () => {
      const queue = {
        id: 'test-queue',
        pendingMemories: mockMemories,
        resourceAllocation: {
          availableTime: 60,
          targetDate: '2024-01-16T10:00:00.000Z',
          validatorExpertise: 'intermediate' as const,
        },
      }

      const prioritizedList = manager.createPrioritizedList(
        mockMemories,
        significanceScores,
      )
      const result = manager.optimizeQueue(queue, prioritizedList)

      expect(result.optimizedOrder.length).toBeLessThanOrEqual(
        mockMemories.length,
      )
      expect(result.strategy.expectedOutcomes.estimatedTime).toBeGreaterThan(0)
      expect(result.strategy.expectedOutcomes.expectedQuality).toBeGreaterThan(
        0,
      )
    })

    it('selects appropriate optimization strategy', () => {
      const smallQueue = {
        id: 'small-queue',
        pendingMemories: mockMemories.slice(0, 1),
        resourceAllocation: {
          availableTime: 15, // Limited time
          targetDate: '2024-01-16T10:00:00.000Z',
          validatorExpertise: 'beginner' as const,
        },
      }

      const prioritizedList = manager.createPrioritizedList(
        mockMemories.slice(0, 1),
        new Map([['memory-1', significanceScores.get('memory-1')!]]),
      )
      const result = manager.optimizeQueue(smallQueue, prioritizedList)

      expect(result.strategy.name).toBeTruthy()
      expect(result.strategy.parameters).toBeDefined()
    })
  })
})
