import { EmotionalState, EmotionalTheme, ParticipantRole } from '@studio/schema'
import { describe, it, expect, beforeEach } from 'vitest'

import type {
  ExtractedMemory,
  MoodDelta,
  ConversationData,
  ConversationParticipant,
  EmotionalAnalysis,
} from '../../types'

import { MemoryPrioritizer } from '../prioritizer'

describe('Delta-Aware Memory Prioritization - Task 5.5', () => {
  let prioritizer: MemoryPrioritizer
  let baseConversationData: ConversationData
  let baseParticipants: ConversationParticipant[]

  beforeEach(() => {
    prioritizer = new MemoryPrioritizer()

    baseParticipants = [
      {
        id: 'user-1',
        name: 'Alice',
        role: 'author',
      },
      {
        id: 'user-2',
        name: 'Bob',
        role: 'recipient',
      },
    ]

    baseConversationData = {
      id: 'conv-test-001',
      messages: [
        {
          id: 'msg-1',
          content: 'I feel much better today than yesterday.',
          authorId: 'user-1',
          timestamp: new Date('2025-01-22T10:00:00Z'),
        },
        {
          id: 'msg-2',
          content: 'That is wonderful to hear!',
          authorId: 'user-2',
          timestamp: new Date('2025-01-22T10:01:00Z'),
        },
      ],
      participants: baseParticipants,
      startTime: new Date('2025-01-22T10:00:00Z'),
      endTime: new Date('2025-01-22T10:01:00Z'),
      timestamp: new Date('2025-01-22T10:00:00Z'),
    }
  })

  describe('Emotional Transition-Based Ranking', () => {
    it('should prioritize memories with significant mood deltas (1.5+ points)', async () => {
      const significantDeltaMemory = createMemoryWithMoodDelta({
        previous: 3.2,
        current: 5.1, // 1.9 point increase
        significance: 0.85,
        type: 'improvement',
      })

      const minorDeltaMemory = createMemoryWithMoodDelta({
        previous: 5.0,
        current: 5.8, // 0.8 point increase
        significance: 0.45,
        type: 'gradual',
      })

      const memories = [minorDeltaMemory, significantDeltaMemory]
      const prioritized = await prioritizer.prioritizeBySignificance(memories)

      expect(prioritized[0].id).toBe(significantDeltaMemory.id)
      expect(prioritized[1].id).toBe(minorDeltaMemory.id)
    })

    it('should prioritize sudden change transitions (2.0+ points) over gradual changes', async () => {
      const suddenChangeMemory = createMemoryWithMoodDelta({
        previous: 7.5,
        current: 4.8, // 2.7 point sudden drop
        significance: 0.92,
        type: 'sudden',
        transitionType: 'decline',
      })

      const gradualChangeMemory = createMemoryWithMoodDelta({
        previous: 4.0,
        current: 6.2, // 2.2 point gradual improvement
        significance: 0.75,
        type: 'gradual',
        transitionType: 'improvement',
      })

      const memories = [gradualChangeMemory, suddenChangeMemory]
      const prioritized = await prioritizer.prioritizeBySignificance(memories)

      expect(prioritized[0].id).toBe(suddenChangeMemory.id)
      expect(prioritized[1].id).toBe(gradualChangeMemory.id)
    })

    it('should prioritize mood repair moments with recovery patterns', async () => {
      const moodRepairMemory = createMemoryWithMoodRepair({
        previousLow: 2.8,
        currentRecovery: 6.4, // 3.6 point recovery
        repairEffectiveness: 0.87,
        supportPatterns: ['active_listening', 'validation', 'encouragement'],
      })

      const standardMemory = createMemoryWithMoodDelta({
        previous: 5.0,
        current: 7.2, // 2.2 point increase but not repair
        significance: 0.68,
        type: 'improvement',
      })

      const memories = [standardMemory, moodRepairMemory]
      const prioritized = await prioritizer.prioritizeBySignificance(memories)

      expect(prioritized[0].id).toBe(moodRepairMemory.id)
      expect(prioritized[1].id).toBe(standardMemory.id)
    })

    it('should handle memories with multiple delta types and prioritize by emotional impact', async () => {
      const volatileMemory = createMemoryWithComplexDeltas([
        { previous: 6.0, current: 3.5, type: 'sudden', significance: 0.88 },
        { previous: 3.5, current: 7.2, type: 'recovery', significance: 0.91 },
        {
          previous: 7.2,
          current: 5.8,
          type: 'stabilization',
          significance: 0.72,
        },
      ])

      const simpleMemory = createMemoryWithMoodDelta({
        previous: 5.0,
        current: 8.5, // Large but single delta
        significance: 0.8,
        type: 'improvement',
      })

      const memories = [simpleMemory, volatileMemory]
      const prioritized = await prioritizer.prioritizeBySignificance(memories)

      expect(prioritized[0].id).toBe(volatileMemory.id)
      expect(prioritized[1].id).toBe(simpleMemory.id)
    })
  })

  describe('Delta Impact Weighting', () => {
    it('should weight negative deltas (crisis situations) higher than positive ones', async () => {
      const crisisMemory = createMemoryWithMoodDelta({
        previous: 7.2,
        current: 2.1, // 5.1 point crisis drop
        significance: 0.95,
        type: 'sudden',
        transitionType: 'crisis',
        urgencyIndicators: ['distress', 'help-seeking'],
      })

      const celebrationMemory = createMemoryWithMoodDelta({
        previous: 4.0,
        current: 9.1, // 5.1 point celebration increase
        significance: 0.85,
        type: 'sudden',
        transitionType: 'breakthrough',
      })

      const memories = [celebrationMemory, crisisMemory]
      const prioritized = await prioritizer.prioritizeBySignificance(memories)

      expect(prioritized[0].id).toBe(crisisMemory.id)
      expect(prioritized[1].id).toBe(celebrationMemory.id)
    })

    it('should apply delta confidence weighting to prioritization scores', async () => {
      const highConfidenceDeltaMemory = createMemoryWithMoodDelta({
        previous: 4.5,
        current: 7.2, // 2.7 point delta
        significance: 0.92,
        type: 'improvement',
        confidence: 0.95, // Very confident delta detection
      })

      const lowConfidenceDeltaMemory = createMemoryWithMoodDelta({
        previous: 4.0,
        current: 7.5, // 3.5 point delta (larger)
        significance: 0.88,
        type: 'improvement',
        confidence: 0.52, // Low confidence delta detection
      })

      const memories = [lowConfidenceDeltaMemory, highConfidenceDeltaMemory]
      const prioritized = await prioritizer.prioritizeBySignificance(memories)

      expect(prioritized[0].id).toBe(highConfidenceDeltaMemory.id)
      expect(prioritized[1].id).toBe(lowConfidenceDeltaMemory.id)
    })

    it('should integrate delta timeline context in prioritization', async () => {
      // Create memory with recent delta (1 hour ago)
      const recentTime = new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1 hour ago
      const recentDeltaMemory = createMemoryWithSpecificDeltaTime({
        previous: 5.0,
        current: 7.8,
        significance: 0.85,
        type: 'recent_improvement',
        deltaTimestamp: recentTime,
      })

      // Create memory with historical delta (1 week ago)
      const historicalTime = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000,
      ).toISOString() // 1 week ago
      const historicalDeltaMemory = createMemoryWithSpecificDeltaTime({
        previous: 4.5,
        current: 8.2,
        significance: 0.88, // Higher significance but older
        type: 'historical_pattern',
        deltaTimestamp: historicalTime,
      })

      const memories = [historicalDeltaMemory, recentDeltaMemory]
      const prioritized = await prioritizer.prioritizeBySignificance(memories)

      // Recent deltas should be prioritized despite lower significance
      expect(prioritized[0].id).toBe(recentDeltaMemory.id)
      expect(prioritized[1].id).toBe(historicalDeltaMemory.id)
    })
  })

  describe('Relationship Context Integration', () => {
    it('should prioritize deltas occurring in high-intimacy relationships', async () => {
      const intimateRelationshipMemory = createMemoryWithRelationshipDelta({
        moodDelta: { previous: 3.8, current: 7.1, significance: 0.82 },
        relationshipContext: {
          intimacyLevel: 'high',
          supportLevel: 'high',
          trustLevel: 'high',
          emotionalSafety: 'high',
        },
      })

      const casualRelationshipMemory = createMemoryWithRelationshipDelta({
        moodDelta: { previous: 3.5, current: 7.4, significance: 0.85 }, // Higher mood delta
        relationshipContext: {
          intimacyLevel: 'low',
          supportLevel: 'medium',
          trustLevel: 'medium',
          emotionalSafety: 'medium',
        },
      })

      const memories = [casualRelationshipMemory, intimateRelationshipMemory]
      const prioritized = await prioritizer.prioritizeBySignificance(memories)

      expect(prioritized[0].id).toBe(intimateRelationshipMemory.id)
      expect(prioritized[1].id).toBe(casualRelationshipMemory.id)
    })

    it('should handle conflict-related deltas with appropriate priority weighting', async () => {
      const conflictResolutionMemory = createMemoryWithConflictDelta({
        conflictType: 'resolution',
        moodDelta: { previous: 2.5, current: 6.8, significance: 0.89 },
        conflictIntensity: 'high',
        resolutionEffectiveness: 0.92,
      })

      const conflictEscalationMemory = createMemoryWithConflictDelta({
        conflictType: 'escalation',
        moodDelta: { previous: 6.2, current: 2.9, significance: 0.93 },
        conflictIntensity: 'high',
        escalationSeverity: 0.87,
      })

      const memories = [conflictResolutionMemory, conflictEscalationMemory]
      const prioritized = await prioritizer.prioritizeBySignificance(memories)

      // Conflict escalation should be prioritized for urgent attention
      expect(prioritized[0].id).toBe(conflictEscalationMemory.id)
      expect(prioritized[1].id).toBe(conflictResolutionMemory.id)
    })
  })

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle memories with no detectable mood deltas appropriately', async () => {
      const noDeltaMemory = createMemoryWithoutDelta({
        stableMoodScore: 5.5,
        confidence: 0.88,
        conversationalSignificance: 0.65,
      })

      const subtleDeltaMemory = createMemoryWithMoodDelta({
        previous: 5.4,
        current: 5.9, // 0.5 point subtle change
        significance: 0.42,
        type: 'subtle',
      })

      const significantDeltaMemory = createMemoryWithMoodDelta({
        previous: 4.2,
        current: 7.1, // 2.9 point significant change
        significance: 0.87,
        type: 'improvement',
      })

      const memories = [
        noDeltaMemory,
        subtleDeltaMemory,
        significantDeltaMemory,
      ]
      const prioritized = await prioritizer.prioritizeBySignificance(memories)

      expect(prioritized[0].id).toBe(significantDeltaMemory.id)
      // No-delta and subtle-delta priorities depend on other factors
      expect([noDeltaMemory.id, subtleDeltaMemory.id]).toContain(
        prioritized[1].id,
      )
      expect([noDeltaMemory.id, subtleDeltaMemory.id]).toContain(
        prioritized[2].id,
      )
    })

    it('should prioritize mixed emotional state deltas with complexity assessment', async () => {
      const mixedEmotionalMemory = createMemoryWithMixedDeltas({
        positiveAspects: [
          { emotion: 'gratitude', delta: +2.3, confidence: 0.84 },
          { emotion: 'hope', delta: +1.8, confidence: 0.79 },
        ],
        negativeAspects: [
          { emotion: 'anxiety', delta: +1.5, confidence: 0.91 },
          { emotion: 'sadness', delta: +0.8, confidence: 0.73 },
        ],
        overallComplexity: 0.88,
      })

      const simplePositiveMemory = createMemoryWithMoodDelta({
        previous: 4.1,
        current: 7.8, // Large positive delta
        significance: 0.82,
        type: 'improvement',
      })

      const memories = [simplePositiveMemory, mixedEmotionalMemory]
      const prioritized = await prioritizer.prioritizeBySignificance(memories)

      // Mixed emotional complexity should be prioritized for analysis
      expect(prioritized[0].id).toBe(mixedEmotionalMemory.id)
      expect(prioritized[1].id).toBe(simplePositiveMemory.id)
    })
  })

  // Helper functions to create test memories with various delta characteristics

  function createMemoryWithMoodDelta(deltaConfig: {
    previous: number
    current: number
    significance: number
    type: string
    transitionType?: string
    confidence?: number
    urgencyIndicators?: string[]
  }): ExtractedMemory {
    const moodDelta: MoodDelta = {
      magnitude: Math.abs(deltaConfig.current - deltaConfig.previous),
      direction:
        deltaConfig.current > deltaConfig.previous ? 'positive' : 'negative',
      confidence: deltaConfig.confidence || 0.8,
      type: deltaConfig.type as any,
      factors: [`${deltaConfig.type}_transition`],
    }

    // Add the required extended properties to moodDelta for prioritizer compatibility
    const extendedMoodDelta = {
      ...moodDelta,
      previousScore: deltaConfig.previous,
      currentScore: deltaConfig.current,
      significance: deltaConfig.significance,
      detectedAt: new Date().toISOString(),
    }

    const emotionalAnalysis: EmotionalAnalysis = {
      context: {
        primaryEmotion:
          deltaConfig.current > 6
            ? EmotionalState.JOY
            : deltaConfig.current < 4
              ? EmotionalState.SADNESS
              : EmotionalState.NEUTRAL,
        secondaryEmotions: [],
        intensity: Math.abs(deltaConfig.current - 5) / 5,
        valence: deltaConfig.current > 5 ? 0.7 : 0.3,
        themes: [EmotionalTheme.GROWTH],
        indicators: {
          phrases: [],
          emotionalWords: [],
          styleIndicators: [],
        },
      },
      moodScoring: {
        score: deltaConfig.current,
        confidence: deltaConfig.confidence || 0.8,
        factors: [],
        descriptors:
          deltaConfig.current > 6
            ? ['positive', 'improving']
            : deltaConfig.current < 4
              ? ['negative', 'declining']
              : ['stable', 'neutral'],
        delta: extendedMoodDelta as MoodDelta,
      },
      trajectory: {
        direction:
          deltaConfig.current > deltaConfig.previous
            ? 'improving'
            : 'declining',
        significance: deltaConfig.significance,
        points: [
          {
            timestamp: new Date(Date.now() - 60000),
            moodScore: deltaConfig.previous,
          },
          {
            timestamp: new Date(),
            moodScore: deltaConfig.current,
          },
        ],
        turningPoints:
          deltaConfig.significance > 0.8
            ? [
                {
                  timestamp: new Date(),
                  type:
                    deltaConfig.transitionType === 'crisis'
                      ? 'setback'
                      : 'support_received',
                  magnitude: Math.abs(
                    deltaConfig.current - deltaConfig.previous,
                  ),
                  description: `${deltaConfig.type} delta detected`,
                  factors: [`${deltaConfig.type}_transition`],
                },
              ]
            : [],
      },
      patterns: [
        {
          type: deltaConfig.type as any,
          confidence: deltaConfig.significance,
          description: `${deltaConfig.type} mood pattern detected`,
          evidence: [
            `mood_change_from_${deltaConfig.previous}_to_${deltaConfig.current}`,
          ],
          significance: deltaConfig.significance,
        },
      ],
    }

    return {
      id: `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: `Memory with ${deltaConfig.type} mood delta from ${deltaConfig.previous} to ${deltaConfig.current}`,
      author: {
        id: baseParticipants[0].id,
        name: baseParticipants[0].name,
        role: ParticipantRole.SELF,
      },
      participants: baseParticipants.map((p) => ({
        id: p.id,
        name: p.name,
        role:
          p.role === 'author' ? ParticipantRole.SELF : ParticipantRole.OTHER,
      })),
      tags: [],
      emotionalContext: {
        primaryEmotion:
          deltaConfig.current > 6
            ? EmotionalState.JOY
            : deltaConfig.current < 4
              ? EmotionalState.SADNESS
              : EmotionalState.NEUTRAL,
        secondaryEmotions: [],
        intensity: Math.abs(deltaConfig.current - 5) / 5,
        valence: deltaConfig.current > 5 ? 0.7 : 0.3,
        themes: [EmotionalTheme.GROWTH],
        indicators: {
          phrases: [],
          emotionalWords: [],
          styleIndicators: [],
        },
      },
      relationshipDynamics: {
        communicationPattern: 'SUPPORTIVE' as any,
        interactionQuality: 'POSITIVE' as any,
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
        connectionStrength: 0.7,
        participantDynamics: [],
      },
      metadata: {
        processedAt: new Date().toISOString(),
        schemaVersion: '1.0.0',
        source: 'test',
        confidence: deltaConfig.confidence || 0.8,
      },
      timestamp: new Date().toISOString(),
      processing: {
        extractedAt: new Date(),
        confidence: deltaConfig.confidence || 0.8,
        quality: {
          overall: 0.85,
          components: {
            emotionalRichness: 0.88,
            relationshipClarity: 0.85,
            contentCoherence: 0.82,
            contextualSignificance: 0.87,
          },
          confidence: deltaConfig.confidence || 0.8,
          issues: [],
        },
        sourceData: baseConversationData,
      },
      emotionalAnalysis,
      significance: {
        overall: deltaConfig.significance * 10,
        components: {
          emotionalSalience: deltaConfig.significance * 10,
          relationshipImpact: 7.0,
          contextualImportance: 6.5,
          temporalRelevance: 8.0,
        },
        confidence: deltaConfig.confidence || 0.8,
        category: deltaConfig.significance > 0.8 ? 'critical' : 'high',
        validationPriority: deltaConfig.urgencyIndicators ? 9.0 : 6.0,
      },
    }
  }

  function createMemoryWithMoodRepair(repairConfig: {
    previousLow: number
    currentRecovery: number
    repairEffectiveness: number
    supportPatterns: string[]
  }): ExtractedMemory {
    return createMemoryWithMoodDelta({
      previous: repairConfig.previousLow,
      current: repairConfig.currentRecovery,
      significance: repairConfig.repairEffectiveness,
      type: 'mood_repair',
      transitionType: 'recovery',
      confidence: 0.88,
    })
  }

  function createMemoryWithComplexDeltas(
    deltaConfigs: Array<{
      previous: number
      current: number
      type: string
      significance: number
    }>,
  ): ExtractedMemory {
    // Use the most significant delta as the primary one
    const primaryDelta = deltaConfigs.reduce((max, delta) =>
      delta.significance > max.significance ? delta : max,
    )

    return createMemoryWithMoodDelta({
      previous: primaryDelta.previous,
      current: primaryDelta.current,
      significance: primaryDelta.significance,
      type: 'volatile',
      transitionType: 'complex',
      confidence: 0.85,
    })
  }

  function createMemoryWithSpecificDeltaTime(config: {
    previous: number
    current: number
    significance: number
    type: string
    deltaTimestamp: string
  }): ExtractedMemory {
    const memory = createMemoryWithMoodDelta({
      previous: config.previous,
      current: config.current,
      significance: config.significance,
      type: config.type,
      confidence: 0.85,
    })

    // Add detectedAt property to delta for recency calculation
    if (memory.emotionalAnalysis.moodScoring.delta) {
      const deltaObj = memory.emotionalAnalysis.moodScoring.delta as any
      deltaObj.detectedAt = new Date(config.deltaTimestamp)
      deltaObj.previousScore = config.previous
      deltaObj.currentScore = config.current
      deltaObj.significance = config.significance
    }

    return memory
  }

  function createMemoryWithRelationshipDelta(config: {
    moodDelta: { previous: number; current: number; significance: number }
    relationshipContext: {
      intimacyLevel: string
      supportLevel: string
      trustLevel: string
      emotionalSafety: string
    }
  }): ExtractedMemory {
    const memory = createMemoryWithMoodDelta({
      previous: config.moodDelta.previous,
      current: config.moodDelta.current,
      significance: config.moodDelta.significance,
      type: 'relationship_context',
      confidence: 0.87,
    })

    // Override relationship dynamics to match the test requirements
    memory.extendedRelationshipDynamics = {
      type: 'friend',
      supportLevel: config.relationshipContext.supportLevel as any,
      intimacyLevel: config.relationshipContext.intimacyLevel as any,
      intimacy: config.relationshipContext.intimacyLevel as any, // Backwards compatibility
      conflictLevel: 'low',
      trustLevel: config.relationshipContext.trustLevel as any,
      conflictPresent: false,
      conflictIntensity: 'low',
      communicationStyle: 'supportive',
      communicationStyleDetails: {
        vulnerabilityLevel: 'medium',
        emotionalSafety: config.relationshipContext.emotionalSafety as any,
        supportPatterns: [],
        conflictPatterns: [],
        professionalBoundaries: false,
        guidancePatterns: [],
        therapeuticElements: [],
      },
      participantDynamics: {
        supportBalance: 'balanced',
        mutualVulnerability: true,
      },
      emotionalSafety: {
        overall: config.relationshipContext.emotionalSafety as any,
        acceptanceLevel: 'high',
        judgmentRisk: 'low',
        validationPresent: true,
      },
    }

    return memory
  }

  function createMemoryWithConflictDelta(config: {
    conflictType: string
    moodDelta: { previous: number; current: number; significance: number }
    conflictIntensity: string
    resolutionEffectiveness?: number
    escalationSeverity?: number
  }): ExtractedMemory {
    return createMemoryWithMoodDelta({
      previous: config.moodDelta.previous,
      current: config.moodDelta.current,
      significance: config.moodDelta.significance,
      type: config.conflictType,
      transitionType:
        config.conflictType === 'escalation' ? 'crisis' : 'resolution',
      confidence: 0.89,
      urgencyIndicators:
        config.conflictType === 'escalation'
          ? ['conflict', 'escalation']
          : undefined,
    })
  }

  function createMemoryWithoutDelta(config: {
    stableMoodScore: number
    confidence: number
    conversationalSignificance: number
  }): ExtractedMemory {
    return createMemoryWithMoodDelta({
      previous: config.stableMoodScore,
      current: config.stableMoodScore, // No change
      significance: config.conversationalSignificance,
      type: 'stable',
      confidence: config.confidence,
    })
  }

  function createMemoryWithMixedDeltas(config: {
    positiveAspects: Array<{
      emotion: string
      delta: number
      confidence: number
    }>
    negativeAspects: Array<{
      emotion: string
      delta: number
      confidence: number
    }>
    overallComplexity: number
  }): ExtractedMemory {
    // Calculate net mood change from mixed emotions
    const positiveSum = config.positiveAspects.reduce(
      (sum, aspect) => sum + aspect.delta,
      0,
    )
    const negativeSum = config.negativeAspects.reduce(
      (sum, aspect) => sum + aspect.delta,
      0,
    )
    const netDelta = positiveSum - negativeSum

    return createMemoryWithMoodDelta({
      previous: 5.0, // Baseline
      current: 5.0 + netDelta,
      significance: config.overallComplexity,
      type: 'mixed_emotional',
      transitionType: 'complex',
      confidence: 0.85,
    })
  }
})
