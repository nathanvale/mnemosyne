import { z } from 'zod'

/**
 * Role classification for participants in conversations
 */
export enum ParticipantRole {
  /** The primary user/self in the conversation */
  SELF = 'self',
  /** Family member */
  FAMILY = 'family',
  /** Close friend */
  FRIEND = 'friend',
  /** Romantic partner */
  PARTNER = 'partner',
  /** Work colleague */
  COLLEAGUE = 'colleague',
  /** Professional contact (doctor, therapist, etc.) */
  PROFESSIONAL = 'professional',
  /** Acquaintance or casual contact */
  ACQUAINTANCE = 'acquaintance',
  /** Unknown or unclassified */
  OTHER = 'other',
}

/**
 * Participant in a memory/conversation
 */
export interface Participant {
  /** Unique identifier for the participant */
  id: string

  /** Display name */
  name: string

  /** Role/relationship classification */
  role: ParticipantRole

  /** Additional metadata about the participant */
  metadata?: {
    /** Original identifier from source system */
    sourceId?: string
    /** Normalized/canonical name */
    canonicalName?: string
    /** Alternative names or nicknames */
    aliases?: string[]
    /** Relationship description if role is OTHER */
    relationshipDescription?: string
  }
}

/**
 * Zod schema for Participant validation
 */
export const ParticipantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.nativeEnum(ParticipantRole),
  metadata: z
    .object({
      sourceId: z.string().optional(),
      canonicalName: z.string().optional(),
      aliases: z.array(z.string()).optional(),
      relationshipDescription: z.string().optional(),
    })
    .optional(),
})

export type ParticipantInput = z.input<typeof ParticipantSchema>
export type ParticipantOutput = z.output<typeof ParticipantSchema>
