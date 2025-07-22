import { createLogger } from '@studio/logger'

import type {
  ConversationData,
  ConversationMessage,
  MoodAnalysisResult,
  MoodFactor,
  EmotionalTrajectory,
  TrajectoryPoint,
} from '../types'

const logger = createLogger({
  tags: ['mood-scoring', 'analyzer'],
})

/**
 * Configuration for MoodScoringAnalyzer
 */
export interface MoodScoringAnalyzerConfig {
  /** Custom emotional keywords mapping */
  emotionalKeywords?: Map<string, { valence: number; intensity: number }>
  /** Custom contextual factors mapping */
  contextualFactors?: Map<string, number>
}

/**
 * MoodScoringAnalyzer performs comprehensive mood analysis on conversations
 * to extract emotional intelligence and mood scores
 */
export class MoodScoringAnalyzer {
  // Magic number constants
  private static readonly EVIDENCE_THRESHOLD_HIGH = 4
  private static readonly EVIDENCE_THRESHOLD_MEDIUM = 3
  private static readonly SCORE_HIGH = 7
  private static readonly SCORE_MEDIUM = 6
  private static readonly SCORE_LOW = 4
  private static readonly SCORE_NEUTRAL = 5
  private static readonly MAX_EVIDENCE_FOR_CONFIDENCE = 5

  private readonly emotionalKeywords: Map<
    string,
    { valence: number; intensity: number }
  >
  private readonly contextualFactors: Map<string, number>

  constructor(config?: MoodScoringAnalyzerConfig) {
    // Initialize emotional keyword mappings with configuration support
    this.emotionalKeywords =
      config?.emotionalKeywords ?? this.initializeEmotionalKeywords()
    this.contextualFactors =
      config?.contextualFactors ?? this.initializeContextualFactors()
  }

  /**
   * Analyze a conversation to extract mood scoring and emotional intelligence
   */
  async analyzeConversation(
    conversation: ConversationData,
  ): Promise<MoodAnalysisResult> {
    logger.debug('Analyzing conversation for mood scoring', {
      conversationId: conversation.id,
      messageCount: conversation.messages.length,
    })

    const messages = conversation.messages

    // Extract mood factors from different analysis dimensions
    const factors: MoodFactor[] = []

    // Language sentiment analysis
    const sentimentFactor = this.analyzeLanguageSentiment(messages)
    factors.push(sentimentFactor)

    // Emotional word analysis
    const emotionalWordsFactor = this.analyzeEmotionalWords(messages)
    factors.push(emotionalWordsFactor)

    // Context clues analysis
    const contextFactor = this.analyzeContextClues(
      messages,
      conversation.context,
    )
    factors.push(contextFactor)

    // Interaction pattern analysis
    const interactionFactor = this.analyzeInteractionPatterns(messages)
    factors.push(interactionFactor)

    // Calculate overall mood score
    const score = this.calculateWeightedMoodScore(factors)

    // Generate mood descriptors
    const descriptors = this.generateMoodDescriptors(score, factors)

    // Calculate confidence
    const confidence = this.calculateMoodConfidence(factors)

    const result: MoodAnalysisResult = {
      score,
      descriptors,
      confidence,
      factors,
    }

    logger.info('Mood analysis complete', {
      conversationId: conversation.id,
      score,
      confidence,
      descriptors,
    })

    return result
  }

  /**
   * Calculate mood score from a single message
   */
  async calculateMoodScore(
    content: string,
    context?: { previousScore?: number },
  ): Promise<number> {
    const words = content.toLowerCase().split(/\s+/)
    let totalValence = 0
    let totalIntensity = 0
    let wordCount = 0

    for (const word of words) {
      const emotional = this.emotionalKeywords.get(word)
      if (emotional) {
        totalValence += emotional.valence * emotional.intensity
        totalIntensity += emotional.intensity
        wordCount++
      }
    }

    if (wordCount === 0) {
      return context?.previousScore ?? 5.0
    }

    const averageValence = totalValence / totalIntensity
    // Convert from -1 to 1 range to 0-10 range
    const moodScore = (averageValence + 1) * 5

    // Apply smoothing if previous score exists
    if (context?.previousScore !== undefined) {
      return moodScore * 0.7 + context.previousScore * 0.3
    }

    return Math.max(0, Math.min(10, moodScore))
  }

  /**
   * Extract emotional descriptors from analysis
   */
  extractEmotionalDescriptors(result: MoodAnalysisResult): string[] {
    const descriptors: string[] = []

    // Add descriptors based on score ranges
    if (result.score >= 8) {
      descriptors.push('joyful', 'positive', 'uplifted')
    } else if (result.score >= 6.5) {
      descriptors.push('content', 'satisfied', 'calm')
    } else if (result.score >= 4.5) {
      descriptors.push('neutral', 'balanced', 'steady')
    } else if (result.score >= 3) {
      descriptors.push('concerned', 'unsettled', 'troubled')
    } else {
      descriptors.push('distressed', 'negative', 'struggling')
    }

    // Add descriptors from dominant factors
    const dominantFactor = result.factors.reduce((a, b) =>
      a.weight > b.weight ? a : b,
    )

    if (dominantFactor.type === 'emotional_words') {
      descriptors.push('emotionally-expressive')
    } else if (dominantFactor.type === 'interaction_pattern') {
      descriptors.push('socially-engaged')
    }

    return [...new Set(descriptors)].slice(0, 5)
  }

  /**
   * Assess confidence in mood analysis
   */
  assessConfidence(factors: MoodFactor[]): number {
    // Base confidence on evidence strength
    let totalEvidence = 0
    let totalWeight = 0

    for (const factor of factors) {
      const evidenceStrength = Math.min(
        factor.evidence.length /
          MoodScoringAnalyzer.MAX_EVIDENCE_FOR_CONFIDENCE,
        1,
      )
      totalEvidence += evidenceStrength * factor.weight
      totalWeight += factor.weight
    }

    const baseConfidence = totalWeight > 0 ? totalEvidence / totalWeight : 0.5

    // Adjust for factor agreement
    const scores = factors.map((f) => this.extractScoreFromFactor(f))
    const variance = this.calculateVariance(scores)
    const agreementMultiplier = Math.max(0.5, 1 - variance / 25)

    return Math.min(1, baseConfidence * agreementMultiplier)
  }

  /**
   * Analyze emotional trajectory over time
   */
  async analyzeEmotionalTrajectory(
    trajectoryPoints: TrajectoryPoint[],
  ): Promise<EmotionalTrajectory> {
    if (trajectoryPoints.length < 2) {
      return {
        points: trajectoryPoints,
        direction: 'stable',
        significance: 0.3,
        turningPoints: [],
      }
    }

    // Sort points by timestamp
    const sortedPoints = [...trajectoryPoints].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    )

    // Analyze overall direction
    const direction = this.determineTrajectoryDirection(sortedPoints)

    // Identify turning points
    const turningPoints = this.identifyTrajectoryTurningPoints(sortedPoints)

    // Calculate significance
    const significance = this.calculateTrajectorySignificance(
      sortedPoints,
      turningPoints,
    )

    return {
      points: sortedPoints,
      direction,
      significance,
      turningPoints: turningPoints.map((timestamp) => ({
        timestamp,
        type: 'breakthrough' as const,
        magnitude: 1.0,
        description: 'Emotional turning point detected',
        factors: ['mood_change'],
      })),
    }
  }

  /**
   * Recognize emotional patterns in the conversation
   */
  recognizePatterns(conversation: ConversationData): string[] {
    const patterns: string[] = []
    const messages = conversation.messages

    // Check for emotional escalation
    const moodScores = messages.map((m) => {
      const words = m.content.toLowerCase().split(/\s+/)
      let score = 0
      let count = 0
      for (const word of words) {
        const emotional = this.emotionalKeywords.get(word)
        if (emotional) {
          score += emotional.valence
          count++
        }
      }
      return count > 0 ? score / count : 0
    })

    // Check for escalation pattern
    let isEscalating = true
    for (let i = 1; i < moodScores.length; i++) {
      if (moodScores[i] <= moodScores[i - 1]) {
        isEscalating = false
        break
      }
    }

    if (isEscalating && moodScores.length > 2) {
      patterns.push('emotional_escalation')
    }

    // Check for recovery pattern
    const hasRecovery = moodScores.some((score, i) => {
      if (i < 2) return false
      return score > moodScores[i - 1] && moodScores[i - 1] < moodScores[i - 2]
    })

    if (hasRecovery) {
      patterns.push('emotional_recovery')
    }

    // Check for volatility
    const variance = this.calculateVariance(moodScores)
    if (variance > 1.5) {
      patterns.push('emotional_volatility')
    }

    // Check for sustained emotion
    const averageScore =
      moodScores.reduce((a, b) => a + b, 0) / moodScores.length
    const isConsistent = moodScores.every(
      (score) => Math.abs(score - averageScore) < 0.5,
    )

    if (isConsistent && Math.abs(averageScore) > 0.3) {
      patterns.push('sustained_emotion')
    }

    return patterns
  }

  /**
   * Build emotional trajectory from conversation data
   */
  buildEmotionalTrajectory(
    conversation: ConversationData,
  ): EmotionalTrajectory {
    const trajectoryPoints: TrajectoryPoint[] = []

    // Create trajectory points from messages
    for (let i = 0; i < conversation.messages.length; i++) {
      const message = conversation.messages[i]
      const moodScore = this.calculateMessageMoodScore(message.content)

      trajectoryPoints.push({
        timestamp: message.timestamp,
        moodScore,
        messageId: message.id,
        emotions: this.extractEmotionsFromScore(moodScore),
        context: `message ${i} by ${message.authorId}`,
      })
    }

    // Calculate overall direction
    const direction = this.determineTrajectoryDirection(trajectoryPoints)

    // Identify turning points
    const turningPoints = this.identifyTrajectoryTurningPoints(trajectoryPoints)

    // Calculate significance
    const significance = this.calculateTrajectorySignificance(
      trajectoryPoints,
      turningPoints,
    )

    return {
      points: trajectoryPoints,
      direction,
      significance,
      turningPoints: turningPoints.map((timestamp) => ({
        timestamp,
        type: 'breakthrough' as const,
        magnitude: 1.0,
        description: 'Emotional turning point detected',
        factors: ['mood_change'],
      })),
    }
  }

  private extractEmotionsFromScore(moodScore: number): string[] {
    const emotions: string[] = []

    if (moodScore >= 8.5) {
      emotions.push('joyful', 'positive')
    } else if (moodScore >= 7.5) {
      emotions.push('excited', 'enthusiastic')
    } else if (moodScore >= 6.5) {
      emotions.push('content', 'satisfied')
    } else if (moodScore >= 5.5) {
      emotions.push('neutral', 'calm')
    } else if (moodScore >= 4.5) {
      emotions.push('concerned', 'uncertain')
    } else if (moodScore >= 3.5) {
      emotions.push('frustrated', 'troubled')
    } else if (moodScore >= 2.5) {
      emotions.push('sad', 'disappointed')
    } else {
      emotions.push('distressed', 'struggling')
    }

    return emotions
  }

  private calculateMessageMoodScore(content: string): number {
    const words = content.toLowerCase().split(/\s+/)
    let totalValence = 0
    let totalIntensity = 0
    let wordCount = 0

    for (const word of words) {
      const emotional = this.emotionalKeywords.get(word)
      if (emotional) {
        totalValence += emotional.valence * emotional.intensity
        totalIntensity += emotional.intensity
        wordCount++
      }
    }

    if (wordCount === 0) {
      return 5.0 // Neutral
    }

    const averageValence = totalValence / totalIntensity
    // Convert from -1 to 1 range to 0-10 range
    return Math.max(0, Math.min(10, (averageValence + 1) * 5))
  }

  // Private helper methods

  private analyzeLanguageSentiment(
    messages: ConversationMessage[],
  ): MoodFactor {
    const evidence: string[] = []

    for (const message of messages) {
      const sentiment = this.calculateSentimentScore(message.content)

      if (Math.abs(sentiment) > 0.3) {
        evidence.push(`"${message.content.substring(0, 50)}..."`)
      }
    }

    return {
      type: 'language_sentiment',
      weight: 0.3,
      description: `Overall language sentiment analysis`,
      evidence: evidence.slice(0, 5),
    }
  }

  private analyzeEmotionalWords(messages: ConversationMessage[]): MoodFactor {
    const evidence: string[] = []
    const emotionalWords: string[] = []

    for (const message of messages) {
      const words = message.content.toLowerCase().split(/\s+/)
      for (const word of words) {
        if (this.emotionalKeywords.has(word)) {
          emotionalWords.push(word)
          if (evidence.length < 5) {
            evidence.push(`Emotional word "${word}" detected`)
          }
        }
      }
    }

    return {
      type: 'emotional_words',
      weight: 0.25,
      description: `Found ${emotionalWords.length} emotional words`,
      evidence,
    }
  }

  private analyzeContextClues(
    messages: ConversationMessage[],
    context?: ConversationData['context'],
  ): MoodFactor {
    const evidence: string[] = []

    // Analyze message timing patterns
    if (messages.length >= 2) {
      const firstTime = messages[0].timestamp.getTime()
      const lastTime = messages[messages.length - 1].timestamp.getTime()
      const duration = (lastTime - firstTime) / 1000 / 60 // minutes

      if (duration < 5) {
        evidence.push('Rapid message exchange suggests emotional intensity')
      } else if (duration > 60) {
        evidence.push('Extended conversation indicates deep engagement')
      }
    }

    // Check for questions and responses
    const questions = messages.filter((m) => m.content.includes('?')).length
    if (questions > messages.length * 0.3) {
      evidence.push('High question frequency suggests support-seeking')
    }

    // Analyze conversation context if available
    if (context) {
      if (context.conversationType === 'direct') {
        evidence.push('Direct conversation suggests personal connection')
      } else if (context.conversationType === 'group') {
        evidence.push('Group conversation may indicate social support context')
      }

      if (context.platform) {
        evidence.push(`Platform context: ${context.platform}`)
      }
    }

    return {
      type: 'context_clues',
      weight: 0.2,
      description: 'Contextual analysis of conversation patterns',
      evidence,
    }
  }

  private analyzeInteractionPatterns(
    messages: ConversationMessage[],
  ): MoodFactor {
    const evidence: string[] = []

    // Analyze turn-taking patterns
    const participantMessages = new Map<string, number>()
    for (const message of messages) {
      participantMessages.set(
        message.authorId,
        (participantMessages.get(message.authorId) || 0) + 1,
      )
    }

    const messageDistribution = Array.from(participantMessages.values())
    const isBalanced =
      Math.max(...messageDistribution) / Math.min(...messageDistribution) < 2

    if (isBalanced) {
      evidence.push('Balanced participation indicates healthy interaction')
    } else {
      evidence.push('Imbalanced participation may indicate support dynamics')
    }

    // Check for response patterns
    let consecutiveSameAuthor = 0
    let maxConsecutive = 0
    let lastAuthor = ''

    for (const message of messages) {
      if (message.authorId === lastAuthor) {
        consecutiveSameAuthor++
        maxConsecutive = Math.max(maxConsecutive, consecutiveSameAuthor)
      } else {
        consecutiveSameAuthor = 1
        lastAuthor = message.authorId
      }
    }

    if (maxConsecutive > 3) {
      evidence.push('Extended monologues detected')
    }

    return {
      type: 'interaction_pattern',
      weight: 0.25,
      description: 'Analysis of conversational interaction patterns',
      evidence,
    }
  }

  private calculateWeightedMoodScore(factors: MoodFactor[]): number {
    let weightedSum = 0
    let totalWeight = 0

    for (const factor of factors) {
      const factorScore = this.extractScoreFromFactor(factor)
      weightedSum += factorScore * factor.weight
      totalWeight += factor.weight
    }

    return totalWeight > 0
      ? Math.round((weightedSum / totalWeight) * 10) / 10
      : 5.0
  }

  private extractScoreFromFactor(factor: MoodFactor): number {
    // Extract implicit score from factor analysis
    // This is a simplified implementation
    switch (factor.type) {
      case 'language_sentiment':
        return factor.evidence.length >
          MoodScoringAnalyzer.EVIDENCE_THRESHOLD_MEDIUM
          ? MoodScoringAnalyzer.SCORE_HIGH
          : MoodScoringAnalyzer.SCORE_NEUTRAL
      case 'emotional_words':
        return factor.evidence.length >
          MoodScoringAnalyzer.EVIDENCE_THRESHOLD_HIGH
          ? MoodScoringAnalyzer.SCORE_MEDIUM
          : MoodScoringAnalyzer.SCORE_NEUTRAL
      case 'context_clues':
        return factor.evidence.some((e) => e.includes('support'))
          ? MoodScoringAnalyzer.SCORE_LOW
          : MoodScoringAnalyzer.SCORE_NEUTRAL
      case 'interaction_pattern':
        return factor.evidence.some((e) => e.includes('healthy'))
          ? MoodScoringAnalyzer.SCORE_MEDIUM
          : MoodScoringAnalyzer.SCORE_NEUTRAL
      default:
        return MoodScoringAnalyzer.SCORE_NEUTRAL
    }
  }

  private generateMoodDescriptors(
    score: number,
    factors: MoodFactor[],
  ): string[] {
    const descriptors: string[] = []

    // Score-based descriptors
    if (score >= 8) {
      descriptors.push('positive', 'uplifted')
    } else if (score >= 6.5) {
      descriptors.push('content', 'stable')
    } else if (score >= 4.5) {
      descriptors.push('neutral', 'balanced')
    } else if (score >= 3) {
      descriptors.push('concerned', 'unsettled')
    } else {
      descriptors.push('distressed', 'struggling')
    }

    // Factor-based descriptors
    for (const factor of factors) {
      if (factor.evidence.length > 3) {
        if (factor.type === 'emotional_words') {
          descriptors.push('expressive')
        } else if (factor.type === 'interaction_pattern') {
          descriptors.push('engaged')
        }
      }
    }

    return [...new Set(descriptors)].slice(0, 5)
  }

  private calculateMoodConfidence(factors: MoodFactor[]): number {
    const totalEvidence = factors.reduce((sum, f) => sum + f.evidence.length, 0)
    const averageEvidence = totalEvidence / factors.length

    // Base confidence on evidence quantity and factor agreement
    const evidenceConfidence = Math.min(
      averageEvidence / MoodScoringAnalyzer.MAX_EVIDENCE_FOR_CONFIDENCE,
      1,
    )

    // Check factor agreement
    const scores = factors.map((f) => this.extractScoreFromFactor(f))
    const variance = this.calculateVariance(scores)
    const agreementConfidence = Math.max(0, 1 - variance / 25)

    return (
      Math.round((evidenceConfidence * 0.6 + agreementConfidence * 0.4) * 100) /
      100
    )
  }

  private calculateSentimentScore(text: string): number {
    // Simplified sentiment calculation
    const words = text.toLowerCase().split(/\s+/)
    let sentiment = 0
    let count = 0

    for (const word of words) {
      const emotional = this.emotionalKeywords.get(word)
      if (emotional) {
        sentiment += emotional.valence
        count++
      }
    }

    return count > 0 ? sentiment / count : 0
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
    return (
      numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) /
      numbers.length
    )
  }

  private determineTrajectoryDirection(
    points: TrajectoryPoint[],
  ): EmotionalTrajectory['direction'] {
    if (points.length < 2) return 'stable'

    const firstHalf = points.slice(0, Math.floor(points.length / 2))
    const secondHalf = points.slice(Math.floor(points.length / 2))

    const firstAvg =
      firstHalf.reduce((sum, p) => sum + p.moodScore, 0) / firstHalf.length
    const secondAvg =
      secondHalf.reduce((sum, p) => sum + p.moodScore, 0) / secondHalf.length

    const difference = secondAvg - firstAvg
    const variance = this.calculateVariance(points.map((p) => p.moodScore))

    if (variance > 2) return 'volatile'
    if (difference > 1) return 'improving'
    if (difference < -1) return 'declining'
    return 'stable'
  }

  private identifyTrajectoryTurningPoints(
    points: TrajectoryPoint[],
  ): TrajectoryPoint['timestamp'][] {
    const turningPoints: TrajectoryPoint['timestamp'][] = []

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1].moodScore
      const curr = points[i].moodScore
      const next = points[i + 1].moodScore

      // Check for local extrema
      if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
        const magnitude = Math.abs(curr - prev) + Math.abs(curr - next)
        if (magnitude > 2) {
          turningPoints.push(points[i].timestamp)
        }
      }
    }

    return turningPoints
  }

  private calculateTrajectorySignificance(
    points: TrajectoryPoint[],
    turningPoints: TrajectoryPoint['timestamp'][],
  ): number {
    // Base significance on range and volatility
    const scores = points.map((p) => p.moodScore)
    const range = Math.max(...scores) - Math.min(...scores)
    const volatility = this.calculateVariance(scores)

    const rangeFactor = Math.min(range / 10, 1)
    const volatilityFactor = Math.min(volatility / 5, 1)
    const turningPointFactor = Math.min(turningPoints.length / points.length, 1)

    return rangeFactor * 0.4 + volatilityFactor * 0.3 + turningPointFactor * 0.3
  }

  private initializeEmotionalKeywords(): Map<
    string,
    { valence: number; intensity: number }
  > {
    const keywords = new Map<string, { valence: number; intensity: number }>()

    // Positive emotions
    keywords.set('happy', { valence: 0.8, intensity: 0.8 })
    keywords.set('joy', { valence: 0.9, intensity: 0.9 })
    keywords.set('excited', { valence: 0.7, intensity: 0.9 })
    keywords.set('grateful', { valence: 0.8, intensity: 0.7 })
    keywords.set('love', { valence: 0.9, intensity: 0.8 })
    keywords.set('proud', { valence: 0.7, intensity: 0.7 })
    keywords.set('content', { valence: 0.6, intensity: 0.5 })
    keywords.set('peaceful', { valence: 0.6, intensity: 0.4 })
    keywords.set('hope', { valence: 0.7, intensity: 0.6 })
    keywords.set('relief', { valence: 0.6, intensity: 0.7 })

    // Negative emotions
    keywords.set('sad', { valence: -0.7, intensity: 0.7 })
    keywords.set('angry', { valence: -0.8, intensity: 0.9 })
    keywords.set('frustrated', { valence: -0.7, intensity: 0.8 })
    keywords.set('anxious', { valence: -0.6, intensity: 0.8 })
    keywords.set('worried', { valence: -0.6, intensity: 0.7 })
    keywords.set('disappointed', { valence: -0.7, intensity: 0.6 })
    keywords.set('stressed', { valence: -0.7, intensity: 0.8 })
    keywords.set('lonely', { valence: -0.8, intensity: 0.7 })
    keywords.set('fear', { valence: -0.8, intensity: 0.9 })
    keywords.set('hate', { valence: -0.9, intensity: 0.9 })

    // Complex emotions
    keywords.set('confused', { valence: -0.3, intensity: 0.6 })
    keywords.set('overwhelmed', { valence: -0.5, intensity: 0.9 })
    keywords.set('nostalgic', { valence: 0.2, intensity: 0.6 })
    keywords.set('bittersweet', { valence: 0.1, intensity: 0.7 })

    return keywords
  }

  private initializeContextualFactors(): Map<string, number> {
    const factors = new Map<string, number>()

    // Support indicators
    factors.set('help', 0.7)
    factors.set('support', 0.8)
    factors.set('there for you', 0.9)
    factors.set('understand', 0.7)
    factors.set('listen', 0.6)

    // Conflict indicators
    factors.set('argument', -0.7)
    factors.set('fight', -0.8)
    factors.set('disagree', -0.5)
    factors.set('upset with', -0.6)

    return factors
  }
}
