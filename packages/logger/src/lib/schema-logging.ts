import { type ValidationResult, type ValidationError } from '@studio/schema'

import { createLogger, type NodeLogger, type LogContext } from './logger'

/**
 * Schema-aware logging utilities for memory processing
 */

/**
 * Memory processing event types for structured logging
 */
export type MemoryProcessingEvent =
  | 'memory_validation_started'
  | 'memory_validation_completed'
  | 'memory_validation_failed'
  | 'memory_creation_started'
  | 'memory_creation_completed'
  | 'memory_creation_failed'
  | 'batch_processing_started'
  | 'batch_processing_completed'
  | 'batch_processing_progress'

/**
 * Schema validation event types
 */
export type SchemaValidationEvent =
  | 'schema_validation_started'
  | 'schema_validation_completed'
  | 'schema_validation_error'
  | 'schema_transformation_started'
  | 'schema_transformation_completed'
  | 'schema_transformation_failed'

/**
 * Memory processing context for structured logging
 */
export interface MemoryProcessingContext extends LogContext {
  memoryId?: string
  batchId?: string
  batchSize?: number
  processedCount?: number
  totalCount?: number
  successCount?: number
  failureCount?: number
  validationErrors?: number
  databaseErrors?: number
  processingTimeMs?: number
}

/**
 * Schema validation context for structured logging
 */
export interface SchemaValidationContext extends LogContext {
  schemaType: 'memory' | 'emotional_context' | 'relationship_dynamics'
  dataId?: string
  validationTimeMs?: number
  errorCount?: number
  warningCount?: number
  transformationType?: 'legacy_to_current' | 'api_to_database' | 'export_format'
}

/**
 * Schema-aware logger for memory processing
 */
export class MemoryProcessingLogger {
  private logger: NodeLogger

  constructor(tags: string[] = ['memory-processing']) {
    this.logger = createLogger({
      tags,
      includeCallsite: true,
    })
  }

  /**
   * Log memory processing events with structured context
   */
  logMemoryEvent(
    event: MemoryProcessingEvent,
    message: string,
    context: MemoryProcessingContext = {},
  ): void {
    const eventContext: LogContext = {
      event,
      eventType: 'memory_processing',
      ...context,
    }

    switch (event) {
      case 'memory_validation_failed':
      case 'memory_creation_failed':
      case 'batch_processing_completed':
        if (context.failureCount && context.failureCount > 0) {
          this.logger.warn(message, eventContext)
        } else {
          this.logger.info(message, eventContext)
        }
        break

      case 'batch_processing_progress':
        this.logger.debug(message, eventContext)
        break

      default:
        this.logger.info(message, eventContext)
    }
  }

  /**
   * Log schema validation events with detailed error information
   */
  logSchemaEvent(
    event: SchemaValidationEvent,
    message: string,
    context: SchemaValidationContext,
    validationResult?: ValidationResult,
  ): void {
    const eventContext: LogContext = {
      event,
      eventType: 'schema_validation',
      ...context,
    }

    // Include validation details if provided
    if (validationResult) {
      eventContext.isValid = validationResult.isValid
      eventContext.errorCount = validationResult.errors.length
      eventContext.warningCount = validationResult.warnings.length

      if (!validationResult.isValid) {
        eventContext.validationErrors = validationResult.errors.map(
          (error) => ({
            field: error.field,
            message: error.message,
            code: error.code,
            expectedType: error.expectedType,
          }),
        )
      }

      if (validationResult.warnings.length > 0) {
        eventContext.validationWarnings = validationResult.warnings.map(
          (warning) => ({
            field: warning.field,
            message: warning.message,
          }),
        )
      }
    }

    switch (event) {
      case 'schema_validation_error':
      case 'schema_transformation_failed':
        this.logger.error(message, eventContext)
        break

      case 'schema_validation_started':
      case 'schema_transformation_started':
        this.logger.debug(message, eventContext)
        break

      default:
        this.logger.info(message, eventContext)
    }
  }

  /**
   * Log performance metrics for schema operations
   */
  logPerformanceMetrics(
    operation: string,
    metrics: {
      duration: number
      itemCount: number
      successRate: number
      throughput: number
    },
    context: LogContext = {},
  ): void {
    this.logger.info(`Performance metrics for ${operation}`, {
      event: 'performance_metrics',
      operation,
      durationMs: metrics.duration,
      itemCount: metrics.itemCount,
      successRate: metrics.successRate,
      throughputPerSecond: metrics.throughput,
      ...context,
    })
  }

  /**
   * Create a child logger with additional context
   */
  withContext(context: LogContext): MemoryProcessingLogger {
    const childLogger = new MemoryProcessingLogger()
    childLogger.logger = this.logger.withContext(context)
    return childLogger
  }

  /**
   * Create a child logger with additional tags
   */
  withTag(tag: string): MemoryProcessingLogger {
    const childLogger = new MemoryProcessingLogger()
    childLogger.logger = this.logger.withTag(tag)
    return childLogger
  }
}

/**
 * Schema validation logger with automatic data validation
 */
export class SchemaValidationLogger {
  private logger: MemoryProcessingLogger

  constructor(tags: string[] = ['schema-validation']) {
    this.logger = new MemoryProcessingLogger(tags)
  }

  /**
   * Log memory validation result
   */
  logMemoryValidation(
    validationResult: ValidationResult,
    context: Omit<SchemaValidationContext, 'schemaType'> = {},
  ): void {
    const finalContext: SchemaValidationContext = {
      ...context,
      schemaType: 'memory',
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
    }

    if (validationResult.isValid) {
      this.logger.logSchemaEvent(
        'schema_validation_completed',
        'Memory validation successful',
        finalContext,
        validationResult,
      )
    } else {
      this.logger.logSchemaEvent(
        'schema_validation_error',
        'Memory validation failed',
        finalContext,
        validationResult,
      )
    }
  }

  /**
   * Log emotional context validation result
   */
  logEmotionalContextValidation(
    validationResult: ValidationResult,
    context: Omit<SchemaValidationContext, 'schemaType'> = {},
  ): void {
    const finalContext: SchemaValidationContext = {
      ...context,
      schemaType: 'emotional_context',
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
    }

    if (validationResult.isValid) {
      this.logger.logSchemaEvent(
        'schema_validation_completed',
        'Emotional context validation successful',
        finalContext,
        validationResult,
      )
    } else {
      this.logger.logSchemaEvent(
        'schema_validation_error',
        'Emotional context validation failed',
        finalContext,
        validationResult,
      )
    }
  }

  /**
   * Log relationship dynamics validation result
   */
  logRelationshipDynamicsValidation(
    validationResult: ValidationResult,
    context: Omit<SchemaValidationContext, 'schemaType'> = {},
  ): void {
    const finalContext: SchemaValidationContext = {
      ...context,
      schemaType: 'relationship_dynamics',
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
    }

    if (validationResult.isValid) {
      this.logger.logSchemaEvent(
        'schema_validation_completed',
        'Relationship dynamics validation successful',
        finalContext,
        validationResult,
      )
    } else {
      this.logger.logSchemaEvent(
        'schema_validation_error',
        'Relationship dynamics validation failed',
        finalContext,
        validationResult,
      )
    }
  }
}

/**
 * Create a memory processing logger
 */
export function createMemoryLogger(tags?: string[]): MemoryProcessingLogger {
  return new MemoryProcessingLogger(tags)
}

/**
 * Create a schema validation logger
 */
export function createSchemaLogger(tags?: string[]): SchemaValidationLogger {
  return new SchemaValidationLogger(tags)
}

/**
 * Utility function to log validation errors in a structured format
 */
export function logValidationErrors(
  logger: NodeLogger,
  errors: ValidationError[],
  context: LogContext = {},
): void {
  errors.forEach((error, index) => {
    logger.error(`Validation error ${index + 1}`, {
      ...context,
      validationError: {
        field: error.field,
        message: error.message,
        code: error.code,
        expectedType: error.expectedType,
        actualValue: error.value,
      },
    })
  })
}

/**
 * Utility function to measure and log operation performance
 */
export function withPerformanceLogging<T>(
  logger: MemoryProcessingLogger,
  operation: string,
  fn: () => T | Promise<T>,
  context: LogContext = {},
): Promise<T> {
  const startTime = Date.now()

  logger.logMemoryEvent('memory_validation_started', `Starting ${operation}`, {
    ...context,
    operation,
  })

  const executeAndLog = async (): Promise<T> => {
    try {
      const result = await Promise.resolve(fn())
      const duration = Date.now() - startTime

      logger.logMemoryEvent(
        'memory_validation_completed',
        `Completed ${operation}`,
        {
          ...context,
          operation,
          processingTimeMs: duration,
          success: true,
        },
      )

      return result
    } catch (error) {
      const duration = Date.now() - startTime

      logger.logMemoryEvent('memory_validation_failed', `Failed ${operation}`, {
        ...context,
        operation,
        processingTimeMs: duration,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      })

      throw error
    }
  }

  return executeAndLog()
}
