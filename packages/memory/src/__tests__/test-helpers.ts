import {
  EmotionalState,
  EmotionalTheme,
  ParticipantRole,
  CommunicationPattern,
  InteractionQuality,
} from '@studio/schema'

import type {
  ConversationData,
  MoodAnalysisResult,
  ExtractedMemory,
  ConversationMessage,
  ConversationParticipant,
  MoodFactor,
  EmotionalAnalysis,
  EmotionalSignificanceScore,
  MemoryQualityScore,
} from '../types'

/**
 * Factory function to create properly typed ConversationData for tests
 */
export function createTestConversationData(
  overrides: Partial<ConversationData> = {},
): ConversationData {
  const defaultTimestamp = new Date('2024-01-15T14:30:00Z')

  return {
    id: 'test-conversation-1',
    messages: [
      {
        id: 'msg-1',
        content: 'I was feeling down but things are looking up now.',
        authorId: 'user-1',
        timestamp: defaultTimestamp,
      },
      {
        id: 'msg-2',
        content: "That's wonderful to hear! I'm glad you're feeling better.",
        authorId: 'supporter-1',
        timestamp: new Date(defaultTimestamp.getTime() + 60000),
      },
    ],
    participants: [
      {
        id: 'user-1',
        name: 'Test User',
        role: 'vulnerable_sharer',
        messageCount: 1,
        emotionalExpressions: ['down', 'looking up'],
      },
      {
        id: 'supporter-1',
        name: 'Test Supporter',
        role: 'supporter',
        messageCount: 1,
        emotionalExpressions: ['wonderful', 'glad'],
      },
    ],
    timestamp: defaultTimestamp,
    startTime: defaultTimestamp,
    endTime: new Date(defaultTimestamp.getTime() + 120000), // 2 minutes later
    context: {
      platform: 'test',
      conversationType: 'direct',
    },
    ...overrides,
  }
}

/**
 * Factory function to create properly typed MoodAnalysisResult for tests
 */
export function createTestMoodAnalysisResult(
  overrides: Partial<MoodAnalysisResult> = {},
): MoodAnalysisResult {
  const defaultFactors: MoodFactor[] = [
    {
      type: 'sentiment_analysis',
      weight: 0.35,
      description: 'Positive sentiment detected',
      evidence: ['feeling better', 'looking up'],
    },
    {
      type: 'emotional_words',
      weight: 0.25,
      description: 'Emotional language present',
      evidence: ['down', 'wonderful'],
    },
  ]

  return {
    score: 6.5,
    descriptors: ['hopeful', 'improving'],
    confidence: 0.85,
    factors: defaultFactors,
    delta: undefined,
    ...overrides,
  }
}

/**
 * Factory function to create properly typed ExtractedMemory for tests
 */
export function createTestExtractedMemory(
  overrides: Partial<ExtractedMemory> = {},
): ExtractedMemory {
  const conversationData = createTestConversationData()

  return {
    id: 'test-memory-1',
    content: 'Test memory content about mood improvement',
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
      {
        id: 'supporter-1',
        name: 'Test Supporter',
        role: ParticipantRole.FRIEND,
      },
    ],
    emotionalContext: {
      primaryEmotion: EmotionalState.JOY,
      secondaryEmotions: [EmotionalState.CONTENTMENT],
      intensity: 0.7,
      valence: 0.8,
      themes: [EmotionalTheme.GROWTH, EmotionalTheme.SUPPORT],
      indicators: {
        phrases: ['feeling better', 'looking up'],
        emotionalWords: ['wonderful', 'glad'],
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
        secure: ['open communication', 'emotional support'],
        anxious: [],
        avoidant: [],
      },
      healthIndicators: {
        positive: ['validation', 'empathy'],
        negative: [],
        repairAttempts: [],
      },
      connectionStrength: 0.8,
    },
    tags: ['test', 'mood-improvement'],
    metadata: {
      processedAt: '2024-01-15T14:35:00Z',
      schemaVersion: '1.0.0',
      source: 'test',
      confidence: 0.85,
    },
    processing: {
      extractedAt: new Date('2024-01-15T14:35:00Z'),
      confidence: 0.85,
      quality: createTestMemoryQualityScore(),
      sourceData: conversationData,
    },
    emotionalAnalysis: createTestEmotionalAnalysis(),
    significance: createTestEmotionalSignificanceScore(),
    ...overrides,
  }
}

/**
 * Factory function to create properly typed MemoryQualityScore for tests
 */
export function createTestMemoryQualityScore(
  overrides: Partial<MemoryQualityScore> = {},
): MemoryQualityScore {
  return {
    overall: 8.5,
    components: {
      emotionalRichness: 8.0,
      relationshipClarity: 8.5,
      contentCoherence: 8.8,
      contextualSignificance: 8.7,
    },
    confidence: 0.85,
    issues: [],
    ...overrides,
  }
}

/**
 * Factory function to create properly typed EmotionalAnalysis for tests
 */
export function createTestEmotionalAnalysis(
  overrides: Partial<EmotionalAnalysis> = {},
): EmotionalAnalysis {
  return {
    context: {
      primaryEmotion: EmotionalState.JOY,
      secondaryEmotions: [EmotionalState.CONTENTMENT],
      intensity: 0.7,
      valence: 0.8,
      themes: [EmotionalTheme.GROWTH],
      indicators: {
        phrases: ['feeling better', 'looking up'],
        emotionalWords: ['wonderful', 'glad'],
        styleIndicators: [],
      },
    },
    moodScoring: createTestMoodAnalysisResult(),
    trajectory: {
      points: [
        {
          timestamp: new Date('2024-01-15T14:30:00Z'),
          moodScore: 6.5,
        },
      ],
      direction: 'improving',
      significance: 0.8,
      turningPoints: [],
    },
    patterns: [],
    ...overrides,
  }
}

/**
 * Factory function to create properly typed EmotionalSignificanceScore for tests
 */
export function createTestEmotionalSignificanceScore(
  overrides: Partial<EmotionalSignificanceScore> = {},
): EmotionalSignificanceScore {
  return {
    overall: 7.5,
    components: {
      emotionalSalience: 7.8,
      relationshipImpact: 7.2,
      contextualImportance: 7.5,
      temporalRelevance: 7.6,
    },
    confidence: 0.85,
    category: 'high',
    validationPriority: 8.0,
    ...overrides,
  }
}

/**
 * Create a simple conversation participant for tests
 */
export function createTestParticipant(
  id: string,
  name: string,
  role: ConversationParticipant['role'],
  overrides: Partial<ConversationParticipant> = {},
): ConversationParticipant {
  return {
    id,
    name,
    role,
    messageCount: 1,
    emotionalExpressions: [],
    ...overrides,
  }
}

/**
 * Create a simple conversation message for tests
 */
export function createTestMessage(
  id: string,
  content: string,
  authorId: string,
  timestamp: Date = new Date(),
  overrides: Partial<ConversationMessage> = {},
): ConversationMessage {
  return {
    id,
    content,
    authorId,
    timestamp,
    ...overrides,
  }
}
