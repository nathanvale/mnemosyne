import { z } from 'zod'

/**
 * Quality metrics for memory processing
 */
export interface QualityMetrics {
  /** Overall quality score (0-1) */
  overallScore: number

  /** Individual quality dimensions */
  dimensions: {
    /** Accuracy of emotional detection */
    emotionalAccuracy: number
    /** Correctness of participant identification */
    participantAccuracy: number
    /** Quality of relationship analysis */
    relationshipInsight: number
    /** Completeness of context capture */
    contextCompleteness: number
    /** Technical parsing quality */
    technicalQuality: number
  }

  /** Specific quality indicators */
  indicators: {
    /** Has all required fields */
    hasCompleteData: boolean
    /** Emotions are consistent with content */
    emotionalConsistency: boolean
    /** Participants are properly identified */
    participantsVerified: boolean
    /** No privacy violations detected */
    privacyCompliant: boolean
    /** Content is appropriate for processing */
    contentAppropriate: boolean
  }

  /** Areas needing improvement */
  improvementAreas: string[]

  /** Processing statistics */
  statistics: {
    /** Number of validation passes */
    validationPasses: number
    /** Number of refinements made */
    refinementCount: number
    /** Time spent in validation (ms) */
    validationDuration: number
    /** Number of user corrections */
    userCorrectionCount: number
  }
}

/**
 * Batch quality report for multiple memories
 */
export interface BatchQualityReport {
  /** Batch identifier */
  batchId: string

  /** When the batch was processed */
  processedAt: string

  /** Number of memories in batch */
  totalMemories: number

  /** Aggregate quality metrics */
  aggregateMetrics: {
    /** Average overall quality score */
    averageQuality: number
    /** Lowest quality score in batch */
    minQuality: number
    /** Highest quality score in batch */
    maxQuality: number
    /** Standard deviation of quality scores */
    qualityStdDev: number
  }

  /** Quality distribution */
  distribution: {
    /** Memories with quality >= 0.9 */
    excellent: number
    /** Memories with quality 0.7-0.9 */
    good: number
    /** Memories with quality 0.5-0.7 */
    fair: number
    /** Memories with quality < 0.5 */
    poor: number
  }

  /** Common issues across batch */
  commonIssues: Array<{
    issue: string
    count: number
    percentage: number
  }>

  /** Memories requiring attention */
  flaggedMemories: Array<{
    memoryId: string
    reason: string
    score: number
  }>
}

/**
 * Zod schemas for quality metrics
 */
export const QualityMetricsSchema = z.object({
  overallScore: z.number().min(0).max(1),
  dimensions: z.object({
    emotionalAccuracy: z.number().min(0).max(1),
    participantAccuracy: z.number().min(0).max(1),
    relationshipInsight: z.number().min(0).max(1),
    contextCompleteness: z.number().min(0).max(1),
    technicalQuality: z.number().min(0).max(1),
  }),
  indicators: z.object({
    hasCompleteData: z.boolean(),
    emotionalConsistency: z.boolean(),
    participantsVerified: z.boolean(),
    privacyCompliant: z.boolean(),
    contentAppropriate: z.boolean(),
  }),
  improvementAreas: z.array(z.string()),
  statistics: z.object({
    validationPasses: z.number().int().min(0),
    refinementCount: z.number().int().min(0),
    validationDuration: z.number().int().min(0),
    userCorrectionCount: z.number().int().min(0),
  }),
})

export const BatchQualityReportSchema = z.object({
  batchId: z.string(),
  processedAt: z.string().datetime(),
  totalMemories: z.number().int().min(0),
  aggregateMetrics: z.object({
    averageQuality: z.number().min(0).max(1),
    minQuality: z.number().min(0).max(1),
    maxQuality: z.number().min(0).max(1),
    qualityStdDev: z.number().min(0),
  }),
  distribution: z.object({
    excellent: z.number().int().min(0),
    good: z.number().int().min(0),
    fair: z.number().int().min(0),
    poor: z.number().int().min(0),
  }),
  commonIssues: z.array(
    z.object({
      issue: z.string(),
      count: z.number().int().min(0),
      percentage: z.number().min(0).max(100),
    }),
  ),
  flaggedMemories: z.array(
    z.object({
      memoryId: z.string(),
      reason: z.string(),
      score: z.number().min(0).max(1),
    }),
  ),
})

export type QualityMetricsInput = z.input<typeof QualityMetricsSchema>
export type QualityMetricsOutput = z.output<typeof QualityMetricsSchema>
export type BatchQualityReportInput = z.input<typeof BatchQualityReportSchema>
export type BatchQualityReportOutput = z.output<typeof BatchQualityReportSchema>
