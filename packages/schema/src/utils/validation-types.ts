/**
 * Validation result interfaces and types for the schema validation system
 */

/**
 * Severity levels for validation issues
 */
export enum ValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Categories of validation issues
 */
export enum ValidationCategory {
  REQUIRED_FIELD = 'required_field',
  TYPE_MISMATCH = 'type_mismatch',
  FORMAT_INVALID = 'format_invalid',
  RANGE_VIOLATION = 'range_violation',
  ENUM_VIOLATION = 'enum_violation',
  LOGICAL_INCONSISTENCY = 'logical_inconsistency',
  PERFORMANCE_CONCERN = 'performance_concern',
  QUALITY_CONCERN = 'quality_concern',
}

/**
 * Base interface for validation issues
 */
export interface ValidationIssue {
  /** Unique identifier for this type of issue */
  id: string
  /** Severity level of the issue */
  severity: ValidationSeverity
  /** Category of the validation issue */
  category: ValidationCategory
  /** Field path where the issue occurred */
  field: string
  /** Human-readable message */
  message: string
  /** The actual value that caused the issue */
  value: unknown
  /** Expected value or format */
  expected?: string
  /** Additional context or details */
  context?: Record<string, unknown>
  /** Suggested fix or action */
  suggestion?: string
  /** Rule or constraint that was violated */
  rule?: string
}

/**
 * Critical validation error that prevents processing
 */
export interface ValidationError extends ValidationIssue {
  severity: ValidationSeverity.ERROR
  /** Error code for programmatic handling */
  code: string
  /** Stack trace if available */
  stack?: string
}

/**
 * Non-critical validation warning
 */
export interface ValidationWarning extends ValidationIssue {
  severity: ValidationSeverity.WARNING
  /** Whether this warning can be auto-fixed */
  autoFixable?: boolean
  /** Function to auto-fix the issue */
  autoFix?: () => unknown
}

/**
 * Informational validation note
 */
export interface ValidationInfo extends ValidationIssue {
  severity: ValidationSeverity.INFO
  /** Metric or measurement associated with this info */
  metric?: {
    name: string
    value: number
    unit?: string
  }
}

/**
 * Comprehensive validation result
 */
export interface ValidationResult {
  /** Whether validation passed without errors */
  isValid: boolean
  /** Critical errors that prevent processing */
  errors: ValidationError[]
  /** Non-critical warnings */
  warnings: ValidationWarning[]
  /** Informational notes */
  info: ValidationInfo[]
  /** Performance metrics */
  performance: ValidationPerformance
  /** Summary statistics */
  summary: ValidationSummary
}

/**
 * Performance metrics for validation
 */
export interface ValidationPerformance {
  /** Total validation time in milliseconds */
  totalTimeMs: number
  /** Time per validation phase */
  phases: {
    schemaValidation: number
    typeGuards: number
    customRules: number
    warnings: number
  }
  /** Number of fields validated */
  fieldsValidated: number
  /** Validation rate (fields per millisecond) */
  validationRate: number
  /** Memory usage in bytes (if available) */
  memoryUsage?: number
}

/**
 * Summary statistics for validation result
 */
export interface ValidationSummary {
  /** Total number of issues found */
  totalIssues: number
  /** Issues by severity */
  bySeverity: {
    errors: number
    warnings: number
    info: number
  }
  /** Issues by category */
  byCategory: Record<ValidationCategory, number>
  /** Most common issue types */
  topIssues: Array<{
    category: ValidationCategory
    count: number
    percentage: number
  }>
  /** Overall quality score (0-100) */
  qualityScore: number
}

/**
 * Configuration for validation behavior
 */
export interface ValidationConfig {
  /** Validation mode */
  mode: 'strict' | 'normal' | 'lenient'
  /** Whether to include performance metrics */
  includePerformance: boolean
  /** Whether to include informational notes */
  includeInfo: boolean
  /** Maximum validation time in milliseconds */
  maxTimeMs?: number
  /** Maximum nested object depth to validate */
  maxDepth: number
  /** Custom validation rules */
  customRules: ValidationRule[]
  /** Auto-fix options */
  autoFix: {
    enabled: boolean
    warnings: boolean
    errors: boolean
  }
}

/**
 * Custom validation rule interface
 */
export interface ValidationRule {
  /** Unique identifier for the rule */
  id: string
  /** Human-readable name */
  name: string
  /** Description of what the rule checks */
  description: string
  /** Function that performs the validation */
  validate: (obj: unknown, context: ValidationContext) => ValidationIssue[]
  /** Whether this rule is enabled */
  enabled: boolean
  /** Priority/order for rule execution */
  priority: number
}

/**
 * Context provided to validation rules
 */
export interface ValidationContext {
  /** Current field path being validated */
  currentPath: string[]
  /** Parent object */
  parent?: unknown
  /** Root object being validated */
  root: unknown
  /** Validation configuration */
  config: ValidationConfig
  /** Accumulated results so far */
  results: ValidationResult
}

/**
 * Batch validation result for multiple objects
 */
export interface BatchValidationResult<T> {
  /** Individual validation results */
  results: Array<{
    item: T
    validation: ValidationResult
    index: number
  }>
  /** Aggregate statistics */
  aggregate: {
    totalItems: number
    validItems: number
    invalidItems: number
    totalErrors: number
    totalWarnings: number
    averageQualityScore: number
    averageValidationTime: number
  }
  /** Most common issues across the batch */
  commonIssues: Array<{
    category: ValidationCategory
    count: number
    affectedItems: number
    percentage: number
  }>
}

/**
 * Options for batch validation
 */
export interface BatchValidationOptions {
  /** Validation configuration */
  config: ValidationConfig
  /** Batch size for processing */
  batchSize: number
  /** Maximum concurrent validations */
  maxConcurrency: number
  /** Progress callback */
  onProgress?: (processed: number, total: number) => void
  /** Error callback for individual items */
  onItemError?: (error: Error, item: unknown, index: number) => void
  /** Whether to continue on validation errors */
  continueOnError: boolean
}

/**
 * Type for validation middleware functions
 */
export type ValidationMiddleware = (
  context: ValidationContext,
  next: () => ValidationIssue[],
) => ValidationIssue[]

/**
 * Registry for custom validation rules
 */
export interface ValidationRuleRegistry {
  /** Register a new validation rule */
  register(rule: ValidationRule): void
  /** Unregister a validation rule */
  unregister(ruleId: string): void
  /** Get all registered rules */
  getAllRules(): ValidationRule[]
  /** Get rules by category */
  getRulesByCategory(category: ValidationCategory): ValidationRule[]
  /** Enable/disable a rule */
  setRuleEnabled(ruleId: string, enabled: boolean): void
}

/**
 * Factory for creating validation configurations
 */
export interface ValidationConfigFactory {
  /** Create a strict validation config */
  createStrict(): ValidationConfig
  /** Create a normal validation config */
  createNormal(): ValidationConfig
  /** Create a lenient validation config */
  createLenient(): ValidationConfig
  /** Create a custom config */
  createCustom(overrides: Partial<ValidationConfig>): ValidationConfig
}

/**
 * Utility types for validation
 */
export type ValidatedType<T> = T & { __validated: true }
export type ValidationFunction<T> = (obj: unknown) => obj is ValidatedType<T>
export type AsyncValidationFunction = (
  obj: unknown,
) => Promise<ValidationResult>

/**
 * Type guard for checking if an object has been validated
 */
export function isValidated<T>(obj: unknown): obj is ValidatedType<T> {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Type guard requires checking __validated property on unknown object
    (obj as any).__validated === true
  )
}

/**
 * Create a validation marker for validated objects
 */
export function markAsValidated<T>(obj: T): ValidatedType<T> {
  return { ...obj, __validated: true as const }
}

/**
 * Remove validation marker from an object
 */
export function removeValidationMarker<T>(obj: ValidatedType<T>): T {
  const { __validated: _, ...rest } = obj
  return rest as T
}
