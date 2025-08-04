import type {
  ThresholdConfig,
  CoverageRequirements,
  SamplingStrategy,
} from '../types'

/**
 * Default threshold configuration for auto-confirmation
 */
export const DEFAULT_THRESHOLD_CONFIG: ThresholdConfig = {
  autoApproveThreshold: 0.75,
  autoRejectThreshold: 0.5,
  weights: {
    claudeConfidence: 0.3,
    emotionalCoherence: 0.25,
    relationshipAccuracy: 0.2,
    temporalConsistency: 0.15,
    contentQuality: 0.1,
  },
}

/**
 * Default coverage requirements for sampling
 */
export const DEFAULT_COVERAGE_REQUIREMENTS: CoverageRequirements = {
  emotionalDiversity: 0.8,
  temporalSpan: 30, // 30 days minimum
  participantCoverage: 0.9,
  relationshipTypes: ['family', 'friend', 'romantic', 'professional'],
  qualityDistribution: {
    highQuality: 0.2,
    mediumQuality: 0.5,
    lowQuality: 0.3,
  },
}

/**
 * Default sampling strategy
 */
export const DEFAULT_SAMPLING_STRATEGY: SamplingStrategy = {
  name: 'balanced-stratified-sampling',
  parameters: {
    targetSize: 100,
    stratification: {
      byEmotion: true,
      byTimePeriod: true,
      byParticipant: true,
      byQuality: true,
    },
    random: {
      enabled: true,
      seed: undefined, // Use random seed by default
    },
    importanceWeights: {
      emotionalSignificance: 0.4,
      relationshipImpact: 0.35,
      temporalImportance: 0.25,
    },
  },
  expectedCharacteristics: {
    expectedCoverage: 0.85,
    expectedQuality: {
      high: 0.2,
      medium: 0.5,
      low: 0.3,
    },
  },
}
