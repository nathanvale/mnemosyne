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

    // Enhanced mood-aware salience calculation
    const moodScore = emotionalAnalysis.moodScoring.score
    const confidence = emotionalAnalysis.moodScoring.confidence
    
    // Calculate base mood significance (0-10 scale)
    let baseMoodSignificance = this.calculateMoodSignificance(moodScore, confidence)
    
    // Factor in trajectory volatility first (can significantly boost significance)
    const trajectoryVolatility = this.assessTrajectoryVolatility(
      emotionalAnalysis.trajectory,
    )
    
    // If trajectory shows high significance, boost the base mood significance
    if (emotionalAnalysis.trajectory.significance > 0.8) {
      baseMoodSignificance = Math.max(baseMoodSignificance, 7.0) // Minimum high significance for major mood transitions
    } else if (emotionalAnalysis.trajectory.significance > 0.6) {
      baseMoodSignificance = Math.max(baseMoodSignificance, 5.5) // Moderate boost for medium transitions
    }
    
    baseMoodSignificance += trajectoryVolatility
    
    // Add emotional urgency for extreme states
    const emotionalUrgency = this.calculateEmotionalUrgency(
      moodScore,
      emotionalAnalysis.moodScoring.descriptors,
      confidence,
    )
    baseMoodSignificance += emotionalUrgency

    // Add high-impact emotion bonus
    const highImpactBonus = this.calculateHighImpactEmotionBonus(
      emotionalAnalysis.moodScoring.descriptors,
    )
    baseMoodSignificance += highImpactBonus

    // Factor in emotional factors with enhanced weighting
    const factorIntensity = this.calculateFactorIntensity(
      emotionalAnalysis.moodScoring.factors,
    )
    baseMoodSignificance += factorIntensity * 1.5

    // Add pattern significance
    const patternSignificance = this.calculatePatternSignificance(
      emotionalAnalysis.patterns,
    )
    baseMoodSignificance += patternSignificance

    // Normalize to 0-10 scale
    const finalScore = Math.min(10, Math.max(0, baseMoodSignificance))

    logger.info('Salience calculation complete', {
      moodScore,
      baseMoodSignificance: this.calculateMoodSignificance(moodScore, confidence),
      emotionalUrgency,
      highImpactBonus,
      factorIntensity,
      patternSignificance,
      trajectoryVolatility,
      finalScore,
    })

    return finalScore
  }

  /**
   * Calculate mood significance based on emotional intensity and extremity
   */
  private calculateMoodSignificance(moodScore: number, confidence: number): number {
    // Map mood scores to significance using a non-linear curve
    // Both very high (8.5+) and very low (3.5-) moods are highly significant
    let significance = 0
    
    if (moodScore >= 8.5) {
      // Very high mood (potential breakthrough, mania, extreme joy)
      significance = 7.0 + (moodScore - 8.5) * 2.0 // 7.0-10.0 range
    } else if (moodScore >= 7.0) {
      // High mood (celebration, achievement)
      significance = 5.61 + (moodScore - 7.0) * 1.4 // 5.61-7.61 range
    } else if (moodScore >= 6.0) {
      // Moderately positive mood - enhanced for complex emotional states
      significance = 4.0 + (moodScore - 6.0) * 2.0 // 4.0-6.0 range
    } else if (moodScore >= 4.0) {
      // Neutral-low mood - reduced significance for truly neutral range
      if (moodScore >= 4.8 && moodScore <= 5.5) {
        // Very neutral range - minimal significance
        significance = 1.5 + (moodScore - 4.8) * 0.5 // 1.5-1.85 range
      } else {
        significance = 2.0 + (moodScore - 4.0) * 0.75 // 2.0-3.5 range
      }
    } else if (moodScore >= 2.5) {
      // Low mood (distress, sadness)
      significance = 5.0 + (4.0 - moodScore) * 1.33 // 5.0-7.0 range (inverted)
    } else {
      // Very low mood (crisis, severe depression)
      significance = 7.0 + (2.5 - moodScore) * 2.0 // 7.0-10.0 range (inverted)
    }
    
    // Apply confidence weighting (but with minimum threshold)
    significance *= Math.max(0.6, confidence)
    
    return Math.min(10, Math.max(0, significance))
  }

  /**
   * Calculate intensity factor for high-impact emotions
   */
  calculateHighImpactEmotionBonus(emotions: string[]): number {
    // Check for truly neutral/calm emotions that should have low impact
    const neutralEmotions = ['neutral', 'calm', 'steady', 'stable']
    const hasNeutralEmotions = emotions.some((emotion) =>
      neutralEmotions.some((neutral) => emotion.toLowerCase().includes(neutral)),
    )
    
    // If this is a truly neutral emotional state, don't give high-impact bonus
    if (hasNeutralEmotions && emotions.length <= 2) {
      return 0
    }

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
      'joy',
      'celebration',
      'achievement',
      'crisis',
      'distress',
      'vulnerability',
      'vulnerable',
      'conflict',
      'breakthrough',
      'therapeutic',
      'complex',
      'multi-dimensional',
      'resilience',
      'insight',
      'depth',
    ]

    const highImpactCount = emotions.filter((emotion) =>
      highImpactEmotions.some((high) => 
        emotion.toLowerCase().includes(high) || high.toLowerCase().includes(emotion.toLowerCase())
      ),
    ).length

    return Math.min(2.5, highImpactCount * 0.6)
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

    // Crisis indicators get highest urgency boost
    const crisisDescriptors = ['desperate', 'hopeless', 'suicidal', 'crisis', 'distress']
    const hasCrisisIndicators = descriptors.some((d) =>
      crisisDescriptors.some((crisis) => d.toLowerCase().includes(crisis)),
    )

    if (hasCrisisIndicators) {
      urgency += 2.5
    }
    
    // Conflict in neutral-low mood states gets additional urgency
    const hasConflict = descriptors.some((d) => d.toLowerCase().includes('conflict'))
    if (hasConflict && moodScore < 5.0) {
      urgency += 1.5 // Conflict during low mood is emotionally urgent
    } else if (hasConflict) {
      urgency += 0.8 // General conflict is significant
    }
    
    // Vulnerability in low mood states gets special attention
    const hasVulnerability = descriptors.some((d) => d.toLowerCase().includes('vulnerable'))
    if (hasVulnerability && moodScore < 4.0) {
      urgency += 2.0 // Vulnerability in distressed states is highly significant
    } else if (hasVulnerability) {
      urgency += 1.0 // Vulnerability is always significant
    }

    // Positive extreme states also need attention (breakthrough, celebration)
    const positiveExtremeDescriptors = ['joy', 'celebration', 'achievement', 'breakthrough', 'ecstatic']
    const hasPositiveExtremes = descriptors.some((d) =>
      positiveExtremeDescriptors.some((positive) => d.toLowerCase().includes(positive)),
    )

    if (hasPositiveExtremes && moodScore > 7.5) {
      urgency += 1.5
    }

    // Very low mood with high confidence gets additional boost
    if (moodScore < 3.5 && confidence > 0.8) {
      urgency += 1.5
    }

    // Very high mood (potential mania or breakthrough)
    if (moodScore > 8.5 && confidence > 0.7) {
      urgency += 1.0
    }

    // Extreme emotional states
    const extremeDescriptors = ['extreme', 'overwhelming', 'intense']
    const hasExtremeDescriptors = descriptors.some((d) =>
      extremeDescriptors.some((extreme) => d.toLowerCase().includes(extreme)),
    )

    if (hasExtremeDescriptors) {
      urgency += 0.8
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
    let averageIntensity = totalIntensity / factors.length
    
    // Check if this is a truly neutral/minimal emotional state
    const hasNeutralEvidence = factors.some(f => 
      f.evidence.some(e => 
        ['neutral', 'calm', 'stable', 'steady'].some(neutral => 
          e.toLowerCase().includes(neutral)
        )
      )
    )
    
    if (hasNeutralEvidence) {
      // For truly neutral memories, significantly reduce intensity
      return Math.min(averageIntensity, 0.3)
    }
    
    // Bonus for multiple high-quality factors (compound emotional significance)
    if (factors.length >= 4) {
      const highQualityFactors = factors.filter(f => f.weight > 0.2 && f.evidence.length >= 1)
      if (highQualityFactors.length >= 3) {
        // Multiple quality factors indicate complex emotional processing
        const complexityBonus = Math.min((highQualityFactors.length - 2) * 0.3, 1.2)
        averageIntensity += complexityBonus
      }
    }
    
    return averageIntensity
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
    if (trajectory.points.length < 2) return 0

    let volatility = 0

    // Calculate mood variance (enhanced for 2+ points)
    const scores = trajectory.points.map((p) => p.moodScore)
    const variance = this.calculateVariance(scores)
    volatility += Math.min(variance / 3, 2) // More generous variance contribution
    
    // Calculate magnitude of mood change for 2-point trajectories
    if (trajectory.points.length === 2) {
      const moodChange = Math.abs(scores[1] - scores[0])
      volatility += Math.min(moodChange / 3, 2) // Significant mood changes get up to 2 points
    }

    // Factor in turning points with enhanced weighting
    const turningPointBonus = trajectory.turningPoints.reduce((sum, tp) => {
      return sum + Math.min(tp.magnitude / 2, 1.5) // Each turning point contributes based on magnitude
    }, 0)
    volatility += turningPointBonus

    // Factor in trajectory direction with enhanced significance
    if (trajectory.direction === 'volatile') {
      volatility += 1.5
    } else if (trajectory.direction === 'declining') {
      volatility += 1.0 // Declining is more significant than stable
    } else if (trajectory.direction === 'improving') {
      volatility += 0.8 // Improving is also significant
    }

    // Factor in overall trajectory significance with higher weight
    volatility += trajectory.significance * 1.5

    return Math.min(5, volatility) // Increased maximum volatility score
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
