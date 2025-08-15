/**
 * Logging utilities integrated with @studio/logger for structured debugging
 */

import {
  createLogger as createStudioLogger,
  type NodeLogger,
  type LogContext,
} from '@studio/logger'

// ANSI color codes for user-facing output (preserved for backward compatibility)
export const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[0;33m',
  blue: '\x1b[0;34m',
  cyan: '\x1b[0;36m',
  reset: '\x1b[0m',
} as const

// Legacy Logger interface for backward compatibility
export interface Logger {
  info: (msg: string) => void
  error: (msg: string) => void
  success: (msg: string) => void
  warning: (msg: string) => void
  debug: (msg: string) => void
}

/**
 * Create a structured logger instance for quality check components
 * Uses @studio/logger for structured debugging and console for user output
 */
export function createQualityLogger(component: string): {
  // Structured logger for internal debugging
  logger: NodeLogger
  // Legacy logger interface for backward compatibility
  legacy: Logger
} {
  // Create structured logger with component tag and quality-check context
  const structuredLogger = createStudioLogger({
    level: process.env.CLAUDE_HOOKS_DEBUG === 'true' ? 'debug' : 'info',
    tags: ['quality-check', component],
    globalContext: {
      component,
      process: 'quality-check',
    },
  })

  // Legacy logger for backward compatibility
  const legacyLogger: Logger = {
    info: (msg: string) =>
      console.error(`${colors.blue}[${component}]${colors.reset} ${msg}`),
    error: (msg: string) =>
      console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`),
    success: (msg: string) =>
      console.error(`${colors.green}[OK]${colors.reset} ${msg}`),
    warning: (msg: string) =>
      console.error(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
    debug: (msg: string) => {
      if (process.env.CLAUDE_HOOKS_DEBUG === 'true') {
        console.error(`${colors.cyan}[DEBUG]${colors.reset} ${msg}`)
      }
    },
  }

  return {
    logger: structuredLogger,
    legacy: legacyLogger,
  }
}

/**
 * Create a logger with optional debug mode (backward compatibility)
 * @deprecated Use createQualityLogger for new code
 */
export function createLogger(prefix: string, debug = false): Logger {
  return {
    info: (msg: string) =>
      console.error(`${colors.blue}[${prefix}]${colors.reset} ${msg}`),
    error: (msg: string) =>
      console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`),
    success: (msg: string) =>
      console.error(`${colors.green}[OK]${colors.reset} ${msg}`),
    warning: (msg: string) =>
      console.error(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
    debug: (msg: string) => {
      if (debug) {
        console.error(`${colors.cyan}[DEBUG]${colors.reset} ${msg}`)
      }
    },
  }
}

// Re-export types and utilities from @studio/logger for convenience
export type { NodeLogger, LogContext }
