import { vi } from 'vitest'

import type {
  ValidationResult,
  CalibrationAdjustment,
  ValidationMetrics,
} from '../../types'

import { AlgorithmCalibrationManager } from '../calibration-system'

describe('Algorithm Calibration System (Task 4.6)', () => {
  let calibrationManager: AlgorithmCalibrationManager

  beforeEach(() => {
    calibrationManager = new AlgorithmCalibrationManager()
  })

  describe('Calibration System Configuration', () => {
    it('should initialize with default configuration values', () => {
      expect(calibrationManager.config.maxCalibrationsPerSession).toBe(3)
      expect(calibrationManager.config.minValidationSampleSize).toBe(5)
      expect(calibrationManager.config.calibrationConfidenceThreshold).toBe(0.7)
      expect(calibrationManager.config.autoApplyCalibrations).toBe(false)
      expect(calibrationManager.config.minImprovementThreshold).toBe(0.05)
    })

    it('should accept custom configuration values', () => {
      const customConfig = {
        maxCalibrationsPerSession: 5,
        minValidationSampleSize: 10,
        calibrationConfidenceThreshold: 0.8,
        autoApplyCalibrations: true,
        minImprovementThreshold: 0.1,
      }

      const customManager = new AlgorithmCalibrationManager(customConfig)

      expect(customManager.config.maxCalibrationsPerSession).toBe(5)
      expect(customManager.config.minValidationSampleSize).toBe(10)
      expect(customManager.config.calibrationConfidenceThreshold).toBe(0.8)
      expect(customManager.config.autoApplyCalibrations).toBe(true)
      expect(customManager.config.minImprovementThreshold).toBe(0.1)
    })

    it('should initialize performance tracking with baseline metrics', () => {
      const baselineMetrics: ValidationMetrics = {
        pearsonCorrelation: 0.75,
        spearmanCorrelation: 0.73,
        meanAbsoluteError: 1.2,
        rootMeanSquareError: 1.8,
        agreementPercentage: 70,
        concordanceLevel: 'moderate',
        statisticalSignificance: {
          pValue: 0.05,
          isSignificant: true,
          confidenceInterval: [0.6, 0.9],
        },
        sampleSize: 50,
      }

      const manager = new AlgorithmCalibrationManager({}, baselineMetrics)

      expect(manager.performanceTracking.baselineMetrics).toEqual(
        baselineMetrics,
      )
      expect(manager.performanceTracking.currentMetrics).toEqual(
        baselineMetrics,
      )
      expect(manager.performanceTracking.improvementTrend).toEqual([])
    })
  })

  describe('Calibration Adjustment Generation', () => {
    it('should generate weight adjustments for systematic over-estimation bias', async () => {
      const validationResult = createValidationResultWithBias(
        'algorithmic_over_estimation',
        1.5,
      )

      const adjustments =
        await calibrationManager.generateCalibrationAdjustments(
          validationResult,
        )

      expect(adjustments).toHaveLength(1)
      const weightAdjustment = adjustments[0]
      expect(weightAdjustment.adjustmentType).toBe('weight_adjustment')
      expect(weightAdjustment.targetComponent).toBe('sentiment_analysis')
      expect(weightAdjustment.parameterAdjustments[0].parameterName).toBe(
        'sentiment_weight',
      )
      expect(
        weightAdjustment.parameterAdjustments[0].recommendedValue,
      ).toBeLessThan(weightAdjustment.parameterAdjustments[0].currentValue)
      expect(
        weightAdjustment.predictedImprovements.biasReduction,
      ).toBeGreaterThan(0)
    })

    it('should generate weight adjustments for systematic under-estimation bias', async () => {
      const validationResult = createValidationResultWithBias(
        'algorithmic_under_estimation',
        1.3,
      )

      const adjustments =
        await calibrationManager.generateCalibrationAdjustments(
          validationResult,
        )

      expect(adjustments).toHaveLength(1)
      const weightAdjustment = adjustments[0]
      expect(weightAdjustment.adjustmentType).toBe('weight_adjustment')
      expect(
        weightAdjustment.parameterAdjustments[0].recommendedValue,
      ).toBeGreaterThan(weightAdjustment.parameterAdjustments[0].currentValue)
    })

    it('should generate threshold adjustments for overconfidence issues', async () => {
      const validationResult = createValidationResultWithOverconfidence()

      const adjustments =
        await calibrationManager.generateCalibrationAdjustments(
          validationResult,
        )

      const thresholdAdjustment = adjustments.find(
        (adj) => adj.adjustmentType === 'threshold_adjustment',
      )
      expect(thresholdAdjustment).toBeDefined()
      expect(thresholdAdjustment!.targetComponent).toBe('confidence_calculator')
      expect(thresholdAdjustment!.parameterAdjustments[0].parameterName).toBe(
        'confidence_threshold_high',
      )
      expect(
        thresholdAdjustment!.parameterAdjustments[0].recommendedValue,
      ).toBeGreaterThan(0.8)
    })

    it('should generate bias corrections for specific bias patterns', async () => {
      const validationResult = createValidationResultWithSpecificBias()

      const adjustments =
        await calibrationManager.generateCalibrationAdjustments(
          validationResult,
        )

      const biasCorrection = adjustments.find(
        (adj) => adj.adjustmentType === 'bias_correction',
      )
      expect(biasCorrection).toBeDefined()
      expect(biasCorrection!.parameterAdjustments[0].parameterName).toContain(
        '_correction_factor',
      )
      expect(
        biasCorrection!.predictedImprovements.biasReduction,
      ).toBeGreaterThan(0.25)
    })

    it('should limit adjustments to maximum per session', async () => {
      const manager = new AlgorithmCalibrationManager({
        maxCalibrationsPerSession: 2,
      })
      const validationResult = createValidationResultWithMultipleBiases()

      const adjustments =
        await manager.generateCalibrationAdjustments(validationResult)

      expect(adjustments.length).toBeLessThanOrEqual(2)
    })

    it('should return empty array for insufficient validation sample size', async () => {
      const validationResult = createValidationResultWithBias(
        'algorithmic_over_estimation',
        1.5,
      )
      validationResult.overallMetrics.sampleSize = 3 // Below default minimum of 5

      const adjustments =
        await calibrationManager.generateCalibrationAdjustments(
          validationResult,
        )

      expect(adjustments).toHaveLength(0)
    })
  })

  describe('Calibration Adjustment Application', () => {
    it('should apply successful calibration adjustments', async () => {
      const adjustments = [createMockCalibrationAdjustment()]

      // Mock successful parameter application
      vi.spyOn(
        calibrationManager as unknown as {
          applyParameterAdjustments: () => Promise<boolean>
        },
        'applyParameterAdjustments',
      ).mockResolvedValue(true)

      const result =
        await calibrationManager.applyCalibrationAdjustments(adjustments)

      expect(result.applied).toHaveLength(1)
      expect(result.rejected).toHaveLength(0)
      expect(result.applied[0].status).toBe('applied')
      expect(calibrationManager.activeCalibrations).toHaveLength(1)
    })

    it('should reject failed calibration adjustments', async () => {
      const adjustments = [createMockCalibrationAdjustment()]

      // Mock failed parameter application
      vi.spyOn(
        calibrationManager as unknown as {
          applyParameterAdjustments: () => Promise<boolean>
        },
        'applyParameterAdjustments',
      ).mockResolvedValue(false)

      const result =
        await calibrationManager.applyCalibrationAdjustments(adjustments)

      expect(result.applied).toHaveLength(0)
      expect(result.rejected).toHaveLength(1)
      expect(result.rejected[0].status).toBe('rejected')
      expect(calibrationManager.activeCalibrations).toHaveLength(0)
    })

    it('should handle parameter application errors gracefully', async () => {
      const adjustments = [createMockCalibrationAdjustment()]

      // Mock error during parameter application
      vi.spyOn(
        calibrationManager as unknown as {
          applyParameterAdjustments: () => Promise<boolean>
        },
        'applyParameterAdjustments',
      ).mockRejectedValue(new Error('Application failed'))

      const result =
        await calibrationManager.applyCalibrationAdjustments(adjustments)

      expect(result.applied).toHaveLength(0)
      expect(result.rejected).toHaveLength(1)
      expect(result.rejected[0].status).toBe('rejected')
    })
  })

  describe('Calibration Effectiveness Validation', () => {
    it('should validate successful calibration with improved metrics', async () => {
      const adjustment = createMockCalibrationAdjustment()
      adjustment.status = 'applied'
      calibrationManager.activeCalibrations.push(adjustment)

      const afterValidationResult = createImprovedValidationResult()

      const validatedAdjustment =
        await calibrationManager.validateCalibrationEffectiveness(
          adjustment,
          afterValidationResult,
        )

      expect(validatedAdjustment.status).toBe('validated')
      expect(validatedAdjustment.validationResults).toBeDefined()
      expect(
        validatedAdjustment.validationResults!.actualCorrelationImprovement,
      ).toBeGreaterThan(0)
      expect(
        validatedAdjustment.validationResults!.actualAccuracyImprovement,
      ).toBeGreaterThan(0)
      expect(
        calibrationManager.performanceTracking.improvementTrend.length,
      ).toBe(1)
      expect(calibrationManager.calibrationHistory).toContain(
        validatedAdjustment,
      )
    })

    it('should reject calibration with poor performance', async () => {
      const adjustment = createMockCalibrationAdjustment()
      adjustment.status = 'applied'
      calibrationManager.activeCalibrations.push(adjustment)

      const afterValidationResult = createWorsenedValidationResult()

      // Mock revert function
      vi.spyOn(
        calibrationManager as unknown as {
          revertCalibrationAdjustment: () => Promise<void>
        },
        'revertCalibrationAdjustment',
      ).mockResolvedValue(undefined)

      const validatedAdjustment =
        await calibrationManager.validateCalibrationEffectiveness(
          adjustment,
          afterValidationResult,
        )

      expect(validatedAdjustment.status).toBe('rejected')
      expect(
        validatedAdjustment.validationResults!.actualCorrelationImprovement,
      ).toBeLessThan(0)
      expect(
        calibrationManager.performanceTracking.improvementTrend.length,
      ).toBe(0)
    })

    it('should move calibration to history after validation', async () => {
      const adjustment = createMockCalibrationAdjustment()
      calibrationManager.activeCalibrations.push(adjustment)

      const afterValidationResult = createImprovedValidationResult()

      await calibrationManager.validateCalibrationEffectiveness(
        adjustment,
        afterValidationResult,
      )

      expect(calibrationManager.activeCalibrations).not.toContain(adjustment)
      expect(calibrationManager.calibrationHistory).toContain(adjustment)
    })
  })

  describe('Performance Improvement Tracking', () => {
    it('should track performance improvement summary accurately', () => {
      // Add some calibration history
      const successfulCalibration = createMockCalibrationAdjustment()
      successfulCalibration.status = 'validated'
      successfulCalibration.validationResults = {
        actualCorrelationImprovement: 0.1,
        actualBiasReduction: 0.2,
        actualAccuracyImprovement: 0.15,
        validationDate: new Date(),
      }

      const rejectedCalibration = createMockCalibrationAdjustment()
      rejectedCalibration.status = 'rejected'

      calibrationManager.calibrationHistory.push(
        successfulCalibration,
        rejectedCalibration,
      )

      // Update current metrics to simulate improvement
      calibrationManager.performanceTracking.currentMetrics.pearsonCorrelation = 0.7
      calibrationManager.performanceTracking.currentMetrics.meanAbsoluteError = 1.3

      const summary = calibrationManager.getPerformanceImprovementSummary()

      expect(summary.totalCalibrations).toBe(2)
      expect(summary.successfulCalibrations).toBe(1)
      expect(summary.overallCorrelationImprovement).toBeCloseTo(0.1) // 0.7 - 0.6 (default baseline)
      expect(summary.overallAccuracyImprovement).toBeCloseTo(0.2) // 1.5 - 1.3 (baseline - current)
    })

    it('should maintain improvement trend history', () => {
      const trendEntry = {
        date: new Date(),
        correlationScore: 0.75,
        biasLevel: 0.25,
        accuracyScore: 0.85,
      }

      calibrationManager.performanceTracking.improvementTrend.push(trendEntry)

      const summary = calibrationManager.getPerformanceImprovementSummary()

      expect(summary.improvementTrend).toHaveLength(1)
      expect(summary.improvementTrend[0]).toEqual(trendEntry)
    })
  })

  describe('Bias Pattern Analysis and Correction', () => {
    it('should generate appropriate target components for different bias types', () => {
      const manager = calibrationManager as unknown as {
        getBiasTargetComponent: (biasType: string) => string
      }

      expect(manager.getBiasTargetComponent('emotional_minimization')).toBe(
        'sentiment_analysis',
      )
      expect(manager.getBiasTargetComponent('sarcasm_detection_failure')).toBe(
        'sentiment_analysis',
      )
      expect(
        manager.getBiasTargetComponent('repetitive_pattern_blindness'),
      ).toBe('psychological_indicators')
      expect(
        manager.getBiasTargetComponent('mixed_emotion_oversimplification'),
      ).toBe('sentiment_analysis')
      expect(
        manager.getBiasTargetComponent('defensive_language_blindness'),
      ).toBe('psychological_indicators')
      expect(manager.getBiasTargetComponent('unknown_bias')).toBe(
        'sentiment_analysis',
      ) // Default fallback
    })

    it('should calculate bias correction factors based on severity and sample size', () => {
      const manager = calibrationManager as unknown as {
        getBiasCorrectionFactor: (bias: {
          severity: string
          affectedSamples: number
        }) => number
      }

      const highSeverityBias = {
        severity: 'high' as const,
        affectedSamples: 10,
      }
      const mediumSeverityBias = {
        severity: 'medium' as const,
        affectedSamples: 5,
      }
      const lowSeverityBias = { severity: 'low' as const, affectedSamples: 2 }

      const highFactor = manager.getBiasCorrectionFactor(highSeverityBias)
      const mediumFactor = manager.getBiasCorrectionFactor(mediumSeverityBias)
      const lowFactor = manager.getBiasCorrectionFactor(lowSeverityBias)

      expect(highFactor).toBeGreaterThan(mediumFactor)
      expect(mediumFactor).toBeGreaterThan(lowFactor)
      expect(highFactor).toBeGreaterThan(1.2) // High severity multiplier
      expect(lowFactor).toBeGreaterThan(1.05) // Low severity multiplier
    })
  })

  describe('Parameter Adjustment Simulation', () => {
    it('should simulate parameter adjustment with high success rate', async () => {
      // Create pattern with exactly 14 successes and 6 failures (70% success rate)
      const pattern = [
        ...Array(14).fill(true), // 14 successes
        ...Array(6).fill(false), // 6 failures
      ]

      const randomSource = createDeterministicRandomSource(pattern)
      const manager = new AlgorithmCalibrationManager(
        {},
        undefined,
        randomSource,
      )

      const managerAsUnknown = manager as unknown as {
        applyParameterAdjustments: (
          adjustment: CalibrationAdjustment,
        ) => Promise<boolean>
      }
      const adjustment = createMockCalibrationAdjustment()

      // Test multiple times to verify success rate
      const results = await Promise.all(
        Array.from({ length: 20 }, () =>
          managerAsUnknown.applyParameterAdjustments(adjustment),
        ),
      )

      const successCount = results.filter(Boolean).length
      const successRate = successCount / results.length

      expect(successRate).toBeGreaterThanOrEqual(0.7) // Now deterministic: exactly 70% success rate
    })
  })

  describe('Bias Reduction Calculation', () => {
    it('should calculate bias reduction between validation metrics', () => {
      const manager = calibrationManager as unknown as {
        calculateBiasReduction: (
          before: ValidationMetrics,
          after: ValidationMetrics,
        ) => number
      }

      const beforeMetrics: ValidationMetrics = {
        pearsonCorrelation: 0.6,
        meanAbsoluteError: 2.0,
        spearmanCorrelation: 0.6,
        rootMeanSquareError: 2.5,
        agreementPercentage: 60,
        concordanceLevel: 'moderate',
        statisticalSignificance: {
          pValue: 0.1,
          isSignificant: false,
          confidenceInterval: [0.4, 0.8],
        },
        sampleSize: 50,
      }

      const afterMetrics: ValidationMetrics = {
        pearsonCorrelation: 0.75,
        meanAbsoluteError: 1.5,
        spearmanCorrelation: 0.73,
        rootMeanSquareError: 2.0,
        agreementPercentage: 75,
        concordanceLevel: 'high',
        statisticalSignificance: {
          pValue: 0.02,
          isSignificant: true,
          confidenceInterval: [0.6, 0.9],
        },
        sampleSize: 50,
      }

      const biasReduction = manager.calculateBiasReduction(
        beforeMetrics,
        afterMetrics,
      )

      expect(biasReduction).toBeGreaterThan(0)
      expect(biasReduction).toBeLessThanOrEqual(1)
    })
  })
})

// Helper functions for creating test data

/**
 * Creates a deterministic random source for testing
 * @param pattern Array of booleans indicating success (true) or failure (false)
 * @returns A function that returns deterministic values based on the pattern
 */
function createDeterministicRandomSource(pattern: boolean[]): () => number {
  let index = 0
  return () => {
    const shouldSucceed = pattern[index % pattern.length]
    index++
    // Return > 0.1 for success, <= 0.1 for failure
    return shouldSucceed ? 0.11 : 0.09
  }
}

function createValidationResultWithBias(
  biasType:
    | 'algorithmic_over_estimation'
    | 'algorithmic_under_estimation'
    | 'no_systematic_bias',
  magnitude: number,
): ValidationResult {
  return {
    overallMetrics: {
      pearsonCorrelation: 0.65,
      spearmanCorrelation: 0.63,
      meanAbsoluteError: 1.5,
      rootMeanSquareError: 2.0,
      agreementPercentage: 65,
      concordanceLevel: 'moderate',
      statisticalSignificance: {
        pValue: 0.05,
        isSignificant: true,
        confidenceInterval: [0.5, 0.8],
      },
      sampleSize: 25,
    },
    discrepancyAnalysis: {
      systematicBias: biasType,
      biasPattern: { magnitude, consistency: 0.8, direction: 'positive' },
      commonDiscrepancyTypes: ['emotional_complexity'],
      problematicContexts: ['mixed_emotions'],
      improvementRecommendations: ['Enhance sentiment analysis'],
      discrepancyDistribution: { small: 5, medium: 15, large: 5 },
    },
    individualAnalyses: [],
    validatorConsistency: {
      interRaterReliability: 0.7,
      averageVariance: 0.5,
      consensusLevel: 'moderate',
      outlierValidations: [],
      validatorMetrics: {},
    },
    biasAnalysis: {
      biasDetected: true,
      biasTypes: [],
      detectionConfidence: 0.8,
      statisticalEvidence: {
        testStatistic: 2.5,
        pValue: 0.02,
        effectSize: 0.3,
      },
    },
    recommendations: [
      {
        priority: 'high',
        category: 'bias_correction',
        description: `Address ${biasType}`,
        expectedImpact: 'Improve correlation by 0.1',
      },
    ],
    sessionMetadata: {
      validationDate: new Date(),
      totalConversations: 25,
      totalValidators: 5,
      averageValidatorExperience: 8,
    },
  }
}

function createValidationResultWithOverconfidence(): ValidationResult {
  const baseResult = createValidationResultWithBias('no_systematic_bias', 0.5)

  // Create individual analyses with high confidence but high error
  baseResult.individualAnalyses = Array.from({ length: 10 }, (_, i) => ({
    conversationId: `conv-${i}`,
    algorithmicScore: 7.0,
    humanScore: 5.0,
    absoluteError: 2.0,
    discrepancyType: 'algorithmic_over_estimation' as const,
    discrepancyFactors: ['overconfidence'],
    humanRationale: 'Algorithm was too confident',
    algorithmicConfidence: 0.85, // High confidence
    humanConfidence: 0.9,
    recommendedImprovement: ['Adjust confidence thresholds'],
  }))

  return baseResult
}

function createValidationResultWithSpecificBias(): ValidationResult {
  const baseResult = createValidationResultWithBias(
    'algorithmic_over_estimation',
    1.2,
  )

  baseResult.biasAnalysis.biasTypes = [
    {
      type: 'emotional_minimization',
      severity: 'high',
      description: 'Algorithm minimizes emotional complexity',
      affectedSamples: 5,
      correctionRecommendation: 'Enhance emotional complexity detection',
    },
  ]

  return baseResult
}

function createValidationResultWithMultipleBiases(): ValidationResult {
  const baseResult = createValidationResultWithBias(
    'algorithmic_over_estimation',
    1.8,
  )

  baseResult.biasAnalysis.biasTypes = [
    {
      type: 'emotional_minimization',
      severity: 'high',
      description: 'Algorithm minimizes emotional complexity',
      affectedSamples: 8,
      correctionRecommendation: 'Enhance emotional complexity detection',
    },
    {
      type: 'sarcasm_detection_failure',
      severity: 'medium',
      description: 'Algorithm fails to detect sarcasm',
      affectedSamples: 6,
      correctionRecommendation: 'Improve sarcasm detection patterns',
    },
    {
      type: 'repetitive_pattern_blindness',
      severity: 'high',
      description: 'Algorithm misses repetitive emotional patterns',
      affectedSamples: 7,
      correctionRecommendation: 'Add pattern recognition capabilities',
    },
  ]

  // Add overconfidence issue
  baseResult.individualAnalyses = Array.from({ length: 8 }, (_, i) => ({
    conversationId: `conv-${i}`,
    algorithmicScore: 8.0,
    humanScore: 6.0,
    absoluteError: 2.0,
    discrepancyType: 'algorithmic_over_estimation' as const,
    discrepancyFactors: ['overconfidence'],
    humanRationale: 'Algorithm was overconfident',
    algorithmicConfidence: 0.9,
    humanConfidence: 0.85,
    recommendedImprovement: ['Adjust confidence thresholds'],
  }))

  return baseResult
}

function createMockCalibrationAdjustment(): CalibrationAdjustment {
  return {
    calibrationId: `cal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    sourceValidationId: 'validation-session-123',
    adjustmentType: 'weight_adjustment',
    targetComponent: 'sentiment_analysis',
    parameterAdjustments: [
      {
        parameterName: 'sentiment_weight',
        currentValue: 0.35,
        recommendedValue: 0.3,
        adjustmentReason: 'Reduce over-estimation bias',
        expectedImpact: 'Improve accuracy by 5%',
      },
    ],
    predictedImprovements: {
      correlationImprovement: 0.05,
      biasReduction: 0.1,
      accuracyImprovement: 0.2,
    },
    status: 'pending',
  }
}

function createImprovedValidationResult(): ValidationResult {
  return {
    overallMetrics: {
      pearsonCorrelation: 0.75, // Improved from 0.6 baseline
      spearmanCorrelation: 0.73,
      meanAbsoluteError: 1.3, // Improved from 1.5 baseline
      rootMeanSquareError: 1.8,
      agreementPercentage: 75,
      concordanceLevel: 'high',
      statisticalSignificance: {
        pValue: 0.01,
        isSignificant: true,
        confidenceInterval: [0.6, 0.9],
      },
      sampleSize: 30,
    },
    discrepancyAnalysis: {
      systematicBias: 'no_systematic_bias',
      biasPattern: { magnitude: 0.3, consistency: 0.4, direction: 'mixed' },
      commonDiscrepancyTypes: [],
      problematicContexts: [],
      improvementRecommendations: [],
      discrepancyDistribution: { small: 20, medium: 8, large: 2 },
    },
    individualAnalyses: [],
    validatorConsistency: {
      interRaterReliability: 0.8,
      averageVariance: 0.3,
      consensusLevel: 'high',
      outlierValidations: [],
      validatorMetrics: {},
    },
    biasAnalysis: {
      biasDetected: false,
      biasTypes: [],
      detectionConfidence: 0.9,
      statisticalEvidence: { testStatistic: 1.2, pValue: 0.2, effectSize: 0.1 },
    },
    recommendations: [],
    sessionMetadata: {
      validationDate: new Date(),
      totalConversations: 30,
      totalValidators: 5,
      averageValidatorExperience: 8,
    },
  }
}

function createWorsenedValidationResult(): ValidationResult {
  return {
    overallMetrics: {
      pearsonCorrelation: 0.55, // Worsened from 0.6 baseline
      spearmanCorrelation: 0.53,
      meanAbsoluteError: 1.8, // Worsened from 1.5 baseline
      rootMeanSquareError: 2.3,
      agreementPercentage: 55,
      concordanceLevel: 'low',
      statisticalSignificance: {
        pValue: 0.15,
        isSignificant: false,
        confidenceInterval: [0.3, 0.8],
      },
      sampleSize: 25,
    },
    discrepancyAnalysis: {
      systematicBias: 'algorithmic_over_estimation',
      biasPattern: { magnitude: 1.8, consistency: 0.9, direction: 'positive' },
      commonDiscrepancyTypes: ['emotional_complexity', 'mixed_emotions'],
      problematicContexts: ['complex_relationships'],
      improvementRecommendations: ['Revert recent changes'],
      discrepancyDistribution: { small: 5, medium: 10, large: 10 },
    },
    individualAnalyses: [],
    validatorConsistency: {
      interRaterReliability: 0.6,
      averageVariance: 0.7,
      consensusLevel: 'low',
      outlierValidations: [],
      validatorMetrics: {},
    },
    biasAnalysis: {
      biasDetected: true,
      biasTypes: [
        {
          type: 'emotional_complexity',
          severity: 'high',
          description: 'Increased complexity handling issues',
          affectedSamples: 15,
          correctionRecommendation: 'Revert parameter changes',
        },
      ],
      detectionConfidence: 0.95,
      statisticalEvidence: {
        testStatistic: 3.2,
        pValue: 0.001,
        effectSize: 0.5,
      },
    },
    recommendations: [
      {
        priority: 'high',
        category: 'parameter_reversion',
        description: 'Revert recent calibration changes',
        expectedImpact: 'Restore previous performance levels',
      },
    ],
    sessionMetadata: {
      validationDate: new Date(),
      totalConversations: 25,
      totalValidators: 5,
      averageValidatorExperience: 8,
    },
  }
}
