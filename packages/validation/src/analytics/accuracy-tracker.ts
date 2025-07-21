import type { ValidationFeedback, AutoConfirmationResult } from '../types'

/**
 * Tracks and analyzes auto-confirmation accuracy over time
 */
export class AccuracyTracker {
  private feedbackHistory: ValidationFeedback[] = []

  /**
   * Add validation feedback for tracking
   */
  addFeedback(feedback: ValidationFeedback): void {
    this.feedbackHistory.push(feedback)
    
    // Keep only recent feedback (last 1000 entries) for performance
    if (this.feedbackHistory.length > 1000) {
      this.feedbackHistory = this.feedbackHistory.slice(-1000)
    }
  }

  /**
   * Add multiple feedback entries
   */
  addFeedbackBatch(feedback: ValidationFeedback[]): void {
    for (const item of feedback) {
      this.addFeedback(item)
    }
  }

  /**
   * Get overall accuracy metrics
   */
  getAccuracyMetrics(): AccuracyMetrics {
    if (this.feedbackHistory.length === 0) {
      return this.getEmptyMetrics()
    }

    const totalDecisions = this.feedbackHistory.length
    let correctDecisions = 0
    let falsePositives = 0
    let falseNegatives = 0
    let needsReviewCorrect = 0

    const decisionCounts = {
      'auto-approve': 0,
      'needs-review': 0,
      'auto-reject': 0,
    }

    const accuracyByDecision = {
      'auto-approve': { correct: 0, total: 0 },
      'needs-review': { correct: 0, total: 0 },
      'auto-reject': { correct: 0, total: 0 },
    }

    for (const feedback of this.feedbackHistory) {
      const { originalResult, humanDecision } = feedback
      const autoDecision = originalResult.decision

      decisionCounts[autoDecision]++
      accuracyByDecision[autoDecision].total++

      const wasCorrect = this.isDecisionCorrect(autoDecision, humanDecision)
      
      if (wasCorrect) {
        correctDecisions++
        accuracyByDecision[autoDecision].correct++
        
        if (autoDecision === 'needs-review') {
          needsReviewCorrect++
        }
      } else {
        if (autoDecision === 'auto-approve' && humanDecision !== 'validated') {
          falsePositives++
        } else if (autoDecision === 'auto-reject' && humanDecision === 'validated') {
          falseNegatives++
        }
      }
    }

    return {
      totalDecisions,
      correctDecisions,
      overallAccuracy: correctDecisions / totalDecisions,
      falsePositiveRate: falsePositives / totalDecisions,
      falseNegativeRate: falseNegatives / totalDecisions,
      decisionDistribution: decisionCounts,
      accuracyByDecision: Object.fromEntries(
        Object.entries(accuracyByDecision).map(([decision, data]) => [
          decision,
          data.total > 0 ? data.correct / data.total : 0,
        ])
      ),
      confidenceCalibration: this.calculateConfidenceCalibration(),
      factorPerformance: this.analyzeFactorPerformance(),
    }
  }

  /**
   * Get accuracy trend over time
   */
  getAccuracyTrend(windowSize: number = 50): AccuracyTrend[] {
    if (this.feedbackHistory.length < windowSize) {
      return []
    }

    const trend: AccuracyTrend[] = []
    
    for (let i = windowSize; i <= this.feedbackHistory.length; i += Math.floor(windowSize / 2)) {
      const window = this.feedbackHistory.slice(i - windowSize, i)
      const windowMetrics = this.calculateWindowMetrics(window)
      
      trend.push({
        timestamp: window[window.length - 1].timestamp,
        windowSize,
        accuracy: windowMetrics.accuracy,
        falsePositiveRate: windowMetrics.falsePositiveRate,
        falseNegativeRate: windowMetrics.falseNegativeRate,
        averageConfidence: windowMetrics.averageConfidence,
      })
    }

    return trend
  }

  /**
   * Get performance by confidence level
   */
  getPerformanceByConfidence(): ConfidencePerformance[] {
    const buckets = [
      { min: 0.0, max: 0.2, name: '0-20%' },
      { min: 0.2, max: 0.4, name: '20-40%' },
      { min: 0.4, max: 0.6, name: '40-60%' },
      { min: 0.6, max: 0.8, name: '60-80%' },
      { min: 0.8, max: 1.0, name: '80-100%' },
    ]

    return buckets.map(bucket => {
      const feedbackInBucket = this.feedbackHistory.filter(
        f => f.originalResult.confidence >= bucket.min && f.originalResult.confidence < bucket.max
      )

      if (feedbackInBucket.length === 0) {
        return {
          confidenceRange: bucket.name,
          count: 0,
          accuracy: 0,
          averageConfidence: (bucket.min + bucket.max) / 2,
        }
      }

      const correct = feedbackInBucket.filter(
        f => this.isDecisionCorrect(f.originalResult.decision, f.humanDecision)
      ).length

      const avgConfidence = feedbackInBucket.reduce(
        (sum, f) => sum + f.originalResult.confidence, 0
      ) / feedbackInBucket.length

      return {
        confidenceRange: bucket.name,
        count: feedbackInBucket.length,
        accuracy: correct / feedbackInBucket.length,
        averageConfidence: avgConfidence,
      }
    })
  }

  /**
   * Clear all tracking data
   */
  clearHistory(): void {
    this.feedbackHistory = []
  }

  /**
   * Get recent feedback (last N entries)
   */
  getRecentFeedback(count: number = 10): ValidationFeedback[] {
    return this.feedbackHistory.slice(-count)
  }

  /**
   * Check if an auto-confirmation decision was correct
   */
  private isDecisionCorrect(autoDecision: string, humanDecision: string): boolean {
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
   * Calculate confidence calibration metrics
   */
  private calculateConfidenceCalibration(): number {
    // Measures how well confidence scores match actual accuracy
    const confidenceBuckets = this.getPerformanceByConfidence()
    
    let totalError = 0
    let weightedCount = 0

    for (const bucket of confidenceBuckets) {
      if (bucket.count > 0) {
        // Error between predicted confidence and actual accuracy
        const error = Math.abs(bucket.averageConfidence - bucket.accuracy)
        totalError += error * bucket.count
        weightedCount += bucket.count
      }
    }

    // Return calibration score (1 = perfect, 0 = worst)
    return weightedCount > 0 ? 1 - (totalError / weightedCount) : 0
  }

  /**
   * Analyze performance of individual confidence factors
   */
  private analyzeFactorPerformance(): Record<string, FactorPerformance> {
    const factors = ['claudeConfidence', 'emotionalCoherence', 'relationshipAccuracy', 'temporalConsistency', 'contentQuality']
    const performance: Record<string, FactorPerformance> = {}

    for (const factor of factors) {
      const correlationData: Array<{ value: number; correct: boolean }> = []
      
      for (const feedback of this.feedbackHistory) {
        const factorValue = feedback.originalResult.confidenceFactors[factor as keyof typeof feedback.originalResult.confidenceFactors]
        const correct = this.isDecisionCorrect(feedback.originalResult.decision, feedback.humanDecision)
        correlationData.push({ value: factorValue, correct })
      }

      const correlation = this.calculateCorrelation(correlationData)
      const averageValue = correlationData.reduce((sum, d) => sum + d.value, 0) / correlationData.length
      const correctRate = correlationData.filter(d => d.correct).length / correlationData.length

      performance[factor] = {
        correlation,
        averageValue,
        correctRate,
        sampleSize: correlationData.length,
      }
    }

    return performance
  }

  /**
   * Calculate correlation between factor value and correctness
   */
  private calculateCorrelation(data: Array<{ value: number; correct: boolean }>): number {
    if (data.length === 0) return 0

    const values = data.map(d => d.value)
    const correctness = data.map(d => d.correct ? 1 : 0)

    const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length
    const avgCorrect = correctness.reduce((sum: number, c: number) => sum + c, 0) / correctness.length

    let numerator = 0
    let sumSquaredValue = 0
    let sumSquaredCorrect = 0

    for (let i = 0; i < data.length; i++) {
      const valueDiff = values[i] - avgValue
      const correctDiff = correctness[i] - avgCorrect
      
      numerator += valueDiff * correctDiff
      sumSquaredValue += valueDiff * valueDiff
      sumSquaredCorrect += correctDiff * correctDiff
    }

    const denominator = Math.sqrt(sumSquaredValue * sumSquaredCorrect)
    return denominator > 0 ? numerator / denominator : 0
  }

  /**
   * Calculate metrics for a window of feedback
   */
  private calculateWindowMetrics(window: ValidationFeedback[]): {
    accuracy: number
    falsePositiveRate: number
    falseNegativeRate: number
    averageConfidence: number
  } {
    let correct = 0
    let falsePositives = 0
    let falseNegatives = 0
    let totalConfidence = 0

    for (const feedback of window) {
      const wasCorrect = this.isDecisionCorrect(feedback.originalResult.decision, feedback.humanDecision)
      
      if (wasCorrect) {
        correct++
      } else {
        if (feedback.originalResult.decision === 'auto-approve' && feedback.humanDecision !== 'validated') {
          falsePositives++
        } else if (feedback.originalResult.decision === 'auto-reject' && feedback.humanDecision === 'validated') {
          falseNegatives++
        }
      }
      
      totalConfidence += feedback.originalResult.confidence
    }

    return {
      accuracy: correct / window.length,
      falsePositiveRate: falsePositives / window.length,
      falseNegativeRate: falseNegatives / window.length,
      averageConfidence: totalConfidence / window.length,
    }
  }

  /**
   * Get empty metrics for when there's no data
   */
  private getEmptyMetrics(): AccuracyMetrics {
    return {
      totalDecisions: 0,
      correctDecisions: 0,
      overallAccuracy: 0,
      falsePositiveRate: 0,
      falseNegativeRate: 0,
      decisionDistribution: {
        'auto-approve': 0,
        'needs-review': 0,
        'auto-reject': 0,
      },
      accuracyByDecision: {
        'auto-approve': 0,
        'needs-review': 0,
        'auto-reject': 0,
      },
      confidenceCalibration: 0,
      factorPerformance: {},
    }
  }
}

/**
 * Accuracy metrics interface
 */
export interface AccuracyMetrics {
  totalDecisions: number
  correctDecisions: number
  overallAccuracy: number
  falsePositiveRate: number
  falseNegativeRate: number
  decisionDistribution: Record<string, number>
  accuracyByDecision: Record<string, number>
  confidenceCalibration: number
  factorPerformance: Record<string, FactorPerformance>
}

/**
 * Accuracy trend point
 */
export interface AccuracyTrend {
  timestamp: string
  windowSize: number
  accuracy: number
  falsePositiveRate: number
  falseNegativeRate: number
  averageConfidence: number
}

/**
 * Performance by confidence level
 */
export interface ConfidencePerformance {
  confidenceRange: string
  count: number
  accuracy: number
  averageConfidence: number
}

/**
 * Factor performance metrics
 */
export interface FactorPerformance {
  correlation: number
  averageValue: number
  correctRate: number
  sampleSize: number
}