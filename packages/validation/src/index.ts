/**
 * @studio/validation - Smart validation system for emotional memories
 * 
 * This package provides intelligent validation automation for emotional memories
 * with auto-confirmation, multi-factor confidence scoring, and emotional
 * significance weighting to reduce manual validation burden while maintaining
 * quality standards.
 */

// Core types and interfaces
export type {
  AutoConfirmationResult,
  BatchValidationResult,
  ThresholdConfig,
  ValidationFeedback,
  ThresholdUpdate,
  EmotionalSignificanceScore,
  PrioritizedMemory,
  PrioritizedMemoryList,
  ValidationQueue,
  OptimizedQueue,
  CoverageRequirements,
  SampledMemories,
  CoverageAnalysis,
  MemoryDataset,
  SamplingStrategy,
  AutoConfirmationEngine,
  EmotionalSignificanceWeighter,
  IntelligentSampler,
} from './types'

// Auto-confirmation module exports
export { createAutoConfirmationEngine } from './auto-confirmation/engine'
export { ThresholdManager } from './auto-confirmation/threshold-manager'
export { ConfidenceCalculator } from './auto-confirmation/confidence-calculator'

// Significance weighting module exports
export { createSignificanceWeighter } from './significance/weighter'
export { PriorityManager } from './significance/priority-manager'

// Intelligent sampling module exports
export { createIntelligentSampler } from './sampling/intelligent-sampler'
export { CoverageAnalyzer } from './sampling/coverage-analyzer'

// Analytics module exports
export { ValidationAnalytics } from './analytics/validation-analytics'
export { AccuracyTracker } from './analytics/accuracy-tracker'

// Default configurations
export {
  DEFAULT_THRESHOLD_CONFIG,
  DEFAULT_COVERAGE_REQUIREMENTS,
  DEFAULT_SAMPLING_STRATEGY,
} from './config/defaults'