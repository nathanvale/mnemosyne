import { createLogger } from '@studio/logger'

import type {
  MoodAnalysisResult,
  MoodDelta,
  EmotionalTrajectory,
  TrajectoryPoint,
  TurningPoint,
} from '../types'

const logger = createLogger({
  tags: ['mood-scoring', 'delta-detector'],
})

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
      ...config,
    }
  }

  /**
   * Detect mood delta between current and previous analysis
   */
  detectMoodDelta(
    current: MoodAnalysisResult,
    previous: MoodAnalysisResult,
    timeElapsed: number,
  ): MoodDelta | undefined {
    logger.debug('Detecting mood delta', {
      currentScore: current.score,
      previousScore: previous.score,
      timeElapsed,
    })

    const magnitude = Math.abs(current.score - previous.score)

    // Check if delta is significant enough
    if (magnitude < this.config.minimumMagnitude) {
      return undefined
    }

    // Determine direction
    const direction = this.determineDirection(current.score, previous.score)

    // Identify delta type
    const type = this.identifyDeltaType(current, previous, direction)

    // Calculate confidence
    const confidence = this.calculateDeltaConfidence(
      current,
      previous,
      timeElapsed,
    )

    // Identify contributing factors
    const factors = this.identifyContributingFactors(current, previous)

    const delta: MoodDelta = {
      magnitude,
      direction,
      type,
      confidence,
      factors,
    }

    logger.info('Mood delta detected', {
      magnitude,
      direction,
      type,
      confidence,
    })

    return delta
  }

  /**
   * Identify turning points in emotional trajectory
   */
  identifyTurningPoints(trajectory: EmotionalTrajectory): TurningPoint[] {
    const points = trajectory.points
    if (points.length < 3) {
      return []
    }

    const turningPoints: TurningPoint[] = []

    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const next = points[i + 1]

      const turningPoint = this.analyzeTurningPoint(prev, curr, next)
      if (turningPoint) {
        turningPoints.push(turningPoint)
      }
    }

    // Post-process to merge nearby turning points
    return this.mergeTurningPoints(turningPoints)
  }

  /**
   * Calculate the magnitude of a mood delta
   */
  calculateDeltaMagnitude(delta: MoodDelta): number {
    // Factor in both raw magnitude and confidence
    return delta.magnitude * delta.confidence
  }

  /**
   * Determine if a delta should trigger memory extraction
   */
  shouldTriggerExtraction(delta: MoodDelta): boolean {
    // Check confidence threshold
    if (delta.confidence < this.config.confidenceThreshold) {
      return false
    }

    // Always trigger for significant mood repairs and breakthroughs
    if (delta.type === 'mood_repair' && delta.direction === 'positive') {
      return true
    }

    // Trigger for significant celebrations
    if (delta.type === 'celebration' && delta.magnitude > 3) {
      return true
    }

    // Trigger for concerning declines
    if (delta.type === 'decline' && delta.magnitude > 2.5) {
      return true
    }

    // General magnitude-based trigger
    return delta.magnitude >= this.config.minimumMagnitude * 1.5
  }

  /**
   * Analyze mood velocity (rate of change)
   */
  calculateMoodVelocity(
    points: TrajectoryPoint[],
    timeWindow?: number,
  ): number {
    if (points.length < 2) {
      return 0
    }

    const window = timeWindow || this.config.timeWindow
    const recentPoints = this.filterPointsByTimeWindow(points, window)

    if (recentPoints.length < 2) {
      return 0
    }

    const first = recentPoints[0]
    const last = recentPoints[recentPoints.length - 1]
    const timeDiff = last.timestamp.getTime() - first.timestamp.getTime()

    if (timeDiff === 0) {
      return 0
    }

    const scoreDiff = last.moodScore - first.moodScore
    // Velocity in mood units per hour
    return (scoreDiff / timeDiff) * 3600000
  }

  /**
   * Detect emotional plateaus (stable periods)
   */
  detectEmotionalPlateau(points: TrajectoryPoint[]): {
    isPlateau: boolean
    duration: number
    averageScore: number
  } {
    if (points.length < 3) {
      return { isPlateau: false, duration: 0, averageScore: 0 }
    }

    const scores = points.map((p) => p.moodScore)
    const variance = this.calculateVariance(scores)
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length

    // Plateau if variance is low
    const isPlateau = variance < 0.5

    const duration = isPlateau
      ? points[points.length - 1].timestamp.getTime() -
        points[0].timestamp.getTime()
      : 0

    return { isPlateau, duration, averageScore }
  }

  // Private helper methods

  private determineDirection(
    current: number,
    previous: number,
  ): MoodDelta['direction'] {
    const diff = current - previous
    if (Math.abs(diff) < 0.5) return 'neutral'
    return diff > 0 ? 'positive' : 'negative'
  }

  private identifyDeltaType(
    current: MoodAnalysisResult,
    previous: MoodAnalysisResult,
    direction: MoodDelta['direction'],
  ): MoodDelta['type'] {
    // Mood repair: significant positive change from low state
    if (direction === 'positive' && previous.score < 4 && current.score > 6) {
      return 'mood_repair'
    }

    // Celebration: high positive state getting even higher
    if (direction === 'positive' && current.score > 7 && previous.score > 6) {
      return 'celebration'
    }

    // Decline: significant negative change
    if (direction === 'negative' && current.score < previous.score - 2) {
      return 'decline'
    }

    // Default to plateau for small changes
    return 'plateau'
  }

  private calculateDeltaConfidence(
    current: MoodAnalysisResult,
    previous: MoodAnalysisResult,
    timeElapsed: number,
  ): number {
    // Base confidence on individual analysis confidences
    const baseConfidence = (current.confidence + previous.confidence) / 2

    // Adjust for time elapsed (more recent = higher confidence)
    const recencyFactor = Math.max(0.5, 1 - timeElapsed / (7 * 24 * 3600000)) // 7 days

    // Adjust for descriptor consistency
    const descriptorOverlap = this.calculateDescriptorOverlap(
      current.descriptors,
      previous.descriptors,
    )
    const consistencyFactor = 1 - descriptorOverlap * 0.3 // Less overlap = bigger change

    return Math.min(1, baseConfidence * recencyFactor * consistencyFactor)
  }

  private identifyContributingFactors(
    current: MoodAnalysisResult,
    previous: MoodAnalysisResult,
  ): string[] {
    const factors: string[] = []

    // Compare dominant mood factors
    const currentDominant = this.getDominantFactor(current.factors)
    const previousDominant = this.getDominantFactor(previous.factors)

    if (currentDominant.type !== previousDominant.type) {
      factors.push(
        `Shift from ${previousDominant.type} to ${currentDominant.type}`,
      )
    }

    // Check for new emotional expressions
    const newDescriptors = current.descriptors.filter(
      (d) => !previous.descriptors.includes(d),
    )
    if (newDescriptors.length > 0) {
      factors.push(`New emotional expressions: ${newDescriptors.join(', ')}`)
    }

    // Check for significant evidence changes
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
    } else if (currentEvidence < previousEvidence * 0.5) {
      factors.push('Decreased emotional expressiveness')
    }

    return factors
  }

  private analyzeTurningPoint(
    prev: TrajectoryPoint,
    curr: TrajectoryPoint,
    next: TrajectoryPoint,
  ): TurningPoint | undefined {
    const prevDiff = curr.moodScore - prev.moodScore
    const nextDiff = next.moodScore - curr.moodScore

    // Check for direction change
    if (prevDiff * nextDiff < 0) {
      const magnitude = Math.abs(prevDiff) + Math.abs(nextDiff)

      if (magnitude < 2) {
        return undefined // Too small to be significant
      }

      const type = this.identifyTurningPointType(prev, curr, next)
      const description = this.describeTurningPoint(type, curr)
      const factors = this.identifyTurningPointFactors(prev, curr, next)

      return {
        timestamp: curr.timestamp,
        type,
        magnitude,
        description,
        factors,
      }
    }

    return undefined
  }

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
    if (curr.context !== prev.context) {
      factors.push(`Context shift: ${curr.context}`)
    }

    // Magnitude of change
    const totalChange = Math.abs(next.moodScore - prev.moodScore)
    factors.push(`Total mood change: ${totalChange.toFixed(1)} points`)

    return factors
  }

  private getDominantFactor(
    factors: MoodAnalysisResult['factors'],
  ): MoodAnalysisResult['factors'][0] {
    return factors.reduce((a, b) => (a.weight > b.weight ? a : b))
  }

  private calculateDescriptorOverlap(desc1: string[], desc2: string[]): number {
    const set1 = new Set(desc1)
    const set2 = new Set(desc2)
    const intersection = [...set1].filter((d) => set2.has(d))
    const union = new Set([...set1, ...set2])

    return union.size > 0 ? intersection.length / union.size : 0
  }

  private filterPointsByTimeWindow(
    points: TrajectoryPoint[],
    window: number,
  ): TrajectoryPoint[] {
    if (points.length === 0) return []

    const latest = points[points.length - 1].timestamp.getTime()
    const cutoff = latest - window

    return points.filter((p) => p.timestamp.getTime() >= cutoff)
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length
    return (
      numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) /
      numbers.length
    )
  }

  private mergeTurningPoints(points: TurningPoint[]): TurningPoint[] {
    if (points.length <= 1) return points

    const merged: TurningPoint[] = []
    let current = points[0]

    for (let i = 1; i < points.length; i++) {
      const next = points[i]
      const timeDiff = next.timestamp.getTime() - current.timestamp.getTime()

      // Merge if within 30 minutes
      if (timeDiff < 1800000 && current.type === next.type) {
        current = {
          ...current,
          magnitude: Math.max(current.magnitude, next.magnitude),
          factors: [...new Set([...current.factors, ...next.factors])],
        }
      } else {
        merged.push(current)
        current = next
      }
    }

    merged.push(current)
    return merged
  }
}
