import { describe, it, expect, beforeEach } from 'vitest'

import type {
  ConversationData,
  MoodAnalysisResult,
  // RelationshipDynamics,
} from '../../types'

import { EmotionalContextBuilder } from '../emotional-context-builder'

describe('EmotionalContextBuilder - Contextual Factor Identification System', () => {
  let contextBuilder: EmotionalContextBuilder

  beforeEach(() => {
    contextBuilder = new EmotionalContextBuilder({
      triggerSensitivity: 0.7,
      contextualDepth: 'comprehensive',
      relationshipWeighting: true,
    })
  })

  describe('Relationship-Specific Trigger Analysis (Task 3.5)', () => {
    describe('Contextual Factor Identification', () => {
      it('should identify support-seeking triggers in vulnerable relationships', () => {
        const vulnerableConversation = createVulnerableConversation()

        const contextualFactors = contextBuilder.identifyContextualFactors(
          vulnerableConversation,
        )

        expect(contextualFactors).toBeDefined()
        expect(contextualFactors.primaryTriggers).toContain(
          'vulnerability_expression',
        )
        expect(contextualFactors.primaryTriggers).toContain('support_seeking')
        expect(contextualFactors.relationshipSpecificFactors).toBeDefined()
        expect(
          contextualFactors.relationshipSpecificFactors.intimacyLevel,
        ).toBe('high')
        expect(
          contextualFactors.relationshipSpecificFactors.trustDependency,
        ).toBe('high')
        expect(contextualFactors.emotionalSafetyFactors).toContain(
          'fear_of_judgment',
        )
        expect(contextualFactors.confidenceScore).toBeGreaterThan(0.8)
      })

      it('should detect conflict escalation triggers in tense relationships', () => {
        const conflictConversation = createConflictConversation()

        const contextualFactors =
          contextBuilder.identifyContextualFactors(conflictConversation)

        expect(contextualFactors.primaryTriggers).toContain(
          'conflict_escalation',
        )
        expect(contextualFactors.primaryTriggers).toContain(
          'defensive_response',
        )
        expect(
          contextualFactors.relationshipSpecificFactors.conflictHistory,
        ).toBe('escalating')
        expect(
          contextualFactors.relationshipSpecificFactors.communicationBreakdown,
        ).toBe(true)
        expect(contextualFactors.emotionalSafetyFactors).toContain(
          'dismissal_patterns',
        )
        expect(contextualFactors.emotionalSafetyFactors).toContain(
          'defensive_positioning',
        )
      })

      it('should recognize celebration and positive reinforcement triggers', () => {
        const celebratingConversation = createCelebratingConversation()

        const contextualFactors = contextBuilder.identifyContextualFactors(
          celebratingConversation,
        )

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
        expect(contextualFactors.emotionalSafetyFactors).toContain(
          'unconditional_support',
        )
        expect(contextualFactors.contextualSignificance).toBe('high')
      })

      it('should identify therapeutic breakthrough triggers in counseling contexts', () => {
        const therapeuticConversation = createTherapeuticConversation()

        const contextualFactors = contextBuilder.identifyContextualFactors(
          therapeuticConversation,
        )

        expect(contextualFactors.primaryTriggers).toContain('insight_moment')
        expect(contextualFactors.primaryTriggers).toContain(
          'pattern_recognition',
        )
        expect(
          contextualFactors.relationshipSpecificFactors.professionalBoundaries,
        ).toBe(true)
        expect(
          contextualFactors.relationshipSpecificFactors.guidanceStyle,
        ).toBe('reflective')
        expect(contextualFactors.therapeuticFactors!).toBeDefined()
        expect(
          contextualFactors.therapeuticFactors!.breakthroughIndicators,
        ).toContain('self_realization')
        expect(contextualFactors.therapeuticFactors!.progressMarkers).toContain(
          'behavioral_insight',
        )
      })
    })

    describe('Environmental and Temporal Context', () => {
      it('should analyze time-based emotional patterns and triggers', () => {
        const lateNightConversation = createLateNightConversation()

        const contextualFactors = contextBuilder.identifyContextualFactors(
          lateNightConversation,
        )

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
        expect(contextualFactors.primaryTriggers).toContain(
          'temporal_vulnerability',
        )
      })

      it('should detect stress accumulation patterns over conversation duration', () => {
        const prolongedStressConversation = createProlongedStressConversation()

        const contextualFactors = contextBuilder.identifyContextualFactors(
          prolongedStressConversation,
        )

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
        expect(contextualFactors.stressFactors!.copingMechanisms).toContain(
          'withdrawal_tendency',
        )
        expect(contextualFactors.primaryTriggers).toContain(
          'stress_accumulation',
        )
      })

      it('should identify life event contextual influences', () => {
        const lifeEventConversation = createLifeEventConversation()

        const contextualFactors = contextBuilder.identifyContextualFactors(
          lifeEventConversation,
        )

        expect(contextualFactors.lifeEventFactors!).toBeDefined()
        expect(contextualFactors.lifeEventFactors!.eventType).toBe(
          'major_transition',
        )
        expect(contextualFactors.lifeEventFactors!.emotionalImpact).toBe('high')
        expect(contextualFactors.lifeEventFactors!.supportNeed).toBe('elevated')
        expect(
          contextualFactors.lifeEventFactors!.adaptationChallenges,
        ).toContain('uncertainty_management')
        expect(contextualFactors.primaryTriggers).toContain(
          'life_transition_stress',
        )
      })
    })

    describe('Communication Pattern Analysis', () => {
      it('should analyze linguistic patterns and emotional triggers', () => {
        const linguisticPatternsConversation =
          createLinguisticPatternsConversation()

        const contextualFactors = contextBuilder.identifyContextualFactors(
          linguisticPatternsConversation,
        )

        expect(contextualFactors.linguisticFactors!).toBeDefined()
        expect(contextualFactors.linguisticFactors!.emotionalIntensity).toBe(
          'high',
        )
        expect(
          contextualFactors.linguisticFactors!.vulnerabilityMarkers,
        ).toContain('self_disclosure')
        expect(contextualFactors.linguisticFactors!.supportSeeking).toContain(
          'indirect_requests',
        )
        expect(contextualFactors.linguisticFactors!.emotionalRegulation).toBe(
          'struggling',
        )
        expect(contextualFactors.primaryTriggers).toContain(
          'emotional_overwhelm',
        )
      })

      it('should detect non-verbal communication indicators', () => {
        const nonVerbalConversation = createNonVerbalConversation()

        const contextualFactors = contextBuilder.identifyContextualFactors(
          nonVerbalConversation,
        )

        expect(contextualFactors.nonVerbalFactors!).toBeDefined()
        expect(contextualFactors.nonVerbalFactors!.messageFrequency).toBe(
          'rapid',
        )
        expect(contextualFactors.nonVerbalFactors!.responseLatency).toBe(
          'immediate',
        )
        expect(contextualFactors.nonVerbalFactors!.emotionalUrgency).toBe(
          'high',
        )
        expect(contextualFactors.nonVerbalFactors!.communicationStyle).toBe(
          'stream_of_consciousness',
        )
        expect(contextualFactors.primaryTriggers).toContain('emotional_urgency')
      })

      it('should identify avoidance and withdrawal patterns', () => {
        const avoidanceConversation = createAvoidanceConversation()

        const contextualFactors = contextBuilder.identifyContextualFactors(
          avoidanceConversation,
        )

        expect(contextualFactors.avoidanceFactors!).toBeDefined()
        expect(contextualFactors.avoidanceFactors!.topicAvoidance).toBe(
          'active',
        )
        expect(contextualFactors.avoidanceFactors!.emotionalWithdrawal).toBe(
          'moderate',
        )
        expect(
          contextualFactors.avoidanceFactors!.deflectionStrategies,
        ).toContain('subject_change')
        expect(
          contextualFactors.avoidanceFactors!.underlyingConcerns,
        ).toContain('fear_of_vulnerability')
        expect(contextualFactors.primaryTriggers).toContain(
          'avoidance_behavior',
        )
      })
    })

    describe('Contextual Integration and Weighting', () => {
      it('should weight contextual factors based on relationship dynamics', () => {
        const complexConversation = createComplexRelationshipConversation()

        const contextualFactors =
          contextBuilder.identifyContextualFactors(complexConversation)

        expect(contextualFactors.factorWeighting!).toBeDefined()
        expect(
          contextualFactors.factorWeighting!.relationshipWeight,
        ).toBeGreaterThan(0.4)
        expect(contextualFactors.factorWeighting!.temporalWeight).toBeLessThan(
          0.3,
        )
        expect(
          contextualFactors.factorWeighting!.linguisticWeight,
        ).toBeGreaterThan(0.2)
        expect(contextualFactors.overallContextConfidence).toBeGreaterThan(0.75)
        expect(contextualFactors.primaryContextType).toBe(
          'relationship_focused',
        )
      })

      it('should provide comprehensive contextual summary for mood analysis', () => {
        const comprehensiveConversation = createComprehensiveConversation()

        const contextualFactors = contextBuilder.identifyContextualFactors(
          comprehensiveConversation,
        )

        expect(contextualFactors.contextualSummary!).toBeDefined()
        expect(contextualFactors.contextualSummary!.dominantContext).toBe(
          'emotional_support',
        )
        expect(
          contextualFactors.contextualSummary!.secondaryContexts,
        ).toContain('vulnerability_sharing')
        expect(contextualFactors.contextualSummary!.emotionalClimate).toBe(
          'supportive',
        )
        expect(contextualFactors.contextualSummary!.riskFactors).toContain(
          'emotional_overwhelm',
        )
        expect(
          contextualFactors.contextualSummary!.supportiveElements,
        ).toContain('active_listening')
        expect(
          contextualFactors.contextualSummary!.recommendedMoodAdjustments,
        ).toContain('baseline_elevation')
      })
    })
  })
})

// Helper functions to create different types of conversations for testing

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

function createCelebratingConversation(): ConversationData & {
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

function createLinguisticPatternsConversation(): ConversationData & {
  moodAnalysis: MoodAnalysisResult
} {
  return {
    id: 'linguistic-conv-1',
    timestamp: new Date('2024-01-15T20:15:00Z'),
    participants: [
      {
        id: 'expressive-user',
        name: 'River',
        role: 'vulnerable_sharer',
        messageCount: 6,
        emotionalExpressions: ['intense', 'overwhelmed', 'desperate'],
      },
      {
        id: 'listener',
        name: 'Sage',
        role: 'listener',
        messageCount: 3,
        emotionalExpressions: ['concerned', 'attentive'],
      },
    ],
    messages: [
      {
        id: 'msg1',
        content:
          "I just... I don't know how to explain this feeling. It's like I'm screaming inside but no one can hear me",
        authorId: 'expressive-user',
        timestamp: new Date('2024-01-15T20:15:00Z'),
      },
      {
        id: 'msg2',
        content:
          'I hear the pain in your words. Can you tell me more about what that feeling is like for you?',
        authorId: 'listener',
        timestamp: new Date('2024-01-15T20:18:00Z'),
      },
      {
        id: 'msg3',
        content:
          "It's like being trapped in a glass box... watching life happen but not being able to participate... does that make sense?",
        authorId: 'expressive-user',
        timestamp: new Date('2024-01-15T20:22:00Z'),
      },
    ],
    moodAnalysis: {
      score: 3.1,
      descriptors: ['distressed', 'isolated'],
      confidence: 0.93,
      factors: [
        {
          type: 'language_sentiment',
          weight: 0.5,
          description: 'High emotional intensity with metaphorical expression',
          evidence: ['screaming inside', 'glass box', 'trapped'],
        },
      ],
    },
  } as ConversationData & { moodAnalysis: MoodAnalysisResult }
}

function createNonVerbalConversation(): ConversationData & {
  moodAnalysis: MoodAnalysisResult
} {
  // Simulating rapid-fire emotional messages
  const messages = []
  const baseTime = new Date('2024-01-15T19:30:00Z')

  for (let i = 0; i < 8; i++) {
    messages.push({
      id: `rapid-msg-${i + 1}`,
      content:
        i % 2 === 0
          ? 'I need to tell you something'
          : "Actually no wait I can't do this",
      authorId: 'urgent-user',
      timestamp: new Date(baseTime.getTime() + i * 30000), // 30 seconds apart
    })
  }

  return {
    id: 'nonverbal-conv-1',
    timestamp: baseTime,
    participants: [
      {
        id: 'urgent-user',
        name: 'Quinn',
        role: 'author',
        messageCount: 8,
        emotionalExpressions: ['urgent', 'conflicted', 'impulsive'],
      },
      {
        id: 'recipient',
        name: 'Blake',
        role: 'recipient',
        messageCount: 2,
        emotionalExpressions: ['confused', 'concerned'],
      },
    ],
    messages,
    moodAnalysis: {
      score: 4.7,
      descriptors: ['agitated', 'conflicted'],
      confidence: 0.78,
      factors: [
        {
          type: 'conversational_flow',
          weight: 0.4,
          description: 'Rapid message frequency indicating emotional urgency',
          evidence: [
            'message frequency',
            'immediate corrections',
            'contradictory statements',
          ],
        },
      ],
    },
  } as ConversationData & { moodAnalysis: MoodAnalysisResult }
}

function createAvoidanceConversation(): ConversationData & {
  moodAnalysis: MoodAnalysisResult
} {
  return {
    id: 'avoidance-conv-1',
    timestamp: new Date('2024-01-15T13:20:00Z'),
    participants: [
      {
        id: 'avoidant-user',
        name: 'Avery',
        role: 'author',
        messageCount: 4,
        emotionalExpressions: ['evasive', 'uncomfortable', 'deflective'],
      },
      {
        id: 'curious-friend',
        name: 'Jordan',
        role: 'recipient',
        messageCount: 5,
        emotionalExpressions: ['concerned', 'persistent'],
      },
    ],
    messages: [
      {
        id: 'msg1',
        content: 'How are you feeling about the conversation we had yesterday?',
        authorId: 'curious-friend',
        timestamp: new Date('2024-01-15T13:20:00Z'),
      },
      {
        id: 'msg2',
        content:
          'Oh, you know... anyway, did you see that movie that just came out?',
        authorId: 'avoidant-user',
        timestamp: new Date('2024-01-15T13:22:00Z'),
      },
      {
        id: 'msg3',
        content:
          "We can talk about movies later. I'm worried about you and want to check in",
        authorId: 'curious-friend',
        timestamp: new Date('2024-01-15T13:25:00Z'),
      },
      {
        id: 'msg4',
        content: "I'm fine, really. Hey, what are your plans for the weekend?",
        authorId: 'avoidant-user',
        timestamp: new Date('2024-01-15T13:27:00Z'),
      },
    ],
    moodAnalysis: {
      score: 5.2,
      descriptors: ['neutral', 'guarded'],
      confidence: 0.69,
      factors: [
        {
          type: 'interaction_pattern',
          weight: 0.4,
          description: 'Avoidance and deflection patterns',
          evidence: ['topic change', 'dismissive responses', 'deflection'],
        },
      ],
    },
  } as ConversationData & { moodAnalysis: MoodAnalysisResult }
}

function createComplexRelationshipConversation(): ConversationData & {
  moodAnalysis: MoodAnalysisResult
} {
  return {
    id: 'complex-conv-1',
    timestamp: new Date('2024-01-15T17:00:00Z'),
    participants: [
      {
        id: 'complex-user',
        name: 'Charlie',
        role: 'vulnerable_sharer',
        messageCount: 7,
        emotionalExpressions: ['conflicted', 'grateful', 'uncertain'],
      },
      {
        id: 'long-time-friend',
        name: 'Dakota',
        role: 'emotional_leader',
        messageCount: 6,
        emotionalExpressions: ['understanding', 'patient', 'wise'],
      },
    ],
    messages: [
      {
        id: 'msg1',
        content:
          "I've been thinking about our friendship and how much you've helped me over the years",
        authorId: 'complex-user',
        timestamp: new Date('2024-01-15T17:00:00Z'),
      },
      {
        id: 'msg2',
        content:
          'That means a lot to hear. Our friendship has meant everything to me too',
        authorId: 'long-time-friend',
        timestamp: new Date('2024-01-15T17:03:00Z'),
      },
      {
        id: 'msg3',
        content:
          "But I also feel like I lean on you too much sometimes. I worry I'm being a burden",
        authorId: 'complex-user',
        timestamp: new Date('2024-01-15T17:08:00Z'),
      },
    ],
    moodAnalysis: {
      score: 6.8,
      descriptors: ['reflective', 'appreciative'],
      confidence: 0.85,
      factors: [
        {
          type: 'relationship_context',
          weight: 0.5,
          description:
            'Complex relationship dynamics with gratitude and concern',
          evidence: [
            'long friendship',
            'mutual support',
            'concern about burden',
          ],
        },
      ],
    },
  } as ConversationData & { moodAnalysis: MoodAnalysisResult }
}

function createComprehensiveConversation(): ConversationData & {
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
