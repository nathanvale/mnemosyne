import { z } from 'zod'

/**
 * Types of refinements that can be made to memories
 */
export enum RefinementType {
  /** Emotional analysis adjustment */
  EMOTIONAL_ADJUSTMENT = 'emotional-adjustment',
  /** Participant identification correction */
  PARTICIPANT_CORRECTION = 'participant-correction',
  /** Relationship assessment update */
  RELATIONSHIP_UPDATE = 'relationship-update',
  /** Context addition or clarification */
  CONTEXT_ADDITION = 'context-addition',
  /** Tag modification */
  TAG_MODIFICATION = 'tag-modification',
  /** Content correction (typos, formatting) */
  CONTENT_CORRECTION = 'content-correction',
  /** Privacy redaction */
  PRIVACY_REDACTION = 'privacy-redaction',
}

/**
 * Individual refinement made to a memory
 */
export interface Refinement {
  /** Type of refinement */
  type: RefinementType

  /** Description of what was changed */
  description: string

  /** Previous value (JSON stringified) */
  previousValue?: string

  /** New value (JSON stringified) */
  newValue?: string

  /** Who made the refinement */
  refinedBy: string

  /** When the refinement was made */
  refinedAt: string

  /** Reason for the refinement */
  reason?: string
}

/**
 * Refinement history for a memory
 */
export interface RefinementHistory {
  /** Memory ID this history belongs to */
  memoryId: string

  /** All refinements made to this memory */
  refinements: Refinement[]

  /** Current version number */
  version: number

  /** Original memory data (before any refinements) */
  originalData: string // JSON stringified Memory

  /** Whether refinements are complete */
  isFinalized: boolean

  /** Summary of all changes */
  changeSummary: {
    /** Total number of refinements */
    totalRefinements: number
    /** Refinements by type */
    byType: Record<RefinementType, number>
    /** Last refinement date */
    lastRefinedAt?: string
    /** Overall improvement score (0-1) */
    improvementScore: number
  }
}

/**
 * Batch refinement suggestions
 */
export interface RefinementSuggestions {
  /** Memory ID these suggestions apply to */
  memoryId: string

  /** AI-generated suggestions for improvement */
  suggestions: Array<{
    /** Type of refinement suggested */
    type: RefinementType
    /** Specific suggestion */
    suggestion: string
    /** Confidence in this suggestion (0-1) */
    confidence: number
    /** Priority level */
    priority: 'low' | 'medium' | 'high'
    /** Reasoning behind the suggestion */
    rationale: string
  }>

  /** Whether user has reviewed these suggestions */
  reviewed: boolean

  /** Suggestions that were accepted */
  acceptedSuggestions: number[]

  /** Suggestions that were rejected */
  rejectedSuggestions: number[]
}

/**
 * Zod schemas for refinement types
 */
export const RefinementSchema = z.object({
  type: z.nativeEnum(RefinementType),
  description: z.string(),
  previousValue: z.string().optional(),
  newValue: z.string().optional(),
  refinedBy: z.string(),
  refinedAt: z.string().datetime(),
  reason: z.string().optional(),
})

export const RefinementHistorySchema = z.object({
  memoryId: z.string(),
  refinements: z.array(RefinementSchema),
  version: z.number().int().min(1),
  originalData: z.string(),
  isFinalized: z.boolean(),
  changeSummary: z.object({
    totalRefinements: z.number().int().min(0),
    byType: z.record(z.nativeEnum(RefinementType), z.number().int().min(0)),
    lastRefinedAt: z.string().datetime().optional(),
    improvementScore: z.number().min(0).max(1),
  }),
})

export const RefinementSuggestionsSchema = z.object({
  memoryId: z.string(),
  suggestions: z.array(
    z.object({
      type: z.nativeEnum(RefinementType),
      suggestion: z.string(),
      confidence: z.number().min(0).max(1),
      priority: z.enum(['low', 'medium', 'high']),
      rationale: z.string(),
    }),
  ),
  reviewed: z.boolean(),
  acceptedSuggestions: z.array(z.number().int().min(0)),
  rejectedSuggestions: z.array(z.number().int().min(0)),
})

export type RefinementInput = z.input<typeof RefinementSchema>
export type RefinementOutput = z.output<typeof RefinementSchema>
export type RefinementHistoryInput = z.input<typeof RefinementHistorySchema>
export type RefinementHistoryOutput = z.output<typeof RefinementHistorySchema>
export type RefinementSuggestionsInput = z.input<
  typeof RefinementSuggestionsSchema
>
export type RefinementSuggestionsOutput = z.output<
  typeof RefinementSuggestionsSchema
>
