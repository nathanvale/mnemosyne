import { createLogger } from '@studio/logger'

import type { MoodAnalysisResult, MoodFactor } from '../types'

const logger = createLogger({
  tags: ['mood-scoring', 'confidence-calculator'],
})

/**
 * Confidence calculation factors
 */
export interface ConfidenceFactors {
  /** Evidence strength (0-1) */
  evidenceStrength: number
  /** Factor agreement (0-1) */
  factorAgreement: number
  /** Temporal consistency (0-1) */
  temporalConsistency: number
  /** Context reliability (0-1) */
  contextReliability: number
}

/**
 * ConfidenceCalculator assesses the reliability of mood analysis results
 */
export class ConfidenceCalculator {
  /**
   * Calculate overall confidence in mood analysis
   */
  calculateConfidence(
    analysis: MoodAnalysisResult,
    previousAnalyses?: MoodAnalysisResult[],
  ): number {
    logger.debug('Calculating mood analysis confidence', {
      score: analysis.score,
      factorCount: analysis.factors.length,
      hasPreviousAnalyses: !!previousAnalyses?.length,
    })

    const factors = this.assessConfidenceFactors(analysis, previousAnalyses)
    const overallConfidence = this.combineConfidenceFactors(factors)

    logger.info('Confidence calculation complete', {
      confidence: overallConfidence,
      factors,
    })

    return overallConfidence
  }

  /**
   * Assess individual confidence factors
   */
  assessConfidenceFactors(
    analysis: MoodAnalysisResult,
    previousAnalyses?: MoodAnalysisResult[],
  ): ConfidenceFactors {
    const evidenceStrength = this.calculateEvidenceStrength(analysis.factors)
    const factorAgreement = this.calculateFactorAgreement(analysis.factors)
    const temporalConsistency = previousAnalyses?.length
      ? this.calculateTemporalConsistency(analysis, previousAnalyses)
      : 0.7 // Default when no history
    const contextReliability = this.calculateContextReliability(analysis)

    return {
      evidenceStrength,
      factorAgreement,
      temporalConsistency,
      contextReliability,
    }
  }

  /**
   * Calculate confidence based on evidence quantity and quality
   */
  calculateEvidenceStrength(factors: MoodFactor[]): number {
    if (factors.length === 0) return 0

    let totalStrength = 0

    for (const factor of factors) {
      // Evidence quantity (normalized to 0-1, max at 5 pieces)
      const quantity = Math.min(factor.evidence.length / 5, 1)

      // Evidence quality based on factor type and weight
      const quality = this.assessEvidenceQuality(factor)

      // Combine quantity and quality
      const factorStrength = (quantity * 0.6 + quality * 0.4) * factor.weight
      totalStrength += factorStrength
    }

    // Normalize by total weight
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0)
    return totalWeight > 0 ? totalStrength / totalWeight : 0
  }

  /**
   * Calculate agreement between different mood factors
   */
  calculateFactorAgreement(factors: MoodFactor[]): number {
    if (factors.length <= 1) return 1

    // Extract implicit scores from each factor
    const scores = factors.map((f) => this.extractImplicitScore(f))

    // Calculate variance
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length
    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length

    // Convert variance to agreement (low variance = high agreement)
    // Normalize assuming max reasonable variance of 25 (5^2)
    const agreement = Math.max(0, 1 - variance / 25)

    return agreement
  }

  /**
   * Calculate temporal consistency with previous analyses
   */
  calculateTemporalConsistency(
    current: MoodAnalysisResult,
    previous: MoodAnalysisResult[],
  ): number {
    if (previous.length === 0) return 1

    // Get recent analyses (last 5)
    const recent = previous.slice(-5)

    // Calculate score consistency
    const scores = [...recent.map((a) => a.score), current.score]
    const scoreVariance = this.calculateVariance(scores)
    const scoreConsistency = Math.max(0, 1 - scoreVariance / 25)

    // Calculate descriptor consistency
    const descriptorConsistency = this.calculateDescriptorConsistency(
      current.descriptors,
      recent.map((a) => a.descriptors),
    )

    // Combine consistencies
    return scoreConsistency * 0.7 + descriptorConsistency * 0.3
  }

  /**
   * Calculate context reliability
   */
  calculateContextReliability(analysis: MoodAnalysisResult): number {
    let reliability = 0.5 // Base reliability

    // Check for emotional words factor
    const emotionalWordsFactor = analysis.factors.find(
      (f) => f.type === 'emotional_words',
    )
    if (emotionalWordsFactor && emotionalWordsFactor.evidence.length > 3) {
      reliability += 0.2
    }

    // Check for interaction pattern factor
    const interactionFactor = analysis.factors.find(
      (f) => f.type === 'interaction_pattern',
    )
    if (interactionFactor && interactionFactor.evidence.length > 0) {
      reliability += 0.15
    }

    // Check for context clues
    const contextFactor = analysis.factors.find(
      (f) => f.type === 'context_clues',
    )
    if (contextFactor && contextFactor.evidence.length > 2) {
      reliability += 0.15
    }

    return Math.min(1, reliability)
  }

  /**
   * Validate confidence calculation
   */
  validateConfidence(confidence: number): {
    isValid: boolean
    adjustedConfidence: number
    reason?: string
  } {
    // Ensure confidence is within bounds
    if (confidence < 0 || confidence > 1) {
      return {
        isValid: false,
        adjustedConfidence: Math.max(0, Math.min(1, confidence)),
        reason: 'Confidence out of bounds',
      }
    }

    // Flag suspiciously high confidence without strong evidence
    if (confidence > 0.9) {
      return {
        isValid: true,
        adjustedConfidence: confidence * 0.95, // Slight reduction for caution
        reason: 'Very high confidence adjusted for caution',
      }
    }

    // Flag very low confidence
    if (confidence < 0.3) {
      return {
        isValid: true,
        adjustedConfidence: Math.max(confidence, 0.3),
        reason: 'Minimum confidence threshold applied',
      }
    }

    return {
      isValid: true,
      adjustedConfidence: confidence,
    }
  }

  // Private helper methods

  private assessEvidenceQuality(factor: MoodFactor): number {
    // Base quality on factor type
    const typeQuality: Record<MoodFactor['type'], number> = {
      emotional_words: 0.9,
      language_sentiment: 0.8,
      interaction_pattern: 0.7,
      context_clues: 0.6,
    }

    let quality = typeQuality[factor.type] || 0.5

    // Adjust for evidence specificity
    const hasSpecificEvidence = factor.evidence.some(
      (e) =>
        e.includes('"') || e.includes('detected') || e.includes('indicates'),
    )
    if (hasSpecificEvidence) {
      quality += 0.1
    }

    return Math.min(1, quality)
  }

  private extractImplicitScore(factor: MoodFactor): number {
    // Extract an implicit mood score from factor evidence
    // This is a simplified heuristic

    const evidenceCount = factor.evidence.length
    const hasPositiveEvidence = factor.evidence.some(
      (e) =>
        e.toLowerCase().includes('positive') ||
        e.toLowerCase().includes('healthy') ||
        e.toLowerCase().includes('support'),
    )
    const hasNegativeEvidence = factor.evidence.some(
      (e) =>
        e.toLowerCase().includes('negative') ||
        e.toLowerCase().includes('concern') ||
        e.toLowerCase().includes('struggle'),
    )

    if (hasPositiveEvidence && !hasNegativeEvidence) {
      return 6 + Math.min(evidenceCount, 4)
    } else if (hasNegativeEvidence && !hasPositiveEvidence) {
      return 4 - Math.min(evidenceCount, 4)
    } else {
      return 5 // Neutral
    }
  }

  private calculateDescriptorConsistency(
    current: string[],
    previous: string[][],
  ): number {
    if (previous.length === 0) return 1

    let totalOverlap = 0

    for (const prevDescriptors of previous) {
      const overlap = this.calculateOverlap(current, prevDescriptors)
      totalOverlap += overlap
    }

    // Average overlap across all previous analyses
    const averageOverlap = totalOverlap / previous.length

    // Some change is expected, so perfect overlap isn't necessarily best
    // Optimal overlap is around 0.6-0.7
    if (averageOverlap > 0.7) {
      return 1
    } else if (averageOverlap > 0.3) {
      return 0.8 + (averageOverlap - 0.3) * 0.5
    } else {
      return averageOverlap * 2.67 // Scale 0-0.3 to 0-0.8
    }
  }

  private calculateOverlap(set1: string[], set2: string[]): number {
    const s1 = new Set(set1)
    const s2 = new Set(set2)
    const intersection = [...s1].filter((x) => s2.has(x))
    const union = new Set([...s1, ...s2])

    return union.size > 0 ? intersection.length / union.size : 0
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
    return (
      numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) /
      numbers.length
    )
  }

  private combineConfidenceFactors(factors: ConfidenceFactors): number {
    // Weighted combination of confidence factors
    const weights = {
      evidenceStrength: 0.35,
      factorAgreement: 0.25,
      temporalConsistency: 0.2,
      contextReliability: 0.2,
    }

    let weightedSum = 0
    let totalWeight = 0

    for (const [key, value] of Object.entries(factors)) {
      const weight = weights[key as keyof ConfidenceFactors]
      weightedSum += value * weight
      totalWeight += weight
    }

    const rawConfidence = totalWeight > 0 ? weightedSum / totalWeight : 0.5

    // Apply validation
    const { adjustedConfidence } = this.validateConfidence(rawConfidence)

    return Math.round(adjustedConfidence * 100) / 100
  }
}
