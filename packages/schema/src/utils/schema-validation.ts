import { z } from 'zod'

import { MemorySchema } from '../memory/core-memory.js'
import { EmotionalContextSchema } from '../memory/emotional-context.js'
import { ParticipantSchema } from '../memory/participants.js'
import { RelationshipDynamicsSchema } from '../memory/relationship-dynamics.js'

/**
 * Detailed validation error with field-level information
 */
export interface ValidationError {
  /** The field path where the error occurred */
  field: string
  /** Human-readable error message */
  message: string
  /** The actual value that failed validation */
  value: unknown
  /** The expected type or format */
  expectedType: string
  /** Error code for programmatic handling */
  code: string
}

/**
 * Validation warning for non-critical issues
 */
export interface ValidationWarning {
  /** The field path where the warning occurred */
  field: string
  /** Human-readable warning message */
  message: string
  /** The value that triggered the warning */
  value: unknown
  /** Suggested action to resolve the warning */
  suggestion?: string
}

/**
 * Comprehensive validation result with errors and warnings
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean
  /** Critical errors that prevent processing */
  errors: ValidationError[]
  /** Non-critical warnings */
  warnings: ValidationWarning[]
  /** Performance metrics for the validation */
  performance?: {
    /** Time taken to validate in milliseconds */
    validationTimeMs: number
    /** Number of fields validated */
    fieldsValidated: number
  }
}

/**
 * Options for validation behavior
 */
export interface ValidationOptions {
  /** Whether to include performance metrics */
  includePerformance?: boolean
  /** Whether to perform strict validation (fail on warnings) */
  strict?: boolean
  /** Maximum depth for nested object validation */
  maxDepth?: number
  /** Custom validation rules */
  customRules?: Array<(obj: unknown) => ValidationError | null>
}

/**
 * Validate a Memory object with comprehensive error reporting
 */
export function validateMemory(
  memory: unknown,
  options: ValidationOptions = {},
): ValidationResult {
  const startTime = performance.now()
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  try {
    // Use Zod schema for initial validation
    const result = MemorySchema.safeParse(memory)

    if (!result.success) {
      // Convert Zod errors to our format
      result.error.issues.forEach((issue) => {
        errors.push({
          field: issue.path.join('.'),
          message: issue.message,
          value: getValueAtPath(memory, issue.path),
          expectedType: getExpectedType(issue),
          code: issue.code,
        })
      })
    }

    // Additional custom validations
    if (options.customRules) {
      options.customRules.forEach((rule) => {
        const customError = rule(memory)
        if (customError) {
          errors.push(customError)
        }
      })
    }

    // Add warnings for quality issues
    addMemoryWarnings(memory, warnings)
  } catch (error) {
    errors.push({
      field: 'root',
      message: `Validation failed with unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      value: memory,
      expectedType: 'Memory',
      code: 'VALIDATION_ERROR',
    })
  }

  const endTime = performance.now()
  const isValid =
    errors.length === 0 && (!options.strict || warnings.length === 0)

  const result: ValidationResult = {
    isValid,
    errors,
    warnings,
  }

  if (options.includePerformance) {
    result.performance = {
      validationTimeMs: endTime - startTime,
      fieldsValidated: countFields(memory),
    }
  }

  return result
}

/**
 * Validate an EmotionalContext object
 */
export function validateEmotionalContext(
  context: unknown,
  options: ValidationOptions = {},
): ValidationResult {
  const startTime = performance.now()
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  try {
    const result = EmotionalContextSchema.safeParse(context)

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        errors.push({
          field: issue.path.join('.'),
          message: issue.message,
          value: getValueAtPath(context, issue.path),
          expectedType: getExpectedType(issue),
          code: issue.code,
        })
      })
    }

    // Add warnings for emotional context quality
    addEmotionalContextWarnings(context, warnings)
  } catch (error) {
    errors.push({
      field: 'root',
      message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      value: context,
      expectedType: 'EmotionalContext',
      code: 'VALIDATION_ERROR',
    })
  }

  const endTime = performance.now()
  const isValid =
    errors.length === 0 && (!options.strict || warnings.length === 0)

  const result: ValidationResult = {
    isValid,
    errors,
    warnings,
  }

  if (options.includePerformance) {
    result.performance = {
      validationTimeMs: endTime - startTime,
      fieldsValidated: countFields(context),
    }
  }

  return result
}

/**
 * Validate a RelationshipDynamics object
 */
export function validateRelationshipDynamics(
  dynamics: unknown,
  options: ValidationOptions = {},
): ValidationResult {
  const startTime = performance.now()
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  try {
    const result = RelationshipDynamicsSchema.safeParse(dynamics)

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        errors.push({
          field: issue.path.join('.'),
          message: issue.message,
          value: getValueAtPath(dynamics, issue.path),
          expectedType: getExpectedType(issue),
          code: issue.code,
        })
      })
    }

    // Add warnings for relationship dynamics quality
    addRelationshipDynamicsWarnings(dynamics, warnings)
  } catch (error) {
    errors.push({
      field: 'root',
      message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      value: dynamics,
      expectedType: 'RelationshipDynamics',
      code: 'VALIDATION_ERROR',
    })
  }

  const endTime = performance.now()
  const isValid =
    errors.length === 0 && (!options.strict || warnings.length === 0)

  const result: ValidationResult = {
    isValid,
    errors,
    warnings,
  }

  if (options.includePerformance) {
    result.performance = {
      validationTimeMs: endTime - startTime,
      fieldsValidated: countFields(dynamics),
    }
  }

  return result
}

/**
 * Validate a Participant object
 */
export function validateParticipant(
  participant: unknown,
  options: ValidationOptions = {},
): ValidationResult {
  const startTime = performance.now()
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  try {
    const result = ParticipantSchema.safeParse(participant)

    if (!result.success) {
      result.error.issues.forEach((issue) => {
        errors.push({
          field: issue.path.join('.'),
          message: issue.message,
          value: getValueAtPath(participant, issue.path),
          expectedType: getExpectedType(issue),
          code: issue.code,
        })
      })
    }
  } catch (error) {
    errors.push({
      field: 'root',
      message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      value: participant,
      expectedType: 'Participant',
      code: 'VALIDATION_ERROR',
    })
  }

  const endTime = performance.now()
  const isValid =
    errors.length === 0 && (!options.strict || warnings.length === 0)

  const result: ValidationResult = {
    isValid,
    errors,
    warnings,
  }

  if (options.includePerformance) {
    result.performance = {
      validationTimeMs: endTime - startTime,
      fieldsValidated: countFields(participant),
    }
  }

  return result
}

/**
 * Batch validation for multiple objects
 */
export function validateBatch<T>(
  objects: T[],
  validator: (obj: T, options?: ValidationOptions) => ValidationResult,
  options: ValidationOptions = {},
): {
  results: ValidationResult[]
  summary: {
    totalObjects: number
    validObjects: number
    invalidObjects: number
    totalErrors: number
    totalWarnings: number
    averageValidationTime?: number
  }
} {
  const results = objects.map((obj) => validator(obj, options))

  const summary = {
    totalObjects: objects.length,
    validObjects: results.filter((r) => r.isValid).length,
    invalidObjects: results.filter((r) => !r.isValid).length,
    totalErrors: results.reduce((sum, r) => sum + r.errors.length, 0),
    totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
    ...(options.includePerformance && {
      averageValidationTime:
        results.reduce(
          (sum, r) => sum + (r.performance?.validationTimeMs || 0),
          0,
        ) / results.length,
    }),
  }

  return { results, summary }
}

// Helper functions

function getValueAtPath(obj: unknown, path: (string | number)[]): unknown {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Need to access nested properties by path, obj starts as unknown
  return path.reduce((current: any, key) => current?.[key], obj)
}

function getExpectedType(issue: z.ZodIssue): string {
  switch (issue.code) {
    case 'invalid_type':
      return issue.expected
    case 'too_small':
      return `${issue.type} with minimum ${issue.minimum}`
    case 'too_big':
      return `${issue.type} with maximum ${issue.maximum}`
    case 'invalid_enum_value':
      return `one of: ${issue.options?.join(', ') || 'enum values'}`
    case 'invalid_string':
      return `string matching ${issue.validation}`
    default:
      return 'valid value'
  }
}

function countFields(obj: unknown, depth = 0, maxDepth = 10): number {
  if (depth > maxDepth || obj === null || typeof obj !== 'object') {
    return 1
  }

  if (Array.isArray(obj)) {
    return obj.reduce(
      (count, item) => count + countFields(item, depth + 1, maxDepth),
      0,
    )
  }

  return Object.values(obj).reduce(
    (count: number, value) => count + countFields(value, depth + 1, maxDepth),
    0,
  )
}

function addMemoryWarnings(
  memory: unknown,
  warnings: ValidationWarning[],
): void {
  if (!memory || typeof memory !== 'object') return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Need to access properties of unknown object after type check
  const memoryCandidate = memory as any

  // Check for low confidence
  if (
    memoryCandidate.metadata?.confidence !== undefined &&
    memoryCandidate.metadata.confidence < 0.5
  ) {
    warnings.push({
      field: 'metadata.confidence',
      message: 'Low confidence score may indicate poor memory quality',
      value: memoryCandidate.metadata.confidence,
      suggestion: 'Consider re-processing or manual review',
    })
  }

  // Check for empty content
  if (
    memoryCandidate.content &&
    typeof memoryCandidate.content === 'string' &&
    memoryCandidate.content.trim().length < 10
  ) {
    warnings.push({
      field: 'content',
      message: 'Very short content may lack sufficient context',
      value: memoryCandidate.content,
      suggestion: 'Ensure memory captures meaningful information',
    })
  }

  // Check for missing tags
  if (
    !memoryCandidate.tags ||
    !Array.isArray(memoryCandidate.tags) ||
    memoryCandidate.tags.length === 0
  ) {
    warnings.push({
      field: 'tags',
      message: 'No tags specified for categorization',
      value: memoryCandidate.tags,
      suggestion: 'Add relevant tags for better organization',
    })
  }
}

function addEmotionalContextWarnings(
  context: unknown,
  warnings: ValidationWarning[],
): void {
  if (!context || typeof context !== 'object') return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Need to access properties of unknown object after type check
  const contextCandidate = context as any

  // Check for intensity-valence mismatch
  if (
    typeof contextCandidate.intensity === 'number' &&
    typeof contextCandidate.valence === 'number' &&
    contextCandidate.intensity > 0.8 &&
    Math.abs(contextCandidate.valence) < 0.3
  ) {
    warnings.push({
      field: 'intensity/valence',
      message:
        'High intensity with neutral valence may indicate complex emotions',
      value: {
        intensity: contextCandidate.intensity,
        valence: contextCandidate.valence,
      },
      suggestion: 'Consider reviewing emotional classification',
    })
  }

  // Check for missing themes
  if (
    !contextCandidate.themes ||
    !Array.isArray(contextCandidate.themes) ||
    contextCandidate.themes.length === 0
  ) {
    warnings.push({
      field: 'themes',
      message: 'No emotional themes identified',
      value: contextCandidate.themes,
      suggestion: 'Consider adding relevant emotional themes',
    })
  }
}

function addRelationshipDynamicsWarnings(
  dynamics: unknown,
  warnings: ValidationWarning[],
): void {
  if (!dynamics || typeof dynamics !== 'object') return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Need to access properties of unknown object after type check
  const dynamicsCandidate = dynamics as any

  // Check for concerning patterns
  if (
    dynamicsCandidate.powerDynamics?.concerningPatterns &&
    Array.isArray(dynamicsCandidate.powerDynamics.concerningPatterns) &&
    dynamicsCandidate.powerDynamics.concerningPatterns.length > 0
  ) {
    warnings.push({
      field: 'powerDynamics.concerningPatterns',
      message: 'Concerning patterns detected in relationship dynamics',
      value: dynamicsCandidate.powerDynamics.concerningPatterns,
      suggestion: 'Review for potential relationship issues',
    })
  }

  // Check for low connection strength with positive interaction quality
  if (
    typeof dynamicsCandidate.connectionStrength === 'number' &&
    dynamicsCandidate.connectionStrength < 0.3 &&
    dynamicsCandidate.interactionQuality === 'positive'
  ) {
    warnings.push({
      field: 'connectionStrength/interactionQuality',
      message:
        'Low connection strength conflicts with positive interaction quality',
      value: {
        connectionStrength: dynamicsCandidate.connectionStrength,
        interactionQuality: dynamicsCandidate.interactionQuality,
      },
      suggestion: 'Review relationship assessment for consistency',
    })
  }
}
