import type { Memory } from '@studio/schema'

import { createLogger } from '@studio/logger'

import type {
  AutoConfirmationEngine,
  AutoConfirmationResult,
  BatchValidationResult,
  ThresholdConfig,
  ValidationFeedback,
  ThresholdUpdate,
} from '../types'

import { DEFAULT_THRESHOLD_CONFIG } from '../config/defaults'
import { ConfidenceCalculator } from './confidence-calculator'
import { ThresholdManager } from './threshold-manager'

const logger = createLogger({ tags: ['validation:auto-confirmation'] })

/**
 * Implementation of the auto-confirmation engine
 */
class AutoConfirmationEngineImpl implements AutoConfirmationEngine {
  private confidenceCalculator: ConfidenceCalculator
  private thresholdManager: ThresholdManager

  constructor(config?: ThresholdConfig) {
    const initialConfig = config || DEFAULT_THRESHOLD_CONFIG
    this.confidenceCalculator = new ConfidenceCalculator(initialConfig)
    this.thresholdManager = new ThresholdManager(initialConfig)
  }

  /**
   * Evaluate a single memory for auto-confirmation
   */
  evaluateMemory(memory: Memory): AutoConfirmationResult {
    logger.debug('Evaluating memory', { memoryId: memory.id })

    // Calculate confidence scores
    const { overall, factors } =
      this.confidenceCalculator.calculateConfidence(memory)

    // Get current thresholds
    const config = this.thresholdManager.getConfig()

    // Make decision based on confidence and thresholds
    let decision: AutoConfirmationResult['decision']
    const reasons: string[] = []
    const suggestedActions: string[] = []

    if (overall >= config.autoApproveThreshold) {
      decision = 'auto-approve'
      reasons.push(
        `Confidence score (${(overall * 100).toFixed(1)}%) exceeds approval threshold (${(config.autoApproveThreshold * 100).toFixed(1)}%)`,
      )

      // Add specific positive factors
      for (const [factor, value] of Object.entries(factors)) {
        if (value > 0.8) {
          reasons.push(`Strong ${factor}: ${(value * 100).toFixed(1)}%`)
        }
      }
    } else if (overall < config.autoRejectThreshold) {
      decision = 'auto-reject'
      reasons.push(
        `Confidence score (${(overall * 100).toFixed(1)}%) below rejection threshold (${(config.autoRejectThreshold * 100).toFixed(1)}%)`,
      )

      // Add specific weak factors
      for (const [factor, value] of Object.entries(factors)) {
        if (value < 0.5) {
          reasons.push(`Weak ${factor}: ${(value * 100).toFixed(1)}%`)
        }
      }
    } else {
      decision = 'needs-review'
      reasons.push(
        `Confidence score (${(overall * 100).toFixed(1)}%) requires human review`,
      )

      // Suggest areas for review
      const weakestFactors = Object.entries(factors)
        .filter(([_, value]) => value < 0.7)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 3)

      for (const [factor, value] of weakestFactors) {
        suggestedActions.push(
          `Review ${factor} (currently ${(value * 100).toFixed(1)}%)`,
        )
      }
    }

    const result: AutoConfirmationResult = {
      memoryId: memory.id,
      decision,
      confidence: overall,
      confidenceFactors: factors,
      reasons,
    }

    if (suggestedActions.length > 0) {
      result.suggestedActions = suggestedActions
    }

    logger.info('Memory evaluation complete', {
      memoryId: memory.id,
      decision,
      confidence: overall,
    })

    return result
  }

  /**
   * Process a batch of memories
   */
  processBatch(memories: Memory[]): BatchValidationResult {
    const startTime = Date.now()
    logger.info('Processing batch', { count: memories.length })

    const results: AutoConfirmationResult[] = []
    const decisions = {
      autoApproved: 0,
      needsReview: 0,
      autoRejected: 0,
    }

    let totalConfidence = 0

    for (const memory of memories) {
      try {
        const result = this.evaluateMemory(memory)
        results.push(result)
        totalConfidence += result.confidence

        // Track decision counts
        switch (result.decision) {
          case 'auto-approve':
            decisions.autoApproved++
            break
          case 'needs-review':
            decisions.needsReview++
            break
          case 'auto-reject':
            decisions.autoRejected++
            break
        }
      } catch (error) {
        logger.error('Error evaluating memory', {
          memoryId: memory.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })

        // Add error result
        results.push({
          memoryId: memory.id,
          decision: 'needs-review',
          confidence: 0,
          confidenceFactors: {
            claudeConfidence: 0,
            emotionalCoherence: 0,
            relationshipAccuracy: 0,
            temporalConsistency: 0,
            contentQuality: 0,
          },
          reasons: ['Error during evaluation - requires manual review'],
          suggestedActions: ['Check memory data integrity'],
        })
        decisions.needsReview++
      }
    }

    const processingTime = Date.now() - startTime
    const batchConfidence =
      memories.length > 0 ? totalConfidence / memories.length : 0

    const batchResult: BatchValidationResult = {
      totalMemories: memories.length,
      decisions,
      batchConfidence,
      results,
      processingTime,
    }

    logger.info('Batch processing complete', {
      totalMemories: memories.length,
      decisions,
      batchConfidence,
      processingTimeMs: processingTime,
    })

    return batchResult
  }

  /**
   * Update thresholds based on feedback
   */
  updateThresholds(feedback: ValidationFeedback[]): ThresholdUpdate {
    logger.info('Updating thresholds', { feedbackCount: feedback.length })

    const update = this.thresholdManager.calculateThresholdUpdate(feedback)

    // Apply the update if it shows improvement
    if (update.expectedAccuracyImprovement > 0.01) {
      this.thresholdManager.setConfig(update.recommendedThresholds)
      this.confidenceCalculator.updateConfig(update.recommendedThresholds)
      logger.info('Thresholds updated', {
        improvement: update.expectedAccuracyImprovement,
        reasons: update.updateReasons,
      })
    } else {
      logger.info('No threshold update needed', {
        improvement: update.expectedAccuracyImprovement,
      })
    }

    return update
  }

  /**
   * Get current configuration
   */
  getConfig(): ThresholdConfig {
    return this.thresholdManager.getConfig()
  }

  /**
   * Set new configuration
   */
  setConfig(config: ThresholdConfig): void {
    this.thresholdManager.setConfig(config)
    this.confidenceCalculator.updateConfig(config)
    logger.info('Configuration updated', { config })
  }
}

/**
 * Factory function to create an auto-confirmation engine
 */
export function createAutoConfirmationEngine(
  config?: ThresholdConfig,
): AutoConfirmationEngine {
  return new AutoConfirmationEngineImpl(config)
}
