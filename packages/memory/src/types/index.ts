import type { Memory, EmotionalContext } from '@studio/schema'

import { z } from 'zod'

/**
 * Enhanced memory with processing metadata and emotional intelligence
 */
export interface ExtractedMemory extends Memory {
  /** Extended relationship dynamics for significance analysis */
  extendedRelationshipDynamics?: RelationshipDynamics
  /** Processing metadata */
  processing: {
    /** When this memory was extracted */
    extractedAt: Date
    /** Processing confidence score (0-1) */
    confidence: number
    /** Processing quality metrics */
    quality: MemoryQualityScore
    /** Source conversation data */
    sourceData: ConversationData
  }
  /** Enhanced emotional analysis */
  emotionalAnalysis: EmotionalAnalysis
  /** Memory significance assessment */
  significance: EmotionalSignificanceScore
}

/**
 * Input conversation data for memory extraction
 */
export interface ConversationData {
  /** Unique conversation identifier */
  id: string
  /** Messages in the conversation */
  messages: ConversationMessage[]
  /** Conversation participants */
  participants: ConversationParticipant[]
  /** When the conversation occurred */
  timestamp: Date
  /** Conversation context metadata */
  context?: {
    platform?: string
    threadId?: string
    conversationType?: 'direct' | 'group' | 'public'
  }
}

/**
 * Individual message within a conversation
 */
export interface ConversationMessage {
  /** Message identifier */
  id: string
  /** Message content */
  content: string
  /** Message author */
  authorId: string
  /** Message timestamp */
  timestamp: Date
  /** Message metadata */
  metadata?: {
    edited?: boolean
    reactions?: string[]
    replyTo?: string
  }
}

/**
 * Conversation participant information
 */
export interface ConversationParticipant {
  /** Participant identifier */
  id: string
  /** Participant display name */
  name: string
  /** Participant role in conversation */
  role:
    | 'author'
    | 'recipient'
    | 'observer'
    | 'supporter'
    | 'listener'
    | 'vulnerable_sharer'
    | 'emotional_leader'
  /** Number of messages sent by this participant */
  messageCount?: number
  /** Emotional expressions used by this participant */
  emotionalExpressions?: string[]
  /** Participant metadata */
  metadata?: {
    avatar?: string
    status?: string
    relationshipType?: string
  }
}

/**
 * Memory quality assessment metrics
 */
export interface MemoryQualityScore {
  /** Overall quality score (0-10) */
  overall: number
  /** Quality component scores */
  components: {
    /** Emotional context richness (0-10) */
    emotionalRichness: number
    /** Relationship dynamics clarity (0-10) */
    relationshipClarity: number
    /** Content coherence and completeness (0-10) */
    contentCoherence: number
    /** Contextual significance (0-10) */
    contextualSignificance: number
  }
  /** Quality assessment confidence (0-1) */
  confidence: number
  /** Quality issues identified */
  issues: QualityIssue[]
}

/**
 * Quality issues found during assessment
 */
export interface QualityIssue {
  /** Issue type */
  type:
    | 'missing_context'
    | 'unclear_emotions'
    | 'participant_confusion'
    | 'content_fragmentation'
  /** Issue severity */
  severity: 'low' | 'medium' | 'high'
  /** Issue description */
  description: string
  /** Suggested improvements */
  suggestions?: string[]
}

/**
 * Enhanced emotional analysis beyond basic context
 */
export interface EmotionalAnalysis {
  /** Basic emotional context */
  context: EmotionalContext
  /** Mood scoring results */
  moodScoring: MoodAnalysisResult
  /** Emotional trajectory over conversation */
  trajectory: EmotionalTrajectory
  /** Emotional patterns detected */
  patterns: EmotionalPattern[]
}

/**
 * Mood analysis result with scoring and confidence
 */
export interface MoodAnalysisResult {
  /** Primary mood score (0-10 scale) */
  score: number
  /** Mood descriptors */
  descriptors: string[]
  /** Mood analysis confidence (0-1) */
  confidence: number
  /** Mood delta from baseline or previous state */
  delta?: MoodDelta
  /** Factors contributing to mood assessment */
  factors: MoodFactor[]
}

/**
 * Mood change detection
 */
export interface MoodDelta {
  /** Change magnitude */
  magnitude: number
  /** Change direction */
  direction: 'positive' | 'negative' | 'neutral'
  /** Delta type */
  type: 'mood_repair' | 'celebration' | 'decline' | 'plateau'
  /** Delta confidence (0-1) */
  confidence: number
  /** Contributing factors */
  factors: string[]
}

/**
 * Factors contributing to mood assessment
 */
export interface MoodFactor {
  /** Factor type */
  type:
    | 'language_sentiment'
    | 'emotional_words'
    | 'context_clues'
    | 'interaction_pattern'
    | 'sentiment_analysis'
    | 'psychological_indicators'
    | 'relationship_context'
    | 'conversational_flow'
    | 'historical_baseline'
  /** Factor weight in overall score */
  weight: number
  /** Factor description */
  description: string
  /** Evidence for this factor */
  evidence: string[]
  /** Internal calculated score (optional) */
  _score?: number
}

/**
 * Emotional trajectory over conversation timeline
 */
export interface EmotionalTrajectory {
  /** Trajectory points over time */
  points: TrajectoryPoint[]
  /** Overall trajectory direction */
  direction: 'improving' | 'declining' | 'stable' | 'volatile'
  /** Trajectory significance */
  significance: number
  /** Key turning points */
  turningPoints: TurningPoint[]
}

/**
 * Point in emotional trajectory
 */
export interface TrajectoryPoint {
  /** Timestamp of this point */
  timestamp: Date
  /** Mood score at this point */
  moodScore: number
  /** Message ID for this point */
  messageId?: string
  /** Emotional state descriptors */
  emotions?: string[]
  /** Context at this point */
  context?: string
}

/**
 * Significant turning point in emotional trajectory
 */
export interface TurningPoint {
  /** Timestamp of turning point */
  timestamp: Date
  /** Type of turning point */
  type: 'breakthrough' | 'setback' | 'realization' | 'support_received'
  /** Magnitude of change */
  magnitude: number
  /** Description of what happened */
  description: string
  /** Contributing factors */
  factors: string[]
}

/**
 * Emotional patterns detected in conversation
 */
export interface EmotionalPattern {
  /** Pattern type */
  type:
    | 'support_seeking'
    | 'mood_repair'
    | 'celebration'
    | 'vulnerability'
    | 'growth'
  /** Pattern confidence (0-1) */
  confidence: number
  /** Pattern description */
  description: string
  /** Evidence for pattern */
  evidence: string[]
  /** Pattern significance */
  significance: number
}

/**
 * Enhanced relationship dynamics for emotional analysis
 */
export interface RelationshipDynamics {
  /** Type of relationship */
  type:
    | 'romantic'
    | 'family'
    | 'close_friend'
    | 'friend'
    | 'colleague'
    | 'acquaintance'
    | 'professional'
    | 'therapeutic'
  /** Support level in the relationship */
  supportLevel: 'high' | 'medium' | 'low' | 'negative'
  /** Intimacy level in the relationship */
  intimacyLevel: 'high' | 'medium' | 'low'
  /** Conflict level in the relationship */
  conflictLevel: 'high' | 'medium' | 'low' | 'none'
  /** Trust level in the relationship */
  trustLevel: 'high' | 'medium' | 'low'
}

/**
 * Emotional significance assessment
 */
export interface EmotionalSignificanceScore {
  /** Overall significance (0-10) */
  overall: number
  /** Significance components */
  components: {
    /** Emotional salience (0-10) */
    emotionalSalience: number
    /** Relationship impact (0-10) */
    relationshipImpact: number
    /** Contextual importance (0-10) */
    contextualImportance: number
    /** Temporal relevance (0-10) */
    temporalRelevance: number
  }
  /** Significance confidence (0-1) */
  confidence: number
  /** Significance category */
  category: 'critical' | 'high' | 'medium' | 'low'
  /** Validation priority */
  validationPriority: number
}

/**
 * Processed memory batch result
 */
export interface ProcessedMemoryBatch {
  /** Batch identifier */
  batchId: string
  /** Processing timestamp */
  processedAt: Date
  /** Processed memories */
  memories: ExtractedMemory[]
  /** Batch statistics */
  statistics: BatchStatistics
  /** Processing errors */
  errors: ProcessingError[]
}

/**
 * Batch processing statistics
 */
export interface BatchStatistics {
  /** Total conversations processed */
  totalConversations: number
  /** Successful memory extractions */
  successfulExtractions: number
  /** Failed extractions */
  failedExtractions: number
  /** Average processing time per conversation */
  averageProcessingTime: number
  /** Quality distribution */
  qualityDistribution: {
    high: number
    medium: number
    low: number
  }
  /** Significance distribution */
  significanceDistribution: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

/**
 * Processing error information
 */
export interface ProcessingError {
  /** Error type */
  type: 'validation' | 'extraction' | 'analysis' | 'database'
  /** Error message */
  message: string
  /** Source conversation ID */
  conversationId?: string
  /** Error stack trace */
  stack?: string
  /** Error metadata */
  metadata?: Record<string, unknown>
}

/**
 * Memory clustering configuration
 */
export interface ClusteringConfig {
  /** Clustering algorithm to use */
  algorithm: 'hierarchical' | 'kmeans' | 'dbscan'
  /** Distance metric */
  distanceMetric:
    | 'emotional_similarity'
    | 'semantic_similarity'
    | 'temporal_proximity'
  /** Minimum cluster size */
  minClusterSize: number
  /** Maximum number of clusters */
  maxClusters?: number
  /** Clustering parameters */
  parameters: Record<string, unknown>
}

/**
 * Memory cluster result
 */
export interface MemoryCluster {
  /** Cluster identifier */
  id: string
  /** Cluster name/label */
  name: string
  /** Memories in this cluster */
  memories: ExtractedMemory[]
  /** Cluster centroid/representative */
  centroid: ClusterCentroid
  /** Cluster metadata */
  metadata: {
    /** Creation timestamp */
    createdAt: Date
    /** Cluster size */
    size: number
    /** Cluster coherence score */
    coherence: number
    /** Dominant themes */
    themes: string[]
  }
}

/**
 * Cluster centroid information
 */
export interface ClusterCentroid {
  /** Representative emotional state */
  emotionalState: EmotionalContext
  /** Average mood score */
  averageMoodScore: number
  /** Common themes */
  themes: string[]
  /** Typical participants */
  participants: string[]
  /** Temporal span */
  timespan: {
    start: Date
    end: Date
    duration: number
  }
}

/**
 * Zod schemas for validation
 */
export const ConversationDataSchema = z.object({
  id: z.string(),
  messages: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
      authorId: z.string(),
      timestamp: z.date(),
      metadata: z
        .object({
          edited: z.boolean().optional(),
          reactions: z.array(z.string()).optional(),
          replyTo: z.string().optional(),
        })
        .optional(),
    }),
  ),
  participants: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      role: z.enum([
        'author',
        'recipient',
        'observer',
        'supporter',
        'listener',
        'vulnerable_sharer',
        'emotional_leader',
      ]),
      messageCount: z.number().optional(),
      emotionalExpressions: z.array(z.string()).optional(),
      metadata: z.record(z.unknown()).optional(),
    }),
  ),
  timestamp: z.date(),
  context: z
    .object({
      platform: z.string().optional(),
      threadId: z.string().optional(),
      conversationType: z.enum(['direct', 'group', 'public']).optional(),
    })
    .optional(),
})

export const MoodAnalysisResultSchema = z.object({
  score: z.number().min(0).max(10),
  descriptors: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  delta: z
    .object({
      magnitude: z.number(),
      direction: z.enum(['positive', 'negative', 'neutral']),
      type: z.enum(['mood_repair', 'celebration', 'decline', 'plateau']),
      confidence: z.number().min(0).max(1),
      factors: z.array(z.string()),
    })
    .optional(),
  factors: z.array(
    z.object({
      type: z.enum([
        'language_sentiment',
        'emotional_words',
        'context_clues',
        'interaction_pattern',
        'sentiment_analysis',
        'psychological_indicators',
        'relationship_context',
        'conversational_flow',
        'historical_baseline',
      ]),
      weight: z.number(),
      description: z.string(),
      evidence: z.array(z.string()),
    }),
  ),
})

export const EmotionalSignificanceScoreSchema = z.object({
  overall: z.number().min(0).max(10),
  components: z.object({
    emotionalSalience: z.number().min(0).max(10),
    relationshipImpact: z.number().min(0).max(10),
    contextualImportance: z.number().min(0).max(10),
    temporalRelevance: z.number().min(0).max(10),
  }),
  confidence: z.number().min(0).max(1),
  category: z.enum(['critical', 'high', 'medium', 'low']),
  validationPriority: z.number().min(0).max(10),
})

/**
 * Sentiment analysis score for positive, negative, or neutral sentiment
 */
export interface SentimentScore {
  /** Sentiment strength (0-1) */
  score: number
  /** Sentiment intensity (0-1) */
  intensity: number
  /** Confidence in assessment (0-1) */
  confidence: number
  /** Emotional indicators detected */
  indicators: string[]
  /** Linguistic markers that support this sentiment */
  linguisticMarkers: string[]
  /** Cultural context if applicable */
  culturalContext?: 'direct' | 'indirect' | 'high-context' | 'low-context'
}

/**
 * Mixed sentiment analysis for complex emotional states
 */
export interface MixedSentimentScore {
  /** Positive sentiment component */
  positive: SentimentScore
  /** Negative sentiment component */
  negative: SentimentScore
  /** Emotional complexity (0-1) */
  complexity: number
  /** Dominant sentiment direction */
  dominantSentiment: 'positive' | 'negative' | 'mixed' | 'neutral'
  /** Combined emotional state descriptors */
  emotionalState: string[]
  /** Relationship context if relevant */
  relationshipContext?: string
}

/**
 * Psychological indicators for mood analysis
 */
export interface CopingIndicator {
  /** Type of coping mechanism */
  type: 'problem_focused' | 'emotion_focused' | 'meaning_focused'
  /** Strength of indicator (0-1) */
  strength: number
  /** Effectiveness assessment (0-1) */
  effectiveness: number
  /** Emotional impact (0-1) */
  emotionalImpact: number
  /** Contextual relevance (0-1) */
  contextualRelevance: number
}

/**
 * Resilience assessment score
 */
export interface ResilienceScore {
  /** Overall resilience (0-1) */
  overall: number
  /** Recovery capacity (0-1) */
  recoveryCapacity: number
  /** Adaptive flexibility (0-1) */
  adaptiveFlexibility: number
  /** Support utilization (0-1) */
  supportUtilization: number
  /** Confidence in assessment (0-1) */
  confidence: number
}

/**
 * Stress marker indicators
 */
export interface StressIndicator {
  /** Type of stress marker */
  type: 'physiological' | 'emotional' | 'cognitive' | 'behavioral'
  /** Intensity level (0-1) */
  intensity: number
  /** Marker description */
  description: string
  /** Supporting evidence */
  evidence: string[]
}

/**
 * Support pattern evaluation
 */
export interface SupportIndicator {
  /** Type of support */
  type: 'emotional' | 'informational' | 'instrumental' | 'appraisal'
  /** Support quality (0-1) */
  quality: number
  /** Support reciprocity (0-1) */
  reciprocity: number
  /** Support effectiveness (0-1) */
  effectiveness: number
}

/**
 * Growth pattern identification
 */
export interface GrowthIndicator {
  /** Type of growth observed */
  type:
    | 'emotional_maturity'
    | 'self_awareness'
    | 'relationship_skills'
    | 'resilience_building'
  /** Growth evidence strength (0-1) */
  strength: number
  /** Growth trajectory direction */
  direction: 'positive' | 'negative' | 'stable'
  /** Supporting evidence */
  evidence: string[]
}

// Type exports for convenience
export type ConversationDataInput = z.input<typeof ConversationDataSchema>
export type MoodAnalysisInput = z.input<typeof MoodAnalysisResultSchema>
export type SignificanceScoreInput = z.input<
  typeof EmotionalSignificanceScoreSchema
>
