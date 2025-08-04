import { createLogger } from '@studio/logger'

import type {
  ValidationResult,
  CalibrationAdjustment,
  AlgorithmCalibrationSystem,
  ValidationMetrics,
  BiasAnalysis,
} from '../types'

const logger = createLogger({
  tags: ['mood-scoring', 'calibration-system'],
})

/**
 * Configuration for the calibration system
 */
export interface CalibrationSystemConfig {
  /** Maximum calibrations to apply per session */
  maxCalibrationsPerSession: number
  /** Minimum validation sample size for calibration */
  minValidationSampleSize: number
  /** Confidence threshold for applying calibrations */
  calibrationConfidenceThreshold: number
  /** Enable automatic calibration application */
  autoApplyCalibrations: boolean
  /** Minimum improvement threshold to consider calibration successful */
  minImprovementThreshold: number
}

/**
 * AlgorithmCalibrationManager handles continuous improvement of mood scoring algorithms
 * based on human validation feedback and bias analysis
 */
export class AlgorithmCalibrationManager implements AlgorithmCalibrationSystem {
  public readonly config: CalibrationSystemConfig
  public activeCalibrations: CalibrationAdjustment[] = []
  public calibrationHistory: CalibrationAdjustment[] = []
  public performanceTracking: AlgorithmCalibrationSystem['performanceTracking']

  constructor(
    config?: Partial<CalibrationSystemConfig>,
    baselineMetrics?: ValidationMetrics,
  ) {
    this.config = {
      maxCalibrationsPerSession: 3,
      minValidationSampleSize: 5,
      calibrationConfidenceThreshold: 0.7,
      autoApplyCalibrations: false,
      minImprovementThreshold: 0.05,
      ...config,
    }

    this.performanceTracking = {
      baselineMetrics: baselineMetrics || this.getDefaultBaselineMetrics(),
      currentMetrics: baselineMetrics || this.getDefaultBaselineMetrics(),
      improvementTrend: [],
    }
  }

  /**
   * Generate calibration adjustments based on validation results
   */
  async generateCalibrationAdjustments(
    validationResult: ValidationResult,
    sessionId: string = `session-${Date.now()}`,
  ): Promise<CalibrationAdjustment[]> {
    logger.debug('Generating calibration adjustments', {
      sessionId,
      biasDetected: validationResult.biasAnalysis.biasDetected,
      recommendationCount: validationResult.recommendations.length,
    })

    // Check if we have sufficient validation data
    if (validationResult.overallMetrics.sampleSize < this.config.minValidationSampleSize) {
      logger.warn('Insufficient validation sample size for calibration', {
        sampleSize: validationResult.overallMetrics.sampleSize,
        required: this.config.minValidationSampleSize,
      })
      return []
    }

    const calibrationAdjustments: CalibrationAdjustment[] = []

    // Generate weight adjustments for systematic biases
    const weightAdjustments = this.generateWeightAdjustments(validationResult, sessionId)
    calibrationAdjustments.push(...weightAdjustments)

    // Generate threshold adjustments for confidence issues
    const thresholdAdjustments = this.generateThresholdAdjustments(validationResult, sessionId)
    calibrationAdjustments.push(...thresholdAdjustments)

    // Generate bias-specific corrections
    const biasCorrections = this.generateBiasCorrections(validationResult, sessionId)
    calibrationAdjustments.push(...biasCorrections)

    // Limit to maximum calibrations per session
    const limitedAdjustments = calibrationAdjustments
      .slice(0, this.config.maxCalibrationsPerSession)

    logger.debug('Generated calibration adjustments', {
      sessionId,
      totalGenerated: calibrationAdjustments.length,
      limitedTo: limitedAdjustments.length,
    })

    return limitedAdjustments
  }

  /**
   * Apply calibration adjustments to the algorithm parameters
   */
  async applyCalibrationAdjustments(
    adjustments: CalibrationAdjustment[],
  ): Promise<{
    applied: CalibrationAdjustment[]
    rejected: CalibrationAdjustment[]
  }> {
    const applied: CalibrationAdjustment[] = []
    const rejected: CalibrationAdjustment[] = []

    for (const adjustment of adjustments) {
      try {
        // Apply the parameter adjustments
        const success = await this.applyParameterAdjustments(adjustment)
        
        if (success) {
          adjustment.status = 'applied'
          applied.push(adjustment)
          this.activeCalibrations.push(adjustment)
          
          logger.info('Applied calibration adjustment', {
            calibrationId: adjustment.calibrationId,
            adjustmentType: adjustment.adjustmentType,
            targetComponent: adjustment.targetComponent,
          })
        } else {
          adjustment.status = 'rejected'
          rejected.push(adjustment)
          
          logger.warn('Rejected calibration adjustment', {
            calibrationId: adjustment.calibrationId,
            reason: 'Parameter adjustment failed',
          })
        }
      } catch (error) {
        adjustment.status = 'rejected'
        rejected.push(adjustment)
        
        logger.error('Failed to apply calibration adjustment', {
          calibrationId: adjustment.calibrationId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return { applied, rejected }
  }

  /**
   * Validate calibration effectiveness by comparing before/after metrics
   */
  async validateCalibrationEffectiveness(
    adjustment: CalibrationAdjustment,
    afterValidationResult: ValidationResult,
  ): Promise<CalibrationAdjustment> {
    const beforeMetrics = this.performanceTracking.currentMetrics
    const afterMetrics = afterValidationResult.overallMetrics

    const actualCorrelationImprovement = afterMetrics.pearsonCorrelation - beforeMetrics.pearsonCorrelation
    const actualAccuracyImprovement = beforeMetrics.meanAbsoluteError - afterMetrics.meanAbsoluteError
    const actualBiasReduction = this.calculateBiasReduction(beforeMetrics, afterMetrics)

    adjustment.validationResults = {
      actualCorrelationImprovement,
      actualBiasReduction,
      actualAccuracyImprovement,
      validationDate: new Date(),
    }

    // Determine if calibration was successful
    const isSuccessful = 
      actualCorrelationImprovement >= -this.config.minImprovementThreshold &&
      actualAccuracyImprovement >= this.config.minImprovementThreshold

    adjustment.status = isSuccessful ? 'validated' : 'rejected'

    if (isSuccessful) {
      // Update current metrics
      this.performanceTracking.currentMetrics = afterMetrics
      
      // Add to improvement trend
      this.performanceTracking.improvementTrend.push({
        date: new Date(),
        correlationScore: afterMetrics.pearsonCorrelation,
        biasLevel: 1 - afterMetrics.pearsonCorrelation, // Simplified bias calculation
        accuracyScore: 1 - afterMetrics.meanAbsoluteError / 10, // Normalized accuracy score
      })

      logger.info('Calibration validated successfully', {
        calibrationId: adjustment.calibrationId,
        correlationImprovement: actualCorrelationImprovement,
        accuracyImprovement: actualAccuracyImprovement,
      })
    } else {
      // Revert the calibration if it didn't improve performance
      await this.revertCalibrationAdjustment(adjustment)
      
      logger.warn('Calibration rejected due to poor performance', {
        calibrationId: adjustment.calibrationId,
        correlationImprovement: actualCorrelationImprovement,
        accuracyImprovement: actualAccuracyImprovement,
      })
    }

    // Move to calibration history
    this.calibrationHistory.push(adjustment)
    this.activeCalibrations = this.activeCalibrations.filter(
      a => a.calibrationId !== adjustment.calibrationId
    )

    return adjustment
  }

  /**
   * Get performance improvement summary
   */
  getPerformanceImprovementSummary(): {
    totalCalibrations: number
    successfulCalibrations: number
    overallCorrelationImprovement: number
    overallAccuracyImprovement: number
    improvementTrend: AlgorithmCalibrationSystem['performanceTracking']['improvementTrend']
  } {
    const totalCalibrations = this.calibrationHistory.length
    const successfulCalibrations = this.calibrationHistory.filter(
      c => c.status === 'validated'
    ).length

    const baseline = this.performanceTracking.baselineMetrics
    const current = this.performanceTracking.currentMetrics

    const overallCorrelationImprovement = current.pearsonCorrelation - baseline.pearsonCorrelation
    const overallAccuracyImprovement = baseline.meanAbsoluteError - current.meanAbsoluteError

    return {
      totalCalibrations,
      successfulCalibrations,
      overallCorrelationImprovement,
      overallAccuracyImprovement,
      improvementTrend: this.performanceTracking.improvementTrend,
    }
  }

  // Private helper methods

  private generateWeightAdjustments(
    validationResult: ValidationResult,
    sessionId: string,
  ): CalibrationAdjustment[] {
    const adjustments: CalibrationAdjustment[] = []

    // Check for systematic over/under estimation
    if (validationResult.discrepancyAnalysis.systematicBias !== 'no_systematic_bias') {
      const biasDirection = validationResult.discrepancyAnalysis.systematicBias
      const biaseMagnitude = validationResult.discrepancyAnalysis.biasPattern.magnitude

      // Suggest sentiment weight adjustment if bias is significant
      if (biaseMagnitude > 1.0) {
        const currentWeight = 0.35 // Default sentiment weight
        const adjustment = biasDirection === 'algorithmic_over_estimation' ? -0.05 : 0.05
        const recommendedWeight = Math.max(0.1, Math.min(0.6, currentWeight + adjustment))

        adjustments.push({
          calibrationId: `weight-adj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          sourceValidationId: sessionId,
          adjustmentType: 'weight_adjustment',
          targetComponent: 'sentiment_analysis',
          parameterAdjustments: [{
            parameterName: 'sentiment_weight',
            currentValue: currentWeight,
            recommendedValue: recommendedWeight,
            adjustmentReason: `Address ${biasDirection} with magnitude ${biaseMagnitude.toFixed(2)}`,
            expectedImpact: `Reduce systematic bias by ${Math.abs(adjustment * 10).toFixed(1)}%`,
          }],
          predictedImprovements: {
            correlationImprovement: 0.05,
            biasReduction: Math.abs(adjustment),
            accuracyImprovement: biaseMagnitude * 0.3,
          },
          status: 'pending',
        })
      }
    }

    return adjustments
  }

  private generateThresholdAdjustments(
    validationResult: ValidationResult,
    sessionId: string,
  ): CalibrationAdjustment[] {
    const adjustments: CalibrationAdjustment[] = []

    // Check for confidence calibration issues
    const overconfidenceIndicators = validationResult.individualAnalyses.filter(
      analysis => analysis.algorithmicConfidence > 0.8 && analysis.absoluteError > 1.5
    )

    if (overconfidenceIndicators.length > validationResult.individualAnalyses.length * 0.3) {
      // More than 30% of high-confidence predictions have high error
      adjustments.push({
        calibrationId: `threshold-adj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        sourceValidationId: sessionId,
        adjustmentType: 'threshold_adjustment',
        targetComponent: 'confidence_calculator',
        parameterAdjustments: [{
          parameterName: 'confidence_threshold_high',
          currentValue: 0.8,
          recommendedValue: 0.85,
          adjustmentReason: `Reduce overconfidence: ${overconfidenceIndicators.length} cases with high confidence but high error`,
          expectedImpact: 'Improve confidence calibration accuracy by 10-15%',
        }],
        predictedImprovements: {
          correlationImprovement: 0.02,
          biasReduction: 0.1,
          accuracyImprovement: 0.2,
        },
        status: 'pending',
      })
    }

    return adjustments
  }

  private generateBiasCorrections(
    validationResult: ValidationResult,
    sessionId: string,
  ): CalibrationAdjustment[] {
    const adjustments: CalibrationAdjustment[] = []

    // Generate corrections for specific bias patterns
    for (const biasType of validationResult.biasAnalysis.biasTypes) {
      if (biasType.severity === 'high' && biasType.affectedSamples >= 3) {
        adjustments.push({
          calibrationId: `bias-correction-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          sourceValidationId: sessionId,
          adjustmentType: 'bias_correction',
          targetComponent: this.getBiasTargetComponent(biasType.type),
          parameterAdjustments: [{
            parameterName: `${biasType.type}_correction_factor`,
            currentValue: 1.0,
            recommendedValue: this.getBiasCorrectionFactor(biasType),
            adjustmentReason: biasType.description,
            expectedImpact: biasType.correctionRecommendation,
          }],
          predictedImprovements: {
            correlationImprovement: 0.08,
            biasReduction: 0.3,
            accuracyImprovement: 0.4,
          },
          status: 'pending',
        })
      }
    }

    return adjustments
  }

  private getBiasTargetComponent(biasType: string): CalibrationAdjustment['targetComponent'] {
    const targetMap: Record<string, CalibrationAdjustment['targetComponent']> = {
      'emotional_minimization': 'sentiment_analysis',
      'sarcasm_detection_failure': 'sentiment_analysis',
      'repetitive_pattern_blindness': 'psychological_indicators',
      'mixed_emotion_oversimplification': 'sentiment_analysis',
      'defensive_language_blindness': 'psychological_indicators',
      'emotional_complexity': 'sentiment_analysis',
    }

    return targetMap[biasType] || 'sentiment_analysis'
  }

  private getBiasCorrectionFactor(biasType: BiasAnalysis['biasTypes'][0]): number {
    const severityMultiplier = biasType.severity === 'high' ? 1.2 : biasType.severity === 'medium' ? 1.1 : 1.05
    const sampleMultiplier = Math.min(1.3, 1 + (biasType.affectedSamples * 0.05))
    
    return severityMultiplier * sampleMultiplier
  }

  private async applyParameterAdjustments(adjustment: CalibrationAdjustment): Promise<boolean> {
    // In a real implementation, this would update the actual algorithm parameters
    // For now, we simulate the application
    logger.debug('Applying parameter adjustments', {
      calibrationId: adjustment.calibrationId,
      parameterCount: adjustment.parameterAdjustments.length,
    })

    // Simulate parameter application with some success rate
    return Math.random() > 0.1 // 90% success rate
  }

  private async revertCalibrationAdjustment(adjustment: CalibrationAdjustment): Promise<void> {
    // In a real implementation, this would revert the parameter changes
    logger.debug('Reverting calibration adjustment', {
      calibrationId: adjustment.calibrationId,
    })
  }

  private calculateBiasReduction(before: ValidationMetrics, after: ValidationMetrics): number {
    // Simplified bias calculation based on correlation and accuracy
    const beforeBias = 1 - (before.pearsonCorrelation * (1 - before.meanAbsoluteError / 10))
    const afterBias = 1 - (after.pearsonCorrelation * (1 - after.meanAbsoluteError / 10))
    
    return Math.max(0, beforeBias - afterBias)
  }

  private getDefaultBaselineMetrics(): ValidationMetrics {
    return {
      pearsonCorrelation: 0.6,
      spearmanCorrelation: 0.6,
      meanAbsoluteError: 1.5,
      rootMeanSquareError: 2.0,
      agreementPercentage: 60,
      concordanceLevel: 'moderate',
      statisticalSignificance: {
        pValue: 0.1,
        isSignificant: false,
        confidenceInterval: [0.4, 0.8],
      },
      sampleSize: 0,
    }
  }
}