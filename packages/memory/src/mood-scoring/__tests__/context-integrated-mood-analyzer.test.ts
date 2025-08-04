import { describe, it, expect, beforeEach } from 'vitest'

import type { ConversationData, MoodAnalysisResult } from '../../types'

// import { MoodScoringAnalyzer } from '../analyzer'
import { EmotionalBaselineManager } from '../emotional-baseline-manager'
import { EmotionalContextBuilder } from '../emotional-context-builder'
import { RelationshipContextAnalyzer } from '../relationship-context-analyzer'

describe('Context-Integrated Mood Analysis - Relationship-Aware Scoring (Task 3.7)', () => {
  // let moodAnalyzer: MoodScoringAnalyzer
  let contextBuilder: EmotionalContextBuilder
  let relationshipAnalyzer: RelationshipContextAnalyzer
  let baselineManager: EmotionalBaselineManager

  beforeEach(() => {
    // moodAnalyzer = new MoodScoringAnalyzer({
    //   emotionalKeywords: new Map([
    //     ['happy', { valence: 0.8, intensity: 0.7 }],
    //     ['sad', { valence: -0.7, intensity: 0.6 }],
    //   ]),
    // })

    contextBuilder = new EmotionalContextBuilder({
      triggerSensitivity: 0.7,
      contextualDepth: 'comprehensive',
      relationshipWeighting: true,
    })

    relationshipAnalyzer = new RelationshipContextAnalyzer({
      confidenceThreshold: 0.7,
      intimacyAnalysisDepth: 'comprehensive',
    })

    baselineManager = new EmotionalBaselineManager({
      minimumDataPoints: 5,
      baselineUpdateThreshold: 0.3,
      historicalDepth: 30,
    })
  })

  describe('Contextual Factor Integration', () => {
    it('should enhance mood analysis with vulnerability context for lower-scoring conversations', async () => {
      const vulnerableConversation = createVulnerableConversation()

      // Standard mood analysis
      // const standardAnalysis = await moodAnalyzer.analyzeConversation(vulnerableConversation) // Placeholder for future comparison

      // Context-enhanced analysis
      const contextualFactors = contextBuilder.identifyContextualFactors(
        vulnerableConversation,
      )
      const relationshipDynamics =
        relationshipAnalyzer.analyzeRelationshipDynamics(vulnerableConversation)

      // Context should indicate high vulnerability and intimacy
      expect(contextualFactors.primaryTriggers).toContain(
        'vulnerability_expression',
      )
      expect(contextualFactors.contextualSignificance).toBe('high')
      expect(relationshipDynamics.intimacy).toBe('high')
      expect(relationshipDynamics.emotionalSafety.overall).toBe('high')

      // Context-enhanced score should be adjusted for relationship dynamics
      // Vulnerable conversations in safe relationships should have contextual adjustment
      expect(
        contextualFactors.contextualSummary!.recommendedMoodAdjustments,
      ).toContain('baseline_elevation')
      expect(contextualFactors.relationshipSpecificFactors.intimacyLevel).toBe(
        'high',
      )
      expect(
        contextualFactors.relationshipSpecificFactors.trustDependency,
      ).toBe('high')
    })

    it('should apply conflict context penalties for escalating relationship conflicts', async () => {
      const conflictConversation = createConflictConversation()

      // Standard mood analysis
      // const standardAnalysis = await moodAnalyzer.analyzeConversation( // Placeholder for future comparisonconflictConversation)

      // Context-enhanced analysis
      const contextualFactors =
        contextBuilder.identifyContextualFactors(conflictConversation)
      const relationshipDynamics =
        relationshipAnalyzer.analyzeRelationshipDynamics(conflictConversation)

      // Context should indicate conflict escalation
      expect(contextualFactors.primaryTriggers).toContain('conflict_escalation')
      expect(contextualFactors.primaryTriggers).toContain('defensive_response')
      expect(
        contextualFactors.relationshipSpecificFactors.conflictHistory,
      ).toBe('escalating')
      expect(
        contextualFactors.relationshipSpecificFactors.communicationBreakdown,
      ).toBe(true)

      // Relationship dynamics should reflect conflict
      expect(relationshipDynamics.conflictPresent).toBe(true)
      expect(relationshipDynamics.conflictIntensity).toBe('high')
      expect(relationshipDynamics.emotionalSafety.overall).toBe('low')

      // Context should indicate additional mood impact from relationship breakdown
      expect(contextualFactors.emotionalSafetyFactors).toContain(
        'dismissal_patterns',
      )
      expect(contextualFactors.emotionalSafetyFactors).toContain(
        'defensive_positioning',
      )
    })

    it('should boost mood scores for achievement contexts with strong support systems', async () => {
      const celebrationConversation = createCelebrationConversation()

      // Standard mood analysis
      // const standardAnalysis = await moodAnalyzer.analyzeConversation( // Placeholder for future comparisoncelebrationConversation)

      // Context-enhanced analysis
      const contextualFactors = contextBuilder.identifyContextualFactors(
        celebrationConversation,
      )
      const relationshipDynamics =
        relationshipAnalyzer.analyzeRelationshipDynamics(
          celebrationConversation,
        )

      // Context should indicate achievement and strong support
      expect(contextualFactors.primaryTriggers).toContain(
        'achievement_recognition',
      )
      expect(contextualFactors.primaryTriggers).toContain(
        'positive_reinforcement',
      )
      expect(contextualFactors.relationshipSpecificFactors.supportLevel).toBe(
        'high',
      )
      expect(
        contextualFactors.relationshipSpecificFactors.validationPatterns,
      ).toContain('achievement_celebration')

      // Relationship dynamics should reflect strong support
      expect(relationshipDynamics.supportLevel).toBe('high')
      expect(relationshipDynamics.emotionalSafety.overall).toBe('high')
      expect(relationshipDynamics.intimacy).toBe('medium') // Achievement sharing implies some intimacy

      // Context should recommend mood elevation due to supportive context
      expect(
        contextualFactors.contextualSummary!.recommendedMoodAdjustments,
      ).toContain('baseline_elevation')
      expect(contextualFactors.emotionalSafetyFactors).toContain(
        'unconditional_support',
      )
    })

    it('should apply therapeutic context adjustments for professional counseling interactions', async () => {
      const therapeuticConversation = createTherapeuticConversation()

      // Standard mood analysis
      // const standardAnalysis = await moodAnalyzer.analyzeConversation( // Placeholder for future comparisontherapeuticConversation)

      // Context-enhanced analysis
      const contextualFactors = contextBuilder.identifyContextualFactors(
        therapeuticConversation,
      )
      const relationshipDynamics =
        relationshipAnalyzer.analyzeRelationshipDynamics(
          therapeuticConversation,
        )

      // Context should indicate therapeutic breakthrough
      expect(contextualFactors.primaryTriggers).toContain('insight_moment')
      expect(contextualFactors.primaryTriggers).toContain('pattern_recognition')
      expect(contextualFactors.therapeuticFactors!).toBeDefined()
      expect(
        contextualFactors.therapeuticFactors!.breakthroughIndicators,
      ).toContain('self_realization')
      expect(contextualFactors.therapeuticFactors!.progressMarkers).toContain(
        'behavioral_insight',
      )

      // Relationship dynamics should reflect professional boundaries
      expect(
        contextualFactors.relationshipSpecificFactors.professionalBoundaries,
      ).toBe(true)
      expect(contextualFactors.relationshipSpecificFactors.guidanceStyle).toBe(
        'reflective',
      )
      expect(relationshipDynamics.communicationStyle).toBe('reflective')

      // Therapeutic progress should have specific mood implications
      expect(contextualFactors.contextualSignificance).toBe('high')
    })
  })

  describe('Temporal Context Integration', () => {
    it('should apply late-night vulnerability adjustments to mood analysis', async () => {
      const lateNightConversation = createLateNightConversation()

      // Standard mood analysis
      // const standardAnalysis = await moodAnalyzer.analyzeConversation( // Placeholder for future comparisonlateNightConversation)

      // Context-enhanced analysis
      const contextualFactors = contextBuilder.identifyContextualFactors(
        lateNightConversation,
      )

      // Context should indicate temporal vulnerability
      expect(contextualFactors.temporalFactors!).toBeDefined()
      expect(contextualFactors.temporalFactors!.timeOfDay).toBe('late_night')
      expect(contextualFactors.temporalFactors!.emotionalVulnerability).toBe(
        'heightened',
      )
      expect(contextualFactors.temporalFactors!.contextualTriggers).toContain(
        'emotional_fatigue',
      )
      expect(contextualFactors.temporalFactors!.contextualTriggers).toContain(
        'reduced_emotional_barriers',
      )

      // Primary triggers should include temporal vulnerability
      expect(contextualFactors.primaryTriggers).toContain(
        'temporal_vulnerability',
      )

      // Late-night conversations should be weighted differently
      expect(contextualFactors.factorWeighting!.temporalWeight).toBeGreaterThan(
        0.1,
      )
    })

    it('should integrate stress accumulation patterns into mood scoring', async () => {
      const stressConversation = createProlongedStressConversation()

      // Standard mood analysis
      // const standardAnalysis = await moodAnalyzer.analyzeConversation( // Placeholder for future comparisonstressConversation)

      // Context-enhanced analysis
      const contextualFactors =
        contextBuilder.identifyContextualFactors(stressConversation)

      // Context should indicate stress accumulation
      expect(contextualFactors.stressFactors!).toBeDefined()
      expect(contextualFactors.stressFactors!.accumulationPattern).toBe(
        'escalating',
      )
      expect(contextualFactors.stressFactors!.durationImpact).toBe(
        'significant',
      )
      expect(contextualFactors.stressFactors!.fatigueIndicators).toContain(
        'cognitive_overload',
      )

      // Primary triggers should include stress accumulation
      expect(contextualFactors.primaryTriggers).toContain('stress_accumulation')

      // Stress context should indicate high significance
      expect(contextualFactors.contextualSignificance).toBe('high')
    })

    it('should contextualize major life transitions in mood analysis', async () => {
      const lifeTransitionConversation = createLifeEventConversation()

      // Standard mood analysis
      // const standardAnalysis = await moodAnalyzer.analyzeConversation( // Placeholder for future comparisonlifeTransitionConversation)

      // Context-enhanced analysis
      const contextualFactors = contextBuilder.identifyContextualFactors(
        lifeTransitionConversation,
      )

      // Context should indicate major life transition
      expect(contextualFactors.lifeEventFactors!).toBeDefined()
      expect(contextualFactors.lifeEventFactors!.eventType).toBe(
        'major_transition',
      )
      expect(contextualFactors.lifeEventFactors!.emotionalImpact).toBe('high')
      expect(contextualFactors.lifeEventFactors!.supportNeed).toBe('elevated')
      expect(
        contextualFactors.lifeEventFactors!.adaptationChallenges,
      ).toContain('uncertainty_management')

      // Primary triggers should include life transition stress
      expect(contextualFactors.primaryTriggers).toContain(
        'life_transition_stress',
      )
    })
  })

  describe('Baseline-Aware Context Integration', () => {
    it('should integrate emotional baseline context for personalized mood assessment', async () => {
      const userId = 'context-user-123'

      // Establish baseline from historical conversations
      const historicalConversations = [
        createBaselineConversation(userId, 7.0, new Date('2024-01-01')),
        createBaselineConversation(userId, 7.2, new Date('2024-01-02')),
        createBaselineConversation(userId, 6.8, new Date('2024-01-03')),
        createBaselineConversation(userId, 7.1, new Date('2024-01-04')),
        createBaselineConversation(userId, 6.9, new Date('2024-01-05')),
      ]

      await baselineManager.establishBaseline(userId, historicalConversations)

      // Current conversation significantly below baseline
      const currentConversation = createTestConversation(userId, 4.5)

      // Standard mood analysis
      // const standardAnalysis = await moodAnalyzer.analyzeConversation(currentConversation) // Placeholder for future comparison

      // Context-enhanced analysis with baseline
      const contextualFactors =
        contextBuilder.identifyContextualFactors(currentConversation)
      const deviationAnalysis = baselineManager.analyzeDeviation(
        userId,
        currentConversation,
      )

      // Deviation should be significant
      expect(deviationAnalysis.deviationType).toBe('significant_decline')
      expect(deviationAnalysis.deviationMagnitude).toBeGreaterThan(2.0)
      expect(deviationAnalysis.contextualSignificance).toBe('high')
      expect(deviationAnalysis.percentileRank).toBeLessThan(10)

      // Context should be adjusted for this significant deviation
      expect(contextualFactors.contextualSignificance).toBe('high')
    })

    it('should apply relationship-specific baseline adjustments', async () => {
      const userId = 'relationship-user-456'

      // Historical conversations with different relationship types
      const historicalConversations = [
        createRelationshipConversation(userId, 8.5, 'romantic'),
        createRelationshipConversation(userId, 8.2, 'romantic'),
        createRelationshipConversation(userId, 6.0, 'professional'),
        createRelationshipConversation(userId, 5.8, 'professional'),
        createRelationshipConversation(userId, 7.0, 'family'),
      ]

      const baseline = baselineManager.establishBaseline(
        userId,
        historicalConversations,
      )

      // Current romantic conversation should be compared to romantic baseline, not overall
      const currentRomanticConversation = createRelationshipConversation(
        userId,
        6.0,
        'romantic',
      )

      // Context-enhanced analysis
      // const contextualFactors = contextBuilder.identifyContextualFactors(currentRomanticConversation) // Placeholder for future use
      const deviationAnalysis = baselineManager.analyzeDeviation(
        userId,
        currentRomanticConversation,
      )

      // Should show significant deviation from romantic baseline (8.35 avg) to 6.0
      expect(deviationAnalysis.deviationType).toBe('significant_decline')
      expect(deviationAnalysis.contextualSignificance).toBe('high')

      // Relationship patterns should be available in baseline
      expect(baseline.relationshipPatterns.romantic).toBeDefined()
      expect(
        baseline.relationshipPatterns.romantic.averageMood,
      ).toBeGreaterThan(8.0)
      expect(baseline.relationshipPatterns.professional).toBeDefined()
      expect(
        baseline.relationshipPatterns.professional.averageMood,
      ).toBeLessThan(6.5)
    })
  })

  describe('Comprehensive Context Integration', () => {
    it('should provide multi-dimensional context-aware mood analysis', async () => {
      const comprehensiveConversation = createComprehensiveContextConversation()

      // Standard mood analysis
      // const standardAnalysis = await moodAnalyzer.analyzeConversation(comprehensiveConversation) // Placeholder for future comparison

      // Full context analysis
      const contextualFactors = contextBuilder.identifyContextualFactors(
        comprehensiveConversation,
      )
      // const relationshipDynamics = relationshipAnalyzer.analyzeRelationshipDynamics(comprehensiveConversation) // Placeholder for future use

      // Should integrate multiple contextual dimensions
      expect(contextualFactors.primaryTriggers.length).toBeGreaterThan(1)
      expect(contextualFactors.contextualSummary!).toBeDefined()
      expect(contextualFactors.contextualSummary!.dominantContext).toBe(
        'emotional_support',
      )
      expect(contextualFactors.contextualSummary!.secondaryContexts).toContain(
        'vulnerability_sharing',
      )
      expect(contextualFactors.contextualSummary!.emotionalClimate).toBe(
        'supportive',
      )

      // Should provide comprehensive weighting
      expect(contextualFactors.factorWeighting!).toBeDefined()
      expect(
        contextualFactors.factorWeighting!.relationshipWeight,
      ).toBeGreaterThan(0.4)
      expect(contextualFactors.overallContextConfidence).toBeGreaterThan(0.8)

      // Should recommend mood adjustments based on context
      expect(
        contextualFactors.contextualSummary!.recommendedMoodAdjustments,
      ).toContain('baseline_elevation')
      expect(contextualFactors.contextualSummary!.supportiveElements).toContain(
        'active_listening',
      )

      // Risk factors should be contextually appropriate
      expect(contextualFactors.contextualSummary!.riskFactors).toContain(
        'emotional_overwhelm',
      )
    })

    it('should demonstrate context sensitivity in mood scoring accuracy', async () => {
      // Test various context types to ensure appropriate sensitivity
      const testScenarios = [
        {
          conversation: createVulnerableConversation(),
          expectedAdjustment: 'support_amplification',
        },
        {
          conversation: createConflictConversation(),
          expectedAdjustment: 'conflict_penalty',
        },
        {
          conversation: createCelebrationConversation(),
          expectedAdjustment: 'achievement_boost',
        },
        {
          conversation: createTherapeuticConversation(),
          expectedAdjustment: 'therapeutic_progress',
        },
        {
          conversation: createLateNightConversation(),
          expectedAdjustment: 'temporal_vulnerability',
        },
      ]

      for (const scenario of testScenarios) {
        const contextualFactors = contextBuilder.identifyContextualFactors(
          scenario.conversation,
        )
        const relationshipDynamics =
          relationshipAnalyzer.analyzeRelationshipDynamics(
            scenario.conversation,
          )

        // Each scenario should produce contextually appropriate analysis
        expect(contextualFactors.contextualSignificance).toBeOneOf([
          'medium',
          'high',
        ])
        expect(contextualFactors.primaryTriggers.length).toBeGreaterThan(0)
        expect(contextualFactors.confidenceScore).toBeGreaterThan(0.7)
        expect(contextualFactors.overallContextConfidence).toBeGreaterThan(0.7)

        // Relationship dynamics should be consistently analyzed
        expect(relationshipDynamics).toBeDefined()
        expect(['high', 'medium', 'low']).toContain(
          relationshipDynamics.intimacy,
        )
        expect(['high', 'medium', 'low', 'negative']).toContain(
          relationshipDynamics.supportLevel,
        )
        expect(['high', 'medium', 'low']).toContain(
          relationshipDynamics.emotionalSafety.overall,
        )
      }
    })
  })
})

// Helper functions to create test conversations

function createVulnerableConversation(): ConversationData & {
  moodAnalysis: MoodAnalysisResult
} {
  return {
    id: 'vulnerable-conv-1',
    timestamp: new Date('2024-01-15T14:30:00Z'),
    participants: [
      {
        id: 'vulnerable-user',
        name: 'Sarah',
        role: 'vulnerable_sharer',
        messageCount: 6,
        emotionalExpressions: ['scared', 'vulnerable', 'uncertain', 'trusting'],
      },
      {
        id: 'supporter',
        name: 'Emma',
        role: 'emotional_leader',
        messageCount: 4,
        emotionalExpressions: ['caring', 'protective', 'reassuring'],
      },
    ],
    messages: [
      {
        id: 'msg1',
        content:
          "I've been struggling with something really personal and I don't know who else to talk to about this",
        authorId: 'vulnerable-user',
        timestamp: new Date('2024-01-15T14:30:00Z'),
      },
      {
        id: 'msg2',
        content: "I'm here for you. You can trust me with whatever is going on",
        authorId: 'supporter',
        timestamp: new Date('2024-01-15T14:32:00Z'),
      },
      {
        id: 'msg3',
        content:
          "I'm so scared about how people will react if they find out. I feel like I'm living a lie",
        authorId: 'vulnerable-user',
        timestamp: new Date('2024-01-15T14:35:00Z'),
      },
    ],
    moodAnalysis: {
      score: 4.2,
      descriptors: ['vulnerable', 'anxious'],
      confidence: 0.87,
      factors: [
        {
          type: 'emotional_words',
          weight: 0.4,
          description: 'High vulnerability indicators',
          evidence: ['scared', 'struggling', 'living a lie'],
        },
      ],
    },
  } as ConversationData & { moodAnalysis: MoodAnalysisResult }
}

function createConflictConversation(): ConversationData & {
  moodAnalysis: MoodAnalysisResult
} {
  return {
    id: 'conflict-conv-1',
    timestamp: new Date('2024-01-15T18:45:00Z'),
    participants: [
      {
        id: 'user1',
        name: 'Alex',
        role: 'author',
        messageCount: 5,
        emotionalExpressions: ['frustrated', 'defensive', 'angry'],
      },
      {
        id: 'user2',
        name: 'Jordan',
        role: 'recipient',
        messageCount: 4,
        emotionalExpressions: ['dismissive', 'stubborn', 'irritated'],
      },
    ],
    messages: [
      {
        id: 'msg1',
        content:
          "I can't believe you're dismissing my feelings again. This always happens when I try to talk about something important",
        authorId: 'user1',
        timestamp: new Date('2024-01-15T18:45:00Z'),
      },
      {
        id: 'msg2',
        content:
          "You're being way too sensitive about this. It's not that big of a deal",
        authorId: 'user2',
        timestamp: new Date('2024-01-15T18:47:00Z'),
      },
      {
        id: 'msg3',
        content:
          "See? There you go again, invalidating how I feel. I'm done trying to explain this to you",
        authorId: 'user1',
        timestamp: new Date('2024-01-15T18:50:00Z'),
      },
    ],
    moodAnalysis: {
      score: 2.8,
      descriptors: ['frustrated', 'angry'],
      confidence: 0.92,
      factors: [
        {
          type: 'interaction_pattern',
          weight: 0.5,
          description: 'Conflict escalation pattern',
          evidence: ['dismissing', 'invalidating', 'defensive responses'],
        },
      ],
    },
  } as ConversationData & { moodAnalysis: MoodAnalysisResult }
}

function createCelebrationConversation(): ConversationData & {
  moodAnalysis: MoodAnalysisResult
} {
  return {
    id: 'celebration-conv-1',
    timestamp: new Date('2024-01-15T12:00:00Z'),
    participants: [
      {
        id: 'achiever',
        name: 'Maya',
        role: 'author',
        messageCount: 3,
        emotionalExpressions: ['excited', 'proud', 'grateful'],
      },
      {
        id: 'celebrator',
        name: 'Chris',
        role: 'supporter',
        messageCount: 4,
        emotionalExpressions: ['enthusiastic', 'proud', 'supportive'],
      },
    ],
    messages: [
      {
        id: 'msg1',
        content:
          "I got the promotion! I can't believe it actually happened after all the hard work",
        authorId: 'achiever',
        timestamp: new Date('2024-01-15T12:00:00Z'),
      },
      {
        id: 'msg2',
        content:
          "That's incredible! I'm so proud of you. You absolutely deserved this recognition",
        authorId: 'celebrator',
        timestamp: new Date('2024-01-15T12:02:00Z'),
      },
      {
        id: 'msg3',
        content:
          "Thank you for believing in me when I didn't believe in myself. Your support means everything",
        authorId: 'achiever',
        timestamp: new Date('2024-01-15T12:05:00Z'),
      },
    ],
    moodAnalysis: {
      score: 8.9,
      descriptors: ['elated', 'grateful'],
      confidence: 0.95,
      factors: [
        {
          type: 'emotional_words',
          weight: 0.4,
          description: 'Strong positive achievement emotions',
          evidence: ['incredible', 'proud', 'deserved', 'believing'],
        },
      ],
    },
  } as ConversationData & { moodAnalysis: MoodAnalysisResult }
}

function createTherapeuticConversation(): ConversationData & {
  moodAnalysis: MoodAnalysisResult
} {
  return {
    id: 'therapeutic-conv-1',
    timestamp: new Date('2024-01-15T16:00:00Z'),
    participants: [
      {
        id: 'client',
        name: 'Patient',
        role: 'vulnerable_sharer',
        messageCount: 5,
        emotionalExpressions: ['confused', 'insightful', 'relieved'],
      },
      {
        id: 'therapist',
        name: 'Dr. Smith',
        role: 'listener',
        messageCount: 4,
        emotionalExpressions: ['professional', 'empathetic', 'guiding'],
      },
    ],
    messages: [
      {
        id: 'msg1',
        content:
          "I keep having the same argument with people and I don't understand why it keeps happening",
        authorId: 'client',
        timestamp: new Date('2024-01-15T16:00:00Z'),
      },
      {
        id: 'msg2',
        content:
          'What do you notice about the pattern in these arguments? What themes come up for you?',
        authorId: 'therapist',
        timestamp: new Date('2024-01-15T16:02:00Z'),
      },
      {
        id: 'msg3',
        content:
          "Now that you ask... I think I always feel like I'm not being heard. Oh wow, that connects to my childhood",
        authorId: 'client',
        timestamp: new Date('2024-01-15T16:08:00Z'),
      },
    ],
    moodAnalysis: {
      score: 6.5,
      descriptors: ['insightful', 'processing'],
      confidence: 0.84,
      factors: [
        {
          type: 'psychological_indicators',
          weight: 0.4,
          description: 'Therapeutic breakthrough indicators',
          evidence: [
            'pattern recognition',
            'insight moment',
            'connecting themes',
          ],
        },
      ],
    },
  } as ConversationData & { moodAnalysis: MoodAnalysisResult }
}

function createLateNightConversation(): ConversationData & {
  moodAnalysis: MoodAnalysisResult
} {
  return {
    id: 'late-night-conv-1',
    timestamp: new Date('2024-01-15T23:45:00Z'),
    participants: [
      {
        id: 'night-user',
        name: 'Sam',
        role: 'vulnerable_sharer',
        messageCount: 4,
        emotionalExpressions: ['tired', 'emotional', 'raw'],
      },
      {
        id: 'supporter',
        name: 'Riley',
        role: 'supporter',
        messageCount: 3,
        emotionalExpressions: ['concerned', 'caring'],
      },
    ],
    messages: [
      {
        id: 'msg1',
        content:
          "I can't sleep again. My mind just won't stop racing about everything that's wrong in my life",
        authorId: 'night-user',
        timestamp: new Date('2024-01-15T23:45:00Z'),
      },
      {
        id: 'msg2',
        content:
          "It's so late, are you okay? Do you want to talk about what's keeping you up?",
        authorId: 'supporter',
        timestamp: new Date('2024-01-15T23:47:00Z'),
      },
      {
        id: 'msg3',
        content:
          'Everything feels so much worse at night. I feel so alone and scared about the future',
        authorId: 'night-user',
        timestamp: new Date('2024-01-15T23:50:00Z'),
      },
    ],
    moodAnalysis: {
      score: 3.4,
      descriptors: ['anxious', 'isolated'],
      confidence: 0.89,
      factors: [
        {
          type: 'context_clues',
          weight: 0.3,
          description: 'Late night emotional vulnerability',
          evidence: ["can't sleep", 'racing mind', 'worse at night'],
        },
      ],
    },
  } as ConversationData & { moodAnalysis: MoodAnalysisResult }
}

function createProlongedStressConversation(): ConversationData & {
  moodAnalysis: MoodAnalysisResult
} {
  return {
    id: 'stress-conv-1',
    timestamp: new Date('2024-01-15T10:00:00Z'),
    participants: [
      {
        id: 'stressed-user',
        name: 'Taylor',
        role: 'author',
        messageCount: 8,
        emotionalExpressions: ['overwhelmed', 'exhausted', 'frustrated'],
      },
      {
        id: 'listener',
        name: 'Morgan',
        role: 'listener',
        messageCount: 6,
        emotionalExpressions: ['concerned', 'supportive'],
      },
    ],
    messages: [
      {
        id: 'msg1',
        content:
          "Work has been absolutely crushing me lately. I can't keep up with all the demands",
        authorId: 'stressed-user',
        timestamp: new Date('2024-01-15T10:00:00Z'),
      },
      {
        id: 'msg2',
        content:
          'That sounds really overwhelming. How long has this been building up?',
        authorId: 'listener',
        timestamp: new Date('2024-01-15T10:05:00Z'),
      },
      {
        id: 'msg3',
        content:
          "Months now. And it's affecting everything - my sleep, my relationships, my health. I feel like I'm drowning",
        authorId: 'stressed-user',
        timestamp: new Date('2024-01-15T10:15:00Z'),
      },
    ],
    moodAnalysis: {
      score: 2.9,
      descriptors: ['overwhelmed', 'exhausted'],
      confidence: 0.91,
      factors: [
        {
          type: 'psychological_indicators',
          weight: 0.4,
          description: 'Chronic stress indicators',
          evidence: ['crushing', 'drowning', 'affecting everything'],
        },
      ],
    },
  } as ConversationData & { moodAnalysis: MoodAnalysisResult }
}

function createLifeEventConversation(): ConversationData & {
  moodAnalysis: MoodAnalysisResult
} {
  return {
    id: 'life-event-conv-1',
    timestamp: new Date('2024-01-15T15:30:00Z'),
    participants: [
      {
        id: 'transitioning-user',
        name: 'Casey',
        role: 'author',
        messageCount: 5,
        emotionalExpressions: ['uncertain', 'anxious', 'hopeful'],
      },
      {
        id: 'confidant',
        name: 'Drew',
        role: 'supporter',
        messageCount: 4,
        emotionalExpressions: ['understanding', 'encouraging'],
      },
    ],
    messages: [
      {
        id: 'msg1',
        content:
          "Moving across the country for this new job is exciting but also terrifying. I'm leaving everything I know",
        authorId: 'transitioning-user',
        timestamp: new Date('2024-01-15T15:30:00Z'),
      },
      {
        id: 'msg2',
        content:
          "Big life changes are always scary, even the good ones. It's normal to feel mixed emotions about this",
        authorId: 'confidant',
        timestamp: new Date('2024-01-15T15:35:00Z'),
      },
      {
        id: 'msg3',
        content:
          "What if I can't make new friends? What if I hate the new city? There are so many unknowns",
        authorId: 'transitioning-user',
        timestamp: new Date('2024-01-15T15:40:00Z'),
      },
    ],
    moodAnalysis: {
      score: 5.8,
      descriptors: ['ambivalent', 'anticipatory'],
      confidence: 0.82,
      factors: [
        {
          type: 'context_clues',
          weight: 0.4,
          description: 'Major life transition stress',
          evidence: ['moving', 'leaving everything', 'unknowns'],
        },
      ],
    },
  } as ConversationData & { moodAnalysis: MoodAnalysisResult }
}

function createComprehensiveContextConversation(): ConversationData & {
  moodAnalysis: MoodAnalysisResult
} {
  return {
    id: 'comprehensive-conv-1',
    timestamp: new Date('2024-01-15T21:00:00Z'),
    participants: [
      {
        id: 'multi-faceted-user',
        name: 'Phoenix',
        role: 'vulnerable_sharer',
        messageCount: 9,
        emotionalExpressions: [
          'vulnerable',
          'hopeful',
          'grateful',
          'uncertain',
        ],
      },
      {
        id: 'comprehensive-supporter',
        name: 'Rowan',
        role: 'emotional_leader',
        messageCount: 8,
        emotionalExpressions: [
          'empathetic',
          'wise',
          'protective',
          'encouraging',
        ],
      },
    ],
    messages: [
      {
        id: 'msg1',
        content:
          "I wanted to update you on how therapy has been going. It's been really intense but also eye-opening",
        authorId: 'multi-faceted-user',
        timestamp: new Date('2024-01-15T21:00:00Z'),
      },
      {
        id: 'msg2',
        content:
          "I'm so proud of you for doing that work. What kinds of things are you discovering?",
        authorId: 'comprehensive-supporter',
        timestamp: new Date('2024-01-15T21:03:00Z'),
      },
      {
        id: 'msg3',
        content:
          "A lot about my patterns in relationships and how my past affects my present. It's scary but liberating",
        authorId: 'multi-faceted-user',
        timestamp: new Date('2024-01-15T21:07:00Z'),
      },
      {
        id: 'msg4',
        content:
          "Growth is never easy, but you're doing something so brave. I'm here to support you through this",
        authorId: 'comprehensive-supporter',
        timestamp: new Date('2024-01-15T21:10:00Z'),
      },
    ],
    moodAnalysis: {
      score: 7.4,
      descriptors: ['hopeful', 'processing'],
      confidence: 0.91,
      factors: [
        {
          type: 'psychological_indicators',
          weight: 0.4,
          description: 'Personal growth and therapeutic progress',
          evidence: [
            'therapy progress',
            'self-discovery',
            'pattern recognition',
          ],
        },
        {
          type: 'relationship_context',
          weight: 0.3,
          description: 'Strong support system',
          evidence: [
            'emotional support',
            'encouragement',
            'unconditional presence',
          ],
        },
      ],
    },
  } as ConversationData & { moodAnalysis: MoodAnalysisResult }
}

function createBaselineConversation(
  userId: string,
  moodScore: number,
  timestamp: Date = new Date(),
): ConversationData & { moodAnalysis: MoodAnalysisResult } {
  return {
    id: `baseline-conv-${timestamp.getTime()}`,
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
        id: `msg-${timestamp.getTime()}-1`,
        content:
          'This is a sample conversation message for baseline establishment.',
        authorId: userId,
        timestamp,
      },
      {
        id: `msg-${timestamp.getTime()}-2`,
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

function createRelationshipConversation(
  userId: string,
  moodScore: number,
  relationshipType: string,
  timestamp: Date = new Date(),
): ConversationData & { moodAnalysis: MoodAnalysisResult } {
  const conversation = createBaselineConversation(userId, moodScore, timestamp)
  conversation.context = {
    conversationType: 'direct',
    platform: 'test',
    relationshipType,
  }
  return conversation
}

function createTestConversation(
  userId: string,
  moodScore: number,
  timestamp: Date = new Date(),
): ConversationData & { moodAnalysis: MoodAnalysisResult } {
  return createBaselineConversation(userId, moodScore, timestamp)
}
