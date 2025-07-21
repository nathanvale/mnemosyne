import type { Memory } from '@studio/schema'

import { ValidationStatus } from '@studio/schema'
import { describe, it, expect, beforeEach } from 'vitest'

import { ValidationAnalytics } from '../analytics/validation-analytics'
import { createAutoConfirmationEngine } from '../auto-confirmation/engine'
import { DEFAULT_COVERAGE_REQUIREMENTS } from '../config/defaults'
import { createIntelligentSampler } from '../sampling/intelligent-sampler'
import { createSignificanceWeighter } from '../significance/weighter'

describe('Validation Package Integration', () => {
  let mockMemories: Memory[]
  let engine: ReturnType<typeof createAutoConfirmationEngine>
  let weighter: ReturnType<typeof createSignificanceWeighter>
  let sampler: ReturnType<typeof createIntelligentSampler>
  let analytics: ValidationAnalytics

  beforeEach(() => {
    engine = createAutoConfirmationEngine()
    weighter = createSignificanceWeighter()
    sampler = createIntelligentSampler()
    analytics = new ValidationAnalytics()

    mockMemories = [
      {
        id: 'memory-1',
        content: 'Important life milestone event',
        timestamp: '2024-01-15T10:00:00.000Z',
        author: { id: 'user-1', name: 'User' },
        participants: [{ id: 'user-1', role: 'self' }],
        emotionalContext: {
          primaryEmotion: 'joy',
          intensity: 0.9,
          emotionalStates: [{ emotion: 'joy', intensity: 0.9 }],
          themes: ['achievement', 'milestone']
        },
        relationshipDynamics: {
          communicationPatterns: ['celebration'],
          interactionQuality: 'meaningful'
        },
        tags: ['milestone', 'achievement'],
        metadata: {
          processedAt: '2024-01-15T10:30:00.000Z',
          schemaVersion: '1.0.0',
          source: 'test',
          confidence: 0.9
        }
      },
      {
        id: 'memory-2',
        content: 'Regular daily activity',
        timestamp: '2024-01-15T11:00:00.000Z',
        author: { id: 'user-1', name: 'User' },
        participants: [{ id: 'user-1', role: 'self' }],
        emotionalContext: {
          primaryEmotion: 'neutral',
          intensity: 0.3,
          emotionalStates: [{ emotion: 'neutral', intensity: 0.3 }],
          themes: ['routine']
        },
        relationshipDynamics: {
          communicationPatterns: ['casual'],
          interactionQuality: 'routine'
        },
        tags: ['daily', 'routine'],
        metadata: {
          processedAt: '2024-01-15T11:30:00.000Z',
          schemaVersion: '1.0.0',
          source: 'test',
          confidence: 0.5
        }
      }
    ] as Memory[]
  })

  describe('End-to-End Validation Workflow', () => {
    it('processes memories through complete validation pipeline', () => {
      // Step 1: Auto-confirmation
      const batchResult = engine.processBatch(mockMemories)
      expect(batchResult.totalMemories).toBe(2)
      expect(batchResult.results).toHaveLength(2)

      // Step 2: Significance weighting for memories needing review
      const needsReviewMemories = mockMemories.filter((_, index) => 
        batchResult.results[index].decision === 'needs-review'
      )
      
      if (needsReviewMemories.length > 0) {
        const prioritized = weighter.prioritizeMemories(needsReviewMemories)
        expect(prioritized.memories).toHaveLength(needsReviewMemories.length)
        expect(prioritized.significanceDistribution).toBeDefined()
      }

      // Step 3: Analytics tracking
      analytics.recordBatchValidation(batchResult)
      const report = analytics.getAnalyticsReport()
      expect(report.performance.totalMemoriesProcessed).toBe(2)
    })

    it('handles intelligent sampling for large datasets', () => {
      // Create larger dataset (larger than DEFAULT_SAMPLING_STRATEGY.parameters.targetSize which is 100)
      const largeDataset = Array(150).fill(null).map((_, i) => ({
        ...mockMemories[i % 2],
        id: `memory-${i}`,
        timestamp: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
      })) as Memory[]

      const sampledMemories = sampler.sampleForValidation(largeDataset, DEFAULT_COVERAGE_REQUIREMENTS)
      
      expect(sampledMemories.samples.length).toBeGreaterThan(0)
      expect(sampledMemories.samples.length).toBeLessThan(largeDataset.length)
      expect(sampledMemories.coverage.overallScore).toBeGreaterThan(0)
      expect(sampledMemories.metadata.samplingRate).toBeLessThan(1)
    })

    it('optimizes validation queue based on resources', () => {
      const queue = {
        id: 'test-queue',
        pendingMemories: mockMemories,
        resourceAllocation: {
          availableTime: 30,
          targetDate: '2024-01-16T10:00:00.000Z',
          validatorExpertise: 'intermediate' as const
        }
      }

      const optimized = weighter.optimizeReviewQueue(queue)
      
      expect(optimized.optimizedOrder.length).toBeLessThanOrEqual(mockMemories.length)
      expect(optimized.strategy.expectedOutcomes.estimatedTime).toBeGreaterThan(0)
    })
  })

  describe('Configuration and Feedback Loop', () => {
    it('learns from validation feedback to improve accuracy', () => {
      // Initial batch
      const initialResult = engine.processBatch(mockMemories)
      
      // Simulate human feedback
      const feedback = initialResult.results.map(result => ({
        memoryId: result.memoryId,
        originalResult: result,
        humanDecision: result.decision === 'auto-approve' ? ValidationStatus.VALIDATED : ValidationStatus.REJECTED,
        timestamp: new Date().toISOString()
      }))

      // Record feedback and update thresholds
      analytics.recordValidationFeedback(feedback)
      const thresholdUpdate = engine.updateThresholds(feedback)
      
      expect(thresholdUpdate.recommendedThresholds).toBeDefined()
      expect(thresholdUpdate.updateReasons).toBeInstanceOf(Array)
    })

    it('provides comprehensive analytics reporting', () => {
      // Process multiple batches
      for (let i = 0; i < 3; i++) {
        const result = engine.processBatch(mockMemories)
        analytics.recordBatchValidation(result)
      }

      const report = analytics.getAnalyticsReport()
      
      expect(report.timestamp).toBeTruthy()
      expect(report.performance.totalMemoriesProcessed).toBe(6)
      expect(report.batchTrends.length).toBeGreaterThan(0)
      expect(report.systemHealth.overall).toMatch(/healthy|warning|critical/)
      expect(report.recommendations).toBeInstanceOf(Array)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('handles empty memory sets gracefully', () => {
      const emptyResult = engine.processBatch([])
      expect(emptyResult.totalMemories).toBe(0)
      
      const emptyPrioritized = weighter.prioritizeMemories([])
      expect(emptyPrioritized.totalCount).toBe(0)
      
      const emptySample = sampler.sampleForValidation([], DEFAULT_COVERAGE_REQUIREMENTS)
      expect(emptySample.samples).toHaveLength(0)
    })

    it('handles malformed memory data', () => {
      const malformedMemory = {
        id: 'malformed',
        content: '',
        timestamp: 'invalid-date',
        participants: null,
        emotionalContext: null,
        relationshipDynamics: null,
        tags: [],
        metadata: {
          processedAt: 'invalid-date',
          confidence: 'not-a-number'
        }
      } as any

      expect(() => {
        engine.evaluateMemory(malformedMemory)
      }).not.toThrow()

      expect(() => {
        weighter.calculateSignificance(malformedMemory)
      }).not.toThrow()
    })
  })
})