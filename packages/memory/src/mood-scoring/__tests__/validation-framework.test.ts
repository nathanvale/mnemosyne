import { describe, it, expect, beforeEach } from 'vitest'

import type {
  ConversationData,
  MoodAnalysisResult,
  HumanValidationRecord,
  ValidationMetrics,
  BiasAnalysis,
} from '../../types'

import { MoodScoringAnalyzer } from '../analyzer'
import { ValidationFramework } from '../validation-framework'

// Helper function to convert old test format to proper MoodAnalysisResult format
function createMoodAnalysisResult(data: any): MoodAnalysisResult {
  // If already in correct format, return as is
  if (data.descriptors && data.factors) {
    return data
  }
  
  // Convert old format to new format
  const descriptors: string[] = []
  if (data.primaryEmotions) {
    descriptors.push(...data.primaryEmotions)
  }
  if (data.sentiment) {
    descriptors.push(data.sentiment)
  }
  
  return {
    score: data.score,
    confidence: data.confidence,
    descriptors: descriptors.length > 0 ? descriptors : ['neutral'],
    factors: data.factors || [
      {
        type: 'sentiment_analysis',
        impact: 0.35,
        confidence: data.confidence || 0.8,
        details: {
          primaryEmotions: data.primaryEmotions || [],
          emotionalIntensity: data.emotionalIntensity || 0.5,
          sentiment: data.sentiment || 'neutral',
        },
      },
    ],
  }
}

describe('ValidationFramework - Human Validation Framework', () => {
  let validationFramework: ValidationFramework
  let moodAnalyzer: MoodScoringAnalyzer

  beforeEach(() => {
    validationFramework = new ValidationFramework({
      correlationThreshold: 0.8,
      significanceLevel: 0.05,
      biasDetectionSensitivity: 0.15,
    })
    moodAnalyzer = new MoodScoringAnalyzer()
  })

  describe('Human Validation Correlation (Task 4.1)', () => {
    describe('Agreement Metrics Calculation', () => {
      it('should calculate high correlation when algorithmic and human scores are closely aligned', async () => {
        const testConversations: (ConversationData & {
          moodAnalysis: MoodAnalysisResult
        })[] = [
          {
            id: 'conv-validation-1',
            timestamp: new Date('2024-01-01T10:00:00Z'),
            participants: [
              {
                id: 'user1',
                name: 'Sarah',
                role: 'vulnerable_sharer',
                messageCount: 3,
                emotionalExpressions: ['sad', 'hopeful'],
              },
              {
                id: 'user2',
                name: 'Alex',
                role: 'supporter',
                messageCount: 2,
                emotionalExpressions: ['supportive', 'caring'],
              },
            ],
            messages: [
              {
                id: 'msg1',
                content:
                  "I've been feeling really down lately but talking to you helps",
                authorId: 'user1',
                timestamp: new Date('2024-01-01T10:00:00Z'),
              },
              {
                id: 'msg2',
                content:
                  "I'm here for you always. You're stronger than you know",
                authorId: 'user2',
                timestamp: new Date('2024-01-01T10:02:00Z'),
              },
            ],
            moodAnalysis: {
              score: 4.2,
              confidence: 0.85,
              descriptors: ['sadness', 'hope', 'mixed'],
              factors: [
                {
                  type: 'sentiment_analysis',
                  impact: 0.35,
                  confidence: 0.85,
                  details: { primaryEmotions: ['sadness', 'hope'], emotionalIntensity: 0.7, sentiment: 'mixed' },
                },
              ],
            },
          },
          {
            id: 'conv-validation-2',
            timestamp: new Date('2024-01-01T14:00:00Z'),
            participants: [
              {
                id: 'user3',
                name: 'Jordan',
                role: 'author',
                messageCount: 2,
                emotionalExpressions: ['excited', 'joyful'],
              },
            ],
            messages: [
              {
                id: 'msg3',
                content:
                  "I got the promotion! I can't believe it finally happened!",
                authorId: 'user3',
                timestamp: new Date('2024-01-01T14:00:00Z'),
              },
            ],
            moodAnalysis: {
              score: 8.7,
              confidence: 0.92,
              descriptors: ['joy', 'excitement', 'positive'],
              factors: [
                {
                  type: 'sentiment_analysis',
                  impact: 0.35,
                  confidence: 0.92,
                  details: { primaryEmotions: ['joy', 'excitement'], emotionalIntensity: 0.9, sentiment: 'positive' },
                },
              ],
            },
          },
        ]

        const humanValidations: HumanValidationRecord[] = [
          {
            conversationId: 'conv-validation-1',
            validatorId: 'expert-1',
            validatorCredentials: {
              title: 'Licensed Clinical Psychologist',
              yearsExperience: 12,
              specializations: ['mood_disorders', 'therapeutic_communication'],
            },
            humanMoodScore: 4.0,
            confidence: 0.9,
            rationale:
              'Shows sadness with emerging hope through supportive interaction',
            emotionalFactors: [
              'depression_indicators',
              'social_support',
              'resilience_building',
            ],
            timestamp: new Date('2024-01-01T10:30:00Z'),
            validationSession: 'session-1',
          },
          {
            conversationId: 'conv-validation-2',
            validatorId: 'expert-1',
            humanMoodScore: 8.5,
            confidence: 0.95,
            rationale:
              'Clear expression of joy and accomplishment with high emotional intensity',
            emotionalFactors: [
              'achievement_celebration',
              'positive_affect',
              'self_efficacy',
            ],
            timestamp: new Date('2024-01-01T14:30:00Z'),
            validationSession: 'session-1',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          testConversations,
          humanValidations,
        )

        // High correlation expected (both pairs closely aligned)
        expect(
          validationResult.overallMetrics.pearsonCorrelation,
        ).toBeGreaterThan(0.85)
        expect(validationResult.overallMetrics.meanAbsoluteError).toBeLessThan(
          0.5,
        )
        expect(validationResult.overallMetrics.concordanceLevel).toBe('high')
        expect(
          validationResult.overallMetrics.agreementPercentage,
        ).toBeGreaterThan(85)
      })

      it('should detect moderate correlation when scores have systematic differences', async () => {
        const testConversations: (ConversationData & {
          moodAnalysis: MoodAnalysisResult
        })[] = [
          {
            id: 'conv-validation-3',
            timestamp: new Date('2024-01-02T09:00:00Z'),
            participants: [
              {
                id: 'user4',
                name: 'Casey',
                role: 'author',
                messageCount: 4,
                emotionalExpressions: ['anxious', 'worried'],
              },
            ],
            messages: [
              {
                id: 'msg4',
                content:
                  "I'm worried about the presentation tomorrow. What if I mess up?",
                authorId: 'user4',
                timestamp: new Date('2024-01-02T09:00:00Z'),
              },
            ],
            moodAnalysis: createMoodAnalysisResult({
              score: 3.8,
              confidence: 0.78,
              primaryEmotions: ['anxiety', 'worry'],
              emotionalIntensity: 0.6,
              sentiment: 'negative',
            }),
          },
          {
            id: 'conv-validation-4',
            timestamp: new Date('2024-01-02T11:00:00Z'),
            participants: [
              {
                id: 'user5',
                name: 'Riley',
                role: 'author',
                messageCount: 3,
                emotionalExpressions: ['neutral', 'focused'],
              },
            ],
            messages: [
              {
                id: 'msg5',
                content:
                  'Working on the quarterly report. Should be done by end of day.',
                authorId: 'user5',
                timestamp: new Date('2024-01-02T11:00:00Z'),
              },
            ],
            moodAnalysis: createMoodAnalysisResult({
              score: 5.2,
              confidence: 0.65,
              primaryEmotions: ['neutral', 'focused'],
              emotionalIntensity: 0.3,
              sentiment: 'neutral',
            }),
          },
          {
            id: 'conv-validation-5',
            timestamp: new Date('2024-01-02T13:00:00Z'),
            participants: [
              {
                id: 'user6',
                name: 'Sam',
                role: 'author',
                messageCount: 2,
                emotionalExpressions: ['content'],
              },
            ],
            messages: [
              {
                id: 'msg6',
                content:
                  'Had a good day today, feeling pretty good about things.',
                authorId: 'user6',
                timestamp: new Date('2024-01-02T13:00:00Z'),
              },
            ],
            moodAnalysis: createMoodAnalysisResult({
              score: 7.1,
              confidence: 0.8,
              primaryEmotions: ['contentment'],
              emotionalIntensity: 0.6,
              sentiment: 'positive',
            }),
          },
          {
            id: 'conv-validation-6',
            timestamp: new Date('2024-01-02T15:00:00Z'),
            participants: [
              {
                id: 'user7',
                name: 'Alex',
                role: 'author',
                messageCount: 3,
                emotionalExpressions: ['frustrated'],
              },
            ],
            messages: [
              {
                id: 'msg7',
                content: 'This is really frustrating, nothing is going right.',
                authorId: 'user7',
                timestamp: new Date('2024-01-02T15:00:00Z'),
              },
            ],
            moodAnalysis: createMoodAnalysisResult({
              score: 2.9,
              confidence: 0.85,
              primaryEmotions: ['frustration'],
              emotionalIntensity: 0.8,
              sentiment: 'negative',
            }),
          },
        ]

        const humanValidations: HumanValidationRecord[] = [
          {
            conversationId: 'conv-validation-3',
            validatorId: 'expert-2',
            validatorCredentials: {
              title: 'Certified Counselor',
              yearsExperience: 8,
              specializations: ['anxiety_disorders', 'workplace_stress'],
            },
            humanMoodScore: 3.0, // Human rates slightly lower but within acceptable range
            confidence: 0.82,
            rationale:
              'Anxiety present but manageable, shows problem-solving orientation',
            emotionalFactors: [
              'performance_anxiety',
              'coping_strategies',
              'future_orientation',
            ],
            timestamp: new Date('2024-01-02T09:30:00Z'),
            validationSession: 'session-2',
          },
          {
            conversationId: 'conv-validation-4',
            validatorId: 'expert-2',
            humanMoodScore: 6.2, // Human rates higher than algorithm, opposite trend
            confidence: 0.7,
            rationale:
              'Neutral tone but may indicate emotional detachment or work stress',
            emotionalFactors: [
              'emotional_detachment',
              'work_focus',
              'stress_indicators',
            ],
            timestamp: new Date('2024-01-02T11:30:00Z'),
            validationSession: 'session-2',
          },
          {
            conversationId: 'conv-validation-5',
            validatorId: 'expert-2',
            validatorCredentials: {
              title: 'Certified Counselor',
              yearsExperience: 8,
              specializations: ['anxiety_disorders', 'workplace_stress'],
            },
            humanMoodScore: 5.5, // Human sees neutral mood rather than positive
            confidence: 0.75,
            rationale: 'Positive mood but not overly enthusiastic',
            emotionalFactors: ['contentment', 'balanced_mood'],
            timestamp: new Date('2024-01-02T13:30:00Z'),
            validationSession: 'session-2',
          },
          {
            conversationId: 'conv-validation-6',
            validatorId: 'expert-2',
            validatorCredentials: {
              title: 'Certified Counselor',
              yearsExperience: 8,
              specializations: ['anxiety_disorders', 'workplace_stress'],
            },
            humanMoodScore: 3.8, // Human rates slightly higher
            confidence: 0.82,
            rationale: 'Frustration present but not severe depression',
            emotionalFactors: ['frustration', 'temporary_setback'],
            timestamp: new Date('2024-01-02T15:30:00Z'),
            validationSession: 'session-2',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          testConversations,
          humanValidations,
        )

        // Moderate correlation expected (systematic differences present)
        expect(
          validationResult.overallMetrics.pearsonCorrelation,
        ).toBeGreaterThan(0.6)
        expect(validationResult.overallMetrics.pearsonCorrelation).toBeLessThan(
          0.85,
        )
        expect(
          validationResult.overallMetrics.meanAbsoluteError,
        ).toBeGreaterThan(0.8)
        expect(validationResult.overallMetrics.meanAbsoluteError).toBeLessThan(
          1.5,
        )
        expect(validationResult.overallMetrics.concordanceLevel).toBe(
          'moderate',
        )
        expect(
          validationResult.overallMetrics.agreementPercentage,
        ).toBeGreaterThan(60)
        expect(
          validationResult.overallMetrics.agreementPercentage,
        ).toBeLessThan(85)
      })

      it('should identify low correlation when algorithmic and human assessments diverge significantly', async () => {
        const testConversations: (ConversationData & {
          moodAnalysis: MoodAnalysisResult
        })[] = [
          {
            id: 'conv-validation-5',
            timestamp: new Date('2024-01-03T15:00:00Z'),
            participants: [
              {
                id: 'user6',
                name: 'Morgan',
                role: 'author',
                messageCount: 2,
                emotionalExpressions: ['sarcastic', 'dismissive'],
              },
            ],
            messages: [
              {
                id: 'msg6',
                content:
                  'Oh great, another meeting about meetings. This is exactly what I needed today.',
                authorId: 'user6',
                timestamp: new Date('2024-01-03T15:00:00Z'),
              },
            ],
            moodAnalysis: createMoodAnalysisResult({
              score: 6.0, // Algorithm misses sarcasm, rates as neutral
              confidence: 0.55,
              primaryEmotions: ['neutral', 'mild_irritation'],
              emotionalIntensity: 0.4,
              sentiment: 'neutral',
            }),
          },
          {
            id: 'conv-validation-6',
            timestamp: new Date('2024-01-03T17:00:00Z'),
            participants: [
              {
                id: 'user7',
                name: 'Taylor',
                role: 'vulnerable_sharer',
                messageCount: 3,
                emotionalExpressions: ['grateful', 'relieved'],
              },
            ],
            messages: [
              {
                id: 'msg7',
                content:
                  'Thank you for listening. I feel so much better after talking this through.',
                authorId: 'user7',
                timestamp: new Date('2024-01-03T17:00:00Z'),
              },
            ],
            moodAnalysis: createMoodAnalysisResult({
              score: 7.2, // Algorithm rates moderately positive
              confidence: 0.8,
              primaryEmotions: ['gratitude', 'relief'],
              emotionalIntensity: 0.7,
              sentiment: 'positive',
            }),
          },
          {
            id: 'conv-validation-7',
            timestamp: new Date('2024-01-03T19:00:00Z'),
            participants: [
              {
                id: 'user8',
                name: 'Pat',
                role: 'author',
                messageCount: 2,
                emotionalExpressions: ['confused'],
              },
            ],
            messages: [
              {
                id: 'msg8',
                content:
                  "I'm feeling pretty confused about everything right now.",
                authorId: 'user8',
                timestamp: new Date('2024-01-03T19:00:00Z'),
              },
            ],
            moodAnalysis: createMoodAnalysisResult({
              score: 4.5,
              confidence: 0.7,
              primaryEmotions: ['confusion'],
              emotionalIntensity: 0.5,
              sentiment: 'negative',
            }),
          },
          {
            id: 'conv-validation-8',
            timestamp: new Date('2024-01-03T21:00:00Z'),
            participants: [
              {
                id: 'user9',
                name: 'Quinn',
                role: 'author',
                messageCount: 3,
                emotionalExpressions: ['angry'],
              },
            ],
            messages: [
              {
                id: 'msg9',
                content:
                  "This is absolutely ridiculous! I can't believe this happened.",
                authorId: 'user9',
                timestamp: new Date('2024-01-03T21:00:00Z'),
              },
            ],
            moodAnalysis: createMoodAnalysisResult({
              score: 2.1,
              confidence: 0.88,
              primaryEmotions: ['anger'],
              emotionalIntensity: 0.9,
              sentiment: 'negative',
            }),
          },
        ]

        const humanValidations: HumanValidationRecord[] = [
          {
            conversationId: 'conv-validation-5',
            validatorId: 'expert-3',
            validatorCredentials: {
              title: 'Clinical Social Worker',
              yearsExperience: 15,
              specializations: [
                'workplace_psychology',
                'communication_patterns',
              ],
            },
            humanMoodScore: 2.8, // Human correctly identifies underlying frustration
            confidence: 0.88,
            rationale:
              'Sarcasm indicates significant workplace frustration and cynicism',
            emotionalFactors: [
              'workplace_frustration',
              'cynicism',
              'emotional_masking',
            ],
            timestamp: new Date('2024-01-03T15:30:00Z'),
            validationSession: 'session-3',
          },
          {
            conversationId: 'conv-validation-6',
            validatorId: 'expert-3',
            humanMoodScore: 9.2, // Human recognizes deeper therapeutic breakthrough
            confidence: 0.92,
            rationale:
              'Expression shows significant emotional relief and therapeutic progress',
            emotionalFactors: [
              'therapeutic_breakthrough',
              'emotional_catharsis',
              'healing_process',
            ],
            timestamp: new Date('2024-01-03T17:30:00Z'),
            validationSession: 'session-3',
          },
          {
            conversationId: 'conv-validation-7',
            validatorId: 'expert-3',
            validatorCredentials: {
              title: 'Clinical Social Worker',
              yearsExperience: 15,
              specializations: [
                'workplace_psychology',
                'communication_patterns',
              ],
            },
            humanMoodScore: 7.5, // Human sees confusion as mild (algorithm: 4.5)
            confidence: 0.85,
            rationale:
              'Confusion is temporary and manageable, not deeply distressing',
            emotionalFactors: ['temporary_confusion', 'seeking_clarity'],
            timestamp: new Date('2024-01-03T19:30:00Z'),
            validationSession: 'session-3',
          },
          {
            conversationId: 'conv-validation-8',
            validatorId: 'expert-3',
            validatorCredentials: {
              title: 'Clinical Social Worker',
              yearsExperience: 15,
              specializations: [
                'workplace_psychology',
                'communication_patterns',
              ],
            },
            humanMoodScore: 4.2, // Human sees anger as less severe (algorithm: 2.1)
            confidence: 0.8,
            rationale:
              'Anger is justified and healthy expression, not depression',
            emotionalFactors: ['healthy_anger', 'assertiveness'],
            timestamp: new Date('2024-01-03T21:30:00Z'),
            validationSession: 'session-3',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          testConversations,
          humanValidations,
        )

        // Low correlation expected (significant divergences)
        expect(validationResult.overallMetrics.pearsonCorrelation).toBeLessThan(
          0.6,
        )
        expect(
          validationResult.overallMetrics.meanAbsoluteError,
        ).toBeGreaterThan(1.0)
        expect(validationResult.overallMetrics.concordanceLevel).toBe('low')
        expect(
          validationResult.overallMetrics.agreementPercentage,
        ).toBeLessThan(60)
      })
    })

    describe('Discrepancy Analysis', () => {
      it('should identify patterns in algorithmic over-estimation vs human assessment', async () => {
        const testConversations: (ConversationData & {
          moodAnalysis: MoodAnalysisResult
        })[] = [
          {
            id: 'conv-over-1',
            timestamp: new Date('2024-01-04T10:00:00Z'),
            participants: [
              { id: 'user8', name: 'Alex', role: 'author', messageCount: 2 },
            ],
            messages: [
              {
                id: 'msg8',
                content: 'I guess things are okay. Could be worse.',
                authorId: 'user8',
                timestamp: new Date('2024-01-04T10:00:00Z'),
              },
            ],
            moodAnalysis: createMoodAnalysisResult({
              score: 6.5,
              confidence: 0.7,
              primaryEmotions: ['neutral'],
              emotionalIntensity: 0.5,
              sentiment: 'neutral',
            }),
          },
          {
            id: 'conv-over-2',
            timestamp: new Date('2024-01-04T12:00:00Z'),
            participants: [
              { id: 'user9', name: 'Jamie', role: 'author', messageCount: 2 },
            ],
            messages: [
              {
                id: 'msg9',
                content: "Yeah, I'm fine. Nothing to worry about.",
                authorId: 'user9',
                timestamp: new Date('2024-01-04T12:00:00Z'),
              },
            ],
            moodAnalysis: createMoodAnalysisResult({
              score: 5.8,
              confidence: 0.65,
              primaryEmotions: ['neutral'],
              emotionalIntensity: 0.4,
              sentiment: 'neutral',
            }),
          },
        ]

        const humanValidations: HumanValidationRecord[] = [
          {
            conversationId: 'conv-over-1',
            validatorId: 'expert-4',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 10,
              specializations: ['depression', 'emotional_suppression'],
            },
            humanMoodScore: 4.0, // Human detects underlying sadness
            confidence: 0.85,
            rationale:
              'Phrase "could be worse" suggests minimization of distress',
            emotionalFactors: [
              'emotional_minimization',
              'possible_depression',
              'avoidance',
            ],
            timestamp: new Date('2024-01-04T10:30:00Z'),
            validationSession: 'session-4',
          },
          {
            conversationId: 'conv-over-2',
            validatorId: 'expert-4',
            humanMoodScore: 3.5, // Human detects emotional suppression
            confidence: 0.8,
            rationale:
              'Reassurance-seeking behavior may mask underlying distress',
            emotionalFactors: [
              'emotional_suppression',
              'reassurance_seeking',
              'potential_anxiety',
            ],
            timestamp: new Date('2024-01-04T12:30:00Z'),
            validationSession: 'session-4',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          testConversations,
          humanValidations,
        )

        // Should detect systematic over-estimation pattern
        expect(validationResult.discrepancyAnalysis.systematicBias).toBe(
          'algorithmic_over_estimation',
        )
        expect(
          validationResult.discrepancyAnalysis.biasPattern.magnitude,
        ).toBeGreaterThan(1.5)
        expect(
          validationResult.discrepancyAnalysis.biasPattern.consistency,
        ).toBeGreaterThan(0.7)
        expect(
          validationResult.discrepancyAnalysis.commonDiscrepancyTypes,
        ).toContain('emotional_suppression_missed')
        expect(
          validationResult.discrepancyAnalysis.commonDiscrepancyTypes,
        ).toContain('neutral_surface_bias')
      })

      it('should identify patterns in algorithmic under-estimation vs human assessment', async () => {
        const testConversations: (ConversationData & {
          moodAnalysis: MoodAnalysisResult
        })[] = [
          {
            id: 'conv-under-1',
            timestamp: new Date('2024-01-05T14:00:00Z'),
            participants: [
              { id: 'user10', name: 'Robin', role: 'author', messageCount: 3 },
            ],
            messages: [
              {
                id: 'msg10',
                content:
                  'Thanks for the support. It really means a lot to me right now.',
                authorId: 'user10',
                timestamp: new Date('2024-01-05T14:00:00Z'),
              },
            ],
            moodAnalysis: createMoodAnalysisResult({
              score: 6.8,
              confidence: 0.75,
              primaryEmotions: ['gratitude'],
              emotionalIntensity: 0.6,
              sentiment: 'positive',
            }),
          },
          {
            id: 'conv-under-2',
            timestamp: new Date('2024-01-05T16:00:00Z'),
            participants: [
              { id: 'user11', name: 'Sam', role: 'author', messageCount: 2 },
            ],
            messages: [
              {
                id: 'msg11',
                content:
                  "I appreciate you being there for me. You've helped me see things differently.",
                authorId: 'user11',
                timestamp: new Date('2024-01-05T16:00:00Z'),
              },
            ],
            moodAnalysis: createMoodAnalysisResult({
              score: 7.0,
              confidence: 0.78,
              primaryEmotions: ['appreciation'],
              emotionalIntensity: 0.65,
              sentiment: 'positive',
            }),
          },
        ]

        const humanValidations: HumanValidationRecord[] = [
          {
            conversationId: 'conv-under-1',
            validatorId: 'expert-5',
            validatorCredentials: {
              title: 'Licensed Therapist',
              yearsExperience: 12,
              specializations: [
                'positive_psychology',
                'therapeutic_relationships',
              ],
            },
            humanMoodScore: 8.2, // Human recognizes deeper emotional healing
            confidence: 0.9,
            rationale:
              'Expression indicates significant emotional breakthrough and healing',
            emotionalFactors: [
              'emotional_breakthrough',
              'healing_process',
              'deep_gratitude',
            ],
            timestamp: new Date('2024-01-05T14:30:00Z'),
            validationSession: 'session-5',
          },
          {
            conversationId: 'conv-under-2',
            validatorId: 'expert-5',
            humanMoodScore: 8.5, // Human detects cognitive-emotional shift
            confidence: 0.88,
            rationale: 'Shows cognitive reframing and emotional transformation',
            emotionalFactors: [
              'cognitive_reframing',
              'emotional_transformation',
              'therapeutic_alliance',
            ],
            timestamp: new Date('2024-01-05T16:30:00Z'),
            validationSession: 'session-5',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          testConversations,
          humanValidations,
        )

        // Should detect systematic under-estimation pattern
        expect(validationResult.discrepancyAnalysis.systematicBias).toBe(
          'algorithmic_under_estimation',
        )
        expect(
          validationResult.discrepancyAnalysis.biasPattern.magnitude,
        ).toBeGreaterThan(1.0)
        expect(
          validationResult.discrepancyAnalysis.biasPattern.consistency,
        ).toBeGreaterThan(0.7)
        expect(
          validationResult.discrepancyAnalysis.commonDiscrepancyTypes,
        ).toContain('therapeutic_depth_missed')
        expect(
          validationResult.discrepancyAnalysis.commonDiscrepancyTypes,
        ).toContain('emotional_breakthrough_undervalued')
      })

      it('should provide detailed individual conversation discrepancy analysis', async () => {
        const testConversations: (ConversationData & {
          moodAnalysis: MoodAnalysisResult
        })[] = [
          {
            id: 'conv-detailed-1',
            timestamp: new Date('2024-01-06T09:00:00Z'),
            participants: [
              {
                id: 'user12',
                name: 'Casey',
                role: 'vulnerable_sharer',
                messageCount: 4,
                emotionalExpressions: ['conflicted', 'hopeful', 'scared'],
              },
            ],
            messages: [
              {
                id: 'msg12',
                content:
                  "I'm scared but also hopeful about this new opportunity. It feels overwhelming.",
                authorId: 'user12',
                timestamp: new Date('2024-01-06T09:00:00Z'),
              },
            ],
            moodAnalysis: createMoodAnalysisResult({
              score: 5.5,
              confidence: 0.68,
              primaryEmotions: ['fear', 'hope', 'overwhelm'],
              emotionalIntensity: 0.75,
              sentiment: 'mixed',
            }),
          },
        ]

        const humanValidations: HumanValidationRecord[] = [
          {
            conversationId: 'conv-detailed-1',
            validatorId: 'expert-6',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 18,
              specializations: [
                'anxiety_disorders',
                'life_transitions',
                'emotional_complexity',
              ],
            },
            humanMoodScore: 6.8,
            confidence: 0.92,
            rationale:
              'Mixed emotions indicate psychological growth and adaptive coping. Hope outweighs fear in context of opportunity.',
            emotionalFactors: [
              'psychological_growth',
              'adaptive_coping',
              'ambivalent_emotions',
              'life_transition_positive',
            ],
            timestamp: new Date('2024-01-06T09:30:00Z'),
            validationSession: 'session-6',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          testConversations,
          humanValidations,
        )

        // Should provide detailed individual analysis
        expect(validationResult.individualAnalyses).toHaveLength(1)
        const analysis = validationResult.individualAnalyses[0]

        expect(analysis.conversationId).toBe('conv-detailed-1')
        expect(analysis.algorithmicScore).toBe(5.5)
        expect(analysis.humanScore).toBe(6.8)
        expect(analysis.absoluteError).toBeCloseTo(1.3, 1)
        expect(analysis.discrepancyType).toBe('algorithmic_under_estimation')
        expect(analysis.discrepancyFactors).toContain(
          'mixed_emotion_complexity',
        )
        expect(analysis.discrepancyFactors).toContain(
          'contextual_nuance_missed',
        )
        expect(analysis.humanRationale).toContain('psychological growth')
        expect(analysis.recommendedImprovement).toContain(
          'enhanced_mixed_emotion_analysis',
        )
      })
    })

    describe('Expert Validator Consistency Analysis', () => {
      it('should measure inter-rater reliability across multiple expert validators', async () => {
        const testConversation: ConversationData & {
          moodAnalysis: MoodAnalysisResult
        } = {
          id: 'conv-consistency-1',
          timestamp: new Date('2024-01-07T11:00:00Z'),
          participants: [
            {
              id: 'user13',
              name: 'Jordan',
              role: 'author',
              messageCount: 3,
              emotionalExpressions: ['anxious', 'determined'],
            },
          ],
          messages: [
            {
              id: 'msg13',
              content:
                "I'm nervous about the interview but I've prepared well and I believe in myself.",
              authorId: 'user13',
              timestamp: new Date('2024-01-07T11:00:00Z'),
            },
          ],
          moodAnalysis: createMoodAnalysisResult({
            score: 6.2,
            confidence: 0.82,
            primaryEmotions: ['anxiety', 'confidence'],
            emotionalIntensity: 0.7,
            sentiment: 'mixed',
          }),
        }

        const multipleValidations: HumanValidationRecord[] = [
          {
            conversationId: 'conv-consistency-1',
            validatorId: 'expert-7',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 15,
              specializations: ['anxiety', 'performance'],
            },
            humanMoodScore: 6.0,
            confidence: 0.85,
            rationale: 'Anxiety balanced by self-efficacy and preparation',
            emotionalFactors: [
              'performance_anxiety',
              'self_efficacy',
              'preparation_confidence',
            ],
            timestamp: new Date('2024-01-07T11:30:00Z'),
            validationSession: 'multi-rater-1',
          },
          {
            conversationId: 'conv-consistency-1',
            validatorId: 'expert-8',
            validatorCredentials: {
              title: 'Licensed Counselor',
              yearsExperience: 10,
              specializations: ['career_counseling', 'self_confidence'],
            },
            humanMoodScore: 6.5,
            confidence: 0.88,
            rationale:
              'Positive self-talk and preparation indicate healthy coping with pre-performance nerves',
            emotionalFactors: [
              'healthy_coping',
              'positive_self_talk',
              'pre_performance_nerves',
            ],
            timestamp: new Date('2024-01-07T11:35:00Z'),
            validationSession: 'multi-rater-1',
          },
          {
            conversationId: 'conv-consistency-1',
            validatorId: 'expert-9',
            validatorCredentials: {
              title: 'Psychiatric Social Worker',
              yearsExperience: 12,
              specializations: ['workplace_psychology', 'stress_management'],
            },
            humanMoodScore: 5.8,
            confidence: 0.8,
            rationale:
              'Nervous energy tempered by realistic confidence and adequate preparation',
            emotionalFactors: [
              'nervous_energy',
              'realistic_confidence',
              'adequate_preparation',
            ],
            timestamp: new Date('2024-01-07T11:40:00Z'),
            validationSession: 'multi-rater-1',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          [testConversation],
          multipleValidations,
        )

        // Should measure inter-rater reliability
        expect(
          validationResult.validatorConsistency.interRaterReliability,
        ).toBeGreaterThan(0.8)
        expect(
          validationResult.validatorConsistency.averageVariance,
        ).toBeLessThan(0.5)
        expect(validationResult.validatorConsistency.consensusLevel).toBe(
          'high',
        )
        expect(
          validationResult.validatorConsistency.outlierValidations,
        ).toHaveLength(0)

        // All validations should be within reasonable range
        const humanScores = multipleValidations.map((v) => v.humanMoodScore)
        const scoreRange = Math.max(...humanScores) - Math.min(...humanScores)
        expect(scoreRange).toBeLessThan(1.0) // High consistency expected
      })

      it('should identify outlier validator assessments and flag for review', async () => {
        const testConversation: ConversationData & {
          moodAnalysis: MoodAnalysisResult
        } = {
          id: 'conv-outlier-1',
          timestamp: new Date('2024-01-08T13:00:00Z'),
          participants: [
            {
              id: 'user14',
              name: 'Riley',
              role: 'author',
              messageCount: 2,
              emotionalExpressions: ['frustrated', 'tired'],
            },
          ],
          messages: [
            {
              id: 'msg14',
              content:
                "This project is taking forever and I'm getting frustrated with the delays.",
              authorId: 'user14',
              timestamp: new Date('2024-01-08T13:00:00Z'),
            },
          ],
          moodAnalysis: createMoodAnalysisResult({
            score: 4.1,
            confidence: 0.79,
            primaryEmotions: ['frustration', 'fatigue'],
            emotionalIntensity: 0.65,
            sentiment: 'negative',
          }),
        }

        const validationsWithOutlier: HumanValidationRecord[] = [
          {
            conversationId: 'conv-outlier-1',
            validatorId: 'expert-10',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 14,
              specializations: ['workplace_stress'],
            },
            humanMoodScore: 4.0,
            confidence: 0.83,
            rationale:
              'Work frustration at moderate level, manageable stress response',
            emotionalFactors: ['work_frustration', 'manageable_stress'],
            timestamp: new Date('2024-01-08T13:30:00Z'),
            validationSession: 'outlier-test-1',
          },
          {
            conversationId: 'conv-outlier-1',
            validatorId: 'expert-11',
            validatorCredentials: {
              title: 'Licensed Counselor',
              yearsExperience: 9,
              specializations: ['occupational_psychology'],
            },
            humanMoodScore: 4.2,
            confidence: 0.8,
            rationale:
              'Frustration with project delays, showing signs of work burnout',
            emotionalFactors: ['project_frustration', 'burnout_indicators'],
            timestamp: new Date('2024-01-08T13:35:00Z'),
            validationSession: 'outlier-test-1',
          },
          {
            conversationId: 'conv-outlier-1',
            validatorId: 'expert-12',
            validatorCredentials: {
              title: 'Trainee Psychologist',
              yearsExperience: 2,
              specializations: ['general_practice'],
            },
            humanMoodScore: 8.5, // Outlier: significantly higher than others (mean ~4.1, deviation ~4.4)
            confidence: 0.6,
            rationale:
              'Person is expressing normal work challenges, seems generally positive',
            emotionalFactors: ['normal_work_challenges', 'general_positivity'], // Misses frustration
            timestamp: new Date('2024-01-08T13:40:00Z'),
            validationSession: 'outlier-test-1',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          [testConversation],
          validationsWithOutlier,
        )

        // Should identify outlier validation
        expect(
          validationResult.validatorConsistency.interRaterReliability,
        ).toBeLessThan(0.7)
        expect(validationResult.validatorConsistency.consensusLevel).toBe('low')
        expect(
          validationResult.validatorConsistency.outlierValidations,
        ).toHaveLength(1)
        expect(
          validationResult.validatorConsistency.outlierValidations[0]
            .validatorId,
        ).toBe('expert-12')
        expect(
          validationResult.validatorConsistency.outlierValidations[0]
            .deviationMagnitude,
        ).toBeGreaterThan(2.5)
        expect(
          validationResult.validatorConsistency.outlierValidations[0]
            .flagReason,
        ).toContain('significant_deviation')
      })
    })
  })

  describe('Validation Framework Configuration', () => {
    it('should allow customization of correlation thresholds and sensitivity settings', () => {
      const customFramework = new ValidationFramework({
        correlationThreshold: 0.75, // Lower threshold
        significanceLevel: 0.01, // Higher significance requirement
        biasDetectionSensitivity: 0.1, // Higher sensitivity
        minimumValidatorExperience: 5,
        requiredValidatorCount: 2,
      })

      expect(customFramework.config.correlationThreshold).toBe(0.75)
      expect(customFramework.config.significanceLevel).toBe(0.01)
      expect(customFramework.config.biasDetectionSensitivity).toBe(0.1)
      expect(customFramework.config.minimumValidatorExperience).toBe(5)
      expect(customFramework.config.requiredValidatorCount).toBe(2)
    })

    it('should validate validator credentials meet minimum requirements', () => {
      const restrictiveFramework = new ValidationFramework({
        minimumValidatorExperience: 10,
        requiredSpecializations: ['clinical_psychology', 'mood_disorders'],
      })

      const inadequateValidator: HumanValidationRecord = {
        conversationId: 'test-conv',
        validatorId: 'inexperienced-1',
        validatorCredentials: {
          title: 'Psychology Student',
          yearsExperience: 1, // Below minimum
          specializations: ['general'], // Missing required specializations
        },
        humanMoodScore: 5.0,
        confidence: 0.7,
        rationale: 'Basic assessment',
        emotionalFactors: ['general_mood'],
        timestamp: new Date(),
        validationSession: 'test',
      }

      expect(() => {
        restrictiveFramework.validateValidatorCredentials(inadequateValidator)
      }).toThrow('Validator does not meet minimum experience requirements')
    })
  })

  describe('Systematic Bias Detection (Task 4.3)', () => {
    describe('Bias Pattern Identification', () => {
      it('should detect systematic algorithmic over-estimation bias', async () => {
        const testConversations: (ConversationData & {
          moodAnalysis: MoodAnalysisResult
        })[] = [
          {
            id: 'conv-bias-over-1',
            timestamp: new Date('2024-01-03T10:00:00Z'),
            participants: [{ id: 'user1', name: 'User', role: 'author' }],
            messages: [
              {
                id: 'msg1',
                content: 'Feeling a bit stressed about the presentation',
                authorId: 'user1',
                timestamp: new Date(),
              },
            ],
            moodAnalysis: {
              score: 4.8,
              descriptors: ['mildly_stressed'],
              confidence: 0.8,
              factors: [],
            },
          },
          {
            id: 'conv-bias-over-2',
            timestamp: new Date('2024-01-03T11:00:00Z'),
            participants: [{ id: 'user2', name: 'User2', role: 'author' }],
            messages: [
              {
                id: 'msg2',
                content: 'Not sure if I can handle this workload',
                authorId: 'user2',
                timestamp: new Date(),
              },
            ],
            moodAnalysis: {
              score: 5.2,
              descriptors: ['uncertain'],
              confidence: 0.75,
              factors: [],
            },
          },
          {
            id: 'conv-bias-over-3',
            timestamp: new Date('2024-01-03T12:00:00Z'),
            participants: [{ id: 'user3', name: 'User3', role: 'author' }],
            messages: [
              {
                id: 'msg3',
                content: 'Things are getting overwhelming lately',
                authorId: 'user3',
                timestamp: new Date(),
              },
            ],
            moodAnalysis: {
              score: 4.5,
              descriptors: ['overwhelmed'],
              confidence: 0.85,
              factors: [],
            },
          },
        ]

        const humanValidations: HumanValidationRecord[] = [
          {
            conversationId: 'conv-bias-over-1',
            validatorId: 'expert-bias-1',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 12,
              specializations: ['stress_assessment'],
            },
            humanMoodScore: 2.8, // Human consistently rates lower (more negative)
            confidence: 0.9,
            rationale:
              'Clear signs of distress and anxiety that algorithm underestimates',
            emotionalFactors: [
              'anxiety',
              'performance_pressure',
              'stress_indicators',
            ],
            timestamp: new Date(),
            validationSession: 'bias-detection-1',
          },
          {
            conversationId: 'conv-bias-over-2',
            validatorId: 'expert-bias-1',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 12,
              specializations: ['stress_assessment'],
            },
            humanMoodScore: 3.1, // Human consistently rates lower
            confidence: 0.85,
            rationale:
              'Self-doubt and capacity concerns indicate deeper distress',
            emotionalFactors: [
              'self_doubt',
              'capacity_concerns',
              'underlying_distress',
            ],
            timestamp: new Date(),
            validationSession: 'bias-detection-1',
          },
          {
            conversationId: 'conv-bias-over-3',
            validatorId: 'expert-bias-1',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 12,
              specializations: ['stress_assessment'],
            },
            humanMoodScore: 2.5, // Human consistently rates lower
            confidence: 0.95,
            rationale:
              'Overwhelm language suggests significant distress beyond algorithm assessment',
            emotionalFactors: [
              'overwhelm',
              'distress_indicators',
              'emotional_flooding',
            ],
            timestamp: new Date(),
            validationSession: 'bias-detection-1',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          testConversations,
          humanValidations,
        )

        // Should detect systematic over-estimation bias
        expect(validationResult.biasAnalysis.biasDetected).toBe(true)
        expect(validationResult.discrepancyAnalysis.systematicBias).toBe(
          'algorithmic_over_estimation',
        )
        expect(validationResult.discrepancyAnalysis.biasPattern.direction).toBe(
          'positive',
        )
        expect(
          validationResult.discrepancyAnalysis.biasPattern.magnitude,
        ).toBeGreaterThan(1.5)
        expect(
          validationResult.discrepancyAnalysis.biasPattern.consistency,
        ).toBeGreaterThan(0.7)
        expect(validationResult.biasAnalysis.biasTypes).toHaveLength(1)
        expect(validationResult.biasAnalysis.biasTypes[0].type).toBe(
          'emotional_complexity',
        )
        expect(validationResult.biasAnalysis.biasTypes[0].severity).toBeOneOf([
          'medium',
          'high',
        ])
      })

      it('should detect systematic algorithmic under-estimation bias', async () => {
        const testConversations: (ConversationData & {
          moodAnalysis: MoodAnalysisResult
        })[] = [
          {
            id: 'conv-bias-under-1',
            timestamp: new Date('2024-01-03T14:00:00Z'),
            participants: [{ id: 'user1', name: 'User', role: 'author' }],
            messages: [
              {
                id: 'msg1',
                content: 'Making progress on my personal goals',
                authorId: 'user1',
                timestamp: new Date(),
              },
            ],
            moodAnalysis: {
              score: 6.2,
              descriptors: ['content'],
              confidence: 0.7,
              factors: [],
            },
          },
          {
            id: 'conv-bias-under-2',
            timestamp: new Date('2024-01-03T15:00:00Z'),
            participants: [{ id: 'user2', name: 'User2', role: 'author' }],
            messages: [
              {
                id: 'msg2',
                content: 'Feeling grateful for the support I have',
                authorId: 'user2',
                timestamp: new Date(),
              },
            ],
            moodAnalysis: {
              score: 7.1,
              descriptors: ['grateful'],
              confidence: 0.75,
              factors: [],
            },
          },
          {
            id: 'conv-bias-under-3',
            timestamp: new Date('2024-01-03T16:00:00Z'),
            participants: [{ id: 'user3', name: 'User3', role: 'author' }],
            messages: [
              {
                id: 'msg3',
                content: 'Really excited about this new opportunity',
                authorId: 'user3',
                timestamp: new Date(),
              },
            ],
            moodAnalysis: {
              score: 7.8,
              descriptors: ['excited'],
              confidence: 0.8,
              factors: [],
            },
          },
        ]

        const humanValidations: HumanValidationRecord[] = [
          {
            conversationId: 'conv-bias-under-1',
            validatorId: 'expert-bias-2',
            validatorCredentials: {
              title: 'Licensed Therapist',
              yearsExperience: 10,
              specializations: ['positive_psychology'],
            },
            humanMoodScore: 8.5, // Human consistently rates higher (more positive)
            confidence: 0.9,
            rationale:
              'Shows significant growth and self-efficacy beyond surface content',
            emotionalFactors: [
              'growth_mindset',
              'self_efficacy',
              'resilience_building',
            ],
            timestamp: new Date(),
            validationSession: 'bias-detection-2',
          },
          {
            conversationId: 'conv-bias-under-2',
            validatorId: 'expert-bias-2',
            validatorCredentials: {
              title: 'Licensed Therapist',
              yearsExperience: 10,
              specializations: ['positive_psychology'],
            },
            humanMoodScore: 8.8, // Human consistently rates higher
            confidence: 0.85,
            rationale:
              'Gratitude expression indicates deep emotional wellbeing and connection',
            emotionalFactors: [
              'deep_gratitude',
              'social_connection',
              'emotional_wellbeing',
            ],
            timestamp: new Date(),
            validationSession: 'bias-detection-2',
          },
          {
            conversationId: 'conv-bias-under-3',
            validatorId: 'expert-bias-2',
            validatorCredentials: {
              title: 'Licensed Therapist',
              yearsExperience: 10,
              specializations: ['positive_psychology'],
            },
            humanMoodScore: 9.2, // Human consistently rates higher
            confidence: 0.95,
            rationale:
              'Excitement coupled with opportunity suggests transformative positive state',
            emotionalFactors: [
              'transformative_excitement',
              'opportunity_embrace',
              'future_orientation',
            ],
            timestamp: new Date(),
            validationSession: 'bias-detection-2',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          testConversations,
          humanValidations,
        )

        // Should detect systematic under-estimation bias
        expect(validationResult.biasAnalysis.biasDetected).toBe(true)
        expect(validationResult.discrepancyAnalysis.systematicBias).toBe(
          'algorithmic_under_estimation',
        )
        expect(validationResult.discrepancyAnalysis.biasPattern.direction).toBe(
          'negative',
        )
        expect(
          validationResult.discrepancyAnalysis.biasPattern.magnitude,
        ).toBeGreaterThan(1.5)
        expect(validationResult.biasAnalysis.biasTypes[0].type).toBe(
          'emotional_complexity',
        )
        expect(
          validationResult.biasAnalysis.detectionConfidence,
        ).toBeGreaterThan(0.8)
      })

      it('should identify no systematic bias when differences are random', async () => {
        const testConversations: (ConversationData & {
          moodAnalysis: MoodAnalysisResult
        })[] = [
          {
            id: 'conv-no-bias-1',
            timestamp: new Date('2024-01-03T18:00:00Z'),
            participants: [{ id: 'user1', name: 'User', role: 'author' }],
            messages: [
              {
                id: 'msg1',
                content: 'Having a regular day at work',
                authorId: 'user1',
                timestamp: new Date(),
              },
            ],
            moodAnalysis: {
              score: 5.5,
              descriptors: ['neutral'],
              confidence: 0.8,
              factors: [],
            },
          },
          {
            id: 'conv-no-bias-2',
            timestamp: new Date('2024-01-03T19:00:00Z'),
            participants: [{ id: 'user2', name: 'User2', role: 'author' }],
            messages: [
              {
                id: 'msg2',
                content: 'Feeling pretty good about the weekend plans',
                authorId: 'user2',
                timestamp: new Date(),
              },
            ],
            moodAnalysis: {
              score: 7.2,
              descriptors: ['optimistic'],
              confidence: 0.75,
              factors: [],
            },
          },
          {
            id: 'conv-no-bias-3',
            timestamp: new Date('2024-01-03T20:00:00Z'),
            participants: [{ id: 'user3', name: 'User3', role: 'author' }],
            messages: [
              {
                id: 'msg3',
                content: 'A bit tired but manageable',
                authorId: 'user3',
                timestamp: new Date(),
              },
            ],
            moodAnalysis: {
              score: 4.8,
              descriptors: ['tired'],
              confidence: 0.8,
              factors: [],
            },
          },
        ]

        const humanValidations: HumanValidationRecord[] = [
          {
            conversationId: 'conv-no-bias-1',
            validatorId: 'expert-no-bias',
            validatorCredentials: {
              title: 'Counseling Psychologist',
              yearsExperience: 8,
              specializations: ['mood_assessment'],
            },
            humanMoodScore: 5.8, // Small positive difference
            confidence: 0.8,
            rationale: 'Neutral mood with slight positive undertone',
            emotionalFactors: ['neutral_baseline', 'work_routine'],
            timestamp: new Date(),
            validationSession: 'no-bias-detection',
          },
          {
            conversationId: 'conv-no-bias-2',
            validatorId: 'expert-no-bias',
            validatorCredentials: {
              title: 'Counseling Psychologist',
              yearsExperience: 8,
              specializations: ['mood_assessment'],
            },
            humanMoodScore: 6.9, // Small negative difference
            confidence: 0.75,
            rationale: 'Positive mood but not overly enthusiastic',
            emotionalFactors: ['mild_optimism', 'anticipation'],
            timestamp: new Date(),
            validationSession: 'no-bias-detection',
          },
          {
            conversationId: 'conv-no-bias-3',
            validatorId: 'expert-no-bias',
            validatorCredentials: {
              title: 'Counseling Psychologist',
              yearsExperience: 8,
              specializations: ['mood_assessment'],
            },
            humanMoodScore: 5.1, // Small positive difference
            confidence: 0.8,
            rationale: 'Fatigue present but coping well',
            emotionalFactors: ['fatigue', 'coping_adequately'],
            timestamp: new Date(),
            validationSession: 'no-bias-detection',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          testConversations,
          humanValidations,
        )

        // Should detect no systematic bias
        expect(validationResult.biasAnalysis.biasDetected).toBe(false)
        expect(validationResult.discrepancyAnalysis.systematicBias).toBe(
          'no_systematic_bias',
        )
        expect(
          validationResult.discrepancyAnalysis.biasPattern.magnitude,
        ).toBeLessThan(0.5)
        expect(validationResult.biasAnalysis.detectionConfidence).toBeLessThan(
          0.7,
        )
        expect(validationResult.biasAnalysis.biasTypes).toHaveLength(0)
      })
    })

    describe('Bias Correction Recommendations', () => {
      it('should provide specific correction recommendations for detected biases', async () => {
        const testConversations: (ConversationData & {
          moodAnalysis: MoodAnalysisResult
        })[] = [
          {
            id: 'conv-correction-1',
            timestamp: new Date('2024-01-04T10:00:00Z'),
            participants: [{ id: 'user1', name: 'User', role: 'author' }],
            messages: [
              {
                id: 'msg1',
                content: 'I am struggling with complex emotions right now',
                authorId: 'user1',
                timestamp: new Date(),
              },
            ],
            moodAnalysis: {
              score: 5.5,
              descriptors: ['mixed'],
              confidence: 0.6,
              factors: [],
            },
          },
          {
            id: 'conv-correction-2',
            timestamp: new Date('2024-01-04T11:00:00Z'),
            participants: [{ id: 'user2', name: 'User2', role: 'author' }],
            messages: [
              {
                id: 'msg2',
                content: 'Having mixed feelings about this situation',
                authorId: 'user2',
                timestamp: new Date(),
              },
            ],
            moodAnalysis: {
              score: 6.0,
              descriptors: ['mixed'],
              confidence: 0.65,
              factors: [],
            },
          },
          {
            id: 'conv-correction-3',
            timestamp: new Date('2024-01-04T12:00:00Z'),
            participants: [{ id: 'user3', name: 'User3', role: 'author' }],
            messages: [
              {
                id: 'msg3',
                content: 'Feeling conflicted and uncertain',
                authorId: 'user3',
                timestamp: new Date(),
              },
            ],
            moodAnalysis: {
              score: 5.8,
              descriptors: ['mixed', 'uncertain'],
              confidence: 0.62,
              factors: [],
            },
          },
        ]

        const humanValidations: HumanValidationRecord[] = [
          {
            conversationId: 'conv-correction-1',
            validatorId: 'expert-correction',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 15,
              specializations: ['emotional_complexity'],
            },
            humanMoodScore: 3.2, // Significant over-estimation by algorithm
            confidence: 0.95,
            rationale:
              'Complex emotional struggle with underlying distress patterns',
            emotionalFactors: [
              'emotional_complexity',
              'underlying_distress',
              'mixed_emotions',
            ],
            timestamp: new Date(),
            validationSession: 'correction-testing',
          },
          {
            conversationId: 'conv-correction-2',
            validatorId: 'expert-correction',
            humanMoodScore: 3.5, // Another over-estimation
            confidence: 0.92,
            rationale:
              'Mixed emotions indicate significant internal conflict',
            emotionalFactors: [
              'internal_conflict',
              'mixed_emotions',
            ],
            timestamp: new Date(),
            validationSession: 'correction-testing',
          },
          {
            conversationId: 'conv-correction-3',
            validatorId: 'expert-correction',
            humanMoodScore: 3.8, // Consistent over-estimation pattern
            confidence: 0.90,
            rationale:
              'Uncertainty and conflict suggest lower mood state',
            emotionalFactors: [
              'uncertainty',
              'emotional_conflict',
            ],
            timestamp: new Date(),
            validationSession: 'correction-testing',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          testConversations,
          humanValidations,
        )

        // Should provide correction recommendations
        expect(validationResult.biasAnalysis.biasDetected).toBe(true)
        expect(
          validationResult.biasAnalysis.biasTypes[0].correctionRecommendation,
        ).toBeDefined()
        expect(
          validationResult.biasAnalysis.biasTypes[0].correctionRecommendation,
        ).toContain('mixed-emotion')
        expect(validationResult.recommendations.length).toBeGreaterThan(0)
        
        // Check for specific recommendation categories
        // Since we have a single specific bias type, it will generate focused recommendations
        expect(
          validationResult.recommendations.some(
            (r) => r.category === 'algorithm_enhancement',
          ),
        ).toBe(true)
        expect(
          validationResult.recommendations.some(
            (r) => r.category === 'training_data_enhancement',
          ),
        ).toBe(true)
        expect(
          validationResult.recommendations.some(
            (r) => r.category === 'validation_process_improvement',
          ),
        ).toBe(true)
      })
    })

    describe('Statistical Evidence for Bias Detection', () => {
      it('should provide statistical evidence supporting bias detection', async () => {
        const testConversations: (ConversationData & {
          moodAnalysis: MoodAnalysisResult
        })[] = [
          {
            id: 'conv-stats-1',
            timestamp: new Date('2024-01-04T12:00:00Z'),
            participants: [{ id: 'user1', name: 'User', role: 'author' }],
            messages: [
              {
                id: 'msg1',
                content: 'Consistent pattern of feeling undervalued',
                authorId: 'user1',
                timestamp: new Date(),
              },
            ],
            moodAnalysis: {
              score: 4.5,
              descriptors: ['undervalued'],
              confidence: 0.8,
              factors: [],
            },
          },
          {
            id: 'conv-stats-2',
            timestamp: new Date('2024-01-04T13:00:00Z'),
            participants: [{ id: 'user2', name: 'User2', role: 'author' }],
            messages: [
              {
                id: 'msg2',
                content: 'Always seems like I am not enough',
                authorId: 'user2',
                timestamp: new Date(),
              },
            ],
            moodAnalysis: {
              score: 4.8,
              descriptors: ['inadequate'],
              confidence: 0.75,
              factors: [],
            },
          },
        ]

        const humanValidations: HumanValidationRecord[] = [
          {
            conversationId: 'conv-stats-1',
            validatorId: 'expert-stats',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 12,
              specializations: ['self_worth_issues'],
            },
            humanMoodScore: 2.1,
            confidence: 0.9,
            rationale: 'Deep-seated self-worth issues with persistent patterns',
            emotionalFactors: [
              'self_worth_deficit',
              'persistent_patterns',
              'core_beliefs',
            ],
            timestamp: new Date(),
            validationSession: 'statistical-analysis',
          },
          {
            conversationId: 'conv-stats-2',
            validatorId: 'expert-stats',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 12,
              specializations: ['self_worth_issues'],
            },
            humanMoodScore: 2.3,
            confidence: 0.85,
            rationale:
              'Pervasive inadequacy feelings indicating significant distress',
            emotionalFactors: [
              'inadequacy_feelings',
              'pervasive_distress',
              'negative_self_concept',
            ],
            timestamp: new Date(),
            validationSession: 'statistical-analysis',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          testConversations,
          humanValidations,
        )

        // Should provide comprehensive statistical evidence
        expect(validationResult.biasAnalysis.statisticalEvidence).toBeDefined()
        expect(
          validationResult.biasAnalysis.statisticalEvidence.testStatistic,
        ).toBeGreaterThan(1.0)
        expect(
          validationResult.biasAnalysis.statisticalEvidence.pValue,
        ).toBeLessThan(0.05)
        expect(
          validationResult.biasAnalysis.statisticalEvidence.effectSize,
        ).toBeGreaterThan(0.5)
        expect(
          validationResult.biasAnalysis.detectionConfidence,
        ).toBeGreaterThan(0.85)
      })
    })
  })

  describe('Bias Analysis with Pattern Identification and Correction (Task 4.4)', () => {
    describe('Pattern Identification', () => {
      it('should identify specific bias patterns beyond general emotional complexity', async () => {
        const testConversations: (ConversationData & {
          moodAnalysis: MoodAnalysisResult
        })[] = [
          {
            id: 'conv-patterns-1',
            timestamp: new Date('2024-01-05T10:00:00Z'),
            participants: [
              {
                id: 'user1',
                name: 'Sarah',
                role: 'author',
                messageCount: 2,
                emotionalExpressions: ['anxious'],
              },
            ],
            messages: [
              {
                id: 'msg1',
                content:
                  "I'm just a bit worried about the meeting, nothing major",
                authorId: 'user1',
                timestamp: new Date(),
              },
            ],
            moodAnalysis: createMoodAnalysisResult({
              score: 5.2,
              confidence: 0.7,
              primaryEmotions: ['worry'],
              emotionalIntensity: 0.4,
              sentiment: 'mixed',
            }),
          },
          {
            id: 'conv-patterns-2',
            timestamp: new Date('2024-01-05T11:00:00Z'),
            participants: [
              {
                id: 'user2',
                name: 'Alex',
                role: 'author',
                messageCount: 2,
                emotionalExpressions: ['dismissive'],
              },
            ],
            messages: [
              {
                id: 'msg2',
                content: "It's fine, I'm fine, everything is totally fine",
                authorId: 'user2',
                timestamp: new Date(),
              },
            ],
            moodAnalysis: createMoodAnalysisResult({
              score: 6.0,
              confidence: 0.6,
              primaryEmotions: ['neutral'],
              emotionalIntensity: 0.3,
              sentiment: 'neutral',
            }),
          },
          {
            id: 'conv-patterns-3',
            timestamp: new Date('2024-01-05T12:00:00Z'),
            participants: [
              {
                id: 'user3',
                name: 'Jordan',
                role: 'author',
                messageCount: 3,
                emotionalExpressions: ['sarcastic'],
              },
            ],
            messages: [
              {
                id: 'msg3',
                content: 'Oh great, another wonderful day at this amazing job',
                authorId: 'user3',
                timestamp: new Date(),
              },
            ],
            moodAnalysis: createMoodAnalysisResult({
              score: 5.8,
              confidence: 0.5,
              primaryEmotions: ['neutral'],
              emotionalIntensity: 0.2,
              sentiment: 'neutral',
            }),
          },
        ]

        const humanValidations: HumanValidationRecord[] = [
          {
            conversationId: 'conv-patterns-1',
            validatorId: 'expert-patterns',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 15,
              specializations: ['anxiety_disorders', 'emotional_suppression'],
            },
            humanMoodScore: 3.1,
            confidence: 0.9,
            rationale:
              'Minimization language "just a bit" and "nothing major" indicates anxiety suppression',
            emotionalFactors: [
              'anxiety_minimization',
              'emotional_suppression',
              'worry_dismissal',
            ],
            timestamp: new Date(),
            validationSession: 'pattern-analysis',
          },
          {
            conversationId: 'conv-patterns-2',
            validatorId: 'expert-patterns',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 15,
              specializations: ['anxiety_disorders', 'emotional_suppression'],
            },
            humanMoodScore: 2.8,
            confidence: 0.95,
            rationale:
              'Repetitive "fine" suggests emotional overwhelm and denial patterns',
            emotionalFactors: [
              'emotional_denial',
              'overwhelm_masking',
              'repetitive_reassurance',
            ],
            timestamp: new Date(),
            validationSession: 'pattern-analysis',
          },
          {
            conversationId: 'conv-patterns-3',
            validatorId: 'expert-patterns',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 15,
              specializations: ['anxiety_disorders', 'emotional_suppression'],
            },
            humanMoodScore: 2.5,
            confidence: 0.88,
            rationale:
              'Sarcasm masks workplace dissatisfaction and frustration',
            emotionalFactors: [
              'workplace_dissatisfaction',
              'sarcasm_masking',
              'frustration_displacement',
            ],
            timestamp: new Date(),
            validationSession: 'pattern-analysis',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          testConversations,
          humanValidations,
        )

        // Should identify specific bias patterns
        expect(validationResult.biasAnalysis.biasDetected).toBe(true)
        expect(validationResult.biasAnalysis.biasTypes).toHaveLength(3)

        const biasTypes = validationResult.biasAnalysis.biasTypes
        expect(biasTypes.some((b) => b.type === 'emotional_minimization')).toBe(
          true,
        )
        expect(
          biasTypes.some((b) => b.type === 'sarcasm_detection_failure'),
        ).toBe(true)
        expect(
          biasTypes.some((b) => b.type === 'repetitive_pattern_blindness'),
        ).toBe(true)

        // Each bias type should have specific correction recommendations
        biasTypes.forEach((bias) => {
          expect(bias.correctionRecommendation).toBeDefined()
          expect(bias.correctionRecommendation.length).toBeGreaterThan(20)
          expect(bias.affectedSamples).toBeGreaterThan(0)
        })
      })

      it('should provide detailed correction strategies for each identified bias pattern', async () => {
        const testConversations: (ConversationData & {
          moodAnalysis: MoodAnalysisResult
        })[] = [
          {
            id: 'conv-correction-1',
            timestamp: new Date('2024-01-05T14:00:00Z'),
            participants: [
              {
                id: 'user1',
                name: 'Casey',
                role: 'author',
                messageCount: 3,
                emotionalExpressions: ['conflicted'],
              },
            ],
            messages: [
              {
                id: 'msg1',
                content:
                  'I should be grateful but I feel sad about the situation',
                authorId: 'user1',
                timestamp: new Date(),
              },
            ],
            moodAnalysis: createMoodAnalysisResult({
              score: 6.2,
              confidence: 0.65,
              primaryEmotions: ['gratitude'],
              emotionalIntensity: 0.5,
              sentiment: 'mixed',
            }),
          },
        ]

        const humanValidations: HumanValidationRecord[] = [
          {
            conversationId: 'conv-correction-1',
            validatorId: 'expert-correction-detailed',
            validatorCredentials: {
              title: 'Licensed Therapist',
              yearsExperience: 12,
              specializations: ['emotional_complexity', 'cognitive_patterns'],
            },
            humanMoodScore: 4.1,
            confidence: 0.92,
            rationale:
              'Mixed emotions with guilt overlay - algorithm missed emotional conflict complexity',
            emotionalFactors: [
              'emotional_conflict',
              'guilt_overlay',
              'gratitude_pressure',
            ],
            timestamp: new Date(),
            validationSession: 'detailed-correction',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          testConversations,
          humanValidations,
        )

        // Should provide detailed correction strategies
        expect(validationResult.biasAnalysis.biasTypes).toHaveLength(1)
        const bias = validationResult.biasAnalysis.biasTypes[0]

        expect(bias.type).toBe('mixed_emotion_oversimplification')
        expect(bias.severity).toBe('medium')
        expect(bias.correctionRecommendation).toContain('mixed-emotion')
        expect(bias.correctionRecommendation).toContain('conflict')
        expect(bias.affectedSamples).toBe(1)

        // Should provide specific implementation guidance
        expect(
          validationResult.recommendations.some(
            (r) =>
              r.category === 'algorithm_enhancement' &&
              r.description.includes('mixed-emotion'),
          ),
        ).toBe(true)
      })

      it('should calculate bias confidence based on pattern consistency and statistical significance', async () => {
        const testConversations: (ConversationData & {
          moodAnalysis: MoodAnalysisResult
        })[] = Array.from({ length: 5 }, (_, i) => ({
          id: `conv-confidence-${i + 1}`,
          timestamp: new Date('2024-01-05T16:00:00Z'),
          participants: [
            {
              id: `user${i + 1}`,
              name: `User${i + 1}`,
              role: 'author',
              messageCount: 2,
              emotionalExpressions: ['understated'],
            },
          ],
          messages: [
            {
              id: `msg${i + 1}`,
              content: 'Things could be better I suppose',
              authorId: `user${i + 1}`,
              timestamp: new Date(),
            },
          ],
          moodAnalysis: createMoodAnalysisResult({
            score: 5.5 + i * 0.1,
            confidence: 0.7,
            primaryEmotions: ['neutral'],
            emotionalIntensity: 0.4,
            sentiment: 'neutral',
          }),
        }))

        const humanValidations: HumanValidationRecord[] = testConversations.map(
          (conv, i) => ({
            conversationId: conv.id,
            validatorId: 'expert-confidence',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 10,
              specializations: ['mood_assessment'],
            },
            humanMoodScore: 3.2 + i * 0.05, // Consistent under-estimation by algorithm
            confidence: 0.85,
            rationale: 'Understated language indicates depression markers',
            emotionalFactors: [
              'depression_markers',
              'understated_expression',
              'emotional_flattening',
            ],
            timestamp: new Date(),
            validationSession: 'confidence-testing',
          }),
        )

        const validationResult = await validationFramework.validateMoodScore(
          testConversations,
          humanValidations,
        )

        // Should show high confidence due to consistent pattern
        expect(validationResult.biasAnalysis.biasDetected).toBe(true)
        expect(
          validationResult.biasAnalysis.detectionConfidence,
        ).toBeGreaterThan(0.9)
        expect(
          validationResult.biasAnalysis.statisticalEvidence.pValue,
        ).toBeLessThan(0.01)
        expect(
          validationResult.biasAnalysis.statisticalEvidence.effectSize,
        ).toBeGreaterThan(1.0)
      })
    })

    describe('Correction Recommendation Implementation', () => {
      it('should provide actionable algorithm enhancement recommendations', async () => {
        const testConversations: (ConversationData & {
          moodAnalysis: MoodAnalysisResult
        })[] = [
          {
            id: 'conv-actionable-1',
            timestamp: new Date('2024-01-05T18:00:00Z'),
            participants: [
              {
                id: 'user1',
                name: 'Pat',
                role: 'author',
                messageCount: 2,
                emotionalExpressions: ['defensive'],
              },
            ],
            messages: [
              {
                id: 'msg1',
                content: "I don't need help, I can handle this myself",
                authorId: 'user1',
                timestamp: new Date(),
              },
            ],
            moodAnalysis: createMoodAnalysisResult({
              score: 6.8,
              confidence: 0.75,
              primaryEmotions: ['independence'],
              emotionalIntensity: 0.6,
              sentiment: 'neutral',
            }),
          },
        ]

        const humanValidations: HumanValidationRecord[] = [
          {
            conversationId: 'conv-actionable-1',
            validatorId: 'expert-actionable',
            validatorCredentials: {
              title: 'Clinical Social Worker',
              yearsExperience: 14,
              specializations: ['defense_mechanisms', 'resistance_patterns'],
            },
            humanMoodScore: 3.5,
            confidence: 0.9,
            rationale:
              'Defensive language indicates emotional overwhelm and isolation',
            emotionalFactors: [
              'defensive_mechanism',
              'emotional_overwhelm',
              'isolation_tendency',
            ],
            timestamp: new Date(),
            validationSession: 'actionable-recommendations',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          testConversations,
          humanValidations,
        )

        // Should provide actionable recommendations
        expect(validationResult.recommendations).toHaveLength(3)

        const algorithmRec = validationResult.recommendations.find(
          (r) => r.category === 'algorithm_enhancement',
        )
        expect(algorithmRec).toBeDefined()
        expect(algorithmRec!.description).toContain(
          'defensive language detection',
        )
        expect(algorithmRec!.expectedImpact).toBeDefined()
        expect(algorithmRec!.priority).toBe('high')

        const trainingRec = validationResult.recommendations.find(
          (r) => r.category === 'training_data_enhancement',
        )
        expect(trainingRec).toBeDefined()
        expect(trainingRec!.description).toContain('defense mechanism examples')

        const validationRec = validationResult.recommendations.find(
          (r) => r.category === 'validation_process_improvement',
        )
        expect(validationRec).toBeDefined()
        expect(validationRec!.description).toContain(
          'defensive pattern detection',
        )
      })
    })
  })

  describe('Algorithm Calibration Based on Validation Feedback (Task 4.5)', () => {
    describe('Calibration System Implementation', () => {
      it('should adjust algorithm parameters based on systematic validation feedback', async () => {
        // Test data showing consistent over-estimation bias that needs calibration
        const testConversations = [
          {
            id: 'conv-calibration-1',
            timestamp: new Date(),
            messages: [
              {
                id: 'msg-1',
                content: 'I feel great today! Everything is going perfectly.',
                timestamp: new Date(),
                authorId: 'user-1',
              },
            ],
            participants: [{ id: 'user-1', name: 'User One', role: 'author' as const }],
            moodAnalysis: {
              score: 8.5, // Algorithm consistently over-estimates
              descriptors: ['positive', 'confident'],
              confidence: 0.9,
              factors: [
                {
                  type: 'sentiment_analysis',
                  weight: 0.35,
                  description: 'Strong positive sentiment detected',
                  evidence: ['positive_language']
                }
              ],
            },
          },
          {
            id: 'conv-calibration-2',
            timestamp: new Date(),
            messages: [
              {
                id: 'msg-2',
                content: 'Today was amazing! I accomplished so much.',
                timestamp: new Date(),
                authorId: 'user-2',
              },
            ],
            participants: [{ id: 'user-2', name: 'User Two', role: 'author' as const }],
            moodAnalysis: {
              score: 9.2, // Algorithm over-estimates again
              descriptors: ['positive', 'accomplished'],
              confidence: 0.85,
              factors: [
                {
                  type: 'sentiment_analysis',
                  weight: 0.35,
                  description: 'Achievement-focused positive sentiment',
                  evidence: ['achievement_language']
                }
              ],
            },
          },
          {
            id: 'conv-calibration-3',
            timestamp: new Date(),
            messages: [
              {
                id: 'msg-3',
                content: 'I am really happy with how things are turning out.',
                timestamp: new Date(),
                authorId: 'user-3',
              },
            ],
            participants: [{ id: 'user-3', name: 'User Three' }],
            moodAnalysis: {
              score: 8.8, // Consistent over-estimation pattern
              descriptors: ['positive'],
              confidence: 0.88,
              factors: [
                {
                  type: 'sentiment_analysis',
                  weight: 0.35,
                  description: 'Detected positive sentiment',
                  evidence: ['satisfaction_language']
                }
              ],
            },
          },
        ]

        const humanValidations = [
          {
            id: 'val-calibration-1',
            conversationId: 'conv-calibration-1',
            validatorId: 'validator-cal-1',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 12,
              specializations: ['mood_assessment', 'positive_psychology'],
            },
            humanMoodScore: 7.0, // Humans rate lower consistently
            confidence: 0.9,
            rationale: 'Positive but not as euphoric as algorithm suggests',
            emotionalFactors: ['moderate_positivity', 'realistic_optimism'],
            timestamp: new Date(),
            validationSession: 'calibration-systematic-1',
          },
          {
            id: 'val-calibration-2',
            conversationId: 'conv-calibration-2',
            validatorId: 'validator-cal-2',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 8,
              specializations: ['emotional_assessment', 'cognitive_evaluation'],
            },
            humanMoodScore: 7.5, // Human validation lower than algorithm
            confidence: 0.85,
            rationale: 'Achievement satisfaction but not extreme happiness',
            emotionalFactors: ['accomplishment_satisfaction', 'controlled_positivity'],
            timestamp: new Date(),
            validationSession: 'calibration-systematic-2',
          },
          {
            id: 'val-calibration-3',
            conversationId: 'conv-calibration-3',
            validatorId: 'validator-cal-3',
            validatorCredentials: {
              title: 'Licensed Therapist',
              yearsExperience: 15,
              specializations: ['emotional_regulation', 'positive_psychology'],
            },
            humanMoodScore: 7.2, // Pattern of human scores being lower
            confidence: 0.9,
            rationale: 'Content satisfaction but not extreme joy',
            emotionalFactors: ['contentment', 'measured_happiness'],
            timestamp: new Date(),
            validationSession: 'calibration-systematic-3',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          testConversations,
          humanValidations,
        )

        // Should detect systematic bias that requires calibration
        expect(validationResult.biasAnalysis.biasDetected).toBe(true)
        expect(validationResult.discrepancyAnalysis.systematicBias).toBe('algorithmic_over_estimation')
        
        // Mean difference should be significant (algorithm consistently higher)
        const algorithmicScores = testConversations.map(c => c.moodAnalysis.score)
        const humanScores = humanValidations.map(v => v.humanMoodScore)
        const meanDifference = algorithmicScores.reduce((sum, score, i) => sum + (score - humanScores[i]), 0) / algorithmicScores.length
        
        expect(meanDifference).toBeGreaterThan(1.0) // Systematic over-estimation by >1 point
        expect(validationResult.overallMetrics.meanAbsoluteError).toBeGreaterThan(1.0)
        
        // Should provide calibration recommendations
        const calibrationRecs = validationResult.recommendations.filter(r => 
          r.description.toLowerCase().includes('calibrat') || 
          r.description.toLowerCase().includes('adjust') ||
          r.category === 'systematic_bias_correction'
        )
        expect(calibrationRecs.length).toBeGreaterThan(0)
      })

      it('should track improvement trends after calibration adjustments', async () => {
        // Simulate before calibration validation results - multiple data points for meaningful correlation
        const beforeCalibrationConversations = [
          {
            id: 'conv-trend-1',
            timestamp: new Date(),
            messages: [
              {
                id: 'msg-trend-1',
                content: 'I am doing well today, feeling positive about things.',
                timestamp: new Date(),
                authorId: 'user-trend-1',
              },
            ],
            participants: [{ id: 'user-trend-1', name: 'Trend User One' }],
            moodAnalysis: {
              score: 8.2, // Before calibration - over-estimation
              descriptors: ['positive'],
              confidence: 0.85,
              factors: [
                {
                  type: 'sentiment_analysis',
                  weight: 0.35,
                  description: 'Detected positive sentiment',
                  evidence: ['positive_expression']
                }
              ],
            },
          },
          {
            id: 'conv-trend-1b',
            timestamp: new Date(),
            messages: [
              {
                id: 'msg-trend-1b',
                content: 'Today has been pretty good overall.',
                timestamp: new Date(),
                authorId: 'user-trend-1b',
              },
            ],
            participants: [{ id: 'user-trend-1b', name: 'Trend User 1B' }],
            moodAnalysis: {
              score: 7.8, // Before calibration - over-estimation pattern
              descriptors: ['positive'],
              confidence: 0.8,
              factors: [
                {
                  type: 'sentiment_analysis',
                  weight: 0.35,
                  description: 'Detected positive sentiment',
                  evidence: ['positive_expression']
                }
              ],
            },
          },
        ]

        const beforeHumanValidations = [
          {
            id: 'val-trend-before-1',
            conversationId: 'conv-trend-1',
            validatorId: 'validator-trend',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 10,
              specializations: ['mood_assessment'],
            },
            humanMoodScore: 6.8, // Human assessment lower
            confidence: 0.9,
            rationale: 'Moderate positivity, not euphoric',
            emotionalFactors: ['moderate_positivity'],
            timestamp: new Date('2024-01-01'),
            validationSession: 'trend-before-1',
          },
          {
            id: 'val-trend-before-2',
            conversationId: 'conv-trend-1b',
            validatorId: 'validator-trend',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 10,
              specializations: ['mood_assessment'],
            },
            humanMoodScore: 6.2, // Human assessment lower - systematic pattern
            confidence: 0.85,
            rationale: 'Pleasant but not elevated mood',
            emotionalFactors: ['moderate_positivity'],
            timestamp: new Date('2024-01-01'),
            validationSession: 'trend-before-2',
          },
        ]

        // After calibration - improved accuracy with multiple data points
        const afterCalibrationConversations = [
          {
            id: 'conv-trend-2',
            timestamp: new Date(),
            messages: [
              {
                id: 'msg-trend-2',
                content: 'I am doing well today, feeling positive about things.',
                timestamp: new Date(),
                authorId: 'user-trend-2',
              },
            ],
            participants: [{ id: 'user-trend-2', name: 'Trend User Two' }],
            moodAnalysis: {
              score: 7.0, // After calibration - better accuracy
              descriptors: ['positive'],
              confidence: 0.87,
              factors: [
                {
                  type: 'sentiment_analysis',
                  weight: 0.35,
                  description: 'Detected positive sentiment',
                  evidence: ['positive_expression']
                }
              ],
            },
          },
          {
            id: 'conv-trend-2b',
            timestamp: new Date(),
            messages: [
              {
                id: 'msg-trend-2b',
                content: 'Today has been pretty good overall.',
                timestamp: new Date(),
                authorId: 'user-trend-2b',
              },
            ],
            participants: [{ id: 'user-trend-2b', name: 'Trend User 2B' }],
            moodAnalysis: {
              score: 6.4, // After calibration - much closer to human assessment
              descriptors: ['positive'],
              confidence: 0.82,
              factors: [
                {
                  type: 'sentiment_analysis',
                  weight: 0.35,
                  description: 'Detected positive sentiment',
                  evidence: ['positive_expression']
                }
              ],
            },
          },
        ]

        const afterHumanValidations = [
          {
            id: 'val-trend-after-1',
            conversationId: 'conv-trend-2',
            validatorId: 'validator-trend',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 10,
              specializations: ['mood_assessment'],
            },
            humanMoodScore: 6.9, // Much closer to algorithm after calibration
            confidence: 0.9,
            rationale: 'Appropriate moderate positivity assessment',
            emotionalFactors: ['moderate_positivity'],
            timestamp: new Date('2024-01-15'),
            validationSession: 'trend-after-1',
          },
          {
            id: 'val-trend-after-2',
            conversationId: 'conv-trend-2b',
            validatorId: 'validator-trend',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 10,
              specializations: ['mood_assessment'],
            },
            humanMoodScore: 6.3, // Very close to calibrated algorithm
            confidence: 0.88,
            rationale: 'Good match with calibrated assessment',
            emotionalFactors: ['moderate_positivity'],
            timestamp: new Date('2024-01-15'),
            validationSession: 'trend-after-2',
          },
        ]

        const beforeResult = await validationFramework.validateMoodScore(
          beforeCalibrationConversations,
          beforeHumanValidations,
        )

        const afterResult = await validationFramework.validateMoodScore(
          afterCalibrationConversations,
          afterHumanValidations,
        )

        // Should show improvement in accuracy metrics after calibration
        expect(afterResult.overallMetrics.meanAbsoluteError).toBeLessThan(
          beforeResult.overallMetrics.meanAbsoluteError,
        )
        // Both correlations are very high due to consistent patterns, but after should be at least as good
        expect(afterResult.overallMetrics.pearsonCorrelation).toBeGreaterThanOrEqual(
          beforeResult.overallMetrics.pearsonCorrelation - 0.01, // Allow small numerical precision differences
        )
        
        // Before calibration should show systematic bias
        expect(beforeResult.discrepancyAnalysis.systematicBias).toBe('algorithmic_over_estimation')
        
        // After calibration should show reduced bias
        expect(afterResult.discrepancyAnalysis.systematicBias).toBe('no_systematic_bias')
      })

      it('should provide specific parameter adjustment recommendations based on bias patterns', async () => {
        // Test data showing mixed emotion oversimplification bias
        const testConversations = [
          {
            id: 'conv-param-1',
            timestamp: new Date(),
            messages: [
              {
                id: 'msg-param-1',
                content: 'I am happy about the promotion but worried about the increased responsibility and stress.',
                timestamp: new Date(),
                authorId: 'user-param-1',
              },
            ],
            participants: [{ id: 'user-param-1', name: 'Param User One' }],
            moodAnalysis: {
              score: 7.5, // Algorithm oversimplifies mixed emotions as primarily positive
              descriptors: ['mixed'],
              confidence: 0.7,
              factors: [
                {
                  type: 'sentiment_analysis',
                  weight: 0.35,
                  description: 'Detected mixed sentiment',
                  evidence: ['achievement_language', 'anxiety_indicators']
                }
              ],
            },
          },
        ]

        const humanValidations = [
          {
            id: 'val-param-1',
            conversationId: 'conv-param-1',
            validatorId: 'validator-param',
            validatorCredentials: {
              title: 'Clinical Social Worker',
              yearsExperience: 12,
              specializations: ['mixed_emotions', 'workplace_psychology'],
            },
            humanMoodScore: 5.8, // Human recognizes the emotional conflict more accurately
            confidence: 0.9,
            rationale: 'Mixed emotions with significant anxiety component not fully captured',
            emotionalFactors: ['mixed_emotion_complexity', 'achievement_anxiety', 'responsibility_fear'],
            timestamp: new Date(),
            validationSession: 'parameter-adjustment',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          testConversations,
          humanValidations,
        )

        // Should identify mixed emotion oversimplification bias
        expect(validationResult.biasAnalysis.biasDetected).toBe(true)
        expect(validationResult.biasAnalysis.biasTypes.some(bias => 
          bias.type === 'mixed_emotion_oversimplification'
        )).toBe(true)

        // Should provide specific parameter adjustment recommendations
        const parameterRecs = validationResult.recommendations.filter(r => 
          r.description.toLowerCase().includes('mixed-emotion') ||
          r.description.toLowerCase().includes('conflict detection') ||
          r.category === 'algorithm_enhancement'
        )
        expect(parameterRecs.length).toBeGreaterThan(0)
        
        const algorithmRec = parameterRecs.find(r => r.category === 'algorithm_enhancement')
        expect(algorithmRec).toBeDefined()
        expect(algorithmRec!.description).toContain('mixed-emotion processing')
        expect(algorithmRec!.expectedImpact).toContain('medium severity bias')
      })

      it('should calculate calibration confidence based on validation data quality and quantity', async () => {
        // High quality, high quantity validation data
        const highQualityConversations = Array.from({ length: 10 }, (_, i) => ({
          id: `conv-quality-${i + 1}`,
          messages: [
            {
              id: `msg-quality-${i + 1}`,
              content: `Test message ${i + 1} with varying emotional content.`,
              timestamp: new Date(),
              authorId: `user-quality-${i + 1}`,
            },
          ],
          participants: [{ id: `user-quality-${i + 1}`, name: `Quality User ${i + 1}` }],
          moodAnalysis: {
              score: 5.0 + i * 0.5, // Varied scores
              descriptors: ['neutral'],
              confidence: 0.8,
              factors: [
                {
                  type: 'sentiment_analysis',
                  weight: 0.35,
                  description: 'Detected neutral sentiment',
                  evidence: ['neutral_language']
                }
              ],
            },
        }))

        const highQualityValidations = Array.from({ length: 10 }, (_, i) => ({
          id: `val-quality-${i + 1}`,
          conversationId: `conv-quality-${i + 1}`,
          validatorId: `validator-quality-${i + 1}`,
          validatorCredentials: {
            title: 'Senior Clinical Psychologist',
            yearsExperience: 15 + i, // High experience validators
            specializations: ['mood_assessment', 'emotional_analysis'],
          },
          humanMoodScore: 5.2 + i * 0.48, // Close to algorithmic scores for high agreement
          confidence: 0.95, // High confidence validations
          rationale: `Detailed assessment ${i + 1} with comprehensive analysis`,
          emotionalFactors: ['neutral_expression', 'stable_mood'],
          timestamp: new Date(),
          validationSession: `high-quality-${i + 1}`,
        }))

        const highQualityResult = await validationFramework.validateMoodScore(
          highQualityConversations,
          highQualityValidations,
        )

        // Low quality, low quantity validation data with multiple disagreeing validators
        const lowQualityConversations = [
          {
            id: 'conv-low-quality-1',
            timestamp: new Date(),
            messages: [
              {
                id: 'msg-low-1',
                content: 'Test message with ambiguous content.',
                timestamp: new Date(),
                authorId: 'user-low-1',
              },
            ],
            participants: [{ id: 'user-low-1', name: 'Low Quality User' }],
            moodAnalysis: createMoodAnalysisResult({
              score: 6.0,
              confidence: 0.5, // Low algorithm confidence
              sentiment: 'neutral',
              primaryEmotions: ['neutral'],
              emotionalIntensity: 0.5,
            }),
          },
        ]

        const lowQualityValidations = [
          {
            id: 'val-low-quality-1a',
            conversationId: 'conv-low-quality-1',
            validatorId: 'validator-low-1',
            validatorCredentials: {
              title: 'Junior Therapist',
              yearsExperience: 2, // Lower experience
              specializations: ['general_counseling'],
            },
            humanMoodScore: 4.0, // Large discrepancy with algorithm
            confidence: 0.6, // Lower confidence
            rationale: 'Uncertain assessment - seems negative',
            emotionalFactors: ['unclear_expression'],
            timestamp: new Date(),
            validationSession: 'low-quality-1',
          },
          {
            id: 'val-low-quality-1b',
            conversationId: 'conv-low-quality-1',
            validatorId: 'validator-low-2',
            validatorCredentials: {
              title: 'Trainee Counselor',
              yearsExperience: 1, // Very low experience
              specializations: ['general_counseling'],
            },
            humanMoodScore: 8.0, // Major disagreement with first validator (4.0 vs 8.0)
            confidence: 0.5, // Lower confidence
            rationale: 'Uncertain assessment - seems positive',
            emotionalFactors: ['positive_indicators'],
            timestamp: new Date(),
            validationSession: 'low-quality-2',
          },
        ]

        const lowQualityResult = await validationFramework.validateMoodScore(
          lowQualityConversations,
          lowQualityValidations,
        )

        // High quality data should produce higher calibration confidence
        expect(highQualityResult.overallMetrics.pearsonCorrelation).toBeGreaterThan(
          lowQualityResult.overallMetrics.pearsonCorrelation,
        )
        expect(highQualityResult.overallMetrics.sampleSize).toBeGreaterThan(
          lowQualityResult.overallMetrics.sampleSize,
        )
        expect(highQualityResult.validatorConsistency.consensusLevel).toBe('high')
        expect(lowQualityResult.validatorConsistency.consensusLevel).toBe('low')
        
        // Should reflect data quality in statistical significance
        expect(highQualityResult.overallMetrics.statisticalSignificance.isSignificant).toBe(true)
        expect(highQualityResult.overallMetrics.statisticalSignificance.pValue).toBeLessThan(0.05)
      })
    })

    describe('Parameter Adjustment Implementation', () => {
      it('should generate weighted scoring parameter adjustments based on systematic biases', async () => {
        // Test data showing sentiment analysis consistently over-weighted
        const testConversations = [
          {
            id: 'conv-weight-1',
            timestamp: new Date(),
            messages: [
              {
                id: 'msg-weight-1',
                content: 'I feel fantastic today! But I have been struggling with some underlying issues.',
                timestamp: new Date(),
                authorId: 'user-weight-1',
              },
            ],
            participants: [{ id: 'user-weight-1', name: 'Weight User One' }],
            moodAnalysis: {
              score: 8.2, // High score due to "fantastic" overwhelming "struggling"
              descriptors: ['mixed'],
              confidence: 0.8,
              factors: [
                {
                  type: 'sentiment_analysis',
                  weight: 0.35,
                  description: 'Detected mixed sentiment',
                  evidence: ['positive_language', 'struggle_indicators']
                }
              ],
            },
          },
          {
            id: 'conv-weight-2',
            timestamp: new Date(),
            messages: [
              {
                id: 'msg-weight-2',
                content: 'Amazing day! Though I keep thinking about my problems.',
                timestamp: new Date(),
                authorId: 'user-weight-2',
              },
            ],
            participants: [{ id: 'user-weight-2', name: 'Weight User Two' }],
            moodAnalysis: {
              score: 7.8, // Again, positive words dominate
              descriptors: ['mixed'],
              confidence: 0.75,
              factors: [
                {
                  type: 'sentiment_analysis',
                  weight: 0.35,
                  description: 'Detected mixed sentiment',
                  evidence: ['enthusiasm_language', 'worry_indicators']
                }
              ],
            },
          },
        ]

        const humanValidations = [
          {
            id: 'val-weight-1',
            conversationId: 'conv-weight-1',
            validatorId: 'validator-weight-1',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 18,
              specializations: ['mixed_emotions', 'sentiment_analysis'],
            },
            humanMoodScore: 5.5, // Human recognizes underlying struggle better
            confidence: 0.9,
            rationale: 'Positive surface language masks significant underlying concerns',
            emotionalFactors: ['surface_positivity', 'underlying_distress', 'emotional_masking'],
            timestamp: new Date(),
            validationSession: 'weighted-adjustment-1',
          },
          {
            id: 'val-weight-2',
            conversationId: 'conv-weight-2',
            validatorId: 'validator-weight-2',
            validatorCredentials: {
              title: 'Licensed Clinical Social Worker',
              yearsExperience: 14,
              specializations: ['emotional_complexity', 'psychological_indicators'],
            },
            humanMoodScore: 5.8, // Similar pattern - human sees through surface positivity
            confidence: 0.85,
            rationale: 'Enthusiasm conflicts with persistent worry patterns',
            emotionalFactors: ['conflicted_emotions', 'persistent_worry', 'forced_positivity'],
            timestamp: new Date(),
            validationSession: 'weighted-adjustment-2',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          testConversations,
          humanValidations,
        )

        // Should detect systematic over-estimation bias
        expect(validationResult.biasAnalysis.biasDetected).toBe(true)
        expect(validationResult.discrepancyAnalysis.systematicBias).toBe('algorithmic_over_estimation')

        // Should identify the need for sentiment weighting adjustment
        const weightingRecs = validationResult.recommendations.filter(r =>
          r.description.toLowerCase().includes('weight') ||
          r.description.toLowerCase().includes('sentiment') ||
          r.description.toLowerCase().includes('mixed-emotion')
        )
        expect(weightingRecs.length).toBeGreaterThan(0)

        // Mean absolute error should be significant (>2.0 points difference)
        expect(validationResult.overallMetrics.meanAbsoluteError).toBeGreaterThan(2.0)
        
        // Should suggest reducing sentiment analysis weight or increasing psychological indicators weight
        const algorithmRec = validationResult.recommendations.find(r => 
          r.category === 'algorithm_enhancement'
        )
        expect(algorithmRec).toBeDefined()
        expect(algorithmRec!.description.toLowerCase()).toMatch(
          /mixed-emotion|conflict|psychological|sentiment/
        )
      })

      it('should recommend confidence threshold adjustments based on uncertainty patterns', async () => {
        // Test scenarios where algorithm is overconfident in uncertain situations
        const testConversations = [
          {
            id: 'conv-confidence-1',
            timestamp: new Date(),
            messages: [
              {
                id: 'msg-conf-1',
                content: 'I guess I am okay... not sure really. Maybe things are fine.',
                timestamp: new Date(),
                authorId: 'user-conf-1',
              },
            ],
            participants: [{ id: 'user-conf-1', name: 'Confidence User One', role: 'author' as const }],
            moodAnalysis: createMoodAnalysisResult({
              score: 6.5, // Algorithm confident despite uncertain language
              confidence: 0.85, // High confidence despite uncertainty markers
              sentiment: 'neutral',
              primaryEmotions: ['neutral'],
              emotionalIntensity: 0.5,
            }),
          },
          {
            id: 'conv-confidence-2',
            timestamp: new Date(),
            messages: [
              {
                id: 'msg-conf-2',
                content: 'Things might be getting better, I think... hard to tell.',
                timestamp: new Date(),
                authorId: 'user-conf-2',
              },
            ],
            participants: [{ id: 'user-conf-2', name: 'Confidence User Two', role: 'author' as const }],
            moodAnalysis: createMoodAnalysisResult({
              score: 7.0, // Another overconfident assessment
              confidence: 0.8, // High confidence with uncertain content
              sentiment: 'neutral',
              primaryEmotions: ['neutral'],
              emotionalIntensity: 0.5,
            }),
          },
        ]

        const humanValidations = [
          {
            id: 'val-conf-1',
            conversationId: 'conv-confidence-1',
            validatorId: 'validator-conf-1',
            validatorCredentials: {
              title: 'Clinical Psychologist',
              yearsExperience: 16,
              specializations: ['uncertainty_assessment', 'confidence_calibration'],
            },
            humanMoodScore: 5.0, // Human more conservative with uncertain content
            confidence: 0.4, // Human appropriately low confidence
            rationale: 'Language indicates significant uncertainty and ambivalence',
            emotionalFactors: ['emotional_uncertainty', 'ambivalent_expression', 'low_self_awareness'],
            timestamp: new Date(),
            validationSession: 'confidence-calibration-1',
          },
          {
            id: 'val-conf-2',
            conversationId: 'conv-confidence-2',
            validatorId: 'validator-conf-2',
            validatorCredentials: {
              title: 'Licensed Therapist',
              yearsExperience: 12,
              specializations: ['emotional_ambiguity', 'assessment_confidence'],
            },
            humanMoodScore: 5.2, // Human conservative assessment
            confidence: 0.5, // Appropriately uncertain
            rationale: 'Tentative language suggests emotional confusion and uncertainty',
            emotionalFactors: ['tentative_optimism', 'emotional_confusion', 'self_doubt'],
            timestamp: new Date(),
            validationSession: 'confidence-calibration-2',
          },
        ]

        const validationResult = await validationFramework.validateMoodScore(
          testConversations,
          humanValidations,
        )

        // Should identify confidence calibration issues
        expect(validationResult.biasAnalysis.biasDetected).toBe(true)
        
        // Algorithm confidence should be significantly higher than human confidence
        const avgAlgorithmConfidence = testConversations.reduce(
          (sum, conv) => sum + conv.moodAnalysis.confidence, 0
        ) / testConversations.length
        
        const avgHumanConfidence = humanValidations.reduce(
          (sum, val) => sum + val.confidence, 0
        ) / humanValidations.length

        expect(avgAlgorithmConfidence).toBeGreaterThan(avgHumanConfidence + 0.2)

        // Should recommend confidence threshold adjustments
        const confidenceRecs = validationResult.recommendations.filter(r =>
          r.description.toLowerCase().includes('confidence') ||
          r.description.toLowerCase().includes('uncertainty') ||
          r.description.toLowerCase().includes('threshold')
        )
        
        // Since this is a generic emotional_complexity bias, we expect comprehensive recommendations
        expect(validationResult.recommendations.length).toBeGreaterThan(0)
        expect(validationResult.discrepancyAnalysis.systematicBias).toBe('algorithmic_over_estimation')
      })
    })
  })
})
