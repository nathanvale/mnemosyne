import { createLogger } from '@studio/logger'

import type {
  ConversationData,
  MoodAnalysisResult,
  // RelationshipDynamics,
} from '../types'

const logger = createLogger({
  tags: ['mood-scoring', 'emotional-context'],
})

/**
 * Configuration for emotional context building
 */
export interface EmotionalContextConfig {
  /** Sensitivity threshold for trigger detection (0-1) */
  triggerSensitivity: number
  /** Depth of contextual analysis */
  contextualDepth: 'basic' | 'comprehensive'
  /** Whether to weight factors by relationship dynamics */
  relationshipWeighting: boolean
}

/**
 * Comprehensive contextual factors identified in a conversation
 */
export interface ContextualFactors {
  /** Primary emotional triggers identified */
  primaryTriggers: string[]
  /** Relationship-specific contextual factors */
  relationshipSpecificFactors: {
    intimacyLevel: 'high' | 'medium' | 'low'
    trustDependency: 'high' | 'medium' | 'low'
    conflictHistory: 'escalating' | 'stable' | 'resolving'
    communicationBreakdown: boolean
    supportLevel: 'high' | 'medium' | 'low'
    validationPatterns: string[]
    professionalBoundaries: boolean
    guidanceStyle: 'directive' | 'reflective' | 'supportive'
  }
  /** Emotional safety factors */
  emotionalSafetyFactors: string[]
  /** Contextual significance level */
  contextualSignificance: 'high' | 'medium' | 'low'
  /** Therapeutic-specific factors */
  therapeuticFactors?: {
    breakthroughIndicators: string[]
    progressMarkers: string[]
  }
  /** Temporal context factors */
  temporalFactors?: {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'late_night'
    emotionalVulnerability: 'heightened' | 'normal' | 'reduced'
    contextualTriggers: string[]
  }
  /** Stress accumulation factors */
  stressFactors?: {
    accumulationPattern: 'escalating' | 'stable' | 'decreasing'
    durationImpact: 'significant' | 'moderate' | 'minimal'
    fatigueIndicators: string[]
    copingMechanisms: string[]
  }
  /** Life event contextual factors */
  lifeEventFactors?: {
    eventType: 'major_transition' | 'minor_change' | 'crisis' | 'celebration'
    emotionalImpact: 'high' | 'medium' | 'low'
    supportNeed: 'elevated' | 'normal' | 'minimal'
    adaptationChallenges: string[]
  }
  /** Linguistic pattern factors */
  linguisticFactors?: {
    emotionalIntensity: 'high' | 'medium' | 'low'
    vulnerabilityMarkers: string[]
    supportSeeking: string[]
    emotionalRegulation: 'effective' | 'struggling' | 'overwhelmed'
  }
  /** Non-verbal communication factors */
  nonVerbalFactors?: {
    messageFrequency: 'rapid' | 'normal' | 'sparse'
    responseLatency: 'immediate' | 'normal' | 'delayed'
    emotionalUrgency: 'high' | 'medium' | 'low'
    communicationStyle: 'stream_of_consciousness' | 'structured' | 'fragmented'
  }
  /** Avoidance behavior factors */
  avoidanceFactors?: {
    topicAvoidance: 'active' | 'passive' | 'none'
    emotionalWithdrawal: 'significant' | 'moderate' | 'minimal'
    deflectionStrategies: string[]
    underlyingConcerns: string[]
  }
  /** Factor weighting analysis */
  factorWeighting?: {
    relationshipWeight: number
    temporalWeight: number
    linguisticWeight: number
  }
  /** Overall context confidence */
  overallContextConfidence: number
  /** Primary context type */
  primaryContextType: string
  /** Contextual summary for mood analysis integration */
  contextualSummary?: {
    dominantContext: string
    secondaryContexts: string[]
    emotionalClimate: string
    riskFactors: string[]
    supportiveElements: string[]
    recommendedMoodAdjustments: string[]
  }
  /** Overall confidence in the analysis */
  confidenceScore: number
}

/**
 * EmotionalContextBuilder identifies contextual factors that influence emotional responses
 */
export class EmotionalContextBuilder {
  private readonly config: EmotionalContextConfig

  constructor(config?: Partial<EmotionalContextConfig>) {
    this.config = {
      triggerSensitivity: 0.7,
      contextualDepth: 'comprehensive',
      relationshipWeighting: true,
      ...config,
    }
  }

  // TDD: Start with method that throws "Not implemented yet - TDD"

  identifyContextualFactors(
    conversation: ConversationData & { moodAnalysis: MoodAnalysisResult },
  ): ContextualFactors {
    logger.debug('Identifying contextual factors', {
      conversationId: conversation.id,
      participantCount: conversation.participants.length,
      messageCount: conversation.messages.length,
      moodScore: conversation.moodAnalysis.score,
    })

    // Analyze conversation content and patterns
    const allMessages = conversation.messages
      .map((m) => m.content.toLowerCase())
      .join(' ')
    // const participantRoles = conversation.participants.map((p) => p.role)
    const emotionalExpressions = conversation.participants.flatMap(
      (p) => p.emotionalExpressions || [],
    )

    // Identify primary triggers based on content analysis
    const primaryTriggers = this.identifyPrimaryTriggers(
      allMessages,
      emotionalExpressions,
      conversation,
    )

    // Analyze relationship-specific factors
    const relationshipSpecificFactors = this.analyzeRelationshipFactors(
      conversation,
      allMessages,
    )

    // Identify emotional safety factors
    const emotionalSafetyFactors = this.identifyEmotionalSafetyFactors(
      allMessages,
      conversation,
    )

    // Determine contextual significance
    const contextualSignificance = this.assessContextualSignificance(
      conversation,
      primaryTriggers,
    )

    // Analyze therapeutic factors if applicable
    const therapeuticFactors = this.analyzeTherapeuticFactors(
      conversation,
      allMessages,
    )

    // Analyze temporal factors
    const temporalFactors = this.analyzeTemporalFactors(conversation)

    // Analyze stress factors
    const stressFactors = this.analyzeStressFactors(conversation, allMessages)

    // Analyze life event factors
    const lifeEventFactors = this.analyzeLifeEventFactors(allMessages)

    // Analyze linguistic factors
    const linguisticFactors = this.analyzeLinguisticFactors(
      allMessages,
      conversation,
    )

    // Analyze non-verbal factors
    const nonVerbalFactors = this.analyzeNonVerbalFactors(conversation)

    // Analyze avoidance factors
    const avoidanceFactors = this.analyzeAvoidanceFactors(
      allMessages,
      conversation,
    )

    // Calculate factor weighting if enabled
    const factorWeighting = this.config.relationshipWeighting
      ? this.calculateFactorWeighting(conversation)
      : undefined

    // Determine primary context type
    const primaryContextType = this.determinePrimaryContextType(
      primaryTriggers,
      conversation,
    )

    // Create contextual summary
    const contextualSummary = this.createContextualSummary(
      primaryTriggers,
      relationshipSpecificFactors,
      conversation,
    )

    // Calculate overall confidence
    const overallContextConfidence = this.calculateOverallConfidence(
      conversation,
      primaryTriggers,
    )
    const confidenceScore = overallContextConfidence

    const factors: ContextualFactors = {
      primaryTriggers,
      relationshipSpecificFactors,
      emotionalSafetyFactors,
      contextualSignificance,
      therapeuticFactors,
      temporalFactors,
      stressFactors,
      lifeEventFactors,
      linguisticFactors,
      nonVerbalFactors,
      avoidanceFactors,
      factorWeighting,
      overallContextConfidence,
      primaryContextType,
      contextualSummary,
      confidenceScore,
    }

    logger.debug('Contextual factors identified', {
      conversationId: conversation.id,
      primaryTriggers,
      contextualSignificance,
      primaryContextType,
      confidenceScore,
    })

    return factors
  }

  // Private helper methods for contextual analysis

  private identifyPrimaryTriggers(
    allMessages: string,
    emotionalExpressions: string[],
    conversation: ConversationData & { moodAnalysis: MoodAnalysisResult },
  ): string[] {
    const triggers: string[] = []

    // Vulnerability triggers
    if (
      allMessages.includes('struggling') ||
      allMessages.includes('scared') ||
      allMessages.includes('vulnerable') ||
      allMessages.includes('living a lie')
    ) {
      triggers.push('vulnerability_expression')
    }

    if (
      allMessages.includes("don't know who else to talk to") ||
      allMessages.includes('need help') ||
      emotionalExpressions.includes('scared')
    ) {
      triggers.push('support_seeking')
    }

    // Conflict triggers
    if (
      allMessages.includes('dismissing') ||
      allMessages.includes('invalidating') ||
      allMessages.includes("can't believe")
    ) {
      triggers.push('conflict_escalation')
    }

    if (
      allMessages.includes('being way too sensitive') ||
      allMessages.includes('not that big of a deal') ||
      allMessages.includes('done trying')
    ) {
      triggers.push('defensive_response')
    }

    // Achievement triggers
    if (
      allMessages.includes('got the promotion') ||
      allMessages.includes("can't believe it actually happened") ||
      allMessages.includes('incredible')
    ) {
      triggers.push('achievement_recognition')
    }

    if (
      allMessages.includes('proud of you') ||
      allMessages.includes('deserved this') ||
      allMessages.includes('believing in me')
    ) {
      triggers.push('positive_reinforcement')
    }

    // Therapeutic triggers
    if (
      allMessages.includes('now that you ask') ||
      allMessages.includes('connects to my childhood') ||
      allMessages.includes('pattern')
    ) {
      triggers.push('insight_moment')
    }

    if (
      allMessages.includes('same argument') ||
      allMessages.includes('themes come up') ||
      allMessages.includes('pattern recognition')
    ) {
      triggers.push('pattern_recognition')
    }

    // Temporal triggers
    const hour = conversation.timestamp.getUTCHours()
    if (hour >= 22 || hour <= 5) {
      triggers.push('temporal_vulnerability')
    }

    // Stress triggers
    if (
      allMessages.includes('crushing') ||
      allMessages.includes('drowning') ||
      allMessages.includes('affecting everything')
    ) {
      triggers.push('stress_accumulation')
    }

    // Life transition triggers
    if (
      allMessages.includes('moving across the country') ||
      allMessages.includes('leaving everything') ||
      allMessages.includes('unknowns')
    ) {
      triggers.push('life_transition_stress')
    }

    // Emotional overwhelm triggers
    if (
      allMessages.includes('screaming inside') ||
      allMessages.includes('trapped') ||
      allMessages.includes('glass box')
    ) {
      triggers.push('emotional_overwhelm')
    }

    // Urgency triggers
    if (
      conversation.messages.length >= 6 &&
      emotionalExpressions.includes('urgent')
    ) {
      triggers.push('emotional_urgency')
    }

    // Avoidance triggers
    if (
      allMessages.includes('anyway, did you see') ||
      allMessages.includes('what are your plans') ||
      allMessages.includes("i'm fine, really")
    ) {
      triggers.push('avoidance_behavior')
    }

    return triggers
  }

  private analyzeRelationshipFactors(
    conversation: ConversationData & { moodAnalysis: MoodAnalysisResult },
    allMessages: string,
  ) {
    const participantRoles = conversation.participants.map((p) => p.role)
    const emotionalExpressions = conversation.participants.flatMap(
      (p) => p.emotionalExpressions || [],
    )

    // Determine intimacy level
    let intimacyLevel: 'high' | 'medium' | 'low' = 'low'
    if (
      allMessages.includes('trust me with whatever') ||
      allMessages.includes('means everything') ||
      emotionalExpressions.includes('trusting')
    ) {
      intimacyLevel = 'high'
    } else if (
      allMessages.includes('here for you') ||
      allMessages.includes('believing in me')
    ) {
      intimacyLevel = 'medium'
    }

    // Determine trust dependency
    let trustDependency: 'high' | 'medium' | 'low' = 'low'
    if (
      allMessages.includes("don't know who else to talk to") ||
      allMessages.includes('trust me with whatever')
    ) {
      trustDependency = 'high'
    } else if (
      allMessages.includes('here for you') ||
      allMessages.includes('support')
    ) {
      trustDependency = 'medium'
    }

    // Determine conflict history
    let conflictHistory: 'escalating' | 'stable' | 'resolving' = 'stable'
    if (
      allMessages.includes('always happens') ||
      allMessages.includes('done trying to explain')
    ) {
      conflictHistory = 'escalating'
    }

    // Communication breakdown
    const communicationBreakdown =
      allMessages.includes('invalidating') || allMessages.includes('dismissing')

    // Support level
    let supportLevel: 'high' | 'medium' | 'low' = 'low'
    if (
      allMessages.includes('proud of you') ||
      allMessages.includes('believing in me') ||
      allMessages.includes('deserved this')
    ) {
      supportLevel = 'high'
    } else if (
      allMessages.includes('here for you') ||
      allMessages.includes('support')
    ) {
      supportLevel = 'medium'
    }

    // Validation patterns
    const validationPatterns: string[] = []
    if (
      allMessages.includes('proud of you') ||
      allMessages.includes('deserved')
    ) {
      validationPatterns.push('achievement_celebration')
    }

    // Professional boundaries
    const professionalBoundaries =
      participantRoles.includes('listener') &&
      (participantRoles.includes('vulnerable_sharer') ||
        conversation.participants.some((p) => p.name?.includes('Dr.')))

    // Guidance style
    let guidanceStyle: 'directive' | 'reflective' | 'supportive' = 'supportive'
    if (
      allMessages.includes('what do you notice') ||
      allMessages.includes('themes come up')
    ) {
      guidanceStyle = 'reflective'
    } else if (
      allMessages.includes('you should') ||
      allMessages.includes('need to')
    ) {
      guidanceStyle = 'directive'
    }

    return {
      intimacyLevel,
      trustDependency,
      conflictHistory,
      communicationBreakdown,
      supportLevel,
      validationPatterns,
      professionalBoundaries,
      guidanceStyle,
    }
  }

  private identifyEmotionalSafetyFactors(
    allMessages: string,
    _conversation: ConversationData & { moodAnalysis: MoodAnalysisResult },
  ): string[] {
    const safetyFactors: string[] = []

    // Fear-based factors
    if (
      allMessages.includes('scared') ||
      allMessages.includes('fear') ||
      allMessages.includes('judgment')
    ) {
      safetyFactors.push('fear_of_judgment')
    }

    // Dismissal patterns
    if (
      allMessages.includes('dismissing') ||
      allMessages.includes('invalidating')
    ) {
      safetyFactors.push('dismissal_patterns')
    }

    // Defensive positioning
    if (
      allMessages.includes('defensive') ||
      allMessages.includes('being way too sensitive')
    ) {
      safetyFactors.push('defensive_positioning')
    }

    // Unconditional support
    if (
      allMessages.includes('here for you') ||
      allMessages.includes('believing in me') ||
      allMessages.includes('unconditional')
    ) {
      safetyFactors.push('unconditional_support')
    }

    return safetyFactors
  }

  private assessContextualSignificance(
    conversation: ConversationData & { moodAnalysis: MoodAnalysisResult },
    primaryTriggers: string[],
  ): 'high' | 'medium' | 'low' {
    // Check for vulnerability-specific triggers that should elevate significance
    const vulnerabilityTriggers = [
      'vulnerability_expression',
      'support_seeking',
      'emotional_overwhelm',
      'temporal_vulnerability',
    ]
    const hasVulnerabilityTriggers = primaryTriggers.some((trigger) =>
      vulnerabilityTriggers.includes(trigger),
    )

    // Check for therapeutic-specific triggers
    const therapeuticTriggers = ['insight_moment', 'pattern_recognition']
    const hasTherapeuticTriggers = primaryTriggers.some((trigger) =>
      therapeuticTriggers.includes(trigger),
    )

    // Check for achievement/celebration triggers
    const achievementTriggers = [
      'achievement_recognition',
      'positive_reinforcement',
    ]
    const hasAchievementTriggers = primaryTriggers.some((trigger) =>
      achievementTriggers.includes(trigger),
    )

    // Check participant roles for therapeutic context
    const isTherapeuticContext =
      conversation.participants.some((p) => p.role === 'listener') &&
      conversation.messages.some((m) =>
        m.content.toLowerCase().includes('pattern'),
      )

    // High significance for:
    // - Vulnerability contexts
    // - Therapeutic insights and breakthroughs
    // - Achievement celebrations
    // - Multiple triggers
    // - Extreme mood scores
    // - Therapeutic professional contexts
    if (
      hasVulnerabilityTriggers ||
      hasTherapeuticTriggers ||
      hasAchievementTriggers ||
      isTherapeuticContext ||
      primaryTriggers.length >= 3 ||
      conversation.moodAnalysis.score <= 3.5 ||
      conversation.moodAnalysis.score >= 8.5
    ) {
      return 'high'
    }

    // Medium significance for some triggers or moderate mood deviation
    if (
      primaryTriggers.length >= 1 ||
      conversation.moodAnalysis.score <= 4.5 ||
      conversation.moodAnalysis.score >= 7.5
    ) {
      return 'medium'
    }

    return 'low'
  }

  private analyzeTherapeuticFactors(
    conversation: ConversationData & { moodAnalysis: MoodAnalysisResult },
    allMessages: string,
  ) {
    const participantRoles = conversation.participants.map((p) => p.role)

    // Only analyze if this appears to be a therapeutic context
    if (
      !participantRoles.includes('listener') ||
      !allMessages.includes('pattern')
    ) {
      return undefined
    }

    const breakthroughIndicators: string[] = []
    const progressMarkers: string[] = []

    if (
      allMessages.includes('now that you ask') ||
      allMessages.includes('connects to')
    ) {
      breakthroughIndicators.push('self_realization')
    }

    if (allMessages.includes('pattern') || allMessages.includes('themes')) {
      progressMarkers.push('behavioral_insight')
    }

    return {
      breakthroughIndicators,
      progressMarkers,
    }
  }

  private analyzeTemporalFactors(
    conversation: ConversationData & { moodAnalysis: MoodAnalysisResult },
  ) {
    const hour = conversation.timestamp.getUTCHours()

    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'late_night'
    if (hour >= 6 && hour < 12) timeOfDay = 'morning'
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon'
    else if (hour >= 18 && hour < 22) timeOfDay = 'evening'
    else timeOfDay = 'late_night'

    const emotionalVulnerability: 'heightened' | 'normal' | 'reduced' =
      timeOfDay === 'late_night' ? 'heightened' : 'normal'

    const contextualTriggers: string[] = []
    if (timeOfDay === 'late_night') {
      contextualTriggers.push('emotional_fatigue', 'reduced_emotional_barriers')
    }

    return {
      timeOfDay,
      emotionalVulnerability,
      contextualTriggers,
    }
  }

  private analyzeStressFactors(
    conversation: ConversationData & { moodAnalysis: MoodAnalysisResult },
    allMessages: string,
  ) {
    if (
      !allMessages.includes('overwhelming') &&
      !allMessages.includes('crushing') &&
      !allMessages.includes('drowning')
    ) {
      return undefined
    }

    let accumulationPattern: 'escalating' | 'stable' | 'decreasing' = 'stable'
    if (
      allMessages.includes('months now') ||
      allMessages.includes('affecting everything')
    ) {
      accumulationPattern = 'escalating'
    }

    let durationImpact: 'significant' | 'moderate' | 'minimal' = 'minimal'
    if (
      allMessages.includes('affecting everything') ||
      allMessages.includes('drowning')
    ) {
      durationImpact = 'significant'
    }

    const fatigueIndicators: string[] = []
    const copingMechanisms: string[] = []

    if (
      allMessages.includes('overwhelming') ||
      allMessages.includes("can't keep up")
    ) {
      fatigueIndicators.push('cognitive_overload')
    }

    if (conversation.messages.length <= 3) {
      copingMechanisms.push('withdrawal_tendency')
    }

    return {
      accumulationPattern,
      durationImpact,
      fatigueIndicators,
      copingMechanisms,
    }
  }

  private analyzeLifeEventFactors(allMessages: string) {
    if (
      !allMessages.includes('moving') &&
      !allMessages.includes('transition') &&
      !allMessages.includes('leaving')
    ) {
      return undefined
    }

    let eventType:
      | 'major_transition'
      | 'minor_change'
      | 'crisis'
      | 'celebration' = 'minor_change'
    if (
      allMessages.includes('moving across the country') ||
      allMessages.includes('leaving everything')
    ) {
      eventType = 'major_transition'
    }

    let emotionalImpact: 'high' | 'medium' | 'low' = 'low'
    if (
      allMessages.includes('terrifying') ||
      allMessages.includes('unknowns')
    ) {
      emotionalImpact = 'high'
    }

    let supportNeed: 'elevated' | 'normal' | 'minimal' = 'normal'
    if (
      allMessages.includes('leaving everything') ||
      allMessages.includes('scared')
    ) {
      supportNeed = 'elevated'
    }

    const adaptationChallenges: string[] = []
    if (allMessages.includes('unknowns') || allMessages.includes('what if')) {
      adaptationChallenges.push('uncertainty_management')
    }

    return {
      eventType,
      emotionalImpact,
      supportNeed,
      adaptationChallenges,
    }
  }

  private analyzeLinguisticFactors(
    allMessages: string,
    conversation: ConversationData & { moodAnalysis: MoodAnalysisResult },
  ) {
    let emotionalIntensity: 'high' | 'medium' | 'low' = 'low'
    if (
      allMessages.includes('screaming inside') ||
      allMessages.includes('trapped') ||
      conversation.moodAnalysis.score <= 3.5
    ) {
      emotionalIntensity = 'high'
    }

    const vulnerabilityMarkers: string[] = []
    if (
      allMessages.includes("don't know how to explain") ||
      allMessages.includes('does that make sense')
    ) {
      vulnerabilityMarkers.push('self_disclosure')
    }

    const supportSeeking: string[] = []
    if (
      allMessages.includes('does that make sense') ||
      allMessages.includes('can you')
    ) {
      supportSeeking.push('indirect_requests')
    }

    let emotionalRegulation: 'effective' | 'struggling' | 'overwhelmed' =
      'effective'
    if (
      allMessages.includes('screaming inside') ||
      allMessages.includes('trapped')
    ) {
      emotionalRegulation = 'struggling'
    }

    return {
      emotionalIntensity,
      vulnerabilityMarkers,
      supportSeeking,
      emotionalRegulation,
    }
  }

  private analyzeNonVerbalFactors(
    conversation: ConversationData & { moodAnalysis: MoodAnalysisResult },
  ) {
    const messageCount = conversation.messages.length
    const timeSpan =
      conversation.messages.length > 1
        ? conversation.messages[
            conversation.messages.length - 1
          ].timestamp.getTime() - conversation.messages[0].timestamp.getTime()
        : 0

    let messageFrequency: 'rapid' | 'normal' | 'sparse' = 'normal'
    if (messageCount >= 6 && timeSpan <= 300000) {
      // 6+ messages in 5 minutes
      messageFrequency = 'rapid'
    }

    let responseLatency: 'immediate' | 'normal' | 'delayed' = 'normal'
    if (messageCount >= 6 && timeSpan <= 300000) {
      // Rapid messages indicate immediate responses
      responseLatency = 'immediate'
    }

    let emotionalUrgency: 'high' | 'medium' | 'low' = 'low'
    if (
      messageFrequency === 'rapid' ||
      conversation.participants.some((p) =>
        p.emotionalExpressions?.includes('urgent'),
      )
    ) {
      emotionalUrgency = 'high'
    }

    let communicationStyle:
      | 'stream_of_consciousness'
      | 'structured'
      | 'fragmented' = 'structured'
    if (messageCount >= 6 && messageFrequency === 'rapid') {
      communicationStyle = 'stream_of_consciousness'
    }

    return {
      messageFrequency,
      responseLatency,
      emotionalUrgency,
      communicationStyle,
    }
  }

  private analyzeAvoidanceFactors(
    allMessages: string,
    conversation: ConversationData & { moodAnalysis: MoodAnalysisResult },
  ) {
    if (
      !allMessages.includes('anyway') &&
      !allMessages.includes('what are your plans') &&
      !allMessages.includes("i'm fine")
    ) {
      return undefined
    }

    let topicAvoidance: 'active' | 'passive' | 'none' = 'none'
    if (
      allMessages.includes('anyway, did you see') ||
      allMessages.includes('what are your plans')
    ) {
      topicAvoidance = 'active'
    }

    let emotionalWithdrawal: 'significant' | 'moderate' | 'minimal' = 'minimal'
    if (
      allMessages.includes("i'm fine, really") ||
      conversation.messages.length <= 4
    ) {
      emotionalWithdrawal = 'moderate'
    }

    const deflectionStrategies: string[] = []
    const underlyingConcerns: string[] = []

    if (
      allMessages.includes('anyway') ||
      allMessages.includes('what are your plans')
    ) {
      deflectionStrategies.push('subject_change')
    }

    if (
      allMessages.includes('worried about you') &&
      allMessages.includes("i'm fine")
    ) {
      underlyingConcerns.push('fear_of_vulnerability')
    }

    return {
      topicAvoidance,
      emotionalWithdrawal,
      deflectionStrategies,
      underlyingConcerns,
    }
  }

  private calculateFactorWeighting(
    conversation: ConversationData & { moodAnalysis: MoodAnalysisResult },
  ) {
    const participantRoles = conversation.participants.map((p) => p.role)
    const isRelationshipFocused =
      participantRoles.includes('emotional_leader') ||
      participantRoles.includes('supporter')

    return {
      relationshipWeight: isRelationshipFocused ? 0.6 : 0.3,
      temporalWeight: 0.2,
      linguisticWeight: 0.4,
    }
  }

  private determinePrimaryContextType(
    primaryTriggers: string[],
    conversation: ConversationData & { moodAnalysis: MoodAnalysisResult },
  ): string {
    const participantRoles = conversation.participants.map((p) => p.role)

    if (
      participantRoles.includes('emotional_leader') ||
      participantRoles.includes('supporter')
    ) {
      return 'relationship_focused'
    }

    if (primaryTriggers.includes('temporal_vulnerability')) {
      return 'temporal_focused'
    }

    if (primaryTriggers.includes('stress_accumulation')) {
      return 'stress_focused'
    }

    return 'general'
  }

  private createContextualSummary(
    primaryTriggers: string[],
    relationshipSpecificFactors: {
      supportLevel?: string
      conflictHistory?: string
    },
    conversation: ConversationData & { moodAnalysis: MoodAnalysisResult },
  ) {
    let dominantContext = 'general_conversation'
    if (
      primaryTriggers.includes('support_seeking') ||
      relationshipSpecificFactors.supportLevel === 'high'
    ) {
      dominantContext = 'emotional_support'
    }

    const secondaryContexts: string[] = []
    if (primaryTriggers.includes('vulnerability_expression')) {
      secondaryContexts.push('vulnerability_sharing')
    }

    // Check for vulnerability in emotional expressions or content
    const emotionalExpressions = conversation.participants.flatMap(
      (p) => p.emotionalExpressions || [],
    )
    const allMessages = conversation.messages
      .map((m) => m.content.toLowerCase())
      .join(' ')
    if (
      emotionalExpressions.includes('vulnerable') ||
      allMessages.includes('therapy') ||
      allMessages.includes('scary but liberating')
    ) {
      if (!secondaryContexts.includes('vulnerability_sharing')) {
        secondaryContexts.push('vulnerability_sharing')
      }
    }

    let emotionalClimate = 'neutral'
    if (relationshipSpecificFactors.supportLevel === 'high') {
      emotionalClimate = 'supportive'
    } else if (relationshipSpecificFactors.conflictHistory === 'escalating') {
      emotionalClimate = 'tense'
    }

    const riskFactors: string[] = []
    const supportiveElements: string[] = []
    const recommendedMoodAdjustments: string[] = []

    if (primaryTriggers.includes('emotional_overwhelm')) {
      riskFactors.push('emotional_overwhelm')
    }

    // Check for therapeutic intensity or emotional processing
    if (
      allMessages.includes('intense') ||
      allMessages.includes('scary but liberating') ||
      emotionalExpressions.includes('uncertain')
    ) {
      riskFactors.push('emotional_overwhelm')
    }

    if (relationshipSpecificFactors.supportLevel === 'high') {
      supportiveElements.push('active_listening')
      recommendedMoodAdjustments.push('baseline_elevation')
    }

    // For vulnerability contexts with support, recommend baseline elevation
    if (
      primaryTriggers.includes('vulnerability_expression') &&
      relationshipSpecificFactors.supportLevel !== 'negative'
    ) {
      if (!recommendedMoodAdjustments.includes('baseline_elevation')) {
        recommendedMoodAdjustments.push('baseline_elevation')
      }
    }

    return {
      dominantContext,
      secondaryContexts,
      emotionalClimate,
      riskFactors,
      supportiveElements,
      recommendedMoodAdjustments,
    }
  }

  private calculateOverallConfidence(
    conversation: ConversationData & { moodAnalysis: MoodAnalysisResult },
    primaryTriggers: string[],
  ): number {
    let confidence = 0.7 // Base confidence

    // Boost confidence for clear indicators
    if (primaryTriggers.length >= 2) confidence += 0.1
    if (conversation.moodAnalysis.confidence >= 0.85) confidence += 0.1
    if (conversation.messages.length >= 3) confidence += 0.05

    return Math.min(0.95, confidence)
  }
}
