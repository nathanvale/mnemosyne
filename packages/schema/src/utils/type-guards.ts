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

  return (
    typeof obj.id === 'string' &&
    typeof obj.content === 'string' &&
    typeof obj.timestamp === 'string' &&
    obj.author !== undefined &&
    Array.isArray(obj.participants) &&
    obj.emotionalContext !== undefined &&
    obj.relationshipDynamics !== undefined &&
    Array.isArray(obj.tags) &&
    obj.tags.every((tag: unknown) => typeof tag === 'string') &&
    isMemoryMetadata(obj.metadata)
  )
}

/**
 * Type guard to check if an object is valid Memory metadata
 */
export function isMemoryMetadata(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false

  return (
    typeof obj.processedAt === 'string' &&
    typeof obj.schemaVersion === 'string' &&
    typeof obj.source === 'string' &&
    typeof obj.confidence === 'number' &&
    obj.confidence >= 0 &&
    obj.confidence <= 1
  )
}

/**
 * Type guard to check if an object is a valid EmotionalContext
 */
export function isEmotionalContext(obj: unknown): obj is EmotionalContext {
  if (!obj || typeof obj !== 'object') return false

  return (
    isEmotionalState(obj.primaryEmotion) &&
    Array.isArray(obj.secondaryEmotions) &&
    obj.secondaryEmotions.every(isEmotionalState) &&
    typeof obj.intensity === 'number' &&
    obj.intensity >= 0 &&
    obj.intensity <= 1 &&
    typeof obj.valence === 'number' &&
    obj.valence >= -1 &&
    obj.valence <= 1 &&
    Array.isArray(obj.themes) &&
    obj.themes.every(isEmotionalTheme) &&
    (obj.temporalPatterns === undefined ||
      isTemporalPatterns(obj.temporalPatterns)) &&
    isEmotionalIndicators(obj.indicators)
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

  return (
    typeof obj.isBuilding === 'boolean' &&
    typeof obj.isResolving === 'boolean' &&
    (obj.expectedDuration === undefined ||
      ['transient', 'short-term', 'long-term'].includes(obj.expectedDuration))
  )
}

/**
 * Type guard to check emotional indicators
 */
export function isEmotionalIndicators(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false

  return (
    Array.isArray(obj.phrases) &&
    obj.phrases.every((phrase: unknown) => typeof phrase === 'string') &&
    Array.isArray(obj.emotionalWords) &&
    obj.emotionalWords.every((word: unknown) => typeof word === 'string') &&
    Array.isArray(obj.styleIndicators) &&
    obj.styleIndicators.every(
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

  return (
    isCommunicationPattern(obj.communicationPattern) &&
    isInteractionQuality(obj.interactionQuality) &&
    isPowerDynamics(obj.powerDynamics) &&
    isAttachmentIndicators(obj.attachmentIndicators) &&
    isHealthIndicators(obj.healthIndicators) &&
    isNumberInRange(obj.connectionStrength, 0, 1) &&
    (obj.participantDynamics === undefined ||
      isParticipantDynamicsArray(obj.participantDynamics))
  )
}

/**
 * Type guard to check if an object is a valid Participant
 */
export function isParticipant(obj: unknown): obj is Participant {
  if (!obj || typeof obj !== 'object') return false

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.name) &&
    isParticipantRole(obj.role) &&
    (obj.metadata === undefined || isParticipantMetadata(obj.metadata))
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

  return (
    (obj.dominantParticipant === undefined ||
      typeof obj.dominantParticipant === 'string') &&
    typeof obj.isBalanced === 'boolean' &&
    Array.isArray(obj.concerningPatterns) &&
    obj.concerningPatterns.every(
      (pattern: unknown) => typeof pattern === 'string',
    )
  )
}

/**
 * Type guard to check attachment indicators object
 */
export function isAttachmentIndicators(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false

  return (
    Array.isArray(obj.secure) &&
    obj.secure.every((item: unknown) => typeof item === 'string') &&
    Array.isArray(obj.anxious) &&
    obj.anxious.every((item: unknown) => typeof item === 'string') &&
    Array.isArray(obj.avoidant) &&
    obj.avoidant.every((item: unknown) => typeof item === 'string')
  )
}

/**
 * Type guard to check health indicators object
 */
export function isHealthIndicators(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false

  return (
    Array.isArray(obj.positive) &&
    obj.positive.every((item: unknown) => typeof item === 'string') &&
    Array.isArray(obj.negative) &&
    obj.negative.every((item: unknown) => typeof item === 'string') &&
    Array.isArray(obj.repairAttempts) &&
    obj.repairAttempts.every((item: unknown) => typeof item === 'string')
  )
}

/**
 * Type guard to check participant dynamics array
 */
export function isParticipantDynamicsArray(arr: unknown): boolean {
  if (!Array.isArray(arr)) return false

  return arr.every((item: unknown) => {
    if (!item || typeof item !== 'object') return false

    return (
      Array.isArray(item.participants) &&
      item.participants.length === 2 &&
      item.participants.every((p: unknown) => typeof p === 'string') &&
      ['supportive', 'conflictual', 'neutral', 'complex'].includes(
        item.dynamicType,
      ) &&
      Array.isArray(item.observations) &&
      item.observations.every((obs: unknown) => typeof obs === 'string')
    )
  })
}

/**
 * Type guard to check participant metadata
 */
export function isParticipantMetadata(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false

  return (
    (obj.sourceId === undefined || typeof obj.sourceId === 'string') &&
    (obj.canonicalName === undefined ||
      typeof obj.canonicalName === 'string') &&
    (obj.aliases === undefined ||
      (Array.isArray(obj.aliases) &&
        obj.aliases.every((alias: unknown) => typeof alias === 'string'))) &&
    (obj.relationshipDescription === undefined ||
      typeof obj.relationshipDescription === 'string')
  )
}
