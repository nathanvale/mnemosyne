/**
 * Clustering-specific type definitions for tone-tagged memory clustering
 * These types define the multi-dimensional feature extraction and clustering interfaces
 */

/**
 * Emotional tone features extracted from memory content (35% weight)
 */
export interface EmotionalToneFeatures {
  /** Multi-dimensional sentiment analysis vector [positive, negative, anxiety, gratitude, mixed] */
  sentimentVector: number[]
  /** Overall emotional intensity (0-1) */
  emotionalIntensity: number
  /** Emotional complexity and mixed feelings (0-1) */
  emotionalVariance: number
  /** Primary mood assessment score */
  moodScore: number
  /** Emotional vocabulary and tone words */
  emotionalDescriptors: string[]
  /** Emotional consistency indicators (0-1) */
  emotionalStability: number
}

/**
 * Communication style features (25% weight)
 */
export interface CommunicationStyleFeatures {
  /** Language use and communication patterns */
  linguisticPatterns: LinguisticPattern[]
  /** Emotional vulnerability and sharing level (0-1) */
  emotionalOpenness: number
  /** How participant seeks emotional support */
  supportSeekingStyle: SupportSeekingStyle
  /** Communication during stress/difficulty */
  copingCommunication: CopingCommunicationStyle
  /** Level of emotional intimacy in communication (0-1) */
  relationshipIntimacy: number
}

/**
 * Relationship context features (20% weight)
 */
export interface RelationshipContextFeatures {
  /** Type of relationship */
  relationshipType: RelationshipType
  /** Level of emotional intimacy (0-1) */
  intimacyLevel: number
  /** Support dynamics in the relationship */
  supportDynamics: SupportDynamics
  /** Communication patterns identified */
  communicationPatterns: CommunicationPattern[]
  /** Overall emotional safety level (0-1) */
  emotionalSafety: number
  /** Participant role dynamics */
  participantRoles: ParticipantRole[]
}

/**
 * Psychological indicator features (15% weight)
 */
export interface PsychologicalIndicatorFeatures {
  /** Coping mechanisms identified */
  copingMechanisms: CopingMechanism[]
  /** Resilience patterns observed */
  resilienceIndicators: ResilienceIndicator[]
  /** Stress markers detected */
  stressMarkers: StressMarker[]
  /** Support utilization effectiveness (0-1) */
  supportUtilization: number
  /** Emotional regulation capability (0-1) */
  emotionalRegulation: number
  /** Growth and development indicators */
  growthIndicators: GrowthIndicator[]
}

/**
 * Temporal context features (5% weight)
 */
export interface TemporalContextFeatures {
  /** Time of day categorization */
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  /** Day of week */
  dayOfWeek:
    | 'monday'
    | 'tuesday'
    | 'wednesday'
    | 'thursday'
    | 'friday'
    | 'saturday'
    | 'sunday'
  /** Temporal proximity to similar events (0-1) */
  temporalProximity: number
  /** Seasonal context if relevant */
  seasonalContext: 'spring' | 'summer' | 'fall' | 'winter'
  /** Temporal pattern stability (0-1) */
  temporalStability: number
}

/**
 * Complete clustering features combining all dimensions
 */
export interface ClusteringFeatures {
  emotionalTone: EmotionalToneFeatures
  communicationStyle: CommunicationStyleFeatures
  relationshipContext: RelationshipContextFeatures
  psychologicalIndicators: PsychologicalIndicatorFeatures
  temporalContext: TemporalContextFeatures
}

/**
 * Linguistic pattern types
 */
export interface LinguisticPattern {
  type:
    | 'emotional_expression'
    | 'gratitude_expression'
    | 'vulnerability_sharing'
    | 'support_language'
    | 'stress_language'
  strength: number
  indicators: string[]
}

/**
 * Support seeking styles
 */
export type SupportSeekingStyle =
  | 'direct_verbal'
  | 'indirect_hint'
  | 'emotional_expression'
  | 'problem_sharing'
  | 'minimal_seeking'

/**
 * Coping communication styles
 */
export type CopingCommunicationStyle =
  | 'support_seeking'
  | 'problem_solving'
  | 'emotional_venting'
  | 'avoidance'
  | 'minimization'

/**
 * Relationship types for clustering
 */
export type RelationshipType =
  | 'romantic'
  | 'family'
  | 'close_friend'
  | 'friend'
  | 'colleague'
  | 'acquaintance'
  | 'professional'
  | 'therapeutic'

/**
 * Support dynamics in relationships
 */
export interface SupportDynamics {
  level: 'high' | 'medium' | 'low'
  direction: 'unidirectional' | 'bidirectional' | 'balanced'
  effectiveness: number
  reciprocity: number
}

/**
 * Communication patterns
 */
export interface CommunicationPattern {
  type:
    | 'supportive_listening'
    | 'reassurance'
    | 'advice_giving'
    | 'validation'
    | 'problem_solving'
  frequency: number
  effectiveness: number
}

/**
 * Participant roles in interactions
 */
export interface ParticipantRole {
  participantId: string
  role: 'vulnerable_sharer' | 'supporter' | 'listener' | 'advisor' | 'observer'
  supportLevel: 'provider' | 'recipient' | 'mutual' | 'neutral'
}

/**
 * Coping mechanisms
 */
export interface CopingMechanism {
  type:
    | 'support_seeking'
    | 'problem_solving'
    | 'emotion_regulation'
    | 'meaning_making'
    | 'avoidance'
  strength: number
  effectiveness: number
}

/**
 * Resilience indicators
 */
export interface ResilienceIndicator {
  type:
    | 'social_support_utilization'
    | 'adaptive_thinking'
    | 'emotional_recovery'
    | 'growth_mindset'
  strength: number
  evidence: string[]
}

/**
 * Stress markers
 */
export interface StressMarker {
  type:
    | 'performance_anxiety'
    | 'relationship_stress'
    | 'work_pressure'
    | 'health_concerns'
    | 'life_transitions'
  intensity: number
  indicators: string[]
}

/**
 * Growth indicators
 */
export interface GrowthIndicator {
  type:
    | 'emotional_awareness'
    | 'relationship_skills'
    | 'coping_improvement'
    | 'resilience_building'
  strength: number
  evidence: string[]
}

/**
 * Similarity scores between feature dimensions
 */
export interface SimilarityScore {
  overall: number
  dimensions: {
    emotionalTone: number
    communicationStyle: number
    relationshipContext: number
    psychologicalIndicators: number
    temporalContext: number
  }
  confidence: number
}

/**
 * Feature weights for similarity calculation
 */
export interface FeatureWeights {
  emotionalTone: 0.35
  communicationStyle: 0.25
  relationshipContext: 0.2
  psychologicalIndicators: 0.15
  temporalContext: 0.05
}

/**
 * Memory cluster with psychological coherence
 */
export interface MemoryCluster {
  clusterId: string
  clusterTheme: PsychologicalTheme
  emotionalTone: EmotionalToneProfile
  memories: string[] // Memory IDs
  patternCharacteristics: PatternCharacteristic[]
  coherenceScore: number
  psychologicalSignificance: number
  participantPatterns: ParticipantPattern[]
  clusterMetadata: ClusterMetadata
}

/**
 * Psychological theme of a cluster
 */
export interface PsychologicalTheme {
  primaryTheme: string
  secondaryThemes: string[]
  emotionalElements: EmotionalElement[]
  psychologicalSignificance: number
  themeCoherence: number
}

/**
 * Emotional tone profile of a cluster
 */
export interface EmotionalToneProfile {
  dominantTone: string
  toneVariability: number
  intensityRange: [number, number]
  emotionalConsistency: number
  moodTrajectoryPattern: string
}

/**
 * Pattern characteristics within clusters
 */
export interface PatternCharacteristic {
  patternType:
    | 'emotional_theme'
    | 'coping_style'
    | 'relationship_dynamic'
    | 'psychological_tendency'
  description: string
  frequency: number
  strength: number
  evidenceMemories: string[]
}

/**
 * Participant patterns within clusters
 */
export interface ParticipantPattern {
  participantId: string
  roleConsistency: number
  behavioralPatterns: string[]
  emotionalContribution: number
  supportPatterns: string[]
}

/**
 * Cluster metadata
 */
export interface ClusterMetadata {
  createdAt: Date
  lastUpdated: Date
  memoryCount: number
  averageConfidence: number
  qualityMetrics: ClusterQualityMetrics
  temporalSpan: {
    earliest: Date
    latest: Date
    duration: number
  }
}

/**
 * Cluster quality assessment
 */
export interface ClusterQualityMetrics {
  overallCoherence: number
  emotionalConsistency: number
  thematicUnity: number
  psychologicalMeaningfulness: number
  incoherentMemoryCount: number
  strengthAreas: string[]
  improvementAreas: string[]
  confidenceLevel: number
}

/**
 * Emotional elements in psychological themes
 */
export interface EmotionalElement {
  theme: string
  intensity: number
  frequency: number
  variability: number
}

/**
 * Clustering algorithm parameters
 */
export interface ClusteringParameters {
  minClusterSize: number
  maxClusterSize: number
  coherenceThreshold: number
  psychologicalMeaningfulnessThreshold: number
  similarityThreshold: number
  featureWeights: FeatureWeights
}

/**
 * Cluster update result
 */
export interface ClusterUpdate {
  type: 'integrated' | 'new_cluster' | 'flagged_for_review'
  clusterId?: string
  confidence: number
  coherenceImpact: number
  reasoning: string
}

/**
 * Validation feedback for clustering improvements
 */
export interface ValidationFeedback {
  clusterId: string
  feedbackType:
    | 'coherence_issue'
    | 'theme_mismatch'
    | 'psychological_incoherence'
    | 'positive_validation'
  severity: 'low' | 'medium' | 'high'
  description: string
  suggestedImprovements: string[]
  validatorId: string
  timestamp: Date
}
