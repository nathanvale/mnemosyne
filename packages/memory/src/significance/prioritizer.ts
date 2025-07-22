import { createLogger } from '@studio/logger'

import type { ExtractedMemory, EmotionalSignificanceScore } from '../types'

const logger = createLogger({
  tags: ['significance', 'prioritizer'],
})

/**
 * Priority scoring factors
 */
interface PriorityFactors {
  significance: number
  confidence: number
  recency: number
  urgency: number
  uniqueness: number
}

/**
 * MemoryPrioritizer handles prioritization logic for memory validation and processing
 */
export class MemoryPrioritizer {
  /**
   * Prioritize memories by their emotional significance
   */
  async prioritizeBySignificance(
    memories: ExtractedMemory[],
  ): Promise<ExtractedMemory[]> {
    logger.info('Prioritizing memories by significance', {
      memoryCount: memories.length,
    })

    // Calculate priority scores for each memory
    const prioritizedMemories = await Promise.all(
      memories.map(async (memory) => {
        const priorityScore = await this.calculatePriorityScore(memory)
        return { memory, priorityScore }
      }),
    )

    // Sort by priority score (highest first)
    prioritizedMemories.sort((a, b) => b.priorityScore - a.priorityScore)

    const result = prioritizedMemories.map((item) => item.memory)

    logger.info('Memory prioritization complete', {
      originalCount: memories.length,
      prioritizedCount: result.length,
      topScore: prioritizedMemories[0]?.priorityScore,
      bottomScore:
        prioritizedMemories[prioritizedMemories.length - 1]?.priorityScore,
    })

    return result
  }

  /**
   * Get high-priority memories requiring immediate attention
   */
  getHighPriorityMemories(
    memories: ExtractedMemory[],
    significanceScores: Map<string, EmotionalSignificanceScore>,
  ): ExtractedMemory[] {
    const highPriority = memories.filter((memory) => {
      const significance = significanceScores.get(memory.id)
      if (!significance) return false

      // High priority criteria
      return (
        significance.category === 'critical' ||
        (significance.category === 'high' &&
          significance.validationPriority > 8) ||
        this.hasUrgencyIndicators(memory)
      )
    })

    logger.info('High priority memories identified', {
      totalMemories: memories.length,
      highPriorityCount: highPriority.length,
    })

    return highPriority
  }

  /**
   * Create validation queue with optimal ordering
   */
  createValidationQueue(
    memories: ExtractedMemory[],
    significanceScores: Map<string, EmotionalSignificanceScore>,
  ): ExtractedMemory[] {
    // Separate by urgency levels
    const urgent = this.getUrgentMemories(memories, significanceScores)
    const high = this.getHighPriorityMemories(memories, significanceScores)
    const remaining = memories.filter(
      (m) => !urgent.includes(m) && !high.includes(m),
    )

    // Sort each group by their specific criteria
    const sortedUrgent = this.sortByUrgency(urgent, significanceScores)
    const sortedHigh = this.sortBySignificance(high, significanceScores)
    const sortedRemaining = this.sortByOptimalOrder(
      remaining,
      significanceScores,
    )

    const queue = [...sortedUrgent, ...sortedHigh, ...sortedRemaining]

    logger.info('Validation queue created', {
      urgentCount: urgent.length,
      highPriorityCount: high.length,
      remainingCount: remaining.length,
      totalQueueSize: queue.length,
    })

    return queue
  }

  /**
   * Calculate priority score for a memory
   */
  async calculatePriorityScore(memory: ExtractedMemory): Promise<number> {
    const factors = await this.assessPriorityFactors(memory)

    // Weighted combination of factors
    const weights = {
      significance: 0.35,
      confidence: 0.2,
      recency: 0.15,
      urgency: 0.2,
      uniqueness: 0.1,
    }

    let priorityScore = 0
    priorityScore += factors.significance * weights.significance
    priorityScore += factors.confidence * weights.confidence
    priorityScore += factors.recency * weights.recency
    priorityScore += factors.urgency * weights.urgency
    priorityScore += factors.uniqueness * weights.uniqueness

    logger.debug('Priority score calculated', {
      memoryId: memory.id,
      factors,
      priorityScore,
    })

    return Math.round(priorityScore * 100) / 100
  }

  /**
   * Assess batch processing order for efficiency
   */
  optimizeBatchOrder(memories: ExtractedMemory[]): ExtractedMemory[] {
    // Group by similarity for efficient processing
    const groups = this.groupBySimilarity(memories)

    // Sort groups by average priority
    const sortedGroups = groups.sort((a, b) => {
      const avgPriorityA = this.calculateAveragePriority(a)
      const avgPriorityB = this.calculateAveragePriority(b)
      return avgPriorityB - avgPriorityA
    })

    // Flatten groups back to memory list
    const optimizedOrder = sortedGroups.flat()

    logger.info('Batch order optimized', {
      originalCount: memories.length,
      groupCount: groups.length,
      optimizedCount: optimizedOrder.length,
    })

    return optimizedOrder
  }

  // Private helper methods

  private async assessPriorityFactors(
    memory: ExtractedMemory,
  ): Promise<PriorityFactors> {
    // Calculate significance factor (0-10)
    const significance = this.calculateSignificanceFactor(memory)

    // Calculate confidence factor (0-10)
    const confidence = memory.processing.confidence * 10

    // Calculate recency factor (0-10)
    const recency = this.calculateRecencyFactor(memory.timestamp)

    // Calculate urgency factor (0-10)
    const urgency = this.calculateUrgencyFactor(memory)

    // Calculate uniqueness factor (0-10)
    const uniqueness = await this.calculateUniquenessFactor(memory)

    return {
      significance,
      confidence,
      recency,
      urgency,
      uniqueness,
    }
  }

  private calculateSignificanceFactor(memory: ExtractedMemory): number {
    // Base on emotional analysis trajectory significance
    let significance = memory.emotionalAnalysis.trajectory.significance * 10

    // Boost for high-impact patterns
    const highImpactPatterns = memory.emotionalAnalysis.patterns.filter(
      (p) => p.significance > 0.8,
    )
    significance += highImpactPatterns.length * 1.5

    // Boost for extreme mood scores
    const moodScore = memory.emotionalAnalysis.moodScoring.score
    if (moodScore < 3 || moodScore > 8) {
      significance += 2
    }

    return Math.min(10, significance)
  }

  private calculateRecencyFactor(timestamp: string): number {
    const memoryDate = new Date(timestamp)
    const now = new Date()
    const hoursSince = (now.getTime() - memoryDate.getTime()) / (1000 * 60 * 60)

    // Recency scoring (more recent = higher score)
    if (hoursSince <= 1) return 10 // Last hour
    if (hoursSince <= 6) return 9 // Last 6 hours
    if (hoursSince <= 24) return 8 // Last day
    if (hoursSince <= 72) return 7 // Last 3 days
    if (hoursSince <= 168) return 6 // Last week
    if (hoursSince <= 720) return 5 // Last month
    if (hoursSince <= 2160) return 4 // Last 3 months
    if (hoursSince <= 4320) return 3 // Last 6 months
    if (hoursSince <= 8760) return 2 // Last year
    return 1 // Older
  }

  private calculateUrgencyFactor(memory: ExtractedMemory): number {
    let urgency = 0

    // Check for crisis indicators
    const crisisKeywords = [
      'crisis',
      'emergency',
      'urgent',
      'help',
      'desperate',
    ]
    const content = memory.content.toLowerCase()
    const hasCrisisKeywords = crisisKeywords.some((keyword) =>
      content.includes(keyword),
    )

    if (hasCrisisKeywords) {
      urgency += 5
    }

    // Check for very low mood
    if (memory.emotionalAnalysis.moodScoring.score < 3) {
      urgency += 3
    }

    // Check for high conflict
    if (memory.extendedRelationshipDynamics?.conflictLevel === 'high') {
      urgency += 2
    }

    // Check for breakthrough patterns
    const hasBreakthrough = memory.emotionalAnalysis.patterns.some(
      (p) => p.type === 'growth' || p.type === 'mood_repair',
    )
    if (hasBreakthrough) {
      urgency += 1.5
    }

    return Math.min(10, urgency)
  }

  private async calculateUniquenessFactor(
    memory: ExtractedMemory,
  ): Promise<number> {
    // This would ideally compare against similar memories in the database
    // For now, we'll use content characteristics as a proxy

    let uniqueness = 5 // Base score

    // Unique emotional patterns
    const uncommonPatterns = memory.emotionalAnalysis.patterns.filter(
      (p) => p.type === 'vulnerability' || p.type === 'growth',
    )
    uniqueness += uncommonPatterns.length * 1.5

    // Unique relationship dynamics
    if (
      memory.extendedRelationshipDynamics?.type === 'therapeutic' ||
      memory.extendedRelationshipDynamics?.intimacyLevel === 'high'
    ) {
      uniqueness += 1
    }

    // Unique conversation length
    const messageCount = memory.processing.sourceData.messages.length
    if (messageCount > 15 || messageCount < 3) {
      uniqueness += 1
    }

    // Unique emotional trajectory
    if (memory.emotionalAnalysis.trajectory.direction === 'volatile') {
      uniqueness += 1.5
    }

    return Math.min(10, uniqueness)
  }

  private hasUrgencyIndicators(memory: ExtractedMemory): boolean {
    // Crisis mood levels
    if (memory.emotionalAnalysis.moodScoring.score < 3) return true

    // Crisis patterns
    const hasCrisisPattern = memory.emotionalAnalysis.patterns.some(
      (p) => p.type === 'support_seeking' && p.confidence > 0.8,
    )
    if (hasCrisisPattern) return true

    // High conflict situations
    if (memory.extendedRelationshipDynamics?.conflictLevel === 'high')
      return true

    return false
  }

  private getUrgentMemories(
    memories: ExtractedMemory[],
    significanceScores: Map<string, EmotionalSignificanceScore>,
  ): ExtractedMemory[] {
    return memories.filter((memory) => {
      const significance = significanceScores.get(memory.id)
      return (
        (significance?.validationPriority ?? 0) > 9 ||
        this.hasUrgencyIndicators(memory)
      )
    })
  }

  private sortByUrgency(
    memories: ExtractedMemory[],
    significanceScores: Map<string, EmotionalSignificanceScore>,
  ): ExtractedMemory[] {
    return memories.sort((a, b) => {
      const scoreA = significanceScores.get(a.id)?.validationPriority || 0
      const scoreB = significanceScores.get(b.id)?.validationPriority || 0
      return scoreB - scoreA
    })
  }

  private sortBySignificance(
    memories: ExtractedMemory[],
    significanceScores: Map<string, EmotionalSignificanceScore>,
  ): ExtractedMemory[] {
    return memories.sort((a, b) => {
      const scoreA = significanceScores.get(a.id)?.overall || 0
      const scoreB = significanceScores.get(b.id)?.overall || 0
      return scoreB - scoreA
    })
  }

  private sortByOptimalOrder(
    memories: ExtractedMemory[],
    significanceScores: Map<string, EmotionalSignificanceScore>,
  ): ExtractedMemory[] {
    // Balance significance and processing efficiency
    return memories.sort((a, b) => {
      const significanceA = significanceScores.get(a.id)?.overall || 0
      const significanceB = significanceScores.get(b.id)?.overall || 0

      const recencyA = this.calculateRecencyFactor(a.timestamp)
      const recencyB = this.calculateRecencyFactor(b.timestamp)

      const scoreA = significanceA * 0.7 + recencyA * 0.3
      const scoreB = significanceB * 0.7 + recencyB * 0.3

      return scoreB - scoreA
    })
  }

  private groupBySimilarity(memories: ExtractedMemory[]): ExtractedMemory[][] {
    // Group by emotional patterns for efficient batch processing
    const groups = new Map<string, ExtractedMemory[]>()

    for (const memory of memories) {
      // Create a key based on dominant emotional characteristics
      const moodRange = Math.floor(
        memory.emotionalAnalysis.moodScoring.score / 2.5,
      )
      const dominantPattern =
        memory.emotionalAnalysis.patterns[0]?.type || 'none'
      const key = `${moodRange}-${dominantPattern}`

      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(memory)
    }

    return Array.from(groups.values())
  }

  private calculateAveragePriority(memories: ExtractedMemory[]): number {
    if (memories.length === 0) return 0

    const totalSignificance = memories.reduce((sum, memory) => {
      return sum + memory.emotionalAnalysis.trajectory.significance
    }, 0)

    return totalSignificance / memories.length
  }
}
