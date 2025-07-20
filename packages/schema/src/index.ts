/**
 * @studio/schema - Core memory schema definitions for emotional intelligence
 *
 * This package provides TypeScript types and Zod schemas for all memory-related
 * data structures used in Phase 2 emotional intelligence processing.
 */

// Core memory types
export type { Memory, MemoryInput, MemoryOutput } from './memory/core-memory'
export { MemorySchema } from './memory/core-memory'

// Participant types
export type {
  Participant,
  ParticipantInput,
  ParticipantOutput,
} from './memory/participants'
export { ParticipantRole, ParticipantSchema } from './memory/participants'

// Emotional context types
export type {
  EmotionalContext,
  EmotionalContextInput,
  EmotionalContextOutput,
} from './memory/emotional-context'
export {
  EmotionalState,
  EmotionalTheme,
  EmotionalContextSchema,
} from './memory/emotional-context'

// Relationship dynamics types
export type {
  RelationshipDynamics,
  RelationshipDynamicsInput,
  RelationshipDynamicsOutput,
} from './memory/relationship-dynamics'
export {
  CommunicationPattern,
  InteractionQuality,
  RelationshipDynamicsSchema,
} from './memory/relationship-dynamics'

// Validation types
export type {
  ValidationResult as SchemaValidationResult,
  ValidationWorkflow,
  ValidationResultInput,
  ValidationResultOutput,
  ValidationWorkflowInput,
  ValidationWorkflowOutput,
} from './validation/validation-types'
export {
  ValidationStatus,
  ValidationIssueType,
  ValidationResultSchema,
  ValidationWorkflowSchema,
} from './validation/validation-types'

// Quality metrics types
export type {
  QualityMetrics,
  BatchQualityReport,
  QualityMetricsInput,
  QualityMetricsOutput,
  BatchQualityReportInput,
  BatchQualityReportOutput,
} from './validation/quality-metrics'
export {
  QualityMetricsSchema,
  BatchQualityReportSchema,
} from './validation/quality-metrics'

// Refinement types
export type {
  Refinement,
  RefinementHistory,
  RefinementSuggestions,
  RefinementInput,
  RefinementOutput,
  RefinementHistoryInput,
  RefinementHistoryOutput,
  RefinementSuggestionsInput,
  RefinementSuggestionsOutput,
} from './validation/refinement'
export {
  RefinementType,
  RefinementSchema,
  RefinementHistorySchema,
  RefinementSuggestionsSchema,
} from './validation/refinement'

// Processing metadata types
export type {
  ProcessingMetadata,
  BatchProcessingSummary,
  ProcessingMetadataInput,
  ProcessingMetadataOutput,
  BatchProcessingSummaryInput,
  BatchProcessingSummaryOutput,
} from './processing/metadata'
export {
  ProcessingStage,
  SourceSystem,
  ProcessingMetadataSchema,
  BatchProcessingSummarySchema,
} from './processing/metadata'

// Temporal analysis types
export type {
  TemporalPattern,
  TemporalContext,
  TemporalAnalytics,
  TemporalPatternInput,
  TemporalPatternOutput,
  TemporalContextInput,
  TemporalContextOutput,
  TemporalAnalyticsInput,
  TemporalAnalyticsOutput,
} from './processing/temporal'
export {
  TemporalPatternType,
  TemporalPatternSchema,
  TemporalContextSchema,
  TemporalAnalyticsSchema,
} from './processing/temporal'

// Type guard functions
export {
  isMemory,
  isMemoryMetadata,
  isEmotionalContext,
  isRelationshipDynamics,
  isParticipant,
  isParticipantArray,
  isEmotionalState,
  isEmotionalTheme,
  isCommunicationPattern,
  isInteractionQuality,
  isParticipantRole,
  isNonEmptyString,
  isUUID,
  isISODateTime,
  isNumberInRange,
  hasProperty,
} from './utils/type-guards'

// Schema validation functions
export type {
  ValidationError,
  ValidationWarning,
  ValidationResult,
  ValidationOptions,
} from './utils/schema-validation'
export {
  validateMemory,
  validateEmotionalContext,
  validateRelationshipDynamics,
  validateParticipant,
  validateBatch,
} from './utils/schema-validation'

// Data transformation functions
export type {
  ExportMemory,
  MemoryV1,
  MigrationRecord,
  MemoryFeatures,
} from './utils/transformations'
export {
  transformMemoryToExport,
  transformMemoryFromV1,
  transformMemoryForDatabase,
  transformMemoryFromDatabase,
  normalizeMemory,
  extractMemoryFeatures,
  createMigrationRecord,
  transformBatch,
} from './utils/transformations'

// Advanced validation types
export type {
  ValidationSeverity,
  ValidationCategory,
  ValidationIssue,
  ValidationConfig,
  ValidationRule,
  ValidationContext,
  BatchValidationResult,
  BatchValidationOptions,
  ValidationMiddleware,
  ValidationRuleRegistry,
  ValidationConfigFactory,
  ValidatedType,
  ValidationFunction,
  AsyncValidationFunction,
} from './utils/validation-types'
export {
  isValidated,
  markAsValidated,
  removeValidationMarker,
} from './utils/validation-types'

// Constants and utilities
export {
  SCHEMA_VERSION,
  CONFIDENCE_THRESHOLDS,
  QUALITY_THRESHOLDS,
  EMOTIONAL_INTENSITY,
  CONNECTION_STRENGTH,
  TIME_CONSTANTS,
  PROCESSING_LIMITS,
  PRIVACY_SETTINGS,
  VALIDATION_RULES,
  ERROR_MESSAGES,
} from './utils/constants'
