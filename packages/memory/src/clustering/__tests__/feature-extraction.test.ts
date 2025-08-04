import {
  EmotionalState,
  EmotionalTheme,
  ParticipantRole,
  CommunicationPattern,
  InteractionQuality,
} from '@studio/schema'
import { describe, it, expect, beforeEach } from 'vitest'

import type { ExtractedMemory } from '../../types/index.js'
import type { ClusteringFeatures } from '../types.js'

import {
  EmotionalToneExtractor,
  CommunicationStyleExtractor,
  RelationshipContextExtractor,
  PsychologicalIndicatorExtractor,
  FeatureSimilarityCalculator,
} from '../feature-extraction.js'

describe('Multi-Dimensional Feature Extraction System', () => {
  let mockMemory: ExtractedMemory
  let emotionalExtractor: EmotionalToneExtractor
  let communicationExtractor: CommunicationStyleExtractor
  let relationshipExtractor: RelationshipContextExtractor
  let psychologicalExtractor: PsychologicalIndicatorExtractor
  let similarityCalculator: FeatureSimilarityCalculator

  beforeEach(() => {
    // Create mock memory with comprehensive emotional data
    mockMemory = {
      id: 'test-memory-1',
      content:
        'I was feeling really anxious about the presentation, but talking with Sarah helped me feel so much better. She always knows exactly what to say to calm me down.',
      timestamp: '2024-01-15T14:30:00.000Z',
      author: {
        id: 'user-1',
        name: 'Alex',
        role: ParticipantRole.SELF,
      },
      participants: [
        {
          id: 'user-1',
          name: 'Alex',
          role: ParticipantRole.SELF,
        },
        {
          id: 'user-2',
          name: 'Sarah',
          role: ParticipantRole.FRIEND,
        },
      ],
      emotionalContext: {
        primaryEmotion: EmotionalState.ANXIETY,
        secondaryEmotions: [EmotionalState.CONTENTMENT, EmotionalState.TRUST],
        intensity: 0.7,
        valence: -0.2,
        themes: [
          EmotionalTheme.STRESS,
          EmotionalTheme.SUPPORT,
          EmotionalTheme.CONNECTION,
        ],
        temporalPatterns: {
          isBuilding: false,
          isResolving: true,
          expectedDuration: 'short-term',
        },
        indicators: {
          phrases: [
            'feeling really anxious',
            'helped me feel so much better',
            'always knows exactly what to say',
          ],
          emotionalWords: ['anxious', 'calm', 'grateful'],
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
          secure: ['trust', 'comfort', 'support-seeking'],
          anxious: [],
          avoidant: [],
        },
        healthIndicators: {
          positive: [
            'mutual support',
            'active listening',
            'emotional validation',
          ],
          negative: [],
          repairAttempts: [],
        },
        connectionStrength: 0.8,
        participantDynamics: [
          {
            participants: ['user-1', 'user-2'],
            dynamicType: 'supportive',
            observations: ['empathetic listening', 'reassurance provided'],
          },
        ],
        quality: 8.5,
        patterns: ['supportive_listening', 'reassurance'],
      },
      processing: {
        extractedAt: new Date('2024-01-15T14:35:00.000Z'),
        confidence: 0.85,
        quality: {
          overall: 8.5,
          components: {
            emotionalRichness: 9,
            relationshipClarity: 8,
            contentCoherence: 8,
            contextualSignificance: 9,
          },
          confidence: 0.85,
          issues: [],
        },
        sourceData: {
          id: 'conv-1',
          messages: [],
          participants: [],
          timestamp: new Date('2024-01-15T14:30:00.000Z'),
          startTime: new Date('2024-01-15T14:30:00.000Z'),
          endTime: new Date('2024-01-15T14:45:00.000Z'),
        },
      },
      emotionalAnalysis: {
        context: {
          primaryEmotion: EmotionalState.ANXIETY,
          secondaryEmotions: [EmotionalState.CONTENTMENT, EmotionalState.TRUST],
          intensity: 0.7,
          valence: -0.2,
          themes: [
            EmotionalTheme.STRESS,
            EmotionalTheme.SUPPORT,
            EmotionalTheme.CONNECTION,
          ],
          temporalPatterns: {
            isBuilding: false,
            isResolving: true,
            expectedDuration: 'short-term',
          },
          indicators: {
            phrases: [
              'feeling really anxious',
              'helped me feel so much better',
              'always knows exactly what to say',
            ],
            emotionalWords: ['anxious', 'calm', 'grateful'],
            styleIndicators: [],
          },
        },
        moodScoring: {
          score: 6.8,
          descriptors: ['anxious', 'supported', 'grateful'],
          confidence: 0.82,
          factors: [
            {
              type: 'sentiment_analysis',
              weight: 0.3,
              description: 'Mixed sentiment with anxiety and gratitude',
              evidence: ['feeling really anxious', 'feel so much better'],
            },
            {
              type: 'relationship_context',
              weight: 0.25,
              description: 'Strong supportive relationship',
              evidence: [
                'talking with Sarah helped',
                'always knows exactly what to say',
              ],
            },
          ],
        },
        trajectory: {
          points: [
            {
              timestamp: new Date('2024-01-15T14:30:00.000Z'),
              moodScore: 4.2,
              emotions: ['anxious', 'worried'],
            },
            {
              timestamp: new Date('2024-01-15T14:40:00.000Z'),
              moodScore: 7.5,
              emotions: ['grateful', 'calm'],
            },
          ],
          direction: 'improving',
          significance: 0.8,
          turningPoints: [
            {
              timestamp: new Date('2024-01-15T14:35:00.000Z'),
              type: 'support_received',
              magnitude: 3.3,
              description: 'Support from Sarah led to mood improvement',
              factors: ['empathetic listening', 'reassurance'],
            },
          ],
        },
        patterns: [
          {
            type: 'support_seeking',
            confidence: 0.9,
            description: 'Seeking and receiving emotional support',
            evidence: ['talking with Sarah helped'],
            significance: 0.8,
          },
        ],
      },
      significance: {
        overall: 8.2,
        components: {
          emotionalSalience: 8.5,
          relationshipImpact: 8.0,
          contextualImportance: 8.0,
          temporalRelevance: 8.5,
        },
        confidence: 0.82,
        category: 'high',
        validationPriority: 7.5,
      },
      tags: ['anxiety', 'support', 'presentation'],
      metadata: {
        processedAt: '2024-01-15T14:35:00.000Z',
        schemaVersion: '1.0.0',
        source: 'test',
        confidence: 0.85,
      },
    } as ExtractedMemory

    // Initialize extractors
    emotionalExtractor = new EmotionalToneExtractor()
    communicationExtractor = new CommunicationStyleExtractor()
    relationshipExtractor = new RelationshipContextExtractor()
    psychologicalExtractor = new PsychologicalIndicatorExtractor()
    similarityCalculator = new FeatureSimilarityCalculator()
  })

  describe('EmotionalToneExtractor', () => {
    it('should extract comprehensive emotional tone features', () => {
      const features = emotionalExtractor.extractFeatures(mockMemory)

      expect(features).toMatchObject({
        sentimentVector: expect.any(Array),
        emotionalIntensity: expect.any(Number),
        emotionalVariance: expect.any(Number),
        moodScore: 6.8,
        emotionalDescriptors: expect.arrayContaining([
          'anxious',
          'supported',
          'grateful',
        ]),
        emotionalStability: expect.any(Number),
      })

      expect(features.sentimentVector).toHaveLength(5) // [positive, negative, anxiety, gratitude, mixed]
      expect(features.emotionalIntensity).toBeGreaterThan(0.5) // High emotional content
      expect(features.emotionalVariance).toBeGreaterThan(0.3) // Mixed emotions
      expect(features.emotionalStability).toBeLessThan(0.7) // Emotional transition present
    })

    it('should handle low emotional intensity memories', () => {
      const neutralMemory = {
        ...mockMemory,
        content: 'We discussed the project timeline and agreed on next steps.',
        emotionalAnalysis: {
          ...mockMemory.emotionalAnalysis,
          moodScoring: {
            score: 5.0,
            descriptors: ['neutral', 'focused'],
            confidence: 0.6,
            factors: [],
          },
        },
      } as ExtractedMemory

      const features = emotionalExtractor.extractFeatures(neutralMemory)

      expect(features.emotionalIntensity).toBeLessThan(0.3)
      expect(features.emotionalVariance).toBeLessThan(0.2)
      expect(features.emotionalStability).toBeGreaterThan(0.8)
    })

    it('should identify emotional vocabulary patterns', () => {
      const features = emotionalExtractor.extractFeatures(mockMemory)

      expect(features.emotionalDescriptors).toContain('anxious')
      expect(features.emotionalDescriptors).toContain('grateful')
      expect(features.sentimentVector[0]).toBeGreaterThan(0) // Positive sentiment
      expect(features.sentimentVector[1]).toBeGreaterThan(0) // Negative sentiment (anxiety)
    })
  })

  describe('CommunicationStyleExtractor', () => {
    it('should extract communication style features', () => {
      const features = communicationExtractor.extractFeatures(mockMemory)

      expect(features).toMatchObject({
        linguisticPatterns: expect.any(Array),
        emotionalOpenness: expect.any(Number),
        supportSeekingStyle: expect.any(String),
        copingCommunication: expect.any(String),
        relationshipIntimacy: expect.any(Number),
      })

      expect(features.emotionalOpenness).toBeGreaterThan(0.7) // High vulnerability displayed
      expect(features.supportSeekingStyle).toBe('direct_verbal')
      expect(features.copingCommunication).toBe('support_seeking')
      expect(features.relationshipIntimacy).toBeGreaterThan(0.6) // Close relationship
    })

    it('should identify linguistic patterns', () => {
      const features = communicationExtractor.extractFeatures(mockMemory)

      expect(
        features.linguisticPatterns.some(
          (p) => p.type === 'emotional_expression',
        ),
      ).toBe(true)
      expect(
        features.linguisticPatterns.some(
          (p) => p.type === 'gratitude_expression',
        ),
      ).toBe(true)
      expect(
        features.linguisticPatterns.some(
          (p) => p.type === 'vulnerability_sharing',
        ),
      ).toBe(true)
    })

    it('should assess emotional openness levels', () => {
      const closedMemory = {
        ...mockMemory,
        content: 'Everything is fine. The presentation went okay.',
        emotionalAnalysis: {
          ...mockMemory.emotionalAnalysis,
          moodScoring: {
            score: 5.2,
            descriptors: ['neutral', 'reserved'],
            confidence: 0.4,
            factors: [],
          },
        },
      } as ExtractedMemory

      const openFeatures = communicationExtractor.extractFeatures(mockMemory)
      const closedFeatures =
        communicationExtractor.extractFeatures(closedMemory)

      expect(openFeatures.emotionalOpenness).toBeGreaterThan(
        closedFeatures.emotionalOpenness,
      )
    })
  })

  describe('RelationshipContextExtractor', () => {
    it('should extract relationship context features', () => {
      const features = relationshipExtractor.extractFeatures(mockMemory)

      expect(features).toMatchObject({
        relationshipType: expect.any(String),
        intimacyLevel: expect.any(Number),
        supportDynamics: expect.any(Object),
        communicationPatterns: expect.any(Array),
        emotionalSafety: expect.any(Number),
        participantRoles: expect.any(Array),
      })

      expect(features.relationshipType).toBe('close_friend')
      expect(features.intimacyLevel).toBeGreaterThan(0.6)
      expect(features.supportDynamics.level).toBe('high')
      expect(features.emotionalSafety).toBeGreaterThan(0.8)
    })

    it('should identify participant role dynamics', () => {
      const features = relationshipExtractor.extractFeatures(mockMemory)

      expect(features.participantRoles).toContainEqual({
        participantId: 'user-1',
        role: 'vulnerable_sharer',
        supportLevel: 'recipient',
      })
      expect(features.participantRoles).toContainEqual({
        participantId: 'user-2',
        role: 'supporter',
        supportLevel: 'provider',
      })
    })

    it('should assess support dynamics', () => {
      const features = relationshipExtractor.extractFeatures(mockMemory)

      expect(features.supportDynamics).toMatchObject({
        level: 'high',
        direction: 'unidirectional',
        effectiveness: expect.any(Number),
        reciprocity: expect.any(Number),
      })

      expect(features.supportDynamics.effectiveness).toBeGreaterThan(0.8)
    })

    it('should dynamically assign author role based on content - author as supporter', () => {
      const supporterMemory = {
        ...mockMemory,
        content:
          'I helped my sister through her anxiety about the job interview. I listened to her concerns and reassured her that she was well-prepared.',
      } as ExtractedMemory

      const features = relationshipExtractor.extractFeatures(supporterMemory)

      expect(features.participantRoles).toContainEqual({
        participantId: 'user-1',
        role: 'supporter',
        supportLevel: 'provider',
      })
    })

    it('should dynamically assign author role based on content - author as observer', () => {
      const observerMemory = {
        ...mockMemory,
        content:
          'We discussed the project timeline and agreed on the next steps. The meeting was productive.',
      } as ExtractedMemory

      const features = relationshipExtractor.extractFeatures(observerMemory)

      expect(features.participantRoles).toContainEqual({
        participantId: 'user-1',
        role: 'observer',
        supportLevel: 'neutral',
      })
    })

    it('should prioritize vulnerable_sharer role when both giving and receiving support', () => {
      const mixedMemory = {
        ...mockMemory,
        content:
          'I was stressed about work, but talking with Mike helped me. I also supported him with his relationship issues.',
      } as ExtractedMemory

      const features = relationshipExtractor.extractFeatures(mixedMemory)

      // Should default to vulnerable_sharer when receiving support
      expect(features.participantRoles).toContainEqual({
        participantId: 'user-1',
        role: 'vulnerable_sharer',
        supportLevel: 'recipient',
      })
    })
  })

  describe('PsychologicalIndicatorExtractor', () => {
    it('should extract psychological indicator features', () => {
      const features = psychologicalExtractor.extractFeatures(mockMemory)

      expect(features).toMatchObject({
        copingMechanisms: expect.any(Array),
        resilienceIndicators: expect.any(Array),
        stressMarkers: expect.any(Array),
        supportUtilization: expect.any(Number),
        emotionalRegulation: expect.any(Number),
        growthIndicators: expect.any(Array),
      })

      expect(features.supportUtilization).toBeGreaterThan(0.8) // Strong support seeking
      expect(features.emotionalRegulation).toBeGreaterThan(0.6) // Positive emotional change
    })

    it('should identify coping mechanisms', () => {
      const features = psychologicalExtractor.extractFeatures(mockMemory)

      expect(features.copingMechanisms).toContainEqual({
        type: 'support_seeking',
        strength: expect.any(Number),
        effectiveness: expect.any(Number),
      })

      const supportSeeking = features.copingMechanisms.find(
        (c) => c.type === 'support_seeking',
      )
      expect(supportSeeking?.effectiveness).toBeGreaterThan(0.7)
    })

    it('should assess resilience indicators', () => {
      const features = psychologicalExtractor.extractFeatures(mockMemory)

      expect(features.resilienceIndicators).toContainEqual({
        type: 'social_support_utilization',
        strength: expect.any(Number),
        evidence: expect.arrayContaining(['talking with Sarah helped']),
      })
    })

    it('should detect stress markers', () => {
      const features = psychologicalExtractor.extractFeatures(mockMemory)

      expect(features.stressMarkers).toContainEqual({
        type: 'performance_anxiety',
        intensity: expect.any(Number),
        indicators: expect.arrayContaining(['anxious about the presentation']),
      })
    })
  })

  describe('FeatureSimilarityCalculator', () => {
    let similarMemory: ExtractedMemory
    let dissimilarMemory: ExtractedMemory

    beforeEach(() => {
      // Create a similar memory (same theme: anxiety + support)
      similarMemory = {
        ...mockMemory,
        id: 'test-memory-2',
        content:
          'I was stressed about the interview, but my mom gave me such great advice and I felt much more confident.',
        emotionalAnalysis: {
          ...mockMemory.emotionalAnalysis,
          moodScoring: {
            score: 7.2,
            descriptors: ['stressed', 'supported', 'confident'],
            confidence: 0.8,
            factors: [],
          },
        },
      } as ExtractedMemory

      // Create a dissimilar memory (celebration theme)
      dissimilarMemory = {
        ...mockMemory,
        id: 'test-memory-3',
        content:
          'We celebrated my promotion at the restaurant. Everyone was so happy and excited for me!',
        emotionalContext: {
          primaryEmotion: EmotionalState.JOY,
          secondaryEmotions: [
            EmotionalState.EXCITEMENT,
            EmotionalState.CONTENTMENT,
          ],
          intensity: 0.8,
          valence: 0.9,
          themes: [
            EmotionalTheme.CELEBRATION,
            EmotionalTheme.ACHIEVEMENT,
            EmotionalTheme.CONNECTION,
          ],
          temporalPatterns: {
            isBuilding: false,
            isResolving: false,
            expectedDuration: 'short-term',
          },
          indicators: {
            phrases: [
              'celebrated my promotion',
              'Everyone was so happy',
              'excited for me',
            ],
            emotionalWords: ['happy', 'excited', 'proud'],
            styleIndicators: ['!'],
          },
        },
        emotionalAnalysis: {
          ...mockMemory.emotionalAnalysis,
          moodScoring: {
            score: 8.5,
            descriptors: ['happy', 'excited', 'proud'],
            confidence: 0.9,
            factors: [],
          },
        },
      } as ExtractedMemory
    })

    it('should calculate high similarity for thematically similar memories', () => {
      const similarity = similarityCalculator.calculateSimilarity(
        mockMemory,
        similarMemory,
      )

      expect(similarity).toBeGreaterThan(0.7) // High similarity threshold
      expect(similarity).toBeLessThan(1.0) // Not identical
    })

    it('should calculate low similarity for thematically different memories', () => {
      const similarity = similarityCalculator.calculateSimilarity(
        mockMemory,
        dissimilarMemory,
      )

      expect(similarity).toBeLessThan(0.4) // Low similarity threshold
    })

    it('should weight feature dimensions correctly', () => {
      const features1 = similarityCalculator.extractAllFeatures(mockMemory)
      const features2 = similarityCalculator.extractAllFeatures(similarMemory)

      const emotionalSim =
        similarityCalculator.calculateEmotionalToneSimilarity(
          features1.emotionalTone,
          features2.emotionalTone,
        )
      const communicationSim =
        similarityCalculator.calculateCommunicationSimilarity(
          features1.communicationStyle,
          features2.communicationStyle,
        )

      // Emotional tone should have highest weight (35%)
      expect(emotionalSim).toBeGreaterThan(0.6)
      expect(communicationSim).toBeGreaterThan(0.5)
    })

    it('should return 1.0 for identical memories', () => {
      const similarity = similarityCalculator.calculateSimilarity(
        mockMemory,
        mockMemory,
      )

      expect(similarity).toBe(1.0)
    })

    it('should handle edge cases gracefully', () => {
      const emptyMemory = {
        ...mockMemory,
        content: '',
        emotionalAnalysis: {
          ...mockMemory.emotionalAnalysis,
          moodScoring: {
            score: 5.0,
            descriptors: [],
            confidence: 0.1,
            factors: [],
          },
        },
      } as ExtractedMemory

      const similarity = similarityCalculator.calculateSimilarity(
        mockMemory,
        emptyMemory,
      )

      expect(similarity).toBeGreaterThanOrEqual(0.0)
      expect(similarity).toBeLessThanOrEqual(1.0)
      expect(similarity).toBeLessThan(0.3) // Should be low similarity
    })
  })

  describe('Feature Integration', () => {
    it('should combine all feature dimensions into comprehensive clustering features', () => {
      const emotionalFeatures = emotionalExtractor.extractFeatures(mockMemory)
      const communicationFeatures =
        communicationExtractor.extractFeatures(mockMemory)
      const relationshipFeatures =
        relationshipExtractor.extractFeatures(mockMemory)
      const psychologicalFeatures =
        psychologicalExtractor.extractFeatures(mockMemory)

      const clusteringFeatures: ClusteringFeatures = {
        emotionalTone: emotionalFeatures,
        communicationStyle: communicationFeatures,
        relationshipContext: relationshipFeatures,
        psychologicalIndicators: psychologicalFeatures,
        temporalContext: {
          timeOfDay: 'afternoon',
          dayOfWeek: 'monday',
          temporalProximity: 0.0,
          seasonalContext: 'winter',
          temporalStability: 0.8,
        },
      }

      expect(clusteringFeatures).toMatchObject({
        emotionalTone: expect.objectContaining({
          sentimentVector: expect.any(Array),
          emotionalIntensity: expect.any(Number),
          moodScore: expect.any(Number),
        }),
        communicationStyle: expect.objectContaining({
          emotionalOpenness: expect.any(Number),
          supportSeekingStyle: expect.any(String),
        }),
        relationshipContext: expect.objectContaining({
          relationshipType: expect.any(String),
          intimacyLevel: expect.any(Number),
        }),
        psychologicalIndicators: expect.objectContaining({
          copingMechanisms: expect.any(Array),
          resilienceIndicators: expect.any(Array),
        }),
        temporalContext: expect.objectContaining({
          timeOfDay: expect.any(String),
          temporalStability: expect.any(Number),
        }),
      })
    })

    it('should maintain feature consistency across extractions', () => {
      const features1 = emotionalExtractor.extractFeatures(mockMemory)
      const features2 = emotionalExtractor.extractFeatures(mockMemory)

      expect(features1).toEqual(features2)
    })

    it('should handle memories with minimal emotional content', () => {
      const minimalMemory = {
        ...mockMemory,
        content: 'Meeting at 3pm.',
        emotionalContext: {
          primaryEmotion: EmotionalState.NEUTRAL,
          secondaryEmotions: [],
          intensity: 0.2,
          valence: 0.0,
          themes: [],
          temporalPatterns: {
            isBuilding: false,
            isResolving: false,
            expectedDuration: 'transient',
          },
          indicators: {
            phrases: ['Meeting at 3pm'],
            emotionalWords: [],
            styleIndicators: [],
          },
        },
        emotionalAnalysis: {
          ...mockMemory.emotionalAnalysis,
          moodScoring: {
            score: 5.0,
            descriptors: ['neutral'],
            confidence: 0.3,
            factors: [],
          },
        },
      } as ExtractedMemory

      const emotionalFeatures =
        emotionalExtractor.extractFeatures(minimalMemory)
      const communicationFeatures =
        communicationExtractor.extractFeatures(minimalMemory)
      const relationshipFeatures =
        relationshipExtractor.extractFeatures(minimalMemory)
      const psychologicalFeatures =
        psychologicalExtractor.extractFeatures(minimalMemory)

      // All extractors should handle minimal content gracefully
      expect(emotionalFeatures.emotionalIntensity).toBeLessThan(0.3)
      expect(communicationFeatures.emotionalOpenness).toBeLessThan(0.3)
      expect(relationshipFeatures.intimacyLevel).toBeLessThan(0.4)
      expect(psychologicalFeatures.copingMechanisms).toEqual([])
    })
  })
})
