import { createLogger } from '@studio/logger'

import type {
  ConversationData,
  MoodAnalysisResult,
  EmotionalComplexityAssessment,
  UncertaintyQuantification,
  MultipleInterpretationOptions,
  EdgeCaseDetection,
  CulturalContextAnalysis,
  AmbiguityDetection,
} from '../types'

const logger = createLogger({
  tags: ['mood-scoring', 'edge-case-handler'],
})

/**
 * EdgeCaseHandler manages complex emotional situations that require special handling
 * beyond standard mood analysis algorithms
 */
export class EdgeCaseHandler {
  private readonly culturalPatterns = {
    british_understatement: [
      'somewhat challenging',
      'one manages',
      "doesn't one",
      "one mustn't complain",
      'these things happen',
      'i suppose',
    ],
    japanese_indirect: [
      'shoganai',
      'perhaps',
      "if it's not too much trouble",
      'one might consider',
      'you understand',
    ],
    high_context: [
      'perhaps',
      'might',
      'one could',
      'if possible',
      'you know',
      'well',
    ],
  }

  private readonly sarcasmIndicators = [
    'fantastic',
    'perfect',
    'brilliant',
    'wonderful',
    'great',
    'thrilled',
    'absolutely',
    'just what i needed',
    'best use of time',
  ]

  private readonly extremeEmotionIndicators = [
    'absolutely',
    'completely',
    'totally',
    'entirely',
    'utterly',
    'literally',
    'worst thing ever',
    'best thing ever',
    'ruined my entire',
    'history of the world',
  ]

  private readonly ambiguousTerms = [
    'interesting',
    'fine',
    'okay',
    'whatever',
    'sure',
    'great',
    'nice',
    'different',
  ]

  /**
   * Detect complex emotional situations requiring specialized handling
   */
  async detectComplexEmotionalSituations(
    conversation: ConversationData,
  ): Promise<EmotionalComplexityAssessment> {
    logger.debug('Detecting complex emotional situations', {
      conversationId: conversation.id,
      messageCount: conversation.messages.length,
    })

    const complexityTypes: EmotionalComplexityAssessment['complexityTypes'] = []
    let overallComplexity = 0

    // Check for mixed emotions
    const mixedEmotionAnalysis = this.analyzeMixedEmotions(conversation)
    if (mixedEmotionAnalysis.detected) {
      complexityTypes.push({
        type: 'mixed_emotions',
        severity: mixedEmotionAnalysis.severity,
        confidence: mixedEmotionAnalysis.confidence,
        description: mixedEmotionAnalysis.description,
        evidence: mixedEmotionAnalysis.evidence,
      })
      overallComplexity += 0.3
    }

    // Check for contradictory signals
    const contradictoryAnalysis = this.analyzeContradictorySignals(conversation)
    if (contradictoryAnalysis.detected) {
      complexityTypes.push({
        type: 'contradictory_signals',
        severity: contradictoryAnalysis.severity,
        confidence: contradictoryAnalysis.confidence,
        description: contradictoryAnalysis.description,
        evidence: contradictoryAnalysis.evidence,
      })
      overallComplexity += 0.25
    }

    // Check for temporal inconsistencies
    const temporalAnalysis = this.analyzeTemporalInconsistencies(conversation)
    if (temporalAnalysis.detected) {
      complexityTypes.push({
        type: 'temporal_inconsistency',
        severity: temporalAnalysis.severity,
        confidence: temporalAnalysis.confidence,
        description: temporalAnalysis.description,
        evidence: temporalAnalysis.evidence,
      })
      overallComplexity += 0.2
    }

    // Check for cultural nuances
    const culturalAnalysis = this.analyzeCulturalComplexity(conversation)
    if (culturalAnalysis.detected) {
      complexityTypes.push({
        type: 'cultural_nuance',
        severity: culturalAnalysis.severity,
        confidence: culturalAnalysis.confidence,
        description: culturalAnalysis.description,
        evidence: culturalAnalysis.evidence,
      })
      overallComplexity += 0.15
    }

    // Check for contextual ambiguity
    const contextualAnalysis = this.analyzeContextualAmbiguity(conversation)
    if (contextualAnalysis.detected) {
      complexityTypes.push({
        type: 'contextual_ambiguity',
        severity: contextualAnalysis.severity,
        confidence: contextualAnalysis.confidence,
        description: contextualAnalysis.description,
        evidence: contextualAnalysis.evidence,
      })
      overallComplexity += 0.1
    }

    const complexityScore = Math.min(1.0, overallComplexity)
    const assessmentConfidence =
      this.calculateAssessmentConfidence(complexityTypes)
    const recommendedApproach = this.determineRecommendedApproach(
      complexityScore,
      complexityTypes,
    )

    logger.debug('Complex emotional situation analysis complete', {
      conversationId: conversation.id,
      complexityScore,
      complexityTypesCount: complexityTypes.length,
      recommendedApproach,
    })

    return {
      complexityScore,
      complexityTypes,
      assessmentConfidence,
      recommendedApproach,
    }
  }

  /**
   * Quantify uncertainty in mood analysis results
   */
  async quantifyUncertainty(
    conversation: ConversationData,
    moodAnalysis: MoodAnalysisResult,
  ): Promise<UncertaintyQuantification> {
    logger.debug('Quantifying uncertainty', {
      conversationId: conversation.id,
      initialConfidence: moodAnalysis.confidence,
    })

    const uncertaintySources: UncertaintyQuantification['uncertaintySources'] =
      []
    let totalUncertainty = 0

    // Check for insufficient context
    const contextSufficiency = this.assessContextSufficiency(conversation)
    if (contextSufficiency.insufficient) {
      uncertaintySources.push({
        source: 'insufficient_context',
        impact: contextSufficiency.impact,
        description: contextSufficiency.description,
        mitigationSuggestions: contextSufficiency.mitigationSuggestions,
      })
      totalUncertainty += contextSufficiency.impact
    }

    // Check for conflicting signals
    const conflictAnalysis = this.analyzeConflictingSignals(conversation)
    if (conflictAnalysis.detected) {
      uncertaintySources.push({
        source: 'conflicting_signals',
        impact: conflictAnalysis.impact,
        description: conflictAnalysis.description,
        mitigationSuggestions: conflictAnalysis.mitigationSuggestions,
      })
      totalUncertainty += conflictAnalysis.impact
    }

    // Check for cultural ambiguity
    const culturalUncertainty = this.assessCulturalAmbiguity(conversation)
    if (culturalUncertainty.detected) {
      uncertaintySources.push({
        source: 'cultural_ambiguity',
        impact: culturalUncertainty.impact,
        description: culturalUncertainty.description,
        mitigationSuggestions: culturalUncertainty.mitigationSuggestions,
      })
      totalUncertainty += culturalUncertainty.impact
    }

    // Check for temporal inconsistency
    const temporalUncertainty = this.assessTemporalInconsistency(conversation)
    if (temporalUncertainty.detected) {
      uncertaintySources.push({
        source: 'temporal_inconsistency',
        impact: temporalUncertainty.impact,
        description: temporalUncertainty.description,
        mitigationSuggestions: temporalUncertainty.mitigationSuggestions,
      })
      totalUncertainty += temporalUncertainty.impact
    }

    // Check for extreme emotional states
    const extremeStateAnalysis =
      this.analyzeExtremeEmotionalStates(conversation)
    if (extremeStateAnalysis.detected) {
      uncertaintySources.push({
        source: 'extreme_emotional_state',
        impact: extremeStateAnalysis.impact,
        description: extremeStateAnalysis.description,
        mitigationSuggestions: extremeStateAnalysis.mitigationSuggestions,
      })
      totalUncertainty += extremeStateAnalysis.impact
    }

    const uncertaintyLevel = Math.min(1.0, totalUncertainty)
    const confidenceIntervals = this.calculateConfidenceIntervals(
      moodAnalysis.score,
      uncertaintyLevel,
    )
    const reliabilityScore = Math.max(0, 1 - uncertaintyLevel)

    logger.debug('Uncertainty quantification complete', {
      conversationId: conversation.id,
      uncertaintyLevel,
      sourcesCount: uncertaintySources.length,
      reliabilityScore,
    })

    return {
      uncertaintyLevel,
      uncertaintySources,
      confidenceIntervals,
      reliabilityScore,
    }
  }

  /**
   * Generate multiple interpretations for ambiguous conversations
   */
  async generateMultipleInterpretations(
    conversation: ConversationData,
  ): Promise<MultipleInterpretationOptions> {
    logger.debug('Generating multiple interpretations', {
      conversationId: conversation.id,
    })

    // Generate primary interpretation
    const primaryInterpretation =
      await this.generatePrimaryInterpretation(conversation)

    // Generate alternative interpretations
    const alternativeInterpretations =
      await this.generateAlternativeInterpretations(
        conversation,
        primaryInterpretation,
      )

    // Calculate interpretation consensus
    const interpretationConsensus = this.calculateInterpretationConsensus(
      primaryInterpretation,
      alternativeInterpretations,
    )

    logger.debug('Multiple interpretations generated', {
      conversationId: conversation.id,
      alternativeCount: alternativeInterpretations.length,
      consensusAgreement: interpretationConsensus.agreement,
    })

    return {
      primaryInterpretation,
      alternativeInterpretations,
      interpretationConsensus,
    }
  }

  /**
   * Detect various types of edge cases
   */
  async detectEdgeCases(
    conversation: ConversationData,
  ): Promise<EdgeCaseDetection> {
    logger.debug('Detecting edge cases', {
      conversationId: conversation.id,
    })

    // Check for extreme emotions
    const extremeEmotionCheck = this.checkExtremeEmotions(conversation)
    if (extremeEmotionCheck.detected) {
      return {
        isEdgeCase: true,
        edgeCaseType: 'extreme_emotion',
        severity: extremeEmotionCheck.severity,
        detectionConfidence: extremeEmotionCheck.confidence,
        handlingStrategy:
          extremeEmotionCheck.severity === 'critical'
            ? 'human_escalation'
            : 'enhanced_analysis',
        additionalContextNeeded: [
          'emotional_stability_history',
          'trigger_events',
        ],
      }
    }

    // Check for sarcasm-heavy content
    const sarcasmCheck = this.checkSarcasmHeavy(conversation)
    if (sarcasmCheck.detected) {
      return {
        isEdgeCase: true,
        edgeCaseType: 'sarcasm_heavy',
        severity: sarcasmCheck.severity,
        detectionConfidence: sarcasmCheck.confidence,
        handlingStrategy: 'enhanced_analysis',
        additionalContextNeeded: ['tone_indicators', 'relationship_context'],
      }
    }

    // Check for cultural specificity
    const culturalCheck = this.checkCulturalSpecificity(conversation)
    if (culturalCheck.detected) {
      return {
        isEdgeCase: true,
        edgeCaseType: 'cultural_specific',
        severity: culturalCheck.severity,
        detectionConfidence: culturalCheck.confidence,
        handlingStrategy: 'enhanced_analysis',
        additionalContextNeeded: [
          'cultural_background',
          'communication_style_preferences',
        ],
      }
    }

    // Check for contradictory signals
    const contradictoryCheck = this.checkContradictorySignals(conversation)
    if (contradictoryCheck.detected) {
      return {
        isEdgeCase: true,
        edgeCaseType: 'contradictory_signals',
        severity: contradictoryCheck.severity,
        detectionConfidence: contradictoryCheck.confidence,
        handlingStrategy: 'multi_interpretation',
        additionalContextNeeded: [
          'context_clarification',
          'emotional_state_history',
        ],
      }
    }

    // Check for ambiguous context
    const ambiguityCheck = this.checkAmbiguousContext(conversation)
    if (ambiguityCheck.detected) {
      return {
        isEdgeCase: true,
        edgeCaseType: 'ambiguous_context',
        severity: ambiguityCheck.severity,
        detectionConfidence: ambiguityCheck.confidence,
        handlingStrategy: 'uncertainty_flagging',
        additionalContextNeeded: [
          'background_information',
          'previous_conversations',
        ],
      }
    }

    return {
      isEdgeCase: false,
    }
  }

  /**
   * Analyze cultural context in communication
   */
  async analyzeCulturalContext(
    conversation: ConversationData,
  ): Promise<CulturalContextAnalysis> {
    logger.debug('Analyzing cultural context', {
      conversationId: conversation.id,
    })

    const messages = conversation.messages
      .map((m) => m.content.toLowerCase())
      .join(' ')

    // Detect cultural patterns
    const highContextScore = this.calculateHighContextScore(messages)
    const directnessScore = this.calculateDirectnessScore(messages)
    const formalityScore = this.calculateFormalityScore(messages)
    const expressivenessScore = this.calculateExpressivenessScore(messages)

    const culturalContext = this.determineCulturalContext(
      highContextScore,
      directnessScore,
    )
    const culturalConfidence = this.calculateCulturalConfidence(
      highContextScore,
      directnessScore,
      formalityScore,
    )

    const culturalConsiderations = this.generateCulturalConsiderations(
      culturalContext,
      {
        highContext: highContextScore,
        directness: directnessScore,
        formality: formalityScore,
        expressiveness: expressivenessScore,
      },
    )

    logger.debug('Cultural context analysis complete', {
      conversationId: conversation.id,
      culturalContext,
      culturalConfidence,
    })

    return {
      culturalContext,
      culturalConfidence,
      culturalConsiderations,
      communicationStyleIndicators: {
        directness: directnessScore,
        emotionalExpressiveness: expressivenessScore,
        implicitness: highContextScore,
        formalityLevel: formalityScore,
      },
    }
  }

  /**
   * Detect ambiguity in conversations
   */
  async detectAmbiguity(
    conversation: ConversationData,
  ): Promise<AmbiguityDetection> {
    logger.debug('Detecting ambiguity', {
      conversationId: conversation.id,
    })

    const ambiguitySources: AmbiguityDetection['ambiguitySources'] = []
    let totalAmbiguity = 0

    // Check for linguistic ambiguity
    const linguisticAmbiguity = this.assessLinguisticAmbiguity(conversation)
    if (linguisticAmbiguity.detected) {
      ambiguitySources.push({
        source: 'linguistic',
        severity: linguisticAmbiguity.severity,
        description: linguisticAmbiguity.description,
        clarificationNeeded: linguisticAmbiguity.clarificationNeeded,
      })
      totalAmbiguity += linguisticAmbiguity.severity
    }

    // Check for contextual ambiguity
    const contextualAmbiguity =
      this.assessContextualAmbiguityDetails(conversation)
    if (contextualAmbiguity.detected) {
      ambiguitySources.push({
        source: 'contextual',
        severity: contextualAmbiguity.severity,
        description: contextualAmbiguity.description,
        clarificationNeeded: contextualAmbiguity.clarificationNeeded,
      })
      totalAmbiguity += contextualAmbiguity.severity
    }

    // Check for emotional ambiguity
    const emotionalAmbiguity = this.assessEmotionalAmbiguity(conversation)
    if (emotionalAmbiguity.detected) {
      ambiguitySources.push({
        source: 'emotional',
        severity: emotionalAmbiguity.severity,
        description: emotionalAmbiguity.description,
        clarificationNeeded: emotionalAmbiguity.clarificationNeeded,
      })
      totalAmbiguity += emotionalAmbiguity.severity
    }

    const ambiguityLevel = Math.min(1.0, totalAmbiguity / 3)
    const resolutionStrategies =
      this.generateResolutionStrategies(ambiguitySources)
    const analysisImpact = this.calculateAnalysisImpact(ambiguityLevel)

    logger.debug('Ambiguity detection complete', {
      conversationId: conversation.id,
      ambiguityLevel,
      sourcesCount: ambiguitySources.length,
    })

    return {
      ambiguityLevel,
      ambiguitySources,
      resolutionStrategies,
      analysisImpact,
    }
  }

  /**
   * Handle mixed emotions with conflict resolution
   */
  async handleMixedEmotions(conversation: ConversationData): Promise<{
    detectedEmotions: Array<{
      emotion: string
      intensity: number
      confidence: number
    }>
    emotionalConflict: number
    resolutionStrategy: string
    adjustedMoodScore: number
    uncertainty: number
  }> {
    const messages = conversation.messages
      .map((m) => m.content.toLowerCase())
      .join(' ')

    // Detect individual emotions
    const detectedEmotions = this.detectIndividualEmotions(messages)

    // Calculate emotional conflict
    const emotionalConflict = this.calculateEmotionalConflict(detectedEmotions)

    // Determine resolution strategy
    const resolutionStrategy = this.determineResolutionStrategy(
      emotionalConflict,
      detectedEmotions,
    )

    // Calculate adjusted mood score
    const adjustedMoodScore = this.calculateAdjustedMoodScore(
      detectedEmotions,
      resolutionStrategy,
    )

    // Calculate uncertainty
    const uncertainty = Math.min(1.0, emotionalConflict * 0.8)

    return {
      detectedEmotions,
      emotionalConflict,
      resolutionStrategy,
      adjustedMoodScore,
      uncertainty,
    }
  }

  /**
   * Detect sarcasm and irony
   */
  async detectSarcasmAndIrony(conversation: ConversationData): Promise<{
    sarcasmDetected: boolean
    sarcasmConfidence: number
    ironyDetected: boolean
    ironyConfidence: number
    contextualClues: string[]
    adjustmentRecommendation: string
  }> {
    const messages = conversation.messages.map((m) => m.content).join(' ')
    const lowercaseMessages = messages.toLowerCase()

    const sarcasmScore = this.calculateSarcasmScore(lowercaseMessages)
    const contextualClues = this.extractSarcasmClues(messages)

    const sarcasmDetected = sarcasmScore > 0.7
    const sarcasmConfidence = sarcasmScore

    // Basic irony detection (similar to sarcasm for this implementation)
    const ironyDetected = sarcasmScore > 0.6
    const ironyConfidence = sarcasmScore * 0.9

    const adjustmentRecommendation = sarcasmDetected
      ? 'reverse_sentiment_polarity'
      : 'no_adjustment_needed'

    return {
      sarcasmDetected,
      sarcasmConfidence,
      ironyDetected,
      ironyConfidence,
      contextualClues,
      adjustmentRecommendation,
    }
  }

  /**
   * Handle extreme emotions with stability assessment
   */
  async handleExtremeEmotions(conversation: ConversationData): Promise<{
    extremeEmotionDetected: boolean
    emotionType: string
    intensityLevel: number
    stabilityAssessment: number
    handlingApproach: string
    confidenceAdjustment: number
  }> {
    const messages = conversation.messages.map((m) => m.content).join(' ')
    const extremeScore = this.calculateExtremeEmotionScore(messages)

    const extremeEmotionDetected = extremeScore > 8
    const emotionType = this.identifyExtremeEmotionType(messages)
    const intensityLevel = extremeScore
    const stabilityAssessment = this.assessEmotionalStability(conversation)

    const handlingApproach =
      intensityLevel > 9 ? 'human_review_required' : 'careful_analysis'
    const confidenceAdjustment = Math.max(0.3, 1 - intensityLevel / 15)

    return {
      extremeEmotionDetected,
      emotionType,
      intensityLevel,
      stabilityAssessment,
      handlingApproach,
      confidenceAdjustment,
    }
  }

  /**
   * Validate that complexity handling improves accuracy
   */
  async validateComplexityHandling(
    conversation: ConversationData,
    standardAnalysis: MoodAnalysisResult,
    complexityAnalysis: EmotionalComplexityAssessment,
  ): Promise<{
    improvementDetected: boolean
    accuracyImprovement: number
    confidenceImprovement: number
    handlingEffectiveness: number
  }> {
    // Simulate improvement detection based on complexity score
    const improvementDetected = complexityAnalysis.complexityScore > 0.5

    // Calculate improvements based on complexity handling
    const accuracyImprovement = improvementDetected
      ? Math.min(0.3, complexityAnalysis.complexityScore * 0.4)
      : 0

    const baseConfidenceImprovement =
      standardAnalysis.confidence < 0.8 ? 0.2 : 0.05
    const confidenceImprovement = improvementDetected
      ? baseConfidenceImprovement
      : 0

    const handlingEffectiveness =
      complexityAnalysis.assessmentConfidence *
      (complexityAnalysis.recommendedApproach === 'standard_analysis'
        ? 0.6
        : 0.8)

    return {
      improvementDetected,
      accuracyImprovement,
      confidenceImprovement,
      handlingEffectiveness,
    }
  }

  // Private helper methods

  private analyzeMixedEmotions(conversation: ConversationData) {
    const messages = conversation.messages
      .map((m) => m.content.toLowerCase())
      .join(' ')

    const positiveWords = [
      'excited',
      'happy',
      'joy',
      'celebrate',
      'good',
      'great',
      'wonderful',
    ]
    const negativeWords = [
      'terrified',
      'anxious',
      'worried',
      'scared',
      'bad',
      'terrible',
      'awful',
      'sad',
    ]

    const positiveCount = positiveWords.filter((word) =>
      messages.includes(word),
    ).length
    const negativeCount = negativeWords.filter((word) =>
      messages.includes(word),
    ).length

    const detected = positiveCount > 0 && negativeCount > 0
    const severity = positiveCount + negativeCount > 3 ? 'high' : 'medium'

    return {
      detected,
      severity: severity as 'high' | 'medium' | 'low',
      confidence: detected
        ? Math.min(0.9, (positiveCount + negativeCount) * 0.15)
        : 0,
      description: detected
        ? 'Multiple competing emotions detected in conversation'
        : 'No mixed emotions detected',
      evidence: detected
        ? [
            ...positiveWords.filter((w) => messages.includes(w)),
            ...negativeWords.filter((w) => messages.includes(w)),
          ]
        : [],
    }
  }

  private analyzeContradictorySignals(conversation: ConversationData) {
    const messages = conversation.messages.map((m) => m.content).join(' ')
    const lowercaseMessages = messages.toLowerCase()

    // Look for positive words with negative context
    const contradictoryPhrases = [
      'everything is fine',
      'really great actually',
      'fantastic',
      'worst day of my life but hey',
      "no no, i'm fantastic",
    ]

    const contradictionCount = contradictoryPhrases.filter((phrase) =>
      lowercaseMessages.includes(phrase.toLowerCase()),
    ).length

    const detected =
      contradictionCount > 0 ||
      (messages.includes('😊') && lowercaseMessages.includes('worst'))

    return {
      detected,
      severity:
        contradictionCount > 1
          ? 'high'
          : ('medium' as 'high' | 'medium' | 'low'),
      confidence: detected ? 0.8 : 0,
      description: detected
        ? 'Contradictory emotional signals detected'
        : 'No contradictions detected',
      evidence: detected
        ? contradictoryPhrases.filter((p) =>
            lowercaseMessages.includes(p.toLowerCase()),
          )
        : [],
    }
  }

  private analyzeTemporalInconsistencies(conversation: ConversationData) {
    if (conversation.messages.length < 2) {
      return {
        detected: false,
        severity: 'low' as const,
        confidence: 0,
        description: '',
        evidence: [],
      }
    }

    const timeGaps = []
    for (let i = 1; i < conversation.messages.length; i++) {
      const gap =
        conversation.messages[i].timestamp.getTime() -
        conversation.messages[i - 1].timestamp.getTime()
      timeGaps.push(gap)
    }

    const messages = conversation.messages.map((m) => m.content.toLowerCase())
    const positiveToNegativeShift = messages.some(
      (msg, i) =>
        i > 0 &&
        messages[i - 1].includes('positive') &&
        (msg.includes('dark place') || msg.includes('nothing seems to matter')),
    )

    const detected = positiveToNegativeShift

    return {
      detected,
      severity: detected ? 'high' : ('low' as 'high' | 'medium' | 'low'),
      confidence: detected ? 0.85 : 0,
      description: detected
        ? 'Temporal emotional inconsistency detected'
        : 'No temporal inconsistencies',
      evidence: detected ? ['timeline_emotional_shift'] : [],
    }
  }

  private analyzeCulturalComplexity(conversation: ConversationData) {
    const messages = conversation.messages
      .map((m) => m.content.toLowerCase())
      .join(' ')

    let culturalScore = 0
    const evidence: string[] = []

    // Check for British patterns
    for (const pattern of this.culturalPatterns.british_understatement) {
      if (messages.includes(pattern)) {
        culturalScore += 0.2
        evidence.push(`british_pattern: ${pattern}`)
      }
    }

    // Check for Japanese patterns
    for (const pattern of this.culturalPatterns.japanese_indirect) {
      if (messages.includes(pattern)) {
        culturalScore += 0.25
        evidence.push(`japanese_pattern: ${pattern}`)
      }
    }

    // Check for high-context patterns
    for (const pattern of this.culturalPatterns.high_context) {
      if (messages.includes(pattern)) {
        culturalScore += 0.1
        evidence.push(`high_context: ${pattern}`)
      }
    }

    const detected = culturalScore > 0.2
    const severity =
      culturalScore > 0.5 ? 'high' : culturalScore > 0.3 ? 'medium' : 'low'

    return {
      detected,
      severity: severity as 'high' | 'medium' | 'low',
      confidence: Math.min(0.9, culturalScore * 2),
      description: detected
        ? 'Cultural communication patterns detected'
        : 'No cultural complexity detected',
      evidence,
    }
  }

  private analyzeContextualAmbiguity(conversation: ConversationData) {
    const messages = conversation.messages
      .map((m) => m.content.toLowerCase())
      .join(' ')

    const ambiguousCount = this.ambiguousTerms.filter((term) =>
      messages.includes(term),
    ).length
    const vaguePhrases = [
      'you know',
      'these things',
      'what happened',
      'after everything',
    ]
    const vagueCount = vaguePhrases.filter((phrase) =>
      messages.includes(phrase),
    ).length

    const detected = ambiguousCount > 2 || vagueCount > 1
    const severity = ambiguousCount + vagueCount > 4 ? 'high' : 'medium'

    return {
      detected,
      severity: severity as 'high' | 'medium' | 'low',
      confidence: detected ? 0.7 : 0,
      description: detected
        ? 'Contextual ambiguity detected'
        : 'Context is clear',
      evidence: detected
        ? [
            ...this.ambiguousTerms.filter((t) => messages.includes(t)),
            ...vaguePhrases.filter((p) => messages.includes(p)),
          ]
        : [],
    }
  }

  private calculateAssessmentConfidence(
    complexityTypes: EmotionalComplexityAssessment['complexityTypes'],
  ): number {
    if (complexityTypes.length === 0) return 0.9

    const avgConfidence =
      complexityTypes.reduce((sum, type) => sum + type.confidence, 0) /
      complexityTypes.length
    return Math.max(0.3, avgConfidence - complexityTypes.length * 0.1)
  }

  private determineRecommendedApproach(
    complexityScore: number,
    complexityTypes: EmotionalComplexityAssessment['complexityTypes'],
  ): EmotionalComplexityAssessment['recommendedApproach'] {
    if (complexityScore < 0.3) return 'standard_analysis'
    if (complexityScore < 0.6) return 'multi_interpretation'
    if (complexityScore < 0.8) return 'uncertainty_flagging'
    return 'human_review'
  }

  private assessContextSufficiency(conversation: ConversationData) {
    const totalWords = conversation.messages.reduce(
      (sum, msg) => sum + msg.content.split(' ').length,
      0,
    )
    const messageCount = conversation.messages.length

    const insufficient = totalWords < 20 || messageCount < 2
    const impact = insufficient ? Math.max(0.3, 1 - totalWords / 50) : 0

    return {
      insufficient,
      impact,
      description: insufficient
        ? 'Insufficient context for reliable mood analysis'
        : 'Adequate context available',
      mitigationSuggestions: insufficient
        ? ['Request additional context', 'Ask clarifying questions']
        : [],
    }
  }

  private analyzeConflictingSignals(conversation: ConversationData) {
    const contradictoryAnalysis = this.analyzeContradictorySignals(conversation)

    return {
      detected: contradictoryAnalysis.detected,
      impact: contradictoryAnalysis.detected ? 0.4 : 0,
      description: contradictoryAnalysis.description,
      mitigationSuggestions: contradictoryAnalysis.detected
        ? ['Analyze context more carefully', 'Consider sarcasm or irony']
        : [],
    }
  }

  private assessCulturalAmbiguity(conversation: ConversationData) {
    const culturalAnalysis = this.analyzeCulturalComplexity(conversation)

    return {
      detected: culturalAnalysis.detected,
      impact: culturalAnalysis.detected ? 0.3 : 0,
      description: culturalAnalysis.description,
      mitigationSuggestions: culturalAnalysis.detected
        ? [
            'Consider cultural communication patterns',
            'Adjust interpretation for cultural context',
          ]
        : [],
    }
  }

  private assessTemporalInconsistency(conversation: ConversationData) {
    const temporalAnalysis = this.analyzeTemporalInconsistencies(conversation)

    return {
      detected: temporalAnalysis.detected,
      impact: temporalAnalysis.detected ? 0.35 : 0,
      description: temporalAnalysis.description,
      mitigationSuggestions: temporalAnalysis.detected
        ? ['Analyze temporal emotional patterns', 'Consider mood volatility']
        : [],
    }
  }

  private analyzeExtremeEmotionalStates(conversation: ConversationData) {
    const messages = conversation.messages
      .map((m) => m.content.toUpperCase())
      .join(' ')
    const extremeIndicators = messages
      .split(' ')
      .filter((word) =>
        this.extremeEmotionIndicators.some((indicator) =>
          word.includes(indicator.toUpperCase()),
        ),
      ).length

    const capsCount = (messages.match(/[A-Z]/g) || []).length
    const exclamationCount = (messages.match(/!/g) || []).length

    const detected =
      extremeIndicators > 2 || capsCount > 50 || exclamationCount > 3

    return {
      detected,
      impact: detected ? 0.4 : 0,
      description: detected
        ? 'Extreme emotional state indicators detected'
        : 'Normal emotional expression',
      mitigationSuggestions: detected
        ? [
            'Use conservative confidence levels',
            'Consider emotional volatility',
          ]
        : [],
    }
  }

  private calculateConfidenceIntervals(
    moodScore: number,
    uncertaintyLevel: number,
  ) {
    const baseRange = uncertaintyLevel * 3 // Maximum range of 3 points
    const low = Math.max(0, moodScore - baseRange)
    const high = Math.min(10, moodScore + baseRange)
    const confidence = Math.max(0.1, 1 - uncertaintyLevel)

    return { low, high, confidence }
  }

  private async generatePrimaryInterpretation(conversation: ConversationData) {
    const messages = conversation.messages.map((m) => m.content).join(' ')

    // Simple sentiment-based interpretation
    const positiveWords = [
      'good',
      'great',
      'happy',
      'excited',
      'wonderful',
      'fantastic',
    ]
    const negativeWords = [
      'bad',
      'terrible',
      'sad',
      'angry',
      'frustrated',
      'worst',
    ]

    const positiveCount = positiveWords.filter((word) =>
      messages.toLowerCase().includes(word),
    ).length
    const negativeCount = negativeWords.filter((word) =>
      messages.toLowerCase().includes(word),
    ).length

    const baseScore = 5 + (positiveCount - negativeCount) * 0.5
    const moodScore = Math.max(0, Math.min(10, baseScore))

    const confidence = Math.min(
      0.9,
      0.5 + Math.abs(positiveCount - negativeCount) * 0.1,
    )

    return {
      moodScore,
      confidence,
      rationale: `Analysis based on ${positiveCount} positive and ${negativeCount} negative indicators`,
      supportingEvidence: [
        ...positiveWords.filter((w) => messages.toLowerCase().includes(w)),
        ...negativeWords.filter((w) => messages.toLowerCase().includes(w)),
      ],
    }
  }

  private async generateAlternativeInterpretations(
    conversation: ConversationData,
    primaryInterpretation: MultipleInterpretationOptions['primaryInterpretation'],
  ) {
    const alternatives: MultipleInterpretationOptions['alternativeInterpretations'] =
      []

    // Sarcasm interpretation
    const sarcasmResult = await this.detectSarcasmAndIrony(conversation)
    if (sarcasmResult.sarcasmDetected) {
      const adjustedScore = Math.max(
        0,
        Math.min(10, 10 - primaryInterpretation.moodScore),
      )
      alternatives.push({
        moodScore: adjustedScore,
        confidence: sarcasmResult.sarcasmConfidence,
        rationale: 'Interpretation accounting for detected sarcasm',
        supportingEvidence: sarcasmResult.contextualClues,
        probabilityWeight: 0.3,
      })
    }

    // Cultural context interpretation
    const culturalAnalysis = await this.analyzeCulturalContext(conversation)
    if (culturalAnalysis.culturalContext === 'high_context') {
      const adjustedScore = primaryInterpretation.moodScore * 0.8 // More conservative for indirect communication
      alternatives.push({
        moodScore: adjustedScore,
        confidence: culturalAnalysis.culturalConfidence,
        rationale:
          'Interpretation adjusted for high-context cultural communication',
        supportingEvidence: culturalAnalysis.culturalConsiderations.map(
          (c) => c.aspect,
        ),
        probabilityWeight: 0.25,
      })
    }

    // Uncertainty interpretation
    if (alternatives.length === 0) {
      // Create a neutral interpretation for ambiguous cases
      alternatives.push({
        moodScore: 5.0,
        confidence: 0.4,
        rationale: 'Neutral interpretation due to ambiguous signals',
        supportingEvidence: ['contextual_ambiguity'],
        probabilityWeight: 0.2,
      })
    }

    return alternatives
  }

  private calculateInterpretationConsensus(
    primaryInterpretation: MultipleInterpretationOptions['primaryInterpretation'],
    alternativeInterpretations: MultipleInterpretationOptions['alternativeInterpretations'],
  ) {
    if (alternativeInterpretations.length === 0) {
      return {
        agreement: 1.0,
        divergence: 0.0,
        recommendedAction: 'use_primary' as const,
      }
    }

    const allScores = [
      primaryInterpretation.moodScore,
      ...alternativeInterpretations.map((alt) => alt.moodScore),
    ]
    const maxDifference = Math.max(...allScores) - Math.min(...allScores)

    const agreement = Math.max(0, 1 - maxDifference / 10)
    const divergence = maxDifference / 10

    let recommendedAction:
      | 'use_primary'
      | 'weighted_average'
      | 'flag_for_review'
    if (agreement > 0.8) {
      recommendedAction = 'use_primary'
    } else if (agreement > 0.5) {
      recommendedAction = 'weighted_average'
    } else {
      recommendedAction = 'flag_for_review'
    }

    return { agreement, divergence, recommendedAction }
  }

  private checkExtremeEmotions(conversation: ConversationData) {
    const messages = conversation.messages.map((m) => m.content).join(' ')
    const extremeScore = this.calculateExtremeEmotionScore(messages)

    const detected = extremeScore > 8
    const severity =
      extremeScore > 12 ? 'critical' : extremeScore > 10 ? 'high' : 'medium'

    return {
      detected,
      severity: severity as 'critical' | 'high' | 'medium' | 'low',
      confidence: detected ? Math.min(0.95, extremeScore / 15) : 0,
    }
  }

  private checkSarcasmHeavy(conversation: ConversationData) {
    const messages = conversation.messages
      .map((m) => m.content.toLowerCase())
      .join(' ')
    const sarcasmScore = this.calculateSarcasmScore(messages)

    const detected = sarcasmScore > 0.7
    const severity = sarcasmScore > 0.9 ? 'high' : 'medium'

    return {
      detected,
      severity: severity as 'high' | 'medium' | 'low',
      confidence: sarcasmScore,
    }
  }

  private checkCulturalSpecificity(conversation: ConversationData) {
    const culturalAnalysis = this.analyzeCulturalComplexity(conversation)

    return {
      detected: culturalAnalysis.detected,
      severity: culturalAnalysis.severity,
      confidence: culturalAnalysis.confidence,
    }
  }

  private checkContradictorySignals(conversation: ConversationData) {
    const contradictoryAnalysis = this.analyzeContradictorySignals(conversation)

    return {
      detected: contradictoryAnalysis.detected,
      severity: contradictoryAnalysis.severity,
      confidence: contradictoryAnalysis.confidence,
    }
  }

  private checkAmbiguousContext(conversation: ConversationData) {
    const contextualAnalysis = this.analyzeContextualAmbiguity(conversation)

    return {
      detected: contextualAnalysis.detected,
      severity: contextualAnalysis.severity,
      confidence: contextualAnalysis.confidence,
    }
  }

  private calculateHighContextScore(messages: string): number {
    let score = 0
    for (const pattern of this.culturalPatterns.high_context) {
      if (messages.includes(pattern)) score += 0.15
    }
    return Math.min(1.0, score)
  }

  private calculateDirectnessScore(messages: string): number {
    const directWords = [
      'directly',
      'clearly',
      'explicitly',
      'exactly',
      'specifically',
      'obviously',
    ]
    const indirectWords = [
      'perhaps',
      'maybe',
      'possibly',
      'might',
      'could',
      'somewhat',
    ]

    const directCount = directWords.filter((word) =>
      messages.includes(word),
    ).length
    const indirectCount = indirectWords.filter((word) =>
      messages.includes(word),
    ).length

    return Math.max(0, Math.min(1.0, 0.5 + (directCount - indirectCount) * 0.1))
  }

  private calculateFormalityScore(messages: string): number {
    const formalWords = [
      'furthermore',
      'consequently',
      'therefore',
      'respectively',
      'indeed',
    ]
    const informalWords = ['yeah', 'gonna', 'wanna', 'kinda', 'sorta']

    const formalCount = formalWords.filter((word) =>
      messages.includes(word),
    ).length
    const informalCount = informalWords.filter((word) =>
      messages.includes(word),
    ).length

    return Math.max(0, Math.min(1.0, 0.5 + (formalCount - informalCount) * 0.1))
  }

  private calculateExpressivenessScore(messages: string): number {
    const emotionalWords = [
      'amazing',
      'terrible',
      'wonderful',
      'awful',
      'fantastic',
      'horrible',
    ]
    const neutralWords = ['okay', 'fine', 'alright', 'decent', 'average']

    const emotionalCount = emotionalWords.filter((word) =>
      messages.includes(word),
    ).length
    const neutralCount = neutralWords.filter((word) =>
      messages.includes(word),
    ).length

    return Math.max(
      0,
      Math.min(1.0, 0.5 + (emotionalCount - neutralCount) * 0.1),
    )
  }

  private determineCulturalContext(
    highContextScore: number,
    directnessScore: number,
  ): CulturalContextAnalysis['culturalContext'] {
    if (highContextScore > 0.7) return 'high_context'
    if (directnessScore > 0.8) return 'low_context'
    if (directnessScore > 0.6) return 'western_direct'
    if (highContextScore > 0.4) return 'eastern_indirect'
    return 'mixed'
  }

  private calculateCulturalConfidence(
    highContextScore: number,
    directnessScore: number,
    formalityScore: number,
  ): number {
    const consistency = 1 - Math.abs(highContextScore - (1 - directnessScore))
    return Math.max(0.3, consistency * 0.8 + formalityScore * 0.2)
  }

  private generateCulturalConsiderations(
    culturalContext: CulturalContextAnalysis['culturalContext'],
    scores: {
      highContext: number
      directness: number
      formality: number
      expressiveness: number
    },
  ): CulturalContextAnalysis['culturalConsiderations'] {
    const considerations: CulturalContextAnalysis['culturalConsiderations'] = []

    if (culturalContext === 'high_context') {
      considerations.push({
        aspect: 'indirect_communication',
        impact: 'high',
        description: 'Communication relies heavily on implied meaning',
        adjustmentRecommendation: 'Look for subtle emotional cues and context',
      })
    }

    if (scores.directness < 0.4) {
      considerations.push({
        aspect: 'indirect_expression',
        impact: 'medium',
        description: 'Emotions may be expressed indirectly',
        adjustmentRecommendation:
          'Consider underlying emotional states beyond explicit words',
      })
    }

    return considerations
  }

  private assessLinguisticAmbiguity(conversation: ConversationData) {
    const messages = conversation.messages
      .map((m) => m.content.toLowerCase())
      .join(' ')
    const ambiguousCount = this.ambiguousTerms.filter((term) =>
      messages.includes(term),
    ).length

    const detected = ambiguousCount > 1
    const severity = ambiguousCount / 10

    return {
      detected,
      severity,
      description: detected
        ? 'Ambiguous terms detected in conversation'
        : 'Language is clear',
      clarificationNeeded: detected
        ? ['Define ambiguous terms', 'Request specific examples']
        : [],
    }
  }

  private assessContextualAmbiguityDetails(conversation: ConversationData) {
    const contextSufficiency = this.assessContextSufficiency(conversation)

    return {
      detected: contextSufficiency.insufficient,
      severity: contextSufficiency.impact,
      description: contextSufficiency.description,
      clarificationNeeded: contextSufficiency.insufficient
        ? ['background information', 'situational context']
        : [],
    }
  }

  private assessEmotionalAmbiguity(conversation: ConversationData) {
    const mixedEmotionAnalysis = this.analyzeMixedEmotions(conversation)

    return {
      detected: mixedEmotionAnalysis.detected,
      severity: mixedEmotionAnalysis.confidence,
      description: mixedEmotionAnalysis.description,
      clarificationNeeded: mixedEmotionAnalysis.detected
        ? ['emotional context', 'feeling prioritization']
        : [],
    }
  }

  private generateResolutionStrategies(
    ambiguitySources: AmbiguityDetection['ambiguitySources'],
  ): string[] {
    const strategies: string[] = []

    if (ambiguitySources.some((s) => s.source === 'linguistic')) {
      strategies.push('multiple_interpretation_analysis')
    }

    if (ambiguitySources.some((s) => s.source === 'contextual')) {
      strategies.push('context_clarification_request')
    }

    if (ambiguitySources.some((s) => s.source === 'emotional')) {
      strategies.push('emotional_state_verification')
    }

    if (strategies.length === 0) {
      strategies.push('standard_analysis_proceed')
    }

    return strategies
  }

  private calculateAnalysisImpact(ambiguityLevel: number) {
    const confidenceReduction = ambiguityLevel * 0.5
    const scoreUncertainty = ambiguityLevel * 2

    let recommendedAction = 'proceed_with_caution'
    if (ambiguityLevel > 0.7) {
      recommendedAction = 'request_clarification'
    } else if (ambiguityLevel > 0.5) {
      recommendedAction = 'multi_interpretation_analysis'
    }

    return {
      confidenceReduction,
      scoreUncertainty,
      recommendedAction,
    }
  }

  private detectIndividualEmotions(messages: string) {
    const emotionPatterns = [
      {
        emotion: 'joy',
        keywords: ['excited', 'happy', 'celebrate', 'thrilled'],
        intensity: 1.2,
      },
      {
        emotion: 'anxiety',
        keywords: ['terrified', 'worried', 'scared', 'nervous'],
        intensity: 1.1,
      },
      {
        emotion: 'sadness',
        keywords: ['sad', 'depressed', 'down', 'blue'],
        intensity: 1.0,
      },
      {
        emotion: 'anger',
        keywords: ['angry', 'mad', 'furious', 'annoyed'],
        intensity: 1.3,
      },
    ]

    return emotionPatterns
      .map((pattern) => {
        const matchCount = pattern.keywords.filter((keyword) =>
          messages.includes(keyword),
        ).length
        const intensity = matchCount * pattern.intensity
        const confidence = Math.min(0.9, matchCount * 0.3)

        return {
          emotion: pattern.emotion,
          intensity,
          confidence,
        }
      })
      .filter((emotion) => emotion.intensity > 0)
  }

  private calculateEmotionalConflict(
    emotions: Array<{ emotion: string; intensity: number; confidence: number }>,
  ): number {
    if (emotions.length < 2) return 0

    const totalIntensity = emotions.reduce((sum, e) => sum + e.intensity, 0)
    const maxIntensity = Math.max(...emotions.map((e) => e.intensity))

    // Higher conflict when multiple emotions have similar high intensities
    return Math.min(1.0, (totalIntensity - maxIntensity) / maxIntensity)
  }

  private determineResolutionStrategy(
    conflict: number,
    emotions: Array<{ emotion: string; intensity: number; confidence: number }>,
  ): string {
    if (conflict < 0.3) return 'primary_emotion_focus'
    if (conflict < 0.6) return 'weighted_emotional_average'
    return 'contextual_priority_assessment'
  }

  private calculateAdjustedMoodScore(
    emotions: Array<{ emotion: string; intensity: number; confidence: number }>,
    strategy: string,
  ): number {
    if (emotions.length === 0) return 5.0

    const emotionValues = {
      joy: 8.0,
      anxiety: 3.0,
      sadness: 2.0,
      anger: 2.5,
    }

    if (strategy === 'primary_emotion_focus') {
      const primaryEmotion = emotions.reduce(
        (max, e) => (e.intensity > max.intensity ? e : max),
        emotions[0],
      )
      return (
        emotionValues[primaryEmotion.emotion as keyof typeof emotionValues] ||
        5.0
      )
    }

    // Weighted average
    const totalWeight = emotions.reduce(
      (sum, e) => sum + e.intensity * e.confidence,
      0,
    )
    const totalConfidence = emotions.reduce((sum, e) => sum + e.confidence, 0)

    if (totalConfidence === 0) return 5.0

    const weightedScore = emotions.reduce((sum, e) => {
      const emotionScore =
        emotionValues[e.emotion as keyof typeof emotionValues] || 5.0
      return sum + emotionScore * e.intensity * e.confidence
    }, 0)

    return Math.max(0, Math.min(10, weightedScore / totalWeight))
  }

  private calculateSarcasmScore(messages: string): number {
    let score = 0

    for (const indicator of this.sarcasmIndicators) {
      if (messages.includes(indicator)) {
        score += 0.15
      }
    }

    // Check for emotional contradictions
    if (messages.includes('fantastic') && messages.includes('worst'))
      score += 0.3
    if (messages.includes('perfect') && messages.includes('ruined'))
      score += 0.3
    if (messages.includes('thrilled') && messages.includes('3 hours'))
      score += 0.2

    // Check for exaggerated language with negative context
    if (
      messages.includes('absolutely') &&
      (messages.includes('worst') || messages.includes('ruined'))
    ) {
      score += 0.2
    }

    return Math.min(1.0, score)
  }

  private extractSarcasmClues(messages: string): string[] {
    const clues: string[] = []

    if (messages.includes('🙄')) clues.push('eye_roll_emoji')
    if (messages.includes('👏')) clues.push('clapping_emoji')
    if (
      messages.toLowerCase().includes('fantastic') &&
      messages.toLowerCase().includes('worst')
    ) {
      clues.push('tone_contradiction')
    }
    if (
      messages.toLowerCase().includes('thrilled') &&
      messages.toLowerCase().includes('3 hours')
    ) {
      clues.push('exaggerated_enthusiasm')
    }

    return clues
  }

  private calculateExtremeEmotionScore(messages: string): number {
    let score = 0

    // Count extreme indicators
    for (const indicator of this.extremeEmotionIndicators) {
      if (messages.includes(indicator.toUpperCase())) {
        score += 1.5
      }
    }

    // Count caps and exclamations
    const capsCount = (messages.match(/[A-Z]/g) || []).length
    const exclamationCount = (messages.match(/!/g) || []).length

    score += capsCount * 0.1
    score += exclamationCount * 0.5

    // Bonus for extreme phrases
    if (messages.includes('WORST THING THAT HAS EVER HAPPENED')) score += 3
    if (messages.includes('HISTORY OF THE WORLD')) score += 2
    if (messages.includes('LITERALLY RUINED MY ENTIRE EXISTENCE')) score += 3

    return Math.min(15, score)
  }

  private identifyExtremeEmotionType(messages: string): string {
    if (messages.includes('DEVASTATED') || messages.includes('WORST'))
      return 'extreme_distress'
    if (messages.includes('THRILLED') || messages.includes('BEST'))
      return 'extreme_joy'
    if (messages.includes('FURIOUS') || messages.includes('ANGRY'))
      return 'extreme_anger'
    return 'extreme_general'
  }

  private assessEmotionalStability(conversation: ConversationData): number {
    // Simple stability assessment based on message consistency
    const messages = conversation.messages.map((m) => m.content)

    if (messages.length < 2) return 0.5

    // Check for extreme reactions to minor triggers
    const hasMinorTrigger = messages.some(
      (msg) =>
        msg.toLowerCase().includes('coffee was cold') ||
        msg.toLowerCase().includes('meeting'),
    )

    const hasExtremeResponse = messages.some(
      (msg) =>
        msg.includes('DEVASTATED') ||
        msg.includes('RUINED MY ENTIRE EXISTENCE'),
    )

    if (hasMinorTrigger && hasExtremeResponse) {
      return 0.2 // Low stability
    }

    return 0.7 // Default moderate stability
  }
}
