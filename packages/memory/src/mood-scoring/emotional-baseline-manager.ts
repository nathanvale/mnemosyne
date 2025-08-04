import { createLogger } from '@studio/logger'

import type { ConversationData, MoodAnalysisResult } from '../types'

const logger = createLogger({
  tags: ['mood-scoring', 'emotional-baseline'],
})

/**
 * Configuration for emotional baseline management
 */
export interface EmotionalBaselineConfig {
  /** Minimum number of data points required for baseline establishment */
  minimumDataPoints: number
  /** Threshold for triggering baseline updates (0-1) */
  baselineUpdateThreshold: number
  /** Historical data depth in days */
  historicalDepth: number
}

/**
 * Individual emotional baseline profile
 */
export interface EmotionalBaseline {
  /** User identifier */
  userId: string
  /** Average mood score */
  averageMood: number
  /** Mood range statistics */
  moodRange: {
    min: number
    max: number
    spread: number
  }
  /** Number of data points used */
  dataPoints: number
  /** Confidence in baseline accuracy (0-1) */
  confidence: number
  /** When baseline was last updated */
  lastUpdated: Date
  /** Baseline version number */
  version: number
  /** Variation pattern analysis */
  variationPattern: {
    volatility: number
    cyclicalTendency: 'high' | 'medium' | 'low'
  }
  /** Temporal patterns */
  temporalPatterns: {
    timeOfDayPattern: {
      morning: number
      afternoon: number
      evening: number
      night: number
    }
    weeklyPattern: Record<string, number>
  }
  /** Relationship-specific patterns */
  relationshipPatterns: Record<
    string,
    {
      averageMood: number
      confidence: number
      dataPoints: number
    }
  >
  /** Update reason for versioning */
  updateReason?: string
}

/**
 * Mood deviation analysis result
 */
export interface DeviationAnalysis {
  /** Magnitude of deviation from baseline */
  deviationMagnitude: number
  /** Type of deviation */
  deviationType:
    | 'significant_decline'
    | 'significant_elevation'
    | 'normal_variation'
  /** Percentile rank compared to historical data */
  percentileRank: number
  /** Contextual significance level */
  contextualSignificance: 'high' | 'medium' | 'low'
  /** Recommended actions */
  recommendedAction: string[]
  /** Potential triggers for deviation */
  potentialTriggers?: string[]
  /** Assessment of mood sustainability */
  sustainabilityAssessment?: {
    likely: boolean
    factors: string[]
  }
}

/**
 * EmotionalBaselineManager establishes and maintains individual emotional baselines
 */
export class EmotionalBaselineManager {
  private readonly config: EmotionalBaselineConfig
  private baselines: Map<string, EmotionalBaseline> = new Map()

  constructor(config?: Partial<EmotionalBaselineConfig>) {
    this.config = {
      minimumDataPoints: 5,
      baselineUpdateThreshold: 0.3,
      historicalDepth: 30,
      ...config,
    }
  }

  // TDD: Start with methods that throw "Not implemented yet - TDD"

  establishBaseline(
    userId: string,
    historicalConversations: (ConversationData & {
      moodAnalysis: MoodAnalysisResult
    })[],
  ): EmotionalBaseline {
    logger.debug('Establishing emotional baseline', {
      userId,
      conversationCount: historicalConversations.length,
      minimumRequired: this.config.minimumDataPoints,
    })

    // Validate minimum data points
    if (historicalConversations.length < this.config.minimumDataPoints) {
      throw new Error('Insufficient data points for baseline establishment')
    }

    // Extract mood scores
    const moodScores = historicalConversations.map(
      (conv) => conv.moodAnalysis.score,
    )

    // Basic statistics
    const averageMood =
      moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length
    const min = Math.min(...moodScores)
    const max = Math.max(...moodScores)
    const spread = max - min

    // Calculate volatility (standard deviation)
    const variance =
      moodScores.reduce(
        (sum, score) => sum + Math.pow(score - averageMood, 2),
        0,
      ) / moodScores.length
    const volatility = Math.sqrt(variance)

    // Determine confidence based on data points and consistency
    const baseConfidence = Math.min(
      0.95,
      0.5 + historicalConversations.length / 20,
    )
    const consistencyFactor = Math.max(0.3, 1 - volatility / 5) // Lower volatility = higher confidence
    const confidence = baseConfidence * consistencyFactor

    // Analyze temporal patterns
    const temporalPatterns = this.analyzeTemporalPatterns(
      historicalConversations,
    )

    // Analyze relationship patterns
    const relationshipPatterns = this.analyzeRelationshipPatterns(
      historicalConversations,
    )

    // Determine cyclical tendency
    const cyclicalTendency: 'high' | 'medium' | 'low' =
      volatility > 2.0 ? 'high' : volatility > 1.0 ? 'medium' : 'low'

    const baseline: EmotionalBaseline = {
      userId,
      averageMood,
      moodRange: { min, max, spread },
      dataPoints: historicalConversations.length,
      confidence,
      lastUpdated: new Date(),
      version: 1,
      variationPattern: {
        volatility,
        cyclicalTendency,
      },
      temporalPatterns,
      relationshipPatterns,
    }

    // Store baseline
    this.baselines.set(userId, baseline)

    logger.debug('Baseline established', {
      userId,
      averageMood,
      confidence,
      volatility,
      dataPoints: historicalConversations.length,
    })

    return baseline
  }

  analyzeDeviation(
    userId: string,
    conversation: ConversationData & { moodAnalysis: MoodAnalysisResult },
  ): DeviationAnalysis {
    logger.debug('Analyzing mood deviation against baseline', {
      userId,
      conversationId: conversation.id,
    })

    const baseline = this.baselines.get(userId)
    if (!baseline) {
      throw new Error(`No baseline found for user ${userId}`)
    }

    const currentScore = conversation.moodAnalysis.score

    // Use relationship-specific baseline if available and applicable
    let comparisonBaseline = baseline.averageMood
    let comparisonVolatility = baseline.variationPattern.volatility

    const relationshipType = conversation.context?.relationshipType
    if (relationshipType && baseline.relationshipPatterns[relationshipType]) {
      const relationshipData = baseline.relationshipPatterns[relationshipType]
      comparisonBaseline = relationshipData.averageMood
      comparisonVolatility = baseline.variationPattern.volatility
      logger.debug('Using relationship-specific baseline', {
        relationshipType,
        comparisonBaseline,
        comparisonVolatility,
      })
    }

    const deviationMagnitude = Math.abs(currentScore - comparisonBaseline)

    // Calculate percentile rank
    // For simplicity, using normal distribution approximation
    const zScore =
      (currentScore - comparisonBaseline) / Math.max(0.5, comparisonVolatility)
    let percentileRank: number

    if (zScore > 0) {
      // Above average
      percentileRank = 50 + (zScore / 4) * 50 // Rough approximation
      percentileRank = Math.min(99, percentileRank)
    } else {
      // Below average
      percentileRank = 50 + (zScore / 4) * 50 // Rough approximation
      percentileRank = Math.max(1, percentileRank)
    }

    // Determine deviation type
    let deviationType: DeviationAnalysis['deviationType']
    if (deviationMagnitude >= 2.0) {
      deviationType =
        currentScore > comparisonBaseline
          ? 'significant_elevation'
          : 'significant_decline'
    } else {
      deviationType = 'normal_variation'
    }

    // Contextual significance
    const contextualSignificance: 'high' | 'medium' | 'low' =
      deviationMagnitude >= 2.0
        ? 'high'
        : deviationMagnitude >= 1.0
          ? 'medium'
          : 'low'

    // Recommended actions
    const recommendedAction: string[] = []
    if (deviationType === 'significant_decline') {
      recommendedAction.push(
        'monitor',
        'check_for_triggers',
        'consider_support',
      )
    } else if (deviationType === 'significant_elevation') {
      recommendedAction.push(
        'celebrate',
        'identify_positive_factors',
        'assess_sustainability',
      )
    } else {
      recommendedAction.push('continue_monitoring')
    }

    // Potential triggers and sustainability assessment
    const potentialTriggers =
      deviationType !== 'normal_variation'
        ? ['relationship_changes', 'life_events', 'environmental_factors']
        : undefined

    const sustainabilityAssessment =
      deviationType === 'significant_elevation'
        ? {
            likely: deviationMagnitude < 3.0, // More moderate elevations are more sustainable
            factors: [
              'baseline_consistency',
              'support_systems',
              'coping_mechanisms',
            ],
          }
        : undefined

    const analysis: DeviationAnalysis = {
      deviationMagnitude,
      deviationType,
      percentileRank,
      contextualSignificance,
      recommendedAction,
      potentialTriggers,
      sustainabilityAssessment,
    }

    logger.debug('Deviation analysis complete', {
      userId,
      deviationMagnitude,
      deviationType,
      percentileRank,
      contextualSignificance,
    })

    return analysis
  }

  shouldUpdateBaseline(
    userId: string,
    newConversations: (ConversationData & {
      moodAnalysis: MoodAnalysisResult
    })[],
  ): boolean {
    logger.debug('Evaluating baseline update necessity', {
      userId,
      newConversationCount: newConversations.length,
    })

    const baseline = this.baselines.get(userId)
    if (!baseline) {
      return false // Can't update non-existent baseline
    }

    // Calculate average of new conversations
    const newScores = newConversations.map((conv) => conv.moodAnalysis.score)
    const newAverage =
      newScores.reduce((sum, score) => sum + score, 0) / newScores.length

    // Check if the shift is significant
    const shiftMagnitude = Math.abs(newAverage - baseline.averageMood)
    const shouldUpdate = shiftMagnitude >= this.config.baselineUpdateThreshold

    logger.debug('Baseline update evaluation complete', {
      userId,
      currentAverage: baseline.averageMood,
      newAverage,
      shiftMagnitude,
      threshold: this.config.baselineUpdateThreshold,
      shouldUpdate,
    })

    return shouldUpdate
  }

  updateBaseline(
    userId: string,
    newConversations: (ConversationData & {
      moodAnalysis: MoodAnalysisResult
    })[],
  ): EmotionalBaseline {
    logger.debug('Updating baseline with new data', {
      userId,
      newConversationCount: newConversations.length,
    })

    const currentBaseline = this.baselines.get(userId)
    if (!currentBaseline) {
      throw new Error(
        `Cannot update baseline: no existing baseline found for user ${userId}`,
      )
    }

    // Combine with existing data (for weighted average)
    const existingWeight = currentBaseline.dataPoints
    const newWeight = newConversations.length
    const totalWeight = existingWeight + newWeight

    // Calculate weighted average
    const newScores = newConversations.map((conv) => conv.moodAnalysis.score)
    const newAverage =
      newScores.reduce((sum, score) => sum + score, 0) / newScores.length

    const updatedAverage =
      (currentBaseline.averageMood * existingWeight + newAverage * newWeight) /
      totalWeight

    // Recalculate range with new data
    // const allScores = [...newScores] // Could include historical scores but keeping simple for now
    const newMin = Math.min(currentBaseline.moodRange.min, ...newScores)
    const newMax = Math.max(currentBaseline.moodRange.max, ...newScores)
    const newSpread = newMax - newMin

    // Recalculate volatility
    const combinedVariance =
      (currentBaseline.variationPattern.volatility ** 2 * existingWeight +
        this.calculateVariance(newScores, newAverage) * newWeight) /
      totalWeight
    const newVolatility = Math.sqrt(combinedVariance)

    // Determine update reason based on the raw shift magnitude from new data
    const rawShiftMagnitude = Math.abs(newAverage - currentBaseline.averageMood)
    let updateReason = 'routine_update'
    if (rawShiftMagnitude >= 1.0) updateReason = 'significant_shift'
    if (rawShiftMagnitude >= 2.0) updateReason = 'major_shift'

    // Create updated baseline
    const updatedBaseline: EmotionalBaseline = {
      ...currentBaseline,
      averageMood: updatedAverage,
      moodRange: {
        min: newMin,
        max: newMax,
        spread: newSpread,
      },
      dataPoints: totalWeight,
      confidence: Math.min(0.95, currentBaseline.confidence + 0.05), // Slight confidence boost
      lastUpdated: new Date(),
      version: currentBaseline.version + 1,
      variationPattern: {
        volatility: newVolatility,
        cyclicalTendency:
          newVolatility > 2.0 ? 'high' : newVolatility > 1.0 ? 'medium' : 'low',
      },
      // Keep existing temporal and relationship patterns for now (could be updated with more complex logic)
      temporalPatterns: currentBaseline.temporalPatterns,
      relationshipPatterns: currentBaseline.relationshipPatterns,
      updateReason,
    }

    // Store updated baseline
    this.baselines.set(userId, updatedBaseline)

    logger.debug('Baseline updated successfully', {
      userId,
      oldAverage: currentBaseline.averageMood,
      newAverage: updatedAverage,
      version: updatedBaseline.version,
      updateReason,
    })

    return updatedBaseline
  }

  // Helper methods for baseline analysis

  private analyzeTemporalPatterns(
    conversations: (ConversationData & { moodAnalysis: MoodAnalysisResult })[],
  ) {
    const timeOfDayScores = {
      morning: [] as number[],
      afternoon: [] as number[],
      evening: [] as number[],
      night: [] as number[],
    }

    const weeklyScores: Record<string, number[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    }

    conversations.forEach((conv) => {
      const hour = conv.timestamp.getUTCHours() // Use UTC to match test data
      const dayName = conv.timestamp
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase()
      const score = conv.moodAnalysis.score

      // Time of day categorization
      if (hour >= 6 && hour < 12) timeOfDayScores.morning.push(score)
      else if (hour >= 12 && hour < 18) timeOfDayScores.afternoon.push(score)
      else if (hour >= 18 && hour < 22) timeOfDayScores.evening.push(score)
      else timeOfDayScores.night.push(score)

      // Weekly pattern
      if (!weeklyScores[dayName]) weeklyScores[dayName] = []
      weeklyScores[dayName].push(score)
    })

    // Calculate averages
    const timeOfDayPattern = {
      morning: this.calculateAverage(timeOfDayScores.morning),
      afternoon: this.calculateAverage(timeOfDayScores.afternoon),
      evening: this.calculateAverage(timeOfDayScores.evening),
      night: this.calculateAverage(timeOfDayScores.night),
    }

    const weeklyPattern: Record<string, number> = {}
    Object.keys(weeklyScores).forEach((day) => {
      weeklyPattern[day] = this.calculateAverage(weeklyScores[day])
    })

    return {
      timeOfDayPattern,
      weeklyPattern,
    }
  }

  private analyzeRelationshipPatterns(
    conversations: (ConversationData & { moodAnalysis: MoodAnalysisResult })[],
  ) {
    const relationshipScores: Record<string, number[]> = {}

    conversations.forEach((conv) => {
      const relationshipType = conv.context?.relationshipType || 'unknown'
      if (!relationshipScores[relationshipType]) {
        relationshipScores[relationshipType] = []
      }
      relationshipScores[relationshipType].push(conv.moodAnalysis.score)
    })

    const relationshipPatterns: Record<
      string,
      {
        averageMood: number
        confidence: number
        dataPoints: number
      }
    > = {}

    Object.keys(relationshipScores).forEach((type) => {
      const scores = relationshipScores[type]
      relationshipPatterns[type] = {
        averageMood: this.calculateAverage(scores),
        confidence: Math.min(0.9, 0.3 + scores.length / 10),
        dataPoints: scores.length,
      }
    })

    return relationshipPatterns
  }

  private calculateAverage(scores: number[]): number {
    if (scores.length === 0) return 5.0 // Neutral default
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  private calculateVariance(scores: number[], average: number): number {
    if (scores.length === 0) return 0
    return (
      scores.reduce((sum, score) => sum + Math.pow(score - average, 2), 0) /
      scores.length
    )
  }
}
