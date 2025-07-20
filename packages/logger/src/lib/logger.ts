import pino from 'pino'

import { getCallSite } from './stacktrace'

/**
 * Logger utilities for the application
 *
 * @exports logger - Main application logger with structured output
 * @exports log - Convenience methods with callsite information
 * @exports createCliLogger - Creates a CLI-friendly logger for scripts
 * @exports default - Alias for the main logger
 *
 * @example
 * ```ts
 * import { log, createCliLogger } from '@studio/logger'
 *
 * // For application logging with callsite info
 * log.info('User action completed', { userId: 123 })
 *
 * // For CLI scripts with human-readable output
 * const cliLogger = createCliLogger('debug')
 * cliLogger.info('Processing file...')
 * ```
 */

// Create base logger configuration
const baseConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
}

// Add pretty printing only in development, not in tests
const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.VITEST === 'true' || process.env.NODE_ENV === 'test'

if (isDevelopment && !isTest) {
  baseConfig.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'pid,hostname,time',
      translateTime: false,
      messageFormat: '{msg}',
    },
  }
}

// Create the logger instance
export const logger = pino(baseConfig)

/**
 * Configuration options for Node.js logger
 */
export interface NodeLoggerConfig {
  /** Log level threshold */
  level?: pino.LevelWithSilent
  /** Enable pretty printing for CLI/development */
  prettyPrint?: boolean
  /** Include callsite information in logs */
  includeCallsite?: boolean
  /** Global context to include in all logs */
  globalContext?: LogContext
  /** Tags to apply to all logs */
  tags?: string[]
}

/**
 * Create a CLI-friendly logger for scripts and development tools
 * @deprecated Use createLogger() instead for unified API
 */
export function createCliLogger(
  level: pino.LevelWithSilent = 'info',
): pino.Logger {
  const config: pino.LoggerOptions = {
    level,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname,time',
        translateTime: false,
        messageFormat: '{msg}',
      },
    },
  }

  return pino(config)
}

/**
 * Context object type for structured logging
 */
export interface LogContext {
  [key: string]: unknown
}

/**
 * Node.js Logger interface with context and tag support
 */
export interface NodeLogger {
  trace(message: string, context?: LogContext): void
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, context?: LogContext): void
  fatal(message: string, context?: LogContext): void
  withTag(tag: string): NodeLogger
  withContext(context: LogContext): NodeLogger
}

/**
 * Node.js logger implementation with context and tag support
 */
class NodeLoggerImpl implements NodeLogger {
  private pinoLogger: pino.Logger
  private tag?: string
  private context?: LogContext
  private includeCallsite: boolean

  constructor(
    pinoLogger: pino.Logger,
    tag?: string,
    context?: LogContext,
    includeCallsite = true,
  ) {
    this.pinoLogger = pinoLogger
    this.tag = tag
    this.context = context
    this.includeCallsite = includeCallsite
  }

  private logWithContext(
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal',
    message: string,
    context?: LogContext,
  ): void {
    // Merge tag and context
    const mergedContext: LogContext = {
      ...this.context,
      ...context,
    }

    // Include callsite if requested
    if (this.includeCallsite) {
      const callsite = getCallSite(4) // Skip 4 frames: getCallSite, logWithContext, the method, and the exported function
      if (callsite) {
        mergedContext.callsite = callsite
        // Add IDE-friendly clickable link format
        mergedContext.callsiteLink = `${callsite.file}:${callsite.line}:${callsite.column}`
      }
    }

    if (this.tag) {
      mergedContext.tag = this.tag
    }

    this.pinoLogger[level](mergedContext, message)
  }

  trace(message: string, context?: LogContext): void {
    this.logWithContext('trace', message, context)
  }

  debug(message: string, context?: LogContext): void {
    this.logWithContext('debug', message, context)
  }

  info(message: string, context?: LogContext): void {
    this.logWithContext('info', message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.logWithContext('warn', message, context)
  }

  error(message: string, context?: LogContext): void {
    this.logWithContext('error', message, context)
  }

  fatal(message: string, context?: LogContext): void {
    this.logWithContext('fatal', message, context)
  }

  withTag(tag: string): NodeLogger {
    return new NodeLoggerImpl(
      this.pinoLogger,
      tag,
      this.context,
      this.includeCallsite,
    )
  }

  withContext(context: LogContext): NodeLogger {
    const mergedContext = { ...this.context, ...context }
    return new NodeLoggerImpl(
      this.pinoLogger,
      this.tag,
      mergedContext,
      this.includeCallsite,
    )
  }
}

// Create smart default logger instance that auto-detects environment
const createDefaultLogger = () => createLogger()

// Export the smart logger as default
export default createDefaultLogger()

/**
 * Create a logger instance with unified configuration
 * Works in both Node.js and browser environments
 * Auto-detects appropriate mode based on environment when no explicit config provided
 */
function createLoggerExplicit(config: NodeLoggerConfig): NodeLogger {
  const {
    level = 'info',
    prettyPrint = false,
    includeCallsite,
    globalContext,
    tags = [],
  } = config

  const pinoConfig: pino.LoggerOptions = {
    level,
  }

  // Add pretty printing if requested or in development
  const isDevelopment = process.env.NODE_ENV === 'development'
  const isTest =
    process.env.VITEST === 'true' || process.env.NODE_ENV === 'test'

  if ((prettyPrint || isDevelopment) && !isTest) {
    pinoConfig.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        ignore: 'pid,hostname,time',
        translateTime: false,
        messageFormat: '{msg}',
      },
    }
  }

  const pinoLogger = pino(pinoConfig)
  const shouldIncludeCallsite =
    includeCallsite !== undefined ? includeCallsite : !prettyPrint
  let nodeLogger: NodeLogger = new NodeLoggerImpl(
    pinoLogger,
    undefined,
    globalContext,
    shouldIncludeCallsite,
  )

  // Apply tags if provided
  if (tags.length > 0) {
    const combinedTag = tags.join('.')
    nodeLogger = nodeLogger.withTag(combinedTag)
  }

  return nodeLogger
}

/**
 * Create a logger instance with smart environment detection
 * Auto-detects appropriate mode based on environment when no explicit config provided
 */
export function createLogger(config: NodeLoggerConfig = {}): NodeLogger {
  // If user provided explicit prettyPrint or includeCallsite, use their config
  const hasExplicitMode =
    config.prettyPrint !== undefined || config.includeCallsite !== undefined

  if (hasExplicitMode) {
    return createLoggerExplicit(config)
  }

  // Auto-detect mode and merge with environment config
  const mode = getDefaultMode()
  const envConfig = getEnvironmentConfig()
  const mergedConfig = { ...envConfig, ...config }

  switch (mode) {
    case 'debug':
      return debug(mergedConfig)
    case 'cli':
      return cli(mergedConfig)
    case 'production':
    default:
      return production(mergedConfig)
  }
}

/**
 * Environment detection and configuration
 */

type LoggerMode = 'debug' | 'production' | 'cli'

/**
 * Detect the appropriate logger mode based on environment
 */
function getDefaultMode(): LoggerMode {
  // Check for explicit override first
  const envMode = process.env.LOGGER_MODE as LoggerMode
  if (envMode && ['debug', 'production', 'cli'].includes(envMode)) {
    return envMode
  }

  // Auto-detect based on environment
  if (process.env.NODE_ENV === 'development') return 'debug'
  if (process.env.NODE_ENV === 'production') return 'production'

  // Check if we're in CI or non-TTY environment
  if (process.env.CI || (process.stdout && !process.stdout.isTTY)) {
    return 'production'
  }

  // Default to production for safety
  return 'production'
}

/**
 * Get environment-aware logger configuration
 */
function getEnvironmentConfig(): Partial<NodeLoggerConfig> {
  const config: Partial<NodeLoggerConfig> = {}

  // Override log level if specified
  if (process.env.LOG_LEVEL) {
    config.level = process.env.LOG_LEVEL as pino.LevelWithSilent
  }

  // Override pretty print if specified
  if (process.env.LOGGER_PRETTY) {
    config.prettyPrint = process.env.LOGGER_PRETTY === 'true'
  }

  // Override callsite if specified
  if (process.env.LOGGER_CALLSITE) {
    config.includeCallsite = process.env.LOGGER_CALLSITE === 'true'
  }

  return config
}

/**
 * Preset helper functions for common logging scenarios
 */

/**
 * Create a CLI-friendly logger for user feedback and tooling
 * - Pretty print enabled for readability
 * - No callsite information to reduce clutter
 * - Ideal for command-line tools and scripts
 */
export function cli(config: Partial<NodeLoggerConfig> = {}): NodeLogger {
  return createLogger({
    level: 'info',
    prettyPrint: true,
    includeCallsite: false,
    ...config,
  })
}

/**
 * Create a debug logger for development
 * - Pretty print enabled for readability
 * - Callsite information included with clickable links
 * - Ideal for development debugging
 */
export function debug(config: Partial<NodeLoggerConfig> = {}): NodeLogger {
  return createLogger({
    level: 'info',
    prettyPrint: true,
    includeCallsite: true,
    ...config,
  })
}

/**
 * Create a production logger for structured logging
 * - Structured JSON output for monitoring systems
 * - Full callsite information for debugging
 * - Timestamps and metadata preserved
 */
export function production(config: Partial<NodeLoggerConfig> = {}): NodeLogger {
  return createLogger({
    level: 'info',
    prettyPrint: false,
    includeCallsite: true,
    ...config,
  })
}
