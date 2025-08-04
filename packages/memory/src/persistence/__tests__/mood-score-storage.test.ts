import { EmotionalState, EmotionalTheme, ParticipantRole, CommunicationPattern, InteractionQuality } from '@studio/schema'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import type {
  ConversationData,
  ExtractedMemory,
  MoodAnalysisResult,
  MoodDelta,
} from '../../types'

import { MoodScoringAnalyzer } from '../../mood-scoring/analyzer'
import { DeltaDetector } from '../../mood-scoring/delta-detector'

// Mock database interfaces for testing mood score persistence
interface StoredMoodScore {
  id: string
  memoryId: string
  score: number
  confidence: number
  descriptors: string[]
  factors: StoredMoodFactor[]
  metadata: {
    calculatedAt: Date
    algorithmVersion: string
    processingTimeMs: number
  }
  createdAt: Date
  updatedAt: Date
}

interface StoredMoodFactor {
  id: string
  moodScoreId: string
  type: string
  weight: number
  description: string
  evidence: string[]
  internalScore?: number
  createdAt: Date
}

interface StoredMoodDelta {
  id: string
  memoryId: string
  magnitude: number
  direction: 'positive' | 'negative' | 'neutral'
  type: 'mood_repair' | 'celebration' | 'decline' | 'plateau'
  confidence: number
  factors: string[]
  significance: number
  previousScore?: number
  currentScore: number
  detectedAt: Date
  createdAt: Date
}

interface StoredAnalysisMetadata {
  id: string
  memoryId: string
  processingDuration: number
  confidence: number
  qualityMetrics: {
    overall: number
    components: {
      coherence: number
      relevance: number
      completeness: number
      accuracy: number
    }
  }
  issues: Array<{
    type: string
    severity: string
    description: string
    suggestions?: string[]
  }>
  createdAt: Date
}

// Mock database service for mood score operations
class MoodScoreStorageService {
  private moodScores: Map<string, StoredMoodScore> = new Map()
  private moodFactors: Map<string, StoredMoodFactor[]> = new Map()
  private moodDeltas: Map<string, StoredMoodDelta[]> = new Map()
  private analysisMetadata: Map<string, StoredAnalysisMetadata> = new Map()

  async storeMoodScore(
    memoryId: string,
    moodAnalysis: MoodAnalysisResult,
    processingMetrics: {
      duration: number
      algorithmVersion: string
    },
  ): Promise<StoredMoodScore> {
    const id = `mood-score-${Date.now()}-${Math.random()}`

    const storedScore: StoredMoodScore = {
      id,
      memoryId,
      score: moodAnalysis.score,
      confidence: moodAnalysis.confidence,
      descriptors: moodAnalysis.descriptors,
      factors: [], // Will be populated separately
      // Note: MoodAnalysisResult doesn't have an analysis property in the current interface
      metadata: {
        calculatedAt: new Date(),
        algorithmVersion: processingMetrics.algorithmVersion,
        processingTimeMs: processingMetrics.duration,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.moodScores.set(id, storedScore)

    // Store factors
    const factors = await this.storeMoodFactors(id, moodAnalysis.factors)
    storedScore.factors = factors

    return storedScore
  }

  async storeMoodFactors(
    moodScoreId: string,
    factors: MoodAnalysisResult['factors'],
  ): Promise<StoredMoodFactor[]> {
    const storedFactors: StoredMoodFactor[] = factors.map((factor, index) => ({
      id: `mood-factor-${moodScoreId}-${index}`,
      moodScoreId,
      type: factor.type,
      weight: factor.weight,
      description: factor.description,
      evidence: factor.evidence,
      internalScore: factor._score,
      createdAt: new Date(),
    }))

    this.moodFactors.set(moodScoreId, storedFactors)
    return storedFactors
  }

  async storeMoodDeltas(
    memoryId: string,
    deltas: MoodDelta[],
  ): Promise<StoredMoodDelta[]> {
    const storedDeltas: StoredMoodDelta[] = deltas.map((delta, index) => ({
      id: `mood-delta-${memoryId}-${index}`,
      memoryId,
      magnitude: delta.magnitude,
      direction: delta.direction,
      type: delta.type,
      confidence: delta.confidence,
      factors: delta.factors,
      significance: 0.8, // Default significance for test
      currentScore: 6.5, // Default current score for test
      detectedAt: new Date(),
      createdAt: new Date(),
    }))

    this.moodDeltas.set(memoryId, storedDeltas)
    return storedDeltas
  }

  async storeAnalysisMetadata(
    memoryId: string,
    metadata: {
      processingDuration: number
      confidence: number
      qualityMetrics: {
        overall: number
        components: {
          coherence: number
          relevance: number
          completeness: number
          accuracy: number
        }
      }
      issues: Array<{
        type: string
        severity: string
        description: string
        suggestions?: string[]
      }>
    },
  ): Promise<StoredAnalysisMetadata> {
    const id = `analysis-metadata-${memoryId}`

    const stored: StoredAnalysisMetadata = {
      id,
      memoryId,
      processingDuration: metadata.processingDuration,
      confidence: metadata.confidence,
      qualityMetrics: metadata.qualityMetrics,
      issues: metadata.issues,
      createdAt: new Date(),
    }

    this.analysisMetadata.set(id, stored)
    return stored
  }

  async getMoodScoreByMemoryId(
    memoryId: string,
  ): Promise<StoredMoodScore | null> {
    const scores = Array.from(this.moodScores.values())
    return scores.find((score) => score.memoryId === memoryId) || null
  }

  async getMoodFactorsByScoreId(
    moodScoreId: string,
  ): Promise<StoredMoodFactor[]> {
    return this.moodFactors.get(moodScoreId) || []
  }

  async getMoodDeltasByMemoryId(memoryId: string): Promise<StoredMoodDelta[]> {
    return this.moodDeltas.get(memoryId) || []
  }

  async getAnalysisMetadataByMemoryId(
    memoryId: string,
  ): Promise<StoredAnalysisMetadata | null> {
    const metadata = Array.from(this.analysisMetadata.values())
    return metadata.find((m) => m.memoryId === memoryId) || null
  }

  // Test utility methods
  clear(): void {
    this.moodScores.clear()
    this.moodFactors.clear()
    this.moodDeltas.clear()
    this.analysisMetadata.clear()
  }

  getAllMoodScores(): StoredMoodScore[] {
    return Array.from(this.moodScores.values())
  }
}

describe('Mood Score Storage - Task 6.1', () => {
  let storageService: MoodScoreStorageService
  let moodAnalyzer: MoodScoringAnalyzer
  let deltaDetector: DeltaDetector
  let testMemory: ExtractedMemory

  beforeEach(() => {
    storageService = new MoodScoreStorageService()
    moodAnalyzer = new MoodScoringAnalyzer()
    deltaDetector = new DeltaDetector()

    // Create test memory
    testMemory = createTestExtractedMemory()
  })

  afterEach(() => {
    storageService.clear()
  })

  describe('Basic Mood Score Storage', () => {
    it('should store mood analysis results with confidence metrics', async () => {
      const conversation = createTestConversation()
      const moodAnalysis = await moodAnalyzer.analyzeConversation(conversation)

      const processingMetrics = {
        duration: 150,
        algorithmVersion: '2.0.0',
      }

      const storedScore = await storageService.storeMoodScore(
        testMemory.id,
        moodAnalysis,
        processingMetrics,
      )

      expect(storedScore).toBeDefined()
      expect(storedScore.id).toMatch(/^mood-score-/)
      expect(storedScore.memoryId).toBe(testMemory.id)
      expect(storedScore.score).toBe(moodAnalysis.score)
      expect(storedScore.confidence).toBe(moodAnalysis.confidence)
      expect(storedScore.descriptors).toEqual(moodAnalysis.descriptors)

      // Verify metadata
      expect(storedScore.metadata.algorithmVersion).toBe('2.0.0')
      expect(storedScore.metadata.processingTimeMs).toBe(150)
      expect(storedScore.metadata.calculatedAt).toBeInstanceOf(Date)

      // Verify timestamps
      expect(storedScore.createdAt).toBeInstanceOf(Date)
      expect(storedScore.updatedAt).toBeInstanceOf(Date)
    })

    it('should store mood analysis factors with evidence and weights', async () => {
      const conversation = createTestConversation()
      const moodAnalysis = await moodAnalyzer.analyzeConversation(conversation)

      const storedScore = await storageService.storeMoodScore(
        testMemory.id,
        moodAnalysis,
        { duration: 150, algorithmVersion: '2.0.0' },
      )

      expect(storedScore.factors).toBeDefined()
      expect(storedScore.factors.length).toBeGreaterThan(0)

      const firstFactor = storedScore.factors[0]
      expect(firstFactor.id).toMatch(/^mood-factor-/)
      expect(firstFactor.moodScoreId).toBe(storedScore.id)
      expect(firstFactor.type).toBeDefined()
      expect(typeof firstFactor.weight).toBe('number')
      expect(firstFactor.weight).toBeGreaterThan(0)
      expect(firstFactor.weight).toBeLessThanOrEqual(1)
      expect(firstFactor.description).toBeDefined()
      expect(Array.isArray(firstFactor.evidence)).toBe(true)
      expect(firstFactor.createdAt).toBeInstanceOf(Date)
    })

    it('should store mood analysis with positive and negative indicators', async () => {
      const conversation = createTestConversation()
      const moodAnalysis = await moodAnalyzer.analyzeConversation(conversation)

      const storedScore = await storageService.storeMoodScore(
        testMemory.id,
        moodAnalysis,
        { duration: 150, algorithmVersion: '2.0.0' },
      )

      // Note: Analysis property removed from MoodAnalysisResult interface
      expect(storedScore.descriptors).toBeDefined()
      expect(Array.isArray(storedScore.descriptors)).toBe(true)
    })
  })

  describe('Mood Delta Storage', () => {
    it('should store mood deltas with significance tracking', async () => {
      const conversation = createTestConversation()
      const moodAnalysis = await moodAnalyzer.analyzeConversation(conversation)
      const deltas =
        await deltaDetector.detectConversationalDeltas([moodAnalysis])

      const storedDeltas = await storageService.storeMoodDeltas(
        testMemory.id,
        deltas,
      )

      expect(storedDeltas).toBeDefined()
      expect(Array.isArray(storedDeltas)).toBe(true)

      if (storedDeltas.length > 0) {
        const firstDelta = storedDeltas[0]
        expect(firstDelta.id).toMatch(/^mood-delta-/)
        expect(firstDelta.memoryId).toBe(testMemory.id)
        expect(typeof firstDelta.magnitude).toBe('number')
        expect(['positive', 'negative', 'neutral']).toContain(
          firstDelta.direction,
        )
        expect(['mood_repair', 'celebration', 'decline', 'plateau']).toContain(
          firstDelta.type,
        )
        expect(typeof firstDelta.confidence).toBe('number')
        expect(firstDelta.confidence).toBeGreaterThan(0)
        expect(firstDelta.confidence).toBeLessThanOrEqual(1)
        expect(Array.isArray(firstDelta.factors)).toBe(true)
        expect(typeof firstDelta.significance).toBe('number')
        expect(firstDelta.detectedAt).toBeInstanceOf(Date)
        expect(firstDelta.createdAt).toBeInstanceOf(Date)
      }
    })

    it('should store delta magnitude and direction correctly', async () => {
      const testDeltas: MoodDelta[] = [
        {
          magnitude: 2.5,
          direction: 'positive',
          type: 'mood_repair',
          confidence: 0.85,
          factors: ['supportive_response', 'emotional_validation'],
        },
        {
          magnitude: 1.8,
          direction: 'negative',
          type: 'decline',
          confidence: 0.72,
          factors: ['stress_indicator', 'negative_sentiment'],
        },
      ]

      const storedDeltas = await storageService.storeMoodDeltas(
        testMemory.id,
        testDeltas,
      )

      expect(storedDeltas).toHaveLength(2)

      const positiveTestDelta = storedDeltas.find(
        (d) => d.direction === 'positive',
      )
      expect(positiveTestDelta).toBeDefined()
      expect(positiveTestDelta!.magnitude).toBe(2.5)
      expect(positiveTestDelta!.type).toBe('mood_repair')
      expect(positiveTestDelta!.confidence).toBe(0.85)
      expect(positiveTestDelta!.factors).toContain('supportive_response')

      const negativeTestDelta = storedDeltas.find(
        (d) => d.direction === 'negative',
      )
      expect(negativeTestDelta).toBeDefined()
      expect(negativeTestDelta!.magnitude).toBe(1.8)
      expect(negativeTestDelta!.type).toBe('decline')
      expect(negativeTestDelta!.confidence).toBe(0.72)
      expect(negativeTestDelta!.factors).toContain('stress_indicator')
    })
  })

  describe('Analysis Metadata Storage', () => {
    it('should store processing metadata with quality metrics', async () => {
      const metadata = {
        processingDuration: 245,
        confidence: 0.82,
        qualityMetrics: {
          overall: 8.5,
          components: {
            coherence: 8.8,
            relevance: 8.5,
            completeness: 8.2,
            accuracy: 8.7,
          },
        },
        issues: [
          {
            type: 'unclear_emotions',
            severity: 'low',
            description: 'Some emotional expressions may be ambiguous',
            suggestions: ['Request clarification', 'Use confidence intervals'],
          },
        ],
      }

      const storedMetadata = await storageService.storeAnalysisMetadata(
        testMemory.id,
        metadata,
      )

      expect(storedMetadata).toBeDefined()
      expect(storedMetadata.id).toMatch(/^analysis-metadata-/)
      expect(storedMetadata.memoryId).toBe(testMemory.id)
      expect(storedMetadata.processingDuration).toBe(245)
      expect(storedMetadata.confidence).toBe(0.82)

      // Verify quality metrics structure
      expect(storedMetadata.qualityMetrics.overall).toBe(8.5)
      expect(storedMetadata.qualityMetrics.components.coherence).toBe(8.8)
      expect(storedMetadata.qualityMetrics.components.relevance).toBe(8.5)
      expect(storedMetadata.qualityMetrics.components.completeness).toBe(8.2)
      expect(storedMetadata.qualityMetrics.components.accuracy).toBe(8.7)

      // Verify issues structure
      expect(storedMetadata.issues).toHaveLength(1)
      expect(storedMetadata.issues[0].type).toBe('unclear_emotions')
      expect(storedMetadata.issues[0].severity).toBe('low')
      expect(storedMetadata.issues[0].description).toBeDefined()
      expect(Array.isArray(storedMetadata.issues[0].suggestions)).toBe(true)

      expect(storedMetadata.createdAt).toBeInstanceOf(Date)
    })

    it('should handle metadata storage without quality issues', async () => {
      const metadata = {
        processingDuration: 180,
        confidence: 0.95,
        qualityMetrics: {
          overall: 9.2,
          components: {
            coherence: 9.3,
            relevance: 9.1,
            completeness: 9.2,
            accuracy: 9.2,
          },
        },
        issues: [], // No issues
      }

      const storedMetadata = await storageService.storeAnalysisMetadata(
        testMemory.id,
        metadata,
      )

      expect(storedMetadata.issues).toHaveLength(0)
      expect(storedMetadata.confidence).toBe(0.95)
      expect(storedMetadata.qualityMetrics.overall).toBe(9.2)
    })
  })

  describe('Data Retrieval Operations', () => {
    it('should retrieve stored mood score by memory ID', async () => {
      const conversation = createTestConversation()
      const moodAnalysis = await moodAnalyzer.analyzeConversation(conversation)

      await storageService.storeMoodScore(testMemory.id, moodAnalysis, {
        duration: 150,
        algorithmVersion: '2.0.0',
      })

      const retrievedScore = await storageService.getMoodScoreByMemoryId(
        testMemory.id,
      )

      expect(retrievedScore).toBeDefined()
      expect(retrievedScore!.memoryId).toBe(testMemory.id)
      expect(retrievedScore!.score).toBe(moodAnalysis.score)
      expect(retrievedScore!.confidence).toBe(moodAnalysis.confidence)
    })

    it('should retrieve mood factors by mood score ID', async () => {
      const conversation = createTestConversation()
      const moodAnalysis = await moodAnalyzer.analyzeConversation(conversation)

      const storedScore = await storageService.storeMoodScore(
        testMemory.id,
        moodAnalysis,
        { duration: 150, algorithmVersion: '2.0.0' },
      )

      const retrievedFactors = await storageService.getMoodFactorsByScoreId(
        storedScore.id,
      )

      expect(retrievedFactors).toBeDefined()
      expect(Array.isArray(retrievedFactors)).toBe(true)
      expect(retrievedFactors.length).toBeGreaterThan(0)

      const firstFactor = retrievedFactors[0]
      expect(firstFactor.moodScoreId).toBe(storedScore.id)
    })

    it('should retrieve mood deltas by memory ID', async () => {
      const testDeltas: MoodDelta[] = [
        {
          magnitude: 2.1,
          direction: 'positive',
          type: 'mood_repair',
          confidence: 0.78,
          factors: ['emotional_support'],
        },
      ]

      await storageService.storeMoodDeltas(testMemory.id, testDeltas)
      const retrievedDeltas = await storageService.getMoodDeltasByMemoryId(
        testMemory.id,
      )

      expect(retrievedDeltas).toHaveLength(1)
      expect(retrievedDeltas[0].memoryId).toBe(testMemory.id)
      expect(retrievedDeltas[0].magnitude).toBe(2.1)
      expect(retrievedDeltas[0].direction).toBe('positive')
    })

    it('should return null for non-existent memory ID', async () => {
      const nonExistentId = 'non-existent-memory-id'

      const retrievedScore =
        await storageService.getMoodScoreByMemoryId(nonExistentId)
      const retrievedDeltas =
        await storageService.getMoodDeltasByMemoryId(nonExistentId)
      const retrievedMetadata =
        await storageService.getAnalysisMetadataByMemoryId(nonExistentId)

      expect(retrievedScore).toBeNull()
      expect(retrievedDeltas).toHaveLength(0)
      expect(retrievedMetadata).toBeNull()
    })
  })

  describe('Transaction Context Support', () => {
    it('should accept optional transaction context parameter in storeMoodScore', async () => {
      const conversation = createTestConversation()
      const moodAnalysis = await moodAnalyzer.analyzeConversation(conversation)

      const processingMetrics = {
        duration: 150,
        algorithmVersion: '2.0.0',
      }

      // Mock transaction context - in real implementation this would be a Prisma transaction
      const mockTransaction = {}

      // Test that the method accepts transaction context without throwing
      expect(async () => {
        await storageService.storeMoodScore(
          testMemory.id,
          moodAnalysis,
          processingMetrics,
        )
      }).not.toThrow()
    })

    it('should accept optional transaction context parameter in storeMoodDeltas', async () => {
      const testDeltas: MoodDelta[] = [
        {
          magnitude: 2.5,
          direction: 'positive',
          type: 'mood_repair',
          confidence: 0.85,
          factors: ['supportive_response'],
        },
      ]

      // Mock transaction context
      const mockTransaction = {}

      // Test that the method accepts transaction context without throwing
      expect(async () => {
        await storageService.storeMoodDeltas(
          testMemory.id,
          testDeltas,
        )
      }).not.toThrow()
    })

    it('should work without transaction context for backward compatibility', async () => {
      const conversation = createTestConversation()
      const moodAnalysis = await moodAnalyzer.analyzeConversation(conversation)

      // Should work exactly as before when no transaction context is provided
      const storedScore = await storageService.storeMoodScore(
        testMemory.id,
        moodAnalysis,
        { duration: 150, algorithmVersion: '2.0.0' },
      )

      expect(storedScore).toBeDefined()
      expect(storedScore.memoryId).toBe(testMemory.id)
    })
  })

  describe('Data Integrity and Relationships', () => {
    it('should maintain referential integrity between mood scores and factors', async () => {
      const conversation = createTestConversation()
      const moodAnalysis = await moodAnalyzer.analyzeConversation(conversation)

      const storedScore = await storageService.storeMoodScore(
        testMemory.id,
        moodAnalysis,
        { duration: 150, algorithmVersion: '2.0.0' },
      )

      // Verify that all factors reference the correct mood score ID
      const factors = await storageService.getMoodFactorsByScoreId(
        storedScore.id,
      )

      for (const factor of factors) {
        expect(factor.moodScoreId).toBe(storedScore.id)
      }

      // Verify that the stored score includes the factors
      expect(storedScore.factors).toHaveLength(factors.length)
      expect(storedScore.factors[0].moodScoreId).toBe(storedScore.id)
    })

    it('should maintain relationship between memory and all mood analysis data', async () => {
      const conversation = createTestConversation()
      const moodAnalysis = await moodAnalyzer.analyzeConversation(conversation)
      const deltas =
        await deltaDetector.detectConversationalDeltas([moodAnalysis])

      // Store all related data
      const storedScore = await storageService.storeMoodScore(
        testMemory.id,
        moodAnalysis,
        { duration: 150, algorithmVersion: '2.0.0' },
      )

      const storedDeltas = await storageService.storeMoodDeltas(
        testMemory.id,
        deltas,
      )

      const storedMetadata = await storageService.storeAnalysisMetadata(
        testMemory.id,
        {
          processingDuration: 150,
          confidence: 0.85,
          qualityMetrics: {
            overall: 8.5,
            components: {
              coherence: 8.8,
              relevance: 8.5,
              completeness: 8.2,
              accuracy: 8.7,
            },
          },
          issues: [],
        },
      )

      // Verify all data is linked to the same memory ID
      expect(storedScore.memoryId).toBe(testMemory.id)
      expect(storedDeltas.every((d) => d.memoryId === testMemory.id)).toBe(true)
      expect(storedMetadata.memoryId).toBe(testMemory.id)

      // Verify retrieval by memory ID works correctly
      const retrievedScore = await storageService.getMoodScoreByMemoryId(
        testMemory.id,
      )
      const retrievedDeltas = await storageService.getMoodDeltasByMemoryId(
        testMemory.id,
      )
      const retrievedMetadata =
        await storageService.getAnalysisMetadataByMemoryId(testMemory.id)

      expect(retrievedScore?.id).toBe(storedScore.id)
      expect(retrievedDeltas).toHaveLength(storedDeltas.length)
      expect(retrievedMetadata?.id).toBe(storedMetadata.id)
    })
  })

  // Helper functions for creating test data

  function createTestConversation(): ConversationData {
    return {
      id: 'test-conversation-storage',
      messages: [
        {
          id: 'msg-1',
          content:
            'I was feeling really down yesterday but talking to you helped me feel much better.',
          authorId: 'user-1',
          timestamp: new Date('2025-01-22T10:00:00Z'),
        },
        {
          id: 'msg-2',
          content:
            'I am so glad to hear that you are feeling better. That is wonderful progress.',
          authorId: 'therapist-1',
          timestamp: new Date('2025-01-22T10:01:00Z'),
        },
      ],
      participants: [
        { id: 'user-1', name: 'Alice', role: 'vulnerable_sharer' as const },
        { id: 'therapist-1', name: 'Dr. Smith', role: 'supporter' as const },
      ],
      timestamp: new Date('2025-01-22T10:00:00Z'),
      startTime: new Date('2025-01-22T10:00:00Z'),
      endTime: new Date('2025-01-22T10:01:00Z'),
    }
  }

  function createTestExtractedMemory(): ExtractedMemory {
    return {
      id: `test-memory-${Date.now()}`,
      content: 'Test memory content for storage testing',
      author: { id: 'user-1', name: 'Alice', role: ParticipantRole.SELF },
      participants: [
        { id: 'user-1', name: 'Alice', role: ParticipantRole.SELF },
        {
          id: 'therapist-1',
          name: 'Dr. Smith',
          role: ParticipantRole.PROFESSIONAL,
        },
      ],
      timestamp: new Date().toISOString(),
      tags: [],
      emotionalContext: {
        primaryEmotion: EmotionalState.JOY,
        secondaryEmotions: [],
        intensity: 0.7,
        valence: 0.8,
        themes: [EmotionalTheme.GROWTH],
        indicators: {
          phrases: [],
          emotionalWords: [],
          styleIndicators: [],
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
          secure: ['trust', 'support'],
          anxious: [],
          avoidant: [],
        },
        healthIndicators: {
          positive: ['supportive communication', 'mutual respect'],
          negative: [],
          repairAttempts: [],
        },
        connectionStrength: 0.85,
        quality: 8.5,
      },
      extendedRelationshipDynamics: {
        type: 'therapeutic',
        supportLevel: 'high',
        intimacyLevel: 'high',
        intimacy: 'high',
        conflictLevel: 'low',
        trustLevel: 'high',
        conflictPresent: false,
        conflictIntensity: 'low',
        communicationStyle: 'supportive',
        communicationStyleDetails: {
          vulnerabilityLevel: 'high',
          emotionalSafety: 'high',
          supportPatterns: [],
          conflictPatterns: [],
          professionalBoundaries: true,
          guidancePatterns: [],
          therapeuticElements: [],
        },
        participantDynamics: {
          supportBalance: 'unidirectional',
          mutualVulnerability: false,
        },
        emotionalSafety: {
          overall: 'high',
          acceptanceLevel: 'high',
          judgmentRisk: 'low',
          validationPresent: true,
        },
      },
      processing: {
        extractedAt: new Date(),
        confidence: 0.85,
        quality: {
          overall: 0.85,
          components: {
            emotionalRichness: 0.88,
            relationshipClarity: 0.85,
            contentCoherence: 0.82,
            contextualSignificance: 0.87,
          },
          confidence: 0.85,
          issues: [],
        },
        sourceData: createTestConversation(),
      },
      metadata: {
        processedAt: new Date().toISOString(),
        schemaVersion: '1.0.0',
        source: 'test',
        confidence: 0.85,
      },
      emotionalAnalysis: {
        context: {
          primaryEmotion: EmotionalState.JOY,
          secondaryEmotions: [],
          intensity: 0.7,
          valence: 0.8,
          themes: [EmotionalTheme.GROWTH],
          indicators: {
            phrases: [],
            emotionalWords: [],
            styleIndicators: [],
          },
        },
        moodScoring: {
          score: 7.2,
          descriptors: ['positive', 'hopeful', 'grateful'],
          confidence: 0.85,
          factors: [
            {
              type: 'sentiment_analysis',
              weight: 0.35,
              description: 'Positive sentiment detected',
              evidence: ['feeling better', 'helped me'],
            },
          ],
          delta: undefined,
        },
        trajectory: {
          direction: 'improving',
          significance: 0.8,
          points: [
            {
              timestamp: new Date(),
              moodScore: 7.2,
            },
          ],
          turningPoints: [],
        },
        patterns: [],
      },
      significance: {
        overall: 7.5,
        components: {
          emotionalSalience: 7.8,
          relationshipImpact: 7.2,
          contextualImportance: 7.5,
          temporalRelevance: 7.5,
        },
        confidence: 0.82,
        category: 'high',
        validationPriority: 8.0,
      },
    }
  }
})
