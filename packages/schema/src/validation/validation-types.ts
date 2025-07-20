import { z } from 'zod'

/**
 * Validation status for memories
 */
export enum ValidationStatus {
  /** Not yet validated */
  PENDING = 'pending',
  /** Validated and accepted */
  VALIDATED = 'validated',
  /** Needs refinement or correction */
  NEEDS_REFINEMENT = 'needs-refinement',
  /** Rejected as invalid */
  REJECTED = 'rejected',
}

/**
 * Types of validation issues
 */
export enum ValidationIssueType {
  /** Incorrect emotional analysis */
  EMOTIONAL_MISINTERPRETATION = 'emotional-misinterpretation',
  /** Wrong participant identification */
  PARTICIPANT_ERROR = 'participant-error',
  /** Inaccurate relationship assessment */
  RELATIONSHIP_MISREAD = 'relationship-misread',
  /** Missing important context */
  MISSING_CONTEXT = 'missing-context',
  /** Technical/parsing error */
  TECHNICAL_ERROR = 'technical-error',
  /** Privacy or ethical concern */
  PRIVACY_CONCERN = 'privacy-concern',
}

/**
 * Validation result for a memory
 */
export interface ValidationResult {
  /** Current validation status */
  status: ValidationStatus

  /** When validation occurred */
  validatedAt?: string

  /** Who performed the validation (user ID or system) */
  validatedBy?: string

  /** Issues identified during validation */
  issues: Array<{
    type: ValidationIssueType
    description: string
    severity: 'low' | 'medium' | 'high'
    suggestedFix?: string
  }>

  /** Overall confidence in the memory accuracy (0-1) */
  confidence: number

  /** User feedback or corrections */
  userFeedback?: string
}

/**
 * Validation workflow state
 */
export interface ValidationWorkflow {
  /** Memories awaiting validation */
  pendingMemories: string[] // Memory IDs

  /** Current memory being validated */
  currentMemory?: string

  /** Validation history */
  history: Array<{
    memoryId: string
    result: ValidationResult
    timestamp: string
  }>

  /** Validation session metadata */
  session: {
    startedAt: string
    lastActivityAt: string
    memoriesValidated: number
    memoriesRefined: number
    memoriesRejected: number
  }
}

/**
 * Zod schemas for validation types
 */
export const ValidationResultSchema = z.object({
  status: z.nativeEnum(ValidationStatus),
  validatedAt: z.string().datetime().optional(),
  validatedBy: z.string().optional(),
  issues: z.array(
    z.object({
      type: z.nativeEnum(ValidationIssueType),
      description: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
      suggestedFix: z.string().optional(),
    }),
  ),
  confidence: z.number().min(0).max(1),
  userFeedback: z.string().optional(),
})

export const ValidationWorkflowSchema = z.object({
  pendingMemories: z.array(z.string()),
  currentMemory: z.string().optional(),
  history: z.array(
    z.object({
      memoryId: z.string(),
      result: ValidationResultSchema,
      timestamp: z.string().datetime(),
    }),
  ),
  session: z.object({
    startedAt: z.string().datetime(),
    lastActivityAt: z.string().datetime(),
    memoriesValidated: z.number().int().min(0),
    memoriesRefined: z.number().int().min(0),
    memoriesRejected: z.number().int().min(0),
  }),
})

export type ValidationResultInput = z.input<typeof ValidationResultSchema>
export type ValidationResultOutput = z.output<typeof ValidationResultSchema>
export type ValidationWorkflowInput = z.input<typeof ValidationWorkflowSchema>
export type ValidationWorkflowOutput = z.output<typeof ValidationWorkflowSchema>
