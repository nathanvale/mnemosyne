import type { Memory } from '@studio/schema'

import type { ThresholdConfig } from '../types'

/**
 * Calculates multi-factor confidence scores for memory validation
 */
export class ConfidenceCalculator {
  constructor(private config: ThresholdConfig) {}

  /**
   * Calculate overall confidence score for a memory
   */
  calculateConfidence(memory: Memory): {
    overall: number
    factors: {
      claudeConfidence: number
      emotionalCoherence: number
      relationshipAccuracy: number
      temporalConsistency: number
      contentQuality: number
    }
  } {
    const factors = {
      claudeConfidence: this.extractClaudeConfidence(memory),
      emotionalCoherence: this.calculateEmotionalCoherence(memory),
      relationshipAccuracy: this.assessRelationshipAccuracy(memory),
      temporalConsistency: this.checkTemporalConsistency(memory),
      contentQuality: this.evaluateContentQuality(memory),
    }

    const overall = this.calculateWeightedScore(factors)

    return { overall, factors }
  }

  /**
   * Extract Claude's original confidence from memory metadata
   */
  private extractClaudeConfidence(memory: Memory): number {
    return memory.metadata.confidence || 0.5
  }

  /**
   * Calculate emotional coherence score
   */
  private calculateEmotionalCoherence(memory: Memory): number {
    // Check if emotional context exists
    if (!memory.emotionalContext) {
      return 0.3
    }

    let score = 0.5 // Base score

    // Check for emotional state consistency
    const emotionalContext = memory.emotionalContext as any
    if (emotionalContext.primaryEmotion && emotionalContext.emotionalStates) {
      score += 0.2
    }

    // Check for emotional intensity alignment
    if (emotionalContext.intensity !== undefined) {
      const intensity = emotionalContext.intensity
      if (intensity >= 0 && intensity <= 1) {
        score += 0.15
      }
    }

    // Check for emotional themes
    if (emotionalContext.themes && Array.isArray(emotionalContext.themes)) {
      score += 0.15
    }

    return Math.min(score, 1)
  }

  /**
   * Assess relationship accuracy
   */
  private assessRelationshipAccuracy(memory: Memory): number {
    // Check if relationship dynamics exist
    if (!memory.relationshipDynamics) {
      return 0.4
    }

    let score = 0.5 // Base score

    const dynamics = memory.relationshipDynamics as any

    // Check for communication patterns
    if (dynamics.communicationPatterns && Array.isArray(dynamics.communicationPatterns)) {
      score += 0.2
    }

    // Check for interaction quality
    if (dynamics.interactionQuality) {
      score += 0.15
    }

    // Check for participant relationships
    if (memory.participants && memory.participants.length > 1) {
      score += 0.15
    }

    return Math.min(score, 1)
  }

  /**
   * Check temporal consistency
   */
  private checkTemporalConsistency(memory: Memory): number {
    let score = 0.7 // Base score

    // Check timestamp validity
    try {
      const timestamp = new Date(memory.timestamp)
      const processedAt = new Date(memory.metadata.processedAt)
      
      // Timestamp should be before processing time
      if (timestamp <= processedAt) {
        score += 0.15
      }

      // Check if timestamp is reasonable (not in future, not too far in past)
      const now = new Date()
      const tenYearsAgo = new Date(now.getFullYear() - 10, now.getMonth(), now.getDate())
      
      if (timestamp <= now && timestamp >= tenYearsAgo) {
        score += 0.15
      }
    } catch {
      score = 0.3 // Low score for invalid timestamps
    }

    return Math.min(score, 1)
  }

  /**
   * Evaluate content quality
   */
  private evaluateContentQuality(memory: Memory): number {
    let score = 0.5 // Base score

    // Check content length (not too short, not too long)
    const contentLength = memory.content.length
    if (contentLength >= 20 && contentLength <= 5000) {
      score += 0.2
    }

    // Check for meaningful content (not just punctuation or numbers)
    const meaningfulWords = memory.content.match(/\b\w{3,}\b/g) || []
    if (meaningfulWords.length >= 5) {
      score += 0.15
    }

    // Check tag quality
    if (memory.tags && memory.tags.length > 0 && memory.tags.length <= 10) {
      score += 0.15
    }

    return Math.min(score, 1)
  }

  /**
   * Calculate weighted overall score
   */
  private calculateWeightedScore(factors: Record<string, number>): number {
    const weights = this.config.weights
    
    let weightedSum = 0
    let totalWeight = 0

    for (const [factor, value] of Object.entries(factors)) {
      const weight = weights[factor as keyof typeof weights] || 0
      weightedSum += value * weight
      totalWeight += weight
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }

  /**
   * Update configuration
   */
  updateConfig(config: ThresholdConfig): void {
    this.config = config
  }
}