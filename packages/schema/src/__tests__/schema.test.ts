import { describe, expect, it } from 'vitest'

import {
  EmotionalState,
  MemorySchema,
  SCHEMA_VERSION,
  ParticipantRole,
  ValidationStatus,
  CommunicationPattern,
  InteractionQuality,
} from '../index'

describe('Schema Package', () => {
  it('exports all necessary types and enums', () => {
    expect(EmotionalState.JOY).toBe('joy')
    expect(ParticipantRole.SELF).toBe('self')
    expect(ValidationStatus.VALIDATED).toBe('validated')
    expect(CommunicationPattern.OPEN).toBe('open')
    expect(InteractionQuality.POSITIVE).toBe('positive')
  })

  it('exports schema version', () => {
    expect(SCHEMA_VERSION).toBe('1.0.0')
  })

  it('validates a basic memory structure', () => {
    const validMemory = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      content: 'Test message content',
      timestamp: '2024-01-01T00:00:00.000Z',
      author: {
        id: 'user-1',
        name: 'Test User',
        role: 'self',
      },
      participants: [
        {
          id: 'user-1',
          name: 'Test User',
          role: 'self',
        },
      ],
      emotionalContext: {
        primaryEmotion: 'joy',
        secondaryEmotions: [],
        intensity: 0.7,
        valence: 0.8,
        themes: ['celebration'],
        indicators: {
          phrases: ['great news'],
          emotionalWords: ['excited'],
          styleIndicators: ['!'],
        },
      },
      relationshipDynamics: {
        communicationPattern: 'open',
        interactionQuality: 'positive',
        powerDynamics: {
          isBalanced: true,
          concerningPatterns: [],
        },
        attachmentIndicators: {
          secure: ['supportive language'],
          anxious: [],
          avoidant: [],
        },
        healthIndicators: {
          positive: ['trust', 'respect'],
          negative: [],
          repairAttempts: [],
        },
        connectionStrength: 0.8,
      },
      tags: ['personal', 'celebration'],
      metadata: {
        processedAt: '2024-01-01T00:00:00.000Z',
        schemaVersion: '1.0.0',
        source: 'test',
        confidence: 0.9,
      },
    }

    expect(() => MemorySchema.parse(validMemory)).not.toThrow()
  })
})
