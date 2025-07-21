import type { Memory, ValidationStatus, QualityMetrics } from '@studio/schema'

/**
 * Auto-confirmation result for a memory
 */
export interface AutoConfirmationResult {
  /** Memory ID being evaluated */
  memoryId: string

  /** Auto-confirmation decision */
  decision: 'auto-approve' | 'needs-review' | 'auto-reject'

  /** Multi-factor confidence score (0-1) */
  confidence: number

  /** Individual confidence factors */
  confidenceFactors: {
    /** Claude's original confidence in extraction */
    claudeConfidence: number
    /** Emotional coherence score */
    emotionalCoherence: number
    /** Relationship accuracy assessment */
    relationshipAccuracy: number
    /** Temporal consistency check */
    temporalConsistency: number
    /** Content quality metrics */
    contentQuality: number
  }

  /** Reasons for the decision */
  reasons: string[]

  /** Suggested actions if needs review */
  suggestedActions?: string[]
}

/**
 * Batch validation result
 */
export interface BatchValidationResult {
  /** Total memories processed */
  totalMemories: number

  /** Breakdown by decision type */
  decisions: {
    autoApproved: number
    needsReview: number
    autoRejected: number
  }

  /** Overall batch confidence */
  batchConfidence: number

  /** Individual memory results */
  results: AutoConfirmationResult[]

  /** Processing time in milliseconds */
  processingTime: number
}

/**
 * Threshold configuration for auto-confirmation
 */
export interface ThresholdConfig {
  /** Threshold for auto-approval (default: 0.75) */
  autoApproveThreshold: number

  /** Threshold for auto-rejection (default: 0.50) */
  autoRejectThreshold: number

  /** Weight factors for confidence calculation */
  weights: {
    claudeConfidence: number
    emotionalCoherence: number
    relationshipAccuracy: number
    temporalConsistency: number
    contentQuality: number
  }
}

/**
 * Validation feedback for learning
 */
export interface ValidationFeedback {
  /** Memory ID */
  memoryId: string

  /** Original auto-confirmation result */
  originalResult: AutoConfirmationResult

  /** Human validator's decision */
  humanDecision: ValidationStatus

  /** Feedback on what was incorrect */
  feedback?: string

  /** Timestamp of feedback */
  timestamp: string
}

/**
 * Threshold update after learning
 */
export interface ThresholdUpdate {
  /** Previous thresholds */
  previousThresholds: ThresholdConfig

  /** New recommended thresholds */
  recommendedThresholds: ThresholdConfig

  /** Reasoning for the update */
  updateReasons: string[]

  /** Expected accuracy improvement */
  expectedAccuracyImprovement: number
}

/**
 * Emotional significance score
 */
export interface EmotionalSignificanceScore {
  /** Overall significance (0-1) */
  overall: number

  /** Individual significance factors */
  factors: {
    /** Emotional intensity of the memory */
    emotionalIntensity: number
    /** Relationship impact assessment */
    relationshipImpact: number
    /** Life event significance */
    lifeEventSignificance: number
    /** Participant vulnerability */
    participantVulnerability: number
    /** Temporal importance */
    temporalImportance: number
  }

  /** Narrative explanation */
  narrative: string
}

/**
 * Prioritized memory for review
 */
export interface PrioritizedMemory {
  /** The memory to review */
  memory: Memory

  /** Emotional significance score */
  significanceScore: EmotionalSignificanceScore

  /** Priority rank (1 = highest) */
  priorityRank: number

  /** Review context and suggestions */
  reviewContext: {
    /** Why this memory needs review */
    reviewReason: string
    /** Key aspects to focus on */
    focusAreas: string[]
    /** Related memories for context */
    relatedMemoryIds: string[]
    /** Suggested validation approach */
    validationHints: string[]
  }
}

/**
 * Prioritized memory list
 */
export interface PrioritizedMemoryList {
  /** Memories ordered by priority */
  memories: PrioritizedMemory[]

  /** Total memories needing review */
  totalCount: number

  /** Distribution of significance scores */
  significanceDistribution: {
    high: number
    medium: number
    low: number
  }
}

/**
 * Validation queue state
 */
export interface ValidationQueue {
  /** Queue ID */
  id: string

  /** Memories awaiting validation */
  pendingMemories: Memory[]

  /** Current resource allocation */
  resourceAllocation: {
    /** Available validator time in minutes */
    availableTime: number
    /** Target completion date */
    targetDate: string
    /** Validator skill level */
    validatorExpertise: 'beginner' | 'intermediate' | 'expert'
  }
}

/**
 * Optimized validation queue
 */
export interface OptimizedQueue {
  /** Original queue */
  originalQueue: ValidationQueue

  /** Optimized memory order */
  optimizedOrder: PrioritizedMemory[]

  /** Optimization strategy used */
  strategy: {
    /** Strategy name */
    name: string
    /** Strategy parameters */
    parameters: Record<string, unknown>
    /** Expected outcomes */
    expectedOutcomes: {
      /** Estimated completion time */
      estimatedTime: number
      /** Expected quality score */
      expectedQuality: number
      /** Coverage metrics */
      coverage: {
        emotionalRange: number
        temporalSpan: number
        participantDiversity: number
      }
    }
  }
}

/**
 * Coverage requirements for sampling
 */
export interface CoverageRequirements {
  /** Minimum emotional diversity (0-1) */
  emotionalDiversity: number

  /** Minimum temporal span in days */
  temporalSpan: number

  /** Minimum participant representation */
  participantCoverage: number

  /** Required relationship types */
  relationshipTypes: string[]

  /** Quality distribution requirements */
  qualityDistribution: {
    /** Minimum high-quality samples */
    highQuality: number
    /** Minimum medium-quality samples */
    mediumQuality: number
    /** Maximum low-quality samples */
    lowQuality: number
  }
}

/**
 * Sampled memories for validation
 */
export interface SampledMemories {
  /** Selected memory samples */
  samples: Memory[]

  /** Coverage analysis of the sample */
  coverage: CoverageAnalysis

  /** Sampling metadata */
  metadata: {
    /** Total population size */
    populationSize: number
    /** Sample size */
    sampleSize: number
    /** Sampling rate */
    samplingRate: number
    /** Sampling strategy used */
    strategy: string
    /** Random seed for reproducibility */
    seed?: number
  }
}

/**
 * Coverage analysis of a sample
 */
export interface CoverageAnalysis {
  /** Emotional coverage metrics */
  emotionalCoverage: {
    /** Emotions represented */
    emotionsRepresented: string[]
    /** Coverage percentage */
    coveragePercentage: number
    /** Gaps identified */
    gaps: string[]
  }

  /** Temporal coverage metrics */
  temporalCoverage: {
    /** Time range covered */
    timeRange: {
      start: string
      end: string
    }
    /** Distribution over time */
    distribution: 'even' | 'clustered' | 'sparse'
    /** Gaps in coverage */
    gaps: Array<{ start: string; end: string }>
  }

  /** Participant coverage metrics */
  participantCoverage: {
    /** Participants represented */
    participantsRepresented: string[]
    /** Coverage percentage */
    coveragePercentage: number
    /** Missing participants */
    missingParticipants: string[]
  }

  /** Quality distribution */
  qualityDistribution: {
    high: number
    medium: number
    low: number
  }

  /** Overall coverage score (0-1) */
  overallScore: number
}

/**
 * Memory dataset for sampling
 */
export interface MemoryDataset {
  /** All memories in the dataset */
  memories: Memory[]

  /** Dataset metadata */
  metadata: {
    /** Total count */
    totalCount: number
    /** Date range */
    dateRange: {
      start: string
      end: string
    }
    /** Unique participants */
    uniqueParticipants: number
    /** Quality metrics */
    qualityMetrics: QualityMetrics
  }
}

/**
 * Sampling strategy configuration
 */
export interface SamplingStrategy {
  /** Strategy name */
  name: string

  /** Strategy parameters */
  parameters: {
    /** Target sample size */
    targetSize: number
    /** Stratification criteria */
    stratification?: {
      /** Stratify by emotion */
      byEmotion?: boolean
      /** Stratify by time period */
      byTimePeriod?: boolean
      /** Stratify by participant */
      byParticipant?: boolean
      /** Stratify by quality */
      byQuality?: boolean
    }
    /** Random sampling parameters */
    random?: {
      /** Use random sampling */
      enabled: boolean
      /** Random seed */
      seed?: number
    }
    /** Importance weighting */
    importanceWeights?: {
      /** Weight by emotional significance */
      emotionalSignificance: number
      /** Weight by relationship impact */
      relationshipImpact: number
      /** Weight by temporal importance */
      temporalImportance: number
    }
  }

  /** Expected sample characteristics */
  expectedCharacteristics: {
    /** Expected coverage score */
    expectedCoverage: number
    /** Expected quality distribution */
    expectedQuality: {
      high: number
      medium: number
      low: number
    }
  }
}

/**
 * Main auto-confirmation engine interface
 */
export interface AutoConfirmationEngine {
  /** Evaluate a single memory */
  evaluateMemory(memory: Memory): AutoConfirmationResult

  /** Process a batch of memories */
  processBatch(memories: Memory[]): BatchValidationResult

  /** Update thresholds based on feedback */
  updateThresholds(feedback: ValidationFeedback[]): ThresholdUpdate

  /** Get current configuration */
  getConfig(): ThresholdConfig

  /** Set new configuration */
  setConfig(config: ThresholdConfig): void
}

/**
 * Emotional significance weighter interface
 */
export interface EmotionalSignificanceWeighter {
  /** Calculate significance for a memory */
  calculateSignificance(memory: Memory): EmotionalSignificanceScore

  /** Prioritize a list of memories */
  prioritizeMemories(memories: Memory[]): PrioritizedMemoryList

  /** Optimize a review queue */
  optimizeReviewQueue(queue: ValidationQueue): OptimizedQueue
}

/**
 * Intelligent sampler interface
 */
export interface IntelligentSampler {
  /** Sample memories for validation */
  sampleForValidation(
    memories: Memory[],
    coverage: CoverageRequirements,
  ): SampledMemories

  /** Ensure representative coverage */
  ensureRepresentativeCoverage(sample: SampledMemories): CoverageAnalysis

  /** Optimize validation efficiency */
  optimizeValidationEfficiency(dataset: MemoryDataset): SamplingStrategy
}
