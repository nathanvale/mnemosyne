/**
 * Logging utilities for the code-review package
 * Uses @studio/logger for structured logging with proper stdout/stderr separation
 */

import {
  createLogger as createStudioLogger,
  type NodeLogger,
  type LogContext,
} from '@studio/logger'

import type { ConsolidatedAnalysisOutput } from '../types/analysis.js'

/**
 * Create a structured logger instance for code-review components
 * - Progress/status messages go to stderr for agent compatibility
 * - Final JSON output goes to stdout for agent consumption
 * - Debug logging enabled via verbose option
 */
export function createLogger(
  component: string,
  options?: {
    verbose?: boolean
    prNumber?: number
    analysisId?: string
  },
): NodeLogger {
  const isDebugMode = options?.verbose === true

  // Create structured logger with component tag and code-review context
  return createStudioLogger({
    level: isDebugMode ? 'debug' : 'info',
    tags: ['code-review', component],
    globalContext: {
      component,
      process: 'code-review',
      ...(options?.prNumber && { prNumber: options.prNumber }),
      ...(options?.analysisId && { analysisId: options.analysisId }),
    },
  })
}

/**
 * Output the final consolidated JSON to stdout for agent consumption
 * This is the ONLY function that should write to stdout
 */
export function outputFinalJSON(analysis: ConsolidatedAnalysisOutput): void {
  // Output to stdout for agent consumption
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(analysis, null, 2))
}

/**
 * Log progress messages to stderr
 * Used for status updates that shouldn't interfere with JSON output
 */
export function logProgress(message: string): void {
  // Always log to stderr to keep stdout clean
  console.error(message)
}

/**
 * Log verbose debug information to stderr
 * Only outputs when debug mode is enabled via options
 */
export function logDebug(
  message: string,
  metadata?: Record<string, unknown>,
  verbose = false,
): void {
  if (verbose) {
    console.error(
      `[DEBUG] ${message}`,
      metadata ? JSON.stringify(metadata, null, 2) : '',
    )
  }
}

// Re-export types from @studio/logger for convenience
export type { NodeLogger, LogContext }
