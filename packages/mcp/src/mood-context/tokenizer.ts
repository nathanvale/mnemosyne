import type { ExtractedMemory } from '@studio/memory'

import { logger } from '@studio/logger'

import type { MoodContextTokens, MoodContextConfig } from '../types/index'

/**
 * MoodContextTokenizer generates mood context tokens for agent consumption
 */
export class MoodContextTokenizer {
  private readonly config: MoodContextConfig

  constructor(config: Partial<MoodContextConfig> = {}) {
    this.config = {
      complexityLevel: 'standard',
      includeTrajectory: true,
      maxDescriptors: 5,
      ...config,
    }
  }

  /**
   * Generate mood context tokens from extracted memories
   */
  async generateMoodContext(
    memories: ExtractedMemory[],
  ): Promise<MoodContextTokens> {
    logger.info('Generating mood context from memories', {
      memoryCount: memories.length,
    })

    if (memories.length === 0) {
      return this.getEmptyMoodContext()
    }

    const sortedMemories = this.sortMemoriesByRecency(memories)

    const currentMood = await this.calculateCurrentMood(sortedMemories)
    const moodTrend = await this.analyzeMoodTrend(sortedMemories)
    const recentMoodTags = await this.extractRecentMoodTags(sortedMemories)
    const trajectoryOverview =
      await this.generateTrajectoryOverview(sortedMemories)

    const moodContext: MoodContextTokens = {
      currentMood,
      moodTrend,
      recentMoodTags,
      trajectoryOverview,
    }

    logger.debug('Generated mood context', { moodContext })
    return moodContext
  }

  /**
   * Calculate current mood from recent memories
   */
  private async calculateCurrentMood(memories: ExtractedMemory[]) {
    const recentMemories = memories.slice(0, 5)

    if (recentMemories.length === 0) {
      return {
        score: 5,
        descriptors: ['neutral'],
        confidence: 0.1,
      }
    }

    const moodScores = recentMemories.map(
      (memory) => memory.emotionalAnalysis.moodScoring.score,
    )

    const averageScore =
      moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length

    const descriptors = this.extractMoodDescriptors(recentMemories)
    const confidence = this.calculateMoodConfidence(recentMemories)

    return {
      score: Math.round(averageScore * 10) / 10,
      descriptors: descriptors.slice(0, this.config.maxDescriptors),
      confidence: Math.round(confidence * 100) / 100,
    }
  }

  /**
   * Analyze mood trend direction and magnitude
   */
  private async analyzeMoodTrend(memories: ExtractedMemory[]) {
    if (memories.length < 2) {
      return {
        direction: 'stable' as const,
        magnitude: 0,
        duration: 'insufficient_data',
      }
    }

    const half = Math.floor(memories.length / 2)
    const recentScores = memories
      .slice(0, half)
      .map((m) => m.emotionalAnalysis.moodScoring.score)
    const olderScores = memories
      .slice(half)
      .map((m) => m.emotionalAnalysis.moodScoring.score)

    const recentAverage =
      recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length
    const olderAverage =
      olderScores.length > 0
        ? olderScores.reduce((sum, score) => sum + score, 0) /
          olderScores.length
        : recentAverage

    const difference = recentAverage - olderAverage
    const magnitude = Math.abs(difference)

    let direction: 'improving' | 'declining' | 'stable' | 'volatile'

    const allScores = memories.map((m) => m.emotionalAnalysis.moodScoring.score)

    if (this.isVolatile(allScores)) {
      direction = 'volatile'
    } else if (magnitude < 0.5) {
      direction = 'stable'
    } else if (difference > 0) {
      direction = 'improving'
    } else {
      direction = 'declining'
    }

    const timespan = this.calculateTimespan(memories)

    return {
      direction,
      magnitude: Math.round(magnitude * 100) / 100,
      duration: timespan,
    }
  }

  /**
   * Extract recent mood tags from memory descriptors
   */
  private async extractRecentMoodTags(
    memories: ExtractedMemory[],
  ): Promise<string[]> {
    const recentMemories = memories.slice(0, 10)
    const tagSet = new Set<string>()

    for (const memory of recentMemories) {
      const descriptors = memory.emotionalAnalysis.moodScoring.descriptors
      descriptors.forEach((descriptor) => tagSet.add(descriptor))

      const themes =
        memory.emotionalAnalysis.context.themes?.map((t) => t.toLowerCase()) ||
        []
      themes.forEach((theme) => tagSet.add(theme))
    }

    return Array.from(tagSet).slice(0, 8)
  }

  /**
   * Generate trajectory overview narrative
   */
  private async generateTrajectoryOverview(
    memories: ExtractedMemory[],
  ): Promise<string> {
    if (memories.length === 0) {
      return 'No emotional trajectory data available.'
    }

    if (memories.length < 3) {
      return 'Insufficient data for trajectory analysis. Early emotional state tracking.'
    }

    const recentMemories = memories.slice(0, 5)
    const recentAverage =
      recentMemories.reduce(
        (sum, m) => sum + m.emotionalAnalysis.moodScoring.score,
        0,
      ) / recentMemories.length

    const allAverage =
      memories.reduce(
        (sum, m) => sum + m.emotionalAnalysis.moodScoring.score,
        0,
      ) / memories.length

    const keyPatterns = this.identifyEmotionalPatterns(memories)

    let overview = ''

    if (recentAverage > allAverage + 0.5) {
      overview = 'Recent emotional trajectory shows improvement. '
    } else if (recentAverage < allAverage - 0.5) {
      overview = 'Recent emotional trajectory shows some decline. '
    } else {
      overview = 'Emotional trajectory remains relatively stable. '
    }

    if (keyPatterns.length > 0) {
      overview += `Key patterns: ${keyPatterns.slice(0, 3).join(', ')}.`
    } else {
      overview += 'No distinct emotional patterns identified in recent history.'
    }

    return overview
  }

  /**
   * Extract mood descriptors from memories
   */
  private extractMoodDescriptors(memories: ExtractedMemory[]): string[] {
    const descriptorCounts = new Map<string, number>()

    for (const memory of memories) {
      const descriptors = memory.emotionalAnalysis.moodScoring.descriptors
      for (const descriptor of descriptors) {
        descriptorCounts.set(
          descriptor,
          (descriptorCounts.get(descriptor) || 0) + 1,
        )
      }
    }

    return Array.from(descriptorCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([descriptor]) => descriptor)
  }

  /**
   * Calculate confidence in mood assessment
   */
  private calculateMoodConfidence(memories: ExtractedMemory[]): number {
    if (memories.length === 0) return 0

    const confidenceScores = memories.map(
      (m) => m.emotionalAnalysis.moodScoring.confidence,
    )
    const averageConfidence =
      confidenceScores.reduce((sum, conf) => sum + conf, 0) /
      confidenceScores.length

    const memoryCountFactor = Math.min(memories.length / 5, 1)
    const recentnessFactor = this.calculateRecentnessFactor(memories)

    return averageConfidence * memoryCountFactor * recentnessFactor
  }

  /**
   * Check if mood scores show volatility
   */
  private isVolatile(scores: number[]): boolean {
    if (scores.length < 3) return false

    let swings = 0
    for (let i = 1; i < scores.length - 1; i++) {
      const prev = scores[i - 1]
      const curr = scores[i]
      const next = scores[i + 1]

      if ((curr > prev && curr > next) || (curr < prev && curr < next)) {
        if (Math.abs(curr - prev) > 1 || Math.abs(curr - next) > 1) {
          swings++
        }
      }
    }

    return swings >= Math.floor(scores.length / 3)
  }

  /**
   * Calculate timespan string for trend duration
   */
  private calculateTimespan(memories: ExtractedMemory[]): string {
    if (memories.length < 2) return 'single_point'

    const newest = memories[0].processing.extractedAt
    const oldest = memories[memories.length - 1].processing.extractedAt

    const diffMs = newest.getTime() - oldest.getTime()
    const diffDays = diffMs / (1000 * 60 * 60 * 24)

    if (diffDays < 1) return 'hours'
    if (diffDays < 7) return `${Math.ceil(diffDays)}d`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}w`
    return `${Math.ceil(diffDays / 30)}mo`
  }

  /**
   * Identify emotional patterns in memories
   */
  private identifyEmotionalPatterns(memories: ExtractedMemory[]): string[] {
    const patternTypes = memories.flatMap((m) =>
      m.emotionalAnalysis.patterns.map((p) => p.type),
    )

    const patternCounts = new Map<string, number>()
    patternTypes.forEach((type) => {
      patternCounts.set(type, (patternCounts.get(type) || 0) + 1)
    })

    const significantPatterns = Array.from(patternCounts.entries())
      .filter(([, count]) => count >= 2)
      .sort(([, a], [, b]) => b - a)
      .map(([pattern]) => pattern)

    return significantPatterns
  }

  /**
   * Calculate recency factor for confidence
   */
  private calculateRecentnessFactor(memories: ExtractedMemory[]): number {
    if (memories.length === 0) return 0

    const now = new Date()
    const recentMemories = memories.filter((m) => {
      const daysDiff =
        (now.getTime() - m.processing.extractedAt.getTime()) /
        (1000 * 60 * 60 * 24)
      return daysDiff <= 7
    })

    return Math.min(recentMemories.length / Math.min(memories.length, 5), 1)
  }

  /**
   * Sort memories by recency (most recent first)
   */
  private sortMemoriesByRecency(
    memories: ExtractedMemory[],
  ): ExtractedMemory[] {
    return [...memories].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
  }

  /**
   * Get empty mood context for no data scenarios
   */
  private getEmptyMoodContext(): MoodContextTokens {
    return {
      currentMood: {
        score: 5,
        descriptors: ['neutral'],
        confidence: 0,
      },
      moodTrend: {
        direction: 'stable',
        magnitude: 0,
        duration: 'no_data',
      },
      recentMoodTags: [],
      trajectoryOverview: 'No emotional history available for analysis.',
    }
  }
}
