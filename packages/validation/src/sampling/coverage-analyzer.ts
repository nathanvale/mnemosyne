import type { Memory } from '@studio/schema'

import type { CoverageAnalysis, SampledMemories } from '../types'

/**
 * Analyzes coverage of memory samples
 */
export class CoverageAnalyzer {
  /**
   * Analyze coverage of a sample
   */
  analyzeCoverage(sample: SampledMemories): CoverageAnalysis {
    const { samples } = sample

    return {
      emotionalCoverage: this.analyzeEmotionalCoverage(samples),
      temporalCoverage: this.analyzeTemporalCoverage(samples),
      participantCoverage: this.analyzeParticipantCoverage(samples),
      qualityDistribution: this.analyzeQualityDistribution(samples),
      overallScore: 0, // Will be calculated at the end
    }
  }

  /**
   * Calculate overall coverage score
   */
  calculateOverallScore(analysis: Omit<CoverageAnalysis, 'overallScore'>): number {
    const weights = {
      emotional: 0.3,
      temporal: 0.25,
      participant: 0.25,
      quality: 0.2,
    }

    const scores = {
      emotional: analysis.emotionalCoverage.coveragePercentage / 100,
      temporal: this.getTemporalScore(analysis.temporalCoverage),
      participant: analysis.participantCoverage.coveragePercentage / 100,
      quality: this.getQualityScore(analysis.qualityDistribution),
    }

    let weightedSum = 0
    for (const [dimension, score] of Object.entries(scores)) {
      const weight = weights[dimension as keyof typeof weights] || 0
      weightedSum += score * weight
    }

    return weightedSum
  }

  /**
   * Analyze emotional coverage
   */
  private analyzeEmotionalCoverage(
    memories: Memory[]
  ): CoverageAnalysis['emotionalCoverage'] {
    const emotionsFound = new Set<string>()
    const targetEmotions = [
      'joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust',
      'love', 'excitement', 'anxiety', 'contentment', 'frustration', 'hope'
    ]

    for (const memory of memories) {
      const emotionalContext = memory.emotionalContext as any
      if (emotionalContext?.primaryEmotion) {
        emotionsFound.add(emotionalContext.primaryEmotion.toLowerCase())
      }
      
      if (emotionalContext?.emotionalStates) {
        for (const state of emotionalContext.emotionalStates) {
          if (state?.emotion) {
            emotionsFound.add(state.emotion.toLowerCase())
          }
        }
      }
    }

    const emotionsRepresented = Array.from(emotionsFound)
    const coveragePercentage = (emotionsRepresented.length / targetEmotions.length) * 100
    
    const gaps = targetEmotions.filter(emotion => !emotionsFound.has(emotion))

    return {
      emotionsRepresented,
      coveragePercentage,
      gaps,
    }
  }

  /**
   * Analyze temporal coverage
   */
  private analyzeTemporalCoverage(
    memories: Memory[]
  ): CoverageAnalysis['temporalCoverage'] {
    if (memories.length === 0) {
      return {
        timeRange: { start: '', end: '' },
        distribution: 'sparse',
        gaps: [],
      }
    }

    const timestamps = memories
      .map(m => new Date(m.timestamp))
      .sort((a, b) => a.getTime() - b.getTime())

    const start = timestamps[0].toISOString()
    const end = timestamps[timestamps.length - 1].toISOString()

    // Analyze distribution
    const distribution = this.analyzeTemporalDistribution(timestamps)
    
    // Find gaps (periods > 7 days without memories)
    const gaps = this.findTemporalGaps(timestamps)

    return {
      timeRange: { start, end },
      distribution,
      gaps,
    }
  }

  /**
   * Analyze temporal distribution pattern
   */
  private analyzeTemporalDistribution(
    timestamps: Date[]
  ): 'even' | 'clustered' | 'sparse' {
    if (timestamps.length <= 2) return 'sparse'

    const totalSpan = timestamps[timestamps.length - 1].getTime() - timestamps[0].getTime()
    const averageInterval = totalSpan / (timestamps.length - 1)

    // Calculate variance in intervals
    let sumSquaredDiffs = 0
    for (let i = 1; i < timestamps.length; i++) {
      const interval = timestamps[i].getTime() - timestamps[i - 1].getTime()
      const diff = interval - averageInterval
      sumSquaredDiffs += diff * diff
    }

    const variance = sumSquaredDiffs / (timestamps.length - 1)
    const standardDeviation = Math.sqrt(variance)
    const coefficientOfVariation = standardDeviation / averageInterval

    // Classify distribution
    if (coefficientOfVariation < 0.5) return 'even'
    if (coefficientOfVariation > 2.0) return 'clustered'
    return 'sparse'
  }

  /**
   * Find temporal gaps
   */
  private findTemporalGaps(timestamps: Date[]): Array<{ start: string; end: string }> {
    const gaps: Array<{ start: string; end: string }> = []
    const gapThreshold = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

    for (let i = 1; i < timestamps.length; i++) {
      const gapSize = timestamps[i].getTime() - timestamps[i - 1].getTime()
      if (gapSize > gapThreshold) {
        gaps.push({
          start: timestamps[i - 1].toISOString(),
          end: timestamps[i].toISOString(),
        })
      }
    }

    return gaps
  }

  /**
   * Analyze participant coverage
   */
  private analyzeParticipantCoverage(
    memories: Memory[]
  ): CoverageAnalysis['participantCoverage'] {
    const participantsFound = new Set<string>()
    const allParticipants = new Set<string>()

    // In a real implementation, we'd have access to the full participant list
    // For now, we'll analyze based on the sample
    for (const memory of memories) {
      if (memory.participants) {
        for (const participant of memory.participants) {
          const p = participant as any
          if (p?.id) {
            participantsFound.add(p.id)
            allParticipants.add(p.id)
          }
        }
      }
    }

    const participantsRepresented = Array.from(participantsFound)
    const totalParticipants = Math.max(allParticipants.size, 20) // Assume minimum 20 for percentage
    const coveragePercentage = (participantsRepresented.length / totalParticipants) * 100
    
    // Missing participants would be determined from full dataset
    const missingParticipants: string[] = []

    return {
      participantsRepresented,
      coveragePercentage,
      missingParticipants,
    }
  }

  /**
   * Analyze quality distribution
   */
  private analyzeQualityDistribution(
    memories: Memory[]
  ): CoverageAnalysis['qualityDistribution'] {
    const distribution = { high: 0, medium: 0, low: 0 }

    for (const memory of memories) {
      const confidence = memory.metadata.confidence || 0.5
      
      if (confidence >= 0.8) {
        distribution.high++
      } else if (confidence >= 0.5) {
        distribution.medium++
      } else {
        distribution.low++
      }
    }

    return distribution
  }

  /**
   * Get temporal score from coverage analysis
   */
  private getTemporalScore(temporal: CoverageAnalysis['temporalCoverage']): number {
    let score = 0.5 // Base score

    // Bonus for good distribution
    if (temporal.distribution === 'even') {
      score += 0.3
    } else if (temporal.distribution === 'sparse') {
      score += 0.1
    }

    // Penalty for gaps
    const gapPenalty = Math.min(0.3, temporal.gaps.length * 0.1)
    score -= gapPenalty

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Get quality score from distribution
   */
  private getQualityScore(quality: CoverageAnalysis['qualityDistribution']): number {
    const total = quality.high + quality.medium + quality.low
    if (total === 0) return 0

    const highRatio = quality.high / total
    const mediumRatio = quality.medium / total
    const lowRatio = quality.low / total

    // Ideal distribution: 20% high, 60% medium, 20% low
    const idealHigh = 0.2
    const idealMedium = 0.6
    const idealLow = 0.2

    // Calculate distance from ideal
    const distance = Math.abs(highRatio - idealHigh) +
                    Math.abs(mediumRatio - idealMedium) +
                    Math.abs(lowRatio - idealLow)

    // Convert distance to score (lower distance = higher score)
    return Math.max(0, 1 - distance)
  }
}