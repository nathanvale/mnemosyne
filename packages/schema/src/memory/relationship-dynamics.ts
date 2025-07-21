import { z } from 'zod'

/**
 * Communication patterns observed in relationships
 */
export enum CommunicationPattern {
  /** Open and direct communication */
  OPEN = 'open',
  /** Avoidant or indirect communication */
  AVOIDANT = 'avoidant',
  /** Aggressive or confrontational */
  AGGRESSIVE = 'aggressive',
  /** Passive-aggressive patterns */
  PASSIVE_AGGRESSIVE = 'passive-aggressive',
  /** Supportive and empathetic */
  SUPPORTIVE = 'supportive',
  /** Formal or professional */
  FORMAL = 'formal',
  /** Playful or humorous */
  PLAYFUL = 'playful',
  /** Intimate or vulnerable */
  INTIMATE = 'intimate',
}

/**
 * Quality assessment of the interaction
 */
export enum InteractionQuality {
  /** Highly positive and constructive */
  POSITIVE = 'positive',
  /** Generally neutral */
  NEUTRAL = 'neutral',
  /** Somewhat strained or tense */
  STRAINED = 'strained',
  /** Conflictual or negative */
  NEGATIVE = 'negative',
  /** Mixed signals or ambiguous */
  MIXED = 'mixed',
}

/**
 * Relationship dynamics captured in a memory
 */
export interface RelationshipDynamics {
  /** Primary communication pattern observed */
  communicationPattern: CommunicationPattern

  /** Quality of the interaction */
  interactionQuality: InteractionQuality

  /** Power dynamics observed */
  powerDynamics: {
    /** Who appears to be leading/controlling the conversation */
    dominantParticipant?: string // Participant ID
    /** Is there balanced participation? */
    isBalanced: boolean
    /** Any signs of manipulation or coercion */
    concerningPatterns: string[]
  }

  /** Attachment indicators */
  attachmentIndicators: {
    /** Secure attachment behaviors */
    secure: string[]
    /** Anxious attachment behaviors */
    anxious: string[]
    /** Avoidant attachment behaviors */
    avoidant: string[]
  }

  /** Relationship health indicators */
  healthIndicators: {
    /** Positive indicators (trust, respect, etc.) */
    positive: string[]
    /** Negative indicators (criticism, contempt, etc.) */
    negative: string[]
    /** Repair attempts after conflict */
    repairAttempts: string[]
  }

  /** Connection strength (0-1 scale) */
  connectionStrength: number

  /** Specific dynamics between participants */
  participantDynamics?: Array<{
    /** Participant IDs involved */
    participants: [string, string]
    /** Nature of their interaction */
    dynamicType: 'supportive' | 'conflictual' | 'neutral' | 'complex'
    /** Specific observations */
    observations: string[]
  }>

  /** Quality score for relationship assessment (0-10 scale) */
  quality?: number

  /** Communication patterns observed in the relationship */
  patterns?: string[]
}

/**
 * Zod schema for RelationshipDynamics validation
 */
export const RelationshipDynamicsSchema = z.object({
  communicationPattern: z.nativeEnum(CommunicationPattern),
  interactionQuality: z.nativeEnum(InteractionQuality),
  powerDynamics: z.object({
    dominantParticipant: z.string().optional(),
    isBalanced: z.boolean(),
    concerningPatterns: z.array(z.string()),
  }),
  attachmentIndicators: z.object({
    secure: z.array(z.string()),
    anxious: z.array(z.string()),
    avoidant: z.array(z.string()),
  }),
  healthIndicators: z.object({
    positive: z.array(z.string()),
    negative: z.array(z.string()),
    repairAttempts: z.array(z.string()),
  }),
  connectionStrength: z.number().min(0).max(1),
  participantDynamics: z
    .array(
      z.object({
        participants: z.tuple([z.string(), z.string()]),
        dynamicType: z.enum([
          'supportive',
          'conflictual',
          'neutral',
          'complex',
        ]),
        observations: z.array(z.string()),
      }),
    )
    .optional(),
  quality: z.number().min(0).max(10).optional(),
  patterns: z.array(z.string()).optional(),
})

export type RelationshipDynamicsInput = z.input<
  typeof RelationshipDynamicsSchema
>
export type RelationshipDynamicsOutput = z.output<
  typeof RelationshipDynamicsSchema
>
