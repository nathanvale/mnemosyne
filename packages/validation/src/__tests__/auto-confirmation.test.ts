import type { Memory } from '@studio/schema'

import { ValidationStatus } from '@studio/schema'
import { describe, it, expect, beforeEach } from 'vitest'

import { ConfidenceCalculator } from '../auto-confirmation/confidence-calculator'
import { createAutoConfirmationEngine } from '../auto-confirmation/engine'
import { ThresholdManager } from '../auto-confirmation/threshold-manager'
import { DEFAULT_THRESHOLD_CONFIG } from '../config/defaults'

describe('Auto-confirmation Engine', () => {
  let engine: ReturnType<typeof createAutoConfirmationEngine>
  let mockMemory: Memory

  beforeEach(() => {
    engine = createAutoConfirmationEngine()

    mockMemory = {
      id: 'test-memory-1',
      content: 'This is a test memory with meaningful emotional content',
      timestamp: '2024-01-15T10:30:00.000Z',
      author: { id: 'user-1', name: 'Test User' },
      participants: [
        { id: 'user-1', name: 'Test User', role: 'self' },
        { id: 'user-2', name: 'Friend', role: 'friend' },
      ],
      emotionalContext: {
        primaryEmotion: 'joy',
        intensity: 0.8,
        emotionalStates: [{ emotion: 'joy', intensity: 0.8 }],
        themes: ['celebration', 'friendship'],
      },
      relationshipDynamics: {
        communicationPatterns: ['supportive'],
        interactionQuality: 'meaningful',
      },
      tags: ['birthday', 'celebration', 'friends'],
      metadata: {
        processedAt: '2024-01-15T11:00:00.000Z',
        schemaVersion: '1.0.0',
        source: 'test',
        confidence: 0.85,
      },
    } as any
  })

  describe('evaluateMemory', () => {
    it('auto-approves high-confidence memories', () => {
      const result = engine.evaluateMemory(mockMemory)

      expect(result.memoryId).toBe('test-memory-1')
      expect(result.decision).toBe('auto-approve')
      expect(result.confidence).toBeGreaterThan(0.75)
      expect(result.reasons.length).toBeGreaterThan(0)
      expect(result.reasons[0]).toContain('threshold')
    })

    it('routes low-confidence memories for review', () => {
      // Lower the confidence factors
      mockMemory.metadata.confidence = 0.3
      mockMemory.emotionalContext = null as any

      const result = engine.evaluateMemory(mockMemory)

      expect(result.decision).toBe('needs-review')
      expect(result.confidence).toBeLessThan(0.75)
      expect(result.suggestedActions).toBeDefined()
    })

    it('auto-rejects very low confidence memories', () => {
      // Create a very poor quality memory
      mockMemory.metadata.confidence = 0.2
      mockMemory.emotionalContext = null as any
      mockMemory.relationshipDynamics = null as any
      mockMemory.content = 'x'

      const result = engine.evaluateMemory(mockMemory)

      expect(result.decision).toBe('auto-reject')
      expect(result.confidence).toBeLessThan(0.5)
    })

    it('includes confidence factors breakdown', () => {
      const result = engine.evaluateMemory(mockMemory)

      expect(result.confidenceFactors).toBeDefined()
      expect(result.confidenceFactors.claudeConfidence).toBeGreaterThan(0)
      expect(result.confidenceFactors.emotionalCoherence).toBeGreaterThan(0)
      expect(result.confidenceFactors.relationshipAccuracy).toBeGreaterThan(0)
      expect(result.confidenceFactors.temporalConsistency).toBeGreaterThan(0)
      expect(result.confidenceFactors.contentQuality).toBeGreaterThan(0)
    })
  })

  describe('processBatch', () => {
    it('processes multiple memories correctly', () => {
      const memories = [
        mockMemory,
        {
          ...mockMemory,
          id: 'test-memory-2',
          metadata: { ...mockMemory.metadata, confidence: 0.4 },
          emotionalContext: null as any,
        },
        {
          ...mockMemory,
          id: 'test-memory-3',
          metadata: { ...mockMemory.metadata, confidence: 0.2 },
          emotionalContext: null as any,
          relationshipDynamics: null as any,
        },
      ] as Memory[]

      const result = engine.processBatch(memories)

      expect(result.totalMemories).toBe(3)
      expect(result.results).toHaveLength(3)
      expect(result.decisions.autoApproved).toBeGreaterThan(0)
      expect(result.decisions.needsReview).toBeGreaterThanOrEqual(0)
      expect(result.batchConfidence).toBeLessThan(1)
      expect(result.processingTime).toBeGreaterThanOrEqual(0)
    })

    it('handles empty batch gracefully', () => {
      const result = engine.processBatch([])

      expect(result.totalMemories).toBe(0)
      expect(result.results).toHaveLength(0)
      expect(result.batchConfidence).toBe(0)
    })
  })

  describe('configuration management', () => {
    it('allows updating thresholds', () => {
      const newConfig = {
        ...DEFAULT_THRESHOLD_CONFIG,
        autoApproveThreshold: 0.9,
      }

      engine.setConfig(newConfig)
      const retrievedConfig = engine.getConfig()

      expect(retrievedConfig.autoApproveThreshold).toBe(0.9)
    })

    it('updates thresholds based on feedback', () => {
      const feedback = [
        {
          memoryId: 'test-memory-1',
          originalResult: {
            memoryId: 'test-memory-1',
            decision: 'auto-approve' as const,
            confidence: 0.8,
            confidenceFactors: {
              claudeConfidence: 0.8,
              emotionalCoherence: 0.7,
              relationshipAccuracy: 0.8,
              temporalConsistency: 0.9,
              contentQuality: 0.7,
            },
            reasons: ['High confidence'],
          },
          humanDecision: ValidationStatus.REJECTED,
          timestamp: '2024-01-15T12:00:00.000Z',
        },
      ]

      const update = engine.updateThresholds(feedback)

      expect(update.previousThresholds).toBeDefined()
      expect(update.recommendedThresholds).toBeDefined()
      expect(update.updateReasons.length).toBeGreaterThan(0)
      expect(update.updateReasons.some(reason => reason.includes('threshold'))).toBe(true)
    })
  })
})

describe('ConfidenceCalculator', () => {
  let calculator: ConfidenceCalculator
  let mockMemory: Memory

  beforeEach(() => {
    calculator = new ConfidenceCalculator(DEFAULT_THRESHOLD_CONFIG)

    mockMemory = {
      id: 'test-memory-1',
      content: 'This is meaningful content with sufficient length and quality',
      timestamp: '2024-01-15T10:30:00.000Z',
      participants: [{ id: 'user-1' }, { id: 'user-2' }],
      emotionalContext: {
        primaryEmotion: 'joy',
        intensity: 0.8,
        emotionalStates: [{ emotion: 'joy' }],
        themes: ['celebration'],
      },
      relationshipDynamics: {
        communicationPatterns: ['supportive'],
        interactionQuality: 'meaningful',
      },
      tags: ['birthday', 'celebration'],
      metadata: {
        processedAt: '2024-01-15T11:00:00.000Z',
        confidence: 0.8,
      },
    } as any
  })

  it('calculates confidence factors correctly', () => {
    const result = calculator.calculateConfidence(mockMemory)

    expect(result.overall).toBeGreaterThan(0)
    expect(result.overall).toBeLessThanOrEqual(1)
    expect(result.factors.claudeConfidence).toBe(0.8)
    expect(result.factors.emotionalCoherence).toBeGreaterThan(0.5)
    expect(result.factors.relationshipAccuracy).toBeGreaterThan(0.5)
    expect(result.factors.temporalConsistency).toBeGreaterThan(0.5)
    expect(result.factors.contentQuality).toBeGreaterThan(0.5)
  })

  it('handles missing emotional context', () => {
    mockMemory.emotionalContext = null as any

    const result = calculator.calculateConfidence(mockMemory)

    expect(result.factors.emotionalCoherence).toBeLessThan(0.5)
  })

  it('handles invalid timestamps gracefully', () => {
    mockMemory.timestamp = 'invalid-date'

    const result = calculator.calculateConfidence(mockMemory)

    expect(result.factors.temporalConsistency).toBeLessThan(0.8)
  })
})

describe('ThresholdManager', () => {
  let manager: ThresholdManager

  beforeEach(() => {
    manager = new ThresholdManager()
  })

  it('initializes with default configuration', () => {
    const config = manager.getConfig()

    expect(config.autoApproveThreshold).toBe(
      DEFAULT_THRESHOLD_CONFIG.autoApproveThreshold,
    )
    expect(config.autoRejectThreshold).toBe(
      DEFAULT_THRESHOLD_CONFIG.autoRejectThreshold,
    )
  })

  it('calculates threshold updates from feedback', () => {
    const feedback = [
      {
        memoryId: 'test-1',
        originalResult: {
          memoryId: 'test-1',
          decision: 'auto-approve' as const,
          confidence: 0.8,
          confidenceFactors: {
            claudeConfidence: 0.8,
            emotionalCoherence: 0.7,
            relationshipAccuracy: 0.8,
            temporalConsistency: 0.9,
            contentQuality: 0.7,
          },
          reasons: [],
        },
        humanDecision: ValidationStatus.REJECTED,
        timestamp: '2024-01-15T12:00:00.000Z',
      },
    ]

    const update = manager.calculateThresholdUpdate(feedback)

    expect(update.recommendedThresholds.autoApproveThreshold).toBeGreaterThan(
      update.previousThresholds.autoApproveThreshold,
    )
    expect(update.updateReasons.length).toBeGreaterThan(0)
    expect(update.updateReasons.some(reason => reason.includes('threshold'))).toBe(true)
  })

  it('handles empty feedback gracefully', () => {
    const update = manager.calculateThresholdUpdate([])

    expect(update.recommendedThresholds).toEqual(manager.getConfig())
    expect(update.expectedAccuracyImprovement).toBe(0)
  })
})
