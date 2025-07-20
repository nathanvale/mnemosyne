import { describe, it, expect } from 'vitest'

import { EmotionalState, EmotionalTheme } from '../memory/emotional-context.js'
import { ParticipantRole } from '../memory/participants.js'
import {
  CommunicationPattern,
  InteractionQuality,
} from '../memory/relationship-dynamics.js'
import {
  isMemory,
  isMemoryMetadata,
  isEmotionalContext,
  isParticipant,
  isParticipantArray,
  isEmotionalState,
  isEmotionalTheme,
  isCommunicationPattern,
  isInteractionQuality,
  isParticipantRole,
  isNonEmptyString,
  isUUID,
  isISODateTime,
  isNumberInRange,
  hasProperty,
} from '../utils/type-guards.js'

describe('Type Guards', () => {
  describe('isMemory', () => {
    it('should return true for valid memory object', () => {
      const validMemory = {
        id: 'test-id',
        content: 'Test content',
        timestamp: '2024-01-01T00:00:00.000Z',
        author: { id: 'author-1', name: 'Test Author', role: 'self' },
        participants: [
          { id: 'participant-1', name: 'Test Participant', role: 'friend' },
        ],
        emotionalContext: { primaryEmotion: 'joy', intensity: 0.8 },
        relationshipDynamics: {
          communicationPattern: 'open',
          connectionStrength: 0.7,
        },
        tags: ['test', 'memory'],
        metadata: {
          processedAt: '2024-01-01T00:00:00.000Z',
          schemaVersion: '2.0',
          source: 'test',
          confidence: 0.9,
        },
      }

      expect(isMemory(validMemory)).toBe(true)
    })

    it('should return false for null or undefined', () => {
      expect(isMemory(null)).toBe(false)
      expect(isMemory(undefined)).toBe(false)
    })

    it('should return false for non-object values', () => {
      expect(isMemory('string')).toBe(false)
      expect(isMemory(123)).toBe(false)
      expect(isMemory(true)).toBe(false)
    })

    it('should return false for object missing required fields', () => {
      const invalidMemory = {
        id: 'test-id',
        content: 'Test content',
        // Missing other required fields
      }

      expect(isMemory(invalidMemory)).toBe(false)
    })

    it('should return false for invalid tags array', () => {
      const invalidMemory = {
        id: 'test-id',
        content: 'Test content',
        timestamp: '2024-01-01T00:00:00.000Z',
        author: {},
        participants: [],
        emotionalContext: {},
        relationshipDynamics: {},
        tags: ['valid', 123, 'invalid'], // Contains non-string
        metadata: {
          processedAt: '2024-01-01T00:00:00.000Z',
          schemaVersion: '2.0',
          source: 'test',
          confidence: 0.9,
        },
      }

      expect(isMemory(invalidMemory)).toBe(false)
    })
  })

  describe('isMemoryMetadata', () => {
    it('should return true for valid metadata', () => {
      const validMetadata = {
        processedAt: '2024-01-01T00:00:00.000Z',
        schemaVersion: '2.0',
        source: 'test',
        confidence: 0.9,
      }

      expect(isMemoryMetadata(validMetadata)).toBe(true)
    })

    it('should return false for invalid confidence values', () => {
      const invalidMetadata = {
        processedAt: '2024-01-01T00:00:00.000Z',
        schemaVersion: '2.0',
        source: 'test',
        confidence: 1.5, // Out of range
      }

      expect(isMemoryMetadata(invalidMetadata)).toBe(false)
    })

    it('should return false for missing fields', () => {
      const invalidMetadata = {
        processedAt: '2024-01-01T00:00:00.000Z',
        schemaVersion: '2.0',
        // Missing source and confidence
      }

      expect(isMemoryMetadata(invalidMetadata)).toBe(false)
    })
  })

  describe('isEmotionalContext', () => {
    it('should return true for valid emotional context', () => {
      const validContext = {
        primaryEmotion: EmotionalState.JOY,
        secondaryEmotions: [EmotionalState.EXCITEMENT],
        intensity: 0.8,
        valence: 0.7,
        themes: [EmotionalTheme.CELEBRATION],
        indicators: {
          phrases: ['happy', 'excited'],
          emotionalWords: ['joy', 'celebration'],
          styleIndicators: ['!', 'caps'],
        },
      }

      expect(isEmotionalContext(validContext)).toBe(true)
    })

    it('should return false for invalid intensity values', () => {
      const invalidContext = {
        primaryEmotion: EmotionalState.JOY,
        secondaryEmotions: [],
        intensity: 1.5, // Out of range
        valence: 0.7,
        themes: [],
        indicators: {
          phrases: [],
          emotionalWords: [],
          styleIndicators: [],
        },
      }

      expect(isEmotionalContext(invalidContext)).toBe(false)
    })

    it('should return false for invalid valence values', () => {
      const invalidContext = {
        primaryEmotion: EmotionalState.JOY,
        secondaryEmotions: [],
        intensity: 0.8,
        valence: -2, // Out of range
        themes: [],
        indicators: {
          phrases: [],
          emotionalWords: [],
          styleIndicators: [],
        },
      }

      expect(isEmotionalContext(invalidContext)).toBe(false)
    })
  })

  describe('isEmotionalState', () => {
    it('should return true for valid emotional states', () => {
      expect(isEmotionalState(EmotionalState.JOY)).toBe(true)
      expect(isEmotionalState(EmotionalState.SADNESS)).toBe(true)
      expect(isEmotionalState(EmotionalState.ANGER)).toBe(true)
      expect(isEmotionalState('neutral')).toBe(true)
    })

    it('should return false for invalid emotional states', () => {
      expect(isEmotionalState('invalid')).toBe(false)
      expect(isEmotionalState(123)).toBe(false)
      expect(isEmotionalState(null)).toBe(false)
      expect(isEmotionalState('')).toBe(false)
    })
  })

  describe('isEmotionalTheme', () => {
    it('should return true for valid emotional themes', () => {
      expect(isEmotionalTheme(EmotionalTheme.SUPPORT)).toBe(true)
      expect(isEmotionalTheme(EmotionalTheme.CONFLICT)).toBe(true)
      expect(isEmotionalTheme('celebration')).toBe(true)
    })

    it('should return false for invalid emotional themes', () => {
      expect(isEmotionalTheme('invalid')).toBe(false)
      expect(isEmotionalTheme(123)).toBe(false)
      expect(isEmotionalTheme(null)).toBe(false)
    })
  })

  describe('isCommunicationPattern', () => {
    it('should return true for valid communication patterns', () => {
      expect(isCommunicationPattern(CommunicationPattern.OPEN)).toBe(true)
      expect(isCommunicationPattern(CommunicationPattern.SUPPORTIVE)).toBe(true)
      expect(isCommunicationPattern('intimate')).toBe(true)
    })

    it('should return false for invalid communication patterns', () => {
      expect(isCommunicationPattern('invalid')).toBe(false)
      expect(isCommunicationPattern(123)).toBe(false)
      expect(isCommunicationPattern(null)).toBe(false)
    })
  })

  describe('isInteractionQuality', () => {
    it('should return true for valid interaction qualities', () => {
      expect(isInteractionQuality(InteractionQuality.POSITIVE)).toBe(true)
      expect(isInteractionQuality(InteractionQuality.NEGATIVE)).toBe(true)
      expect(isInteractionQuality('neutral')).toBe(true)
    })

    it('should return false for invalid interaction qualities', () => {
      expect(isInteractionQuality('invalid')).toBe(false)
      expect(isInteractionQuality(123)).toBe(false)
      expect(isInteractionQuality(null)).toBe(false)
    })
  })

  describe('isParticipantRole', () => {
    it('should return true for valid participant roles', () => {
      expect(isParticipantRole(ParticipantRole.SELF)).toBe(true)
      expect(isParticipantRole(ParticipantRole.FRIEND)).toBe(true)
      expect(isParticipantRole('family')).toBe(true)
    })

    it('should return false for invalid participant roles', () => {
      expect(isParticipantRole('invalid')).toBe(false)
      expect(isParticipantRole(123)).toBe(false)
      expect(isParticipantRole(null)).toBe(false)
    })
  })

  describe('isParticipant', () => {
    it('should return true for valid participant', () => {
      const validParticipant = {
        id: 'participant-1',
        name: 'Test User',
        role: ParticipantRole.FRIEND,
      }

      expect(isParticipant(validParticipant)).toBe(true)
    })

    it('should return true for participant with metadata', () => {
      const validParticipant = {
        id: 'participant-1',
        name: 'Test User',
        role: ParticipantRole.FRIEND,
        metadata: {
          sourceId: 'source-123',
          canonicalName: 'Test User',
          aliases: ['Testy', 'TU'],
          relationshipDescription: 'Close friend',
        },
      }

      expect(isParticipant(validParticipant)).toBe(true)
    })

    it('should return false for missing required fields', () => {
      const invalidParticipant = {
        id: 'participant-1',
        name: 'Test User',
        // Missing role
      }

      expect(isParticipant(invalidParticipant)).toBe(false)
    })

    it('should return false for empty strings', () => {
      const invalidParticipant = {
        id: '',
        name: 'Test User',
        role: ParticipantRole.FRIEND,
      }

      expect(isParticipant(invalidParticipant)).toBe(false)
    })
  })

  describe('isParticipantArray', () => {
    it('should return true for valid participant array', () => {
      const validArray = [
        { id: 'p1', name: 'User 1', role: ParticipantRole.SELF },
        { id: 'p2', name: 'User 2', role: ParticipantRole.FRIEND },
      ]

      expect(isParticipantArray(validArray)).toBe(true)
    })

    it('should return true for empty array', () => {
      expect(isParticipantArray([])).toBe(true)
    })

    it('should return false for non-array', () => {
      expect(isParticipantArray('not an array')).toBe(false)
      expect(isParticipantArray(null)).toBe(false)
    })

    it('should return false for array with invalid participants', () => {
      const invalidArray = [
        { id: 'p1', name: 'User 1', role: ParticipantRole.SELF },
        { id: '', name: 'User 2', role: ParticipantRole.FRIEND }, // Invalid
      ]

      expect(isParticipantArray(invalidArray)).toBe(false)
    })
  })

  describe('isNonEmptyString', () => {
    it('should return true for non-empty strings', () => {
      expect(isNonEmptyString('hello')).toBe(true)
      expect(isNonEmptyString(' ')).toBe(true) // Space is not empty
      expect(isNonEmptyString('123')).toBe(true)
    })

    it('should return false for empty string', () => {
      expect(isNonEmptyString('')).toBe(false)
    })

    it('should return false for non-string values', () => {
      expect(isNonEmptyString(123)).toBe(false)
      expect(isNonEmptyString(null)).toBe(false)
      expect(isNonEmptyString(undefined)).toBe(false)
      expect(isNonEmptyString({})).toBe(false)
    })
  })

  describe('isUUID', () => {
    it('should return true for valid UUIDs', () => {
      expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
      expect(isUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true)
      expect(isUUID('6ba7b811-9dad-11d1-80b4-00c04fd430c8')).toBe(true)
    })

    it('should return false for invalid UUIDs', () => {
      expect(isUUID('not-a-uuid')).toBe(false)
      expect(isUUID('550e8400-e29b-41d4-a716-44665544000')).toBe(false) // Too short
      expect(isUUID('550e8400-e29b-41d4-a716-4466554400000')).toBe(false) // Too long
      expect(isUUID('550e8400-e29b-41d4-a716-44665544000g')).toBe(false) // Invalid character
      expect(isUUID(123)).toBe(false)
      expect(isUUID(null)).toBe(false)
    })
  })

  describe('isISODateTime', () => {
    it('should return true for valid ISO datetime strings', () => {
      expect(isISODateTime('2024-01-01T00:00:00.000Z')).toBe(true)
      expect(isISODateTime('2023-12-25T15:30:45.123Z')).toBe(true)
      expect(isISODateTime(new Date().toISOString())).toBe(true)
    })

    it('should return false for invalid datetime strings', () => {
      expect(isISODateTime('2024-01-01')).toBe(false) // Missing time
      expect(isISODateTime('not-a-date')).toBe(false)
      expect(isISODateTime('2024-13-01T00:00:00.000Z')).toBe(false) // Invalid month
      expect(isISODateTime(123)).toBe(false)
      expect(isISODateTime(null)).toBe(false)
    })
  })

  describe('isNumberInRange', () => {
    it('should return true for numbers within range', () => {
      expect(isNumberInRange(5, 0, 10)).toBe(true)
      expect(isNumberInRange(0, 0, 10)).toBe(true) // Edge case: min
      expect(isNumberInRange(10, 0, 10)).toBe(true) // Edge case: max
      expect(isNumberInRange(0.5, 0, 1)).toBe(true)
    })

    it('should return false for numbers outside range', () => {
      expect(isNumberInRange(-1, 0, 10)).toBe(false)
      expect(isNumberInRange(11, 0, 10)).toBe(false)
      expect(isNumberInRange(1.1, 0, 1)).toBe(false)
    })

    it('should return false for non-numbers', () => {
      expect(isNumberInRange('5', 0, 10)).toBe(false)
      expect(isNumberInRange(null, 0, 10)).toBe(false)
      expect(isNumberInRange(NaN, 0, 10)).toBe(false)
    })
  })

  describe('hasProperty', () => {
    it('should return true when object has property', () => {
      const obj = { name: 'test', value: 123 }

      expect(hasProperty(obj, 'name')).toBe(true)
      expect(hasProperty(obj, 'value')).toBe(true)
    })

    it('should return false when object does not have property', () => {
      const obj = { name: 'test' }

      expect(hasProperty(obj, 'missing')).toBe(false)
    })

    it('should provide type narrowing', () => {
      const obj: { name?: string; value?: number } = { name: 'test' }

      if (hasProperty(obj, 'name')) {
        // TypeScript should infer that obj.name exists
        expect(typeof obj.name).toBe('string')
      }
    })
  })
})
