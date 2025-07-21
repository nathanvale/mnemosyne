import type { Memory } from '@studio/schema'

import { createLogger } from '@studio/logger'

import type {
  EmotionalSignificanceWeighter,
  EmotionalSignificanceScore,
  PrioritizedMemoryList,
  ValidationQueue,
  OptimizedQueue,
} from '../types'

import { PriorityManager } from './priority-manager'

const logger = createLogger({ tags: ['validation:significance'] })

/**
 * Implementation of emotional significance weighting
 */
class EmotionalSignificanceWeighterImpl implements EmotionalSignificanceWeighter {
  private priorityManager: PriorityManager

  constructor() {
    this.priorityManager = new PriorityManager()
  }

  /**
   * Calculate emotional significance for a memory
   */
  calculateSignificance(memory: Memory): EmotionalSignificanceScore {
    logger.debug('Calculating significance', { memoryId: memory.id })

    const factors = {
      emotionalIntensity: this.calculateEmotionalIntensity(memory),
      relationshipImpact: this.assessRelationshipImpact(memory),
      lifeEventSignificance: this.evaluateLifeEventSignificance(memory),
      participantVulnerability: this.assessParticipantVulnerability(memory),
      temporalImportance: this.calculateTemporalImportance(memory),
    }

    // Calculate weighted overall score
    const overall = this.calculateOverallSignificance(factors)

    // Generate narrative explanation
    const narrative = this.generateNarrative(memory, factors, overall)

    const score: EmotionalSignificanceScore = {
      overall,
      factors,
      narrative,
    }

    logger.info('Significance calculated', {
      memoryId: memory.id,
      overall,
      factors,
    })

    return score
  }

  /**
   * Prioritize a list of memories by significance
   */
  prioritizeMemories(memories: Memory[]): PrioritizedMemoryList {
    logger.info('Prioritizing memories', { count: memories.length })

    // Calculate significance for all memories
    const significanceScores = new Map<string, EmotionalSignificanceScore>()
    
    for (const memory of memories) {
      try {
        const score = this.calculateSignificance(memory)
        significanceScores.set(memory.id, score)
      } catch (error) {
        logger.error('Error calculating significance', {
          memoryId: memory.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        
        // Assign default low significance on error
        significanceScores.set(memory.id, {
          overall: 0.3,
          factors: {
            emotionalIntensity: 0.3,
            relationshipImpact: 0.3,
            lifeEventSignificance: 0.3,
            participantVulnerability: 0.3,
            temporalImportance: 0.3,
          },
          narrative: 'Unable to calculate significance - requires manual review',
        })
      }
    }

    // Create prioritized list
    const prioritizedList = this.priorityManager.createPrioritizedList(
      memories,
      significanceScores
    )

    logger.info('Prioritization complete', {
      totalMemories: memories.length,
      distribution: prioritizedList.significanceDistribution,
    })

    return prioritizedList
  }

  /**
   * Optimize a validation queue
   */
  optimizeReviewQueue(queue: ValidationQueue): OptimizedQueue {
    logger.info('Optimizing review queue', {
      queueId: queue.id,
      pendingCount: queue.pendingMemories.length,
    })

    // First prioritize the memories
    const prioritizedList = this.prioritizeMemories(queue.pendingMemories)
    
    // Then optimize based on resources
    const optimizedQueue = this.priorityManager.optimizeQueue(queue, prioritizedList)

    logger.info('Queue optimization complete', {
      queueId: queue.id,
      optimizedCount: optimizedQueue.optimizedOrder.length,
      strategy: optimizedQueue.strategy.name,
    })

    return optimizedQueue
  }

  /**
   * Calculate emotional intensity factor
   */
  private calculateEmotionalIntensity(memory: Memory): number {
    const emotionalContext = memory.emotionalContext as any
    if (!emotionalContext) return 0.3

    let score = 0.3 // Base score

    // Check intensity value
    if (emotionalContext.intensity !== undefined) {
      score = emotionalContext.intensity * 0.5 + 0.3
    }

    // Check for multiple emotions
    if (emotionalContext.emotionalStates && Array.isArray(emotionalContext.emotionalStates)) {
      const stateCount = emotionalContext.emotionalStates.length
      if (stateCount > 2) {
        score += 0.2 // Complex emotional state
      }
    }

    // Check for emotional themes
    if (emotionalContext.themes && Array.isArray(emotionalContext.themes)) {
      const significantThemes = ['loss', 'love', 'achievement', 'trauma', 'joy']
      const hasSignificantTheme = emotionalContext.themes.some((theme: string) =>
        significantThemes.some(sig => theme.toLowerCase().includes(sig))
      )
      if (hasSignificantTheme) {
        score += 0.2
      }
    }

    return Math.min(1, score)
  }

  /**
   * Assess relationship impact
   */
  private assessRelationshipImpact(memory: Memory): number {
    const dynamics = memory.relationshipDynamics as any
    if (!dynamics) return 0.3

    let score = 0.3 // Base score

    // Check interaction quality
    if (dynamics.interactionQuality) {
      const quality = dynamics.interactionQuality.toLowerCase()
      if (quality === 'transformative' || quality === 'defining') {
        score += 0.3
      } else if (quality === 'significant' || quality === 'meaningful') {
        score += 0.2
      }
    }

    // Check communication patterns
    if (dynamics.communicationPatterns && Array.isArray(dynamics.communicationPatterns)) {
      const significantPatterns = ['conflict', 'breakthrough', 'reconciliation', 'confession']
      const hasSignificantPattern = dynamics.communicationPatterns.some((pattern: string) =>
        significantPatterns.some(sig => pattern.toLowerCase().includes(sig))
      )
      if (hasSignificantPattern) {
        score += 0.2
      }
    }

    // Check number of participants
    if (memory.participants && memory.participants.length > 2) {
      score += 0.1 // Group dynamics add complexity
    }

    return Math.min(1, score)
  }

  /**
   * Evaluate life event significance
   */
  private evaluateLifeEventSignificance(memory: Memory): number {
    let score = 0.4 // Base score

    // Check tags for life events
    const lifeEventTags = [
      'wedding', 'birth', 'death', 'graduation', 'promotion',
      'breakup', 'divorce', 'accident', 'diagnosis', 'achievement',
      'milestone', 'anniversary', 'reunion', 'farewell'
    ]
    
    const hasLifeEventTag = memory.tags.some(tag =>
      lifeEventTags.some(event => tag.toLowerCase().includes(event))
    )
    
    if (hasLifeEventTag) {
      score += 0.3
    }

    // Check content for life event keywords
    const contentLower = memory.content.toLowerCase()
    const lifeEventKeywords = [
      'first time', 'last time', 'never forget', 'changed my life',
      'turning point', 'milestone', 'announced', 'diagnosed',
      'passed away', 'born', 'married', 'proposed'
    ]
    
    const keywordMatches = lifeEventKeywords.filter(keyword =>
      contentLower.includes(keyword)
    ).length
    
    score += Math.min(0.3, keywordMatches * 0.1)

    return Math.min(1, score)
  }

  /**
   * Assess participant vulnerability
   */
  private assessParticipantVulnerability(memory: Memory): number {
    let score = 0.3 // Base score

    const participants = memory.participants as any[]
    if (!participants || participants.length === 0) return score

    // Check for vulnerability indicators
    for (const participant of participants) {
      if (!participant) continue

      // Check role-based vulnerability
      if (participant.role) {
        const vulnerableRoles = ['child', 'patient', 'elderly', 'dependent']
        if (vulnerableRoles.some(role => participant.role.toLowerCase().includes(role))) {
          score += 0.3
          break
        }
      }

      // Check relationship type for vulnerability
      if (participant.relationship) {
        const vulnerableRelationships = ['child', 'parent', 'grandparent', 'caregiver']
        if (vulnerableRelationships.some(rel => participant.relationship.toLowerCase().includes(rel))) {
          score += 0.2
        }
      }
    }

    // Check emotional context for vulnerability
    const emotionalContext = memory.emotionalContext as any
    if (emotionalContext?.themes) {
      const vulnerableThemes = ['grief', 'trauma', 'illness', 'loss', 'abuse']
      const hasVulnerableTheme = emotionalContext.themes.some((theme: string) =>
        vulnerableThemes.some(vul => theme.toLowerCase().includes(vul))
      )
      if (hasVulnerableTheme) {
        score += 0.2
      }
    }

    return Math.min(1, score)
  }

  /**
   * Calculate temporal importance
   */
  private calculateTemporalImportance(memory: Memory): number {
    let score = 0.5 // Base score

    try {
      const memoryDate = new Date(memory.timestamp)
      const now = new Date()
      
      // Recent memories (last 30 days) get higher importance
      const daysSince = (now.getTime() - memoryDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince <= 30) {
        score += 0.2
      } else if (daysSince <= 90) {
        score += 0.1
      }

      // Special dates get higher importance
      const month = memoryDate.getMonth()
      const day = memoryDate.getDate()
      
      // Common celebration/remembrance dates
      const specialDates = [
        { month: 11, day: 25 }, // Christmas
        { month: 0, day: 1 },   // New Year
        { month: 1, day: 14 },  // Valentine's
        { month: 11, day: 31 }, // New Year's Eve
      ]
      
      const isSpecialDate = specialDates.some(special =>
        special.month === month && special.day === day
      )
      
      if (isSpecialDate) {
        score += 0.2
      }

      // Weekend memories often more significant (family time)
      const dayOfWeek = memoryDate.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        score += 0.1
      }
    } catch {
      // Invalid date, keep base score
    }

    return Math.min(1, score)
  }

  /**
   * Calculate overall significance from factors
   */
  private calculateOverallSignificance(
    factors: EmotionalSignificanceScore['factors']
  ): number {
    // Weighted average with emphasis on emotional intensity and relationship impact
    const weights = {
      emotionalIntensity: 0.30,
      relationshipImpact: 0.25,
      lifeEventSignificance: 0.20,
      participantVulnerability: 0.15,
      temporalImportance: 0.10,
    }

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
   * Generate narrative explanation of significance
   */
  private generateNarrative(
    memory: Memory,
    factors: EmotionalSignificanceScore['factors'],
    overall: number
  ): string {
    const parts: string[] = []

    if (overall >= 0.8) {
      parts.push('This is a highly significant emotional memory')
    } else if (overall >= 0.6) {
      parts.push('This memory has moderate emotional significance')
    } else {
      parts.push('This memory has lower emotional significance')
    }

    // Add top factors
    const sortedFactors = Object.entries(factors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)

    const factorDescriptions: Record<string, string> = {
      emotionalIntensity: 'strong emotional content',
      relationshipImpact: 'important relationship dynamics',
      lifeEventSignificance: 'major life event',
      participantVulnerability: 'vulnerable participants',
      temporalImportance: 'temporal significance',
    }

    if (sortedFactors.length > 0) {
      const descriptions = sortedFactors
        .filter(([_, value]) => value > 0.6)
        .map(([factor]) => factorDescriptions[factor])
        .filter(Boolean)

      if (descriptions.length > 0) {
        parts.push(`due to ${descriptions.join(' and ')}`)
      }
    }

    // Add participant count if relevant
    if (memory.participants && memory.participants.length > 2) {
      parts.push(`involving ${memory.participants.length} participants`)
    }

    return parts.join(' ') + '.'
  }
}

/**
 * Factory function to create significance weighter
 */
export function createSignificanceWeighter(): EmotionalSignificanceWeighter {
  return new EmotionalSignificanceWeighterImpl()
}