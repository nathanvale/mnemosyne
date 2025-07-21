// Core MCP interfaces and types

import { z } from 'zod'

/**
 * Mood context tokens for agent consumption
 */
export interface MoodContextTokens {
  /** Current mood assessment */
  currentMood: {
    score: number
    descriptors: string[]
    confidence: number
  }
  /** Mood trend analysis */
  moodTrend: {
    direction: 'improving' | 'declining' | 'stable' | 'volatile'
    magnitude: number
    duration: string
  }
  /** Recent mood tags */
  recentMoodTags: string[]
  /** Emotional trajectory summary */
  trajectoryOverview: string
}

/**
 * Relational timeline for emotional events
 */
export interface RelationalTimeline {
  /** Timeline identifier */
  id: string
  /** Participant this timeline belongs to */
  participantId: string
  /** Timeline creation timestamp */
  createdAt: Date
  /** Chronological emotional events */
  events: EmotionalEvent[]
  /** Key relationship moments */
  keyMoments: EmotionalKeyMoment[]
  /** Timeline summary */
  summary: string
  /** Relationship dynamics over time */
  relationshipDynamics: RelationshipEvolution[]
}

/**
 * Individual emotional event in timeline
 */
export interface EmotionalEvent {
  /** Event identifier */
  id: string
  /** Event timestamp */
  timestamp: Date
  /** Event type */
  type:
    | 'mood_change'
    | 'relationship_shift'
    | 'significant_moment'
    | 'support_exchange'
  /** Event description */
  description: string
  /** Emotional impact score */
  emotionalImpact: number
  /** Participants involved */
  participants: string[]
  /** Source memory */
  sourceMemoryId: string
}

/**
 * Key emotional moments in timeline
 */
export interface EmotionalKeyMoment {
  /** Moment identifier */
  id: string
  /** Moment timestamp */
  timestamp: Date
  /** Moment type */
  type:
    | 'breakthrough'
    | 'setback'
    | 'realization'
    | 'support_received'
    | 'growth'
  /** Moment description */
  description: string
  /** Significance score */
  significance: number
  /** Contributing factors */
  factors: string[]
  /** Emotional state before/after */
  emotionalDelta: {
    before: string[]
    after: string[]
    magnitude: number
  }
}

/**
 * Evolution of relationship dynamics
 */
export interface RelationshipEvolution {
  /** Time period */
  period: {
    start: Date
    end: Date
  }
  /** Relationship quality indicators */
  qualityMetrics: {
    supportLevel: number
    communicationClarity: number
    emotionalIntimacy: number
    conflictResolution: number
  }
  /** Dominant communication patterns */
  communicationPatterns: string[]
  /** Relationship milestones */
  milestones: string[]
}

/**
 * Emotional vocabulary for agent responses
 */
export interface EmotionalVocabulary {
  /** Participant identifier */
  participantId: string
  /** Emotional themes */
  themes: string[]
  /** Mood descriptors */
  moodDescriptors: string[]
  /** Relationship terms */
  relationshipTerms: string[]
  /** Communication style indicators */
  communicationStyle: {
    tone: string[]
    expressiveness: 'direct' | 'metaphorical' | 'analytical' | 'emotional'
    supportLanguage: string[]
  }
  /** Vocabulary evolution over time */
  evolution: VocabularyEvolution[]
}

/**
 * Evolution of vocabulary over time
 */
export interface VocabularyEvolution {
  /** Time period */
  period: {
    start: Date
    end: Date
  }
  /** New terms introduced */
  newTerms: string[]
  /** Terms that became more frequent */
  increasingTerms: string[]
  /** Terms that became less frequent */
  decreasingTerms: string[]
}

/**
 * Comprehensive agent context
 */
export interface AgentContext {
  /** Context identifier */
  id: string
  /** Target participant */
  participantId: string
  /** Context creation timestamp */
  createdAt: Date
  /** Mood context tokens */
  moodContext: MoodContextTokens
  /** Relational timeline summary */
  timelineSummary: TimelineSummary
  /** Emotional vocabulary */
  vocabulary: EmotionalVocabulary
  /** Context optimization metadata */
  optimization: ContextOptimization
  /** Agent-specific recommendations */
  recommendations: AgentRecommendations
}

/**
 * Summarized timeline for agent context
 */
export interface TimelineSummary {
  /** Overall timeline overview */
  overview: string
  /** Recent significant events */
  recentEvents: EmotionalEvent[]
  /** Key relationship patterns */
  relationshipPatterns: string[]
  /** Emotional trajectory trend */
  trajectoryTrend: string
}

/**
 * Context optimization metadata
 */
export interface ContextOptimization {
  /** Token count estimate */
  tokenCount: number
  /** Relevance score */
  relevanceScore: number
  /** Context quality metrics */
  qualityMetrics: {
    completeness: number
    relevance: number
    recency: number
    coherence: number
  }
  /** Optimization applied */
  optimizations: string[]
}

/**
 * Agent response recommendations
 */
export interface AgentRecommendations {
  /** Recommended tone */
  tone: string[]
  /** Communication approach */
  approach: 'supportive' | 'analytical' | 'celebratory' | 'empathetic'
  /** Topics to emphasize */
  emphasize: string[]
  /** Topics to avoid */
  avoid: string[]
  /** Response length recommendation */
  responseLength: 'brief' | 'moderate' | 'detailed'
}

/**
 * MCP server foundation interfaces
 */
export interface MCPResource {
  /** Resource identifier */
  id: string
  /** Resource type */
  type: 'mood_context' | 'timeline' | 'vocabulary' | 'agent_context'
  /** Resource name */
  name: string
  /** Resource description */
  description: string
  /** Resource schema */
  schema: z.ZodSchema
}

/**
 * MCP tool definition
 */
export interface MCPTool {
  /** Tool identifier */
  id: string
  /** Tool name */
  name: string
  /** Tool description */
  description: string
  /** Input schema */
  inputSchema: z.ZodSchema
  /** Output schema */
  outputSchema: z.ZodSchema
  /** Tool handler function */
  handler: (input: unknown) => Promise<unknown>
}

/**
 * Configuration interfaces
 */
export interface MoodContextConfig {
  /** Token complexity level */
  complexityLevel: 'basic' | 'standard' | 'detailed'
  /** Include trajectory analysis */
  includeTrajectory: boolean
  /** Maximum descriptors per mood */
  maxDescriptors: number
}

export interface TimelineConfig {
  /** Maximum events to include */
  maxEvents: number
  /** Time window for analysis */
  timeWindow: 'week' | 'month' | 'quarter' | 'year'
  /** Include relationship evolution */
  includeRelationshipEvolution: boolean
}

export interface VocabularyConfig {
  /** Maximum terms per category */
  maxTermsPerCategory: number
  /** Include evolution tracking */
  includeEvolution: boolean
  /** Vocabulary source scope */
  sourceScope: 'recent' | 'all' | 'significant'
}

export interface AgentContextScope {
  timeWindow?: 'week' | 'month' | 'quarter'
  includeHistorical?: boolean
  prioritizeRecent?: boolean
}

export interface AgentContextConfig {
  /** Maximum token count */
  maxTokens: number
  /** Relevance threshold */
  relevanceThreshold: number
  /** Include recommendations */
  includeRecommendations: boolean
  /** Context scope */
  scope: AgentContextScope
}

/**
 * Zod schemas for validation
 */
export const MoodContextTokensSchema = z.object({
  currentMood: z.object({
    score: z.number().min(0).max(10),
    descriptors: z.array(z.string()),
    confidence: z.number().min(0).max(1),
  }),
  moodTrend: z.object({
    direction: z.enum(['improving', 'declining', 'stable', 'volatile']),
    magnitude: z.number().min(0),
    duration: z.string(),
  }),
  recentMoodTags: z.array(z.string()),
  trajectoryOverview: z.string(),
})

export const AgentContextSchema = z.object({
  id: z.string(),
  participantId: z.string(),
  createdAt: z.date(),
  moodContext: MoodContextTokensSchema,
  timelineSummary: z.object({
    overview: z.string(),
    recentEvents: z.array(z.any()),
    relationshipPatterns: z.array(z.string()),
    trajectoryTrend: z.string(),
  }),
  vocabulary: z.object({
    participantId: z.string(),
    themes: z.array(z.string()),
    moodDescriptors: z.array(z.string()),
    relationshipTerms: z.array(z.string()),
    communicationStyle: z.any(),
    evolution: z.array(z.any()),
  }),
  optimization: z.object({
    tokenCount: z.number(),
    relevanceScore: z.number().min(0).max(1),
    qualityMetrics: z.object({
      completeness: z.number().min(0).max(1),
      relevance: z.number().min(0).max(1),
      recency: z.number().min(0).max(1),
      coherence: z.number().min(0).max(1),
    }),
    optimizations: z.array(z.string()),
  }),
  recommendations: z.object({
    tone: z.array(z.string()),
    approach: z.enum(['supportive', 'analytical', 'celebratory', 'empathetic']),
    emphasize: z.array(z.string()),
    avoid: z.array(z.string()),
    responseLength: z.enum(['brief', 'moderate', 'detailed']),
  }),
})

/**
 * Type exports for convenience
 */
/**
 * Type exports for convenience
 */
export type MoodContextTokensInput = z.input<typeof MoodContextTokensSchema>
export type AgentContextInput = z.input<typeof AgentContextSchema>
