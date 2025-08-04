import type { Memory, EmotionalContext } from '@studio/schema'

import { z } from 'zod'

/**
 * Enhanced memory with processing metadata and emotional intelligence
 * This interface extends the base Memory type with additional processing data
 */
export interface ExtractedMemory extends Memory {
  /** Extended relationship dynamics for significance analysis */
  extendedRelationshipDynamics?: RelationshipDynamics
  /** Processing metadata */
  processing: {
    /** When this memory was extracted */
    extractedAt: Date
    /** Processing confidence score (0-1) */
    confidence: number
    /** Processing quality metrics */
    quality: MemoryQualityScore
    /** Source conversation data */
    sourceData: ConversationData
  }
  /** Enhanced emotional analysis */
  emotionalAnalysis: EmotionalAnalysis
  /** Memory significance assessment */
  significance: EmotionalSignificanceScore
}

/**
 * Input conversation data for memory extraction
 */
export interface ConversationData {
  /** Unique conversation identifier */
  id: string
  /** Messages in the conversation */
  messages: ConversationMessage[]
  /** Conversation participants */
  participants: ConversationParticipant[]
  /** When the conversation occurred */
  timestamp: Date
  /** When the conversation started */
  startTime: Date
  /** When the conversation ended */
  endTime: Date
  /** Conversation context metadata */
  context?: {
    platform?: string
    threadId?: string
    conversationType?: 'direct' | 'group' | 'public'
    relationshipType?: string
  }
}

/**
 * Individual message within a conversation
 */
export interface ConversationMessage {
  /** Message identifier */
  id: string
  /** Message content */
  content: string
  /** Message author */
  authorId: string
  /** Message timestamp */
  timestamp: Date
  /** Message metadata */
  metadata?: {
    edited?: boolean
    reactions?: string[]
    replyTo?: string
  }
}

/**
 * Conversation participant information
 */
export interface ConversationParticipant {
  /** Participant identifier */
  id: string
  /** Participant display name */
  name: string
  /** Participant role in conversation */
  role:
    | 'author'
    | 'recipient'
    | 'observer'
    | 'supporter'
    | 'listener'
    | 'vulnerable_sharer'
    | 'emotional_leader'
  /** Number of messages sent by this participant */
  messageCount?: number
  /** Emotional expressions used by this participant */
  emotionalExpressions?: string[]
  /** Participant metadata */
  metadata?: {
    avatar?: string
    status?: string
    relationshipType?: string
  }
}

/**
 * Memory quality assessment metrics
 */
export interface MemoryQualityScore {
  /** Overall quality score (0-10) */
  overall: number
  /** Quality component scores */
  components: {
    /** Emotional context richness (0-10) */
    emotionalRichness: number
    /** Relationship dynamics clarity (0-10) */
    relationshipClarity: number
    /** Content coherence and completeness (0-10) */
    contentCoherence: number
    /** Contextual significance (0-10) */
    contextualSignificance: number
  }
  /** Quality assessment confidence (0-1) */
  confidence: number
  /** Quality issues identified */
  issues: QualityIssue[]
}

/**
 * Quality issues found during assessment
 */
export interface QualityIssue {
  /** Issue type */
  type:
    | 'missing_context'
    | 'unclear_emotions'
    | 'participant_confusion'
    | 'content_fragmentation'
  /** Issue severity */
  severity: 'low' | 'medium' | 'high'
  /** Issue description */
  description: string
  /** Suggested improvements */
  suggestions?: string[]
}

/**
 * Enhanced emotional analysis beyond basic context
 */
export interface EmotionalAnalysis {
  /** Basic emotional context */
  context: EmotionalContext
  /** Mood scoring results */
  moodScoring: MoodAnalysisResult
  /** Emotional trajectory over conversation */
  trajectory: EmotionalTrajectory
  /** Emotional patterns detected */
  patterns: EmotionalPattern[]
}

/**
 * Mood analysis result with scoring and confidence
 */
export interface MoodAnalysisResult {
  /** Primary mood score (0-10 scale) */
  score: number
  /** Mood descriptors */
  descriptors: string[]
  /** Mood analysis confidence (0-1) */
  confidence: number
  /** Mood delta from baseline or previous state */
  delta?: MoodDelta
  /** Factors contributing to mood assessment */
  factors: MoodFactor[]
}

/**
 * Mood change detection
 */
export interface MoodDelta {
  /** Change magnitude */
  magnitude: number
  /** Change direction */
  direction: 'positive' | 'negative' | 'neutral'
  /** Delta type */
  type: 'mood_repair' | 'celebration' | 'decline' | 'plateau'
  /** Delta confidence (0-1) */
  confidence: number
  /** Contributing factors */
  factors: string[]
}

/**
 * Factors contributing to mood assessment
 */
export interface MoodFactor {
  /** Factor type */
  type:
    | 'language_sentiment'
    | 'emotional_words'
    | 'context_clues'
    | 'interaction_pattern'
    | 'sentiment_analysis'
    | 'psychological_indicators'
    | 'relationship_context'
    | 'conversational_flow'
    | 'historical_baseline'
  /** Factor weight in overall score */
  weight: number
  /** Factor description */
  description: string
  /** Evidence for this factor */
  evidence: string[]
  /** Internal calculated score (optional) */
  _score?: number
}

/**
 * Emotional trajectory over conversation timeline
 */
export interface EmotionalTrajectory {
  /** Trajectory points over time */
  points: TrajectoryPoint[]
  /** Overall trajectory direction */
  direction: 'improving' | 'declining' | 'stable' | 'volatile'
  /** Trajectory significance */
  significance: number
  /** Key turning points */
  turningPoints: TurningPoint[]
}

/**
 * Point in emotional trajectory
 */
export interface TrajectoryPoint {
  /** Timestamp of this point */
  timestamp: Date
  /** Mood score at this point */
  moodScore: number
  /** Message ID for this point */
  messageId?: string
  /** Emotional state descriptors */
  emotions?: string[]
  /** Context at this point */
  context?: string
}

/**
 * Significant turning point in emotional trajectory
 */
export interface TurningPoint {
  /** Timestamp of turning point */
  timestamp: Date
  /** Type of turning point */
  type: 'breakthrough' | 'setback' | 'realization' | 'support_received'
  /** Magnitude of change */
  magnitude: number
  /** Description of what happened */
  description: string
  /** Contributing factors */
  factors: string[]
}

/**
 * Emotional patterns detected in conversation
 */
export interface EmotionalPattern {
  /** Pattern type */
  type:
    | 'support_seeking'
    | 'mood_repair'
    | 'celebration'
    | 'vulnerability'
    | 'growth'
  /** Pattern confidence (0-1) */
  confidence: number
  /** Pattern description */
  description: string
  /** Evidence for pattern */
  evidence: string[]
  /** Pattern significance */
  significance: number
}

/**
 * Enhanced relationship dynamics for emotional analysis
 */
export interface RelationshipDynamics {
  /** Type of relationship */
  type:
    | 'romantic'
    | 'family'
    | 'close_friend'
    | 'friend'
    | 'colleague'
    | 'acquaintance'
    | 'professional'
    | 'therapeutic'
  /** Support level in the relationship */
  supportLevel: 'high' | 'medium' | 'low' | 'negative'
  /** Intimacy level in the relationship */
  intimacyLevel: 'high' | 'medium' | 'low'
  /** Intimacy level (alias for backwards compatibility) */
  intimacy: 'high' | 'medium' | 'low'
  /** Conflict level in the relationship */
  conflictLevel: 'high' | 'medium' | 'low' | 'none'
  /** Trust level in the relationship */
  trustLevel: 'high' | 'medium' | 'low'
  /** Whether conflict is present in the interaction */
  conflictPresent: boolean
  /** Intensity of conflict if present */
  conflictIntensity: 'high' | 'medium' | 'low'
  /** Communication style summary */
  communicationStyle:
    | 'reflective'
    | 'supportive'
    | 'directive'
    | 'conflicting'
    | 'professional'
  /** Detailed communication style analysis */
  communicationStyleDetails: {
    /** Level of vulnerability displayed in communication */
    vulnerabilityLevel: 'high' | 'medium' | 'low'
    /** Overall emotional safety in the interaction */
    emotionalSafety: 'high' | 'medium' | 'low'
    /** Support patterns identified */
    supportPatterns: string[]
    /** Conflict patterns identified */
    conflictPatterns: string[]
    /** Whether professional boundaries are maintained */
    professionalBoundaries: boolean
    /** Guidance patterns in communication */
    guidancePatterns: string[]
    /** Therapeutic elements present */
    therapeuticElements: string[]
  }
  /** Participant dynamics analysis */
  participantDynamics: {
    /** ID of participant acting as emotional leader */
    emotionalLeader?: string
    /** ID of primary supporter */
    primarySupporter?: string
    /** ID of participant exhibiting vulnerability */
    vulnerabilityExhibitor?: string
    /** Balance of support in the relationship */
    supportBalance: 'unidirectional' | 'bidirectional' | 'balanced'
    /** Whether mutual vulnerability is present */
    mutualVulnerability: boolean
  }
  /** Emotional safety assessment */
  emotionalSafety: {
    /** Overall emotional safety level */
    overall: 'high' | 'medium' | 'low'
    /** Level of acceptance displayed */
    acceptanceLevel: 'high' | 'medium' | 'low'
    /** Risk of judgment */
    judgmentRisk: 'high' | 'medium' | 'low'
    /** Whether validation is present */
    validationPresent: boolean
  }
}

/**
 * Emotional significance assessment
 */
export interface EmotionalSignificanceScore {
  /** Overall significance (0-10) */
  overall: number
  /** Significance components */
  components: {
    /** Emotional salience (0-10) */
    emotionalSalience: number
    /** Relationship impact (0-10) */
    relationshipImpact: number
    /** Contextual importance (0-10) */
    contextualImportance: number
    /** Temporal relevance (0-10) */
    temporalRelevance: number
  }
  /** Significance confidence (0-1) */
  confidence: number
  /** Significance category */
  category: 'critical' | 'high' | 'medium' | 'low'
  /** Validation priority */
  validationPriority: number
}

/**
 * Processed memory batch result
 */
export interface ProcessedMemoryBatch {
  /** Batch identifier */
  batchId: string
  /** Processing timestamp */
  processedAt: Date
  /** Processed memories */
  memories: ExtractedMemory[]
  /** Batch statistics */
  statistics: BatchStatistics
  /** Processing errors */
  errors: ProcessingError[]
}

/**
 * Batch processing statistics
 */
export interface BatchStatistics {
  /** Total conversations processed */
  totalConversations: number
  /** Successful memory extractions */
  successfulExtractions: number
  /** Failed extractions */
  failedExtractions: number
  /** Average processing time per conversation */
  averageProcessingTime: number
  /** Quality distribution */
  qualityDistribution: {
    high: number
    medium: number
    low: number
  }
  /** Significance distribution */
  significanceDistribution: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

/**
 * Processing error information
 */
export interface ProcessingError {
  /** Error type */
  type: 'validation' | 'extraction' | 'analysis' | 'database'
  /** Error message */
  message: string
  /** Source conversation ID */
  conversationId?: string
  /** Error stack trace */
  stack?: string
  /** Error metadata */
  metadata?: Record<string, unknown>
}

/**
 * Memory clustering configuration
 */
export interface ClusteringConfig {
  /** Clustering algorithm to use */
  algorithm: 'hierarchical' | 'kmeans' | 'dbscan'
  /** Distance metric */
  distanceMetric:
    | 'emotional_similarity'
    | 'semantic_similarity'
    | 'temporal_proximity'
  /** Minimum cluster size */
  minClusterSize: number
  /** Maximum number of clusters */
  maxClusters?: number
  /** Clustering parameters */
  parameters: Record<string, unknown>
}

/**
 * Memory cluster result
 */
export interface MemoryCluster {
  /** Cluster identifier */
  id: string
  /** Cluster name/label */
  name: string
  /** Memories in this cluster */
  memories: ExtractedMemory[]
  /** Cluster centroid/representative */
  centroid: ClusterCentroid
  /** Cluster metadata */
  metadata: {
    /** Creation timestamp */
    createdAt: Date
    /** Cluster size */
    size: number
    /** Cluster coherence score */
    coherence: number
    /** Dominant themes */
    themes: string[]
  }
}

/**
 * Cluster centroid information
 */
export interface ClusterCentroid {
  /** Representative emotional state */
  emotionalState: EmotionalContext
  /** Average mood score */
  averageMoodScore: number
  /** Common themes */
  themes: string[]
  /** Typical participants */
  participants: string[]
  /** Temporal span */
  timespan: {
    start: Date
    end: Date
    duration: number
  }
}

/**
 * Zod schemas for validation
 */
export const ConversationDataSchema = z.object({
  id: z.string(),
  messages: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
      authorId: z.string(),
      timestamp: z.date(),
      metadata: z
        .object({
          edited: z.boolean().optional(),
          reactions: z.array(z.string()).optional(),
          replyTo: z.string().optional(),
        })
        .optional(),
    }),
  ),
  participants: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      role: z.enum([
        'author',
        'recipient',
        'observer',
        'supporter',
        'listener',
        'vulnerable_sharer',
        'emotional_leader',
      ]),
      messageCount: z.number().optional(),
      emotionalExpressions: z.array(z.string()).optional(),
      metadata: z.record(z.unknown()).optional(),
    }),
  ),
  timestamp: z.date(),
  startTime: z.date(),
  endTime: z.date(),
  context: z
    .object({
      platform: z.string().optional(),
      threadId: z.string().optional(),
      conversationType: z.enum(['direct', 'group', 'public']).optional(),
    })
    .optional(),
})

export const MoodAnalysisResultSchema = z.object({
  score: z.number().min(0).max(10),
  descriptors: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  delta: z
    .object({
      magnitude: z.number(),
      direction: z.enum(['positive', 'negative', 'neutral']),
      type: z.enum(['mood_repair', 'celebration', 'decline', 'plateau']),
      confidence: z.number().min(0).max(1),
      factors: z.array(z.string()),
    })
    .optional(),
  factors: z.array(
    z.object({
      type: z.enum([
        'language_sentiment',
        'emotional_words',
        'context_clues',
        'interaction_pattern',
        'sentiment_analysis',
        'psychological_indicators',
        'relationship_context',
        'conversational_flow',
        'historical_baseline',
      ]),
      weight: z.number(),
      description: z.string(),
      evidence: z.array(z.string()),
    }),
  ),
})

export const EmotionalSignificanceScoreSchema = z.object({
  overall: z.number().min(0).max(10),
  components: z.object({
    emotionalSalience: z.number().min(0).max(10),
    relationshipImpact: z.number().min(0).max(10),
    contextualImportance: z.number().min(0).max(10),
    temporalRelevance: z.number().min(0).max(10),
  }),
  confidence: z.number().min(0).max(1),
  category: z.enum(['critical', 'high', 'medium', 'low']),
  validationPriority: z.number().min(0).max(10),
})

/**
 * Sentiment analysis score for positive, negative, or neutral sentiment
 */
export interface SentimentScore {
  /** Sentiment strength (0-1) */
  score: number
  /** Sentiment intensity (0-1) */
  intensity: number
  /** Confidence in assessment (0-1) */
  confidence: number
  /** Emotional indicators detected */
  indicators: string[]
  /** Linguistic markers that support this sentiment */
  linguisticMarkers: string[]
  /** Cultural context if applicable */
  culturalContext?: 'direct' | 'indirect' | 'high-context' | 'low-context'
}

/**
 * Mixed sentiment analysis for complex emotional states
 */
export interface MixedSentimentScore {
  /** Positive sentiment component */
  positive: SentimentScore
  /** Negative sentiment component */
  negative: SentimentScore
  /** Emotional complexity (0-1) */
  complexity: number
  /** Dominant sentiment direction */
  dominantSentiment: 'positive' | 'negative' | 'mixed' | 'neutral'
  /** Combined emotional state descriptors */
  emotionalState: string[]
  /** Relationship context if relevant */
  relationshipContext?: string
}

/**
 * Psychological indicators for mood analysis
 */
export interface CopingIndicator {
  /** Type of coping mechanism */
  type: 'problem_focused' | 'emotion_focused' | 'meaning_focused'
  /** Strength of indicator (0-1) */
  strength: number
  /** Effectiveness assessment (0-1) */
  effectiveness: number
  /** Emotional impact (0-1) */
  emotionalImpact: number
  /** Contextual relevance (0-1) */
  contextualRelevance: number
}

/**
 * Resilience assessment score
 */
export interface ResilienceScore {
  /** Overall resilience (0-1) */
  overall: number
  /** Recovery capacity (0-1) */
  recoveryCapacity: number
  /** Adaptive flexibility (0-1) */
  adaptiveFlexibility: number
  /** Support utilization (0-1) */
  supportUtilization: number
  /** Confidence in assessment (0-1) */
  confidence: number
}

/**
 * Stress marker indicators
 */
export interface StressIndicator {
  /** Type of stress marker */
  type: 'physiological' | 'emotional' | 'cognitive' | 'behavioral'
  /** Intensity level (0-1) */
  intensity: number
  /** Marker description */
  description: string
  /** Supporting evidence */
  evidence: string[]
}

/**
 * Support pattern evaluation
 */
export interface SupportIndicator {
  /** Type of support */
  type: 'emotional' | 'informational' | 'instrumental' | 'appraisal'
  /** Support quality (0-1) */
  quality: number
  /** Support reciprocity (0-1) */
  reciprocity: number
  /** Support effectiveness (0-1) */
  effectiveness: number
}

/**
 * Growth pattern identification
 */
export interface GrowthIndicator {
  /** Type of growth observed */
  type:
    | 'emotional_maturity'
    | 'self_awareness'
    | 'relationship_skills'
    | 'resilience_building'
  /** Growth evidence strength (0-1) */
  strength: number
  /** Growth trajectory direction */
  direction: 'positive' | 'negative' | 'stable'
  /** Supporting evidence */
  evidence: string[]
}

/**
 * Human validation record for algorithmic mood score validation
 */
export interface HumanValidationRecord {
  /** ID of the conversation being validated */
  conversationId: string
  /** ID of the expert validator */
  validatorId: string
  /** Validator credentials and experience */
  validatorCredentials: {
    title: string
    yearsExperience: number
    specializations: string[]
    certifications?: string[]
    institutionAffiliation?: string
  }
  /** Human expert's mood score assessment (1-10) */
  humanMoodScore: number
  /** Validator's confidence in their assessment (0-1) */
  confidence: number
  /** Detailed rationale for the mood score */
  rationale: string
  /** Emotional factors identified by the human expert */
  emotionalFactors: string[]
  /** When the validation was performed */
  timestamp: Date
  /** Validation session identifier for grouping */
  validationSession: string
  /** Additional contextual notes */
  additionalNotes?: string
}

/**
 * Overall validation metrics comparing algorithmic and human assessments
 */
export interface ValidationMetrics {
  /** Pearson correlation coefficient between algorithmic and human scores */
  pearsonCorrelation: number
  /** Spearman rank correlation coefficient */
  spearmanCorrelation: number
  /** Mean absolute error between scores */
  meanAbsoluteError: number
  /** Root mean square error */
  rootMeanSquareError: number
  /** Percentage of assessments within acceptable agreement range */
  agreementPercentage: number
  /** Level of concordance between assessments */
  concordanceLevel: 'high' | 'moderate' | 'low'
  /** Statistical significance of correlation */
  statisticalSignificance: {
    pValue: number
    isSignificant: boolean
    confidenceInterval: [number, number]
  }
  /** Number of validation pairs analyzed */
  sampleSize: number
}

/**
 * Analysis of discrepancies between algorithmic and human assessments
 */
export interface DiscrepancyAnalysis {
  /** Overall systematic bias direction */
  systematicBias:
    | 'algorithmic_over_estimation'
    | 'algorithmic_under_estimation'
    | 'no_systematic_bias'
  /** Magnitude and consistency of bias pattern */
  biasPattern: {
    magnitude: number
    consistency: number
    direction: 'positive' | 'negative' | 'mixed'
  }
  /** Common types of discrepancies identified */
  commonDiscrepancyTypes: string[]
  /** Conversation contexts where discrepancies are most frequent */
  problematicContexts: string[]
  /** Recommended areas for algorithmic improvement */
  improvementRecommendations: string[]
  /** Distribution of discrepancy magnitudes */
  discrepancyDistribution: {
    small: number // 0-0.5 points
    medium: number // 0.5-1.5 points
    large: number // 1.5+ points
  }
}

/**
 * Individual conversation validation analysis
 */
export interface IndividualValidationAnalysis {
  /** Conversation identifier */
  conversationId: string
  /** Algorithmic mood score */
  algorithmicScore: number
  /** Human expert mood score */
  humanScore: number
  /** Absolute error between scores */
  absoluteError: number
  /** Type of discrepancy */
  discrepancyType:
    | 'algorithmic_over_estimation'
    | 'algorithmic_under_estimation'
    | 'close_agreement'
  /** Factors contributing to discrepancy */
  discrepancyFactors: string[]
  /** Human expert's rationale */
  humanRationale: string
  /** Algorithmic confidence level */
  algorithmicConfidence: number
  /** Human validator confidence */
  humanConfidence: number
  /** Recommended improvement for this case */
  recommendedImprovement: string[]
}

/**
 * Validator consistency and reliability analysis
 */
export interface ValidatorConsistency {
  /** Inter-rater reliability score */
  interRaterReliability: number
  /** Average variance in human assessments */
  averageVariance: number
  /** Level of consensus among validators */
  consensusLevel: 'high' | 'moderate' | 'low'
  /** Outlier validations that deviate significantly */
  outlierValidations: Array<{
    validatorId: string
    conversationId: string
    deviationMagnitude: number
    flagReason: string
  }>
  /** Validator-specific performance metrics */
  validatorMetrics: Record<
    string,
    {
      averageCorrelationWithAlgorithm: number
      averageCorrelationWithPeers: number
      consistencyScore: number
      validationCount: number
    }
  >
}

/**
 * Comprehensive validation result combining all analyses
 */
export interface ValidationResult {
  /** Overall validation metrics */
  overallMetrics: ValidationMetrics
  /** Discrepancy analysis */
  discrepancyAnalysis: DiscrepancyAnalysis
  /** Individual conversation analyses */
  individualAnalyses: IndividualValidationAnalysis[]
  /** Validator consistency analysis */
  validatorConsistency: ValidatorConsistency
  /** Systematic bias analysis */
  biasAnalysis: BiasAnalysis
  /** Recommendations for algorithm improvement */
  recommendations: {
    priority: 'high' | 'medium' | 'low'
    category: string
    description: string
    expectedImpact: string
  }[]
  /** Validation session metadata */
  sessionMetadata: {
    validationDate: Date
    totalConversations: number
    totalValidators: number
    averageValidatorExperience: number
  }
}

/**
 * Bias analysis for systematic patterns in algorithmic assessments
 */
export interface BiasAnalysis {
  /** Overall bias detection result */
  biasDetected: boolean
  /** Types of bias identified */
  biasTypes: Array<{
    type:
      | 'demographic'
      | 'contextual'
      | 'linguistic'
      | 'temporal'
      | 'emotional_complexity'
      | 'emotional_minimization'
      | 'sarcasm_detection_failure'
      | 'repetitive_pattern_blindness'
      | 'mixed_emotion_oversimplification'
      | 'defensive_language_blindness'
    severity: 'low' | 'medium' | 'high'
    description: string
    affectedSamples: number
    correctionRecommendation: string
  }>
  /** Confidence in bias detection */
  detectionConfidence: number
  /** Statistical evidence for bias */
  statisticalEvidence: {
    testStatistic: number
    pValue: number
    effectSize: number
  }
}

/**
 * Calibration adjustment recommendation for algorithm parameters
 */
export interface CalibrationAdjustment {
  /** Unique identifier for this calibration */
  calibrationId: string
  /** Timestamp when calibration was created */
  timestamp: Date
  /** Source validation result that triggered this calibration */
  sourceValidationId: string
  /** Type of calibration adjustment */
  adjustmentType:
    | 'weight_adjustment'
    | 'threshold_adjustment'
    | 'bias_correction'
    | 'confidence_recalibration'
  /** Target component to adjust */
  targetComponent:
    | 'sentiment_analysis'
    | 'psychological_indicators'
    | 'relationship_context'
    | 'conversational_flow'
    | 'historical_baseline'
    | 'confidence_calculator'
  /** Specific parameter adjustments */
  parameterAdjustments: {
    parameterName: string
    currentValue: number
    recommendedValue: number
    adjustmentReason: string
    expectedImpact: string
  }[]
  /** Predicted improvement metrics */
  predictedImprovements: {
    correlationImprovement: number
    biasReduction: number
    accuracyImprovement: number
  }
  /** Implementation status */
  status: 'pending' | 'applied' | 'tested' | 'validated' | 'rejected'
  /** Validation results after implementation */
  validationResults?: {
    actualCorrelationImprovement: number
    actualBiasReduction: number
    actualAccuracyImprovement: number
    validationDate: Date
  }
}

/**
 * Algorithm calibration system for continuous improvement
 */
export interface AlgorithmCalibrationSystem {
  /** System configuration */
  config: {
    /** Maximum calibrations to apply per session */
    maxCalibrationsPerSession: number
    /** Minimum validation sample size for calibration */
    minValidationSampleSize: number
    /** Confidence threshold for applying calibrations */
    calibrationConfidenceThreshold: number
    /** Enable automatic calibration application */
    autoApplyCalibrations: boolean
  }
  /** Active calibration adjustments */
  activeCalibrations: CalibrationAdjustment[]
  /** Calibration history */
  calibrationHistory: CalibrationAdjustment[]
  /** Performance tracking */
  performanceTracking: {
    baselineMetrics: ValidationMetrics
    currentMetrics: ValidationMetrics
    improvementTrend: Array<{
      date: Date
      correlationScore: number
      biasLevel: number
      accuracyScore: number
    }>
  }
}

/**
 * Emotional complexity assessment for edge case handling
 */
export interface EmotionalComplexityAssessment {
  /** Overall complexity score (0-1) */
  complexityScore: number
  /** Types of complexity detected */
  complexityTypes: Array<{
    type:
      | 'mixed_emotions'
      | 'contradictory_signals'
      | 'temporal_inconsistency'
      | 'contextual_ambiguity'
      | 'cultural_nuance'
    severity: 'low' | 'medium' | 'high'
    confidence: number
    description: string
    evidence: string[]
  }>
  /** Confidence in complexity assessment */
  assessmentConfidence: number
  /** Recommended handling approach */
  recommendedApproach:
    | 'standard_analysis'
    | 'multi_interpretation'
    | 'uncertainty_flagging'
    | 'human_review'
}

/**
 * Uncertainty quantification for mood analysis
 */
export interface UncertaintyQuantification {
  /** Overall uncertainty level (0-1) */
  uncertaintyLevel: number
  /** Sources of uncertainty */
  uncertaintySources: Array<{
    source:
      | 'insufficient_context'
      | 'conflicting_signals'
      | 'cultural_ambiguity'
      | 'temporal_inconsistency'
      | 'extreme_emotional_state'
    impact: number
    description: string
    mitigationSuggestions: string[]
  }>
  /** Confidence intervals for mood score */
  confidenceIntervals: {
    low: number
    high: number
    confidence: number
  }
  /** Reliability assessment */
  reliabilityScore: number
}

/**
 * Multiple interpretation options for ambiguous cases
 */
export interface MultipleInterpretationOptions {
  /** Primary interpretation */
  primaryInterpretation: {
    moodScore: number
    confidence: number
    rationale: string
    supportingEvidence: string[]
  }
  /** Alternative interpretations */
  alternativeInterpretations: Array<{
    moodScore: number
    confidence: number
    rationale: string
    supportingEvidence: string[]
    probabilityWeight: number
  }>
  /** Interpretation consensus */
  interpretationConsensus: {
    agreement: number
    divergence: number
    recommendedAction: 'use_primary' | 'weighted_average' | 'flag_for_review'
  }
}

/**
 * Edge case detection results
 */
export interface EdgeCaseDetection {
  /** Whether an edge case was detected */
  isEdgeCase: boolean
  /** Type of edge case */
  edgeCaseType?:
    | 'extreme_emotion'
    | 'mixed_complex'
    | 'cultural_specific'
    | 'sarcasm_heavy'
    | 'ambiguous_context'
    | 'contradictory_signals'
  /** Severity of the edge case */
  severity?: 'low' | 'medium' | 'high' | 'critical'
  /** Detection confidence */
  detectionConfidence?: number
  /** Handling strategy */
  handlingStrategy?:
    | 'enhanced_analysis'
    | 'multi_interpretation'
    | 'uncertainty_flagging'
    | 'human_escalation'
  /** Additional context needed */
  additionalContextNeeded?: string[]
}

/**
 * Cultural context analysis for communication patterns
 */
export interface CulturalContextAnalysis {
  /** Detected cultural context */
  culturalContext:
    | 'western_direct'
    | 'eastern_indirect'
    | 'high_context'
    | 'low_context'
    | 'mixed'
    | 'unknown'
  /** Cultural confidence */
  culturalConfidence: number
  /** Cultural considerations */
  culturalConsiderations: Array<{
    aspect: string
    impact: 'high' | 'medium' | 'low'
    description: string
    adjustmentRecommendation: string
  }>
  /** Communication style indicators */
  communicationStyleIndicators: {
    directness: number
    emotionalExpressiveness: number
    implicitness: number
    formalityLevel: number
  }
}

/**
 * Ambiguity detection in conversations
 */
export interface AmbiguityDetection {
  /** Overall ambiguity level */
  ambiguityLevel: number
  /** Ambiguity sources */
  ambiguitySources: Array<{
    source:
      | 'linguistic'
      | 'contextual'
      | 'emotional'
      | 'temporal'
      | 'relational'
    severity: number
    description: string
    clarificationNeeded: string[]
  }>
  /** Resolution strategies */
  resolutionStrategies: string[]
  /** Impact on mood analysis */
  analysisImpact: {
    confidenceReduction: number
    scoreUncertainty: number
    recommendedAction: string
  }
}

// Type exports for convenience
export type ConversationDataInput = z.input<typeof ConversationDataSchema>
export type MoodAnalysisInput = z.input<typeof MoodAnalysisResultSchema>
export type SignificanceScoreInput = z.input<
  typeof EmotionalSignificanceScoreSchema
>
