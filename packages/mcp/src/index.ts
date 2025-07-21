/**
 * @studio/mcp - MCP foundation layer for Phase 3 agent integration
 *
 * This package provides emotional intelligence endpoints, mood context tokens,
 * relational timeline construction, and emotional vocabulary extraction to enable
 * Phase 3 Claude agent integration.
 */

// Core types and interfaces
export * from './types/index'

// Mood context tokenization
export { MoodContextTokenizer } from './mood-context/tokenizer'

// Relational timeline construction
export { RelationalTimelineBuilder } from './relational-timeline/builder'

// Emotional vocabulary extraction
export { EmotionalVocabularyExtractor } from './vocabulary/extractor'

// Agent context assembly
export { AgentContextAssembler } from './context-assembly/assembler'

// API layer
export { mcpRouter, type McpRouter } from './api/router'
export { McpExpressServer, createMcpServer } from './api/server'

/**
 * Main MCP service factory
 */
export interface McpService {
  moodTokenizer: import('./mood-context/tokenizer').MoodContextTokenizer
  timelineBuilder: import('./relational-timeline/builder').RelationalTimelineBuilder
  vocabularyExtractor: import('./vocabulary/extractor').EmotionalVocabularyExtractor
  contextAssembler: import('./context-assembly/assembler').AgentContextAssembler
  server?: import('./api/server').McpExpressServer
}

/**
 * Create a complete MCP service instance
 */
export async function createMcpService(config?: {
  server?: {
    enabled: boolean
    port?: number
  }
  mood?: {
    complexityLevel?: 'basic' | 'standard' | 'detailed'
    includeTrajectory?: boolean
    maxDescriptors?: number
  }
  timeline?: {
    maxEvents?: number
    timeWindow?: 'week' | 'month' | 'quarter' | 'year'
    includeRelationshipEvolution?: boolean
  }
  vocabulary?: {
    maxTermsPerCategory?: number
    includeEvolution?: boolean
    sourceScope?: 'recent' | 'all' | 'significant'
  }
  context?: {
    maxTokens?: number
    relevanceThreshold?: number
    includeRecommendations?: boolean
    scope?: {
      timeWindow?: 'week' | 'month' | 'quarter'
      includeHistorical?: boolean
      prioritizeRecent?: boolean
    }
  }
}): Promise<McpService> {
  // Dynamic imports to avoid circular dependencies
  const { MoodContextTokenizer } = await import('./mood-context/tokenizer')
  const { RelationalTimelineBuilder } = await import('./relational-timeline/builder')
  const { EmotionalVocabularyExtractor } = await import('./vocabulary/extractor')
  const { AgentContextAssembler } = await import('./context-assembly/assembler')

  const service: McpService = {
    moodTokenizer: new MoodContextTokenizer(config?.mood),
    timelineBuilder: new RelationalTimelineBuilder(config?.timeline),
    vocabularyExtractor: new EmotionalVocabularyExtractor(config?.vocabulary),
    contextAssembler: new AgentContextAssembler(config?.context),
  }

  if (config?.server?.enabled) {
    const { createMcpServer } = await import('./api/server')
    service.server = createMcpServer(config.server.port)
  }

  return service
}

/**
 * MCP utilities for common operations
 */
export const McpUtils = {
  /**
   * Create optimized configuration for different use cases
   */
  createConfig: {
    /** Fast processing for real-time agent responses */
    realtime: () => ({
      mood: { complexityLevel: 'basic' as const, maxDescriptors: 3 },
      timeline: { maxEvents: 20, timeWindow: 'month' as const },
      vocabulary: { maxTermsPerCategory: 5, sourceScope: 'recent' as const },
      context: { maxTokens: 1000, relevanceThreshold: 0.7 },
    }),

    /** Comprehensive analysis for detailed agent context */
    comprehensive: () => ({
      mood: { complexityLevel: 'detailed' as const, includeTrajectory: true },
      timeline: { maxEvents: 50, includeRelationshipEvolution: true },
      vocabulary: { includeEvolution: true, sourceScope: 'all' as const },
      context: { maxTokens: 3000, includeRecommendations: true },
    }),

    /** Balanced configuration for general use */
    balanced: () => ({
      mood: { complexityLevel: 'standard' as const, includeTrajectory: true },
      timeline: { maxEvents: 30, timeWindow: 'quarter' as const },
      vocabulary: { maxTermsPerCategory: 8, sourceScope: 'recent' as const },
      context: { maxTokens: 2000, relevanceThreshold: 0.6 },
    }),
  },

  /**
   * Validate MCP service health
   */
  async validateService(service: McpService): Promise<{
    healthy: boolean
    services: Record<string, boolean>
    errors: string[]
  }> {
    const errors: string[] = []
    const services = {
      moodTokenizer: !!service.moodTokenizer,
      timelineBuilder: !!service.timelineBuilder,
      vocabularyExtractor: !!service.vocabularyExtractor,
      contextAssembler: !!service.contextAssembler,
      server: !!service.server,
    }

    try {
      const testMemories: any[] = []
      await service.moodTokenizer.generateMoodContext(testMemories)
    } catch (error) {
      services.moodTokenizer = false
      errors.push('MoodTokenizer validation failed')
    }

    return {
      healthy: errors.length === 0,
      services,
      errors,
    }
  },

  /**
   * Create MCP resource definitions for future MCP server implementation
   */
  createMcpResources: () => [
    {
      id: 'mood_context',
      type: 'mood_context' as const,
      name: 'Mood Context Tokens',
      description: 'Current mood assessment and trajectory for agent consumption',
      schema: {} as any, // Will be populated with Zod schemas
    },
    {
      id: 'relational_timeline',
      type: 'timeline' as const,
      name: 'Relational Timeline',
      description: 'Chronological emotional events and relationship dynamics',
      schema: {} as any,
    },
    {
      id: 'emotional_vocabulary',
      type: 'vocabulary' as const,
      name: 'Emotional Vocabulary',
      description: 'Tone-consistent vocabulary for agent responses',
      schema: {} as any,
    },
    {
      id: 'agent_context',
      type: 'agent_context' as const,
      name: 'Agent Context',
      description: 'Comprehensive emotional intelligence context for agents',
      schema: {} as any,
    },
  ],
}

/**
 * Default MCP service instance for convenience
 */
export const defaultMcpService = createMcpService(McpUtils.createConfig.balanced())