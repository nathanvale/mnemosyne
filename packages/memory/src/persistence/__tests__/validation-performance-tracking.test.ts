import { PrismaClient } from '@studio/db'
import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest'

import { ValidationResultStorageService } from '../validation-result-storage'
import { TestDataFactory } from './test-data-factory'
import { WorkerDatabaseFactory } from './worker-database-factory'

describe('Validation Performance Tracking - Task 6.6', () => {
  let storageService: ValidationResultStorageService
  let prisma: PrismaClient
  let testDataFactory: TestDataFactory
  let testMemoryId: string

  beforeEach(async () => {
    // Use worker-specific database for isolation
    prisma = await WorkerDatabaseFactory.createWorkerPrismaClient()
    storageService = new ValidationResultStorageService(prisma)
    testDataFactory = new TestDataFactory(prisma)

    // Clean up any existing test data for isolation
    await WorkerDatabaseFactory.cleanWorkerData(prisma)

    // Create test data using the complete transaction approach to avoid isolation issues
    const testData = await testDataFactory.createCompleteTestData()
    testMemoryId = testData.memoryId
  })

  afterEach(async () => {
    // Clean up test data
    await prisma.validationResult.deleteMany()
    await prisma.memory.deleteMany()
    // Cleanup handled by WorkerDatabaseFactory
  })

  describe('Performance Trend Analysis', () => {
    it('should track performance trends across multiple time windows', async () => {
      // Create validation results over time
      const validationResults = [
        { agreement: 0.7, validatedAt: new Date('2025-01-01T10:00:00Z') },
        { agreement: 0.75, validatedAt: new Date('2025-01-10T10:00:00Z') },
        { agreement: 0.8, validatedAt: new Date('2025-01-20T10:00:00Z') },
        { agreement: 0.85, validatedAt: new Date('2025-01-30T10:00:00Z') },
        { agreement: 0.9, validatedAt: new Date('2025-02-10T10:00:00Z') },
      ]

      for (const result of validationResults) {
        await storageService.storeValidationResult({
          memoryId: testMemoryId,
          humanScore: 7.5,
          algorithmScore: 7.0,
          agreement: result.agreement,
          discrepancy: 0.5,
          validatorId: 'expert-001',
          validationMethod: 'expert_review',
          biasIndicators: [],
          accuracyMetrics: [],
          validatedAt: result.validatedAt,
        })
      }

      const trends = await storageService.getPerformanceTrendsByTimeWindow([
        '7d',
        '30d',
        '90d',
      ])

      expect(Object.keys(trends)).toHaveLength(3)
      expect(trends['7d']).toBeDefined()
      expect(trends['30d']).toBeDefined()
      expect(trends['90d']).toBeDefined()

      // Each trend should have the proper structure
      expect(trends['7d'].metricType).toBe('correlation')
      expect(trends['7d'].timeWindow).toBe('7d')
      expect(trends['7d'].dataPoints).toBeDefined()
      expect(trends['7d'].trendSlope).toBeDefined()
      expect(trends['7d'].correlationCoefficient).toBeDefined()
    })
  })

  describe('Validator Performance Comparison', () => {
    it('should compare performance metrics across different validators', async () => {
      // Create validation results from different validators
      const validators = [
        { id: 'expert-001', method: 'expert_review', agreement: 0.92 },
        { id: 'expert-002', method: 'expert_review', agreement: 0.88 },
        { id: 'crowd-001', method: 'crowd_sourced', agreement: 0.75 },
        { id: 'crowd-002', method: 'crowd_sourced', agreement: 0.78 },
      ]

      for (const validator of validators) {
        // Create multiple validations per validator
        for (let i = 0; i < 3; i++) {
          await storageService.storeValidationResult({
            memoryId: testMemoryId,
            humanScore: 8.0,
            algorithmScore: 7.5,
            agreement: validator.agreement + (Math.random() * 0.05 - 0.025), // Small variation
            discrepancy: 0.5,
            validatorId: validator.id,
            validationMethod: validator.method as
              | 'expert_review'
              | 'crowd_sourced',
            biasIndicators: [],
            accuracyMetrics: [],
            validatedAt: new Date(),
          })
        }
      }

      const comparison =
        await storageService.getValidatorPerformanceComparison()

      expect(comparison).toHaveLength(4)

      // Check expert validators
      const expert001 = comparison.find((v) => v.validatorId === 'expert-001')
      expect(expert001).toBeDefined()
      expect(expert001!.averageAgreement).toBeGreaterThanOrEqual(0.9)
      expect(expert001!.totalValidations).toBe(3)
      expect(expert001!.validationMethod).toBe('expert_review')

      // Check crowd validators
      const crowd001 = comparison.find((v) => v.validatorId === 'crowd-001')
      expect(crowd001).toBeDefined()
      expect(crowd001!.averageAgreement).toBeLessThan(0.8)
      expect(crowd001!.validationMethod).toBe('crowd_sourced')
    })
  })

  describe('Methodology Performance Comparison', () => {
    it('should analyze performance differences between validation methodologies', async () => {
      // Create validation results using different methodologies with fixed high-quality values for expert_review
      const expertReviewResults = [0.92, 0.94, 0.91, 0.93, 0.95] // Average = 0.93 (high reliability)
      const crowdSourcedResults = [0.74, 0.76, 0.73, 0.77, 0.75] // Average = 0.75 (medium reliability)
      const comparativeResults = [0.84, 0.86, 0.83, 0.87, 0.85] // Average = 0.85 (medium reliability)

      // Expert review results
      for (let i = 0; i < 5; i++) {
        await storageService.storeValidationResult({
          memoryId: testMemoryId,
          humanScore: 8.0,
          algorithmScore: 7.5,
          agreement: expertReviewResults[i],
          discrepancy: 0.3,
          validatorId: `expert-${i}`,
          validationMethod: 'expert_review',
          biasIndicators: [],
          accuracyMetrics: [],
          validatedAt: new Date(),
        })
      }

      // Crowd sourced results
      for (let i = 0; i < 5; i++) {
        await storageService.storeValidationResult({
          memoryId: testMemoryId,
          humanScore: 8.0,
          algorithmScore: 7.5,
          agreement: crowdSourcedResults[i],
          discrepancy: 0.6,
          validatorId: `crowd-${i}`,
          validationMethod: 'crowd_sourced',
          biasIndicators: [],
          accuracyMetrics: [],
          validatedAt: new Date(),
        })
      }

      // Comparative analysis results
      for (let i = 0; i < 5; i++) {
        await storageService.storeValidationResult({
          memoryId: testMemoryId,
          humanScore: 8.0,
          algorithmScore: 7.5,
          agreement: comparativeResults[i],
          discrepancy: 0.4,
          validatorId: `comp-${i}`,
          validationMethod: 'comparative_analysis',
          biasIndicators: [],
          accuracyMetrics: [],
          validatedAt: new Date(),
        })
      }

      const comparison =
        await storageService.getMethodologyPerformanceComparison()

      expect(comparison).toHaveLength(3)

      // Expert review should have highest reliability
      const expertReview = comparison.find(
        (m) => m.validationMethod === 'expert_review',
      )
      expect(expertReview).toBeDefined()
      expect(expertReview!.reliability).toBe('high')
      expect(expertReview!.averageAgreement).toBeGreaterThan(0.85)
      expect(expertReview!.totalValidations).toBe(5)

      // Crowd sourced should have lower reliability
      const crowdSourced = comparison.find(
        (m) => m.validationMethod === 'crowd_sourced',
      )
      expect(crowdSourced).toBeDefined()
      expect(crowdSourced!.reliability).toBe('medium')
      expect(crowdSourced!.averageDiscrepancy).toBeGreaterThan(0.5)
    })
  })

  describe('Improvement Metrics Tracking', () => {
    it('should calculate improvement metrics between baseline and comparison periods', async () => {
      const baselineDate = new Date('2025-01-15T00:00:00Z')
      const comparisonDate = new Date('2025-01-30T00:00:00Z')

      // Create baseline validation results (lower performance)
      const baselineResults = [
        { human: 7.0, algorithm: 6.0, date: new Date('2025-01-10T10:00:00Z') },
        { human: 7.5, algorithm: 6.5, date: new Date('2025-01-12T10:00:00Z') },
        { human: 8.0, algorithm: 7.0, date: new Date('2025-01-14T10:00:00Z') },
      ]

      // Create comparison validation results (higher performance)
      const comparisonResults = [
        { human: 8.0, algorithm: 7.8, date: new Date('2025-01-20T10:00:00Z') },
        { human: 8.5, algorithm: 8.2, date: new Date('2025-01-25T10:00:00Z') },
        { human: 9.0, algorithm: 8.9, date: new Date('2025-01-28T10:00:00Z') },
      ]

      // Store baseline results
      for (const result of baselineResults) {
        await storageService.storeValidationResult({
          memoryId: testMemoryId,
          humanScore: result.human,
          algorithmScore: result.algorithm,
          agreement: 0.8,
          discrepancy: Math.abs(result.human - result.algorithm),
          validatorId: 'expert-001',
          validationMethod: 'expert_review',
          biasIndicators: [],
          accuracyMetrics: [],
          validatedAt: result.date,
        })
      }

      // Store comparison results
      for (const result of comparisonResults) {
        await storageService.storeValidationResult({
          memoryId: testMemoryId,
          humanScore: result.human,
          algorithmScore: result.algorithm,
          agreement: 0.95,
          discrepancy: Math.abs(result.human - result.algorithm),
          validatorId: 'expert-001',
          validationMethod: 'expert_review',
          biasIndicators: [],
          accuracyMetrics: [],
          validatedAt: result.date,
        })
      }

      const improvements = await storageService.getImprovementMetrics(
        baselineDate,
        comparisonDate,
      )

      expect(improvements.agreementImprovement).toBeGreaterThan(0.1) // Should show improvement
      expect(improvements.biasReduction).toBeGreaterThan(0) // Bias should reduce
      expect(improvements.errorReduction).toBeGreaterThan(0) // Error should reduce
      // Note: Correlation improvement might be minimal due to small sample size
      expect(['significant', 'moderate']).toContain(
        improvements.overallImprovement,
      )
    })

    it('should detect declining performance when metrics worsen', async () => {
      const baselineDate = new Date('2025-01-15T00:00:00Z')
      const comparisonDate = new Date('2025-01-30T00:00:00Z')

      // Create baseline validation results (better performance)
      await storageService.storeValidationResult({
        memoryId: testMemoryId,
        humanScore: 8.0,
        algorithmScore: 7.9,
        agreement: 0.95,
        discrepancy: 0.1,
        validatorId: 'expert-001',
        validationMethod: 'expert_review',
        biasIndicators: [],
        accuracyMetrics: [],
        validatedAt: new Date('2025-01-10T10:00:00Z'),
      })

      // Create comparison validation results (worse performance)
      await storageService.storeValidationResult({
        memoryId: testMemoryId,
        humanScore: 8.0,
        algorithmScore: 6.0,
        agreement: 0.7,
        discrepancy: 2.0,
        validatorId: 'expert-001',
        validationMethod: 'expert_review',
        biasIndicators: [],
        accuracyMetrics: [],
        validatedAt: new Date('2025-01-20T10:00:00Z'),
      })

      const improvements = await storageService.getImprovementMetrics(
        baselineDate,
        comparisonDate,
      )

      expect(improvements.agreementImprovement).toBeLessThan(0) // Agreement should decline
      expect(improvements.errorReduction).toBeLessThan(0) // Error should increase
      expect(improvements.overallImprovement).toBe('declining')
    })
  })

  describe('Data Export for Analysis', () => {
    it('should export validation data with comprehensive filtering options', async () => {
      // Create diverse validation data
      const validationData = [
        {
          method: 'expert_review' as const,
          agreement: 0.9,
          date: new Date('2025-01-15T10:00:00Z'),
        },
        {
          method: 'crowd_sourced' as const,
          agreement: 0.75,
          date: new Date('2025-01-20T10:00:00Z'),
        },
        {
          method: 'expert_review' as const,
          agreement: 0.95,
          date: new Date('2025-01-25T10:00:00Z'),
        },
        {
          method: 'comparative_analysis' as const,
          agreement: 0.85,
          date: new Date('2025-01-30T10:00:00Z'),
        },
      ]

      for (const data of validationData) {
        await storageService.storeValidationResult({
          memoryId: testMemoryId,
          humanScore: 8.0,
          algorithmScore: 7.5,
          agreement: data.agreement,
          discrepancy: 0.5,
          validatorId: 'validator-001',
          validationMethod: data.method,
          biasIndicators: [],
          accuracyMetrics: [],
          validatedAt: data.date,
        })
      }

      // Test export with date range filter
      const dateRangeExport =
        await storageService.exportValidationDataForAnalysis({
          dateRange: {
            start: new Date('2025-01-15T00:00:00Z'),
            end: new Date('2025-01-25T23:59:59Z'),
          },
        })

      expect(dateRangeExport.rawData).toHaveLength(3) // Should include 3 results in range
      expect(dateRangeExport.summary.totalRecords).toBe(3)
      expect(dateRangeExport.summary.averageMetrics.agreement).toBeGreaterThan(
        0.8,
      )

      // Test export with validation method filter
      const methodExport = await storageService.exportValidationDataForAnalysis(
        {
          validationMethods: ['expert_review'],
        },
      )

      expect(methodExport.rawData).toHaveLength(2) // Should include only expert reviews
      expect(
        methodExport.rawData.every(
          (r) => r.validationMethod === 'expert_review',
        ),
      ).toBe(true)

      // Test export with minimum agreement filter
      const agreementExport =
        await storageService.exportValidationDataForAnalysis({
          minAgreement: 0.9,
        })

      expect(agreementExport.rawData).toHaveLength(2) // Should include only high agreement results
      expect(agreementExport.rawData.every((r) => r.agreement >= 0.9)).toBe(
        true,
      )
    })

    it('should provide comprehensive summary statistics for exported data', async () => {
      // Create validation results with known statistics
      const results = [
        { human: 7.0, algorithm: 7.2, agreement: 0.96 },
        { human: 8.0, algorithm: 7.8, agreement: 0.975 },
        { human: 9.0, algorithm: 8.9, agreement: 0.99 },
      ]

      for (const result of results) {
        await storageService.storeValidationResult({
          memoryId: testMemoryId,
          humanScore: result.human,
          algorithmScore: result.algorithm,
          agreement: result.agreement,
          discrepancy: Math.abs(result.human - result.algorithm),
          validatorId: 'expert-001',
          validationMethod: 'expert_review',
          biasIndicators: [],
          accuracyMetrics: [],
          validatedAt: new Date(),
        })
      }

      const exported = await storageService.exportValidationDataForAnalysis()

      expect(exported.summary.totalRecords).toBe(3)
      expect(exported.summary.averageMetrics.agreement).toBeCloseTo(0.975, 1)
      expect(exported.summary.averageMetrics.correlation).toBeGreaterThan(0.9)
      expect(exported.summary.averageMetrics.discrepancy).toBeLessThan(0.3)
      expect(exported.summary.dateRange.start).toBeDefined()
      expect(exported.summary.dateRange.end).toBeDefined()
    })
  })

  describe('Enhanced Performance Recommendations', () => {
    it('should provide data-driven performance improvement recommendations', async () => {
      // Create validation result with specific performance characteristics
      await storageService.storeValidationResult({
        memoryId: testMemoryId,
        humanScore: 8.0,
        algorithmScore: 6.0, // High discrepancy
        agreement: 0.7, // Low agreement
        discrepancy: 2.0, // High error
        validatorId: 'expert-001',
        validationMethod: 'expert_review',
        biasIndicators: [
          {
            type: 'systematic_underestimate',
            severity: 'high',
            description: 'Algorithm consistently underestimates',
            evidence: 'Large discrepancy observed',
            confidence: 0.9,
          },
        ],
        accuracyMetrics: [
          {
            metricType: 'correlation',
            value: 0.65, // Low correlation
            baseline: 0.85,
            performanceRating: 'needs_improvement',
            trendDirection: 'declining',
          },
        ],
        validatedAt: new Date(),
      })

      const recommendations =
        await storageService.getPerformanceImprovementRecommendations()

      // Should include recommendations based on actual performance data
      expect(recommendations).toContain(
        'Increase correlation coefficient through feature engineering',
      )
      expect(recommendations).toContain(
        'Address systematic bias with calibration adjustments',
      )
      expect(recommendations).toContain(
        'Reduce mean absolute error through model refinement',
      )
      expect(recommendations).toContain(
        'Improve human-algorithm agreement through better training data',
      )
      expect(recommendations).toContain(
        'Address declining trend with model recalibration',
      )
      expect(recommendations).toContain(
        'Focus training on subtle emotional expression recognition',
      )
      expect(recommendations).toContain(
        'Collect more validation data for edge cases',
      )

      expect(recommendations.length).toBeGreaterThanOrEqual(5)
    })
  })
})
