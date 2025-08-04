import { PrismaClient } from '@studio/db'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { ValidationResultStorageService } from '../validation-result-storage'
import { TestDataFactory } from './test-data-factory'
import { WorkerDatabaseFactory } from './worker-database-factory'

// Dummy types for TDD - will be replaced with actual imports once types are available
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

// Commented out unused interfaces - will be implemented when needed
// interface ValidationTrend { ... }
// interface BiasAnalysis { ... }

describe('Validation Result Storage - Task 6.5', () => {
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

    // Create complete test data using transaction to avoid foreign key issues
    const testData = await testDataFactory.createCompleteTestData({
      memoryOptions: {
        summary: 'Test memory for validation result storage',
      },
    })
    testMemoryId = testData.memoryId
  })

  afterEach(async () => {
    // Clean up test data
    await prisma.validationResult.deleteMany()
    await prisma.memory.deleteMany()
    // Cleanup handled by WorkerDatabaseFactory
  })

  describe('Validation Result Storage with Accuracy Monitoring', () => {
    it('should store validation results with human vs algorithm score comparison', async () => {
      const validationResult: Omit<ValidationResult, 'id' | 'createdAt'> = {
        memoryId: testMemoryId,
        humanScore: 7.2,
        algorithmScore: 6.8,
        agreement: 0.94, // High agreement
        discrepancy: 0.4,
        validatorId: 'expert-001',
        validationMethod: 'expert_review',
        feedback: 'Algorithm slightly underestimated emotional intensity',
        biasIndicators: [
          {
            type: 'systematic_underestimate',
            severity: 'low',
            description: 'Slight tendency to underestimate positive emotions',
            evidence: 'Human score 0.4 points higher',
            confidence: 0.7,
          },
        ],
        accuracyMetrics: [
          {
            metricType: 'correlation',
            value: 0.89,
            baseline: 0.85, // Target correlation
            performanceRating: 'good',
            trendDirection: 'improving',
          },
        ],
        validatedAt: new Date('2025-01-22T10:00:00Z'),
      }

      const stored =
        await storageService.storeValidationResult(validationResult)

      expect(stored.id).toBeDefined()
      expect(stored.memoryId).toBe(testMemoryId)
      expect(stored.humanScore).toBe(7.2)
      expect(stored.algorithmScore).toBe(6.8)
      expect(stored.agreement).toBeCloseTo(0.94)
      expect(stored.discrepancy).toBeCloseTo(0.4)
      expect(stored.validatorId).toBe('expert-001')
      expect(stored.validationMethod).toBe('expert_review')
      expect(stored.biasIndicators).toHaveLength(1)
      expect(stored.biasIndicators[0].type).toBe('systematic_underestimate')
      expect(stored.accuracyMetrics).toHaveLength(1)
      expect(stored.accuracyMetrics[0].metricType).toBe('correlation')
      expect(stored.validatedAt).toEqual(new Date('2025-01-22T10:00:00Z'))
    })

    it('should calculate agreement and discrepancy metrics automatically', async () => {
      const testCases = [
        {
          human: 8.0,
          algorithm: 8.1,
          expectedAgreement: 0.99,
          expectedDiscrepancy: 0.1,
        },
        {
          human: 6.5,
          algorithm: 7.5,
          expectedAgreement: 0.9,
          expectedDiscrepancy: 1.0,
        },
        {
          human: 9.0,
          algorithm: 5.0,
          expectedAgreement: 0.6,
          expectedDiscrepancy: 4.0,
        },
      ]

      for (const testCase of testCases) {
        const result = await storageService.calculateValidationMetrics(
          testCase.human,
          testCase.algorithm,
        )

        expect(result.agreement).toBeCloseTo(testCase.expectedAgreement, 1)
        expect(result.discrepancy).toBeCloseTo(testCase.expectedDiscrepancy, 1)
      }
    })

    it('should track accuracy trends over time', async () => {
      // Store multiple validation results over time
      const validationResults = [
        {
          humanScore: 7.0,
          algorithmScore: 6.5,
          validatedAt: new Date('2025-01-15T10:00:00Z'),
        },
        {
          humanScore: 7.5,
          algorithmScore: 7.2,
          validatedAt: new Date('2025-01-16T10:00:00Z'),
        },
        {
          humanScore: 8.0,
          algorithmScore: 7.9,
          validatedAt: new Date('2025-01-17T10:00:00Z'),
        },
        {
          humanScore: 8.2,
          algorithmScore: 8.3,
          validatedAt: new Date('2025-01-18T10:00:00Z'),
        },
      ]

      for (let i = 0; i < validationResults.length; i++) {
        const result = validationResults[i]
        const improvingAgreement = 0.8 + i * 0.05 // Starts at 0.80, improves to 0.95
        await storageService.storeValidationResult({
          memoryId: testMemoryId,
          humanScore: result.humanScore,
          algorithmScore: result.algorithmScore,
          agreement: improvingAgreement,
          discrepancy: Math.abs(result.humanScore - result.algorithmScore),
          validatorId: 'expert-001',
          validationMethod: 'expert_review',
          biasIndicators: [],
          accuracyMetrics: [],
          validatedAt: result.validatedAt,
        })
      }

      const trend = await storageService.getAccuracyTrend(
        'correlation',
        '7d',
        new Date('2025-01-19T10:00:00Z'),
      )

      expect(trend.dataPoints).toHaveLength(4)
      expect(trend.trendSlope).toBeGreaterThan(0) // Positive slope indicates improvement
      expect(trend.trendDirection).toBe('improving')
      expect(trend.correlationCoefficient).toBeGreaterThan(0.5)
    })
  })

  describe('Bias Analysis and Detection', () => {
    it('should detect systematic bias patterns in validation results', async () => {
      // Create validation results showing systematic underestimation
      const biasedResults = [
        { human: 8.0, algorithm: 7.0 }, // Algorithm 1.0 lower
        { human: 7.5, algorithm: 6.8 }, // Algorithm 0.7 lower
        { human: 9.0, algorithm: 8.2 }, // Algorithm 0.8 lower
        { human: 6.5, algorithm: 5.9 }, // Algorithm 0.6 lower
        { human: 8.5, algorithm: 7.7 }, // Algorithm 0.8 lower
      ]

      for (const result of biasedResults) {
        await storageService.storeValidationResult({
          memoryId: testMemoryId,
          humanScore: result.human,
          algorithmScore: result.algorithm,
          agreement: 0.85,
          discrepancy: Math.abs(result.human - result.algorithm),
          validatorId: 'expert-001',
          validationMethod: 'expert_review',
          biasIndicators: [],
          accuracyMetrics: [],
          validatedAt: new Date(),
        })
      }

      const biasAnalysis =
        await storageService.analyzeBiasPatterns(testMemoryId)

      expect(biasAnalysis.overallBiasScore).toBeGreaterThan(0.5) // Significant bias detected
      expect(biasAnalysis.biasPatterns).toHaveLength(1)
      expect(biasAnalysis.biasPatterns[0].pattern).toBe(
        'systematic_underestimate',
      )
      expect(biasAnalysis.biasPatterns[0].impact).toBe('medium')
      expect(biasAnalysis.biasPatterns[0].recommendations).toContain(
        'Increase positive emotion sensitivity',
      )
    })

    it('should track bias indicators and severity levels', async () => {
      const validationWithBias: Omit<ValidationResult, 'id' | 'createdAt'> = {
        memoryId: testMemoryId,
        humanScore: 8.5,
        algorithmScore: 6.0,
        agreement: 0.71,
        discrepancy: 2.5,
        validatorId: 'expert-002',
        validationMethod: 'expert_review',
        biasIndicators: [
          {
            type: 'systematic_underestimate',
            severity: 'high',
            description: 'Consistent underestimation of celebration moments',
            evidence: 'Algorithm scored 2.5 points lower than human expert',
            confidence: 0.92,
          },
          {
            type: 'context_bias',
            severity: 'medium',
            description: 'Lower accuracy in group conversation contexts',
            evidence:
              'Multi-participant conversations show 20% lower correlation',
            confidence: 0.78,
          },
        ],
        accuracyMetrics: [
          {
            metricType: 'mean_absolute_error',
            value: 2.1,
            baseline: 1.0, // Target MAE
            performanceRating: 'needs_improvement',
            trendDirection: 'stable',
          },
        ],
        validatedAt: new Date('2025-01-22T11:00:00Z'),
      }

      const stored =
        await storageService.storeValidationResult(validationWithBias)

      expect(stored.biasIndicators).toHaveLength(2)

      const systematicBias = stored.biasIndicators.find(
        (b) => b.type === 'systematic_underestimate',
      )
      expect(systematicBias?.severity).toBe('high')
      expect(systematicBias?.confidence).toBeCloseTo(0.92)

      const contextBias = stored.biasIndicators.find(
        (b) => b.type === 'context_bias',
      )
      expect(contextBias?.severity).toBe('medium')
      expect(contextBias?.confidence).toBeCloseTo(0.78)
    })

    it('should provide bias correction recommendations', async () => {
      // Store validation results indicating demographic bias
      await storageService.storeValidationResult({
        memoryId: testMemoryId,
        humanScore: 7.8,
        algorithmScore: 6.2,
        agreement: 0.79,
        discrepancy: 1.6,
        validatorId: 'expert-003',
        validationMethod: 'expert_review',
        biasIndicators: [
          {
            type: 'demographic_bias',
            severity: 'high',
            description: 'Lower accuracy for certain age groups',
            evidence:
              'Young adult conversations underscored by average 1.5 points',
            confidence: 0.88,
          },
        ],
        accuracyMetrics: [],
        validatedAt: new Date(),
      })

      const recommendations =
        await storageService.getBiasCorrectionsRecommendations()

      expect(recommendations).toHaveLength(3)
      expect(recommendations).toContain(
        'Increase training data for underrepresented demographics',
      )
      expect(recommendations).toContain(
        'Implement demographic-aware calibration adjustments',
      )
      expect(recommendations).toContain(
        'Add contextual features for age-specific emotional expression patterns',
      )
    })
  })

  describe('Performance Monitoring and Trend Analysis', () => {
    it('should track multiple accuracy metrics simultaneously', async () => {
      const validationWithMetrics: Omit<ValidationResult, 'id' | 'createdAt'> =
        {
          memoryId: testMemoryId,
          humanScore: 7.5,
          algorithmScore: 7.2,
          agreement: 0.96,
          discrepancy: 0.3,
          validatorId: 'expert-004',
          validationMethod: 'expert_review',
          biasIndicators: [],
          accuracyMetrics: [
            {
              metricType: 'correlation',
              value: 0.91,
              baseline: 0.85,
              performanceRating: 'excellent',
              trendDirection: 'improving',
            },
            {
              metricType: 'mean_absolute_error',
              value: 0.8,
              baseline: 1.0,
              performanceRating: 'good',
              trendDirection: 'improving',
            },
            {
              metricType: 'accuracy_percentage',
              value: 0.88,
              baseline: 0.8,
              performanceRating: 'excellent',
              trendDirection: 'stable',
            },
          ],
          validatedAt: new Date('2025-01-22T12:00:00Z'),
        }

      const stored = await storageService.storeValidationResult(
        validationWithMetrics,
      )

      expect(stored.accuracyMetrics).toHaveLength(3)

      const correlation = stored.accuracyMetrics.find(
        (m) => m.metricType === 'correlation',
      )
      expect(correlation?.value).toBeCloseTo(0.91)
      expect(correlation?.performanceRating).toBe('excellent')

      const mae = stored.accuracyMetrics.find(
        (m) => m.metricType === 'mean_absolute_error',
      )
      expect(mae?.value).toBeCloseTo(0.8)
      expect(mae?.performanceRating).toBe('good')

      const accuracy = stored.accuracyMetrics.find(
        (m) => m.metricType === 'accuracy_percentage',
      )
      expect(accuracy?.value).toBeCloseTo(0.88)
      expect(accuracy?.trendDirection).toBe('stable')
    })

    it('should generate performance improvement recommendations', async () => {
      // Store validation result indicating areas for improvement
      await storageService.storeValidationResult({
        memoryId: testMemoryId,
        humanScore: 8.0,
        algorithmScore: 6.5,
        agreement: 0.81,
        discrepancy: 1.5,
        validatorId: 'expert-005',
        validationMethod: 'expert_review',
        feedback: 'Algorithm struggles with subtle emotional nuances',
        biasIndicators: [],
        accuracyMetrics: [
          {
            metricType: 'correlation',
            value: 0.75,
            baseline: 0.85,
            performanceRating: 'needs_improvement',
            trendDirection: 'declining',
          },
        ],
        validatedAt: new Date(),
      })

      const improvements =
        await storageService.getPerformanceImprovementRecommendations()

      expect(improvements.length).toBeGreaterThanOrEqual(4)
      expect(improvements).toContain(
        'Focus training on subtle emotional expression recognition',
      )
      expect(improvements).toContain(
        'Increase correlation coefficient through feature engineering',
      )
      expect(improvements).toContain(
        'Address declining trend with model recalibration',
      )
      expect(improvements).toContain(
        'Collect more validation data for edge cases',
      )
    })

    it('should retrieve validation results with filtering and sorting', async () => {
      // Create validation results with different characteristics
      const validationResults = [
        {
          validatorId: 'expert-001',
          agreement: 0.95,
          validationMethod: 'expert_review' as const,
          validatedAt: new Date('2025-01-20T10:00:00Z'),
        },
        {
          validatorId: 'crowd-001',
          agreement: 0.82,
          validationMethod: 'crowd_sourced' as const,
          validatedAt: new Date('2025-01-21T10:00:00Z'),
        },
        {
          validatorId: 'expert-002',
          agreement: 0.88,
          validationMethod: 'expert_review' as const,
          validatedAt: new Date('2025-01-22T10:00:00Z'),
        },
      ]

      for (const result of validationResults) {
        await storageService.storeValidationResult({
          memoryId: testMemoryId,
          humanScore: 7.5,
          algorithmScore: 7.0,
          agreement: result.agreement,
          discrepancy: 0.5,
          validatorId: result.validatorId,
          validationMethod: result.validationMethod,
          biasIndicators: [],
          accuracyMetrics: [],
          validatedAt: result.validatedAt,
        })
      }

      // Filter by validation method
      const expertResults = await storageService.getValidationResults({
        validationMethod: 'expert_review',
      })
      expect(expertResults).toHaveLength(2)
      expect(
        expertResults.every((r) => r.validationMethod === 'expert_review'),
      ).toBe(true)

      // Filter by agreement threshold
      const highAgreementResults = await storageService.getValidationResults({
        minAgreement: 0.9,
      })
      expect(highAgreementResults).toHaveLength(1)
      expect(highAgreementResults[0].agreement).toBeCloseTo(0.95)

      // Sort by date (newest first)
      const sortedResults = await storageService.getValidationResults({
        sortBy: 'validatedAt',
        sortOrder: 'desc',
      })
      expect(sortedResults).toHaveLength(3)
      expect(sortedResults[0].validatedAt.getTime()).toBeGreaterThan(
        sortedResults[1].validatedAt.getTime(),
      )
    })
  })

  describe('Data Consistency and Integration', () => {
    it('should maintain referential integrity with memory records', async () => {
      const validationResult: Omit<ValidationResult, 'id' | 'createdAt'> = {
        memoryId: testMemoryId,
        humanScore: 7.8,
        algorithmScore: 7.5,
        agreement: 0.96,
        discrepancy: 0.3,
        validatorId: 'expert-001',
        validationMethod: 'expert_review',
        biasIndicators: [],
        accuracyMetrics: [],
        validatedAt: new Date(),
      }

      const stored =
        await storageService.storeValidationResult(validationResult)

      // Verify the validation result is linked to the correct memory
      const retrievedWithMemory =
        await storageService.getValidationResultWithMemory(stored.id)

      expect(retrievedWithMemory.validationResult.id).toBe(stored.id)
      expect(retrievedWithMemory.memory.id).toBe(testMemoryId)
      expect(retrievedWithMemory.memory.summary).toBe(
        'Test memory for validation result storage',
      )
    })

    it('should handle cascade deletion when memory is removed', async () => {
      // Store validation result
      const _stored = await storageService.storeValidationResult({
        memoryId: testMemoryId,
        humanScore: 8.0,
        algorithmScore: 7.8,
        agreement: 0.975,
        discrepancy: 0.2,
        validatorId: 'expert-001',
        validationMethod: 'expert_review',
        biasIndicators: [],
        accuracyMetrics: [],
        validatedAt: new Date(),
      })

      // Verify validation result exists
      const beforeDeletion = await storageService.getValidationResults({})
      expect(beforeDeletion).toHaveLength(1)

      // Delete the memory
      await prisma.memory.delete({
        where: { id: testMemoryId },
      })

      // Verify validation result is automatically deleted due to cascade
      const afterDeletion = await storageService.getValidationResults({})
      expect(afterDeletion).toHaveLength(0)
    })

    it('should calculate aggregate accuracy statistics', async () => {
      // Store multiple validation results
      const results = [
        { human: 8.0, algorithm: 7.8, agreement: 0.975 },
        { human: 7.5, algorithm: 7.2, agreement: 0.96 },
        { human: 9.0, algorithm: 8.5, agreement: 0.944 },
        { human: 6.0, algorithm: 6.1, agreement: 0.983 },
        { human: 8.5, algorithm: 8.0, agreement: 0.941 },
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

      const statistics = await storageService.getAggregateAccuracyStatistics()

      expect(statistics.averageAgreement).toBeCloseTo(0.96, 2)
      expect(statistics.meanAbsoluteError).toBeLessThan(0.5)
      expect(statistics.correlationCoefficient).toBeGreaterThan(0.9)
      expect(statistics.totalValidations).toBe(5)
      expect(statistics.highAgreementPercentage).toBeGreaterThan(0.8) // >80% with high agreement
    })
  })
})
