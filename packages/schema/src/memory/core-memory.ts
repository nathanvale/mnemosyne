import { z } from 'zod'

/**
 * Core memory interface representing a single memory unit
 * with emotional intelligence and relationship analysis
 */
export interface Memory {
  /** Unique identifier for the memory */
  id: string

  /** Original message content */
  content: string

  /** ISO 8601 timestamp of when the memory occurred */
  timestamp: string

  /** Primary participant who created this memory */
  author: unknown // Will be typed as Participant when imported

  /** All participants involved in this memory */
  participants: unknown[] // Will be typed as Participant[] when imported

  /** Emotional analysis of the memory */
  emotionalContext: unknown // Will be typed as EmotionalContext when imported

  /** Relationship dynamics captured in this memory */
  relationshipDynamics: unknown // Will be typed as RelationshipDynamics when imported

  /** Tags for categorization and retrieval */
  tags: string[]

  /** Processing metadata */
  metadata: {
    /** When this memory was processed */
    processedAt: string
    /** Version of the schema used */
    schemaVersion: string
    /** Source system or import batch */
    source: string
    /** Processing confidence score (0-1) */
    confidence: number
  }
}

/**
 * Zod schema for Memory validation
 */
export const MemorySchema = z.object({
  id: z.string().uuid(),
  content: z.string().min(1),
  timestamp: z.string().datetime(),
  author: z.lazy(() => z.any()), // Will be defined in participants.ts
  participants: z.array(z.lazy(() => z.any())),
  emotionalContext: z.lazy(() => z.any()), // Will be defined in emotional-context.ts
  relationshipDynamics: z.lazy(() => z.any()), // Will be defined in relationship-dynamics.ts
  tags: z.array(z.string()),
  metadata: z.object({
    processedAt: z.string().datetime(),
    schemaVersion: z.string(),
    source: z.string(),
    confidence: z.number().min(0).max(1),
  }),
})

export type MemoryInput = z.input<typeof MemorySchema>
export type MemoryOutput = z.output<typeof MemorySchema>
