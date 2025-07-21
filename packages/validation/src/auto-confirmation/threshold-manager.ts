import type { ThresholdConfig, ValidationFeedback, ThresholdUpdate } from '../types'

import { DEFAULT_THRESHOLD_CONFIG } from '../config/defaults'

/**
 * Manages and updates auto-confirmation thresholds based on feedback
 */
export class ThresholdManager {
  private config: ThresholdConfig

  constructor(initialConfig?: ThresholdConfig) {
    this.config = initialConfig || { ...DEFAULT_THRESHOLD_CONFIG }
  }

  /**
   * Get current threshold configuration
   */
  getConfig(): ThresholdConfig {
    return { ...this.config }
  }

  /**
   * Update threshold configuration
   */
  setConfig(config: ThresholdConfig): void {
    this.config = { ...config }
  }

  /**
   * Calculate threshold updates based on validation feedback
   */
  calculateThresholdUpdate(feedback: ValidationFeedback[]): ThresholdUpdate {
    if (feedback.length === 0) {
      return {
        previousThresholds: this.getConfig(),
        recommendedThresholds: this.getConfig(),
        updateReasons: ['No feedback provided'],
        expectedAccuracyImprovement: 0,
      }
    }

    const analysis = this.analyzeFeedback(feedback)
    const recommendedThresholds = this.calculateNewThresholds(analysis)
    const updateReasons = this.generateUpdateReasons(analysis)
    const expectedImprovement = this.estimateAccuracyImprovement(analysis, recommendedThresholds)

    return {
      previousThresholds: this.getConfig(),
      recommendedThresholds,
      updateReasons,
      expectedAccuracyImprovement: expectedImprovement,
    }
  }

  /**
   * Analyze feedback to identify patterns
   */
  private analyzeFeedback(feedback: ValidationFeedback[]): FeedbackAnalysis {
    const analysis: FeedbackAnalysis = {
      totalFeedback: feedback.length,
      correctDecisions: 0,
      falsePositives: 0,
      falseNegatives: 0,
      averageConfidenceByDecision: {
        'auto-approve': { sum: 0, count: 0 },
        'needs-review': { sum: 0, count: 0 },
        'auto-reject': { sum: 0, count: 0 },
      },
      factorPerformance: {
        claudeConfidence: { correct: 0, total: 0 },
        emotionalCoherence: { correct: 0, total: 0 },
        relationshipAccuracy: { correct: 0, total: 0 },
        temporalConsistency: { correct: 0, total: 0 },
        contentQuality: { correct: 0, total: 0 },
      },
    }

    for (const item of feedback) {
      const { originalResult, humanDecision } = item
      const decision = originalResult.decision

      // Track confidence by decision type
      analysis.averageConfidenceByDecision[decision].sum += originalResult.confidence
      analysis.averageConfidenceByDecision[decision].count += 1

      // Determine if the decision was correct
      const wasCorrect = this.wasDecisionCorrect(decision, humanDecision)
      if (wasCorrect) {
        analysis.correctDecisions += 1
      } else {
        if (decision === 'auto-approve' && humanDecision !== 'validated') {
          analysis.falsePositives += 1
        } else if (decision === 'auto-reject' && humanDecision === 'validated') {
          analysis.falseNegatives += 1
        }
      }

      // Track factor performance
      this.updateFactorPerformance(analysis.factorPerformance, originalResult.confidenceFactors, wasCorrect)
    }

    // Calculate averages
    for (const decision of Object.keys(analysis.averageConfidenceByDecision) as Array<keyof typeof analysis.averageConfidenceByDecision>) {
      const data = analysis.averageConfidenceByDecision[decision]
      if (data.count > 0) {
        data.sum = data.sum / data.count
      }
    }

    return analysis
  }

  /**
   * Check if auto-confirmation decision matched human decision
   */
  private wasDecisionCorrect(autoDecision: string, humanDecision: string): boolean {
    switch (autoDecision) {
      case 'auto-approve':
        return humanDecision === 'validated'
      case 'auto-reject':
        return humanDecision === 'rejected'
      case 'needs-review':
        // Needs-review is always "correct" as it defers to human judgment
        return true
      default:
        return false
    }
  }

  /**
   * Update factor performance tracking
   */
  private updateFactorPerformance(
    performance: FeedbackAnalysis['factorPerformance'],
    factors: Record<string, number>,
    wasCorrect: boolean
  ): void {
    for (const [factor, value] of Object.entries(factors)) {
      if (factor in performance) {
        performance[factor as keyof typeof performance].total += 1
        if (wasCorrect && value > 0.7) {
          // Factor contributed positively to correct decision
          performance[factor as keyof typeof performance].correct += 1
        }
      }
    }
  }

  /**
   * Calculate new thresholds based on analysis
   */
  private calculateNewThresholds(analysis: FeedbackAnalysis): ThresholdConfig {
    const newConfig = { ...this.config }

    // Adjust approval threshold based on false positive rate
    const falsePositiveRate = analysis.falsePositives / analysis.totalFeedback
    if (falsePositiveRate > 0.05) {
      // Too many false positives, increase threshold
      newConfig.autoApproveThreshold = Math.min(0.95, this.config.autoApproveThreshold + 0.05)
    } else if (falsePositiveRate < 0.02 && analysis.correctDecisions / analysis.totalFeedback > 0.9) {
      // Very few false positives and high accuracy, can lower threshold slightly
      newConfig.autoApproveThreshold = Math.max(0.65, this.config.autoApproveThreshold - 0.02)
    }

    // Adjust rejection threshold based on false negative rate
    const falseNegativeRate = analysis.falseNegatives / analysis.totalFeedback
    if (falseNegativeRate > 0.05) {
      // Too many false negatives, lower threshold
      newConfig.autoRejectThreshold = Math.max(0.3, this.config.autoRejectThreshold - 0.05)
    }

    // Adjust weights based on factor performance
    const newWeights = { ...this.config.weights }
    let totalWeight = 0

    for (const [factor, performance] of Object.entries(analysis.factorPerformance)) {
      if (performance.total > 0) {
        const accuracy = performance.correct / performance.total
        // Increase weight for high-performing factors
        if (accuracy > 0.8) {
          newWeights[factor as keyof typeof newWeights] *= 1.1
        } else if (accuracy < 0.5) {
          // Decrease weight for poor-performing factors
          newWeights[factor as keyof typeof newWeights] *= 0.9
        }
      }
      totalWeight += newWeights[factor as keyof typeof newWeights]
    }

    // Normalize weights to sum to 1
    for (const factor of Object.keys(newWeights) as Array<keyof typeof newWeights>) {
      newWeights[factor] = newWeights[factor] / totalWeight
    }

    newConfig.weights = newWeights

    return newConfig
  }

  /**
   * Generate human-readable reasons for threshold updates
   */
  private generateUpdateReasons(analysis: FeedbackAnalysis): string[] {
    const reasons: string[] = []

    const accuracy = analysis.correctDecisions / analysis.totalFeedback
    reasons.push(`Current accuracy: ${(accuracy * 100).toFixed(1)}%`)

    const falsePositiveRate = analysis.falsePositives / analysis.totalFeedback
    if (falsePositiveRate > 0.05) {
      reasons.push(`High false positive rate (${(falsePositiveRate * 100).toFixed(1)}%) - increasing approval threshold`)
    }

    const falseNegativeRate = analysis.falseNegatives / analysis.totalFeedback
    if (falseNegativeRate > 0.05) {
      reasons.push(`High false negative rate (${(falseNegativeRate * 100).toFixed(1)}%) - decreasing rejection threshold`)
    }

    // Report on factor performance
    for (const [factor, performance] of Object.entries(analysis.factorPerformance)) {
      if (performance.total > 0) {
        const accuracy = performance.correct / performance.total
        if (accuracy > 0.8) {
          reasons.push(`${factor} performing well (${(accuracy * 100).toFixed(1)}% accuracy)`)
        } else if (accuracy < 0.5) {
          reasons.push(`${factor} underperforming (${(accuracy * 100).toFixed(1)}% accuracy)`)
        }
      }
    }

    return reasons
  }

  /**
   * Estimate expected accuracy improvement
   */
  private estimateAccuracyImprovement(
    analysis: FeedbackAnalysis,
    newThresholds: ThresholdConfig
  ): number {
    const currentAccuracy = analysis.correctDecisions / analysis.totalFeedback
    
    // Estimate improvement based on threshold changes
    let estimatedImprovement = 0

    // If we're reducing false positives
    const thresholdIncrease = newThresholds.autoApproveThreshold - this.config.autoApproveThreshold
    if (thresholdIncrease > 0) {
      estimatedImprovement += thresholdIncrease * (analysis.falsePositives / analysis.totalFeedback)
    }

    // If we're reducing false negatives
    const thresholdDecrease = this.config.autoRejectThreshold - newThresholds.autoRejectThreshold
    if (thresholdDecrease > 0) {
      estimatedImprovement += thresholdDecrease * (analysis.falseNegatives / analysis.totalFeedback)
    }

    // Cap improvement at realistic levels
    return Math.min(0.1, Math.max(0, estimatedImprovement))
  }
}

/**
 * Internal feedback analysis structure
 */
interface FeedbackAnalysis {
  totalFeedback: number
  correctDecisions: number
  falsePositives: number
  falseNegatives: number
  averageConfidenceByDecision: {
    'auto-approve': { sum: number; count: number }
    'needs-review': { sum: number; count: number }
    'auto-reject': { sum: number; count: number }
  }
  factorPerformance: {
    claudeConfidence: { correct: number; total: number }
    emotionalCoherence: { correct: number; total: number }
    relationshipAccuracy: { correct: number; total: number }
    temporalConsistency: { correct: number; total: number }
    contentQuality: { correct: number; total: number }
  }
}