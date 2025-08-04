/**
 * @studio/memory - Enhanced memory processing with emotional intelligence
 *
 * This package provides sophisticated memory extraction, mood scoring, and emotional
 * significance assessment for Phase 2 emotional intelligence systems.
 */

// Core types and interfaces
export * from './types'

// Memory extraction and processing
export * from './extraction/enhanced-processor'
// TODO: Implement these modules in future PRs
// export * from './extraction/context-analyzer'
// export * from './extraction/quality-assessor'
// export * from './extraction/batch-coordinator'

// Mood scoring system
export * from './mood-scoring/analyzer'
export * from './mood-scoring/delta-detector'
export * from './mood-scoring/confidence-calculator'
export * from './mood-scoring/calibration-system'
export * from './mood-scoring/edge-case-handler'
export * from './mood-scoring/emotional-baseline-manager'
export * from './mood-scoring/emotional-context-builder'
export * from './mood-scoring/relationship-context-analyzer'
export * from './mood-scoring/validation-framework'

// Emotional significance assessment
export * from './significance/analyzer'
export * from './significance/salience-calculator'
export * from './significance/prioritizer'

// Persistence layer
export * from './persistence'

// TODO: Memory organization and clustering - implement in future PRs
// export * from './organization/clusterer'
// export * from './organization/query-builder'
// export * from './organization/timeline-builder'
// export * from './organization/relationship-mapper'

// Main interfaces for external integration
export interface MemoryProcessingSystem {
  /** Enhanced memory processor */
  processor: import('./extraction/enhanced-processor').EnhancedMemoryProcessor
  /** Mood scoring system - placeholder for future implementation */
  moodScoring?: unknown // TODO: import('./mood-scoring/analyzer').MoodScoringAnalyzer
  /** Significance assessment - placeholder for future implementation */
  significance?: unknown // TODO: import('./significance/analyzer').EmotionalSignificanceAnalyzer
  /** Memory organization - placeholder for future implementation */
  organization?: unknown // TODO: import('./organization/clusterer').MemoryClusterer
}

// Export the enhanced processor class directly
export { EnhancedMemoryProcessor } from './extraction/enhanced-processor'
export type {
  ProcessorConfig,
  ProcessingResult,
} from './extraction/enhanced-processor'

/**
 * Factory function to create a complete memory processing system
 */
export function createMemoryProcessingSystem(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  config?: {
    database?: unknown
    logging?: boolean
    performance?: {
      batchSize?: number
      parallelProcessing?: boolean
    }
  },
): MemoryProcessingSystem {
  // Implementation will be added as components are built
  throw new Error('createMemoryProcessingSystem not yet implemented')
}

/**
 * Utility functions for memory processing
 */
export const MemoryUtils = {
  /**
   * Validate conversation data before processing
   */
  validateConversationData(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    data: unknown,
  ): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    // Implementation will be added
    throw new Error('validateConversationData not yet implemented')
  },

  /**
   * Calculate processing metrics for performance monitoring
   */
  calculateProcessingMetrics(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    results: unknown[],
  ): {
    averageProcessingTime: number
    successRate: number
    qualityDistribution: Record<string, number>
  } {
    // Implementation will be added
    throw new Error('calculateProcessingMetrics not yet implemented')
  },

  /**
   * Transform legacy memory data to new format
   */
  transformLegacyMemory(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    legacyData: unknown,
  ): unknown {
    // Implementation will be added
    throw new Error('transformLegacyMemory not yet implemented')
  },
}
