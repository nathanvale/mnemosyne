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
      translateTime: 'HH:MM:ss.l',
      ignore: 'pid,hostname',
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
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
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

  constructor(pinoLogger: pino.Logger, tag?: string, context?: LogContext) {
    this.pinoLogger = pinoLogger
    this.tag = tag
    this.context = context
  }

  private logWithCallsite(
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal',
    message: string,
    context?: LogContext,
  ): void {
    const callsite = getCallSite(4) // Skip 4 frames: getCallSite, logWithCallsite, the method, and the exported function

    // Merge tag and context
    const mergedContext: LogContext = {
      ...this.context,
      ...context,
      callsite,
    }

    if (this.tag) {
      mergedContext.tag = this.tag
    }

    this.pinoLogger[level](mergedContext, message)
  }

  trace(message: string, context?: LogContext): void {
    this.logWithCallsite('trace', message, context)
  }

  debug(message: string, context?: LogContext): void {
    this.logWithCallsite('debug', message, context)
  }

  info(message: string, context?: LogContext): void {
    this.logWithCallsite('info', message, context)
  }

  warn(message: string, context?: LogContext): void {
    this.logWithCallsite('warn', message, context)
  }

  error(message: string, context?: LogContext): void {
    this.logWithCallsite('error', message, context)
  }

  fatal(message: string, context?: LogContext): void {
    this.logWithCallsite('fatal', message, context)
  }

  withTag(tag: string): NodeLogger {
    return new NodeLoggerImpl(this.pinoLogger, tag, this.context)
  }

  withContext(context: LogContext): NodeLogger {
    const mergedContext = { ...this.context, ...context }
    return new NodeLoggerImpl(this.pinoLogger, this.tag, mergedContext)
  }
}

// Create default logger instance
const defaultNodeLogger = new NodeLoggerImpl(logger)

// Export convenience methods for different log levels with new unified signature
export const log = {
  trace: (message: string, context?: LogContext) =>
    defaultNodeLogger.trace(message, context),
  debug: (message: string, context?: LogContext) =>
    defaultNodeLogger.debug(message, context),
  info: (message: string, context?: LogContext) =>
    defaultNodeLogger.info(message, context),
  warn: (message: string, context?: LogContext) =>
    defaultNodeLogger.warn(message, context),
  error: (message: string, context?: LogContext) =>
    defaultNodeLogger.error(message, context),
  fatal: (message: string, context?: LogContext) =>
    defaultNodeLogger.fatal(message, context),
  withTag: (tag: string) => defaultNodeLogger.withTag(tag),
  withContext: (context: LogContext) => defaultNodeLogger.withContext(context),
}

// Export the logger as default
export default logger

/**
 * Create a logger instance with unified configuration
 * Works in both Node.js and browser environments
 */
export function createLogger(config: NodeLoggerConfig = {}): NodeLogger {
  const {
    level = 'info',
    prettyPrint = false,
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
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname',
        messageFormat: '{msg}',
      },
    }
  }

  const pinoLogger = pino(pinoConfig)
  let nodeLogger: NodeLogger = new NodeLoggerImpl(
    pinoLogger,
    undefined,
    globalContext,
  )

  // Apply tags if provided
  if (tags.length > 0) {
    const combinedTag = tags.join('.')
    nodeLogger = nodeLogger.withTag(combinedTag)
  }

  return nodeLogger
}
