import type { Memory } from '../memory/core-memory'
import type { EmotionalContext } from '../memory/emotional-context'
import type { Participant } from '../memory/participants'
import type { RelationshipDynamics } from '../memory/relationship-dynamics'

import { EmotionalState } from '../memory/emotional-context'
import { ParticipantRole } from '../memory/participants'
import {
  CommunicationPattern,
  InteractionQuality,
} from '../memory/relationship-dynamics'

/**
 * Export format for external systems
 */
export interface ExportMemory {
  id: string
  content: string
  timestamp: string
  author: string
  participants: string[]
  primaryEmotion: string
  emotionalIntensity: number
  emotionalValence: number
  communicationPattern: string
  connectionStrength: number
  tags: string[]
  confidence: number
}

/**
 * Legacy memory format (v1) for backward compatibility
 */
export interface MemoryV1 {
  id: string
  text: string
  date: string
  sender: string
  recipients: string[]
  mood: string
  sentiment: number
  categories: string[]
  metadata: {
    processed: string
    version: string
    source: string
  }
}

/**
 * Migration record for tracking transformations
 */
export interface MigrationRecord {
  fromVersion: string
  toVersion: string
  migratedAt: string
  changes: string[]
  warnings?: string[]
}

/**
 * Transform a Memory object to export format for external consumption
 */
export function transformMemoryToExport(memory: Memory): ExportMemory {
  // Type assertion needed due to 'unknown' types in Memory interface
  const emotionalContext = memory.emotionalContext as EmotionalContext
  const relationshipDynamics =
    memory.relationshipDynamics as RelationshipDynamics
  const participants = memory.participants as Participant[]
  const author = memory.author as Participant

  return {
    id: memory.id,
    content: memory.content,
    timestamp: memory.timestamp,
    author: author.name,
    participants: participants.map((p) => p.name),
    primaryEmotion: emotionalContext.primaryEmotion,
    emotionalIntensity: emotionalContext.intensity,
    emotionalValence: emotionalContext.valence,
    communicationPattern: relationshipDynamics.communicationPattern,
    connectionStrength: relationshipDynamics.connectionStrength,
    tags: memory.tags,
    confidence: memory.metadata.confidence,
  }
}

/**
 * Transform legacy memory format (v1) to current Memory format
 */
export function transformMemoryFromV1(v1Memory: MemoryV1): Memory {
  // Map v1 mood to emotional context
  const emotionalContext: EmotionalContext = {
    primaryEmotion: mapV1MoodToEmotion(v1Memory.mood) as EmotionalState,
    secondaryEmotions: [],
    intensity: Math.abs(v1Memory.sentiment), // Convert sentiment to intensity
    valence: v1Memory.sentiment, // Sentiment becomes valence
    themes: [], // Will need to be filled in manually or through re-processing
    indicators: {
      phrases: [],
      emotionalWords: [],
      styleIndicators: [],
    },
  }

  // Create basic relationship dynamics
  const relationshipDynamics: RelationshipDynamics = {
    communicationPattern: CommunicationPattern.OPEN, // Default, would need analysis
    interactionQuality:
      v1Memory.sentiment > 0
        ? InteractionQuality.POSITIVE
        : v1Memory.sentiment < 0
          ? InteractionQuality.NEGATIVE
          : InteractionQuality.NEUTRAL,
    powerDynamics: {
      isBalanced: true, // Default assumption
      concerningPatterns: [],
    },
    attachmentIndicators: {
      secure: [],
      anxious: [],
      avoidant: [],
    },
    healthIndicators: {
      positive: [],
      negative: [],
      repairAttempts: [],
    },
    connectionStrength: Math.abs(v1Memory.sentiment), // Use sentiment as proxy
  }

  // Create participants
  const author: Participant = {
    id: `participant_${v1Memory.sender.toLowerCase().replace(/\s+/g, '_')}`,
    name: v1Memory.sender,
    role: ParticipantRole.SELF, // Assume sender is self
  }

  const participants: Participant[] = [
    author,
    ...v1Memory.recipients.map((recipient) => ({
      id: `participant_${recipient.toLowerCase().replace(/\s+/g, '_')}`,
      name: recipient,
      role: ParticipantRole.OTHER,
    })),
  ]

  return {
    id: v1Memory.id,
    content: v1Memory.text,
    timestamp: v1Memory.date,
    author,
    participants,
    emotionalContext,
    relationshipDynamics,
    tags: v1Memory.categories,
    metadata: {
      processedAt: v1Memory.metadata.processed,
      schemaVersion: '2.0',
      source: v1Memory.metadata.source,
      confidence: 0.5, // Lower confidence for migrated data
    },
  }
}

/**
 * Transform Memory to a format suitable for database storage
 */
export function transformMemoryForDatabase(memory: Memory): {
  memory: Omit<
    Memory,
    'emotionalContext' | 'relationshipDynamics' | 'participants' | 'author'
  >
  emotionalContext: string // JSON stringified
  relationshipDynamics: string // JSON stringified
  participants: string // JSON stringified
  author: string // JSON stringified
} {
  return {
    memory: {
      id: memory.id,
      content: memory.content,
      timestamp: memory.timestamp,
      tags: memory.tags,
      metadata: memory.metadata,
    },
    emotionalContext: JSON.stringify(memory.emotionalContext),
    relationshipDynamics: JSON.stringify(memory.relationshipDynamics),
    participants: JSON.stringify(memory.participants),
    author: JSON.stringify(memory.author),
  }
}

/**
 * Transform database format back to Memory object
 */
export function transformMemoryFromDatabase(data: {
  memory: Omit<
    Memory,
    'emotionalContext' | 'relationshipDynamics' | 'participants' | 'author'
  >
  emotionalContext: string
  relationshipDynamics: string
  participants: string
  author: string
}): Memory {
  return {
    ...data.memory,
    emotionalContext: JSON.parse(data.emotionalContext),
    relationshipDynamics: JSON.parse(data.relationshipDynamics),
    participants: JSON.parse(data.participants),
    author: JSON.parse(data.author),
  }
}

/**
 * Create a normalized copy of a Memory for comparison/hashing
 */
export function normalizeMemory(memory: Memory): Memory {
  // Create a deep copy and normalize fields for consistent comparison
  const normalized = JSON.parse(JSON.stringify(memory))

  // Sort arrays for consistent ordering
  if (normalized.tags) {
    normalized.tags.sort()
  }

  const emotionalContext = normalized.emotionalContext as EmotionalContext
  if (emotionalContext?.secondaryEmotions) {
    emotionalContext.secondaryEmotions.sort()
  }
  if (emotionalContext?.themes) {
    emotionalContext.themes.sort()
  }

  // Normalize participants order (by ID for consistency)
  if (normalized.participants && Array.isArray(normalized.participants)) {
    normalized.participants.sort((a: Participant, b: Participant) =>
      a.id.localeCompare(b.id),
    )
  }

  return normalized
}

/**
 * Extract key features from Memory for machine learning or analysis
 */
export interface MemoryFeatures {
  emotionalFeatures: {
    primaryEmotion: string
    intensity: number
    valence: number
    themeCount: number
    hasTemporalPatterns: boolean
  }
  relationshipFeatures: {
    communicationPattern: string
    interactionQuality: string
    connectionStrength: number
    hasParticipantDynamics: boolean
    concerningPatternsCount: number
  }
  contentFeatures: {
    contentLength: number
    tagCount: number
    confidence: number
    participantCount: number
  }
  metadata: {
    schemaVersion: string
    source: string
    processedAt: string
  }
}

export function extractMemoryFeatures(memory: Memory): MemoryFeatures {
  const emotionalContext = memory.emotionalContext as EmotionalContext
  const relationshipDynamics =
    memory.relationshipDynamics as RelationshipDynamics
  const participants = memory.participants as Participant[]

  return {
    emotionalFeatures: {
      primaryEmotion: emotionalContext.primaryEmotion,
      intensity: emotionalContext.intensity,
      valence: emotionalContext.valence,
      themeCount: emotionalContext.themes.length,
      hasTemporalPatterns: Boolean(emotionalContext.temporalPatterns),
    },
    relationshipFeatures: {
      communicationPattern: relationshipDynamics.communicationPattern,
      interactionQuality: relationshipDynamics.interactionQuality,
      connectionStrength: relationshipDynamics.connectionStrength,
      hasParticipantDynamics: Boolean(relationshipDynamics.participantDynamics),
      concerningPatternsCount:
        relationshipDynamics.powerDynamics.concerningPatterns.length,
    },
    contentFeatures: {
      contentLength: memory.content.length,
      tagCount: memory.tags.length,
      confidence: memory.metadata.confidence,
      participantCount: participants.length,
    },
    metadata: {
      schemaVersion: memory.metadata.schemaVersion,
      source: memory.metadata.source,
      processedAt: memory.metadata.processedAt,
    },
  }
}

/**
 * Create a migration record for version transformations
 */
export function createMigrationRecord(
  fromVersion: string,
  toVersion: string,
  changes: string[],
  warnings?: string[],
): MigrationRecord {
  return {
    fromVersion,
    toVersion,
    migratedAt: new Date().toISOString(),
    changes,
    warnings,
  }
}

/**
 * Batch transformation utility
 */
export function transformBatch<TInput, TOutput>(
  items: TInput[],
  transformer: (item: TInput) => TOutput,
  options: {
    batchSize?: number
    onProgress?: (processed: number, total: number) => void
    onError?: (error: Error, item: TInput, index: number) => void
  } = {},
): TOutput[] {
  const { batchSize = 100, onProgress, onError } = options
  const results: TOutput[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)

    for (let j = 0; j < batch.length; j++) {
      try {
        const result = transformer(batch[j])
        results.push(result)
      } catch (error) {
        if (onError) {
          onError(error as Error, batch[j], i + j)
        } else {
          throw error
        }
      }
    }

    if (onProgress) {
      onProgress(Math.min(i + batchSize, items.length), items.length)
    }
  }

  return results
}

// Helper functions

function mapV1MoodToEmotion(mood: string): string {
  const moodMap: Record<string, string> = {
    happy: 'joy',
    sad: 'sadness',
    angry: 'anger',
    scared: 'fear',
    surprised: 'surprise',
    disgusted: 'disgust',
    excited: 'excitement',
    anxious: 'anxiety',
    calm: 'contentment',
    frustrated: 'frustration',
    loving: 'love',
    trusting: 'trust',
  }

  return moodMap[mood.toLowerCase()] || 'neutral'
}
