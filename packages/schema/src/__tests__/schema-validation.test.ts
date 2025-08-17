import { describe, it, expect } from 'vitest'

import { EmotionalState, EmotionalTheme } from '../memory/emotional-context'
import { ParticipantRole } from '../memory/participants'
import {
  CommunicationPattern,
  InteractionQuality,
} from '../memory/relationship-dynamics'
import {
  validateMemory,
  validateEmotionalContext,
  validateRelationshipDynamics,
  validateParticipant,
  validateBatch,
} from '../utils/schema-validation'

describe('Schema Validation', () => {
  describe('validateMemory', () => {
    const validMemory = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      content: 'This is test content for the memory',
      timestamp: '2024-01-01T00:00:00.000Z',
      author: {
        id: 'author-1',
        name: 'Test Author',
        role: ParticipantRole.SELF,
      },
      participants: [
        {
          id: 'participant-1',
          name: 'Test Participant',
          role: ParticipantRole.FRIEND,
        },
      ],
      emotionalContext: {
        primaryEmotion: EmotionalState.JOY,
        secondaryEmotions: [EmotionalState.EXCITEMENT],
        intensity: 0.8,
        valence: 0.7,
        themes: [EmotionalTheme.CELEBRATION],
        indicators: {
          phrases: ['happy birthday'],
          emotionalWords: ['joy', 'celebration'],
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
          secure: ['trusting'],
          anxious: [],
          avoidant: [],
        },
        healthIndicators: {
          positive: ['supportive', 'caring'],
          negative: [],
          repairAttempts: [],
        },
        connectionStrength: 0.9,
      },
      tags: ['birthday', 'celebration', 'friend'],
      metadata: {
        processedAt: '2024-01-01T00:00:00.000Z',
        schemaVersion: '2.0',
        source: 'test-import',
        confidence: 0.95,
      },
    }

    it('should pass validation for valid memory', () => {
      const result = validateMemory(validMemory)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should include performance metrics when requested', () => {
      const result = validateMemory(validMemory, { includePerformance: true })

      expect(result.performance).toBeDefined()
      expect(result.performance!.validationTimeMs).toBeGreaterThan(0)
      expect(result.performance!.fieldsValidated).toBeGreaterThan(0)
    })

    it('should fail validation for missing required fields', () => {
      const invalidMemory = {
        content: 'Test content',
        // Missing other required fields
      }

      const result = validateMemory(invalidMemory)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some((e) => e.field === 'id')).toBe(true)
    })

    it('should fail validation for invalid UUID', () => {
      const invalidMemory = {
        ...validMemory,
        id: 'not-a-uuid',
      }

      const result = validateMemory(invalidMemory)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'id')).toBe(true)
    })

    it('should fail validation for invalid timestamp', () => {
      const invalidMemory = {
        ...validMemory,
        timestamp: 'not-a-datetime',
      }

      const result = validateMemory(invalidMemory)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'timestamp')).toBe(true)
    })

    it('should generate warnings for quality issues', () => {
      const lowQualityMemory = {
        ...validMemory,
        content: 'short', // Very short content
        tags: [], // No tags
        metadata: {
          ...validMemory.metadata,
          confidence: 0.3, // Low confidence
        },
      }

      const result = validateMemory(lowQualityMemory)

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(
        result.warnings.some((w) => w.field === 'metadata.confidence'),
      ).toBe(true)
      expect(result.warnings.some((w) => w.field === 'content')).toBe(true)
      expect(result.warnings.some((w) => w.field === 'tags')).toBe(true)
    })

    it('should fail in strict mode with warnings', () => {
      const lowQualityMemory = {
        ...validMemory,
        metadata: {
          ...validMemory.metadata,
          confidence: 0.3, // Low confidence (warning)
        },
      }

      const result = validateMemory(lowQualityMemory, { strict: true })

      expect(result.isValid).toBe(false) // Strict mode fails on warnings
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('should handle validation errors gracefully', () => {
      const invalidObject = null

      const result = validateMemory(invalidObject)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateEmotionalContext', () => {
    const validContext = {
      primaryEmotion: EmotionalState.JOY,
      secondaryEmotions: [EmotionalState.EXCITEMENT],
      intensity: 0.8,
      valence: 0.7,
      themes: [EmotionalTheme.CELEBRATION],
      indicators: {
        phrases: ['so happy'],
        emotionalWords: ['joy', 'excited'],
        styleIndicators: ['!', 'ALL_CAPS'],
      },
    }

    it('should pass validation for valid emotional context', () => {
      const result = validateEmotionalContext(validContext)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation for invalid emotion', () => {
      const invalidContext = {
        ...validContext,
        primaryEmotion: 'invalid_emotion',
      }

      const result = validateEmotionalContext(invalidContext)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'primaryEmotion')).toBe(true)
    })

    it('should fail validation for out-of-range intensity', () => {
      const invalidContext = {
        ...validContext,
        intensity: 1.5, // Out of range
      }

      const result = validateEmotionalContext(invalidContext)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'intensity')).toBe(true)
    })

    it('should fail validation for out-of-range valence', () => {
      const invalidContext = {
        ...validContext,
        valence: -2, // Out of range
      }

      const result = validateEmotionalContext(invalidContext)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'valence')).toBe(true)
    })

    it('should generate warnings for intensity-valence mismatch', () => {
      const conflictContext = {
        ...validContext,
        intensity: 0.9, // High intensity
        valence: 0.1, // Low valence
      }

      const result = validateEmotionalContext(conflictContext)

      expect(result.warnings.some((w) => w.field === 'intensity/valence')).toBe(
        true,
      )
    })

    it('should generate warnings for missing themes', () => {
      const noThemesContext = {
        ...validContext,
        themes: [],
      }

      const result = validateEmotionalContext(noThemesContext)

      expect(result.warnings.some((w) => w.field === 'themes')).toBe(true)
    })
  })

  describe('validateRelationshipDynamics', () => {
    const validDynamics = {
      communicationPattern: CommunicationPattern.SUPPORTIVE,
      interactionQuality: InteractionQuality.POSITIVE,
      powerDynamics: {
        isBalanced: true,
        concerningPatterns: [],
      },
      attachmentIndicators: {
        secure: ['trusting', 'open'],
        anxious: [],
        avoidant: [],
      },
      healthIndicators: {
        positive: ['supportive', 'respectful'],
        negative: [],
        repairAttempts: [],
      },
      connectionStrength: 0.8,
    }

    it('should pass validation for valid relationship dynamics', () => {
      const result = validateRelationshipDynamics(validDynamics)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation for invalid communication pattern', () => {
      const invalidDynamics = {
        ...validDynamics,
        communicationPattern: 'invalid_pattern',
      }

      const result = validateRelationshipDynamics(invalidDynamics)

      expect(result.isValid).toBe(false)
      expect(
        result.errors.some((e) => e.field === 'communicationPattern'),
      ).toBe(true)
    })

    it('should fail validation for out-of-range connection strength', () => {
      const invalidDynamics = {
        ...validDynamics,
        connectionStrength: 1.5, // Out of range
      }

      const result = validateRelationshipDynamics(invalidDynamics)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'connectionStrength')).toBe(
        true,
      )
    })

    it('should generate warnings for concerning patterns', () => {
      const concerningDynamics = {
        ...validDynamics,
        powerDynamics: {
          isBalanced: false,
          concerningPatterns: ['manipulation', 'gaslighting'],
        },
      }

      const result = validateRelationshipDynamics(concerningDynamics)

      expect(
        result.warnings.some(
          (w) => w.field === 'powerDynamics.concerningPatterns',
        ),
      ).toBe(true)
    })

    it('should generate warnings for inconsistent quality/connection', () => {
      const inconsistentDynamics = {
        ...validDynamics,
        interactionQuality: InteractionQuality.POSITIVE,
        connectionStrength: 0.2, // Low connection with positive quality
      }

      const result = validateRelationshipDynamics(inconsistentDynamics)

      expect(
        result.warnings.some(
          (w) => w.field === 'connectionStrength/interactionQuality',
        ),
      ).toBe(true)
    })
  })

  describe('validateParticipant', () => {
    const validParticipant = {
      id: 'participant-123',
      name: 'Test User',
      role: ParticipantRole.FRIEND,
      metadata: {
        sourceId: 'source-456',
        canonicalName: 'Test User',
        aliases: ['Testy', 'TU'],
        relationshipDescription: 'Close friend from college',
      },
    }

    it('should pass validation for valid participant', () => {
      const result = validateParticipant(validParticipant)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should pass validation for participant without metadata', () => {
      const minimalParticipant = {
        id: 'participant-123',
        name: 'Test User',
        role: ParticipantRole.FRIEND,
      }

      const result = validateParticipant(minimalParticipant)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation for empty id', () => {
      const invalidParticipant = {
        ...validParticipant,
        id: '',
      }

      const result = validateParticipant(invalidParticipant)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'id')).toBe(true)
    })

    it('should fail validation for empty name', () => {
      const invalidParticipant = {
        ...validParticipant,
        name: '',
      }

      const result = validateParticipant(invalidParticipant)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'name')).toBe(true)
    })

    it('should fail validation for invalid role', () => {
      const invalidParticipant = {
        ...validParticipant,
        role: 'invalid_role',
      }

      const result = validateParticipant(invalidParticipant)

      expect(result.isValid).toBe(false)
      expect(result.errors.some((e) => e.field === 'role')).toBe(true)
    })
  })

  describe('validateBatch', () => {
    const validParticipants = [
      { id: 'p1', name: 'User 1', role: ParticipantRole.SELF },
      { id: 'p2', name: 'User 2', role: ParticipantRole.FRIEND },
      { id: 'p3', name: 'User 3', role: ParticipantRole.FAMILY },
    ]

    it('should validate a batch of valid objects', () => {
      const { results, summary } = validateBatch(
        validParticipants,
        validateParticipant,
        { includePerformance: true },
      )

      expect(results).toHaveLength(3)
      expect(results.every((r) => r.isValid)).toBe(true)
      expect(summary.totalObjects).toBe(3)
      expect(summary.validObjects).toBe(3)
      expect(summary.invalidObjects).toBe(0)
      expect(summary.averageValidationTime).toBeGreaterThan(0)
    })

    it('should handle mixed valid/invalid objects', () => {
      const mixedParticipants = [
        ...validParticipants,
        { id: '', name: 'Invalid User', role: ParticipantRole.FRIEND }, // Invalid
      ]

      const { results, summary } = validateBatch(
        mixedParticipants,
        validateParticipant,
      )

      expect(results).toHaveLength(4)
      expect(summary.totalObjects).toBe(4)
      expect(summary.validObjects).toBe(3)
      expect(summary.invalidObjects).toBe(1)
      expect(summary.totalErrors).toBeGreaterThan(0)
    })

    it('should provide correct summary statistics', () => {
      const { summary } = validateBatch(validParticipants, validateParticipant)

      expect(summary.totalObjects).toBe(validParticipants.length)
      expect(summary.validObjects + summary.invalidObjects).toBe(
        summary.totalObjects,
      )
      expect(summary.totalErrors).toBe(0)
      expect(summary.totalWarnings).toBe(0)
    })
  })
})
