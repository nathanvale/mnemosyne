import type { Memory } from '../memory/core-memory.js'
import type {
  EmotionalContext,
  EmotionalState,
  EmotionalTheme,
} from '../memory/emotional-context.js'
import type { Participant, ParticipantRole } from '../memory/participants.js'
import type {
  RelationshipDynamics,
  CommunicationPattern,
  InteractionQuality,
} from '../memory/relationship-dynamics.js'

/**
 * Type guard to check if an object is a valid Memory
 */
export function isMemory(obj: unknown): obj is Memory {
  if (!obj || typeof obj !== 'object') return false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type guard pattern requires checking object properties after initial type check
  const candidate = obj as any

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.content === 'string' &&
    typeof candidate.timestamp === 'string' &&
    candidate.author !== undefined &&
    Array.isArray(candidate.participants) &&
    candidate.emotionalContext !== undefined &&
    candidate.relationshipDynamics !== undefined &&
    Array.isArray(candidate.tags) &&
    candidate.tags.every((tag: unknown) => typeof tag === 'string') &&
    isMemoryMetadata(candidate.metadata)
  )
}

/**
 * Type guard to check if an object is valid Memory metadata
 */
export function isMemoryMetadata(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type guard pattern requires accessing unknown object properties
  const candidate = obj as any

  return (
    typeof candidate.processedAt === 'string' &&
    typeof candidate.schemaVersion === 'string' &&
    typeof candidate.source === 'string' &&
    typeof candidate.confidence === 'number' &&
    candidate.confidence >= 0 &&
    candidate.confidence <= 1
  )
}

/**
 * Type guard to check if an object is a valid EmotionalContext
 */
export function isEmotionalContext(obj: unknown): obj is EmotionalContext {
  if (!obj || typeof obj !== 'object') return false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type guard pattern requires accessing unknown object properties
  const candidate = obj as any

  return (
    isEmotionalState(candidate.primaryEmotion) &&
    Array.isArray(candidate.secondaryEmotions) &&
    candidate.secondaryEmotions.every(isEmotionalState) &&
    typeof candidate.intensity === 'number' &&
    candidate.intensity >= 0 &&
    candidate.intensity <= 1 &&
    typeof candidate.valence === 'number' &&
    candidate.valence >= -1 &&
    candidate.valence <= 1 &&
    Array.isArray(candidate.themes) &&
    candidate.themes.every(isEmotionalTheme) &&
    (candidate.temporalPatterns === undefined ||
      isTemporalPatterns(candidate.temporalPatterns)) &&
    isEmotionalIndicators(candidate.indicators)
  )
}

/**
 * Type guard to check if a value is a valid EmotionalState
 */
export function isEmotionalState(value: unknown): value is EmotionalState {
  return (
    typeof value === 'string' &&
    [
      'joy',
      'sadness',
      'anger',
      'fear',
      'surprise',
      'disgust',
      'anticipation',
      'trust',
      'love',
      'anxiety',
      'excitement',
      'contentment',
      'frustration',
      'neutral',
    ].includes(value)
  )
}

/**
 * Type guard to check if a value is a valid EmotionalTheme
 */
export function isEmotionalTheme(value: unknown): value is EmotionalTheme {
  return (
    typeof value === 'string' &&
    [
      'support',
      'conflict',
      'celebration',
      'grief',
      'stress',
      'growth',
      'connection',
      'isolation',
      'achievement',
      'uncertainty',
    ].includes(value)
  )
}

/**
 * Type guard to check temporal patterns
 */
export function isTemporalPatterns(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type guard pattern requires accessing unknown object properties
  const candidate = obj as any

  return (
    typeof candidate.isBuilding === 'boolean' &&
    typeof candidate.isResolving === 'boolean' &&
    (candidate.expectedDuration === undefined ||
      ['transient', 'short-term', 'long-term'].includes(
        candidate.expectedDuration,
      ))
  )
}

/**
 * Type guard to check emotional indicators
 */
export function isEmotionalIndicators(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type guard pattern requires accessing unknown object properties
  const candidate = obj as any

  return (
    Array.isArray(candidate.phrases) &&
    candidate.phrases.every((phrase: unknown) => typeof phrase === 'string') &&
    Array.isArray(candidate.emotionalWords) &&
    candidate.emotionalWords.every(
      (word: unknown) => typeof word === 'string',
    ) &&
    Array.isArray(candidate.styleIndicators) &&
    candidate.styleIndicators.every(
      (indicator: unknown) => typeof indicator === 'string',
    )
  )
}

/**
 * Type guard to check if an object is a valid RelationshipDynamics
 */
export function isRelationshipDynamics(
  obj: unknown,
): obj is RelationshipDynamics {
  if (!obj || typeof obj !== 'object') return false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type guard pattern requires accessing unknown object properties
  const candidate = obj as any

  return (
    isCommunicationPattern(candidate.communicationPattern) &&
    isInteractionQuality(candidate.interactionQuality) &&
    isPowerDynamics(candidate.powerDynamics) &&
    isAttachmentIndicators(candidate.attachmentIndicators) &&
    isHealthIndicators(candidate.healthIndicators) &&
    isNumberInRange(candidate.connectionStrength, 0, 1) &&
    (candidate.participantDynamics === undefined ||
      isParticipantDynamicsArray(candidate.participantDynamics))
  )
}

/**
 * Type guard to check if an object is a valid Participant
 */
export function isParticipant(obj: unknown): obj is Participant {
  if (!obj || typeof obj !== 'object') return false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type guard pattern requires accessing unknown object properties
  const candidate = obj as any

  return (
    isNonEmptyString(candidate.id) &&
    isNonEmptyString(candidate.name) &&
    isParticipantRole(candidate.role) &&
    (candidate.metadata === undefined ||
      isParticipantMetadata(candidate.metadata))
  )
}

/**
 * Type guard to check if an array contains valid participants
 */
export function isParticipantArray(arr: unknown): arr is Participant[] {
  return Array.isArray(arr) && arr.every(isParticipant)
}

/**
 * Utility function to safely check if an object has a specific property
 */
export function hasProperty<T extends object, K extends string>(
  obj: T,
  key: K,
): obj is T & Record<K, unknown> {
  return key in obj
}

/**
 * Type guard for checking if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

/**
 * Type guard for checking if a value is a valid UUID
 */
export function isUUID(value: unknown): value is string {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return typeof value === 'string' && uuidRegex.test(value)
}

/**
 * Type guard for checking if a value is a valid ISO 8601 datetime string
 */
export function isISODateTime(value: unknown): value is string {
  if (typeof value !== 'string') return false

  try {
    const date = new Date(value)
    return date.toISOString() === value
  } catch {
    return false
  }
}

/**
 * Type guard for checking if a value is within a numeric range
 */
export function isNumberInRange(
  value: unknown,
  min: number,
  max: number,
): value is number {
  return (
    typeof value === 'number' && value >= min && value <= max && !isNaN(value)
  )
}

/**
 * Type guard to check if a value is a valid CommunicationPattern
 */
export function isCommunicationPattern(
  value: unknown,
): value is CommunicationPattern {
  return (
    typeof value === 'string' &&
    [
      'open',
      'avoidant',
      'aggressive',
      'passive-aggressive',
      'supportive',
      'formal',
      'playful',
      'intimate',
    ].includes(value)
  )
}

/**
 * Type guard to check if a value is a valid InteractionQuality
 */
export function isInteractionQuality(
  value: unknown,
): value is InteractionQuality {
  return (
    typeof value === 'string' &&
    ['positive', 'neutral', 'strained', 'negative', 'mixed'].includes(value)
  )
}

/**
 * Type guard to check if a value is a valid ParticipantRole
 */
export function isParticipantRole(value: unknown): value is ParticipantRole {
  return (
    typeof value === 'string' &&
    [
      'self',
      'family',
      'friend',
      'partner',
      'colleague',
      'professional',
      'acquaintance',
      'other',
    ].includes(value)
  )
}

/**
 * Type guard to check power dynamics object
 */
export function isPowerDynamics(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type guard pattern requires accessing unknown object properties
  const candidate = obj as any

  return (
    (candidate.dominantParticipant === undefined ||
      typeof candidate.dominantParticipant === 'string') &&
    typeof candidate.isBalanced === 'boolean' &&
    Array.isArray(candidate.concerningPatterns) &&
    candidate.concerningPatterns.every(
      (pattern: unknown) => typeof pattern === 'string',
    )
  )
}

/**
 * Type guard to check attachment indicators object
 */
export function isAttachmentIndicators(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type guard pattern requires accessing unknown object properties
  const candidate = obj as any

  return (
    Array.isArray(candidate.secure) &&
    candidate.secure.every((item: unknown) => typeof item === 'string') &&
    Array.isArray(candidate.anxious) &&
    candidate.anxious.every((item: unknown) => typeof item === 'string') &&
    Array.isArray(candidate.avoidant) &&
    candidate.avoidant.every((item: unknown) => typeof item === 'string')
  )
}

/**
 * Type guard to check health indicators object
 */
export function isHealthIndicators(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type guard pattern requires accessing unknown object properties
  const candidate = obj as any

  return (
    Array.isArray(candidate.positive) &&
    candidate.positive.every((item: unknown) => typeof item === 'string') &&
    Array.isArray(candidate.negative) &&
    candidate.negative.every((item: unknown) => typeof item === 'string') &&
    Array.isArray(candidate.repairAttempts) &&
    candidate.repairAttempts.every((item: unknown) => typeof item === 'string')
  )
}

/**
 * Type guard to check participant dynamics array
 */
export function isParticipantDynamicsArray(arr: unknown): boolean {
  if (!Array.isArray(arr)) return false

  return arr.every((item: unknown) => {
    if (!item || typeof item !== 'object') return false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type guard pattern requires accessing unknown object properties
    const candidate = item as any

    return (
      Array.isArray(candidate.participants) &&
      candidate.participants.length === 2 &&
      candidate.participants.every((p: unknown) => typeof p === 'string') &&
      ['supportive', 'conflictual', 'neutral', 'complex'].includes(
        candidate.dynamicType,
      ) &&
      Array.isArray(candidate.observations) &&
      candidate.observations.every((obs: unknown) => typeof obs === 'string')
    )
  })
}

/**
 * Type guard to check participant metadata
 */
export function isParticipantMetadata(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type guard pattern requires accessing unknown object properties
  const candidate = obj as any

  return (
    (candidate.sourceId === undefined ||
      typeof candidate.sourceId === 'string') &&
    (candidate.canonicalName === undefined ||
      typeof candidate.canonicalName === 'string') &&
    (candidate.aliases === undefined ||
      (Array.isArray(candidate.aliases) &&
        candidate.aliases.every(
          (alias: unknown) => typeof alias === 'string',
        ))) &&
    (candidate.relationshipDescription === undefined ||
      typeof candidate.relationshipDescription === 'string')
  )
}
