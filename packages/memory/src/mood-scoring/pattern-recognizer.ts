import { createLogger } from '@studio/logger'

import type {
  EmotionalPattern,
  EmotionalTrajectory,
  MoodAnalysisResult,
  ConversationData,
} from '../types'

const logger = createLogger({
  tags: ['mood-scoring', 'pattern-recognizer'],
})

// Pattern template interface
interface PatternTemplate {
  description: string
  keywords: string[]
  behavioralIndicators: string[]
  moodCriteria?: {
    min?: number
    max?: number
  }
  typicalDescriptors: string[]
}

/**
 * Pattern recognition configuration
 */
export interface PatternRecognizerConfig {
  /** Minimum confidence to report a pattern */
  minimumConfidence: number
  /** Minimum evidence pieces to confirm a pattern */
  minimumEvidence: number
  /** Custom pattern templates */
  patternTemplates?: Map<EmotionalPattern['type'], PatternTemplate>
}

/**
 * PatternRecognizer identifies emotional patterns in conversations and trajectories
 */
export class PatternRecognizer {
  private readonly config: PatternRecognizerConfig
  private readonly patternTemplates: Map<
    EmotionalPattern['type'],
    PatternTemplate
  >

  constructor(config?: Partial<PatternRecognizerConfig>) {
    this.config = {
      minimumConfidence: 0.6,
      minimumEvidence: 2,
      ...config,
    }

    this.patternTemplates =
      config?.patternTemplates ?? this.initializePatternTemplates()
  }

  /**
   * Recognize emotional patterns in a conversation
   */
  async recognizePatterns(
    conversation: ConversationData,
    moodAnalysis: MoodAnalysisResult,
  ): Promise<EmotionalPattern[]> {
    logger.debug('Recognizing emotional patterns', {
      conversationId: conversation.id,
      moodScore: moodAnalysis.score,
    })

    const patterns: EmotionalPattern[] = []

    // Check each pattern template
    for (const [type, template] of this.patternTemplates) {
      const pattern = await this.evaluatePattern(
        type,
        template,
        conversation,
        moodAnalysis,
      )

      if (pattern && pattern.confidence >= this.config.minimumConfidence) {
        patterns.push(pattern)
      }
    }

    // Sort by significance
    patterns.sort((a, b) => b.significance - a.significance)

    logger.info('Pattern recognition complete', {
      conversationId: conversation.id,
      patternsFound: patterns.length,
      types: patterns.map((p) => p.type),
    })

    return patterns
  }

  /**
   * Identify patterns in emotional trajectory
   */
  identifyTrajectoryPatterns(
    trajectory: EmotionalTrajectory,
  ): EmotionalPattern[] {
    const patterns: EmotionalPattern[] = []

    // Check for growth pattern
    const growthPattern = this.checkGrowthPattern(trajectory)
    if (growthPattern) patterns.push(growthPattern)

    // Check for vulnerability pattern
    const vulnerabilityPattern = this.checkVulnerabilityPattern(trajectory)
    if (vulnerabilityPattern) patterns.push(vulnerabilityPattern)

    // Check for mood repair pattern
    const repairPattern = this.checkMoodRepairPattern(trajectory)
    if (repairPattern) patterns.push(repairPattern)

    return patterns.filter((p) => p.confidence >= this.config.minimumConfidence)
  }

  /**
   * Calculate pattern strength based on evidence
   */
  calculatePatternStrength(pattern: EmotionalPattern): number {
    const evidenceScore = Math.min(pattern.evidence.length / 5, 1)
    const confidenceScore = pattern.confidence
    const significanceScore = pattern.significance

    return evidenceScore * 0.3 + confidenceScore * 0.4 + significanceScore * 0.3
  }

  /**
   * Merge related patterns
   */
  mergeRelatedPatterns(patterns: EmotionalPattern[]): EmotionalPattern[] {
    if (patterns.length <= 1) return patterns

    const merged: EmotionalPattern[] = []
    const used = new Set<number>()

    for (let i = 0; i < patterns.length; i++) {
      if (used.has(i)) continue

      const current = patterns[i]
      const related: EmotionalPattern[] = [current]

      for (let j = i + 1; j < patterns.length; j++) {
        if (used.has(j)) continue

        if (this.arePatternsRelated(current, patterns[j])) {
          related.push(patterns[j])
          used.add(j)
        }
      }

      if (related.length > 1) {
        merged.push(this.mergePatterns(related))
      } else {
        merged.push(current)
      }
    }

    return merged
  }

  // Private helper methods

  private async evaluatePattern(
    type: EmotionalPattern['type'],
    template: PatternTemplate,
    conversation: ConversationData,
    moodAnalysis: MoodAnalysisResult,
  ): Promise<EmotionalPattern | null> {
    const evidence: string[] = []
    let confidence = 0

    // Check mood score criteria
    if (template.moodCriteria) {
      const moodMatch = this.evaluateMoodCriteria(
        moodAnalysis.score,
        template.moodCriteria,
      )
      if (moodMatch) {
        confidence += 0.3
        evidence.push(
          `Mood score ${moodAnalysis.score} matches ${type} pattern`,
        )
      }
    }

    // Check for keywords
    if (template.keywords.length > 0) {
      const keywordMatches = this.findKeywordMatches(
        conversation,
        template.keywords,
      )
      if (keywordMatches.length > 0) {
        confidence += Math.min(keywordMatches.length * 0.1, 0.3)
        evidence.push(...keywordMatches.slice(0, 3))
      }
    }

    // Check for behavioral indicators
    if (template.behavioralIndicators.length > 0) {
      const indicators = this.checkBehavioralIndicators(
        conversation,
        template.behavioralIndicators,
      )
      if (indicators.length > 0) {
        confidence += Math.min(indicators.length * 0.15, 0.4)
        evidence.push(...indicators)
      }
    }

    // Check descriptor matches
    const descriptorMatch = this.checkDescriptorMatch(
      moodAnalysis.descriptors,
      template.typicalDescriptors,
    )
    if (descriptorMatch > 0.5) {
      confidence += descriptorMatch * 0.2
      evidence.push(`Emotional descriptors align with ${type} pattern`)
    }

    if (evidence.length < this.config.minimumEvidence) {
      return null
    }

    const significance = this.calculateSignificance(
      type,
      confidence,
      evidence.length,
    )

    return {
      type,
      confidence: Math.min(1, confidence),
      description: template.description,
      evidence,
      significance,
    }
  }

  private checkGrowthPattern(
    trajectory: EmotionalTrajectory,
  ): EmotionalPattern | null {
    if (trajectory.direction !== 'improving') return null

    const evidence: string[] = []
    let confidence = 0.5

    // Check for consistent improvement
    const points = trajectory.points
    if (points.length >= 3) {
      const improvements = this.countImprovements(points)
      if (improvements > points.length * 0.6) {
        confidence += 0.3
        evidence.push('Consistent mood improvement over time')
      }
    }

    // Check for breakthrough moments
    const breakthroughs = trajectory.turningPoints.filter(
      (tp) => tp.type === 'breakthrough',
    )
    if (breakthroughs.length > 0) {
      confidence += 0.2
      evidence.push(`${breakthroughs.length} breakthrough moment(s) identified`)
    }

    if (evidence.length < this.config.minimumEvidence) {
      return null
    }

    return {
      type: 'growth',
      confidence,
      description: 'Pattern of emotional growth and positive development',
      evidence,
      significance: trajectory.significance,
    }
  }

  private checkVulnerabilityPattern(
    trajectory: EmotionalTrajectory,
  ): EmotionalPattern | null {
    const evidence: string[] = []
    let confidence = 0.4

    // Check for emotional volatility
    if (trajectory.direction === 'volatile') {
      confidence += 0.2
      evidence.push('Emotional volatility indicates vulnerability')
    }

    // Check for low mood periods
    const lowMoodPoints = trajectory.points.filter((p) => p.moodScore < 4)
    if (lowMoodPoints.length > trajectory.points.length * 0.3) {
      confidence += 0.3
      evidence.push('Extended periods of low mood')
    }

    // Check for support-seeking in context
    const supportContexts = trajectory.points.filter(
      (p) =>
        p.context?.toLowerCase().includes('support') ||
        p.context?.toLowerCase().includes('help'),
    )
    if (supportContexts.length > 0) {
      confidence += 0.2
      evidence.push('Context indicates support-seeking behavior')
    }

    if (evidence.length < this.config.minimumEvidence) {
      return null
    }

    return {
      type: 'vulnerability',
      confidence: Math.min(1, confidence),
      description: 'Pattern of emotional vulnerability and openness',
      evidence,
      significance: 0.8,
    }
  }

  private checkMoodRepairPattern(
    trajectory: EmotionalTrajectory,
  ): EmotionalPattern | null {
    const evidence: string[] = []
    let confidence = 0.3

    // Look for recovery from low points
    const turningPoints = trajectory.turningPoints
    const repairPoints = turningPoints.filter(
      (tp) =>
        tp.type === 'support_received' ||
        (tp.type === 'breakthrough' && tp.magnitude > 2),
    )

    if (repairPoints.length > 0) {
      confidence += 0.4
      evidence.push(`${repairPoints.length} mood repair moment(s) detected`)
    }

    // Check for improvement after low periods
    const points = trajectory.points
    for (let i = 1; i < points.length; i++) {
      if (points[i - 1].moodScore < 4 && points[i].moodScore > 6) {
        confidence += 0.2
        evidence.push('Significant mood improvement after low period')
        break
      }
    }

    // Check for positive coping indicators
    const positiveShifts = this.countPositiveShifts(points)
    if (positiveShifts > points.length * 0.4) {
      confidence += 0.1
      evidence.push('Multiple positive mood shifts indicate active coping')
    }

    if (evidence.length < this.config.minimumEvidence) {
      return null
    }

    return {
      type: 'mood_repair',
      confidence: Math.min(1, confidence),
      description: 'Pattern of emotional recovery and mood repair',
      evidence,
      significance: 0.9,
    }
  }

  private evaluateMoodCriteria(
    score: number,
    criteria: { min?: number; max?: number },
  ): boolean {
    if (criteria.min !== undefined && score < criteria.min) return false
    if (criteria.max !== undefined && score > criteria.max) return false
    return true
  }

  private findKeywordMatches(
    conversation: ConversationData,
    keywords: string[],
  ): string[] {
    const matches: string[] = []
    const content = conversation.messages
      .map((m) => m.content.toLowerCase())
      .join(' ')

    for (const keyword of keywords) {
      if (content.includes(keyword.toLowerCase())) {
        matches.push(`Keyword "${keyword}" found in conversation`)
      }
    }

    return matches
  }

  private checkBehavioralIndicators(
    conversation: ConversationData,
    indicators: string[],
  ): string[] {
    const found: string[] = []

    for (const indicator of indicators) {
      switch (indicator) {
        case 'extended_conversation':
          if (conversation.messages.length > 10) {
            found.push('Extended conversation indicates deep engagement')
          }
          break

        case 'emotional_disclosure':
          const emotionalWords = [
            'feel',
            'felt',
            'feeling',
            'emotion',
            'afraid',
            'scared',
            'happy',
            'sad',
          ]
          const hasEmotionalDisclosure = conversation.messages.some((m) =>
            emotionalWords.some((w) => m.content.toLowerCase().includes(w)),
          )
          if (hasEmotionalDisclosure) {
            found.push('Emotional disclosure detected')
          }
          break

        case 'support_exchange':
          const supportWords = [
            'thank',
            'help',
            'support',
            'there for',
            'appreciate',
          ]
          const hasSupportExchange = conversation.messages.some((m) =>
            supportWords.some((w) => m.content.toLowerCase().includes(w)),
          )
          if (hasSupportExchange) {
            found.push('Support exchange identified')
          }
          break

        case 'celebration_sharing':
          const celebrationWords = [
            'congratulations',
            'proud',
            'achievement',
            'success',
            'excited',
          ]
          const hasCelebration = conversation.messages.some((m) =>
            celebrationWords.some((w) => m.content.toLowerCase().includes(w)),
          )
          if (hasCelebration) {
            found.push('Celebration sharing detected')
          }
          break
      }
    }

    return found
  }

  private checkDescriptorMatch(actual: string[], expected: string[]): number {
    if (expected.length === 0) return 0

    const matches = actual.filter((d) => expected.includes(d))
    return matches.length / expected.length
  }

  private calculateSignificance(
    type: EmotionalPattern['type'],
    confidence: number,
    evidenceCount: number,
  ): number {
    // Base significance on pattern type
    const typeSignificance: Record<EmotionalPattern['type'], number> = {
      support_seeking: 0.8,
      mood_repair: 0.9,
      celebration: 0.7,
      vulnerability: 0.8,
      growth: 0.85,
    }

    const base = typeSignificance[type] || 0.5
    const evidenceFactor = Math.min(evidenceCount / 5, 1)

    return base * confidence * (0.7 + evidenceFactor * 0.3)
  }

  private arePatternsRelated(
    p1: EmotionalPattern,
    p2: EmotionalPattern,
  ): boolean {
    // Patterns are related if they share evidence or are complementary types
    const sharedEvidence = p1.evidence.some((e) => p2.evidence.includes(e))

    const complementaryTypes: Array<
      [EmotionalPattern['type'], EmotionalPattern['type']]
    > = [
      ['vulnerability', 'support_seeking'],
      ['support_seeking', 'mood_repair'],
      ['growth', 'celebration'],
    ]

    const areComplementary = complementaryTypes.some(
      ([t1, t2]) =>
        (p1.type === t1 && p2.type === t2) ||
        (p1.type === t2 && p2.type === t1),
    )

    return sharedEvidence || areComplementary
  }

  private mergePatterns(patterns: EmotionalPattern[]): EmotionalPattern {
    // Use the most significant pattern as base
    const base = patterns.reduce((a, b) =>
      a.significance > b.significance ? a : b,
    )

    // Merge evidence
    const allEvidence = new Set<string>()
    for (const pattern of patterns) {
      pattern.evidence.forEach((e) => allEvidence.add(e))
    }

    // Average confidence
    const avgConfidence =
      patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length

    // Max significance
    const maxSignificance = Math.max(...patterns.map((p) => p.significance))

    return {
      ...base,
      confidence: avgConfidence,
      significance: maxSignificance,
      evidence: Array.from(allEvidence),
      description: `Combined pattern: ${patterns.map((p) => p.type).join(' and ')}`,
    }
  }

  private countImprovements(points: EmotionalTrajectory['points']): number {
    let improvements = 0
    for (let i = 1; i < points.length; i++) {
      if (points[i].moodScore > points[i - 1].moodScore) {
        improvements++
      }
    }
    return improvements
  }

  private countPositiveShifts(points: EmotionalTrajectory['points']): number {
    let shifts = 0
    for (let i = 1; i < points.length; i++) {
      if (points[i].moodScore - points[i - 1].moodScore > 1) {
        shifts++
      }
    }
    return shifts
  }

  private initializePatternTemplates(): Map<
    EmotionalPattern['type'],
    PatternTemplate
  > {
    const templates = new Map<EmotionalPattern['type'], PatternTemplate>()

    templates.set('support_seeking', {
      description: 'Seeking emotional support or guidance',
      keywords: [
        'help',
        'advice',
        'struggling',
        'difficult',
        'hard time',
        'need',
        'support',
      ],
      behavioralIndicators: ['extended_conversation', 'emotional_disclosure'],
      moodCriteria: { max: 5 },
      typicalDescriptors: ['concerned', 'unsettled', 'vulnerable'],
    })

    templates.set('mood_repair', {
      description: 'Active emotional recovery and coping',
      keywords: [
        'better',
        'improving',
        'helped',
        'grateful',
        'relief',
        'progress',
      ],
      behavioralIndicators: ['support_exchange', 'emotional_disclosure'],
      moodCriteria: { min: 4 },
      typicalDescriptors: ['recovering', 'hopeful', 'supported'],
    })

    templates.set('celebration', {
      description: 'Sharing positive experiences or achievements',
      keywords: [
        'excited',
        'happy',
        'achieved',
        'success',
        'wonderful',
        'great news',
      ],
      behavioralIndicators: ['celebration_sharing'],
      moodCriteria: { min: 7 },
      typicalDescriptors: ['joyful', 'excited', 'positive'],
    })

    templates.set('vulnerability', {
      description: 'Expressing emotional vulnerability or openness',
      keywords: [
        'scared',
        'worried',
        'anxious',
        'vulnerable',
        'honest',
        'admit',
      ],
      behavioralIndicators: ['emotional_disclosure', 'extended_conversation'],
      moodCriteria: {},
      typicalDescriptors: ['open', 'vulnerable', 'honest'],
    })

    templates.set('growth', {
      description: 'Personal growth and emotional development',
      keywords: [
        'learned',
        'realized',
        'understand',
        'growth',
        'change',
        'better',
      ],
      behavioralIndicators: ['extended_conversation'],
      moodCriteria: { min: 5 },
      typicalDescriptors: ['reflective', 'growing', 'insightful'],
    })

    return templates
  }
}
