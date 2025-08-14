import type { ExpertValidationResults } from '../analysis/expert-validator.js'
import type {
  PRAnalysisResult,
  PRMetrics,
  RiskLevel,
} from '../types/analysis.js'

/**
 * Historical PR analysis data point
 */
export interface HistoricalAnalysis {
  prNumber: number
  prTitle: string
  analysisDate: Date
  branchName: string
  author: string
  analysisResult: PRAnalysisResult
  expertValidation: ExpertValidationResults
  repositoryState: {
    totalFiles: number
    linesOfCode: number
    testFiles: number
    lastCommitSha: string
  }
}

/**
 * Trend data point for time series analysis
 */
export interface TrendDataPoint {
  date: Date
  prNumber: number
  securityScore: number
  qualityScore: number
  complexityScore: number
  testCoverageScore: number
  criticalIssues: number
  highIssues: number
  mediumIssues: number
  lowIssues: number
  validatedFindings: number
  falsePositives: number
  expertFindings: number
  riskLevel: RiskLevel
  decisionType: string
}

/**
 * Trend analysis results with patterns and insights
 */
export interface TrendAnalysisResults {
  timeRange: {
    startDate: Date
    endDate: Date
    totalAnalyses: number
  }
  trends: {
    securityTrend: TrendDirection
    qualityTrend: TrendDirection
    complexityTrend: TrendDirection
    testCoverageTrend: TrendDirection
  }
  patterns: TrendPattern[]
  insights: TrendInsight[]
  recommendations: TrendRecommendation[]
  comparisons: {
    vsLastWeek: ComparisonMetrics
    vsLastMonth: ComparisonMetrics
    vsRepository: ComparisonMetrics
  }
  regressionAlerts: RegressionAlert[]
  improvementHighlights: ImprovementHighlight[]
}

/**
 * Trend direction with confidence and strength
 */
export interface TrendDirection {
  direction: 'improving' | 'declining' | 'stable' | 'volatile'
  strength: 'weak' | 'moderate' | 'strong'
  confidence: number
  changePercent: number
  significanceLevel: number
}

/**
 * Identified pattern in the data
 */
export interface TrendPattern {
  type: 'seasonal' | 'cyclic' | 'linear' | 'exponential' | 'threshold'
  description: string
  confidence: number
  period?: number
  impact: 'positive' | 'negative' | 'neutral'
  recommendation: string
}

/**
 * Actionable insight from trend analysis
 */
export interface TrendInsight {
  category: 'security' | 'quality' | 'velocity' | 'team' | 'process'
  priority: 'critical' | 'high' | 'medium' | 'low'
  title: string
  description: string
  evidence: string[]
  actionable: boolean
  estimatedImpact: 'high' | 'medium' | 'low'
}

/**
 * Trend-based recommendation
 */
export interface TrendRecommendation {
  type: 'immediate' | 'short_term' | 'long_term'
  category: string
  title: string
  description: string
  expectedOutcome: string
  effort: 'low' | 'medium' | 'high'
  priority: number
}

/**
 * Comparison metrics against historical data
 */
export interface ComparisonMetrics {
  securityScoreChange: number
  qualityScoreChange: number
  issueVolumeChange: number
  averageFixTimeChange: number
  regressionRate: number
  improvementRate: number
  significantChanges: string[]
}

/**
 * Regression detection alert
 */
export interface RegressionAlert {
  severity: 'critical' | 'high' | 'medium'
  metric: string
  currentValue: number
  baselineValue: number
  threshold: number
  changePercent: number
  detectedAt: Date
  possibleCauses: string[]
  recommendedActions: string[]
}

/**
 * Improvement highlight
 */
export interface ImprovementHighlight {
  metric: string
  improvement: string
  timeframe: string
  contributingFactors: string[]
  sustainabilityRisk: 'low' | 'medium' | 'high'
}

/**
 * Trend analyzer for historical PR analysis data
 */
export class TrendAnalyzer {
  private static readonly TREND_ANALYSIS_WINDOW_DAYS = 90
  private static readonly MIN_DATA_POINTS = 5
  private static readonly REGRESSION_THRESHOLD = 0.15 // 15% decline
  private static readonly IMPROVEMENT_THRESHOLD = 0.1 // 10% improvement

  /**
   * Analyze trends from historical PR analysis data
   */
  static analyzeTrends(
    historicalData: HistoricalAnalysis[],
    currentAnalysis: {
      result: PRAnalysisResult
      expertValidation: ExpertValidationResults
    },
  ): TrendAnalysisResults {
    if (historicalData.length < this.MIN_DATA_POINTS) {
      return this.createMinimalTrendAnalysis(currentAnalysis)
    }

    // Convert to trend data points
    const trendData = this.convertToTrendData(historicalData)

    // Add current analysis
    const currentTrendPoint = this.createTrendDataPoint(
      currentAnalysis.result,
      currentAnalysis.expertValidation,
    )
    trendData.push(currentTrendPoint)

    // Sort by date
    trendData.sort((a, b) => a.date.getTime() - b.date.getTime())

    const timeRange = {
      startDate: trendData[0].date,
      endDate: trendData[trendData.length - 1].date,
      totalAnalyses: trendData.length,
    }

    return {
      timeRange,
      trends: this.calculateTrends(trendData),
      patterns: this.identifyPatterns(trendData),
      insights: this.generateInsights(trendData),
      recommendations: this.generateTrendRecommendations(trendData),
      comparisons: this.generateComparisons(trendData),
      regressionAlerts: this.detectRegressions(trendData),
      improvementHighlights: this.identifyImprovements(trendData),
    }
  }

  /**
   * Convert historical analyses to trend data points
   */
  private static convertToTrendData(
    historicalData: HistoricalAnalysis[],
  ): TrendDataPoint[] {
    return historicalData.map((analysis) =>
      this.createTrendDataPoint(
        analysis.analysisResult,
        analysis.expertValidation,
      ),
    )
  }

  /**
   * Create trend data point from analysis results
   */
  private static createTrendDataPoint(
    analysisResult: PRAnalysisResult,
    expertValidation: ExpertValidationResults,
  ): TrendDataPoint {
    return {
      date: new Date(analysisResult.analysisTimestamp),
      prNumber: 0, // Will be set from historical data
      securityScore: analysisResult.metrics.securityDebtScore,
      qualityScore: this.calculateQualityScore(analysisResult.metrics),
      complexityScore: analysisResult.metrics.complexityScore,
      testCoverageScore: analysisResult.metrics.testCoverageDelta * 100,
      criticalIssues: analysisResult.securityAudit.criticalCount,
      highIssues: analysisResult.securityAudit.highCount,
      mediumIssues: analysisResult.securityAudit.mediumCount,
      lowIssues: analysisResult.securityAudit.lowCount,
      validatedFindings: expertValidation.validatedFindings.length,
      falsePositives: expertValidation.validatedFindings.filter(
        (f) => f.falsePositive,
      ).length,
      expertFindings: expertValidation.expertFindings.length,
      riskLevel: analysisResult.riskLevel,
      decisionType: expertValidation.overallDecision,
    }
  }

  /**
   * Calculate trends for key metrics
   */
  private static calculateTrends(
    trendData: TrendDataPoint[],
  ): TrendAnalysisResults['trends'] {
    return {
      securityTrend: this.calculateTrendDirection(trendData, 'securityScore'),
      qualityTrend: this.calculateTrendDirection(trendData, 'qualityScore'),
      complexityTrend: this.calculateTrendDirection(
        trendData,
        'complexityScore',
        true,
      ), // Lower is better
      testCoverageTrend: this.calculateTrendDirection(
        trendData,
        'testCoverageScore',
      ),
    }
  }

  /**
   * Calculate trend direction for a specific metric
   */
  private static calculateTrendDirection(
    data: TrendDataPoint[],
    metric: keyof TrendDataPoint,
    lowerIsBetter: boolean = false,
  ): TrendDirection {
    if (data.length < 3) {
      return {
        direction: 'stable',
        strength: 'weak',
        confidence: 0,
        changePercent: 0,
        significanceLevel: 0,
      }
    }

    const values = data.map((d) => d[metric] as number).filter((v) => !isNaN(v))
    if (values.length < 3) {
      return {
        direction: 'stable',
        strength: 'weak',
        confidence: 0,
        changePercent: 0,
        significanceLevel: 0,
      }
    }

    // Calculate linear trend
    const { slope, rSquared } = this.calculateLinearRegression(values)
    const changePercent =
      ((values[values.length - 1] - values[0]) / values[0]) * 100

    // Adjust for lower-is-better metrics
    const adjustedSlope = lowerIsBetter ? -slope : slope
    const adjustedChangePercent = lowerIsBetter ? -changePercent : changePercent

    let direction: TrendDirection['direction']
    if (Math.abs(adjustedChangePercent) < 5) {
      direction = 'stable'
    } else if (adjustedSlope > 0) {
      direction = 'improving'
    } else {
      direction = 'declining'
    }

    // Check for volatility
    const volatility = this.calculateVolatility(values)
    if (volatility > 0.3) {
      direction = 'volatile'
    }

    const strength: TrendDirection['strength'] =
      Math.abs(adjustedChangePercent) > 20
        ? 'strong'
        : Math.abs(adjustedChangePercent) > 10
          ? 'moderate'
          : 'weak'

    return {
      direction,
      strength,
      confidence: Math.round(rSquared * 100),
      changePercent: Math.round(adjustedChangePercent * 10) / 10,
      significanceLevel: rSquared,
    }
  }

  /**
   * Calculate linear regression for trend analysis
   */
  private static calculateLinearRegression(values: number[]): {
    slope: number
    rSquared: number
  } {
    const n = values.length
    const x = Array.from({ length: n }, (_, i) => i)

    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = values.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n

    // Calculate R-squared
    const yMean = sumY / n
    const ssTotal = values.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0)
    const ssResidual = values.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept
      return sum + Math.pow(yi - predicted, 2)
    }, 0)

    const rSquared = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal

    return { slope, rSquared: Math.max(0, rSquared) }
  }

  /**
   * Calculate volatility of values
   */
  private static calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0

    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance =
      values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
      values.length
    const standardDeviation = Math.sqrt(variance)

    return mean === 0 ? 0 : standardDeviation / Math.abs(mean)
  }

  /**
   * Identify patterns in the trend data
   */
  private static identifyPatterns(trendData: TrendDataPoint[]): TrendPattern[] {
    const patterns: TrendPattern[] = []

    // Check for threshold patterns
    const thresholdPattern = this.detectThresholdPattern(trendData)
    if (thresholdPattern) patterns.push(thresholdPattern)

    // Check for cyclic patterns
    const cyclicPattern = this.detectCyclicPattern(trendData)
    if (cyclicPattern) patterns.push(cyclicPattern)

    // Check for correlation patterns
    const correlationPattern = this.detectCorrelationPattern(trendData)
    if (correlationPattern) patterns.push(correlationPattern)

    return patterns
  }

  /**
   * Detect threshold-based patterns
   */
  private static detectThresholdPattern(
    trendData: TrendDataPoint[],
  ): TrendPattern | null {
    const criticalIssuesCounts = trendData.map((d) => d.criticalIssues)
    const averageCritical =
      criticalIssuesCounts.reduce((a, b) => a + b, 0) /
      criticalIssuesCounts.length

    if (averageCritical > 2) {
      return {
        type: 'threshold',
        description:
          'Consistently high number of critical security issues detected',
        confidence: 85,
        impact: 'negative',
        recommendation:
          'Implement stricter pre-merge security validation and developer training',
      }
    }

    return null
  }

  /**
   * Detect cyclic patterns (e.g., weekly/monthly cycles)
   */
  private static detectCyclicPattern(
    trendData: TrendDataPoint[],
  ): TrendPattern | null {
    if (trendData.length < 7) return null

    // Simple heuristic: check if quality drops on certain days
    const dayOfWeekQuality = new Map<number, number[]>()

    trendData.forEach((point) => {
      const dayOfWeek = point.date.getDay()
      if (!dayOfWeekQuality.has(dayOfWeek)) {
        dayOfWeekQuality.set(dayOfWeek, [])
      }
      dayOfWeekQuality.get(dayOfWeek)!.push(point.qualityScore)
    })

    const avgQualityByDay = Array.from(dayOfWeekQuality.entries())
      .map(([day, scores]) => ({
        day,
        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
        count: scores.length,
      }))
      .filter((item) => item.count >= 2)

    if (avgQualityByDay.length >= 3) {
      const qualityRange =
        Math.max(...avgQualityByDay.map((d) => d.avg)) -
        Math.min(...avgQualityByDay.map((d) => d.avg))

      if (qualityRange > 15) {
        return {
          type: 'cyclic',
          description: 'Quality varies significantly by day of week',
          confidence: 70,
          period: 7,
          impact: 'neutral',
          recommendation:
            'Investigate workflow differences across days and standardize review processes',
        }
      }
    }

    return null
  }

  /**
   * Detect correlation patterns between metrics
   */
  private static detectCorrelationPattern(
    trendData: TrendDataPoint[],
  ): TrendPattern | null {
    if (trendData.length < 5) return null

    const complexityScores = trendData.map((d) => d.complexityScore)
    const criticalIssues = trendData.map((d) => d.criticalIssues)

    const correlation = this.calculateCorrelation(
      complexityScores,
      criticalIssues,
    )

    if (Math.abs(correlation) > 0.7) {
      return {
        type: 'linear',
        description: `Strong ${correlation > 0 ? 'positive' : 'negative'} correlation between complexity and critical issues`,
        confidence: Math.round(Math.abs(correlation) * 100),
        impact: correlation > 0 ? 'negative' : 'positive',
        recommendation:
          'Focus on complexity reduction to decrease security issues',
      }
    }

    return null
  }

  /**
   * Calculate correlation coefficient between two arrays
   */
  private static calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length)
    if (n < 2) return 0

    const meanX = x.reduce((a, b) => a + b, 0) / n
    const meanY = y.reduce((a, b) => a + b, 0) / n

    let numerator = 0
    let denominatorX = 0
    let denominatorY = 0

    for (let i = 0; i < n; i++) {
      const deltaX = x[i] - meanX
      const deltaY = y[i] - meanY
      numerator += deltaX * deltaY
      denominatorX += deltaX * deltaX
      denominatorY += deltaY * deltaY
    }

    const denominator = Math.sqrt(denominatorX * denominatorY)
    return denominator === 0 ? 0 : numerator / denominator
  }

  /**
   * Generate actionable insights from trend analysis
   */
  private static generateInsights(trendData: TrendDataPoint[]): TrendInsight[] {
    const insights: TrendInsight[] = []

    // Security trend insight
    const recentCritical = trendData
      .slice(-5)
      .reduce((sum, d) => sum + d.criticalIssues, 0)
    if (recentCritical > 5) {
      insights.push({
        category: 'security',
        priority: 'critical',
        title: 'Increasing Critical Security Issues',
        description: 'Recent PRs show elevated critical security findings',
        evidence: [`${recentCritical} critical issues in last 5 PRs`],
        actionable: true,
        estimatedImpact: 'high',
      })
    }

    // Quality trend insight
    const qualityScores = trendData.slice(-5).map((d) => d.qualityScore)
    const avgQuality =
      qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length
    if (avgQuality < 70) {
      insights.push({
        category: 'quality',
        priority: 'high',
        title: 'Declining Code Quality',
        description: 'Average quality score below acceptable threshold',
        evidence: [`Average quality: ${avgQuality.toFixed(1)}/100`],
        actionable: true,
        estimatedImpact: 'medium',
      })
    }

    // False positive insight
    const falsePositiveRate =
      trendData.slice(-10).reduce((sum, d) => {
        const total = d.validatedFindings + d.falsePositives
        return sum + (total === 0 ? 0 : d.falsePositives / total)
      }, 0) / Math.min(10, trendData.length)

    if (falsePositiveRate > 0.3) {
      insights.push({
        category: 'process',
        priority: 'medium',
        title: 'High False Positive Rate',
        description: 'Automated tools generating many false positives',
        evidence: [
          `${(falsePositiveRate * 100).toFixed(1)}% false positive rate`,
        ],
        actionable: true,
        estimatedImpact: 'medium',
      })
    }

    return insights
  }

  /**
   * Generate trend-based recommendations
   */
  private static generateTrendRecommendations(
    trendData: TrendDataPoint[],
  ): TrendRecommendation[] {
    const recommendations: TrendRecommendation[] = []

    // Base recommendations on trend analysis
    const securityTrend = this.calculateTrendDirection(
      trendData,
      'securityScore',
    )
    const qualityTrend = this.calculateTrendDirection(trendData, 'qualityScore')

    if (
      securityTrend.direction === 'declining' &&
      securityTrend.strength !== 'weak'
    ) {
      recommendations.push({
        type: 'immediate',
        category: 'security',
        title: 'Implement Enhanced Security Review Process',
        description:
          'Security scores are declining. Strengthen pre-merge security validation.',
        expectedOutcome: 'Reduce security issues by 40% within 4 weeks',
        effort: 'medium',
        priority: 1,
      })
    }

    if (qualityTrend.direction === 'declining') {
      recommendations.push({
        type: 'short_term',
        category: 'quality',
        title: 'Code Quality Initiative',
        description: 'Establish coding standards and automated quality gates',
        expectedOutcome: 'Improve average quality score by 15 points',
        effort: 'high',
        priority: 2,
      })
    }

    return recommendations.sort((a, b) => a.priority - b.priority)
  }

  /**
   * Generate comparisons with historical periods
   */
  private static generateComparisons(
    trendData: TrendDataPoint[],
  ): TrendAnalysisResults['comparisons'] {
    const current = trendData[trendData.length - 1]

    return {
      vsLastWeek: this.generatePeriodComparison(trendData, current, 7),
      vsLastMonth: this.generatePeriodComparison(trendData, current, 30),
      vsRepository: this.generateRepositoryComparison(trendData, current),
    }
  }

  /**
   * Generate comparison metrics for a specific period
   */
  private static generatePeriodComparison(
    trendData: TrendDataPoint[],
    current: TrendDataPoint,
    days: number,
  ): ComparisonMetrics {
    const cutoffDate = new Date(
      current.date.getTime() - days * 24 * 60 * 60 * 1000,
    )
    const periodData = trendData.filter(
      (d) => d.date >= cutoffDate && d.date < current.date,
    )

    if (periodData.length === 0) {
      return this.getEmptyComparison()
    }

    const avgSecurity =
      periodData.reduce((sum, d) => sum + d.securityScore, 0) /
      periodData.length
    const avgQuality =
      periodData.reduce((sum, d) => sum + d.qualityScore, 0) / periodData.length
    const avgIssues =
      periodData.reduce((sum, d) => sum + d.criticalIssues + d.highIssues, 0) /
      periodData.length

    return {
      securityScoreChange: current.securityScore - avgSecurity,
      qualityScoreChange: current.qualityScore - avgQuality,
      issueVolumeChange:
        current.criticalIssues + current.highIssues - avgIssues,
      averageFixTimeChange: 0, // Would need additional data
      regressionRate: this.calculateRegressionRate(periodData),
      improvementRate: this.calculateImprovementRate(periodData),
      significantChanges: this.identifySignificantChanges(periodData, current),
    }
  }

  /**
   * Generate repository-wide comparison
   */
  private static generateRepositoryComparison(
    trendData: TrendDataPoint[],
    current: TrendDataPoint,
  ): ComparisonMetrics {
    if (trendData.length < 2) {
      return this.getEmptyComparison()
    }

    const avgSecurity =
      trendData.reduce((sum, d) => sum + d.securityScore, 0) / trendData.length
    const avgQuality =
      trendData.reduce((sum, d) => sum + d.qualityScore, 0) / trendData.length
    const avgIssues =
      trendData.reduce((sum, d) => sum + d.criticalIssues + d.highIssues, 0) /
      trendData.length

    return {
      securityScoreChange: current.securityScore - avgSecurity,
      qualityScoreChange: current.qualityScore - avgQuality,
      issueVolumeChange:
        current.criticalIssues + current.highIssues - avgIssues,
      averageFixTimeChange: 0,
      regressionRate: this.calculateRegressionRate(trendData),
      improvementRate: this.calculateImprovementRate(trendData),
      significantChanges: this.identifySignificantChanges(trendData, current),
    }
  }

  /**
   * Detect regression alerts
   */
  private static detectRegressions(
    trendData: TrendDataPoint[],
  ): RegressionAlert[] {
    const alerts: RegressionAlert[] = []

    if (trendData.length < 3) return alerts

    const current = trendData[trendData.length - 1]
    const baseline = trendData.slice(-6, -1) // Previous 5 data points

    // Security score regression
    const baselineSecurityAvg =
      baseline.reduce((sum, d) => sum + d.securityScore, 0) / baseline.length
    const securityDecline =
      (baselineSecurityAvg - current.securityScore) / baselineSecurityAvg

    if (securityDecline > this.REGRESSION_THRESHOLD) {
      alerts.push({
        severity: securityDecline > 0.25 ? 'critical' : 'high',
        metric: 'Security Score',
        currentValue: current.securityScore,
        baselineValue: baselineSecurityAvg,
        threshold: this.REGRESSION_THRESHOLD,
        changePercent: securityDecline * 100,
        detectedAt: current.date,
        possibleCauses: [
          'Introduction of new vulnerability patterns',
          'Relaxed security review standards',
          'Complex changes affecting multiple security domains',
        ],
        recommendedActions: [
          'Review recent security findings for patterns',
          'Strengthen security review process',
          'Consider security-focused pair programming',
        ],
      })
    }

    return alerts
  }

  /**
   * Identify improvement highlights
   */
  private static identifyImprovements(
    trendData: TrendDataPoint[],
  ): ImprovementHighlight[] {
    const improvements: ImprovementHighlight[] = []

    if (trendData.length < 5) return improvements

    const recent = trendData.slice(-3)
    const baseline = trendData.slice(-8, -3)

    // Security improvement
    const recentSecurityAvg =
      recent.reduce((sum, d) => sum + d.securityScore, 0) / recent.length
    const baselineSecurityAvg =
      baseline.reduce((sum, d) => sum + d.securityScore, 0) / baseline.length
    const securityImprovement =
      (recentSecurityAvg - baselineSecurityAvg) / baselineSecurityAvg

    if (securityImprovement > this.IMPROVEMENT_THRESHOLD) {
      improvements.push({
        metric: 'Security Score',
        improvement: `${(securityImprovement * 100).toFixed(1)}% improvement`,
        timeframe: 'Last 3 PRs',
        contributingFactors: [
          'Enhanced security review process',
          'Better tooling integration',
          'Developer training effectiveness',
        ],
        sustainabilityRisk: securityImprovement > 0.3 ? 'medium' : 'low',
      })
    }

    return improvements
  }

  /**
   * Helper methods
   */
  private static calculateQualityScore(metrics: PRMetrics): number {
    // Composite quality score based on multiple factors
    let score = 100

    if (metrics.complexityScore > 8) score -= 20
    else if (metrics.complexityScore > 6) score -= 10

    if (metrics.technicalDebtRatio > 0.3) score -= 15
    else if (metrics.technicalDebtRatio > 0.2) score -= 10

    if (metrics.testCoverageDelta > 0.1) score += 5
    else if (metrics.testCoverageDelta < -0.1) score -= 10

    if (metrics.documentationCoverage < 50) score -= 10

    return Math.max(0, Math.min(100, score))
  }

  private static createMinimalTrendAnalysis(_currentAnalysis: {
    result: PRAnalysisResult
    expertValidation: ExpertValidationResults
  }): TrendAnalysisResults {
    const now = new Date()

    return {
      timeRange: {
        startDate: now,
        endDate: now,
        totalAnalyses: 1,
      },
      trends: {
        securityTrend: {
          direction: 'stable',
          strength: 'weak',
          confidence: 0,
          changePercent: 0,
          significanceLevel: 0,
        },
        qualityTrend: {
          direction: 'stable',
          strength: 'weak',
          confidence: 0,
          changePercent: 0,
          significanceLevel: 0,
        },
        complexityTrend: {
          direction: 'stable',
          strength: 'weak',
          confidence: 0,
          changePercent: 0,
          significanceLevel: 0,
        },
        testCoverageTrend: {
          direction: 'stable',
          strength: 'weak',
          confidence: 0,
          changePercent: 0,
          significanceLevel: 0,
        },
      },
      patterns: [],
      insights: [
        {
          category: 'process',
          priority: 'low',
          title: 'Insufficient Historical Data',
          description:
            'More historical analysis data needed for meaningful trend analysis',
          evidence: ['Less than 5 previous analyses available'],
          actionable: false,
          estimatedImpact: 'low',
        },
      ],
      recommendations: [
        {
          type: 'long_term',
          category: 'process',
          title: 'Build Historical Analysis Database',
          description:
            'Continue analyzing PRs to build trend analysis capabilities',
          expectedOutcome:
            'Enable comprehensive trend analysis after 10+ analyses',
          effort: 'low',
          priority: 1,
        },
      ],
      comparisons: {
        vsLastWeek: this.getEmptyComparison(),
        vsLastMonth: this.getEmptyComparison(),
        vsRepository: this.getEmptyComparison(),
      },
      regressionAlerts: [],
      improvementHighlights: [],
    }
  }

  private static getEmptyComparison(): ComparisonMetrics {
    return {
      securityScoreChange: 0,
      qualityScoreChange: 0,
      issueVolumeChange: 0,
      averageFixTimeChange: 0,
      regressionRate: 0,
      improvementRate: 0,
      significantChanges: [],
    }
  }

  private static calculateRegressionRate(data: TrendDataPoint[]): number {
    // Simple heuristic: percentage of PRs with declining security scores
    if (data.length < 2) return 0

    let regressions = 0
    for (let i = 1; i < data.length; i++) {
      if (data[i].securityScore < data[i - 1].securityScore) {
        regressions++
      }
    }

    return (regressions / (data.length - 1)) * 100
  }

  private static calculateImprovementRate(data: TrendDataPoint[]): number {
    // Simple heuristic: percentage of PRs with improving security scores
    if (data.length < 2) return 0

    let improvements = 0
    for (let i = 1; i < data.length; i++) {
      if (data[i].securityScore > data[i - 1].securityScore) {
        improvements++
      }
    }

    return (improvements / (data.length - 1)) * 100
  }

  private static identifySignificantChanges(
    baseline: TrendDataPoint[],
    current: TrendDataPoint,
  ): string[] {
    const changes: string[] = []

    if (baseline.length === 0) return changes

    const avgCritical =
      baseline.reduce((sum, d) => sum + d.criticalIssues, 0) / baseline.length
    if (current.criticalIssues > avgCritical * 1.5) {
      changes.push('Significant increase in critical issues')
    }

    const avgSecurity =
      baseline.reduce((sum, d) => sum + d.securityScore, 0) / baseline.length
    if (Math.abs(current.securityScore - avgSecurity) > 15) {
      changes.push(
        `Security score ${current.securityScore > avgSecurity ? 'improvement' : 'decline'}`,
      )
    }

    return changes
  }
}
