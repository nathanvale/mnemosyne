import type { PrismaClient } from '@studio/db'
import type pino from 'pino'

import { createLogger } from '@studio/logger'
import {
  ParticipantRole,
  CommunicationPattern,
  InteractionQuality,
  type Participant,
  type RelationshipDynamics,
} from '@studio/schema'

import type {
  ConversationData,
  ConversationParticipant,
  ExtractedMemory,
  MemoryQualityScore,
  EmotionalAnalysis,
  EmotionalSignificanceScore,
  ProcessedMemoryBatch,
  ProcessingError,
} from '../types'

import { MoodScoringAnalyzer } from '../mood-scoring/analyzer'
import { DeltaDetector } from '../mood-scoring/delta-detector'
import { EmotionalSignificanceAnalyzer } from '../significance/analyzer'
import { ConversationDataSchema, type ConversationDataInput } from '../types'
import {
  mapMoodToEmotionalState,
  extractSecondaryEmotions,
  calculateEmotionalIntensity,
  calculateValence,
  extractEmotionalThemes,
  extractEmotionalPhrases,
  extractEmotionalWords,
  extractStyleIndicators,
  createPreliminaryMemory,
} from './emotional-helpers'

/**
 * Configuration for EnhancedMemoryProcessor
 */
export interface ProcessorConfig {
  /** Database client for persistence */
  database: PrismaClient
  /** Logger instance */
  logger?: pino.Logger
  /** Processing performance settings */
  performance?: {
    /** Batch size for processing multiple conversations */
    batchSize?: number
    /** Enable parallel processing within batches */
    parallelProcessing?: boolean
    /** Maximum processing time per conversation (ms) */
    timeoutMs?: number
  }
  /** Quality assessment thresholds */
  quality?: {
    /** Minimum quality score to accept memory (0-10) */
    minimumQualityScore?: number
    /** Minimum confidence to accept processing (0-1) */
    minimumConfidence?: number
  }
  /** Emotional analysis settings */
  emotional?: {
    /** Enable detailed emotional trajectory analysis */
    enableTrajectoryAnalysis?: boolean
    /** Minimum significance score for storage (0-10) */
    minimumSignificanceScore?: number
  }
}

/**
 * Processing result for a single conversation
 */
export interface ProcessingResult {
  /** Unique identifier for this processing session */
  processingId: string
  /** Source conversation data */
  conversationData: ConversationData
  /** Extracted memory (if successful) */
  extractedMemory?: ExtractedMemory
  /** Processing success status */
  success: boolean
  /** Processing duration in milliseconds */
  processingTimeMs: number
  /** Any errors that occurred during processing */
  error?: ProcessingError
  /** Processing metadata */
  metadata: {
    /** Processing timestamp */
    processedAt: Date
    /** Processing confidence (0-1) */
    confidence: number
    /** Quality assessment result */
    qualityScore: MemoryQualityScore
  }
}

/**
 * Enhanced memory processor for Phase 2 emotional intelligence
 *
 * This processor implements sophisticated memory extraction with:
 * - Delta-triggered processing optimization
 * - Comprehensive emotional analysis
 * - Quality assessment and validation
 * - Batch processing coordination
 * - Integration with existing deduplication
 */
export class EnhancedMemoryProcessor {
  private readonly logger: pino.Logger
  private readonly config: Required<ProcessorConfig>
  private readonly moodAnalyzer: MoodScoringAnalyzer
  private readonly deltaDetector: DeltaDetector
  private readonly significanceAnalyzer: EmotionalSignificanceAnalyzer

  constructor(
    config: ProcessorConfig,
    components?: {
      moodAnalyzer?: MoodScoringAnalyzer
      deltaDetector?: DeltaDetector
      significanceAnalyzer?: EmotionalSignificanceAnalyzer
    },
  ) {
    this.logger = config.logger ?? (createLogger() as unknown as pino.Logger)

    // Set default configuration values
    this.config = {
      database: config.database,
      logger: this.logger,
      performance: {
        batchSize: 10,
        parallelProcessing: true,
        timeoutMs: 30000,
        ...config.performance,
      },
      quality: {
        minimumQualityScore: 6.0,
        minimumConfidence: 0.7,
        ...config.quality,
      },
      emotional: {
        enableTrajectoryAnalysis: true,
        minimumSignificanceScore: 5.0,
        ...config.emotional,
      },
    }

    // Initialize emotional analysis components with dependency injection support
    this.moodAnalyzer = components?.moodAnalyzer ?? new MoodScoringAnalyzer()
    this.deltaDetector = components?.deltaDetector ?? new DeltaDetector()
    this.significanceAnalyzer =
      components?.significanceAnalyzer ?? new EmotionalSignificanceAnalyzer()

    this.logger.info('EnhancedMemoryProcessor initialized', {
      config: {
        batchSize: this.config.performance.batchSize,
        parallelProcessing: this.config.performance.parallelProcessing,
        minimumQualityScore: this.config.quality.minimumQualityScore,
        trajectoryAnalysis: this.config.emotional.enableTrajectoryAnalysis,
      },
    })
  }

  /**
   * Process a single conversation into an enhanced memory
   */
  async processConversation(
    conversationData: ConversationDataInput,
  ): Promise<ProcessingResult> {
    const processingId = this.generateProcessingId()
    const startTime = Date.now()

    this.logger.debug('Starting conversation processing', {
      processingId,
      conversationId: conversationData.id,
      messageCount: conversationData.messages.length,
    })

    try {
      // Validate input data
      const validatedData = this.validateConversationData(conversationData)

      // Check if we should process this conversation (delta triggering)
      const shouldProcess = await this.shouldProcessConversation(validatedData)
      if (!shouldProcess) {
        return this.createSkippedResult(processingId, validatedData, startTime)
      }

      // Extract memory with emotional intelligence
      const extractedMemory = await this.extractMemoryWithEmotion(validatedData)

      // Assess quality and significance
      const qualityScore = await this.assessMemoryQuality(extractedMemory)
      const shouldStore = this.shouldStoreMemory(
        qualityScore,
        extractedMemory.significance,
      )

      if (!shouldStore) {
        return this.createRejectedResult(
          processingId,
          validatedData,
          qualityScore,
          startTime,
        )
      }

      // Store the memory
      await this.storeExtractedMemory(extractedMemory)

      const processingTimeMs = Date.now() - startTime
      this.logger.info('Successfully processed conversation', {
        processingId,
        conversationId: validatedData.id,
        processingTimeMs,
        qualityScore: qualityScore.overall,
        significance: extractedMemory.significance.overall,
      })

      return {
        processingId,
        conversationData: validatedData,
        extractedMemory,
        success: true,
        processingTimeMs,
        metadata: {
          processedAt: new Date(),
          confidence: extractedMemory.processing.confidence,
          qualityScore,
        },
      }
    } catch (error) {
      const processingTimeMs = Date.now() - startTime
      const processingError = this.createProcessingError(
        error,
        conversationData.id,
      )

      this.logger.error('Failed to process conversation', {
        processingId,
        conversationId: conversationData.id,
        processingTimeMs,
        error: processingError,
      })

      return {
        processingId,
        conversationData: conversationData as ConversationData,
        success: false,
        processingTimeMs,
        error: processingError,
        metadata: {
          processedAt: new Date(),
          confidence: 0,
          qualityScore: this.createFailedQualityScore(),
        },
      }
    }
  }

  /**
   * Process multiple conversations in batches
   */
  async processBatch(
    conversationBatch: ConversationDataInput[],
  ): Promise<ProcessedMemoryBatch> {
    const batchId = this.generateBatchId()
    const processedAt = new Date()

    this.logger.info('Starting batch processing', {
      batchId,
      conversationCount: conversationBatch.length,
      batchSize: this.config.performance.batchSize,
      parallelProcessing: this.config.performance.parallelProcessing,
    })

    const results: ProcessingResult[] = []
    const errors: ProcessingError[] = []
    const memories: ExtractedMemory[] = []

    // Process conversations in configurable batch sizes
    const batchSize = this.config.performance?.batchSize ?? 10
    for (let i = 0; i < conversationBatch.length; i += batchSize) {
      const chunk = conversationBatch.slice(i, i + batchSize)

      let chunkResults: ProcessingResult[]
      if (this.config.performance?.parallelProcessing) {
        chunkResults = await Promise.all(
          chunk.map((conversation) => this.processConversation(conversation)),
        )
      } else {
        chunkResults = []
        for (const conversation of chunk) {
          const result = await this.processConversation(conversation)
          chunkResults.push(result)
        }
      }

      for (const result of chunkResults) {
        results.push(result)
        if (result.success && result.extractedMemory) {
          memories.push(result.extractedMemory)
        }
        if (result.error) {
          errors.push(result.error)
        }
      }
    }

    const statistics = this.calculateBatchStatistics(results)

    this.logger.info('Completed batch processing', {
      batchId,
      totalConversations: conversationBatch.length,
      successfulExtractions: statistics.successfulExtractions,
      failedExtractions: statistics.failedExtractions,
      averageProcessingTime: statistics.averageProcessingTime,
    })

    return {
      batchId,
      processedAt,
      memories,
      statistics,
      errors,
    }
  }

  /**
   * Validate conversation data using Zod schema
   */
  private validateConversationData(
    data: ConversationDataInput,
  ): ConversationData {
    try {
      return ConversationDataSchema.parse(data)
    } catch (error) {
      throw new Error(`Conversation data validation failed: ${error}`)
    }
  }

  /**
   * Delta-triggered processing: determine if conversation should be processed
   */
  private async shouldProcessConversation(
    conversationData: ConversationData,
  ): Promise<boolean> {
    // Check if we've already processed this conversation
    const existingMemory = await this.config.database.memory.findFirst({
      where: {
        // Implementation will depend on how we store conversation references
        // This is a placeholder for the actual deduplication logic
        contentHash: await this.calculateConversationHash(conversationData),
      },
    })

    if (existingMemory) {
      this.logger.debug('Conversation already processed, skipping', {
        conversationId: conversationData.id,
      })
      return false
    }

    // Check for emotional significance triggers
    const hasEmotionalTriggers = this.detectEmotionalTriggers(conversationData)
    if (!hasEmotionalTriggers) {
      this.logger.debug('No emotional triggers detected, skipping', {
        conversationId: conversationData.id,
      })
      return false
    }

    return true
  }

  /**
   * Extract memory with comprehensive emotional analysis
   */
  private async extractMemoryWithEmotion(
    conversationData: ConversationData,
  ): Promise<ExtractedMemory> {
    const extractedAt = new Date()

    this.logger.debug('Starting emotional analysis', {
      conversationId: conversationData.id,
      messageCount: conversationData.messages.length,
    })

    // Perform comprehensive mood analysis
    const moodAnalysis =
      await this.moodAnalyzer.analyzeConversation(conversationData)

    // Recognize emotional patterns
    const patternStrings = this.moodAnalyzer.recognizePatterns(conversationData)

    // Build emotional trajectory
    const trajectory =
      this.moodAnalyzer.buildEmotionalTrajectory(conversationData)

    // Convert pattern strings to EmotionalPattern objects
    const patterns = patternStrings.map((patternString) => ({
      type: this.mapPatternStringToType(patternString),
      confidence: 0.7,
      description: `Pattern detected: ${patternString}`,
      evidence: [`Detected ${patternString} pattern in conversation`],
      significance: 0.5,
    }))

    // Create comprehensive emotional analysis
    const emotionalAnalysis: EmotionalAnalysis = {
      context: {
        primaryEmotion: mapMoodToEmotionalState(moodAnalysis.score),
        secondaryEmotions: extractSecondaryEmotions(moodAnalysis),
        intensity: calculateEmotionalIntensity(moodAnalysis),
        valence: calculateValence(moodAnalysis.score),
        themes: extractEmotionalThemes(moodAnalysis),
        indicators: {
          phrases: extractEmotionalPhrases(conversationData),
          emotionalWords: extractEmotionalWords(moodAnalysis),
          styleIndicators: extractStyleIndicators(conversationData),
        },
      },
      moodScoring: moodAnalysis,
      trajectory,
      patterns,
    }

    // Create extracted memory for significance assessment
    const preliminaryMemory = createPreliminaryMemory(
      conversationData,
      emotionalAnalysis,
      extractedAt,
    )

    // Assess emotional significance using real analyzer
    const significance =
      await this.significanceAnalyzer.assessSignificance(preliminaryMemory)

    // Create base memory structure following schema
    const baseMemory = {
      id: this.generateMemoryId(),
      content: this.extractMemoryContent(conversationData),
      timestamp: conversationData.timestamp.toISOString(),
      author: this.convertParticipant(
        conversationData.participants.find((p) => p.role === 'author') ??
          conversationData.participants[0],
      ),
      participants: conversationData.participants.map((p) =>
        this.convertParticipant(p),
      ),
      emotionalContext: emotionalAnalysis.context,
      relationshipDynamics: this.createDefaultRelationshipDynamics(),
      tags: ['conversation'], // Basic tags
      metadata: {
        processedAt: extractedAt.toISOString(),
        schemaVersion: '1.0.0',
        source: 'enhanced-memory-processor',
        confidence: 0.8,
      },
    }

    return {
      ...baseMemory,
      processing: {
        extractedAt,
        confidence: 0.8,
        quality: await this.assessMemoryQuality({
          ...baseMemory,
          processing: {
            extractedAt,
            confidence: 0.8,
            quality: {} as MemoryQualityScore,
            sourceData: conversationData,
          },
          emotionalAnalysis,
          significance,
        }),
        sourceData: conversationData,
      },
      emotionalAnalysis,
      significance,
    }
  }

  /**
   * Assess memory quality with comprehensive metrics
   */
  private async assessMemoryQuality(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    memory: ExtractedMemory,
  ): Promise<MemoryQualityScore> {
    // Placeholder implementation - will be expanded with actual quality assessment
    return {
      overall: 7.5,
      components: {
        emotionalRichness: 7.0,
        relationshipClarity: 8.0,
        contentCoherence: 7.5,
        contextualSignificance: 7.5,
      },
      confidence: 0.8,
      issues: [],
    }
  }

  /**
   * Determine if memory should be stored based on quality and significance
   */
  private shouldStoreMemory(
    qualityScore: MemoryQualityScore,
    significance: EmotionalSignificanceScore,
  ): boolean {
    const meetsQualityThreshold =
      qualityScore.overall >= (this.config.quality?.minimumQualityScore ?? 6.0)
    const meetsConfidenceThreshold =
      qualityScore.confidence >= (this.config.quality?.minimumConfidence ?? 0.7)
    const meetsSignificanceThreshold =
      significance.overall >=
      (this.config.emotional?.minimumSignificanceScore ?? 5.0)

    return (
      meetsQualityThreshold &&
      meetsConfidenceThreshold &&
      meetsSignificanceThreshold
    )
  }

  /**
   * Create default RelationshipDynamics for placeholder use
   */
  private createDefaultRelationshipDynamics(): RelationshipDynamics {
    return {
      communicationPattern: CommunicationPattern.FORMAL,
      interactionQuality: InteractionQuality.NEUTRAL,
      powerDynamics: {
        isBalanced: true,
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
      connectionStrength: 0.5,
      participantDynamics: [],
      quality: 5,
      patterns: [],
    }
  }

  /**
   * Convert ConversationParticipant to Participant with proper role mapping
   */
  private convertParticipant(
    conversationParticipant: ConversationParticipant,
  ): Participant {
    // Map conversation roles to ParticipantRole enum
    let role: ParticipantRole
    switch (conversationParticipant.role) {
      case 'author':
        role = ParticipantRole.SELF
        break
      case 'recipient':
        role = ParticipantRole.OTHER
        break
      case 'observer':
        role = ParticipantRole.OTHER
        break
      default:
        role = ParticipantRole.OTHER
    }

    return {
      id: conversationParticipant.id,
      name: conversationParticipant.name,
      role,
      metadata: {
        sourceId: conversationParticipant.id,
        canonicalName: conversationParticipant.name,
        relationshipDescription:
          conversationParticipant.metadata?.relationshipType,
      },
    }
  }

  /**
   * Store extracted memory in database
   */
  private async storeExtractedMemory(memory: ExtractedMemory): Promise<void> {
    // Store using the actual database schema
    const contentHash = await this.calculateConversationHash(
      memory.processing.sourceData,
    )

    await this.config.database.memory.create({
      data: {
        sourceMessageIds: JSON.stringify(
          memory.processing.sourceData.messages.map((m) => m.id),
        ),
        participants: JSON.stringify(memory.participants),
        summary: memory.content,
        confidence: Math.round(memory.processing.confidence * 10), // Convert 0-1 to 1-10 scale
        contentHash,
        deduplicationMetadata: JSON.stringify({
          processing: memory.processing,
          emotionalAnalysis: memory.emotionalAnalysis,
          significance: memory.significance,
        }),
      },
    })
  }

  /**
   * Calculate conversation hash for deduplication
   */
  private async calculateConversationHash(
    conversationData: ConversationData,
  ): Promise<string> {
    const crypto = await import('crypto')
    const content = JSON.stringify({
      messages: conversationData.messages.map((m) => ({
        content: m.content,
        authorId: m.authorId,
      })),
      participants: conversationData.participants.map((p) => ({
        id: p.id,
        role: p.role,
      })),
    })
    return crypto.createHash('sha256').update(content).digest('hex')
  }

  /**
   * Detect emotional triggers that warrant processing
   */
  private detectEmotionalTriggers(conversationData: ConversationData): boolean {
    // Simplified trigger detection - will be expanded with actual emotional analysis
    const messageContent = conversationData.messages
      .map((m) => m.content.toLowerCase())
      .join(' ')

    const emotionalKeywords = [
      'happy',
      'sad',
      'angry',
      'excited',
      'frustrated',
      'grateful',
      'worried',
      'anxious',
      'proud',
      'disappointed',
      'confused',
      'love',
      'hate',
      'fear',
      'hope',
      'relief',
      'stress',
    ]

    return emotionalKeywords.some((keyword) => messageContent.includes(keyword))
  }

  /**
   * Map pattern strings to EmotionalPattern types
   */
  private mapPatternStringToType(
    patternString: string,
  ):
    | 'support_seeking'
    | 'mood_repair'
    | 'celebration'
    | 'vulnerability'
    | 'growth' {
    if (patternString.includes('support') || patternString.includes('help')) {
      return 'support_seeking'
    }
    if (
      patternString.includes('recovery') ||
      patternString.includes('repair')
    ) {
      return 'mood_repair'
    }
    if (
      patternString.includes('celebration') ||
      patternString.includes('achievement')
    ) {
      return 'celebration'
    }
    if (
      patternString.includes('vulnerability') ||
      patternString.includes('openness')
    ) {
      return 'vulnerability'
    }
    if (
      patternString.includes('growth') ||
      patternString.includes('learning')
    ) {
      return 'growth'
    }
    return 'support_seeking' // Default fallback
  }

  /**
   * Extract meaningful content from conversation
   */
  private extractMemoryContent(conversationData: ConversationData): string {
    // Simplified content extraction
    return conversationData.messages
      .map((message) => `${message.authorId}: ${message.content}`)
      .join('\n')
  }

  /**
   * Helper methods for result creation
   */
  private createSkippedResult(
    processingId: string,
    conversationData: ConversationData,
    startTime: number,
  ): ProcessingResult {
    return {
      processingId,
      conversationData,
      success: false,
      processingTimeMs: Date.now() - startTime,
      metadata: {
        processedAt: new Date(),
        confidence: 0,
        qualityScore: this.createSkippedQualityScore(),
      },
    }
  }

  private createRejectedResult(
    processingId: string,
    conversationData: ConversationData,
    qualityScore: MemoryQualityScore,
    startTime: number,
  ): ProcessingResult {
    return {
      processingId,
      conversationData,
      success: false,
      processingTimeMs: Date.now() - startTime,
      metadata: {
        processedAt: new Date(),
        confidence: qualityScore.confidence,
        qualityScore,
      },
    }
  }

  private createProcessingError(
    error: unknown,
    conversationId?: string,
  ): ProcessingError {
    return {
      type: 'extraction',
      message:
        error instanceof Error ? error.message : 'Unknown processing error',
      conversationId,
      stack: error instanceof Error ? error.stack : undefined,
    }
  }

  private createFailedQualityScore(): MemoryQualityScore {
    return {
      overall: 0,
      components: {
        emotionalRichness: 0,
        relationshipClarity: 0,
        contentCoherence: 0,
        contextualSignificance: 0,
      },
      confidence: 0,
      issues: [
        {
          type: 'content_fragmentation',
          severity: 'high',
          description: 'Processing failed completely',
        },
      ],
    }
  }

  private createSkippedQualityScore(): MemoryQualityScore {
    return {
      overall: 0,
      components: {
        emotionalRichness: 0,
        relationshipClarity: 0,
        contentCoherence: 0,
        contextualSignificance: 0,
      },
      confidence: 0,
      issues: [
        {
          type: 'missing_context',
          severity: 'low',
          description: 'Conversation skipped due to lack of emotional triggers',
        },
      ],
    }
  }

  /**
   * Calculate statistics for batch processing results
   */
  private calculateBatchStatistics(results: ProcessingResult[]) {
    const successfulResults = results.filter((r) => r.success)
    const failedResults = results.filter((r) => !r.success)

    const totalProcessingTime = results.reduce(
      (sum, r) => sum + r.processingTimeMs,
      0,
    )
    const averageProcessingTime = totalProcessingTime / results.length

    const qualityDistribution = { high: 0, medium: 0, low: 0 }
    const significanceDistribution = { critical: 0, high: 0, medium: 0, low: 0 }

    for (const result of successfulResults) {
      if (result.extractedMemory) {
        const quality = result.metadata.qualityScore.overall
        if (quality >= 8) qualityDistribution.high++
        else if (quality >= 6) qualityDistribution.medium++
        else qualityDistribution.low++

        const significance = result.extractedMemory.significance.category
        significanceDistribution[significance]++
      }
    }

    return {
      totalConversations: results.length,
      successfulExtractions: successfulResults.length,
      failedExtractions: failedResults.length,
      averageProcessingTime,
      qualityDistribution,
      significanceDistribution,
    }
  }

  /**
   * ID generation utilities
   */
  private generateProcessingId(): string {
    return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateMemoryId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
