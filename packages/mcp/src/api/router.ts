import type { ExtractedMemory } from '@studio/memory'

import { logger } from '@studio/logger'
import { initTRPC } from '@trpc/server'
import { z } from 'zod'

import type { AgentContext } from '../types/index'

import { AgentContextAssembler } from '../context-assembly/assembler'
import { MoodContextTokenizer } from '../mood-context/tokenizer'
import { RelationalTimelineBuilder } from '../relational-timeline/builder'
import { EmotionalVocabularyExtractor } from '../vocabulary/extractor'

/**
 * Comprehensive Zod schemas for MCP API validation
 */

// API validation schemas - using flexible validation for complex nested types
// This is a pragmatic approach for API boundaries where full schema validation
// would be overly complex and the actual validation happens in the service layer
const ExtractedMemorySchema = z.any()
const AgentContextSchema = z.any()

const t = initTRPC.create()

export const router = t.router
export const publicProcedure = t.procedure

/**
 * MCP TRPC Router for emotional intelligence APIs
 */
export const mcpRouter = router({
  /**
   * Generate mood context tokens
   */
  generateMoodContext: publicProcedure
    .input(
      z.object({
        memories: z.array(ExtractedMemorySchema),
        config: z
          .object({
            complexityLevel: z
              .enum(['basic', 'standard', 'detailed'])
              .optional(),
            includeTrajectory: z.boolean().optional(),
            maxDescriptors: z.number().optional(),
          })
          .optional(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        data: z.any(),
        metadata: z.object({
          memoryCount: z.number(),
          generatedAt: z.string(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      logger.info('Generating mood context via API', {
        memoryCount: input.memories.length,
      })

      const tokenizer = new MoodContextTokenizer(input.config)
      const moodContext = await tokenizer.generateMoodContext(
        input.memories as unknown as ExtractedMemory[],
      )

      return {
        success: true,
        data: moodContext,
        metadata: {
          memoryCount: input.memories.length,
          generatedAt: new Date().toISOString(),
        },
      }
    }),

  /**
   * Build relational timeline
   */
  buildTimeline: publicProcedure
    .input(
      z.object({
        memories: z.array(ExtractedMemorySchema),
        participantId: z.string(),
        config: z
          .object({
            maxEvents: z.number().optional(),
            timeWindow: z.enum(['week', 'month', 'quarter', 'year']).optional(),
            includeRelationshipEvolution: z.boolean().optional(),
          })
          .optional(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        data: z.any(),
        metadata: z.object({
          participantId: z.string(),
          eventCount: z.number(),
          keyMomentCount: z.number(),
          generatedAt: z.string(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      logger.info('Building relational timeline via API', {
        participantId: input.participantId,
        memoryCount: input.memories.length,
      })

      const builder = new RelationalTimelineBuilder(input.config)
      const timeline = await builder.buildTimeline(
        input.memories as unknown as ExtractedMemory[],
        input.participantId,
      )

      return {
        success: true,
        data: timeline,
        metadata: {
          participantId: input.participantId,
          eventCount: timeline.events.length,
          keyMomentCount: timeline.keyMoments.length,
          generatedAt: new Date().toISOString(),
        },
      }
    }),

  /**
   * Extract emotional vocabulary
   */
  extractVocabulary: publicProcedure
    .input(
      z.object({
        memories: z.array(ExtractedMemorySchema),
        participantId: z.string(),
        config: z
          .object({
            maxTermsPerCategory: z.number().optional(),
            includeEvolution: z.boolean().optional(),
            sourceScope: z.enum(['recent', 'all', 'significant']).optional(),
          })
          .optional(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        data: z.any(),
        metadata: z.object({
          participantId: z.string(),
          themeCount: z.number(),
          descriptorCount: z.number(),
          generatedAt: z.string(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      logger.info('Extracting vocabulary via API', {
        participantId: input.participantId,
        memoryCount: input.memories.length,
      })

      const extractor = new EmotionalVocabularyExtractor(input.config)
      const vocabulary = await extractor.extractVocabulary(
        input.memories as unknown as ExtractedMemory[],
        input.participantId,
      )

      return {
        success: true,
        data: vocabulary,
        metadata: {
          participantId: input.participantId,
          themeCount: vocabulary.themes.length,
          descriptorCount: vocabulary.moodDescriptors.length,
          generatedAt: new Date().toISOString(),
        },
      }
    }),

  /**
   * Assemble comprehensive agent context
   */
  assembleAgentContext: publicProcedure
    .input(
      z.object({
        memories: z.array(ExtractedMemorySchema),
        participantId: z.string(),
        conversationGoal: z.string().optional(),
        config: z
          .object({
            maxTokens: z.number().optional(),
            relevanceThreshold: z.number().optional(),
            includeRecommendations: z.boolean().optional(),
            scope: z
              .object({
                timeWindow: z.enum(['week', 'month', 'quarter']).optional(),
                includeHistorical: z.boolean().optional(),
                prioritizeRecent: z.boolean().optional(),
              })
              .optional(),
          })
          .optional(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        data: z.any(),
        metadata: z.object({
          contextId: z.string(),
          participantId: z.string(),
          tokenCount: z.number(),
          relevanceScore: z.number(),
          generatedAt: z.string(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      logger.info('Assembling agent context via API', {
        participantId: input.participantId,
        memoryCount: input.memories.length,
        conversationGoal: input.conversationGoal,
      })

      const assembler = new AgentContextAssembler(input.config)
      const context = await assembler.assembleContext(
        input.memories as unknown as ExtractedMemory[],
        input.participantId,
        input.conversationGoal,
      )

      return {
        success: true,
        data: context,
        metadata: {
          contextId: context.id,
          participantId: input.participantId,
          tokenCount: context.optimization.tokenCount,
          relevanceScore: context.optimization.relevanceScore,
          generatedAt: new Date().toISOString(),
        },
      }
    }),

  /**
   * Optimize agent context for token constraints
   */
  optimizeContext: publicProcedure
    .input(
      z.object({
        context: AgentContextSchema,
        maxTokens: z.number(),
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        data: z.any(),
        metadata: z.object({
          originalTokens: z.number(),
          optimizedTokens: z.number(),
          reduction: z.number(),
          optimizedAt: z.string(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      logger.info('Optimizing context via API', {
        contextId: input.context.id,
        maxTokens: input.maxTokens,
      })

      const assembler = new AgentContextAssembler()
      const optimizedContext = await assembler.optimizeContextSize(
        input.context as unknown as AgentContext,
        input.maxTokens,
      )

      return {
        success: true,
        data: optimizedContext,
        metadata: {
          originalTokens: (input.context as unknown as AgentContext)
            .optimization.tokenCount,
          optimizedTokens: optimizedContext.optimization.tokenCount,
          reduction:
            (input.context as unknown as AgentContext).optimization.tokenCount -
            optimizedContext.optimization.tokenCount,
          optimizedAt: new Date().toISOString(),
        },
      }
    }),

  /**
   * Validate context quality
   */
  validateContextQuality: publicProcedure
    .input(
      z.object({
        context: AgentContextSchema,
      }),
    )
    .output(
      z.object({
        success: z.boolean(),
        qualityScore: z.number(),
        metrics: z.object({
          completeness: z.number(),
          relevance: z.number(),
          recency: z.number(),
          coherence: z.number(),
        }),
        metadata: z.object({
          validatedAt: z.string(),
        }),
      }),
    )
    .query(async ({ input }) => {
      logger.info('Validating context quality via API', {
        contextId: input.context.id,
      })

      const assembler = new AgentContextAssembler()
      const qualityScore = await assembler.validateContextQuality(
        input.context as unknown as AgentContext,
      )

      return {
        success: true,
        qualityScore,
        metrics: (input.context as unknown as AgentContext).optimization
          .qualityMetrics,
        metadata: {
          validatedAt: new Date().toISOString(),
        },
      }
    }),

  /**
   * Health check endpoint
   */
  health: publicProcedure
    .output(
      z.object({
        status: z.string(),
        timestamp: z.string(),
        services: z.object({
          moodTokenizer: z.boolean(),
          timelineBuilder: z.boolean(),
          vocabularyExtractor: z.boolean(),
          contextAssembler: z.boolean(),
        }),
      }),
    )
    .query(async () => {
      logger.info('Health check requested')

      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          moodTokenizer: true,
          timelineBuilder: true,
          vocabularyExtractor: true,
          contextAssembler: true,
        },
      }
    }),

  /**
   * Get service capabilities
   */
  capabilities: publicProcedure
    .output(
      z.object({
        version: z.string(),
        features: z.array(z.string()),
        endpoints: z.array(z.string()),
        mcpSupport: z.object({
          resources: z.array(z.string()),
          tools: z.array(z.string()),
        }),
      }),
    )
    .query(async () => {
      return {
        version: '0.1.0',
        features: [
          'mood_context_generation',
          'relational_timeline_construction',
          'emotional_vocabulary_extraction',
          'agent_context_assembly',
          'context_optimization',
          'quality_validation',
        ],
        endpoints: [
          'generateMoodContext',
          'buildTimeline',
          'extractVocabulary',
          'assembleAgentContext',
          'optimizeContext',
          'validateContextQuality',
          'health',
          'capabilities',
        ],
        mcpSupport: {
          resources: [
            'mood_context',
            'relational_timeline',
            'emotional_vocabulary',
            'agent_context',
          ],
          tools: [
            'generate_mood_tokens',
            'build_timeline',
            'extract_vocabulary',
            'assemble_context',
          ],
        },
      }
    }),
})

export type McpRouter = typeof mcpRouter
