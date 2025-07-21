import type { ThresholdConfig, CoverageRequirements, SamplingStrategy } from '../types'

/**
 * Default threshold configuration for auto-confirmation
 */
export const DEFAULT_THRESHOLD_CONFIG: ThresholdConfig = {
  autoApproveThreshold: 0.75,
  autoRejectThreshold: 0.50,
  weights: {
    claudeConfidence: 0.30,
    emotionalCoherence: 0.25,
    relationshipAccuracy: 0.20,
    temporalConsistency: 0.15,
    contentQuality: 0.10,
  },
}

/**
 * Default coverage requirements for sampling
 */
export const DEFAULT_COVERAGE_REQUIREMENTS: CoverageRequirements = {
  emotionalDiversity: 0.80,
  temporalSpan: 30, // 30 days minimum
  participantCoverage: 0.90,
  relationshipTypes: ['family', 'friend', 'romantic', 'professional'],
  qualityDistribution: {
    highQuality: 0.20,
    mediumQuality: 0.50,
    lowQuality: 0.30,
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
      emotionalSignificance: 0.40,
      relationshipImpact: 0.35,
      temporalImportance: 0.25,
    },
  },
  expectedCharacteristics: {
    expectedCoverage: 0.85,
    expectedQuality: {
      high: 0.20,
      medium: 0.50,
      low: 0.30,
    },
  },
}