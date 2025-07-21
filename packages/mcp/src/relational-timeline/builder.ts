import type { ExtractedMemory } from '@studio/memory'
import type {
  RelationalTimeline,
  EmotionalEvent,
  EmotionalKeyMoment,
  RelationshipEvolution,
  TimelineConfig,
} from '../types/index'
import { logger } from '@studio/logger'
import { v4 as uuidv4 } from 'uuid'

/**
 * RelationalTimelineBuilder constructs emotional event timelines
 */
export class RelationalTimelineBuilder {
  private readonly config: TimelineConfig

  constructor(config: Partial<TimelineConfig> = {}) {
    this.config = {
      maxEvents: 50,
      timeWindow: 'quarter',
      includeRelationshipEvolution: true,
      ...config,
    }
  }

  /**
   * Build relational timeline from extracted memories
   */
  async buildTimeline(
    memories: ExtractedMemory[],
    participantId: string
  ): Promise<RelationalTimeline> {
    logger.info('Building relational timeline', { 
      participantId, 
      memoryCount: memories.length 
    })

    if (memories.length === 0) {
      return this.createEmptyTimeline(participantId)
    }

    const filteredMemories = this.filterMemoriesByTimeWindow(memories)
    const sortedMemories = this.sortMemoriesByTime(filteredMemories)

    const events = await this.extractEmotionalEvents(sortedMemories, participantId)
    const keyMoments = await this.identifyKeyMoments(events, sortedMemories)
    const relationshipDynamics = this.config.includeRelationshipEvolution
      ? await this.analyzeRelationshipEvolution(sortedMemories, participantId)
      : []

    const summary = await this.generateTimelineSummary(events, keyMoments, relationshipDynamics)

    const timeline: RelationalTimeline = {
      id: uuidv4(),
      participantId,
      createdAt: new Date(),
      events: events.slice(0, this.config.maxEvents),
      keyMoments,
      summary,
      relationshipDynamics,
    }

    logger.debug('Built relational timeline', {
      timelineId: timeline.id,
      eventCount: timeline.events.length,
      keyMomentCount: timeline.keyMoments.length,
    })

    return timeline
  }

  /**
   * Extract emotional events from memories
   */
  private async extractEmotionalEvents(
    memories: ExtractedMemory[],
    participantId: string
  ): Promise<EmotionalEvent[]> {
    const events: EmotionalEvent[] = []

    for (const memory of memories) {
      const emotionalEvents = await this.analyzeMemoryForEvents(memory, participantId)
      events.push(...emotionalEvents)
    }

    return this.deduplicateEvents(events)
  }

  /**
   * Analyze individual memory for emotional events
   */
  private async analyzeMemoryForEvents(
    memory: ExtractedMemory,
    participantId: string
  ): Promise<EmotionalEvent[]> {
    const events: EmotionalEvent[] = []

    const moodScore = memory.emotionalAnalysis.moodScoring.score
    const significance = memory.significance.overall

    if (memory.emotionalAnalysis.moodScoring.delta) {
      const delta = memory.emotionalAnalysis.moodScoring.delta
      if (Math.abs(delta.magnitude) > 1) {
        events.push({
          id: uuidv4(),
          timestamp: new Date(memory.timestamp),
          type: 'mood_change',
          description: `Mood ${delta.direction} shift: ${delta.type}`,
          emotionalImpact: Math.abs(delta.magnitude),
          participants: [participantId],
          sourceMemoryId: memory.id,
        })
      }
    }

    if (memory.relationshipDynamics && (memory.relationshipDynamics as any).quality > 7) {
      events.push({
        id: uuidv4(),
        timestamp: new Date(memory.timestamp),
        type: 'relationship_shift',
        description: 'Positive relationship dynamics observed',
        emotionalImpact: (memory.relationshipDynamics as any).quality / 10 * 5,
        participants: memory.participants.map((p: any) => p.id),
        sourceMemoryId: memory.id,
      })
    }

    if (significance > 8) {
      events.push({
        id: uuidv4(),
        timestamp: new Date(memory.timestamp),
        type: 'significant_moment',
        description: memory.content.substring(0, 100) + '...',
        emotionalImpact: significance,
        participants: memory.participants.map((p: any) => p.id),
        sourceMemoryId: memory.id,
      })
    }

    const supportPatterns = memory.emotionalAnalysis.patterns.filter(
      p => p.type === 'support_seeking' || p.type === 'mood_repair'
    )
    
    if (supportPatterns.length > 0) {
      events.push({
        id: uuidv4(),
        timestamp: new Date(memory.timestamp),
        type: 'support_exchange',
        description: `Support interaction: ${supportPatterns[0].type}`,
        emotionalImpact: supportPatterns[0].significance,
        participants: memory.participants.map((p: any) => p.id),
        sourceMemoryId: memory.id,
      })
    }

    return events
  }

  /**
   * Identify key moments from events and memories
   */
  private async identifyKeyMoments(
    events: EmotionalEvent[],
    memories: ExtractedMemory[]
  ): Promise<EmotionalKeyMoment[]> {
    const keyMoments: EmotionalKeyMoment[] = []

    const highImpactEvents = events.filter(e => e.emotionalImpact > 6)
    
    for (const event of highImpactEvents) {
      const sourceMemory = memories.find(m => m.id === event.sourceMemoryId)
      if (!sourceMemory) continue

      const turningPoints = sourceMemory.emotionalAnalysis.trajectory?.turningPoints || []
      
      for (const turningPoint of turningPoints) {
        if (turningPoint.magnitude > 5) {
          keyMoments.push({
            id: uuidv4(),
            timestamp: turningPoint.timestamp,
            type: turningPoint.type,
            description: turningPoint.description,
            significance: turningPoint.magnitude,
            factors: turningPoint.factors,
            emotionalDelta: {
              before: [this.describeMoodState(sourceMemory.emotionalAnalysis.moodScoring.score - turningPoint.magnitude)],
              after: [this.describeMoodState(sourceMemory.emotionalAnalysis.moodScoring.score)],
              magnitude: turningPoint.magnitude,
            },
          })
        }
      }
    }

    return keyMoments.sort((a, b) => b.significance - a.significance).slice(0, 10)
  }

  /**
   * Analyze relationship evolution over time
   */
  private async analyzeRelationshipEvolution(
    memories: ExtractedMemory[],
    participantId: string
  ): Promise<RelationshipEvolution[]> {
    const evolution: RelationshipEvolution[] = []

    const timeWindows = this.createTimeWindows(memories)

    for (const window of timeWindows) {
      const windowMemories = memories.filter(m => 
        new Date(m.timestamp) >= new Date(window.start) && new Date(m.timestamp) <= new Date(window.end)
      )

      if (windowMemories.length < 2) continue

      const qualityMetrics = this.calculateRelationshipQuality(windowMemories)
      const communicationPatterns = this.extractCommunicationPatterns(windowMemories)
      const milestones = this.identifyRelationshipMilestones(windowMemories)

      evolution.push({
        period: window,
        qualityMetrics,
        communicationPatterns,
        milestones,
      })
    }

    return evolution
  }

  /**
   * Generate timeline summary narrative
   */
  private async generateTimelineSummary(
    events: EmotionalEvent[],
    keyMoments: EmotionalKeyMoment[],
    evolution: RelationshipEvolution[]
  ): Promise<string> {
    if (events.length === 0) {
      return 'No significant emotional events identified in the timeline.'
    }

    let summary = `Timeline contains ${events.length} emotional events`
    
    if (keyMoments.length > 0) {
      summary += ` with ${keyMoments.length} key moments`
      const topMoment = keyMoments[0]
      summary += `, including a significant ${topMoment.type} event`
    }

    if (evolution.length > 0) {
      const latestEvolution = evolution[evolution.length - 1]
      const avgQuality = (
        latestEvolution.qualityMetrics.supportLevel +
        latestEvolution.qualityMetrics.communicationClarity +
        latestEvolution.qualityMetrics.emotionalIntimacy +
        latestEvolution.qualityMetrics.conflictResolution
      ) / 4

      if (avgQuality > 7) {
        summary += '. Recent relationship dynamics show positive trends'
      } else if (avgQuality < 4) {
        summary += '. Recent relationship dynamics indicate some challenges'
      } else {
        summary += '. Relationship dynamics remain stable'
      }
    }

    const eventTypes = this.groupEventsByType(events)
    const dominantTypes = Object.entries(eventTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([type]) => type.replace('_', ' '))

    if (dominantTypes.length > 0) {
      summary += `. Primary patterns: ${dominantTypes.join(' and ')}`
    }

    return summary + '.'
  }

  /**
   * Filter memories by configured time window
   */
  private filterMemoriesByTimeWindow(memories: ExtractedMemory[]): ExtractedMemory[] {
    const now = new Date()
    const windowMs = this.getTimeWindowMs()
    const cutoffDate = new Date(now.getTime() - windowMs)

    return memories.filter(m => new Date(m.timestamp) >= cutoffDate)
  }

  /**
   * Sort memories chronologically
   */
  private sortMemoriesByTime(memories: ExtractedMemory[]): ExtractedMemory[] {
    return [...memories].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  }

  /**
   * Remove duplicate events based on timestamp and type
   */
  private deduplicateEvents(events: EmotionalEvent[]): EmotionalEvent[] {
    const seen = new Set<string>()
    return events.filter(event => {
      const key = `${event.timestamp.toISOString()}-${event.type}-${event.participants.join(',')}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  /**
   * Create time windows for relationship evolution analysis
   */
  private createTimeWindows(memories: ExtractedMemory[]): Array<{ start: Date; end: Date }> {
    if (memories.length === 0) return []

    const sortedMemories = this.sortMemoriesByTime(memories)
    const oldest = sortedMemories[0].timestamp
    const newest = sortedMemories[sortedMemories.length - 1].timestamp

    const windowSizeMs = this.getTimeWindowMs() / 4
    const windows: Array<{ start: Date; end: Date }> = []

    let currentStart = new Date(oldest)
    while (currentStart < new Date(newest)) {
      const currentEnd = new Date(Math.min(
        currentStart.getTime() + windowSizeMs,
        new Date(newest).getTime()
      ))
      
      windows.push({ start: currentStart, end: currentEnd })
      currentStart = new Date(currentEnd.getTime() + 1)
    }

    return windows
  }

  /**
   * Calculate relationship quality metrics for a time period
   */
  private calculateRelationshipQuality(memories: ExtractedMemory[]): RelationshipEvolution['qualityMetrics'] {
    const qualityScores = memories.map(m => (m.relationshipDynamics as any)?.quality || 5)
    const avgQuality = qualityScores.reduce((sum, q) => sum + q, 0) / qualityScores.length

    const supportPatterns = memories.flatMap(m => 
      m.emotionalAnalysis.patterns.filter(p => p.type === 'support_seeking' || p.type === 'mood_repair')
    )

    return {
      supportLevel: Math.min(10, avgQuality * (1 + supportPatterns.length * 0.1)),
      communicationClarity: avgQuality,
      emotionalIntimacy: avgQuality * 0.9,
      conflictResolution: avgQuality * 1.1,
    }
  }

  /**
   * Extract communication patterns from memories
   */
  private extractCommunicationPatterns(memories: ExtractedMemory[]): string[] {
    const patterns = new Set<string>()

    for (const memory of memories) {
      if ((memory.relationshipDynamics as any)?.patterns) {
        (memory.relationshipDynamics as any).patterns.forEach((pattern: string) => patterns.add(pattern))
      }

      memory.emotionalAnalysis.patterns.forEach(pattern => {
        patterns.add(pattern.type.replace('_', ' '))
      })
    }

    return Array.from(patterns).slice(0, 5)
  }

  /**
   * Identify relationship milestones
   */
  private identifyRelationshipMilestones(memories: ExtractedMemory[]): string[] {
    const milestones: string[] = []

    const significantMemories = memories.filter(m => m.significance.overall > 7)
    const growthPatterns = memories.filter(m => 
      m.emotionalAnalysis.patterns.some(p => p.type === 'growth')
    )

    if (significantMemories.length > 0) {
      milestones.push('Significant emotional exchange')
    }

    if (growthPatterns.length > 0) {
      milestones.push('Personal growth moment')
    }

    return milestones
  }

  /**
   * Group events by type for summary
   */
  private groupEventsByType(events: EmotionalEvent[]): Record<string, number> {
    const groups: Record<string, number> = {}
    
    for (const event of events) {
      groups[event.type] = (groups[event.type] || 0) + 1
    }

    return groups
  }

  /**
   * Get time window in milliseconds
   */
  private getTimeWindowMs(): number {
    const msPerDay = 24 * 60 * 60 * 1000
    
    switch (this.config.timeWindow) {
      case 'week': return 7 * msPerDay
      case 'month': return 30 * msPerDay
      case 'quarter': return 90 * msPerDay
      case 'year': return 365 * msPerDay
      default: return 90 * msPerDay
    }
  }

  /**
   * Describe mood state from numeric score
   */
  private describeMoodState(score: number): string {
    if (score >= 8) return 'very positive'
    if (score >= 6) return 'positive'
    if (score >= 4) return 'neutral'
    if (score >= 2) return 'concerning'
    return 'very low'
  }

  /**
   * Create empty timeline for no data scenarios
   */
  private createEmptyTimeline(participantId: string): RelationalTimeline {
    return {
      id: uuidv4(),
      participantId,
      createdAt: new Date(),
      events: [],
      keyMoments: [],
      summary: 'No emotional events available for timeline construction.',
      relationshipDynamics: [],
    }
  }
}