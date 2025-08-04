import { createLogger } from '@studio/logger'

import type {
  ExtractedMemory,
  EmotionalSignificanceScore,
  EmotionalAnalysis,
} from '../types'

import { MemoryPrioritizer } from './prioritizer'
import { RelationshipImpactAnalyzer } from './relationship-impact'
import { SalienceCalculator } from './salience-calculator'

const logger = createLogger({
  tags: ['significance', 'analyzer'],
})

/**
 * Special date configuration for significance analysis
 */
export interface SpecialDate {
  /** Month (0-11) */
  month: number
  /** Day of month (1-31) */
  day: number
  /** Optional name for the date */
  name?: string
}

/**
 * Default special dates (US-centric)
 */
export const DEFAULT_SPECIAL_DATES: SpecialDate[] = [
  { month: 0, day: 1, name: "New Year's Day" },
  { month: 1, day: 14, name: "Valentine's Day" },
  { month: 3, day: 1, name: "April Fool's Day" },
  { month: 6, day: 4, name: 'Independence Day (US)' },
  { month: 9, day: 31, name: 'Halloween' },
  { month: 10, day: 11, name: 'Veterans Day' },
  { month: 11, day: 25, name: 'Christmas' },
  { month: 11, day: 31, name: "New Year's Eve" },
]

/**
 * Configuration for significance analysis
 */
export interface SignificanceAnalyzerConfig {
  /** Weight for emotional salience component (0-1) */
  emotionalSalienceWeight: number
  /** Weight for relationship impact component (0-1) */
  relationshipImpactWeight: number
  /** Weight for contextual importance component (0-1) */
  contextualImportanceWeight: number
  /** Weight for temporal relevance component (0-1) */
  temporalRelevanceWeight: number
  /** Minimum score for high significance (0-10) */
  highSignificanceThreshold: number
  /** Minimum score for medium significance (0-10) */
  mediumSignificanceThreshold: number
  /** Custom special dates for cultural/regional relevance */
  specialDates?: SpecialDate[]
}

/**
 * EmotionalSignificanceAnalyzer assesses the emotional significance of memories
 * for prioritization and validation
 */
export class EmotionalSignificanceAnalyzer {
  private readonly config: SignificanceAnalyzerConfig
  private readonly specialDates: SpecialDate[]
  private readonly salienceCalculator: SalienceCalculator
  private readonly relationshipAnalyzer: RelationshipImpactAnalyzer
  private readonly prioritizer: MemoryPrioritizer

  constructor(config?: Partial<SignificanceAnalyzerConfig>) {
    this.config = {
      emotionalSalienceWeight: 0.35,
      relationshipImpactWeight: 0.25,
      contextualImportanceWeight: 0.25,
      temporalRelevanceWeight: 0.15,
      highSignificanceThreshold: 7.5,
      mediumSignificanceThreshold: 5.0,
      ...config,
    }

    this.specialDates = config?.specialDates || DEFAULT_SPECIAL_DATES

    this.salienceCalculator = new SalienceCalculator()
    this.relationshipAnalyzer = new RelationshipImpactAnalyzer()
    this.prioritizer = new MemoryPrioritizer()
  }

  /**
   * Assess the emotional significance of a memory
   */
  async assessSignificance(
    memory: ExtractedMemory,
  ): Promise<EmotionalSignificanceScore> {
    logger.debug('Assessing emotional significance', {
      memoryId: memory.id,
      extractedAt: memory.processing.extractedAt,
    })

    // Calculate component scores
    const emotionalSalience = await this.salienceCalculator.calculateSalience(
      memory.emotionalAnalysis,
    )

    const relationshipImpact = await this.relationshipAnalyzer.assessImpact(
      memory.extendedRelationshipDynamics || {
        type: 'friend',
        supportLevel: 'medium',
        intimacyLevel: 'medium',
        intimacy: 'medium', // Backwards compatibility
        conflictLevel: 'low',
        trustLevel: 'medium',
        conflictPresent: false,
        conflictIntensity: 'low',
        communicationStyle: 'supportive',
        communicationStyleDetails: {
          vulnerabilityLevel: 'medium',
          emotionalSafety: 'medium',
          supportPatterns: [],
          conflictPatterns: [],
          professionalBoundaries: false,
          guidancePatterns: [],
          therapeuticElements: [],
        },
        participantDynamics: {
          supportBalance: 'balanced',
          mutualVulnerability: false,
        },
        emotionalSafety: {
          overall: 'medium',
          acceptanceLevel: 'medium',
          judgmentRisk: 'low',
          validationPresent: false,
        },
      },
      memory.participants.map((p) => ({
        id: p.id,
        name: p.name,
        role: 'author', // Convert schema ParticipantRole to ConversationParticipant role
        messageCount: 1,
        emotionalExpressions: [],
      })),
    )

    const contextualImportance = this.assessContextualImportance(memory)
    const temporalRelevance = this.calculateTemporalRelevance(memory)

    // Calculate weighted overall score
    const overall = this.calculateOverallSignificance({
      emotionalSalience,
      relationshipImpact,
      contextualImportance,
      temporalRelevance,
    })

    // Determine category
    const category = this.categorizeSignificance(overall)

    // Calculate validation priority
    const validationPriority = this.calculateValidationPriorityWithMemory(
      overall,
      memory.processing.confidence,
      memory,
    )

    // Calculate confidence in significance assessment
    const confidence = this.calculateSignificanceConfidence(
      memory.emotionalAnalysis,
      memory.processing.confidence,
    )

    const result: EmotionalSignificanceScore = {
      overall,
      components: {
        emotionalSalience,
        relationshipImpact,
        contextualImportance,
        temporalRelevance,
      },
      confidence,
      category,
      validationPriority,
    }

    logger.info('Significance assessment complete', {
      memoryId: memory.id,
      overall,
      category,
      confidence,
    })

    return result
  }

  /**
   * Prioritize memories for validation based on significance
   */
  async prioritizeForValidation(
    memories: ExtractedMemory[],
  ): Promise<ExtractedMemory[]> {
    logger.info('Prioritizing memories for validation', {
      memoryCount: memories.length,
    })

    return this.prioritizer.prioritizeBySignificance(memories)
  }

  /**
   * Batch process multiple memories for significance assessment
   */
  async processBatch(
    memories: ExtractedMemory[],
  ): Promise<Map<string, EmotionalSignificanceScore>> {
    const results = new Map<string, EmotionalSignificanceScore>()

    logger.info('Processing significance batch', {
      memoryCount: memories.length,
    })

    for (const memory of memories) {
      try {
        const significance = await this.assessSignificance(memory)
        results.set(memory.id, significance)
      } catch (error) {
        logger.error('Failed to assess significance', {
          memoryId: memory.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })

        // Add default low significance for failed assessments
        results.set(memory.id, {
          overall: 3.0,
          components: {
            emotionalSalience: 3.0,
            relationshipImpact: 3.0,
            contextualImportance: 3.0,
            temporalRelevance: 3.0,
          },
          confidence: 0.3,
          category: 'low',
          validationPriority: 2.0,
        })
      }
    }

    logger.info('Batch processing complete', {
      processedCount: results.size,
      failedCount: memories.length - results.size,
    })

    return results
  }

  // Private helper methods

  private assessContextualImportance(memory: ExtractedMemory): number {
    let score = 5.0 // Base score

    const content = memory.content.toLowerCase()
    const moodDescriptors =
      memory.emotionalAnalysis.moodScoring.descriptors.map((d) =>
        d.toLowerCase(),
      )

    // Check for crisis indicators - highest priority
    const crisisKeywords = [
      'crisis',
      'emergency',
      'urgent',
      'distress',
      'suicidal',
      'self-harm',
      'despair',
      'hopelessness',
      'overwhelming',
      "can't cope",
      'breaking point',
    ]

    const hasCrisisContext = crisisKeywords.some(
      (keyword) =>
        content.includes(keyword) ||
        moodDescriptors.some((desc) => desc.includes(keyword)),
    )

    if (hasCrisisContext) {
      score = 9.5 // Crisis situations have very high contextual importance
    }

    // Check for vulnerability in therapeutic/high-trust contexts - very high contextual importance
    const hasVulnerability = moodDescriptors.some((desc) =>
      desc.includes('vulnerable'),
    )
    const isTherapeuticContext =
      memory.extendedRelationshipDynamics?.type === 'therapeutic'
    const isHighTrustContext =
      memory.extendedRelationshipDynamics?.trustLevel === 'high'

    if (
      hasVulnerability &&
      (isTherapeuticContext || isHighTrustContext) &&
      !hasCrisisContext
    ) {
      score = Math.max(score, 8.5) // Vulnerability in safe contexts is highly contextually important
    } else if (hasVulnerability && !hasCrisisContext) {
      score = Math.max(score, 7.0) // General vulnerability is important
    }

    // Check for conflict escalation in close relationships - high contextual importance
    const hasConflict = moodDescriptors.some((desc) =>
      desc.includes('conflict'),
    )
    const isCloseRelationship =
      memory.extendedRelationshipDynamics?.type === 'close_friend' ||
      memory.extendedRelationshipDynamics?.type === 'romantic' ||
      memory.extendedRelationshipDynamics?.type === 'family'
    const hasHighConflict =
      memory.extendedRelationshipDynamics?.conflictLevel === 'high'

    if (
      hasConflict &&
      isCloseRelationship &&
      hasHighConflict &&
      !hasCrisisContext
    ) {
      score = Math.max(score, 8.0) // Conflict escalation in close relationships is contextually very important
    } else if (hasConflict && hasHighConflict && !hasCrisisContext) {
      score = Math.max(score, 7.5) // High conflict is generally important
    }

    // Check for life events or milestones
    const lifeEventKeywords = [
      'birthday',
      'anniversary',
      'graduation',
      'wedding',
      'funeral',
      'birth',
      'death',
      'diagnosis',
      'surgery',
      'accident',
      'promotion',
      'job',
      'career',
      'move',
      'travel',
    ]
    const hasLifeEvent = lifeEventKeywords.some(
      (keyword) =>
        content.includes(keyword) ||
        memory.tags.some((tag) => tag.toLowerCase().includes(keyword)),
    )

    if (hasLifeEvent && !hasCrisisContext) {
      // Don't override crisis scoring
      score += 2.0
    }

    // Check for first/last time indicators (only if not crisis)
    if (!hasCrisisContext) {
      const firstLastIndicators = ['first time', 'last time', 'never', 'always']
      const hasFirstLast = firstLastIndicators.some((indicator) =>
        content.includes(indicator),
      )

      if (hasFirstLast) {
        score += 1.5
      }

      // Check for decision or commitment language
      const decisionKeywords = [
        'decided',
        'chose',
        'committed',
        'promised',
        'vowed',
      ]
      const hasDecision = decisionKeywords.some((keyword) =>
        content.includes(keyword),
      )

      if (hasDecision) {
        score += 1.0
      }

      // Check conversation length as complexity indicator
      const sourceData = memory.processing.sourceData
      if (sourceData.messages.length > 10) {
        score += 0.5 // Extended conversations often indicate importance
      }
    }

    return Math.min(10, score)
  }

  private calculateTemporalRelevance(memory: ExtractedMemory): number {
    const memoryDate = new Date(memory.timestamp)
    const now = new Date()
    const daysSince =
      (now.getTime() - memoryDate.getTime()) / (1000 * 60 * 60 * 24)

    // Recent memories are more relevant
    let score = 8.0

    if (daysSince <= 7) {
      score = 9.0 // Very recent
    } else if (daysSince <= 30) {
      score = 8.0 // Recent
    } else if (daysSince <= 90) {
      score = 7.0 // Somewhat recent
    } else if (daysSince <= 365) {
      score = 6.0 // This year
    } else {
      score = 5.0 // Older
    }

    // Boost temporal relevance for significant mood transitions (recent emotional events are more relevant)
    const trajectory = memory.emotionalAnalysis.trajectory
    if (trajectory.significance > 0.8 && trajectory.turningPoints.length > 0) {
      score += 1.5 // Major mood transitions are temporally significant
    } else if (trajectory.significance > 0.6) {
      score += 1.0 // Moderate mood transitions
    }

    // Check for anniversary dates (month/day match)
    const isAnniversary = this.checkAnniversaryDate(memoryDate, now)
    if (isAnniversary) {
      score += 1.0
    }

    // Check for significant dates
    const isSpecialDate = this.checkSpecialDate(memoryDate)
    if (isSpecialDate) {
      score += 0.5
    }

    return Math.min(10, score)
  }

  private calculateOverallSignificance(
    components: EmotionalSignificanceScore['components'],
  ): number {
    const weights = this.config

    let weightedSum = 0
    weightedSum +=
      components.emotionalSalience * weights.emotionalSalienceWeight
    weightedSum +=
      components.relationshipImpact * weights.relationshipImpactWeight
    weightedSum +=
      components.contextualImportance * weights.contextualImportanceWeight
    weightedSum +=
      components.temporalRelevance * weights.temporalRelevanceWeight

    const totalWeight = Object.values(weights)
      .slice(0, 4)
      .reduce((a, b) => a + b, 0)
    return weightedSum / totalWeight
  }

  private categorizeSignificance(
    score: number,
  ): EmotionalSignificanceScore['category'] {
    if (score >= this.config.highSignificanceThreshold) {
      return 'critical'
    } else if (score >= this.config.mediumSignificanceThreshold) {
      return 'high'
    } else if (score >= 3.5) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  private calculateValidationPriority(
    overallScore: number,
    confidence: number,
  ): number {
    // Priority based on significance and confidence
    const significancePriority = overallScore

    // High significance but low confidence = high priority for validation
    // High significance and high confidence = medium priority
    // Low significance = low priority regardless of confidence

    let priority = significancePriority

    // Enhanced priority logic based on confidence levels
    if (overallScore >= 7) {
      if (confidence < 0.6) {
        priority += 2.5 // Very uncertain high-significance memories need highest priority
      } else if (confidence < 0.75) {
        priority += 1.5 // Moderately uncertain high-significance memories
      } else if (confidence >= 0.75) {
        priority -= 1.0 // Higher confidence means lower validation priority
      }
    } else if (overallScore >= 5 && confidence < 0.5) {
      priority += 1.0 // Even medium significance with very low confidence needs attention
    }

    // Special boost for crisis and extreme mood situations
    if (overallScore >= 8.5) {
      priority += 1.5 // Crisis situations need maximum validation priority
    } else if (overallScore >= 8.0) {
      priority += 1.0 // High significance situations need extra priority
    }

    return Math.max(1, Math.min(10, priority))
  }

  private calculateValidationPriorityWithMemory(
    overallScore: number,
    confidence: number,
    memory: ExtractedMemory,
  ): number {
    let priority = this.calculateValidationPriority(overallScore, confidence)

    // Additional priority boost for rapid mood deterioration (using trajectory data)
    const trajectory = memory.emotionalAnalysis.trajectory
    if (trajectory.direction === 'declining' && trajectory.significance > 0.8) {
      const turningPoints = trajectory.turningPoints.filter(
        (tp) => tp.type === 'setback',
      )
      if (turningPoints.length > 0) {
        const rapidDeterioraton = turningPoints.some((tp) => tp.magnitude > 3.5)
        if (rapidDeterioraton) {
          priority += 0.5 // Extra boost for rapid deterioration requiring urgent validation
        }
      }
    }

    // Additional priority boost for conflict escalation in close relationships
    const moodDescriptors =
      memory.emotionalAnalysis.moodScoring.descriptors.map((d) =>
        d.toLowerCase(),
      )
    const hasConflict = moodDescriptors.some((desc) =>
      desc.includes('conflict'),
    )
    const isCloseRelationship =
      memory.extendedRelationshipDynamics?.type === 'close_friend' ||
      memory.extendedRelationshipDynamics?.type === 'romantic' ||
      memory.extendedRelationshipDynamics?.type === 'family'
    const hasHighConflict =
      memory.extendedRelationshipDynamics?.conflictLevel === 'high'

    if (hasConflict && isCloseRelationship && hasHighConflict) {
      priority += 0.8 // Conflict escalation in close relationships needs higher validation priority
    } else if (hasConflict && hasHighConflict) {
      priority += 0.5 // General high conflict needs attention
    }

    return Math.max(1, Math.min(10, priority))
  }

  private calculateSignificanceConfidence(
    emotionalAnalysis: EmotionalAnalysis,
    processingConfidence: number,
  ): number {
    const moodScore = emotionalAnalysis.moodScoring.score
    const moodConfidence = emotionalAnalysis.moodScoring.confidence

    // Base confidence on processing confidence
    let confidence = processingConfidence * 0.5

    // Enhanced mood confidence weighting for extreme mood states
    let moodWeight = 0.35

    // Boost confidence weighting for extreme mood states
    if (moodScore >= 8.5 || moodScore <= 3.5) {
      moodWeight = 0.45 // Higher weight for extreme moods
    }

    confidence += moodConfidence * moodWeight

    // Factor in trajectory significance if available
    if (emotionalAnalysis.trajectory.significance > 0.7) {
      confidence += 0.1
    }

    // Bonus confidence for high-quality mood factors
    const highQualityFactors = emotionalAnalysis.moodScoring.factors.filter(
      (factor) => factor.weight > 0.3 && factor.evidence.length >= 2,
    )
    if (highQualityFactors.length > 0) {
      confidence += 0.05
    }

    return Math.min(1, confidence)
  }

  private checkAnniversaryDate(memoryDate: Date, currentDate: Date): boolean {
    return (
      memoryDate.getMonth() === currentDate.getMonth() &&
      memoryDate.getDate() === currentDate.getDate() &&
      memoryDate.getFullYear() !== currentDate.getFullYear()
    )
  }

  private checkSpecialDate(date: Date): boolean {
    const month = date.getMonth()
    const day = date.getDate()

    return this.specialDates.some(
      (special) => special.month === month && special.day === day,
    )
  }
}
