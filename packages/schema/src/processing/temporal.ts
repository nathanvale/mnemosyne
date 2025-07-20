import { z } from 'zod'

/**
 * Time-based patterns detected in memories
 */
export interface TemporalPattern {
  /** Pattern identifier */
  id: string

  /** Type of temporal pattern */
  type: TemporalPatternType

  /** Description of the pattern */
  description: string

  /** Time range this pattern covers */
  timeRange: {
    start: string
    end: string
  }

  /** Confidence in pattern detection (0-1) */
  confidence: number

  /** Memories that are part of this pattern */
  memoryIds: string[]

  /** Pattern-specific metadata */
  metadata: Record<string, unknown>
}

/**
 * Types of temporal patterns
 */
export enum TemporalPatternType {
  /** Daily routine or habit */
  DAILY_ROUTINE = 'daily-routine',
  /** Weekly pattern */
  WEEKLY_PATTERN = 'weekly-pattern',
  /** Seasonal or yearly pattern */
  SEASONAL_PATTERN = 'seasonal-pattern',
  /** Emotional cycle */
  EMOTIONAL_CYCLE = 'emotional-cycle',
  /** Relationship development */
  RELATIONSHIP_DEVELOPMENT = 'relationship-development',
  /** Crisis or intense period */
  CRISIS_PERIOD = 'crisis-period',
  /** Growth or learning phase */
  GROWTH_PHASE = 'growth-phase',
  /** Communication frequency change */
  COMMUNICATION_FREQUENCY = 'communication-frequency',
}

/**
 * Temporal context for understanding when things happen
 */
export interface TemporalContext {
  /** Day of week (0=Sunday, 6=Saturday) */
  dayOfWeek: number

  /** Hour of day (0-23) */
  hourOfDay: number

  /** Season (if applicable) */
  season?: 'spring' | 'summer' | 'fall' | 'winter'

  /** Relative time indicators */
  relativeTime: {
    /** Is this during typical work hours? */
    isWorkHours: boolean
    /** Is this during weekend? */
    isWeekend: boolean
    /** Is this during late night hours? */
    isLateNight: boolean
    /** Is this during early morning? */
    isEarlyMorning: boolean
  }

  /** Time since last interaction with same participants */
  timeSinceLastInteraction?: {
    /** Duration in milliseconds */
    duration: number
    /** Human-readable description */
    description: string
  }
}

/**
 * Temporal analytics for memory collections
 */
export interface TemporalAnalytics {
  /** Overall temporal statistics */
  statistics: {
    /** Total time span covered */
    totalTimeSpan: number
    /** Average time between memories */
    averageInterval: number
    /** Most active day of week */
    mostActiveDay: number
    /** Most active hour */
    mostActiveHour: number
    /** Communication frequency per day */
    dailyFrequency: number
  }

  /** Detected patterns */
  patterns: TemporalPattern[]

  /** Seasonal trends */
  seasonalTrends: Array<{
    season: string
    emotionalTrend: 'positive' | 'negative' | 'neutral'
    activityLevel: 'high' | 'medium' | 'low'
    keyThemes: string[]
  }>

  /** Temporal correlations */
  correlations: Array<{
    /** What is correlated */
    factor1: string
    factor2: string
    /** Correlation strength (-1 to 1) */
    strength: number
    /** Description of correlation */
    description: string
  }>
}

/**
 * Zod schemas for temporal types
 */
export const TemporalPatternSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(TemporalPatternType),
  description: z.string(),
  timeRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  confidence: z.number().min(0).max(1),
  memoryIds: z.array(z.string()),
  metadata: z.record(z.unknown()),
})

export const TemporalContextSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  hourOfDay: z.number().int().min(0).max(23),
  season: z.enum(['spring', 'summer', 'fall', 'winter']).optional(),
  relativeTime: z.object({
    isWorkHours: z.boolean(),
    isWeekend: z.boolean(),
    isLateNight: z.boolean(),
    isEarlyMorning: z.boolean(),
  }),
  timeSinceLastInteraction: z
    .object({
      duration: z.number().int().min(0),
      description: z.string(),
    })
    .optional(),
})

export const TemporalAnalyticsSchema = z.object({
  statistics: z.object({
    totalTimeSpan: z.number().int().min(0),
    averageInterval: z.number().int().min(0),
    mostActiveDay: z.number().int().min(0).max(6),
    mostActiveHour: z.number().int().min(0).max(23),
    dailyFrequency: z.number().min(0),
  }),
  patterns: z.array(TemporalPatternSchema),
  seasonalTrends: z.array(
    z.object({
      season: z.string(),
      emotionalTrend: z.enum(['positive', 'negative', 'neutral']),
      activityLevel: z.enum(['high', 'medium', 'low']),
      keyThemes: z.array(z.string()),
    }),
  ),
  correlations: z.array(
    z.object({
      factor1: z.string(),
      factor2: z.string(),
      strength: z.number().min(-1).max(1),
      description: z.string(),
    }),
  ),
})

export type TemporalPatternInput = z.input<typeof TemporalPatternSchema>
export type TemporalPatternOutput = z.output<typeof TemporalPatternSchema>
export type TemporalContextInput = z.input<typeof TemporalContextSchema>
export type TemporalContextOutput = z.output<typeof TemporalContextSchema>
export type TemporalAnalyticsInput = z.input<typeof TemporalAnalyticsSchema>
export type TemporalAnalyticsOutput = z.output<typeof TemporalAnalyticsSchema>
