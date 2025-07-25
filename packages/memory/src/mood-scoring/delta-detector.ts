// import { createLogger } from '@studio/logger'

import type {
  MoodAnalysisResult,
  MoodDelta,
  EmotionalTrajectory,
  TrajectoryPoint,
  TurningPoint,
} from '../types'

// const logger = createLogger({
//   tags: ['mood-scoring', 'delta-detector'],
// })

/**
 * Configuration for delta detection
 */
export interface DeltaDetectorConfig {
  /** Minimum magnitude to consider a delta significant */
  minimumMagnitude: number
  /** Time window for comparing mood states (in milliseconds) */
  timeWindow: number
  /** Confidence threshold for delta detection */
  confidenceThreshold: number
  /** Magnitude threshold for triggering on celebrations */
  celebrationThreshold?: number
  /** Magnitude threshold for triggering on declines */
  declineThreshold?: number
  /** General magnitude multiplier for triggering */
  generalTriggerMultiplier?: number
  /** Variance threshold for plateau detection */
  plateauVarianceThreshold?: number
  /** Time threshold for merging turning points (in milliseconds) */
  turningPointMergeThreshold?: number
}

/**
 * DeltaDetector identifies mood changes and determines when to trigger memory extraction
 */
export class DeltaDetector {
  private readonly config: DeltaDetectorConfig

  constructor(config?: Partial<DeltaDetectorConfig>) {
    this.config = {
      minimumMagnitude: 2.0,
      timeWindow: 3600000, // 1 hour
      confidenceThreshold: 0.7,
      celebrationThreshold: 3.0,
      declineThreshold: 2.5,
      generalTriggerMultiplier: 1.5,
      plateauVarianceThreshold: 0.5,
      turningPointMergeThreshold: 1800000, // 30 minutes
      ...config,
    }
  }

  // TDD: Start with empty methods that will be implemented based on failing tests

  detectConversationalDeltas(
    conversationAnalyses: MoodAnalysisResult[],
  ): MoodDelta[] {
    // TDD: Minimal implementation to make first test pass
    const deltas: MoodDelta[] = []

    if (conversationAnalyses.length < 2) {
      return deltas
    }

    // Process pairs of analyses to detect deltas
    for (let i = 1; i < conversationAnalyses.length; i++) {
      const current = conversationAnalyses[i]
      const previous = conversationAnalyses[i - 1]

      const delta = this.detectMoodDelta(current, previous)
      if (delta && delta.magnitude >= 1.5) {
        // Enhance with conversational context
        const enhancedDelta = this.enhanceConversationalContext(
          delta,
          i,
          conversationAnalyses.length,
        )
        deltas.push(enhancedDelta)
      }
    }

    return deltas
  }

  detectMoodDelta(
    current: MoodAnalysisResult,
    previous: MoodAnalysisResult,
  ): MoodDelta | undefined {
    // TDD: Minimal implementation to make first test pass
    const magnitude = Math.abs(current.score - previous.score)

    if (magnitude < 1.5) {
      return undefined
    }

    // Basic factor analysis for tests
    const factors: string[] = []

    // Check for new emotional expressions
    const newDescriptors = current.descriptors.filter(
      (d) => !previous.descriptors.includes(d),
    )
    if (newDescriptors.length > 0) {
      factors.push(`New emotional expressions: ${newDescriptors.join(', ')}`)
    }

    // Check for shift in dominant factors
    const currentDominant = this.getDominantFactor(current.factors)
    const previousDominant = this.getDominantFactor(previous.factors)
    if (currentDominant.type !== previousDominant.type) {
      factors.push(
        `Shift from ${previousDominant.type} to ${currentDominant.type}`,
      )
    }

    // Check for increased emotional expressiveness
    const currentEvidence = current.factors.reduce(
      (sum, f) => sum + f.evidence.length,
      0,
    )
    const previousEvidence = previous.factors.reduce(
      (sum, f) => sum + f.evidence.length,
      0,
    )
    if (currentEvidence > previousEvidence * 1.5) {
      factors.push('Increased emotional expressiveness')
    }

    // Determine direction and basic type
    const direction = current.score > previous.score ? 'positive' : 'negative'
    let type: MoodDelta['type'] = 'plateau'

    // Mood repair: positive direction with low previous score becoming good
    if (direction === 'positive' && magnitude >= 2.0) {
      // Classic mood repair: low to good recovery
      if (previous.score < 4 && current.score > 6) {
        type = 'mood_repair'
      }
      // Moderate mood repair: distressed to supported
      else if (
        previous.score < 4.5 &&
        current.score > 5.5 &&
        magnitude >= 2.5
      ) {
        type = 'mood_repair'
      }
      // Processing-based repair: check for healing descriptors
      else if (
        previous.score < 3.5 &&
        current.descriptors.some((d) =>
          [
            'processing',
            'understood',
            'accepted',
            'comforted',
            'healing',
          ].includes(d),
        )
      ) {
        type = 'mood_repair'
      }
      // High positive celebration
      else if (previous.score > 6 && current.score > 7) {
        type = 'celebration'
      }
    } else if (direction === 'negative' && magnitude >= 2) {
      type = 'decline'
    }

    // Calculate dynamic confidence based on type and evidence
    let confidence = 0.8 // Base confidence

    // Boost confidence for mood repairs with strong evidence
    if (type === 'mood_repair') {
      if (magnitude >= 3.5) confidence += 0.1 // Strong magnitude boost
      if (current.confidence > 0.9) confidence += 0.05 // High input confidence boost
      if (factors.length >= 2) confidence += 0.05 // Multiple factors boost
    }

    // Boost confidence for celebrations with strong positive indicators
    if (type === 'celebration') {
      if (current.score > 8.0) confidence += 0.05 // Very high mood boost
      if (magnitude >= 3.0) confidence += 0.05 // Strong change boost
    }

    // Cap confidence at 1.0
    confidence = Math.min(1.0, confidence)

    return {
      magnitude,
      direction,
      type,
      confidence,
      factors: factors.length > 0 ? factors : ['Basic delta detected'],
    }
  }

  identifyTurningPoints(trajectory: EmotionalTrajectory): TurningPoint[] {
    // TDD: Minimal implementation for turning points
    const points = trajectory.points
    if (points.length < 3) {
      return []
    }

    const turningPoints: TurningPoint[] = []

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const next = points[i + 1]

      const prevDiff = curr.moodScore - prev.moodScore
      const nextDiff = next.moodScore - curr.moodScore

      // Check for direction change
      if (prevDiff * nextDiff < 0) {
        const magnitude = Math.abs(prevDiff) + Math.abs(nextDiff)

        if (magnitude < 2) {
          continue // Too small to be significant
        }

        const type = this.identifyTurningPointType(prev, curr, next)
        const description = this.describeTurningPoint(type, curr)
        const factors = this.identifyTurningPointFactors(prev, curr, next)

        turningPoints.push({
          timestamp: curr.timestamp,
          type,
          magnitude,
          description,
          factors,
        })
      }
      // Also check for significant acceleration/deceleration in same direction
      else if (prevDiff !== 0 && nextDiff !== 0) {
        const acceleration = Math.abs(nextDiff / prevDiff - 1)
        const totalChange = Math.abs(prevDiff) + Math.abs(nextDiff)

        // Detect significant acceleration (2x change in rate) with substantial total change
        if (acceleration > 1.0 && totalChange > 2.0) {
          const magnitude = totalChange

          // Determine type based on trend direction and acceleration
          let type: TurningPoint['type']
          if (nextDiff > 0 && prevDiff > 0) {
            // Positive acceleration
            type = 'breakthrough'
          } else if (nextDiff < 0 && prevDiff < 0) {
            // Negative acceleration (decline getting worse)
            type = 'setback'
          } else {
            type = 'realization'
          }

          const description = this.describeTurningPoint(type, curr)
          const factors = this.identifyTurningPointFactors(prev, curr, next)

          turningPoints.push({
            timestamp: curr.timestamp,
            type,
            magnitude,
            description,
            factors,
          })
        }
      }
    }

    return turningPoints
  }

  calculateDeltaMagnitude(delta: MoodDelta): number {
    // TDD: Factor in both raw magnitude and confidence
    return delta.magnitude * delta.confidence
  }

  shouldTriggerExtraction(delta: MoodDelta): boolean {
    // TDD: Minimal implementation - trigger for mood repairs, celebrations, and declines
    if (delta.type === 'mood_repair') {
      return true
    }
    if (
      delta.type === 'celebration' &&
      delta.magnitude >= (this.config.celebrationThreshold ?? 3.0)
    ) {
      return true
    }
    if (
      delta.type === 'decline' &&
      delta.magnitude >= (this.config.declineThreshold ?? 2.5)
    ) {
      return true
    }
    return false
  }

  calculateMoodVelocity(points: TrajectoryPoint[]): number {
    // TDD: Minimal implementation for velocity calculation
    if (points.length < 2) {
      return 0
    }

    const first = points[0]
    const last = points[points.length - 1]
    const timeDiff = last.timestamp.getTime() - first.timestamp.getTime()

    if (timeDiff === 0) {
      return 0
    }

    const scoreDiff = last.moodScore - first.moodScore
    // Velocity in mood units per hour
    return (scoreDiff / timeDiff) * 3600000
  }

  detectEmotionalPlateau(points: TrajectoryPoint[]): {
    isPlateau: boolean
    duration: number
    averageScore: number
  } {
    // TDD: Minimal implementation for plateau detection
    if (points.length < 3) {
      return { isPlateau: false, duration: 0, averageScore: 0 }
    }

    const scores = points.map((p) => p.moodScore)
    const variance = this.calculateVariance(scores)
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length

    // Plateau if variance is low
    const isPlateau = variance < (this.config.plateauVarianceThreshold ?? 0.5)

    const duration = isPlateau
      ? points[points.length - 1].timestamp.getTime() -
        points[0].timestamp.getTime()
      : 0

    return { isPlateau, duration, averageScore }
  }

  detectSuddenTransitions(points: TrajectoryPoint[]): Array<{
    type: 'sudden' | 'gradual' | 'recovery' | 'decline'
    magnitude: number
    velocity: number
    timestamp: Date
    direction: 'positive' | 'negative'
  }> {
    // TDD: Minimal implementation for sudden transition detection
    if (points.length < 2) {
      return []
    }

    const transitions: Array<{
      type: 'sudden' | 'gradual' | 'recovery' | 'decline'
      magnitude: number
      velocity: number
      timestamp: Date
      direction: 'positive' | 'negative'
    }> = []

    for (let i = 1; i < points.length; i++) {
      const current = points[i]
      const previous = points[i - 1]

      const magnitude = Math.abs(current.moodScore - previous.moodScore)
      const timeDiff =
        current.timestamp.getTime() - previous.timestamp.getTime()
      const velocity =
        timeDiff > 0
          ? ((current.moodScore - previous.moodScore) / timeDiff) * 3600000
          : 0 // points per hour

      // Only process transitions above 2.0 point threshold
      if (magnitude >= 2.0) {
        const direction =
          current.moodScore > previous.moodScore ? 'positive' : 'negative'
        const type = this.classifyTransitionType(velocity, [previous, current])

        transitions.push({
          type,
          magnitude,
          velocity: Math.abs(velocity),
          timestamp: current.timestamp,
          direction,
        })
      }
    }

    return transitions
  }

  classifyTransitionType(
    velocity: number,
    points: TrajectoryPoint[],
  ): 'sudden' | 'gradual' | 'recovery' | 'decline' {
    // TDD: Minimal implementation for transition classification
    const absoluteVelocity = Math.abs(velocity)

    // Sudden threshold: 20+ points per hour
    const suddenThreshold = 20

    if (absoluteVelocity >= suddenThreshold) {
      return 'sudden'
    }

    // For slower changes, classify by pattern
    if (points.length >= 3) {
      const scores = points.map((p) => p.moodScore)
      const hasLowPoint = Math.min(...scores) < 4.0
      const hasRecovery = scores[scores.length - 1] > scores[0] + 2.0

      if (hasLowPoint && hasRecovery) {
        return 'recovery'
      }

      const hasHighPoint = Math.max(...scores) > 6.0
      const hasDecline = scores[scores.length - 1] < scores[0] - 2.0

      if (hasHighPoint && hasDecline) {
        return 'decline'
      }
    }

    return 'gradual'
  }

  // TDD: Helper method for conversational context enhancement
  private enhanceConversationalContext(
    delta: MoodDelta,
    position: number,
    totalAnalyses: number,
  ): MoodDelta {
    const enhancedFactors = [...delta.factors]

    // Add positional context
    if (position === 1) {
      enhancedFactors.push('Early conversation shift')
    } else if (position === totalAnalyses - 1) {
      enhancedFactors.push('Conversation conclusion shift')
    }

    // Boost confidence for conversational context
    const enhancedConfidence = Math.min(1.0, delta.confidence * 1.1)

    return {
      ...delta,
      confidence: enhancedConfidence,
      factors: enhancedFactors,
    }
  }

  // TDD: Helper method to get dominant factor
  private getDominantFactor(
    factors: MoodAnalysisResult['factors'],
  ): MoodAnalysisResult['factors'][0] {
    return factors.reduce((a, b) => (a.weight > b.weight ? a : b))
  }

  // TDD: Helper methods for turning point analysis
  private identifyTurningPointType(
    prev: TrajectoryPoint,
    curr: TrajectoryPoint,
    next: TrajectoryPoint,
  ): TurningPoint['type'] {
    const improving = next.moodScore > prev.moodScore

    // Breakthrough: significant positive turn after struggle
    if (improving && prev.moodScore < 4 && next.moodScore > 6) {
      return 'breakthrough'
    }

    // Setback: significant negative turn
    if (!improving && prev.moodScore > 6 && next.moodScore < 4) {
      return 'setback'
    }

    // Support received: moderate improvement with support context
    if (improving && curr.context?.includes('support')) {
      return 'support_received'
    }

    // Default to realization
    return 'realization'
  }

  private describeTurningPoint(
    type: TurningPoint['type'],
    point: TrajectoryPoint,
  ): string {
    const templates: Record<TurningPoint['type'], string> = {
      breakthrough: `Emotional breakthrough with mood improving to ${point.moodScore}`,
      setback: `Emotional setback with mood declining to ${point.moodScore}`,
      realization: `Emotional shift at mood level ${point.moodScore}`,
      support_received: `Support received leading to mood improvement to ${point.moodScore}`,
    }

    return templates[type]
  }

  private identifyTurningPointFactors(
    prev: TrajectoryPoint,
    curr: TrajectoryPoint,
    next: TrajectoryPoint,
  ): string[] {
    const factors: string[] = []

    // Emotion changes
    const prevEmotions = new Set(prev.emotions || [])
    const nextEmotions = new Set(next.emotions || [])
    const newEmotions = [...nextEmotions].filter((e) => !prevEmotions.has(e))

    if (newEmotions.length > 0) {
      factors.push(`New emotions: ${newEmotions.join(', ')}`)
    }

    // Context changes
    if (curr.context && curr.context !== prev.context) {
      factors.push(`Context shift: ${curr.context}`)
    }

    // Magnitude of change
    const totalChange = Math.abs(next.moodScore - prev.moodScore)
    factors.push(`Total mood change: ${totalChange.toFixed(1)} points`)

    return factors
  }

  // TDD: Helper method to calculate variance
  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
    return (
      numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) /
      numbers.length
    )
  }
}
