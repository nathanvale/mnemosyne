import { createLogger } from '@studio/logger'

import type { EmotionalAnalysis, MoodFactor } from '../types'

const logger = createLogger({
  tags: ['significance', 'salience-calculator'],
})

/**
 * SalienceCalculator calculates emotional salience scores
 * based on the intensity and impact of emotional content
 */
export class SalienceCalculator {
  /**
   * Calculate emotional salience from emotional analysis
   */
  async calculateSalience(
    emotionalAnalysis: EmotionalAnalysis,
  ): Promise<number> {
    logger.debug('Calculating emotional salience', {
      moodScore: emotionalAnalysis.moodScoring.score,
      factorCount: emotionalAnalysis.moodScoring.factors.length,
    })

    // Base salience on mood score magnitude (distance from neutral 5)
    const neutralDistance = Math.abs(emotionalAnalysis.moodScoring.score - 5)
    let salienceScore = neutralDistance

    // Factor in mood scoring confidence
    salienceScore *= emotionalAnalysis.moodScoring.confidence

    // Add intensity from emotional factors
    const factorIntensity = this.calculateFactorIntensity(
      emotionalAnalysis.moodScoring.factors,
    )
    salienceScore += factorIntensity * 2

    // Add pattern significance
    const patternSignificance = this.calculatePatternSignificance(
      emotionalAnalysis.patterns,
    )
    salienceScore += patternSignificance

    // Factor in trajectory volatility
    const trajectoryVolatility = this.assessTrajectoryVolatility(
      emotionalAnalysis.trajectory,
    )
    salienceScore += trajectoryVolatility

    // Normalize to 0-10 scale
    const finalScore = Math.min(10, Math.max(0, salienceScore))

    logger.info('Salience calculation complete', {
      neutralDistance,
      factorIntensity,
      patternSignificance,
      trajectoryVolatility,
      finalScore,
    })

    return finalScore
  }

  /**
   * Calculate intensity factor for high-impact emotions
   */
  calculateHighImpactEmotionBonus(emotions: string[]): number {
    const highImpactEmotions = [
      'grief',
      'devastated',
      'ecstatic',
      'furious',
      'terrified',
      'overjoyed',
      'heartbroken',
      'panic',
      'euphoric',
      'despair',
    ]

    const highImpactCount = emotions.filter((emotion) =>
      highImpactEmotions.some((high) => emotion.toLowerCase().includes(high)),
    ).length

    return Math.min(2, highImpactCount * 0.5)
  }

  /**
   * Calculate urgency factor based on emotional state
   */
  calculateEmotionalUrgency(
    moodScore: number,
    descriptors: string[],
    confidence: number,
  ): number {
    let urgency = 0

    // Crisis indicators
    const crisisDescriptors = ['desperate', 'hopeless', 'suicidal', 'crisis']
    const hasCrisisIndicators = descriptors.some((d) =>
      crisisDescriptors.some((crisis) => d.toLowerCase().includes(crisis)),
    )

    if (hasCrisisIndicators) {
      urgency += 3
    }

    // Very low mood with high confidence
    if (moodScore < 3 && confidence > 0.8) {
      urgency += 2
    }

    // Very high mood (potential mania)
    if (moodScore > 8.5 && confidence > 0.7) {
      urgency += 1.5
    }

    // Extreme emotional states
    const extremeDescriptors = ['extreme', 'overwhelming', 'intense']
    const hasExtremeDescriptors = descriptors.some((d) =>
      extremeDescriptors.some((extreme) => d.toLowerCase().includes(extreme)),
    )

    if (hasExtremeDescriptors) {
      urgency += 1
    }

    return urgency
  }

  /**
   * Assess contextual emotional weight
   */
  assessContextualWeight(context: string): number {
    let weight = 1.0

    // Relationship contexts increase emotional weight
    const relationshipContexts = [
      'relationship',
      'marriage',
      'family',
      'friend',
      'partner',
      'breakup',
      'divorce',
      'conflict',
      'support',
    ]

    const hasRelationshipContext = relationshipContexts.some((rel) =>
      context.toLowerCase().includes(rel),
    )

    if (hasRelationshipContext) {
      weight += 0.5
    }

    // Work/career contexts
    const workContexts = [
      'work',
      'job',
      'career',
      'boss',
      'colleague',
      'promotion',
    ]
    const hasWorkContext = workContexts.some((work) =>
      context.toLowerCase().includes(work),
    )

    if (hasWorkContext) {
      weight += 0.3
    }

    // Health contexts
    const healthContexts = [
      'health',
      'medical',
      'diagnosis',
      'treatment',
      'illness',
    ]
    const hasHealthContext = healthContexts.some((health) =>
      context.toLowerCase().includes(health),
    )

    if (hasHealthContext) {
      weight += 0.7
    }

    // Life transitions
    const transitionContexts = [
      'moving',
      'graduation',
      'retirement',
      'birth',
      'death',
    ]
    const hasTransitionContext = transitionContexts.some((transition) =>
      context.toLowerCase().includes(transition),
    )

    if (hasTransitionContext) {
      weight += 0.6
    }

    return Math.min(2.5, weight)
  }

  // Private helper methods

  private calculateFactorIntensity(factors: MoodFactor[]): number {
    if (factors.length === 0) return 0

    let totalIntensity = 0

    for (const factor of factors) {
      // Base intensity on evidence count and factor weight
      const evidenceIntensity = Math.min(factor.evidence.length / 3, 1)
      const weightedIntensity = evidenceIntensity * factor.weight

      // Bonus for high-impact factor types
      const typeBonus = this.getFactorTypeBonus(factor.type)
      const factorIntensity = weightedIntensity + typeBonus

      totalIntensity += factorIntensity
    }

    // Average intensity across factors
    return totalIntensity / factors.length
  }

  private getFactorTypeBonus(type: MoodFactor['type']): number {
    const typeBonuses: Record<MoodFactor['type'], number> = {
      emotional_words: 0.3,
      language_sentiment: 0.2,
      interaction_pattern: 0.1,
      context_clues: 0.2,
      sentiment_analysis: 0.25,
      psychological_indicators: 0.25,
      relationship_context: 0.15,
      conversational_flow: 0.15,
      historical_baseline: 0.1,
    }

    return typeBonuses[type] || 0
  }

  private calculatePatternSignificance(
    patterns: EmotionalAnalysis['patterns'],
  ): number {
    if (patterns.length === 0) return 0

    // Sum pattern significances weighted by confidence
    const weightedSignificance = patterns.reduce((sum, pattern) => {
      return sum + pattern.significance * pattern.confidence
    }, 0)

    // Average and scale
    return (weightedSignificance / patterns.length) * 2
  }

  private assessTrajectoryVolatility(
    trajectory: EmotionalAnalysis['trajectory'],
  ): number {
    if (trajectory.points.length < 3) return 0

    let volatility = 0

    // Calculate mood variance
    const scores = trajectory.points.map((p) => p.moodScore)
    const variance = this.calculateVariance(scores)
    volatility += Math.min(variance / 5, 1) // Normalize variance contribution

    // Factor in turning points
    const turningPointDensity =
      trajectory.turningPoints.length / trajectory.points.length
    volatility += turningPointDensity * 1.5

    // Factor in trajectory direction
    if (trajectory.direction === 'volatile') {
      volatility += 1
    } else if (trajectory.direction === 'declining') {
      volatility += 0.5
    }

    // Factor in overall trajectory significance
    volatility += trajectory.significance * 0.5

    return Math.min(3, volatility)
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
    return (
      numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) /
      numbers.length
    )
  }
}
