import { createLogger } from '@studio/logger'

import type {
  BatchValidationResult,
  ValidationFeedback,
  AutoConfirmationResult,
  SampledMemories,
} from '../types'

import { AccuracyTracker, type AccuracyMetrics, type AccuracyTrend } from './accuracy-tracker'

const logger = createLogger({ tags: ['validation:analytics'] })

/**
 * Comprehensive validation analytics and monitoring
 */
export class ValidationAnalytics {
  private accuracyTracker: AccuracyTracker
  private batchHistory: BatchAnalytics[] = []
  private performanceMetrics: PerformanceMetrics = {
    totalMemoriesProcessed: 0,
    totalValidationTime: 0,
    averageProcessingTime: 0,
    throughputPerHour: 0,
    systemUptime: Date.now(),
  }

  constructor() {
    this.accuracyTracker = new AccuracyTracker()
  }

  /**
   * Record batch validation results
   */
  recordBatchValidation(result: BatchValidationResult): void {
    logger.debug('Recording batch validation', {
      totalMemories: result.totalMemories,
      processingTime: result.processingTime,
    })

    // Update performance metrics
    this.updatePerformanceMetrics(result)

    // Store batch analytics
    const batchAnalytics: BatchAnalytics = {
      timestamp: new Date().toISOString(),
      totalMemories: result.totalMemories,
      decisions: result.decisions,
      batchConfidence: result.batchConfidence,
      processingTime: result.processingTime,
      throughput: (result.totalMemories / result.processingTime) * 1000 * 60, // memories per minute
      qualityDistribution: this.analyzeBatchQuality(result.results),
    }

    this.batchHistory.push(batchAnalytics)

    // Keep only recent batches (last 100) for performance
    if (this.batchHistory.length > 100) {
      this.batchHistory = this.batchHistory.slice(-100)
    }

    logger.info('Batch validation recorded', {
      totalMemories: result.totalMemories,
      autoApproveRate: result.decisions.autoApproved / result.totalMemories,
      averageConfidence: result.batchConfidence,
    })
  }

  /**
   * Record validation feedback for accuracy tracking
   */
  recordValidationFeedback(feedback: ValidationFeedback[]): void {
    logger.debug('Recording validation feedback', { count: feedback.length })
    
    this.accuracyTracker.addFeedbackBatch(feedback)
    
    logger.info('Validation feedback recorded', {
      feedbackCount: feedback.length,
      accuracy: this.accuracyTracker.getAccuracyMetrics().overallAccuracy,
    })
  }

  /**
   * Get comprehensive analytics report
   */
  getAnalyticsReport(): ValidationAnalyticsReport {
    const accuracyMetrics = this.accuracyTracker.getAccuracyMetrics()
    const performanceMetrics = this.getPerformanceMetrics()
    const batchTrends = this.getBatchTrends()
    const systemHealth = this.getSystemHealth()
    const recommendations = this.generateRecommendations(accuracyMetrics, performanceMetrics)

    return {
      timestamp: new Date().toISOString(),
      accuracy: accuracyMetrics,
      performance: performanceMetrics,
      batchTrends,
      systemHealth,
      recommendations,
    }
  }

  /**
   * Get accuracy trend analysis
   */
  getAccuracyTrend(windowSize?: number): AccuracyTrend[] {
    return this.accuracyTracker.getAccuracyTrend(windowSize)
  }

  /**
   * Get effectiveness metrics for optimization
   */
  getEffectivenessMetrics(): EffectivenessMetrics {
    const accuracyMetrics = this.accuracyTracker.getAccuracyMetrics()
    const recentBatches = this.batchHistory.slice(-10)

    const autoApprovalRate = this.calculateAutoApprovalRate(recentBatches)
    const humanWorkloadReduction = this.calculateWorkloadReduction(recentBatches)
    const qualityMaintenance = this.assessQualityMaintenance(accuracyMetrics)
    const timeEfficiency = this.calculateTimeEfficiency(recentBatches)

    return {
      autoApprovalRate,
      humanWorkloadReduction,
      qualityMaintenance,
      timeEfficiency,
      overallEffectiveness: this.calculateOverallEffectiveness({
        autoApprovalRate,
        humanWorkloadReduction,
        qualityMaintenance,
        timeEfficiency,
      }),
    }
  }

  /**
   * Get sampling effectiveness analysis
   */
  analyzeSamplingEffectiveness(samples: SampledMemories[]): SamplingEffectiveness {
    if (samples.length === 0) {
      return {
        averageCoverage: 0,
        samplingEfficiency: 0,
        representativenessScore: 0,
        recommendations: ['No sampling data available'],
      }
    }

    const averageCoverage = samples.reduce(
      (sum, sample) => sum + sample.coverage.overallScore, 0
    ) / samples.length

    const samplingEfficiency = this.calculateSamplingEfficiency(samples)
    const representativenessScore = this.calculateRepresentativenessScore(samples)
    const recommendations = this.generateSamplingRecommendations(samples)

    return {
      averageCoverage,
      samplingEfficiency,
      representativenessScore,
      recommendations,
    }
  }

  /**
   * Clear all analytics data
   */
  clearAnalytics(): void {
    this.accuracyTracker.clearHistory()
    this.batchHistory = []
    this.performanceMetrics = {
      totalMemoriesProcessed: 0,
      totalValidationTime: 0,
      averageProcessingTime: 0,
      throughputPerHour: 0,
      systemUptime: Date.now(),
    }
    logger.info('Analytics data cleared')
  }

  /**
   * Update performance metrics with new batch result
   */
  private updatePerformanceMetrics(result: BatchValidationResult): void {
    this.performanceMetrics.totalMemoriesProcessed += result.totalMemories
    this.performanceMetrics.totalValidationTime += result.processingTime

    if (this.performanceMetrics.totalMemoriesProcessed > 0) {
      this.performanceMetrics.averageProcessingTime = 
        this.performanceMetrics.totalValidationTime / this.performanceMetrics.totalMemoriesProcessed
    }

    // Calculate throughput per hour
    const hoursOfOperation = (Date.now() - this.performanceMetrics.systemUptime) / (1000 * 60 * 60)
    if (hoursOfOperation > 0) {
      this.performanceMetrics.throughputPerHour = 
        this.performanceMetrics.totalMemoriesProcessed / hoursOfOperation
    }
  }

  /**
   * Analyze quality distribution in batch results
   */
  private analyzeBatchQuality(results: AutoConfirmationResult[]): QualityDistribution {
    const distribution = { high: 0, medium: 0, low: 0 }

    for (const result of results) {
      if (result.confidence >= 0.8) {
        distribution.high++
      } else if (result.confidence >= 0.5) {
        distribution.medium++
      } else {
        distribution.low++
      }
    }

    return distribution
  }

  /**
   * Get current performance metrics
   */
  private getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics }
  }

  /**
   * Get batch processing trends
   */
  private getBatchTrends(): BatchTrend[] {
    return this.batchHistory.slice(-20).map(batch => ({
      timestamp: batch.timestamp,
      throughput: batch.throughput,
      averageConfidence: batch.batchConfidence,
      autoApprovalRate: batch.decisions.autoApproved / batch.totalMemories,
      processingTime: batch.processingTime,
    }))
  }

  /**
   * Assess system health
   */
  private getSystemHealth(): SystemHealth {
    const recentBatches = this.batchHistory.slice(-5)
    const accuracyMetrics = this.accuracyTracker.getAccuracyMetrics()

    // Check for performance degradation
    const avgThroughput = recentBatches.length > 0 
      ? recentBatches.reduce((sum, b) => sum + b.throughput, 0) / recentBatches.length
      : 0

    const healthScore = this.calculateHealthScore(accuracyMetrics, avgThroughput)
    const issues = this.identifyHealthIssues(accuracyMetrics, avgThroughput, recentBatches)

    return {
      overall: healthScore > 0.8 ? 'healthy' : healthScore > 0.6 ? 'warning' : 'critical',
      score: healthScore,
      issues,
      uptime: Date.now() - this.performanceMetrics.systemUptime,
    }
  }

  /**
   * Calculate overall system health score
   */
  private calculateHealthScore(accuracy: AccuracyMetrics, throughput: number): number {
    const accuracyScore = accuracy.overallAccuracy
    const errorScore = 1 - (accuracy.falsePositiveRate + accuracy.falseNegativeRate) / 2
    const throughputScore = Math.min(1, throughput / 60) // Target 60 memories/minute
    
    return (accuracyScore * 0.5 + errorScore * 0.3 + throughputScore * 0.2)
  }

  /**
   * Identify system health issues
   */
  private identifyHealthIssues(
    accuracy: AccuracyMetrics, 
    throughput: number, 
    recentBatches: BatchAnalytics[]
  ): string[] {
    const issues: string[] = []

    if (accuracy.overallAccuracy < 0.8) {
      issues.push(`Low accuracy: ${(accuracy.overallAccuracy * 100).toFixed(1)}%`)
    }

    if (accuracy.falsePositiveRate > 0.05) {
      issues.push(`High false positive rate: ${(accuracy.falsePositiveRate * 100).toFixed(1)}%`)
    }

    if (accuracy.falseNegativeRate > 0.05) {
      issues.push(`High false negative rate: ${(accuracy.falseNegativeRate * 100).toFixed(1)}%`)
    }

    if (throughput < 30) {
      issues.push(`Low throughput: ${throughput.toFixed(1)} memories/minute`)
    }

    if (recentBatches.length > 0) {
      const avgConfidence = recentBatches.reduce((sum, b) => sum + b.batchConfidence, 0) / recentBatches.length
      if (avgConfidence < 0.6) {
        issues.push(`Low batch confidence: ${(avgConfidence * 100).toFixed(1)}%`)
      }
    }

    return issues
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(accuracy: AccuracyMetrics, performance: PerformanceMetrics): string[] {
    const recommendations: string[] = []

    if (accuracy.overallAccuracy < 0.85) {
      recommendations.push('Consider adjusting confidence thresholds to improve accuracy')
    }

    if (accuracy.falsePositiveRate > 0.05) {
      recommendations.push('Increase auto-approval threshold to reduce false positives')
    }

    if (accuracy.falseNegativeRate > 0.05) {
      recommendations.push('Decrease auto-rejection threshold to reduce false negatives')
    }

    if (performance.averageProcessingTime > 100) {
      recommendations.push('Optimize processing pipeline to improve throughput')
    }

    const confidencePerf = this.accuracyTracker.getPerformanceByConfidence()
    const poorCalibration = confidencePerf.find(p => p.count > 10 && Math.abs(p.accuracy - p.averageConfidence) > 0.2)
    if (poorCalibration) {
      recommendations.push('Recalibrate confidence scoring - prediction accuracy mismatch detected')
    }

    return recommendations
  }

  /**
   * Calculate auto-approval rate from recent batches
   */
  private calculateAutoApprovalRate(batches: BatchAnalytics[]): number {
    if (batches.length === 0) return 0

    const totalMemories = batches.reduce((sum, b) => sum + b.totalMemories, 0)
    const totalAutoApproved = batches.reduce((sum, b) => sum + b.decisions.autoApproved, 0)

    return totalMemories > 0 ? totalAutoApproved / totalMemories : 0
  }

  /**
   * Calculate human workload reduction
   */
  private calculateWorkloadReduction(batches: BatchAnalytics[]): number {
    const autoApprovalRate = this.calculateAutoApprovalRate(batches)
    // Assume without automation, 100% would need human review
    return autoApprovalRate
  }

  /**
   * Assess quality maintenance score
   */
  private assessQualityMaintenance(accuracy: AccuracyMetrics): number {
    // Quality is maintained if accuracy is high and error rates are low
    return accuracy.overallAccuracy * (1 - (accuracy.falsePositiveRate + accuracy.falseNegativeRate) / 2)
  }

  /**
   * Calculate time efficiency improvement
   */
  private calculateTimeEfficiency(batches: BatchAnalytics[]): number {
    if (batches.length === 0) return 0

    const avgThroughput = batches.reduce((sum, b) => sum + b.throughput, 0) / batches.length
    // Normalize against target of 60 memories/minute
    return Math.min(1, avgThroughput / 60)
  }

  /**
   * Calculate overall effectiveness score
   */
  private calculateOverallEffectiveness(metrics: {
    autoApprovalRate: number
    humanWorkloadReduction: number
    qualityMaintenance: number
    timeEfficiency: number
  }): number {
    const weights = {
      autoApprovalRate: 0.3,
      humanWorkloadReduction: 0.3,
      qualityMaintenance: 0.3,
      timeEfficiency: 0.1,
    }

    return Object.entries(metrics).reduce(
      (sum, [key, value]) => sum + value * weights[key as keyof typeof weights],
      0
    )
  }

  /**
   * Calculate sampling efficiency
   */
  private calculateSamplingEfficiency(samples: SampledMemories[]): number {
    // Efficiency based on sample size vs coverage achieved
    let totalEfficiency = 0

    for (const sample of samples) {
      const coverage = sample.coverage.overallScore
      const samplingRate = sample.metadata.samplingRate
      // Good efficiency = high coverage with low sampling rate
      const efficiency = coverage / Math.max(0.1, samplingRate)
      totalEfficiency += Math.min(1, efficiency)
    }

    return samples.length > 0 ? totalEfficiency / samples.length : 0
  }

  /**
   * Calculate representativeness score
   */
  private calculateRepresentativenessScore(samples: SampledMemories[]): number {
    // Score based on how well samples represent different dimensions
    let totalScore = 0

    for (const sample of samples) {
      const { emotionalCoverage, temporalCoverage, participantCoverage } = sample.coverage
      const score = (
        emotionalCoverage.coveragePercentage / 100 * 0.4 +
        (temporalCoverage.distribution === 'even' ? 0.8 : 0.4) * 0.3 +
        participantCoverage.coveragePercentage / 100 * 0.3
      )
      totalScore += score
    }

    return samples.length > 0 ? totalScore / samples.length : 0
  }

  /**
   * Generate sampling recommendations
   */
  private generateSamplingRecommendations(samples: SampledMemories[]): string[] {
    const recommendations: string[] = []

    // Analyze common issues across samples
    const lowEmotionalCoverage = samples.filter(s => s.coverage.emotionalCoverage.coveragePercentage < 60)
    if (lowEmotionalCoverage.length > samples.length * 0.5) {
      recommendations.push('Increase emotional diversity in sampling strategy')
    }

    const temporalGaps = samples.filter(s => s.coverage.temporalCoverage.gaps.length > 2)
    if (temporalGaps.length > samples.length * 0.3) {
      recommendations.push('Improve temporal distribution in samples')
    }

    const lowSamplingEfficiency = samples.filter(s => s.metadata.samplingRate > 0.5)
    if (lowSamplingEfficiency.length > 0) {
      recommendations.push('Optimize sampling rate - current strategy may be over-sampling')
    }

    return recommendations
  }
}

// Supporting interfaces
interface BatchAnalytics {
  timestamp: string
  totalMemories: number
  decisions: {
    autoApproved: number
    needsReview: number
    autoRejected: number
  }
  batchConfidence: number
  processingTime: number
  throughput: number // memories per minute
  qualityDistribution: QualityDistribution
}

interface QualityDistribution {
  high: number
  medium: number
  low: number
}

interface PerformanceMetrics {
  totalMemoriesProcessed: number
  totalValidationTime: number
  averageProcessingTime: number
  throughputPerHour: number
  systemUptime: number
}

interface BatchTrend {
  timestamp: string
  throughput: number
  averageConfidence: number
  autoApprovalRate: number
  processingTime: number
}

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical'
  score: number
  issues: string[]
  uptime: number
}

export interface ValidationAnalyticsReport {
  timestamp: string
  accuracy: AccuracyMetrics
  performance: PerformanceMetrics
  batchTrends: BatchTrend[]
  systemHealth: SystemHealth
  recommendations: string[]
}

export interface EffectivenessMetrics {
  autoApprovalRate: number
  humanWorkloadReduction: number
  qualityMaintenance: number
  timeEfficiency: number
  overallEffectiveness: number
}

export interface SamplingEffectiveness {
  averageCoverage: number
  samplingEfficiency: number
  representativenessScore: number
  recommendations: string[]
}