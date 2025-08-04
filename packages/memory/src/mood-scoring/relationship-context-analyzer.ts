import { createLogger } from '@studio/logger'

import type {
  ConversationData,
  RelationshipDynamics,
  MoodAnalysisResult,
} from '../types'

const logger = createLogger({
  tags: ['mood-scoring', 'relationship-context'],
})

/**
 * Configuration for relationship context analysis
 */
export interface RelationshipContextConfig {
  /** Minimum confidence threshold for relationship analysis */
  confidenceThreshold: number
  /** Depth of intimacy analysis */
  intimacyAnalysisDepth: 'basic' | 'comprehensive'
}

/**
 * RelationshipContextAnalyzer integrates relationship dynamics into mood analysis
 */
export class RelationshipContextAnalyzer {
  private readonly config: RelationshipContextConfig

  constructor(config?: Partial<RelationshipContextConfig>) {
    this.config = {
      confidenceThreshold: 0.7,
      intimacyAnalysisDepth: 'comprehensive',
      ...config,
    }
  }

  // TDD: Start with empty methods that throw "Not implemented yet - TDD"

  analyzeRelationshipDynamics(
    conversation: ConversationData,
  ): RelationshipDynamics {
    logger.debug('Analyzing relationship dynamics', {
      conversationId: conversation.id,
      participantCount: conversation.participants.length,
      messageCount: conversation.messages.length,
    })

    // TDD: Minimal implementation to make first test pass
    const intimacyLevel = this.assessIntimacyLevel(conversation)
    const supportLevel = this.assessSupportLevel(conversation)
    const trustLevel = this.assessTrustLevel(conversation)
    const conflictLevel = this.assessConflictLevel(conversation)
    const relationshipType = this.identifyRelationshipType(
      conversation,
      intimacyLevel,
    )
    const communicationStyle = this.analyzeCommunicationStyle(conversation)
    const participantDynamics = this.analyzeParticipantDynamics(conversation)
    const emotionalSafety = this.assessEmotionalSafety(conversation)

    return {
      type: relationshipType,
      supportLevel,
      intimacyLevel,
      intimacy: intimacyLevel, // Backwards compatibility alias
      conflictLevel,
      trustLevel,
      conflictPresent: conflictLevel !== 'none',
      conflictIntensity:
        conflictLevel === 'none'
          ? 'low'
          : (conflictLevel as 'high' | 'medium' | 'low'),
      communicationStyle:
        this.determineCommunicationStyleSummary(communicationStyle),
      communicationStyleDetails: communicationStyle,
      participantDynamics,
      emotionalSafety,
    }
  }

  // TDD: Helper methods that start with minimal implementations

  private assessIntimacyLevel(
    conversation: ConversationData,
  ): 'high' | 'medium' | 'low' {
    // Basic intimacy assessment based on emotional expressions and message content
    const intimacyKeywords = [
      'love',
      'scared',
      'vulnerable',
      'personal',
      'trust',
      'safe space',
      'mean everything',
    ]
    const professionalKeywords = [
      'project',
      'timeline',
      'update',
      'review',
      'follow up',
    ]

    const allMessages = conversation.messages
      .map((m) => m.content.toLowerCase())
      .join(' ')
    const allEmotions = conversation.participants.flatMap(
      (p) => p.emotionalExpressions || [],
    )

    const intimacyScore = intimacyKeywords.filter((keyword) =>
      allMessages.includes(keyword),
    ).length
    const professionalScore = professionalKeywords.filter((keyword) =>
      allMessages.includes(keyword),
    ).length
    const vulnerableEmotions = allEmotions.filter((e) =>
      ['scared', 'vulnerable', 'trusting', 'loved', 'ashamed'].includes(e),
    ).length

    if (intimacyScore >= 3 || vulnerableEmotions >= 2) return 'high'
    if (professionalScore >= 2) return 'low'
    return 'medium'
  }

  private assessSupportLevel(
    conversation: ConversationData,
  ): 'high' | 'medium' | 'low' | 'negative' {
    const supportKeywords = [
      'here for you',
      'trust me',
      'listening',
      'helps',
      'support',
      'been there for me',
      'helping me',
    ]
    const conflictKeywords = ['overreacting', 'dismiss', "can't believe"]
    const therapeuticKeywords = ['tell me more', 'what these thoughts']
    const achievementKeywords = [
      'proud of you',
      'deserved this',
      'believing in me',
      'incredible',
      'promotion',
    ]

    const allMessages = conversation.messages
      .map((m) => m.content.toLowerCase())
      .join(' ')
    const supportScore = supportKeywords.filter((keyword) =>
      allMessages.includes(keyword),
    ).length
    const conflictScore = conflictKeywords.filter((keyword) =>
      allMessages.includes(keyword),
    ).length
    const therapeuticScore = therapeuticKeywords.filter((keyword) =>
      allMessages.includes(keyword),
    ).length
    const achievementScore = achievementKeywords.filter((keyword) =>
      allMessages.includes(keyword),
    ).length

    if (conflictScore > supportScore) return 'negative'
    if (supportScore >= 2 || therapeuticScore >= 1 || achievementScore >= 2)
      return 'high'
    if (supportScore >= 1 || achievementScore >= 1) return 'medium'
    return 'low'
  }

  private assessTrustLevel(
    conversation: ConversationData,
  ): 'high' | 'medium' | 'low' {
    const strongTrustKeywords = [
      'trust',
      'safe',
      'love you',
      'nothing will change',
      'trusting me',
    ]
    const moderateTrustKeywords = [
      'confidence',
      'reliable',
      'listening',
      'here for you',
    ]
    const distrustKeywords = ['judge', 'questionable', 'react']
    const cautionKeywords = [
      'questionable choices',
      "not sure how you'll react",
      "isn't the right time",
    ]

    const allMessages = conversation.messages
      .map((m) => m.content.toLowerCase())
      .join(' ')

    const strongTrustScore = strongTrustKeywords.filter((keyword) =>
      allMessages.includes(keyword),
    ).length
    const moderateTrustScore = moderateTrustKeywords.filter((keyword) =>
      allMessages.includes(keyword),
    ).length
    const distrustScore = distrustKeywords.filter((keyword) =>
      allMessages.includes(keyword),
    ).length
    const cautionScore = cautionKeywords.filter((keyword) =>
      allMessages.includes(keyword),
    ).length

    // Strong trust indicators override distrust
    if (strongTrustScore >= 2) return 'high'

    // High caution or distrust reduces trust level
    if (cautionScore >= 1 || distrustScore >= 1) {
      if (strongTrustScore >= 1 || moderateTrustScore >= 1) return 'medium'
      return 'low'
    }

    // Moderate trust indicators
    if (strongTrustScore >= 1 || moderateTrustScore >= 2) return 'high'
    if (moderateTrustScore >= 1) return 'medium'

    return 'medium' // Default for neutral conversations
  }

  private assessConflictLevel(
    conversation: ConversationData,
  ): 'high' | 'medium' | 'low' | 'none' {
    const highConflictKeywords = [
      "can't believe",
      'overreacting',
      'dismiss',
      'done trying',
      'invalidating',
      'frustrated',
      'angry',
    ]
    const mediumConflictKeywords = ['disagree', 'argue', 'upset', 'annoyed']

    const allMessages = conversation.messages
      .map((m) => m.content.toLowerCase())
      .join(' ')
    const highConflictScore = highConflictKeywords.filter((keyword) =>
      allMessages.includes(keyword),
    ).length
    const mediumConflictScore = mediumConflictKeywords.filter((keyword) =>
      allMessages.includes(keyword),
    ).length

    // High conflict if we have multiple high-intensity indicators or many conflict indicators overall
    if (
      highConflictScore >= 2 ||
      (highConflictScore >= 1 && mediumConflictScore >= 1)
    )
      return 'high'
    if (highConflictScore >= 1 || mediumConflictScore >= 2) return 'medium'
    if (mediumConflictScore >= 1) return 'low'
    return 'none'
  }

  private identifyRelationshipType(
    conversation: ConversationData,
    intimacyLevel: 'high' | 'medium' | 'low',
  ): RelationshipDynamics['type'] {
    const therapeuticKeywords = [
      'tell me more',
      'thoughts',
      'process',
      'realize',
      'pattern',
    ]
    const professionalKeywords = ['project', 'timeline', 'update', 'review']
    const loveKeywords = ['love you', 'mean everything']

    const allMessages = conversation.messages
      .map((m) => m.content.toLowerCase())
      .join(' ')

    if (therapeuticKeywords.some((keyword) => allMessages.includes(keyword)))
      return 'therapeutic'
    if (professionalKeywords.some((keyword) => allMessages.includes(keyword)))
      return 'professional'
    if (loveKeywords.some((keyword) => allMessages.includes(keyword)))
      return 'romantic'

    if (intimacyLevel === 'high') return 'close_friend'
    if (intimacyLevel === 'medium') return 'friend'
    return 'acquaintance'
  }

  private analyzeCommunicationStyle(conversation: ConversationData) {
    const vulnerabilityKeywords = ['scared', 'ashamed', 'mistake', 'struggling']
    const supportKeywords = [
      'listening',
      'courage',
      'here for you',
      'hear you',
      'takes courage',
    ]
    const conflictKeywords = ['dismiss', 'overreacting', 'defensive']
    const therapeuticKeywords = ['tell me more', 'realize', 'pattern']

    const allMessages = conversation.messages
      .map((m) => m.content.toLowerCase())
      .join(' ')

    const vulnerabilityScore = vulnerabilityKeywords.filter((k) =>
      allMessages.includes(k),
    ).length
    const supportScore = supportKeywords.filter((k) =>
      allMessages.includes(k),
    ).length
    const conflictScore = conflictKeywords.filter((k) =>
      allMessages.includes(k),
    ).length
    const therapeuticScore = therapeuticKeywords.filter((k) =>
      allMessages.includes(k),
    ).length

    // Enhanced emotional safety detection
    const emotionalSafety =
      conflictScore > 0 ? 'low' : supportScore >= 1 ? 'high' : 'medium'

    return {
      vulnerabilityLevel: (vulnerabilityScore >= 2
        ? 'high'
        : vulnerabilityScore >= 1
          ? 'medium'
          : 'low') as 'high' | 'medium' | 'low',
      emotionalSafety: emotionalSafety as 'high' | 'medium' | 'low',
      supportPatterns:
        supportScore > 0 ? ['active_listening', 'validation'] : [],
      conflictPatterns: conflictScore > 0 ? ['dismissal', 'defensiveness'] : [],
      professionalBoundaries: therapeuticScore > 0,
      guidancePatterns: therapeuticScore > 0 ? ['reflective_questioning'] : [],
      therapeuticElements: therapeuticScore > 0 ? ['insight_facilitation'] : [],
    }
  }

  private analyzeParticipantDynamics(conversation: ConversationData) {
    const participants = conversation.participants
    const supporterRole = participants.find(
      (p) => p.role === 'supporter' || p.role === 'emotional_leader',
    )
    const vulnerableRole = participants.find(
      (p) => p.role === 'vulnerable_sharer',
    )

    const mutualSupport =
      participants.filter((p) => p.role === 'supporter').length > 1

    return {
      emotionalLeader: supporterRole?.id,
      primarySupporter: supporterRole?.id,
      vulnerabilityExhibitor: vulnerableRole?.id,
      supportBalance: (mutualSupport ? 'bidirectional' : 'unidirectional') as
        | 'unidirectional'
        | 'bidirectional'
        | 'balanced',
      mutualVulnerability: mutualSupport,
    }
  }

  private determineCommunicationStyleSummary(communicationStyleDetails: {
    guidancePatterns?: string[]
    therapeuticElements?: string[]
    supportLevel?: string
    conflictLevel?: string
    professionalLanguage?: boolean
    conflictPatterns?: string[]
    professionalBoundaries?: boolean
    supportPatterns?: string[]
  }):
    | 'reflective'
    | 'supportive'
    | 'directive'
    | 'conflicting'
    | 'professional' {
    // Determine primary communication style based on patterns
    if (
      communicationStyleDetails.guidancePatterns?.includes(
        'reflective_questioning',
      ) ||
      (communicationStyleDetails.therapeuticElements &&
        communicationStyleDetails.therapeuticElements.length > 0)
    ) {
      return 'reflective'
    }

    if (
      communicationStyleDetails.conflictPatterns &&
      communicationStyleDetails.conflictPatterns.length > 0
    ) {
      return 'conflicting'
    }

    if (communicationStyleDetails.professionalBoundaries) {
      return 'professional'
    }

    if (
      communicationStyleDetails.supportPatterns &&
      communicationStyleDetails.supportPatterns.length > 0
    ) {
      return 'supportive'
    }

    return 'supportive' // Default to supportive
  }

  private assessEmotionalSafety(conversation: ConversationData) {
    const safetyKeywords = [
      'love you',
      'nothing will change',
      'trust',
      'safe',
      'we all make mistakes',
      'how we learn and grow',
    ]
    const judgmentKeywords = ['judge', 'questionable', 'overreacting']
    const validationKeywords = [
      'courage',
      'hear you',
      'understand',
      'trusting me',
      'takes courage',
    ]
    const supportKeywords = [
      'here for you',
      'proud of you',
      'believing in me',
      'means everything',
      'support',
    ]
    const trustAssuranceKeywords = [
      'trust me with whatever',
      'can trust me',
      'trust me',
      'nothing will change',
    ]

    const allMessages = conversation.messages
      .map((m) => m.content.toLowerCase())
      .join(' ')

    const safetyScore = safetyKeywords.filter((k) =>
      allMessages.includes(k),
    ).length
    const judgmentScore = judgmentKeywords.filter((k) =>
      allMessages.includes(k),
    ).length
    const validationScore = validationKeywords.filter((k) =>
      allMessages.includes(k),
    ).length
    const supportScore = supportKeywords.filter((k) =>
      allMessages.includes(k),
    ).length
    const trustAssuranceScore = trustAssuranceKeywords.filter((k) =>
      allMessages.includes(k),
    ).length

    // Enhanced emotional safety detection - trust assurances are strong safety indicators
    const totalSafetyIndicators =
      safetyScore + supportScore + validationScore + trustAssuranceScore * 2

    // Special handling for vulnerability + support combinations (high safety)
    const hasVulnerabilitySharing = conversation.participants.some(
      (p) => p.role === 'vulnerable_sharer',
    )
    const hasSupportiveRole = conversation.participants.some((p) =>
      ['emotional_leader', 'supporter'].includes(p.role),
    )
    const vulnerabilitySupportCombination =
      hasVulnerabilitySharing &&
      hasSupportiveRole &&
      (supportScore > 0 || trustAssuranceScore > 0)

    let overall: 'high' | 'medium' | 'low'
    if (vulnerabilitySupportCombination || totalSafetyIndicators >= 3) {
      overall = 'high'
    } else if (judgmentScore > 0) {
      overall = 'medium'
    } else if (totalSafetyIndicators >= 1) {
      overall = 'medium'
    } else {
      overall = 'low'
    }

    return {
      overall,
      acceptanceLevel: (totalSafetyIndicators >= 2
        ? 'high'
        : totalSafetyIndicators >= 1
          ? 'medium'
          : 'low') as 'high' | 'medium' | 'low',
      judgmentRisk: (judgmentScore >= 2
        ? 'high'
        : judgmentScore >= 1
          ? 'medium'
          : 'low') as 'high' | 'medium' | 'low',
      validationPresent:
        validationScore > 0 || supportScore > 0 || trustAssuranceScore > 0,
    }
  }
}
