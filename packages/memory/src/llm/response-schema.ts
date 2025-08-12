import { z } from 'zod'

/**
 * Whitelist of allowed significance component keys
 */
export const SIGNIFICANCE_COMPONENT_WHITELIST = [
  'emotional_impact',
  'relationship_significance',
  'personal_growth',
  'milestone_achievement',
  'conflict_resolution',
  'vulnerability_shared',
  'breakthrough_moment',
  'support_impact',
  'memory_durability',
  'life_changing_potential',
] as const

/**
 * Whitelist of allowed relationship dynamics keys
 */
export const RELATIONSHIP_KEY_WHITELIST = [
  'trust_level',
  'conflict_present',
  'support_given',
  'support_received',
  'boundary_crossed',
  'intimacy_level',
  'power_dynamic',
  'communication_quality',
  'shared_experience',
  'relationship_stage',
] as const

/**
 * Individual memory item schema for LLM responses
 */
export const MemoryItemSchema = z.object({
  id: z.string().optional(),
  content: z.string().min(10).max(1200),
  emotionalContext: z.object({
    primaryEmotion: z.string(),
    secondaryEmotions: z.array(z.string()).max(5),
    intensity: z.number().min(0).max(1),
    valence: z.number().min(-1).max(1),
    themes: z.array(z.string()).max(8),
  }),
  significance: z.object({
    overall: z.number().min(0).max(10),
    components: z
      .record(z.string(), z.number())
      .refine((obj) => Object.keys(obj).length <= 10, {
        message: 'Maximum 10 significance components allowed',
      })
      .refine(
        (obj) =>
          Object.keys(obj).every((k) =>
            SIGNIFICANCE_COMPONENT_WHITELIST.includes(
              k as (typeof SIGNIFICANCE_COMPONENT_WHITELIST)[number],
            ),
          ),
        { message: 'Invalid significance component key' },
      ),
  }),
  relationshipDynamics: z
    .record(z.string(), z.union([z.string().max(500), z.number(), z.boolean()]))
    .optional()
    .refine(
      (obj: Record<string, unknown> | undefined) =>
        !obj ||
        (Object.keys(obj).length <= 5 &&
          Object.keys(obj).every((k) =>
            RELATIONSHIP_KEY_WHITELIST.includes(
              k as (typeof RELATIONSHIP_KEY_WHITELIST)[number],
            ),
          )),
      { message: 'Invalid relationship dynamics key or too many keys (max 5)' },
    ),
  rationale: z.string().max(800).optional(),
  confidence: z.number().min(0).max(1),
})

/**
 * Complete LLM response schema with versioning (v1 - plural memories)
 */
export const MemoryLLMResponseSchema = z.object({
  schemaVersion: z.literal('memory_llm_response_v1'),
  memories: z.array(MemoryItemSchema).min(1).max(10), // Max 10 memories per response
})

/**
 * Legacy singular schema for backward compatibility
 */
export const MemoryLLMResponseSingularSchema = z.object({
  schemaVersion: z.literal('memory_llm_response_v1'),
  memory: MemoryItemSchema,
})

/**
 * Type definitions
 */
export type MemoryItem = z.infer<typeof MemoryItemSchema>
export type MemoryLLMResponse = z.infer<typeof MemoryLLMResponseSchema>
export type MemoryLLMResponseSingular = z.infer<
  typeof MemoryLLMResponseSingularSchema
>

/**
 * Union type for both plural and singular responses
 */
export type MemoryLLMResponseUnion =
  | MemoryLLMResponse
  | MemoryLLMResponseSingular

/**
 * Extracted memory format for internal use
 */
export interface ExtractedMemory {
  id?: string
  content: string
  emotionalContext: {
    primaryEmotion: string
    secondaryEmotions: string[]
    intensity: number
    valence: number
    themes: string[]
  }
  significance: {
    overall: number
    components: Record<string, number>
  }
  relationshipDynamics?: Record<string, string | number | boolean>
  rationale?: string
  confidence: number
  timestamp?: Date
  author?: string
  participants?: string[]
}
