import { z } from 'zod'

import type { EmotionalContext } from './emotional-context'
import type { Participant } from './participants'
import type { RelationshipDynamics } from './relationship-dynamics'

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
  author: Participant

  /** All participants involved in this memory */
  participants: Participant[]

  /** Emotional analysis of the memory */
  emotionalContext: EmotionalContext

  /** Relationship dynamics captured in this memory */
  relationshipDynamics: RelationshipDynamics

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
  author: z.lazy(() => z.any()), // ParticipantSchema import would create circular dependency
  participants: z.array(z.lazy(() => z.any())), // ParticipantSchema import would create circular dependency
  emotionalContext: z.lazy(() => z.any()), // EmotionalContextSchema import would create circular dependency
  relationshipDynamics: z.lazy(() => z.any()), // RelationshipDynamicsSchema import would create circular dependency
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
