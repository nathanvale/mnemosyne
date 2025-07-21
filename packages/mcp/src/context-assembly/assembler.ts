import type { ExtractedMemory } from '@studio/memory'
import type {
  AgentContext,
  AgentContextConfig,
  TimelineSummary,
  ContextOptimization,
  AgentRecommendations,
} from '../types/index'
import { MoodContextTokenizer } from '../mood-context/tokenizer'
import { RelationalTimelineBuilder } from '../relational-timeline/builder'
import { EmotionalVocabularyExtractor } from '../vocabulary/extractor'
import { logger } from '@studio/logger'
import { v4 as uuidv4 } from 'uuid'

/**
 * AgentContextAssembler creates comprehensive contexts for AI agents
 */
export class AgentContextAssembler {
  private readonly config: AgentContextConfig
  private readonly moodTokenizer: MoodContextTokenizer
  private readonly timelineBuilder: RelationalTimelineBuilder
  private readonly vocabularyExtractor: EmotionalVocabularyExtractor

  constructor(config: Partial<AgentContextConfig> = {}) {
    this.config = {
      maxTokens: 2000,
      relevanceThreshold: 0.6,
      includeRecommendations: true,
      scope: {
        timeWindow: 'month',
        includeHistorical: false,
        prioritizeRecent: true,
      },
      ...config,
    }

    this.moodTokenizer = new MoodContextTokenizer({
      complexityLevel: 'standard',
      includeTrajectory: true,
      maxDescriptors: 5,
    })

    this.timelineBuilder = new RelationalTimelineBuilder({
      maxEvents: 30,
      timeWindow: this.config.scope.timeWindow,
      includeRelationshipEvolution: true,
    })

    this.vocabularyExtractor = new EmotionalVocabularyExtractor({
      maxTermsPerCategory: 8,
      includeEvolution: false,
      sourceScope: 'recent',
    })
  }

  /**
   * Assemble comprehensive agent context
   */
  async assembleContext(
    memories: ExtractedMemory[],
    participantId: string,
    conversationGoal?: string
  ): Promise<AgentContext> {
    logger.info('Assembling agent context', { 
      participantId, 
      memoryCount: memories.length,
      conversationGoal 
    })

    if (memories.length === 0) {
      return this.createEmptyContext(participantId)
    }

    const relevantMemories = await this.filterRelevantMemories(memories, participantId)
    const scopedMemories = this.applyScopeFilters(relevantMemories)

    const [moodContext, timeline, vocabulary] = await Promise.all([
      this.moodTokenizer.generateMoodContext(scopedMemories),
      this.timelineBuilder.buildTimeline(scopedMemories, participantId),
      this.vocabularyExtractor.extractVocabulary(scopedMemories, participantId),
    ])

    const timelineSummary = this.createTimelineSummary(timeline)
    const optimization = await this.calculateOptimization(
      moodContext,
      timelineSummary,
      vocabulary,
      scopedMemories
    )

    const recommendations = this.config.includeRecommendations
      ? await this.generateRecommendations(
          moodContext,
          timelineSummary,
          vocabulary,
          conversationGoal
        )
      : this.getDefaultRecommendations()

    const context: AgentContext = {
      id: uuidv4(),
      participantId,
      createdAt: new Date(),
      moodContext,
      timelineSummary,
      vocabulary,
      optimization,
      recommendations,
    }

    logger.debug('Assembled agent context', {
      contextId: context.id,
      tokenEstimate: optimization.tokenCount,
      relevanceScore: optimization.relevanceScore,
    })

    return context
  }

  /**
   * Optimize context for token constraints
   */
  async optimizeContextSize(
    context: AgentContext,
    maxTokens: number
  ): Promise<AgentContext> {
    if (context.optimization.tokenCount <= maxTokens) {
      return context
    }

    logger.info('Optimizing context size', { 
      currentTokens: context.optimization.tokenCount,
      targetTokens: maxTokens 
    })

    const optimizedContext = { ...context }

    optimizedContext.moodContext.recentMoodTags = context.moodContext.recentMoodTags.slice(0, 5)
    optimizedContext.vocabulary.themes = context.vocabulary.themes.slice(0, 5)
    optimizedContext.vocabulary.moodDescriptors = context.vocabulary.moodDescriptors.slice(0, 5)
    optimizedContext.vocabulary.relationshipTerms = context.vocabulary.relationshipTerms.slice(0, 5)

    if (context.timelineSummary.recentEvents.length > 5) {
      optimizedContext.timelineSummary.recentEvents = context.timelineSummary.recentEvents.slice(0, 5)
    }

    const newOptimization = await this.calculateOptimization(
      optimizedContext.moodContext,
      optimizedContext.timelineSummary,
      optimizedContext.vocabulary,
      []
    )

    optimizedContext.optimization = {
      ...newOptimization,
      optimizations: [...context.optimization.optimizations, 'size_reduction'],
    }

    return optimizedContext
  }

  /**
   * Validate context quality
   */
  async validateContextQuality(context: AgentContext): Promise<number> {
    const quality = context.optimization.qualityMetrics
    const weights = {
      completeness: 0.3,
      relevance: 0.3,
      recency: 0.2,
      coherence: 0.2,
    }

    const score = 
      quality.completeness * weights.completeness +
      quality.relevance * weights.relevance +
      quality.recency * weights.recency +
      quality.coherence * weights.coherence

    logger.debug('Context quality validation', {
      contextId: context.id,
      qualityScore: score,
      metrics: quality,
    })

    return Math.round(score * 100) / 100
  }

  /**
   * Filter memories by relevance to participant
   */
  private async filterRelevantMemories(
    memories: ExtractedMemory[],
    participantId: string
  ): Promise<ExtractedMemory[]> {
    return memories.filter(memory => {
      const isParticipant = memory.participants.some((p: any) => p.id === participantId)
      const significanceThreshold = memory.significance.overall >= this.config.relevanceThreshold * 10
      
      return isParticipant && significanceThreshold
    })
  }

  /**
   * Apply scope filters based on configuration
   */
  private applyScopeFilters(memories: ExtractedMemory[]): ExtractedMemory[] {
    let filteredMemories = memories

    if (!this.config.scope.includeHistorical) {
      const timeWindowMs = this.getTimeWindowMs()
      const cutoffDate = new Date(Date.now() - timeWindowMs)
      
      filteredMemories = filteredMemories.filter(m => new Date(m.timestamp) >= cutoffDate)
    }

    if (this.config.scope.prioritizeRecent) {
      filteredMemories.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    }

    return filteredMemories
  }

  /**
   * Create timeline summary from full timeline
   */
  private createTimelineSummary(timeline: any): TimelineSummary {
    return {
      overview: timeline.summary,
      recentEvents: timeline.events.slice(0, 10),
      relationshipPatterns: timeline.relationshipDynamics
        .flatMap((rd: any) => rd.communicationPatterns)
        .slice(0, 5),
      trajectoryTrend: this.analyzeTrendFromEvents(timeline.events),
    }
  }

  /**
   * Calculate context optimization metrics
   */
  private async calculateOptimization(
    moodContext: any,
    timelineSummary: TimelineSummary,
    vocabulary: any,
    memories: ExtractedMemory[]
  ): Promise<ContextOptimization> {
    const tokenCount = this.estimateTokenCount(moodContext, timelineSummary, vocabulary)
    const relevanceScore = this.calculateRelevanceScore(memories)
    const qualityMetrics = this.assessQualityMetrics(moodContext, timelineSummary, vocabulary)

    return {
      tokenCount,
      relevanceScore,
      qualityMetrics,
      optimizations: [],
    }
  }

  /**
   * Generate agent response recommendations
   */
  private async generateRecommendations(
    moodContext: any,
    timelineSummary: TimelineSummary,
    vocabulary: any,
    conversationGoal?: string
  ): Promise<AgentRecommendations> {
    const tone = this.recommendTone(moodContext, vocabulary)
    const approach = this.recommendApproach(moodContext, conversationGoal)
    const emphasize = this.recommendEmphasis(timelineSummary, vocabulary)
    const avoid = this.recommendAvoidance(moodContext, timelineSummary)
    const responseLength = this.recommendResponseLength(moodContext, conversationGoal)

    return {
      tone,
      approach,
      emphasize,
      avoid,
      responseLength,
    }
  }

  /**
   * Recommend communication tone
   */
  private recommendTone(moodContext: any, vocabulary: any): string[] {
    const tone: string[] = []
    
    const moodScore = moodContext.currentMood.score
    const communicationTone = vocabulary.communicationStyle.tone

    if (moodScore <= 4) {
      tone.push('supportive', 'gentle', 'understanding')
    } else if (moodScore >= 7) {
      tone.push('positive', 'encouraging', 'celebratory')
    } else {
      tone.push('balanced', 'thoughtful')
    }

    const topCommunicationTones = communicationTone.slice(0, 2)
    tone.push(...topCommunicationTones)

    return [...new Set(tone)].slice(0, 4)
  }

  /**
   * Recommend communication approach
   */
  private recommendApproach(
    moodContext: any,
    conversationGoal?: string
  ): 'supportive' | 'analytical' | 'celebratory' | 'empathetic' {
    const moodScore = moodContext.currentMood.score
    const moodTrend = moodContext.moodTrend.direction

    if (conversationGoal?.toLowerCase().includes('celebrate')) {
      return 'celebratory'
    }

    if (moodScore <= 4 || moodTrend === 'declining') {
      return 'empathetic'
    }

    if (moodScore >= 7 && moodTrend === 'improving') {
      return 'celebratory'
    }

    if (conversationGoal?.toLowerCase().includes('analyze')) {
      return 'analytical'
    }

    return 'supportive'
  }

  /**
   * Recommend topics to emphasize
   */
  private recommendEmphasis(timelineSummary: TimelineSummary, vocabulary: any): string[] {
    const emphasize: string[] = []

    const positivePatterns = timelineSummary.relationshipPatterns.filter(p =>
      p.includes('support') || p.includes('growth') || p.includes('positive')
    )
    emphasize.push(...positivePatterns)

    const topThemes = vocabulary.themes.slice(0, 3)
    emphasize.push(...topThemes)

    const recentPositiveEvents = timelineSummary.recentEvents.filter(e =>
      e.type === 'support_exchange' || e.emotionalImpact > 5
    )
    if (recentPositiveEvents.length > 0) {
      emphasize.push('recent achievements', 'positive moments')
    }

    return [...new Set(emphasize)].slice(0, 5)
  }

  /**
   * Recommend topics to avoid
   */
  private recommendAvoidance(moodContext: any, timelineSummary: TimelineSummary): string[] {
    const avoid: string[] = []

    const moodScore = moodContext.currentMood.score
    if (moodScore <= 4) {
      avoid.push('criticism', 'pressure', 'overwhelming topics')
    }

    const negativeEvents = timelineSummary.recentEvents.filter(e =>
      (e.emotionalImpact < 0)
    )
    if (negativeEvents.length > 2) {
      avoid.push('dwelling on difficulties', 'past setbacks')
    }

    if (moodContext.moodTrend.direction === 'volatile') {
      avoid.push('major decisions', 'complex topics')
    }

    return avoid.slice(0, 4)
  }

  /**
   * Recommend response length
   */
  private recommendResponseLength(
    moodContext: any,
    conversationGoal?: string
  ): 'brief' | 'moderate' | 'detailed' {
    const moodScore = moodContext.currentMood.score
    
    if (moodScore <= 3 || moodContext.moodTrend.direction === 'volatile') {
      return 'brief'
    }

    if (conversationGoal?.toLowerCase().includes('detailed') || 
        conversationGoal?.toLowerCase().includes('analyze')) {
      return 'detailed'
    }

    return 'moderate'
  }

  /**
   * Analyze trend from events
   */
  private analyzeTrendFromEvents(events: any[]): string {
    if (events.length === 0) return 'no data available'

    const recentEvents = events.slice(-5)
    const positiveEvents = recentEvents.filter(e => e.emotionalImpact > 5).length
    const negativeEvents = recentEvents.filter(e => e.emotionalImpact < 0).length

    if (positiveEvents > negativeEvents) return 'positive trajectory'
    if (negativeEvents > positiveEvents) return 'challenging period'
    return 'mixed emotional landscape'
  }

  /**
   * Estimate token count for context
   */
  private estimateTokenCount(moodContext: any, timelineSummary: any, vocabulary: any): number {
    const baseTokens = 200
    
    const moodTokens = 
      moodContext.currentMood.descriptors.length * 2 +
      moodContext.recentMoodTags.length * 2 +
      moodContext.trajectoryOverview.length / 4

    const timelineTokens = 
      timelineSummary.overview.length / 4 +
      timelineSummary.recentEvents.length * 15 +
      timelineSummary.relationshipPatterns.length * 3

    const vocabularyTokens = 
      vocabulary.themes.length * 2 +
      vocabulary.moodDescriptors.length * 2 +
      vocabulary.relationshipTerms.length * 2 +
      vocabulary.communicationStyle.tone.length * 2

    return Math.round(baseTokens + moodTokens + timelineTokens + vocabularyTokens)
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevanceScore(memories: ExtractedMemory[]): number {
    if (memories.length === 0) return 0

    const significanceScores = memories.map(m => m.significance.overall)
    const averageSignificance = significanceScores.reduce((sum, s) => sum + s, 0) / significanceScores.length
    
    const recentMemories = memories.filter(m => {
      const daysSince = (Date.now() - new Date(m.timestamp).getTime()) / (1000 * 60 * 60 * 24)
      return daysSince <= 7
    })
    
    const recencyFactor = Math.min(recentMemories.length / Math.min(memories.length, 5), 1)
    
    return Math.min((averageSignificance / 10) * recencyFactor, 1)
  }

  /**
   * Assess context quality metrics
   */
  private assessQualityMetrics(moodContext: any, timelineSummary: any, vocabulary: any) {
    const completeness = Math.min(
      (moodContext.recentMoodTags.length / 5 + 
       timelineSummary.recentEvents.length / 10 + 
       vocabulary.themes.length / 8) / 3,
      1
    )

    const relevance = moodContext.currentMood.confidence * 0.5 + 
                     (timelineSummary.recentEvents.length > 0 ? 0.5 : 0)

    const recency = moodContext.moodTrend.duration !== 'no_data' ? 0.8 : 0.2

    const coherence = (vocabulary.communicationStyle.tone.length > 0 ? 0.5 : 0) +
                     (timelineSummary.trajectoryTrend !== 'no data available' ? 0.5 : 0)

    return {
      completeness: Math.round(completeness * 100) / 100,
      relevance: Math.round(relevance * 100) / 100,
      recency: Math.round(recency * 100) / 100,
      coherence: Math.round(coherence * 100) / 100,
    }
  }

  /**
   * Get time window in milliseconds
   */
  private getTimeWindowMs(): number {
    const msPerDay = 24 * 60 * 60 * 1000
    
    switch (this.config.scope.timeWindow) {
      case 'week': return 7 * msPerDay
      case 'month': return 30 * msPerDay
      case 'quarter': return 90 * msPerDay
      default: return 30 * msPerDay
    }
  }

  /**
   * Get default recommendations
   */
  private getDefaultRecommendations(): AgentRecommendations {
    return {
      tone: ['balanced', 'thoughtful'],
      approach: 'supportive',
      emphasize: ['current context'],
      avoid: ['assumptions'],
      responseLength: 'moderate',
    }
  }

  /**
   * Create empty context for no data scenarios
   */
  private createEmptyContext(participantId: string): AgentContext {
    return {
      id: uuidv4(),
      participantId,
      createdAt: new Date(),
      moodContext: {
        currentMood: {
          score: 5,
          descriptors: ['neutral'],
          confidence: 0,
        },
        moodTrend: {
          direction: 'stable',
          magnitude: 0,
          duration: 'no_data',
        },
        recentMoodTags: [],
        trajectoryOverview: 'No emotional history available.',
      },
      timelineSummary: {
        overview: 'No timeline data available.',
        recentEvents: [],
        relationshipPatterns: [],
        trajectoryTrend: 'no data available',
      },
      vocabulary: {
        participantId,
        themes: [],
        moodDescriptors: ['neutral'],
        relationshipTerms: [],
        communicationStyle: {
          tone: ['neutral'],
          expressiveness: 'direct',
          supportLanguage: [],
        },
        evolution: [],
      },
      optimization: {
        tokenCount: 150,
        relevanceScore: 0,
        qualityMetrics: {
          completeness: 0,
          relevance: 0,
          recency: 0,
          coherence: 0,
        },
        optimizations: ['minimal_data'],
      },
      recommendations: this.getDefaultRecommendations(),
    }
  }
}