import { describe, it, expect } from 'vitest'

import type { Memory } from '../memory/core-memory.js'
import type { MemoryV1 } from '../utils/transformations.js'

import { EmotionalState, EmotionalTheme } from '../memory/emotional-context.js'
import { ParticipantRole } from '../memory/participants.js'
import {
  CommunicationPattern,
  InteractionQuality,
} from '../memory/relationship-dynamics.js'
import {
  transformMemoryToExport,
  transformMemoryFromV1,
  transformMemoryForDatabase,
  transformMemoryFromDatabase,
  normalizeMemory,
  extractMemoryFeatures,
  transformBatch,
} from '../utils/transformations.js'

describe('Transformations', () => {
  const mockMemory: Memory = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    content: 'Happy birthday! Hope you have a wonderful day!',
    timestamp: '2024-01-01T00:00:00.000Z',
    author: {
      id: 'author-1',
      name: 'John Doe',
      role: ParticipantRole.SELF,
    },
    participants: [
      {
        id: 'participant-1',
        name: 'Jane Smith',
        role: ParticipantRole.FRIEND,
      },
      {
        id: 'participant-2',
        name: 'Bob Wilson',
        role: ParticipantRole.FAMILY,
      },
    ],
    emotionalContext: {
      primaryEmotion: EmotionalState.JOY,
      secondaryEmotions: [EmotionalState.EXCITEMENT],
      intensity: 0.9,
      valence: 0.8,
      themes: [EmotionalTheme.CELEBRATION, EmotionalTheme.SUPPORT],
      indicators: {
        phrases: ['happy birthday', 'wonderful day'],
        emotionalWords: ['happy', 'wonderful'],
        styleIndicators: ['!'],
      },
    },
    relationshipDynamics: {
      communicationPattern: CommunicationPattern.SUPPORTIVE,
      interactionQuality: InteractionQuality.POSITIVE,
      powerDynamics: {
        isBalanced: true,
        concerningPatterns: [],
      },
      attachmentIndicators: {
        secure: ['warm', 'caring'],
        anxious: [],
        avoidant: [],
      },
      healthIndicators: {
        positive: ['supportive', 'celebratory'],
        negative: [],
        repairAttempts: [],
      },
      connectionStrength: 0.85,
    },
    tags: ['birthday', 'celebration', 'friendship'],
    metadata: {
      processedAt: '2024-01-01T00:00:00.000Z',
      schemaVersion: '2.0',
      source: 'text-messages',
      confidence: 0.95,
    },
  }

  describe('transformMemoryToExport', () => {
    it('should transform memory to export format', () => {
      const exported = transformMemoryToExport(mockMemory)

      expect(exported).toEqual({
        id: '550e8400-e29b-41d4-a716-446655440000',
        content: 'Happy birthday! Hope you have a wonderful day!',
        timestamp: '2024-01-01T00:00:00.000Z',
        author: 'John Doe',
        participants: ['Jane Smith', 'Bob Wilson'],
        primaryEmotion: EmotionalState.JOY,
        emotionalIntensity: 0.9,
        emotionalValence: 0.8,
        communicationPattern: CommunicationPattern.SUPPORTIVE,
        connectionStrength: 0.85,
        tags: ['birthday', 'celebration', 'friendship'],
        confidence: 0.95,
      })
    })

    it('should handle empty participants array', () => {
      const memoryWithoutParticipants = {
        ...mockMemory,
        participants: [],
      }

      const exported = transformMemoryToExport(memoryWithoutParticipants)
      expect(exported.participants).toEqual([])
    })

    it('should preserve all required fields', () => {
      const exported = transformMemoryToExport(mockMemory)

      expect(exported.id).toBeDefined()
      expect(exported.content).toBeDefined()
      expect(exported.timestamp).toBeDefined()
      expect(exported.author).toBeDefined()
      expect(exported.participants).toBeDefined()
      expect(exported.primaryEmotion).toBeDefined()
      expect(exported.emotionalIntensity).toBeDefined()
      expect(exported.emotionalValence).toBeDefined()
      expect(exported.communicationPattern).toBeDefined()
      expect(exported.connectionStrength).toBeDefined()
      expect(exported.tags).toBeDefined()
      expect(exported.confidence).toBeDefined()
    })
  })

  describe('transformMemoryFromV1', () => {
    const mockV1Memory: MemoryV1 = {
      id: 'v1-memory-123',
      text: 'This is a legacy message',
      date: '2023-01-01T00:00:00.000Z',
      sender: 'Legacy User',
      recipients: ['Recipient 1', 'Recipient 2'],
      mood: 'happy',
      sentiment: 0.7,
      categories: ['personal', 'conversation'],
      metadata: {
        processed: '2023-01-01T01:00:00.000Z',
        version: '1.0',
        source: 'legacy-import',
      },
    }

    it('should transform V1 memory to current format', () => {
      const transformed = transformMemoryFromV1(mockV1Memory)

      expect(transformed.id).toBe('v1-memory-123')
      expect(transformed.content).toBe('This is a legacy message')
      expect(transformed.timestamp).toBe('2023-01-01T00:00:00.000Z')
      expect(transformed.tags).toEqual(['personal', 'conversation'])
      expect(transformed.metadata.schemaVersion).toBe('2.0')
      expect(transformed.metadata.confidence).toBe(0.5) // Lower confidence for migrated data
    })

    it('should map V1 mood to emotional state correctly', () => {
      const transformed = transformMemoryFromV1(mockV1Memory)
      const emotionalContext = transformed.emotionalContext as {
        primaryEmotion: EmotionalState
        intensity: number
        valence: number
      }

      expect(emotionalContext.primaryEmotion).toBe(EmotionalState.JOY)
      expect(emotionalContext.intensity).toBe(0.7) // From abs(sentiment)
      expect(emotionalContext.valence).toBe(0.7) // From sentiment
    })

    it('should create participants from sender and recipients', () => {
      const transformed = transformMemoryFromV1(mockV1Memory)
      const participants = transformed.participants as Array<{
        name: string
        role: ParticipantRole
      }>

      expect(participants).toHaveLength(3) // sender + 2 recipients
      expect(participants[0].name).toBe('Legacy User')
      expect(participants[0].role).toBe(ParticipantRole.SELF)
      expect(participants[1].name).toBe('Recipient 1')
      expect(participants[2].name).toBe('Recipient 2')
    })

    it('should handle negative sentiment correctly', () => {
      const negativeV1Memory = {
        ...mockV1Memory,
        mood: 'sad',
        sentiment: -0.6,
      }

      const transformed = transformMemoryFromV1(negativeV1Memory)
      const emotionalContext = transformed.emotionalContext as {
        primaryEmotion: EmotionalState
        intensity: number
        valence: number
      }
      const relationshipDynamics = transformed.relationshipDynamics as {
        interactionQuality: InteractionQuality
      }

      expect(emotionalContext.primaryEmotion).toBe(EmotionalState.SADNESS)
      expect(emotionalContext.intensity).toBe(0.6) // abs(-0.6)
      expect(emotionalContext.valence).toBe(-0.6)
      expect(relationshipDynamics.interactionQuality).toBe(
        InteractionQuality.NEGATIVE,
      )
    })
  })

  describe('transformMemoryForDatabase', () => {
    it('should transform memory for database storage', () => {
      const dbFormat = transformMemoryForDatabase(mockMemory)

      expect(dbFormat.memory.id).toBe(mockMemory.id)
      expect(dbFormat.memory.content).toBe(mockMemory.content)
      expect(dbFormat.memory.timestamp).toBe(mockMemory.timestamp)
      expect(dbFormat.memory.tags).toEqual(mockMemory.tags)
      expect(dbFormat.memory.metadata).toEqual(mockMemory.metadata)

      // Check that complex objects are JSON stringified
      expect(typeof dbFormat.emotionalContext).toBe('string')
      expect(typeof dbFormat.relationshipDynamics).toBe('string')
      expect(typeof dbFormat.participants).toBe('string')
      expect(typeof dbFormat.author).toBe('string')

      // Verify JSON can be parsed back
      expect(() => JSON.parse(dbFormat.emotionalContext)).not.toThrow()
      expect(() => JSON.parse(dbFormat.relationshipDynamics)).not.toThrow()
      expect(() => JSON.parse(dbFormat.participants)).not.toThrow()
      expect(() => JSON.parse(dbFormat.author)).not.toThrow()
    })
  })

  describe('transformMemoryFromDatabase', () => {
    it('should transform database format back to memory', () => {
      const dbFormat = transformMemoryForDatabase(mockMemory)
      const restored = transformMemoryFromDatabase(dbFormat)

      expect(restored).toEqual(mockMemory)
    })

    it('should handle round-trip transformation correctly', () => {
      const dbFormat = transformMemoryForDatabase(mockMemory)
      const restored = transformMemoryFromDatabase(dbFormat)
      const dbFormatAgain = transformMemoryForDatabase(restored)

      expect(dbFormatAgain).toEqual(dbFormat)
    })
  })

  describe('normalizeMemory', () => {
    it('should sort arrays for consistent ordering', () => {
      const memoryWithUnsortedData = {
        ...mockMemory,
        tags: ['zebra', 'apple', 'banana'],
        emotionalContext: {
          ...mockMemory.emotionalContext,
          secondaryEmotions: [
            EmotionalState.EXCITEMENT,
            EmotionalState.ANTICIPATION,
          ],
          themes: [EmotionalTheme.SUPPORT, EmotionalTheme.CELEBRATION],
        },
        participants: [
          { id: 'c', name: 'Charlie', role: ParticipantRole.FRIEND },
          { id: 'a', name: 'Alice', role: ParticipantRole.SELF },
          { id: 'b', name: 'Bob', role: ParticipantRole.FAMILY },
        ],
      }

      const normalized = normalizeMemory(memoryWithUnsortedData)

      expect(normalized.tags).toEqual(['apple', 'banana', 'zebra'])

      const emotionalContext = normalized.emotionalContext as {
        secondaryEmotions: EmotionalState[]
        themes: EmotionalTheme[]
      }
      expect(emotionalContext.secondaryEmotions).toEqual([
        EmotionalState.ANTICIPATION,
        EmotionalState.EXCITEMENT,
      ])
      expect(emotionalContext.themes).toEqual([
        EmotionalTheme.CELEBRATION,
        EmotionalTheme.SUPPORT,
      ])

      const participants = normalized.participants as Array<{
        id: string
        name: string
        role: ParticipantRole
      }>
      expect(participants.map((p) => p.id)).toEqual(['a', 'b', 'c'])
    })

    it('should create a deep copy', () => {
      const originalMemory = JSON.parse(JSON.stringify(mockMemory)) // Create a fresh copy
      const normalized = normalizeMemory(originalMemory)

      // Modify the copy
      originalMemory.tags.push('new-tag')

      // Normalized should be unaffected
      expect(normalized.tags).not.toContain('new-tag')
    })
  })

  describe('extractMemoryFeatures', () => {
    it('should extract all feature categories', () => {
      const features = extractMemoryFeatures(mockMemory)

      expect(features.emotionalFeatures).toBeDefined()
      expect(features.relationshipFeatures).toBeDefined()
      expect(features.contentFeatures).toBeDefined()
      expect(features.metadata).toBeDefined()
    })

    it('should extract correct emotional features', () => {
      const features = extractMemoryFeatures(mockMemory)

      expect(features.emotionalFeatures.primaryEmotion).toBe(EmotionalState.JOY)
      expect(features.emotionalFeatures.intensity).toBe(0.9)
      expect(features.emotionalFeatures.valence).toBe(0.8)
      expect(features.emotionalFeatures.themeCount).toBe(2)
      expect(features.emotionalFeatures.hasTemporalPatterns).toBe(false)
    })

    it('should extract correct relationship features', () => {
      const features = extractMemoryFeatures(mockMemory)

      expect(features.relationshipFeatures.communicationPattern).toBe(
        CommunicationPattern.SUPPORTIVE,
      )
      expect(features.relationshipFeatures.interactionQuality).toBe(
        InteractionQuality.POSITIVE,
      )
      expect(features.relationshipFeatures.connectionStrength).toBe(0.85)
      expect(features.relationshipFeatures.hasParticipantDynamics).toBe(false)
      expect(features.relationshipFeatures.concerningPatternsCount).toBe(0)
    })

    it('should extract correct content features', () => {
      const features = extractMemoryFeatures(mockMemory)

      expect(features.contentFeatures.contentLength).toBe(46) // Length of content string
      expect(features.contentFeatures.tagCount).toBe(3)
      expect(features.contentFeatures.confidence).toBe(0.95)
      expect(features.contentFeatures.participantCount).toBe(2)
    })

    it('should extract correct metadata', () => {
      const features = extractMemoryFeatures(mockMemory)

      expect(features.metadata.schemaVersion).toBe('2.0')
      expect(features.metadata.source).toBe('text-messages')
      expect(features.metadata.processedAt).toBe('2024-01-01T00:00:00.000Z')
    })
  })

  describe('transformBatch', () => {
    const mockItems = [
      { value: 1 },
      { value: 2 },
      { value: 3 },
      { value: 4 },
      { value: 5 },
    ]

    const doubleTransformer = (item: { value: number }) => ({
      value: item.value * 2,
    })

    it('should transform all items in batch', () => {
      const results = transformBatch(mockItems, doubleTransformer)

      expect(results).toHaveLength(5)
      expect(results).toEqual([
        { value: 2 },
        { value: 4 },
        { value: 6 },
        { value: 8 },
        { value: 10 },
      ])
    })

    it('should respect batch size', () => {
      const progressCalls: Array<{ processed: number; total: number }> = []

      transformBatch(mockItems, doubleTransformer, {
        batchSize: 2,
        onProgress: (processed, total) => {
          progressCalls.push({ processed, total })
        },
      })

      expect(progressCalls).toEqual([
        { processed: 2, total: 5 },
        { processed: 4, total: 5 },
        { processed: 5, total: 5 },
      ])
    })

    it('should handle errors with error callback', () => {
      const errorItems = [
        { value: 1 },
        { value: 'invalid' }, // Will cause error
        { value: 3 },
      ]

      const errors: Array<{
        error: Error
        item: { value: unknown }
        index: number
      }> = []

      const results = transformBatch(
        errorItems,
        (item: { value: unknown }) => {
          if (typeof item.value !== 'number') {
            throw new Error('Invalid value')
          }
          return { value: item.value * 2 }
        },
        {
          onError: (error, item, index) => {
            errors.push({ error, item, index })
          },
        },
      )

      expect(results).toHaveLength(2) // Only successful transformations
      expect(errors).toHaveLength(1)
      expect(errors[0].index).toBe(1)
      expect(errors[0].item).toEqual({ value: 'invalid' })
    })

    it('should throw error when no error handler provided', () => {
      const errorItems = [
        { value: 1 },
        { value: 'invalid' }, // Will cause error
      ]

      expect(() => {
        transformBatch(errorItems, (item: { value: unknown }) => {
          if (typeof item.value !== 'number') {
            throw new Error('Invalid value')
          }
          return { value: item.value * 2 }
        })
      }).toThrow('Invalid value')
    })
  })
})
