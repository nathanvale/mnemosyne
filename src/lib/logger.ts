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
 * import { log, createCliLogger } from '@/lib/logger'
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

// Create a CLI-friendly logger for scripts and development tools
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

// Export convenience methods for different log levels
export const log = {
  trace: (msg: string, ...args: Array<unknown>) => {
    const callsite = getCallSite(2) // Skip 2 frames: getCallSite and this trace function
    if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
      logger.trace({ ...args[0], callsite }, msg, ...args.slice(1))
    } else {
      logger.trace({ callsite }, msg, ...args)
    }
  },
  debug: (msg: string, ...args: Array<unknown>) => {
    const callsite = getCallSite(2) // Skip 2 frames: getCallSite and this debug function
    if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
      logger.debug({ ...args[0], callsite }, msg, ...args.slice(1))
    } else {
      logger.debug({ callsite }, msg, ...args)
    }
  },
  info: (msg: string, ...args: Array<unknown>) => {
    const callsite = getCallSite(2) // Skip 2 frames: getCallSite and this info function
    if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
      logger.info({ ...args[0], callsite }, msg, ...args.slice(1))
    } else {
      logger.info({ callsite }, msg, ...args)
    }
  },
  warn: (msg: string, ...args: Array<unknown>) => {
    const callsite = getCallSite(2) // Skip 2 frames: getCallSite and this warn function
    if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
      logger.warn({ ...args[0], callsite }, msg, ...args.slice(1))
    } else {
      logger.warn({ callsite }, msg, ...args)
    }
  },
  error: (msg: string, ...args: Array<unknown>) => {
    const callsite = getCallSite(2) // Skip 2 frames: getCallSite and this error function
    if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
      logger.error({ ...args[0], callsite }, msg, ...args.slice(1))
    } else {
      logger.error({ callsite }, msg, ...args)
    }
  },
  fatal: (msg: string, ...args: Array<unknown>) => {
    const callsite = getCallSite(2) // Skip 2 frames: getCallSite and this fatal function
    if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null) {
      logger.fatal({ ...args[0], callsite }, msg, ...args.slice(1))
    } else {
      logger.fatal({ callsite }, msg, ...args)
    }
  },
}

// Export the logger as default
export default logger
