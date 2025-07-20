import { z } from 'zod'

/**
 * Primary emotional states detected in memories
 */
export enum EmotionalState {
  JOY = 'joy',
  SADNESS = 'sadness',
  ANGER = 'anger',
  FEAR = 'fear',
  SURPRISE = 'surprise',
  DISGUST = 'disgust',
  ANTICIPATION = 'anticipation',
  TRUST = 'trust',
  LOVE = 'love',
  ANXIETY = 'anxiety',
  EXCITEMENT = 'excitement',
  CONTENTMENT = 'contentment',
  FRUSTRATION = 'frustration',
  NEUTRAL = 'neutral',
}

/**
 * Emotional themes that span multiple messages
 */
export enum EmotionalTheme {
  SUPPORT = 'support',
  CONFLICT = 'conflict',
  CELEBRATION = 'celebration',
  GRIEF = 'grief',
  STRESS = 'stress',
  GROWTH = 'growth',
  CONNECTION = 'connection',
  ISOLATION = 'isolation',
  ACHIEVEMENT = 'achievement',
  UNCERTAINTY = 'uncertainty',
}

/**
 * Emotional context analysis for a memory
 */
export interface EmotionalContext {
  /** Primary emotional state detected */
  primaryEmotion: EmotionalState

  /** Secondary emotions present (if any) */
  secondaryEmotions: EmotionalState[]

  /** Emotional intensity (0-1 scale) */
  intensity: number

  /** Emotional valence (-1 to 1, negative to positive) */
  valence: number

  /** Broader emotional themes identified */
  themes: EmotionalTheme[]

  /** Temporal emotional patterns */
  temporalPatterns?: {
    /** Is this emotion building from previous interactions? */
    isBuilding: boolean
    /** Is this emotion resolving from previous interactions? */
    isResolving: boolean
    /** Expected duration of emotional state */
    expectedDuration?: 'transient' | 'short-term' | 'long-term'
  }

  /** Specific emotional indicators found in the content */
  indicators: {
    /** Key phrases that indicate emotional state */
    phrases: string[]
    /** Emotional words detected */
    emotionalWords: string[]
    /** Communication style indicators (exclamation marks, caps, etc.) */
    styleIndicators: string[]
  }
}

/**
 * Zod schema for EmotionalContext validation
 */
export const EmotionalContextSchema = z.object({
  primaryEmotion: z.nativeEnum(EmotionalState),
  secondaryEmotions: z.array(z.nativeEnum(EmotionalState)),
  intensity: z.number().min(0).max(1),
  valence: z.number().min(-1).max(1),
  themes: z.array(z.nativeEnum(EmotionalTheme)),
  temporalPatterns: z
    .object({
      isBuilding: z.boolean(),
      isResolving: z.boolean(),
      expectedDuration: z
        .enum(['transient', 'short-term', 'long-term'])
        .optional(),
    })
    .optional(),
  indicators: z.object({
    phrases: z.array(z.string()),
    emotionalWords: z.array(z.string()),
    styleIndicators: z.array(z.string()),
  }),
})

export type EmotionalContextInput = z.input<typeof EmotionalContextSchema>
export type EmotionalContextOutput = z.output<typeof EmotionalContextSchema>
