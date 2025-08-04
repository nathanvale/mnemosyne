import { describe, it, expect, beforeEach } from 'vitest'
import { ParticipantRole, EmotionalState, EmotionalTheme, CommunicationPattern, InteractionQuality } from '@studio/schema'

import type {
  ExtractedMemory,
  EmotionalSignificanceScore,
  EmotionalAnalysis,
  MoodAnalysisResult,
  ConversationData,
  ConversationParticipant,
  RelationshipDynamics,
  MoodDelta,
  EmotionalPattern,
  TrajectoryPoint,
  TurningPoint,
} from '../../types'

import { EmotionalSignificanceAnalyzer } from '../analyzer'

describe('Mood-Integrated Significance Analysis - Memory Enhancement', () => {
  let analyzer: EmotionalSignificanceAnalyzer
  let baseMemory: ExtractedMemory

  beforeEach(() => {
    analyzer = new EmotionalSignificanceAnalyzer({
      emotionalSalienceWeight: 0.4, // Higher weight for mood-aware analysis
      relationshipImpactWeight: 0.3,
      contextualImportanceWeight: 0.2,
      temporalRelevanceWeight: 0.1,
    })

    baseMemory = createBaseMemory()
  })

  describe('Task 5.1: Memory Significance Enhancement with Mood Analysis', () => {
    describe('Mood Score Integration', () => {
      it('should enhance significance scoring for high mood (8.5+) memories', async () => {
        const memory = createMemoryWithMoodScore(8.7, 0.85, ['joy', 'celebration'])
        
        const significance = await analyzer.assessSignificance(memory)
        
        expect(significance.overall).toBeGreaterThan(7.5)
        expect(significance.category).toBe('critical')
        expect(significance.components.emotionalSalience).toBeGreaterThan(8.0)
        expect(significance.confidence).toBeGreaterThan(0.8)
      })

      it('should enhance significance scoring for low mood (3.5-) memories', async () => {
        const memory = createMemoryWithMoodScore(2.8, 0.80, ['distress', 'vulnerability'])
        
        const significance = await analyzer.assessSignificance(memory)
        
        expect(significance.overall).toBeGreaterThan(7.0)
        expect(['critical', 'high']).toContain(significance.category)
        expect(significance.components.emotionalSalience).toBeGreaterThan(7.5)
        expect(significance.validationPriority).toBeGreaterThan(8.0)
      })

      it('should appropriately score neutral mood (4.5-6.5) memories', async () => {
        const memory = createMemoryWithMoodScore(5.2, 0.70, ['neutral', 'calm'])
        
        const significance = await analyzer.assessSignificance(memory)
        
        expect(significance.overall).toBeLessThan(7.0)
        expect(['medium', 'high']).toContain(significance.category)
        expect(significance.components.emotionalSalience).toBeLessThan(7.0)
      })

      it('should weight mood confidence in significance confidence calculation', async () => {
        const highConfidenceMemory = createMemoryWithMoodScore(8.0, 0.95, ['achievement'])
        const lowConfidenceMemory = createMemoryWithMoodScore(8.0, 0.45, ['achievement'])
        
        const highSig = await analyzer.assessSignificance(highConfidenceMemory)
        const lowSig = await analyzer.assessSignificance(lowConfidenceMemory)
        
        expect(highSig.confidence).toBeGreaterThan(lowSig.confidence)
        expect(highSig.validationPriority).toBeLessThan(lowSig.validationPriority) // Lower confidence = higher validation priority
      })
    })

    describe('Mood Factor Analysis Integration', () => {
      it('should enhance significance for memories with multiple mood factors', async () => {
        const memory = createMemoryWithMultipleMoodFactors([
          { type: 'sentiment_analysis', weight: 0.35, evidence: ['positive expressions'] },
          { type: 'psychological_indicators', weight: 0.25, evidence: ['resilience markers'] },
          { type: 'relationship_context', weight: 0.20, evidence: ['trust building'] },
          { type: 'conversational_flow', weight: 0.15, evidence: ['emotional depth'] },
          { type: 'historical_baseline', weight: 0.05, evidence: ['significant deviation'] },
        ])
        
        const significance = await analyzer.assessSignificance(memory)
        
        expect(significance.overall).toBeGreaterThan(6.5)
        expect(significance.components.emotionalSalience).toBeGreaterThan(6.0)
      })

      it('should detect therapeutic breakthrough significance from mood factors', async () => {
        const memory = createMemoryWithTherapeuticBreakthrough()
        
        const significance = await analyzer.assessSignificance(memory)
        
        expect(significance.overall).toBeGreaterThan(8.0)
        expect(significance.category).toBe('critical')
        expect(significance.components.emotionalSalience).toBeGreaterThan(8.5)
        expect(significance.components.relationshipImpact).toBeGreaterThan(7.0)
      })

      it('should detect crisis intervention significance from mood factors', async () => {
        const memory = createMemoryWithCrisisIndicators()
        
        const significance = await analyzer.assessSignificance(memory)
        
        expect(significance.overall).toBeGreaterThan(8.5)
        expect(significance.category).toBe('critical')
        expect(significance.validationPriority).toBeGreaterThan(9.0)
        expect(significance.components.emotionalSalience).toBeGreaterThan(9.0)
      })
    })

    describe('Mood Trajectory Impact', () => {
      it('should enhance significance for memories with significant mood deltas', async () => {
        const memory = createMemoryWithMoodDelta({
          magnitude: 4.2,
          direction: 'positive',
          significance: 'high',
          timeElapsed: 1800000, // 30 minutes
          confidence: 0.88,
        })
        
        const significance = await analyzer.assessSignificance(memory)
        
        expect(significance.overall).toBeGreaterThan(7.0)
        expect(significance.components.emotionalSalience).toBeGreaterThan(7.5)
        expect(significance.components.temporalRelevance).toBeGreaterThan(6.0)
      })

      it('should detect rapid mood deterioration as high significance', async () => {
        const memory = createMemoryWithMoodDelta({
          magnitude: 3.8,
          direction: 'negative',
          significance: 'high',
          timeElapsed: 900000, // 15 minutes - rapid change
          confidence: 0.92,
        })
        
        const significance = await analyzer.assessSignificance(memory)
        
        expect(significance.overall).toBeGreaterThan(8.0)
        expect(significance.category).toBe('critical')
        expect(significance.validationPriority).toBeGreaterThan(8.5)
      })

      it('should recognize gradual mood improvement patterns', async () => {
        const memory = createMemoryWithMoodDelta({
          magnitude: 2.1,
          direction: 'positive',
          significance: 'medium',
          timeElapsed: 7200000, // 2 hours - gradual change
          confidence: 0.75,
        })
        
        const significance = await analyzer.assessSignificance(memory)
        
        expect(significance.overall).toBeGreaterThan(5.5)
        expect(['medium', 'high']).toContain(significance.category)
        expect(significance.components.emotionalSalience).toBeGreaterThan(5.0)
      })
    })

    describe('Relationship-Mood Context Integration', () => {
      it('should enhance significance for vulnerability in high-trust relationships', async () => {
        const memory = createMemoryWithRelationshipMoodContext({
          moodScore: 3.2,
          relationshipType: 'therapeutic',
          trustLevel: 'high',
          supportLevel: 'high',
          vulnerabilityPresent: true,
        })
        
        const significance = await analyzer.assessSignificance(memory)
        
        expect(significance.overall).toBeGreaterThan(7.5)
        expect(significance.components.relationshipImpact).toBeGreaterThan(8.0)
        expect(significance.components.emotionalSalience).toBeGreaterThan(7.0)
      })

      it('should detect conflict escalation in close relationships', async () => {
        const memory = createMemoryWithRelationshipMoodContext({
          moodScore: 4.1,
          relationshipType: 'close_friend',
          conflictLevel: 'high',
          trustLevel: 'medium',
          conflictEscalation: true,
        })
        
        const significance = await analyzer.assessSignificance(memory)
        
        expect(significance.overall).toBeGreaterThan(6.5)
        expect(significance.components.relationshipImpact).toBeGreaterThan(7.0)
        expect(significance.validationPriority).toBeGreaterThan(7.0)
      })

      it('should recognize achievement celebration in supportive relationships', async () => {
        const memory = createMemoryWithRelationshipMoodContext({
          moodScore: 8.8,
          relationshipType: 'close_friend',
          supportLevel: 'high',
          celebrationContext: true,
        })
        
        const significance = await analyzer.assessSignificance(memory)
        
        expect(significance.overall).toBeGreaterThan(7.0)
        expect(significance.components.relationshipImpact).toBeGreaterThan(6.5)
        expect(significance.components.emotionalSalience).toBeGreaterThan(8.0)
      })
    })

    describe('Batch Processing with Mood Integration', () => {
      it('should process multiple memories with mood-aware significance scoring', async () => {
        const memories = [
          createMemoryWithMoodScore(8.5, 0.90, ['achievement']),
          createMemoryWithMoodScore(2.8, 0.85, ['crisis']),
          createMemoryWithMoodScore(5.2, 0.70, ['neutral']),
          createMemoryWithMoodScore(7.1, 0.80, ['celebration']),
        ]
        
        const results = await analyzer.processBatch(memories)
        
        expect(results.size).toBe(4)
        
        // High mood achievement should be high significance
        const achievement = results.get(memories[0].id)!
        expect(achievement.overall).toBeGreaterThan(7.0)
        expect(['critical', 'high']).toContain(achievement.category)
        
        // Crisis should be critical significance
        const crisis = results.get(memories[1].id)!
        expect(crisis.overall).toBeGreaterThan(7.5)
        expect(crisis.category).toBe('critical')
        
        // Neutral should be moderate significance
        const neutral = results.get(memories[2].id)!
        expect(neutral.overall).toBeLessThan(6.5)
        expect(['medium', 'low']).toContain(neutral.category)
        
        // Celebration should be high significance
        const celebration = results.get(memories[3].id)!
        expect(celebration.overall).toBeGreaterThan(6.5)
      })

      it('should maintain performance under 500ms per memory for batch processing', async () => {
        const memories = Array.from({ length: 10 }, (_, i) => 
          createMemoryWithMoodScore(5 + Math.random() * 3, 0.7 + Math.random() * 0.2, ['test'])
        )
        
        const startTime = Date.now()
        const results = await analyzer.processBatch(memories)
        const endTime = Date.now()
        
        const averageTime = (endTime - startTime) / memories.length
        
        expect(results.size).toBe(10)
        expect(averageTime).toBeLessThan(500) // Sub-500ms per memory requirement
      })
    })
  })

  // Helper functions for creating test data

  function createBaseMemory(): ExtractedMemory {
    const conversationData: ConversationData = {
      id: 'test-conv-1',
      messages: [
        {
          id: 'msg-1',
          content: 'Test message content',
          authorId: 'user-1',
          timestamp: new Date('2024-01-15T14:30:00Z'),
        },
      ],
      participants: [
        {
          id: 'user-1',
          name: 'Test User',
          role: 'vulnerable_sharer',
        },
      ],
      timestamp: new Date('2024-01-15T14:30:00Z'),
      startTime: new Date('2024-01-15T14:30:00Z'),
      endTime: new Date('2024-01-15T14:31:00Z'),
    }

    return {
      id: 'test-memory-1',
      content: 'Test memory content',
      timestamp: '2024-01-15T14:30:00Z',
      author: {
        id: 'user-1',
        name: 'Test User',
        role: ParticipantRole.SELF,
      },
      participants: [
        {
          id: 'user-1',
          name: 'Test User',
          role: ParticipantRole.SELF,
        },
      ],
      emotionalContext: {
        primaryEmotion: EmotionalState.NEUTRAL,
        secondaryEmotions: [],
        intensity: 0.5,
        valence: 0.0,
        themes: [EmotionalTheme.CONNECTION],
        indicators: {
          phrases: ['calm', 'steady'],
          emotionalWords: [],
          styleIndicators: [],
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
          secure: ['trust', 'support'],
          anxious: [],
          avoidant: [],
        },
        healthIndicators: {
          positive: ['supportive communication', 'mutual respect'],
          negative: [],
          repairAttempts: [],
        },
        connectionStrength: 0.85,
        quality: 8.5,
      },
      tags: ['test'],
      metadata: {
        processedAt: '2024-01-15T14:35:00Z',
        schemaVersion: '1.0.0',
        source: 'test',
        confidence: 0.8,
      },
      processing: {
        extractedAt: new Date('2024-01-15T14:35:00Z'),
        confidence: 0.8,
        quality: {
          overall: 0.88,
          components: {
            emotionalRichness: 0.85,
            relationshipClarity: 0.90,
            contentCoherence: 0.88,
            contextualSignificance: 0.87,
          },
          confidence: 0.88,
          issues: [],
        },
        sourceData: conversationData,
      },
      emotionalAnalysis: {
        context: {
          primaryEmotion: EmotionalState.NEUTRAL,
          secondaryEmotions: [],
          intensity: 0.5,
          valence: 0.0,
          themes: [EmotionalTheme.CONNECTION],
          indicators: {
            phrases: ['calm', 'steady'],
            emotionalWords: [],
            styleIndicators: [],
          },
        },
        moodScoring: {
          score: 5.5,
          confidence: 0.75,
          descriptors: ['neutral'],
          factors: [
            {
              type: 'sentiment_analysis',
              weight: 0.35,
              description: 'Basic sentiment analysis',
              evidence: ['neutral language'],
            },
          ],
        },
        trajectory: {
          points: [
            {
              timestamp: new Date('2024-01-15T14:30:00Z'),
              moodScore: 5.5,
              messageId: 'msg-1',
              emotions: ['neutral'],
              context: 'baseline measurement',
            },
          ],
          direction: 'stable',
          significance: 0.3,
          turningPoints: [],
        },
        patterns: [],
      },
      significance: {
        overall: 5.0,
        components: {
          emotionalSalience: 5.0,
          relationshipImpact: 5.0,
          contextualImportance: 5.0,
          temporalRelevance: 5.0,
        },
        confidence: 0.7,
        category: 'medium',
        validationPriority: 5.0,
      },
    }
  }

  function createMemoryWithMoodScore(
    score: number,
    confidence: number,
    descriptors: string[]
  ): ExtractedMemory {
    const memory = createBaseMemory()
    memory.emotionalAnalysis.moodScoring = {
      score,
      confidence,
      descriptors,
      factors: [
        {
          type: 'sentiment_analysis',
          weight: 0.35,
          description: `Mood score ${score} analysis`,
          evidence: descriptors,
        },
      ],
    }
    memory.id = `mood-${score}-${Math.random().toString(36).substr(2, 9)}`
    return memory
  }

  function createMemoryWithMultipleMoodFactors(factors: Array<{
    type: string;
    weight: number;
    evidence: string[];
  }>): ExtractedMemory {
    const memory = createBaseMemory()
    memory.emotionalAnalysis.moodScoring = {
      score: 6.8,
      confidence: 0.88,
      descriptors: ['complex', 'multi-dimensional'],
      factors: factors.map(f => ({
        type: f.type as any,
        weight: f.weight,
        description: `${f.type} analysis`,
        evidence: f.evidence,
      })),
    }
    memory.id = `multi-factor-${Math.random().toString(36).substr(2, 9)}`
    return memory
  }

  function createMemoryWithTherapeuticBreakthrough(): ExtractedMemory {
    const memory = createBaseMemory()
    memory.emotionalAnalysis.moodScoring = {
      score: 7.8,
      confidence: 0.92,
      descriptors: ['breakthrough', 'insight', 'therapeutic'],
      factors: [
        {
          type: 'psychological_indicators',
          weight: 0.4,
          description: 'Therapeutic breakthrough indicators',
          evidence: ['insight moment', 'pattern recognition', 'emotional processing'],
        },
        {
          type: 'relationship_context',
          weight: 0.3,
          description: 'Therapeutic relationship context',
          evidence: ['professional support', 'trust building', 'safe space'],
        },
      ],
    }
    memory.extendedRelationshipDynamics = {
      type: 'therapeutic',
      supportLevel: 'high',
      intimacyLevel: 'high',
      intimacy: 'high',
      conflictLevel: 'none',
      trustLevel: 'high',
      conflictPresent: false,
      conflictIntensity: 'low',
      communicationStyle: 'reflective',
      communicationStyleDetails: {
        vulnerabilityLevel: 'high',
        emotionalSafety: 'high',
        supportPatterns: ['active_listening', 'validation'],
        conflictPatterns: [],
        professionalBoundaries: true,
        guidancePatterns: ['reflective_questioning'],
        therapeuticElements: ['insight_facilitation'],
      },
      participantDynamics: {
        supportBalance: 'unidirectional',
        mutualVulnerability: false,
      },
      emotionalSafety: {
        overall: 'high',
        acceptanceLevel: 'high',
        judgmentRisk: 'low',
        validationPresent: true,
      },
    }
    memory.id = `therapeutic-${Math.random().toString(36).substr(2, 9)}`
    return memory
  }

  function createMemoryWithCrisisIndicators(): ExtractedMemory {
    const memory = createBaseMemory()
    memory.emotionalAnalysis.moodScoring = {
      score: 2.1,
      confidence: 0.95,
      descriptors: ['crisis', 'distress', 'urgent'],
      factors: [
        {
          type: 'psychological_indicators',
          weight: 0.5,
          description: 'Crisis indicators detected',
          evidence: ['suicidal ideation', 'emotional overwhelm', 'isolation'],
        },
        {
          type: 'sentiment_analysis',
          weight: 0.3,
          description: 'Highly negative sentiment',
          evidence: ['despair', 'hopelessness', 'pain'],
        },
      ],
    }
    memory.id = `crisis-${Math.random().toString(36).substr(2, 9)}`
    return memory
  }

  function createMemoryWithMoodDelta(delta: {
    magnitude: number;
    direction: 'positive' | 'negative';
    significance: 'high' | 'medium' | 'low';
    timeElapsed: number;
    confidence: number;
  }): ExtractedMemory {
    const memory = createBaseMemory()
    const previousScore = delta.direction === 'positive' ? 
      memory.emotionalAnalysis.moodScoring.score - delta.magnitude :
      memory.emotionalAnalysis.moodScoring.score + delta.magnitude

    const baseTime = new Date('2024-01-15T14:30:00Z')
    const previousTime = new Date(baseTime.getTime() - delta.timeElapsed)

    memory.emotionalAnalysis.trajectory = {
      points: [
        {
          timestamp: previousTime,
          moodScore: previousScore,
          messageId: 'msg-prev',
          emotions: delta.direction === 'positive' ? ['concerned'] : ['hopeful'],
          context: 'previous state',
        },
        {
          timestamp: baseTime,
          moodScore: memory.emotionalAnalysis.moodScoring.score,
          messageId: 'msg-current',
          emotions: delta.direction === 'positive' ? ['improving'] : ['declining'],
          context: 'current state after transition',
        },
      ],
      direction: delta.direction === 'positive' ? 'improving' : 'declining',
      significance: delta.significance === 'high' ? 0.9 : delta.significance === 'medium' ? 0.6 : 0.3,
      turningPoints: [
        {
          timestamp: baseTime,
          type: delta.direction === 'positive' ? 'breakthrough' : 'setback',
          magnitude: delta.magnitude,
          description: `Significant mood ${delta.direction === 'positive' ? 'improvement' : 'deterioration'} detected`,
          factors: ['mood_transition', 'significant_change'],
        },
      ],
    }
    
    // Update the mood scoring to reflect the current (final) mood state from trajectory
    const currentTrajectoryPoint = memory.emotionalAnalysis.trajectory.points[1] // The current/final state
    memory.emotionalAnalysis.moodScoring.score = currentTrajectoryPoint.moodScore
    memory.emotionalAnalysis.moodScoring.confidence = delta.confidence
    memory.emotionalAnalysis.moodScoring.descriptors = delta.direction === 'positive' ? ['improving', 'recovery'] : ['declining', 'deteriorating']
    
    memory.id = `delta-${delta.direction}-${Math.random().toString(36).substr(2, 9)}`
    return memory
  }

  function createMemoryWithRelationshipMoodContext(context: {
    moodScore: number;
    relationshipType: RelationshipDynamics['type'];
    trustLevel?: 'high' | 'medium' | 'low';
    supportLevel?: 'high' | 'medium' | 'low' | 'negative';
    conflictLevel?: 'high' | 'medium' | 'low' | 'none';
    vulnerabilityPresent?: boolean;
    conflictEscalation?: boolean;
    celebrationContext?: boolean;
  }): ExtractedMemory {
    const memory = createBaseMemory()
    memory.emotionalAnalysis.moodScoring.score = context.moodScore
    
    const descriptors = []
    if (context.vulnerabilityPresent) descriptors.push('vulnerable')
    if (context.conflictEscalation) descriptors.push('conflict')
    if (context.celebrationContext) descriptors.push('celebration')
    
    memory.emotionalAnalysis.moodScoring.descriptors = descriptors
    
    memory.extendedRelationshipDynamics = {
      type: context.relationshipType,
      supportLevel: context.supportLevel || 'medium',
      intimacyLevel: context.relationshipType === 'therapeutic' ? 'high' : 'medium',
      intimacy: context.relationshipType === 'therapeutic' ? 'high' : 'medium',
      conflictLevel: context.conflictLevel || 'none',
      trustLevel: context.trustLevel || 'medium',
      conflictPresent: context.conflictLevel !== 'none',
      conflictIntensity: context.conflictLevel === 'high' ? 'high' : 'low',
      communicationStyle: context.relationshipType === 'therapeutic' ? 'reflective' : 'supportive',
      communicationStyleDetails: {
        vulnerabilityLevel: context.vulnerabilityPresent ? 'high' : 'medium',
        emotionalSafety: context.conflictLevel === 'high' ? 'low' : 'high',
        supportPatterns: context.supportLevel === 'high' ? ['validation', 'active_listening'] : [],
        conflictPatterns: context.conflictEscalation ? ['escalation', 'defensiveness'] : [],
        professionalBoundaries: context.relationshipType === 'therapeutic',
        guidancePatterns: [],
        therapeuticElements: context.relationshipType === 'therapeutic' ? ['insight_facilitation'] : [],
      },
      participantDynamics: {
        supportBalance: 'balanced',
        mutualVulnerability: context.vulnerabilityPresent || false,
      },
      emotionalSafety: {
        overall: context.conflictLevel === 'high' ? 'low' : 'high',
        acceptanceLevel: context.supportLevel === 'high' ? 'high' : 'medium',
        judgmentRisk: context.conflictLevel === 'high' ? 'high' : 'low',
        validationPresent: context.supportLevel === 'high',
      },
    }
    
    memory.id = `relationship-${context.relationshipType}-${Math.random().toString(36).substr(2, 9)}`
    return memory
  }
})