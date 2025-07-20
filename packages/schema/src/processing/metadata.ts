import { z } from 'zod'

/**
 * Processing stages for memories
 */
export enum ProcessingStage {
  /** Raw import from source */
  IMPORTED = 'imported',
  /** Initial parsing complete */
  PARSED = 'parsed',
  /** Emotional analysis complete */
  ANALYZED = 'analyzed',
  /** Validation complete */
  VALIDATED = 'validated',
  /** Ready for use */
  FINALIZED = 'finalized',
  /** Archived/inactive */
  ARCHIVED = 'archived',
}

/**
 * Source systems for memory imports
 */
export enum SourceSystem {
  /** Facebook Messenger */
  FACEBOOK_MESSENGER = 'facebook-messenger',
  /** WhatsApp */
  WHATSAPP = 'whatsapp',
  /** iMessage */
  IMESSAGE = 'imessage',
  /** SMS/Text */
  SMS = 'sms',
  /** Email */
  EMAIL = 'email',
  /** Manual entry */
  MANUAL = 'manual',
  /** Other/unknown */
  OTHER = 'other',
}

/**
 * Processing metadata for tracking memory lifecycle
 */
export interface ProcessingMetadata {
  /** Current processing stage */
  stage: ProcessingStage

  /** Source system the memory came from */
  sourceSystem: SourceSystem

  /** Import batch identifier */
  importBatchId: string

  /** Processing timestamps */
  timestamps: {
    imported: string
    parsed?: string
    analyzed?: string
    validated?: string
    finalized?: string
    lastModified: string
  }

  /** Processing versions used */
  versions: {
    schemaVersion: string
    parserVersion: string
    analyzerVersion: string
  }

  /** Processing performance metrics */
  performance: {
    /** Time taken for parsing (ms) */
    parsingDuration?: number
    /** Time taken for analysis (ms) */
    analysisDuration?: number
    /** Total processing time (ms) */
    totalDuration?: number
  }

  /** Any errors encountered during processing */
  errors: Array<{
    stage: ProcessingStage
    error: string
    timestamp: string
    resolved: boolean
  }>

  /** Processing flags */
  flags: {
    /** Requires manual review */
    needsReview: boolean
    /** Contains sensitive content */
    hasSensitiveContent: boolean
    /** Processing was incomplete */
    isIncomplete: boolean
    /** High priority for processing */
    isPriority: boolean
  }
}

/**
 * Batch processing summary
 */
export interface BatchProcessingSummary {
  /** Batch identifier */
  batchId: string

  /** Source of the batch */
  source: SourceSystem

  /** Processing statistics */
  statistics: {
    /** Total memories in batch */
    totalMemories: number
    /** Successfully processed */
    successCount: number
    /** Failed processing */
    failureCount: number
    /** Requiring review */
    reviewCount: number
  }

  /** Processing timeline */
  timeline: {
    startedAt: string
    completedAt?: string
    duration?: number
  }

  /** Processing configuration used */
  configuration: {
    /** Whether to skip validation */
    skipValidation: boolean
    /** Privacy settings applied */
    privacyMode: 'strict' | 'normal' | 'minimal'
    /** Parallel processing enabled */
    parallelProcessing: boolean
    /** Batch size for processing */
    batchSize: number
  }
}

/**
 * Zod schemas for processing metadata
 */
export const ProcessingMetadataSchema = z.object({
  stage: z.nativeEnum(ProcessingStage),
  sourceSystem: z.nativeEnum(SourceSystem),
  importBatchId: z.string(),
  timestamps: z.object({
    imported: z.string().datetime(),
    parsed: z.string().datetime().optional(),
    analyzed: z.string().datetime().optional(),
    validated: z.string().datetime().optional(),
    finalized: z.string().datetime().optional(),
    lastModified: z.string().datetime(),
  }),
  versions: z.object({
    schemaVersion: z.string(),
    parserVersion: z.string(),
    analyzerVersion: z.string(),
  }),
  performance: z.object({
    parsingDuration: z.number().int().min(0).optional(),
    analysisDuration: z.number().int().min(0).optional(),
    totalDuration: z.number().int().min(0).optional(),
  }),
  errors: z.array(
    z.object({
      stage: z.nativeEnum(ProcessingStage),
      error: z.string(),
      timestamp: z.string().datetime(),
      resolved: z.boolean(),
    }),
  ),
  flags: z.object({
    needsReview: z.boolean(),
    hasSensitiveContent: z.boolean(),
    isIncomplete: z.boolean(),
    isPriority: z.boolean(),
  }),
})

export const BatchProcessingSummarySchema = z.object({
  batchId: z.string(),
  source: z.nativeEnum(SourceSystem),
  statistics: z.object({
    totalMemories: z.number().int().min(0),
    successCount: z.number().int().min(0),
    failureCount: z.number().int().min(0),
    reviewCount: z.number().int().min(0),
  }),
  timeline: z.object({
    startedAt: z.string().datetime(),
    completedAt: z.string().datetime().optional(),
    duration: z.number().int().min(0).optional(),
  }),
  configuration: z.object({
    skipValidation: z.boolean(),
    privacyMode: z.enum(['strict', 'normal', 'minimal']),
    parallelProcessing: z.boolean(),
    batchSize: z.number().int().min(1),
  }),
})

export type ProcessingMetadataInput = z.input<typeof ProcessingMetadataSchema>
export type ProcessingMetadataOutput = z.output<typeof ProcessingMetadataSchema>
export type BatchProcessingSummaryInput = z.input<
  typeof BatchProcessingSummarySchema
>
export type BatchProcessingSummaryOutput = z.output<
  typeof BatchProcessingSummarySchema
>
