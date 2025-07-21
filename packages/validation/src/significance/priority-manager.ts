import type { Memory, EmotionalContext } from '@studio/schema'

import { isEmotionalContext, isParticipant } from '@studio/schema'

import type {
  PrioritizedMemory,
  PrioritizedMemoryList,
  EmotionalSignificanceScore,
  ValidationQueue,
  OptimizedQueue,
} from '../types'

/**
 * Manages priority ordering of memories for validation
 */
export class PriorityManager {
  /**
   * Create prioritized list from memories and their significance scores
   */
  createPrioritizedList(
    memories: Memory[],
    significanceScores: Map<string, EmotionalSignificanceScore>,
  ): PrioritizedMemoryList {
    // Create prioritized memories with review context
    const prioritizedMemories: PrioritizedMemory[] = memories
      .map((memory) => {
        const significanceScore = significanceScores.get(memory.id)
        if (!significanceScore) {
          throw new Error(`Missing significance score for memory ${memory.id}`)
        }

        return this.createPrioritizedMemory(memory, significanceScore)
      })
      .sort((a, b) => b.significanceScore.overall - a.significanceScore.overall)
      .map((memory, index) => ({
        ...memory,
        priorityRank: index + 1,
      }))

    // Calculate significance distribution
    const distribution = this.calculateDistribution(prioritizedMemories)

    return {
      memories: prioritizedMemories,
      totalCount: memories.length,
      significanceDistribution: distribution,
    }
  }

  /**
   * Optimize a validation queue based on resource constraints
   */
  optimizeQueue(
    queue: ValidationQueue,
    prioritizedList: PrioritizedMemoryList,
  ): OptimizedQueue {
    const { resourceAllocation } = queue
    const { availableTime, validatorExpertise } = resourceAllocation

    // Calculate optimal batch size based on available time
    const estimatedTimePerMemory =
      this.estimateValidationTime(validatorExpertise)
    const maxMemories = Math.floor(availableTime / estimatedTimePerMemory)

    // Select memories based on strategy
    const strategy = this.selectOptimizationStrategy(queue, prioritizedList)
    const optimizedMemories = this.applyStrategy(
      prioritizedList.memories,
      maxMemories,
      strategy,
    )

    // Calculate expected outcomes
    const expectedOutcomes = this.calculateExpectedOutcomes(
      optimizedMemories,
      estimatedTimePerMemory,
    )

    return {
      originalQueue: queue,
      optimizedOrder: optimizedMemories,
      strategy: {
        name: strategy.name,
        parameters: strategy.parameters,
        expectedOutcomes,
      },
    }
  }

  /**
   * Create a prioritized memory with review context
   */
  private createPrioritizedMemory(
    memory: Memory,
    significanceScore: EmotionalSignificanceScore,
  ): Omit<PrioritizedMemory, 'priorityRank'> {
    const reviewContext = this.generateReviewContext(memory, significanceScore)

    return {
      memory,
      significanceScore,
      reviewContext,
    }
  }

  /**
   * Generate review context for a memory
   */
  private generateReviewContext(
    memory: Memory,
    significanceScore: EmotionalSignificanceScore,
  ): PrioritizedMemory['reviewContext'] {
    const focusAreas: string[] = []
    const validationHints: string[] = []

    // Identify focus areas based on significance factors
    const { factors } = significanceScore

    if (factors.emotionalIntensity > 0.8) {
      focusAreas.push('High emotional intensity - verify emotional accuracy')
      validationHints.push(
        'Pay special attention to emotional nuances and intensity levels',
      )
    }

    if (factors.relationshipImpact > 0.8) {
      focusAreas.push(
        'Significant relationship impact - check relationship dynamics',
      )
      validationHints.push(
        'Verify participant relationships and interaction patterns',
      )
    }

    if (factors.lifeEventSignificance > 0.8) {
      focusAreas.push('Major life event - ensure context completeness')
      validationHints.push('Confirm all relevant context is captured')
    }

    if (factors.participantVulnerability > 0.7) {
      focusAreas.push('Vulnerable participants - handle with sensitivity')
      validationHints.push('Apply extra care and privacy considerations')
    }

    // Generate review reason
    const reviewReason = this.generateReviewReason(significanceScore)

    return {
      reviewReason,
      focusAreas,
      relatedMemoryIds: [], // Would be populated by relationship analysis
      validationHints,
    }
  }

  /**
   * Generate human-readable review reason
   */
  private generateReviewReason(score: EmotionalSignificanceScore): string {
    const { overall, factors } = score

    if (overall > 0.9) {
      return 'Critical emotional memory requiring careful validation'
    }

    // Find the highest factor
    const highestFactor = Object.entries(factors).sort((a, b) => b[1] - a[1])[0]

    const factorDescriptions: Record<string, string> = {
      emotionalIntensity: 'high emotional intensity',
      relationshipImpact: 'significant relationship implications',
      lifeEventSignificance: 'major life event',
      participantVulnerability: 'vulnerable participant involvement',
      temporalImportance: 'temporal significance',
    }

    return `Requires review due to ${factorDescriptions[highestFactor[0]] || 'elevated significance'}`
  }

  /**
   * Calculate significance distribution
   */
  private calculateDistribution(
    memories: PrioritizedMemory[],
  ): PrioritizedMemoryList['significanceDistribution'] {
    const distribution = {
      high: 0,
      medium: 0,
      low: 0,
    }

    for (const memory of memories) {
      const score = memory.significanceScore.overall
      if (score >= 0.7) {
        distribution.high++
      } else if (score >= 0.4) {
        distribution.medium++
      } else {
        distribution.low++
      }
    }

    return distribution
  }

  /**
   * Estimate validation time based on validator expertise
   */
  private estimateValidationTime(
    expertise: 'beginner' | 'intermediate' | 'expert',
  ): number {
    // Time in minutes per memory
    switch (expertise) {
      case 'expert':
        return 3
      case 'intermediate':
        return 5
      case 'beginner':
        return 8
    }
  }

  /**
   * Select optimization strategy based on queue characteristics
   */
  private selectOptimizationStrategy(
    queue: ValidationQueue,
    prioritizedList: PrioritizedMemoryList,
  ): OptimizationStrategy {
    const { significanceDistribution } = prioritizedList
    const totalMemories = prioritizedList.totalCount

    // If mostly high significance, focus on those
    if (significanceDistribution.high / totalMemories > 0.3) {
      return {
        name: 'high-significance-focus',
        parameters: {
          minSignificance: 0.7,
          diversityWeight: 0.3,
        },
      }
    }

    // If time is limited, use balanced sampling
    if (queue.resourceAllocation.availableTime < 60) {
      return {
        name: 'balanced-sampling',
        parameters: {
          highRatio: 0.4,
          mediumRatio: 0.4,
          lowRatio: 0.2,
        },
      }
    }

    // Default: significance-weighted selection
    return {
      name: 'significance-weighted',
      parameters: {
        significanceWeight: 0.7,
        diversityWeight: 0.3,
      },
    }
  }

  /**
   * Apply optimization strategy to select memories
   */
  private applyStrategy(
    memories: PrioritizedMemory[],
    maxCount: number,
    strategy: OptimizationStrategy,
  ): PrioritizedMemory[] {
    switch (strategy.name) {
      case 'high-significance-focus': {
        const minSignificance = strategy.parameters.minSignificance as number
        return memories
          .filter((m) => m.significanceScore.overall >= minSignificance)
          .slice(0, maxCount)
      }

      case 'balanced-sampling': {
        const { highRatio, mediumRatio, lowRatio } = strategy.parameters as {
          highRatio: number
          mediumRatio: number
          lowRatio: number
        }

        const highCount = Math.floor(maxCount * highRatio)
        const mediumCount = Math.floor(maxCount * mediumRatio)
        const lowCount = Math.floor(maxCount * lowRatio)

        const high = memories
          .filter((m) => m.significanceScore.overall >= 0.7)
          .slice(0, highCount)
        const medium = memories
          .filter(
            (m) =>
              m.significanceScore.overall >= 0.4 &&
              m.significanceScore.overall < 0.7,
          )
          .slice(0, mediumCount)
        const low = memories
          .filter((m) => m.significanceScore.overall < 0.4)
          .slice(0, lowCount)

        return [...high, ...medium, ...low]
      }

      case 'significance-weighted':
      default:
        // Simple significance-based selection
        return memories.slice(0, maxCount)
    }
  }

  /**
   * Calculate expected outcomes for optimization
   */
  private calculateExpectedOutcomes(
    memories: PrioritizedMemory[],
    timePerMemory: number,
  ): OptimizedQueue['strategy']['expectedOutcomes'] {
    const estimatedTime = memories.length * timePerMemory

    // Calculate average quality
    const avgSignificance =
      memories.reduce((sum, m) => sum + m.significanceScore.overall, 0) /
      memories.length

    // Calculate coverage metrics
    const emotionalRange = this.calculateEmotionalRange(memories)
    const temporalSpan = this.calculateTemporalSpan(memories)
    const participantDiversity = this.calculateParticipantDiversity(memories)

    return {
      estimatedTime,
      expectedQuality: avgSignificance,
      coverage: {
        emotionalRange,
        temporalSpan,
        participantDiversity,
      },
    }
  }

  /**
   * Calculate emotional range coverage
   */
  private calculateEmotionalRange(memories: PrioritizedMemory[]): number {
    // Simplified calculation - would analyze actual emotional contexts
    const uniqueEmotions = new Set<string>()

    for (const memory of memories) {
      const emotionalContext: EmotionalContext | unknown =
        memory.memory.emotionalContext
      if (
        isEmotionalContext(emotionalContext) &&
        emotionalContext.primaryEmotion
      ) {
        uniqueEmotions.add(emotionalContext.primaryEmotion)
      }
    }

    // Assume ~10 primary emotions for diversity calculation
    return Math.min(1, uniqueEmotions.size / 10)
  }

  /**
   * Calculate temporal span coverage
   */
  private calculateTemporalSpan(memories: PrioritizedMemory[]): number {
    if (memories.length === 0) return 0

    const timestamps = memories.map((m) =>
      new Date(m.memory.timestamp).getTime(),
    )
    const minTime = Math.min(...timestamps)
    const maxTime = Math.max(...timestamps)

    // Calculate span in days
    const spanDays = (maxTime - minTime) / (1000 * 60 * 60 * 24)

    // Normalize to 0-1 (assume 365 days is full coverage)
    return Math.min(1, spanDays / 365)
  }

  /**
   * Calculate participant diversity
   */
  private calculateParticipantDiversity(memories: PrioritizedMemory[]): number {
    const uniqueParticipants = new Set<string>()

    for (const memory of memories) {
      for (const participant of memory.memory.participants || []) {
        if (isParticipant(participant) && participant.id) {
          uniqueParticipants.add(participant.id)
        }
      }
    }

    // Assume target of 20 unique participants for full diversity
    return Math.min(1, uniqueParticipants.size / 20)
  }
}

/**
 * Internal optimization strategy type
 */
interface OptimizationStrategy {
  name: string
  parameters: Record<string, unknown>
}
