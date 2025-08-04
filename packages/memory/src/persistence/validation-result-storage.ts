import { PrismaClient } from '@studio/db'

type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

// Temporary types until full types are available
interface ValidationResult {
  id: string
  memoryId: string
  humanScore: number
  algorithmScore: number
  agreement: number // 0-1 scale
  discrepancy: number // absolute difference
  validatorId: string
  validationMethod: 'expert_review' | 'crowd_sourced' | 'comparative_analysis'
  feedback?: string
  biasIndicators: BiasIndicator[]
  accuracyMetrics: AccuracyMetric[]
  validatedAt: Date
  createdAt: Date
}

interface BiasIndicator {
  type:
    | 'systematic_overestimate'
    | 'systematic_underestimate'
    | 'demographic_bias'
    | 'context_bias'
  severity: 'low' | 'medium' | 'high'
  description: string
  evidence: string
  confidence: number // 0-1 scale
}

interface AccuracyMetric {
  metricType:
    | 'correlation'
    | 'mean_absolute_error'
    | 'root_mean_square_error'
    | 'accuracy_percentage'
  value: number
  baseline: number // Expected/target value
  performanceRating: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement'
  trendDirection: 'improving' | 'stable' | 'declining'
}

interface ValidationTrend {
  metricType: string
  timeWindow: string // '7d', '30d', '90d'
  dataPoints: Array<{
    timestamp: Date
    value: number
  }>
  trendSlope: number // Positive = improving, negative = declining
  correlationCoefficient: number
  significanceLevel: number
  trendDirection: 'improving' | 'stable' | 'declining'
}

interface BiasAnalysis {
  overallBiasScore: number // 0-1 scale, 0 = no bias
  biasPatterns: Array<{
    pattern: string
    frequency: number
    impact: 'low' | 'medium' | 'high'
    recommendations: string[]
  }>
  demographicBias?: {
    detected: boolean
    affectedGroups: string[]
    magnitude: number
  }
  temporalBias?: {
    detected: boolean
    timePatterns: string[]
    magnitude: number
  }
}

interface ValidationQuery {
  validationMethod?: 'expert_review' | 'crowd_sourced' | 'comparative_analysis'
  minAgreement?: number
  maxDiscrepancy?: number
  validatorId?: string
  sortBy?: 'validatedAt' | 'agreement' | 'discrepancy'
  sortOrder?: 'asc' | 'desc'
  limit?: number
}

interface AggregateStatistics {
  averageAgreement: number
  meanAbsoluteError: number
  correlationCoefficient: number
  totalValidations: number
  highAgreementPercentage: number // Percentage with agreement > 0.9
  biasScore: number
  trendDirection: 'improving' | 'stable' | 'declining'
}

export class ValidationResultStorageService {
  constructor(private prisma: PrismaClient) {}

  async storeValidationResult(
    validationData: Omit<ValidationResult, 'id' | 'createdAt'>,
    transaction?: PrismaTransaction,
  ): Promise<ValidationResult> {
    // Calculate agreement and discrepancy if not provided
    const calculatedMetrics = this.calculateValidationMetrics(
      validationData.humanScore,
      validationData.algorithmScore,
    )

    // Use provided transaction or create a new one
    const execute = async (tx: PrismaTransaction) => {
      // Verify memory exists before creating validation result
      const memoryExists = await tx.memory.findUnique({
        where: { id: validationData.memoryId },
        select: { id: true },
      })

      if (!memoryExists) {
        throw new Error(
          `Memory with id ${validationData.memoryId} does not exist`,
        )
      }

      return await tx.validationResult.create({
        data: {
          memoryId: validationData.memoryId,
          humanScore: validationData.humanScore,
          algorithmScore: validationData.algorithmScore,
          agreement: validationData.agreement || calculatedMetrics.agreement,
          discrepancy:
            validationData.discrepancy || calculatedMetrics.discrepancy,
          validatorId: validationData.validatorId,
          validationMethod: validationData.validationMethod,
          feedback: validationData.feedback,
          biasIndicators: JSON.stringify(validationData.biasIndicators),
          accuracyMetrics: JSON.stringify(validationData.accuracyMetrics),
          validatedAt: validationData.validatedAt,
        },
      })
    }

    // Use provided transaction or create a new one
    const stored = transaction
      ? await execute(transaction)
      : await this.prisma.$transaction(execute)

    return {
      id: stored.id,
      memoryId: stored.memoryId,
      humanScore: stored.humanScore,
      algorithmScore: stored.algorithmScore,
      agreement: stored.agreement,
      discrepancy: stored.discrepancy,
      validatorId: stored.validatorId,
      validationMethod:
        stored.validationMethod as ValidationResult['validationMethod'],
      feedback: stored.feedback || undefined,
      biasIndicators: JSON.parse(stored.biasIndicators),
      accuracyMetrics: JSON.parse(stored.accuracyMetrics),
      validatedAt: stored.validatedAt,
      createdAt: stored.createdAt,
    }
  }

  calculateValidationMetrics(
    humanScore: number,
    algorithmScore: number,
  ): { agreement: number; discrepancy: number } {
    const discrepancy = Math.abs(humanScore - algorithmScore)

    // Calculate agreement on a 0-1 scale
    // Perfect agreement (0 discrepancy) = 1.0
    // Discrepancy of 4+ points = 0.6 (60% agreement)
    const maxDiscrepancy = 4.0
    const agreement = Math.max(0.6, 1.0 - (discrepancy / maxDiscrepancy) * 0.4)

    return {
      agreement: Math.round(agreement * 100) / 100, // Round to 2 decimal places
      discrepancy: Math.round(discrepancy * 10) / 10, // Round to 1 decimal place
    }
  }

  async getAccuracyTrend(
    metricType: string,
    timeWindow: string,
    fromDate?: Date,
  ): Promise<ValidationTrend> {
    const windowMs = this.parseTimeWindow(timeWindow)
    const baseDate = fromDate || new Date()
    const cutoffDate = new Date(baseDate.getTime() - windowMs)

    const results = await this.prisma.validationResult.findMany({
      where: {
        validatedAt: {
          gte: cutoffDate,
          lte: baseDate,
        },
      },
      orderBy: {
        validatedAt: 'asc',
      },
    })

    // Calculate trend data based on metric type
    const dataPoints = results.map((result) => ({
      timestamp: result.validatedAt,
      value: this.extractMetricValue(result, metricType),
    }))

    const trendSlope = this.calculateTrendSlope(dataPoints)
    const correlation = this.calculateCorrelation(dataPoints)

    return {
      metricType,
      timeWindow,
      dataPoints,
      trendSlope,
      correlationCoefficient: correlation,
      significanceLevel: Math.abs(correlation) > 0.7 ? 0.95 : 0.8,
      trendDirection:
        trendSlope > 0.01
          ? 'improving'
          : trendSlope < -0.01
            ? 'declining'
            : 'stable',
    }
  }

  async analyzeBiasPatterns(memoryId?: string): Promise<BiasAnalysis> {
    const whereClause = memoryId ? { memoryId } : {}

    const results = await this.prisma.validationResult.findMany({
      where: whereClause,
    })

    const differences = results.map((r) => r.humanScore - r.algorithmScore)
    const avgDifference =
      differences.reduce((sum, diff) => sum + diff, 0) / differences.length
    const overallBiasScore = Math.min(1.0, Math.abs(avgDifference) / 1.5) // Scale to 0-1, even more sensitive

    const biasPatterns = []

    // Detect systematic underestimation
    if (avgDifference > 0.5) {
      biasPatterns.push({
        pattern: 'systematic_underestimate',
        frequency:
          differences.filter((d) => d > 0.3).length / differences.length,
        impact:
          avgDifference > 1.2
            ? ('high' as const)
            : avgDifference > 0.6
              ? ('medium' as const)
              : ('low' as const),
        recommendations: [
          'Increase positive emotion sensitivity',
          'Calibrate algorithm for higher emotional ranges',
          'Add training data with strong positive emotions',
        ],
      })
    }

    // Detect systematic overestimation
    if (avgDifference < -0.5) {
      biasPatterns.push({
        pattern: 'systematic_overestimate',
        frequency:
          differences.filter((d) => d < -0.3).length / differences.length,
        impact:
          avgDifference < -1.5
            ? ('high' as const)
            : avgDifference < -0.8
              ? ('medium' as const)
              : ('low' as const),
        recommendations: [
          'Reduce algorithm sensitivity to emotional indicators',
          'Add negative training examples',
          'Implement conservative scoring adjustments',
        ],
      })
    }

    return {
      overallBiasScore,
      biasPatterns,
      demographicBias: {
        detected: false, // Placeholder - would need demographic data to implement
        affectedGroups: [],
        magnitude: 0,
      },
      temporalBias: {
        detected: false, // Placeholder - would need temporal analysis
        timePatterns: [],
        magnitude: 0,
      },
    }
  }

  async getBiasCorrectionsRecommendations(): Promise<string[]> {
    // Standard bias correction recommendations
    return [
      'Increase training data for underrepresented demographics',
      'Implement demographic-aware calibration adjustments',
      'Add contextual features for age-specific emotional expression patterns',
    ]
  }

  async getPerformanceImprovementRecommendations(): Promise<string[]> {
    const stats = await this.getAggregateAccuracyStatistics()
    const recommendations: string[] = []

    // Analyze correlation performance
    if (stats.correlationCoefficient < 0.8) {
      recommendations.push(
        'Increase correlation coefficient through feature engineering',
      )
    }

    // Analyze bias performance
    if (stats.biasScore > 0.3) {
      recommendations.push(
        'Address systematic bias with calibration adjustments',
      )
    }

    // Analyze error rate
    if (stats.meanAbsoluteError > 1.0) {
      recommendations.push(
        'Reduce mean absolute error through model refinement',
      )
    }

    // Analyze agreement rate
    if (stats.highAgreementPercentage < 0.8) {
      recommendations.push(
        'Improve human-algorithm agreement through better training data',
      )
    }

    // Check trend direction
    if (stats.trendDirection === 'declining') {
      recommendations.push('Address declining trend with model recalibration')
    }

    // Add standard recommendations
    recommendations.push(
      'Focus training on subtle emotional expression recognition',
    )
    recommendations.push('Collect more validation data for edge cases')

    return recommendations
  }

  async getValidationResults(
    query: ValidationQuery,
  ): Promise<ValidationResult[]> {
    const where: any = {}

    if (query.validationMethod) {
      where.validationMethod = query.validationMethod
    }

    if (query.minAgreement !== undefined) {
      where.agreement = { gte: query.minAgreement }
    }

    if (query.maxDiscrepancy !== undefined) {
      where.discrepancy = { lte: query.maxDiscrepancy }
    }

    if (query.validatorId) {
      where.validatorId = query.validatorId
    }

    const orderBy: any = {}
    if (query.sortBy) {
      orderBy[query.sortBy] = query.sortOrder || 'desc'
    } else {
      orderBy.validatedAt = 'desc'
    }

    const results = await this.prisma.validationResult.findMany({
      where,
      orderBy,
      take: query.limit,
    })

    return results.map((result) => ({
      id: result.id,
      memoryId: result.memoryId,
      humanScore: result.humanScore,
      algorithmScore: result.algorithmScore,
      agreement: result.agreement,
      discrepancy: result.discrepancy,
      validatorId: result.validatorId,
      validationMethod:
        result.validationMethod as ValidationResult['validationMethod'],
      feedback: result.feedback || undefined,
      biasIndicators: JSON.parse(result.biasIndicators),
      accuracyMetrics: JSON.parse(result.accuracyMetrics),
      validatedAt: result.validatedAt,
      createdAt: result.createdAt,
    }))
  }

  async getValidationResultWithMemory(validationId: string): Promise<{
    validationResult: ValidationResult
    memory: { id: string; summary: string; confidence: number }
  }> {
    const result = await this.prisma.validationResult.findUnique({
      where: { id: validationId },
      include: {
        memory: {
          select: {
            id: true,
            summary: true,
            confidence: true,
          },
        },
      },
    })

    if (!result) {
      throw new Error(`Validation result with id ${validationId} not found`)
    }

    return {
      validationResult: {
        id: result.id,
        memoryId: result.memoryId,
        humanScore: result.humanScore,
        algorithmScore: result.algorithmScore,
        agreement: result.agreement,
        discrepancy: result.discrepancy,
        validatorId: result.validatorId,
        validationMethod:
          result.validationMethod as ValidationResult['validationMethod'],
        feedback: result.feedback || undefined,
        biasIndicators: JSON.parse(result.biasIndicators),
        accuracyMetrics: JSON.parse(result.accuracyMetrics),
        validatedAt: result.validatedAt,
        createdAt: result.createdAt,
      },
      memory: result.memory,
    }
  }

  async getAggregateAccuracyStatistics(): Promise<AggregateStatistics> {
    const results = await this.prisma.validationResult.findMany()

    if (results.length === 0) {
      return {
        averageAgreement: 0,
        meanAbsoluteError: 0,
        correlationCoefficient: 0,
        totalValidations: 0,
        highAgreementPercentage: 0,
        biasScore: 0,
        trendDirection: 'stable',
      }
    }

    const agreements = results.map((r) => r.agreement)
    const discrepancies = results.map((r) => r.discrepancy)
    const humanScores = results.map((r) => r.humanScore)
    const algorithmScores = results.map((r) => r.algorithmScore)

    const averageAgreement =
      agreements.reduce((sum, a) => sum + a, 0) / agreements.length
    const meanAbsoluteError =
      discrepancies.reduce((sum, d) => sum + d, 0) / discrepancies.length
    const correlationCoefficient = this.calculatePearsonCorrelation(
      humanScores,
      algorithmScores,
    )
    const highAgreementCount = agreements.filter((a) => a > 0.9).length
    const highAgreementPercentage = highAgreementCount / agreements.length

    // Calculate bias score from human vs algorithm differences
    const differences = results.map((r) => r.humanScore - r.algorithmScore)
    const avgDifference =
      differences.reduce((sum, diff) => sum + diff, 0) / differences.length
    const biasScore = Math.min(1.0, Math.abs(avgDifference) / 4.0)

    // Determine trend direction (simplified - would need temporal analysis for real implementation)
    const trendDirection: 'improving' | 'stable' | 'declining' =
      correlationCoefficient > 0.85
        ? 'improving'
        : correlationCoefficient < 0.75
          ? 'declining'
          : 'stable'

    return {
      averageAgreement: Math.round(averageAgreement * 100) / 100,
      meanAbsoluteError: Math.round(meanAbsoluteError * 100) / 100,
      correlationCoefficient: Math.round(correlationCoefficient * 100) / 100,
      totalValidations: results.length,
      highAgreementPercentage: Math.round(highAgreementPercentage * 100) / 100,
      biasScore: Math.round(biasScore * 100) / 100,
      trendDirection,
    }
  }

  // Helper methods
  private parseTimeWindow(timeWindow: string): number {
    const value = parseInt(timeWindow.slice(0, -1))
    const unit = timeWindow.slice(-1)

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60 * 1000 // days to ms
      case 'h':
        return value * 60 * 60 * 1000 // hours to ms
      case 'm':
        return value * 60 * 1000 // minutes to ms
      default:
        return 7 * 24 * 60 * 60 * 1000 // default to 7 days
    }
  }

  private extractMetricValue(result: any, metricType: string): number {
    switch (metricType) {
      case 'correlation':
        return result.agreement
      case 'mean_absolute_error':
        return result.discrepancy
      case 'accuracy_percentage':
        return result.agreement
      default:
        return result.agreement
    }
  }

  private calculateTrendSlope(
    dataPoints: Array<{ timestamp: Date; value: number }>,
  ): number {
    if (dataPoints.length < 2) return 0

    const n = dataPoints.length
    const timestamps = dataPoints.map((p, i) => i) // Use index as x-value
    const values = dataPoints.map((p) => p.value)

    const sumX = timestamps.reduce((a, b) => a + b, 0)
    const sumY = values.reduce((a, b) => a + b, 0)
    const sumXY = timestamps.reduce((sum, x, i) => sum + x * values[i], 0)
    const sumXX = timestamps.reduce((sum, x) => sum + x * x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    return slope || 0
  }

  private calculateCorrelation(
    dataPoints: Array<{ timestamp: Date; value: number }>,
  ): number {
    if (dataPoints.length < 2) return 0

    const values = dataPoints.map((p) => p.value)
    const timestamps = dataPoints.map((p, i) => i) // Use index as x-value

    return this.calculatePearsonCorrelation(timestamps, values)
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length
    if (n === 0) return 0

    const sumX = x.reduce((a, b) => a + b, 0)
    const sumY = y.reduce((a, b) => a + b, 0)
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0)

    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt(
      (n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY),
    )

    return denominator === 0 ? 0 : numerator / denominator
  }

  // Additional performance tracking methods for Task 6.6

  async getPerformanceTrendsByTimeWindow(
    timeWindows: string[] = ['7d', '30d', '90d'],
  ): Promise<Record<string, ValidationTrend>> {
    const trends: Record<string, ValidationTrend> = {}

    for (const window of timeWindows) {
      trends[window] = await this.getAccuracyTrend('correlation', window)
    }

    return trends
  }

  async getValidatorPerformanceComparison(): Promise<
    Array<{
      validatorId: string
      averageAgreement: number
      totalValidations: number
      biasScore: number
      validationMethod: string
    }>
  > {
    const validators = await this.prisma.validationResult.groupBy({
      by: ['validatorId', 'validationMethod'],
      _avg: {
        agreement: true,
        discrepancy: true,
      },
      _count: {
        id: true,
      },
    })

    return validators.map((validator) => ({
      validatorId: validator.validatorId,
      averageAgreement: Math.round((validator._avg.agreement || 0) * 100) / 100,
      totalValidations: validator._count.id,
      biasScore: Math.round((validator._avg.discrepancy || 0) * 100) / 100,
      validationMethod: validator.validationMethod,
    }))
  }

  async getMethodologyPerformanceComparison(): Promise<
    Array<{
      validationMethod: string
      averageAgreement: number
      averageDiscrepancy: number
      totalValidations: number
      reliability: 'high' | 'medium' | 'low'
    }>
  > {
    const methods = await this.prisma.validationResult.groupBy({
      by: ['validationMethod'],
      _avg: {
        agreement: true,
        discrepancy: true,
      },
      _count: {
        id: true,
      },
    })

    return methods.map((method) => {
      const avgAgreement = method._avg.agreement || 0
      const reliability =
        avgAgreement > 0.9 ? 'high' : avgAgreement > 0.7 ? 'medium' : 'low'

      return {
        validationMethod: method.validationMethod,
        averageAgreement: Math.round(avgAgreement * 100) / 100,
        averageDiscrepancy:
          Math.round((method._avg.discrepancy || 0) * 100) / 100,
        totalValidations: method._count.id,
        reliability: reliability as 'high' | 'medium' | 'low',
      }
    })
  }

  async getImprovementMetrics(
    baselineDate: Date,
    comparisonDate: Date = new Date(),
  ): Promise<{
    correlationImprovement: number
    biasReduction: number
    agreementImprovement: number
    errorReduction: number
    overallImprovement: 'significant' | 'moderate' | 'minimal' | 'declining'
  }> {
    // Get baseline metrics
    const baselineResults = await this.prisma.validationResult.findMany({
      where: {
        validatedAt: {
          lte: baselineDate,
        },
      },
    })

    // Get comparison metrics
    const comparisonResults = await this.prisma.validationResult.findMany({
      where: {
        validatedAt: {
          gt: baselineDate,
          lte: comparisonDate,
        },
      },
    })

    if (baselineResults.length === 0 || comparisonResults.length === 0) {
      return {
        correlationImprovement: 0,
        biasReduction: 0,
        agreementImprovement: 0,
        errorReduction: 0,
        overallImprovement: 'minimal',
      }
    }

    // Calculate baseline stats
    const baselineAgreement =
      baselineResults.reduce((sum, r) => sum + r.agreement, 0) /
      baselineResults.length
    const baselineDiscrepancy =
      baselineResults.reduce((sum, r) => sum + r.discrepancy, 0) /
      baselineResults.length
    const baselineHuman = baselineResults.map((r) => r.humanScore)
    const baselineAlgorithm = baselineResults.map((r) => r.algorithmScore)
    const baselineCorrelation = this.calculatePearsonCorrelation(
      baselineHuman,
      baselineAlgorithm,
    )

    // Calculate comparison stats
    const comparisonAgreement =
      comparisonResults.reduce((sum, r) => sum + r.agreement, 0) /
      comparisonResults.length
    const comparisonDiscrepancy =
      comparisonResults.reduce((sum, r) => sum + r.discrepancy, 0) /
      comparisonResults.length
    const comparisonHuman = comparisonResults.map((r) => r.humanScore)
    const comparisonAlgorithm = comparisonResults.map((r) => r.algorithmScore)
    const comparisonCorrelation = this.calculatePearsonCorrelation(
      comparisonHuman,
      comparisonAlgorithm,
    )

    // Calculate improvements
    const correlationImprovement = comparisonCorrelation - baselineCorrelation
    const biasReduction = baselineDiscrepancy - comparisonDiscrepancy
    const agreementImprovement = comparisonAgreement - baselineAgreement
    const errorReduction = baselineDiscrepancy - comparisonDiscrepancy

    // Determine overall improvement
    const improvements = [
      correlationImprovement,
      biasReduction,
      agreementImprovement,
      errorReduction,
    ]
    const positiveImprovements = improvements.filter((i) => i > 0).length
    const significantImprovements = improvements.filter((i) => i > 0.1).length

    let overallImprovement: 'significant' | 'moderate' | 'minimal' | 'declining'
    if (significantImprovements >= 3) {
      overallImprovement = 'significant'
    } else if (positiveImprovements >= 3) {
      overallImprovement = 'moderate'
    } else if (positiveImprovements >= 2) {
      overallImprovement = 'minimal'
    } else {
      overallImprovement = 'declining'
    }

    return {
      correlationImprovement: Math.round(correlationImprovement * 100) / 100,
      biasReduction: Math.round(biasReduction * 100) / 100,
      agreementImprovement: Math.round(agreementImprovement * 100) / 100,
      errorReduction: Math.round(errorReduction * 100) / 100,
      overallImprovement,
    }
  }

  async exportValidationDataForAnalysis(
    filters: {
      dateRange?: { start: Date; end: Date }
      validationMethods?: string[]
      minAgreement?: number
    } = {},
  ): Promise<{
    rawData: ValidationResult[]
    summary: {
      totalRecords: number
      dateRange: { start: Date; end: Date }
      averageMetrics: {
        agreement: number
        discrepancy: number
        correlation: number
      }
    }
  }> {
    const where: any = {}

    if (filters.dateRange) {
      where.validatedAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end,
      }
    }

    if (filters.validationMethods) {
      where.validationMethod = {
        in: filters.validationMethods,
      }
    }

    if (filters.minAgreement) {
      where.agreement = {
        gte: filters.minAgreement,
      }
    }

    const results = await this.prisma.validationResult.findMany({
      where,
      orderBy: { validatedAt: 'asc' },
    })

    const rawData = results.map((result) => ({
      id: result.id,
      memoryId: result.memoryId,
      humanScore: result.humanScore,
      algorithmScore: result.algorithmScore,
      agreement: result.agreement,
      discrepancy: result.discrepancy,
      validatorId: result.validatorId,
      validationMethod:
        result.validationMethod as ValidationResult['validationMethod'],
      feedback: result.feedback || undefined,
      biasIndicators: JSON.parse(result.biasIndicators),
      accuracyMetrics: JSON.parse(result.accuracyMetrics),
      validatedAt: result.validatedAt,
      createdAt: result.createdAt,
    }))

    const summary = {
      totalRecords: results.length,
      dateRange: {
        start: results.length > 0 ? results[0].validatedAt : new Date(),
        end:
          results.length > 0
            ? results[results.length - 1].validatedAt
            : new Date(),
      },
      averageMetrics: {
        agreement:
          results.length > 0
            ? Math.round(
                (results.reduce((sum, r) => sum + r.agreement, 0) /
                  results.length) *
                  100,
              ) / 100
            : 0,
        discrepancy:
          results.length > 0
            ? Math.round(
                (results.reduce((sum, r) => sum + r.discrepancy, 0) /
                  results.length) *
                  100,
              ) / 100
            : 0,
        correlation:
          results.length > 0
            ? Math.round(
                this.calculatePearsonCorrelation(
                  results.map((r) => r.humanScore),
                  results.map((r) => r.algorithmScore),
                ) * 100,
              ) / 100
            : 0,
      },
    }

    return { rawData, summary }
  }
}
