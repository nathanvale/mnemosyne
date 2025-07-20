/**
 * Schema constants and enums for the memory system
 */

/**
 * Current schema version
 */
export const SCHEMA_VERSION = '1.0.0'

/**
 * Default confidence thresholds
 */
export const CONFIDENCE_THRESHOLDS = {
  /** Minimum confidence for automatic processing */
  AUTO_PROCESS: 0.8,
  /** Minimum confidence for validation */
  VALIDATION: 0.6,
  /** Threshold below which manual review is required */
  MANUAL_REVIEW: 0.4,
  /** Threshold below which memories are rejected */
  REJECTION: 0.2,
} as const

/**
 * Quality score thresholds
 */
export const QUALITY_THRESHOLDS = {
  /** Excellent quality */
  EXCELLENT: 0.9,
  /** Good quality */
  GOOD: 0.7,
  /** Fair quality */
  FAIR: 0.5,
  /** Poor quality */
  POOR: 0.3,
} as const

/**
 * Emotional intensity categories
 */
export const EMOTIONAL_INTENSITY = {
  /** Very low emotional intensity */
  VERY_LOW: 0.1,
  /** Low emotional intensity */
  LOW: 0.3,
  /** Medium emotional intensity */
  MEDIUM: 0.5,
  /** High emotional intensity */
  HIGH: 0.7,
  /** Very high emotional intensity */
  VERY_HIGH: 0.9,
} as const

/**
 * Connection strength levels
 */
export const CONNECTION_STRENGTH = {
  /** Very weak connection */
  VERY_WEAK: 0.1,
  /** Weak connection */
  WEAK: 0.3,
  /** Moderate connection */
  MODERATE: 0.5,
  /** Strong connection */
  STRONG: 0.7,
  /** Very strong connection */
  VERY_STRONG: 0.9,
} as const

/**
 * Time constants for temporal analysis
 */
export const TIME_CONSTANTS = {
  /** Milliseconds in a minute */
  MINUTE_MS: 60 * 1000,
  /** Milliseconds in an hour */
  HOUR_MS: 60 * 60 * 1000,
  /** Milliseconds in a day */
  DAY_MS: 24 * 60 * 60 * 1000,
  /** Milliseconds in a week */
  WEEK_MS: 7 * 24 * 60 * 60 * 1000,
  /** Milliseconds in a month (30 days) */
  MONTH_MS: 30 * 24 * 60 * 60 * 1000,
  /** Milliseconds in a year (365 days) */
  YEAR_MS: 365 * 24 * 60 * 60 * 1000,
} as const

/**
 * Default processing limits
 */
export const PROCESSING_LIMITS = {
  /** Maximum batch size for processing */
  MAX_BATCH_SIZE: 1000,
  /** Maximum memories per validation session */
  MAX_VALIDATION_SESSION: 50,
  /** Maximum refinement suggestions per memory */
  MAX_REFINEMENT_SUGGESTIONS: 10,
  /** Maximum participant dynamics per memory */
  MAX_PARTICIPANT_DYNAMICS: 20,
} as const

/**
 * Privacy settings
 */
export const PRIVACY_SETTINGS = {
  /** Content that triggers privacy concerns */
  SENSITIVE_KEYWORDS: [
    'password',
    'ssn',
    'social security',
    'credit card',
    'bank account',
    'address',
    'phone number',
    'email',
  ],
  /** Maximum content length before truncation */
  MAX_CONTENT_LENGTH: 10000,
  /** Fields that can contain PII */
  PII_FIELDS: ['content', 'name', 'aliases'],
} as const

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  /** Minimum content length */
  MIN_CONTENT_LENGTH: 1,
  /** Maximum content length */
  MAX_CONTENT_LENGTH: 50000,
  /** Maximum number of participants */
  MAX_PARTICIPANTS: 50,
  /** Maximum number of tags */
  MAX_TAGS: 20,
  /** Maximum tag length */
  MAX_TAG_LENGTH: 50,
} as const

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  INVALID_MEMORY: 'Invalid memory data provided',
  MISSING_REQUIRED_FIELD: 'Required field is missing',
  INVALID_TIMESTAMP: 'Invalid timestamp format',
  INVALID_CONFIDENCE: 'Confidence must be between 0 and 1',
  INVALID_INTENSITY: 'Intensity must be between 0 and 1',
  INVALID_VALENCE: 'Valence must be between -1 and 1',
  CONTENT_TOO_LONG: 'Content exceeds maximum length',
  TOO_MANY_PARTICIPANTS: 'Too many participants in memory',
  TOO_MANY_TAGS: 'Too many tags assigned to memory',
} as const
