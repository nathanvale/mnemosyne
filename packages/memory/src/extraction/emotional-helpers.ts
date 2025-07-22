import {
  EmotionalState,
  EmotionalTheme,
  CommunicationPattern,
  InteractionQuality,
  ParticipantRole,
  type RelationshipDynamics as SchemaRelationshipDynamics,
} from '@studio/schema'

import type {
  MoodAnalysisResult,
  ConversationData,
  ConversationParticipant,
  ExtractedMemory,
  EmotionalAnalysis,
  RelationshipDynamics,
} from '../types'

/**
 * Helper functions for emotional analysis in the EnhancedMemoryProcessor
 */

/**
 * Convert conversation participant role to schema ParticipantRole
 */
function convertConversationRoleToParticipantRole(
  role: ConversationParticipant['role'],
): ParticipantRole {
  switch (role) {
    case 'author':
      return ParticipantRole.SELF
    case 'recipient':
      return ParticipantRole.OTHER
    case 'observer':
      return ParticipantRole.OTHER
    case 'supporter':
      return ParticipantRole.FRIEND
    case 'listener':
      return ParticipantRole.OTHER
    case 'vulnerable_sharer':
      return ParticipantRole.OTHER
    case 'emotional_leader':
      return ParticipantRole.OTHER
    default:
      return ParticipantRole.OTHER
  }
}

/**
 * Map mood score to EmotionalState enum
 */
export function mapMoodToEmotionalState(moodScore: number): EmotionalState {
  if (moodScore >= 8.5) return EmotionalState.JOY
  if (moodScore >= 7.5) return EmotionalState.EXCITEMENT
  if (moodScore >= 6.5) return EmotionalState.CONTENTMENT
  if (moodScore >= 5.5) return EmotionalState.NEUTRAL
  if (moodScore >= 4.5) return EmotionalState.ANXIETY
  if (moodScore >= 3.5) return EmotionalState.FRUSTRATION
  if (moodScore >= 2.5) return EmotionalState.SADNESS
  return EmotionalState.FEAR
}

/**
 * Extract secondary emotions from mood analysis
 */
export function extractSecondaryEmotions(
  moodAnalysis: MoodAnalysisResult,
): EmotionalState[] {
  const secondaryEmotions: EmotionalState[] = []

  // Check for mixed emotional indicators in descriptors
  const descriptors = moodAnalysis.descriptors

  if (descriptors.includes('anxious') || descriptors.includes('worried')) {
    secondaryEmotions.push(EmotionalState.ANXIETY)
  }

  if (descriptors.includes('excited') || descriptors.includes('enthusiastic')) {
    secondaryEmotions.push(EmotionalState.EXCITEMENT)
  }

  if (descriptors.includes('frustrated') || descriptors.includes('annoyed')) {
    secondaryEmotions.push(EmotionalState.FRUSTRATION)
  }

  if (descriptors.includes('hopeful') || descriptors.includes('optimistic')) {
    secondaryEmotions.push(EmotionalState.CONTENTMENT)
  }

  if (descriptors.includes('sad') || descriptors.includes('disappointed')) {
    secondaryEmotions.push(EmotionalState.SADNESS)
  }

  // Remove duplicates and primary emotion
  const primaryEmotion = mapMoodToEmotionalState(moodAnalysis.score)
  return [...new Set(secondaryEmotions)].filter(
    (emotion) => emotion !== primaryEmotion,
  )
}

/**
 * Calculate emotional intensity from mood analysis
 */
export function calculateEmotionalIntensity(
  moodAnalysis: MoodAnalysisResult,
): number {
  // Base intensity on distance from neutral (5.0)
  const neutralDistance = Math.abs(moodAnalysis.score - 5.0)
  let intensity = neutralDistance / 5.0 // Normalize to 0-1

  // Factor in confidence
  intensity *= moodAnalysis.confidence

  // Factor in evidence strength
  const evidenceCount = moodAnalysis.factors.reduce(
    (sum, factor) => sum + factor.evidence.length,
    0,
  )
  const evidenceFactor = Math.min(evidenceCount / 10, 1) // Max at 10 pieces of evidence
  intensity += evidenceFactor * 0.2

  return Math.min(1, intensity)
}

/**
 * Calculate valence from mood score (-1 to 1)
 */
export function calculateValence(moodScore: number): number {
  // Convert 0-10 scale to -1 to 1 scale
  return (moodScore - 5) / 5
}

/**
 * Extract emotional themes from mood analysis
 */
export function extractEmotionalThemes(
  moodAnalysis: MoodAnalysisResult,
): EmotionalTheme[] {
  const themes: EmotionalTheme[] = []

  // Extract themes from descriptors
  const descriptors = moodAnalysis.descriptors

  if (descriptors.some((d) => ['growth', 'learning', 'progress'].includes(d))) {
    themes.push(EmotionalTheme.GROWTH)
  }

  if (descriptors.some((d) => ['support', 'helpful', 'caring'].includes(d))) {
    themes.push(EmotionalTheme.SUPPORT)
  }

  if (
    descriptors.some((d) => ['conflict', 'tension', 'disagreement'].includes(d))
  ) {
    themes.push(EmotionalTheme.CONFLICT)
  }

  if (
    descriptors.some((d) =>
      ['celebration', 'achievement', 'success'].includes(d),
    )
  ) {
    themes.push(EmotionalTheme.ACHIEVEMENT)
  }

  if (
    descriptors.some((d) =>
      ['vulnerability', 'openness', 'sharing'].includes(d),
    )
  ) {
    themes.push(EmotionalTheme.CONNECTION)
  }

  if (descriptors.some((d) => ['crisis', 'emergency', 'urgent'].includes(d))) {
    themes.push(EmotionalTheme.STRESS)
  }

  return themes
}

/**
 * Extract emotional phrases from conversation
 */
export function extractEmotionalPhrases(
  conversationData: ConversationData,
): string[] {
  const phrases: string[] = []
  const content = conversationData.messages
    .map((m) => m.content)
    .join(' ')
    .toLowerCase()

  const emotionalPhrases = [
    'i feel',
    'i felt',
    'feeling like',
    'makes me feel',
    "i'm so",
    'i am so',
    'really excited',
    'really worried',
    "i'm happy",
    "i'm sad",
    "i'm angry",
    "i'm scared",
    'thank you',
    'i appreciate',
    "i'm grateful",
    "i'm sorry",
    'i apologize',
    'my fault',
    'i love',
    'i hate',
    "i can't stand",
    'overwhelming',
    'frustrated',
    'disappointed',
  ]

  for (const phrase of emotionalPhrases) {
    if (content.includes(phrase)) {
      phrases.push(phrase)
    }
  }

  return [...new Set(phrases)].slice(0, 10) // Limit to 10 unique phrases
}

/**
 * Extract emotional words from mood analysis
 */
export function extractEmotionalWords(
  moodAnalysis: MoodAnalysisResult,
): string[] {
  const words: string[] = []

  // Extract from mood factors evidence
  for (const factor of moodAnalysis.factors) {
    if (factor.type === 'emotional_words') {
      for (const evidence of factor.evidence) {
        const matches = evidence.match(/"([^"]+)"/g)
        if (matches) {
          words.push(...matches.map((match) => match.replace(/"/g, '')))
        }
      }
    }
  }

  return [...new Set(words)].slice(0, 15) // Limit to 15 unique words
}

/**
 * Extract style indicators from conversation
 */
export function extractStyleIndicators(
  conversationData: ConversationData,
): string[] {
  const indicators: string[] = []
  const messages = conversationData.messages

  // Check for caps usage
  const hasCaps = messages.some(
    (m) => m.content.toUpperCase() === m.content && m.content.length > 3,
  )
  if (hasCaps) indicators.push('caps_usage')

  // Check for punctuation patterns
  const hasExclamation = messages.some((m) => m.content.includes('!'))
  if (hasExclamation) indicators.push('exclamation_usage')

  const hasQuestion = messages.some((m) => m.content.includes('?'))
  if (hasQuestion) indicators.push('questioning')

  // Check for repetition
  const hasRepetition = messages.some((m) => /(.)\1{2,}/.test(m.content))
  if (hasRepetition) indicators.push('repetition')

  // Check for ellipsis
  const hasEllipsis = messages.some((m) => m.content.includes('...'))
  if (hasEllipsis) indicators.push('trailing_thought')

  // Check for short responses
  const hasShortResponses = messages.some(
    (m) => m.content.trim().split(' ').length <= 3,
  )
  if (hasShortResponses) indicators.push('terse_responses')

  // Check for long messages
  const hasLongMessages = messages.some(
    (m) => m.content.trim().split(' ').length > 50,
  )
  if (hasLongMessages) indicators.push('verbose_expression')

  return indicators
}

/**
 * Create preliminary memory for significance assessment
 */
export function createPreliminaryMemory(
  conversationData: ConversationData,
  emotionalAnalysis: EmotionalAnalysis,
  extractedAt: Date,
): ExtractedMemory {
  // Create a minimal extracted memory for significance assessment
  return {
    id: `temp-${Date.now()}`,
    content: conversationData.messages.map((m) => m.content).join(' '),
    timestamp: conversationData.timestamp.toISOString(),
    author: {
      id: conversationData.participants[0]?.id || 'unknown',
      name: conversationData.participants[0]?.name || 'Unknown',
      role: ParticipantRole.SELF,
    },
    participants: conversationData.participants.map((p) => ({
      id: p.id,
      name: p.name,
      role: convertConversationRoleToParticipantRole(p.role),
      metadata: {
        sourceId: p.id,
        canonicalName: p.name,
      },
    })),
    emotionalContext: emotionalAnalysis.context,
    // TODO: Replace with actual relationship dynamics analysis
    // These are placeholder values that should be replaced with actual analysis
    relationshipDynamics: {
      communicationPattern: CommunicationPattern.SUPPORTIVE,
      interactionQuality: InteractionQuality.POSITIVE,
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
      quality: 7,
      patterns: [],
    } as SchemaRelationshipDynamics,
    extendedRelationshipDynamics: {
      type: 'close_friend',
      supportLevel: 'high',
      intimacyLevel: 'medium',
      conflictLevel: 'low',
      trustLevel: 'high',
    } as RelationshipDynamics,
    tags: ['conversation'],
    metadata: {
      processedAt: extractedAt.toISOString(),
      schemaVersion: '2.0',
      source: 'conversation',
      confidence: emotionalAnalysis.moodScoring.confidence,
    },
    emotionalAnalysis,
    significance: {
      overall: 5.0, // Placeholder, will be replaced
      components: {
        emotionalSalience: 5.0,
        relationshipImpact: 5.0,
        contextualImportance: 5.0,
        temporalRelevance: 5.0,
      },
      confidence: 0.5,
      category: 'medium',
      validationPriority: 5.0,
    },
    processing: {
      extractedAt,
      confidence: emotionalAnalysis.moodScoring.confidence,
      quality: {
        overall: 5.0,
        components: {
          emotionalRichness: 5.0,
          relationshipClarity: 5.0,
          contentCoherence: 5.0,
          contextualSignificance: 5.0,
        },
        confidence: emotionalAnalysis.moodScoring.confidence,
        issues: [],
      },
      sourceData: conversationData,
    },
  }
}
