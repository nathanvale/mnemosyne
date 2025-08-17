/**
 * Error Handler for Code Review Package
 * Provides comprehensive error handling, recovery strategies, and user-friendly messages
 */

import type { GitHubPRContext, GitHubFileChange } from '../types/github'

import { createLogger, logDebug } from './logger'

const logger = createLogger('ErrorHandler')

/**
 * Error recovery configuration
 */
interface RecoveryConfig {
  shouldRetry: boolean
  retryDelay: number
  fallbackUsed: boolean
  continueAnalysis: boolean
}

/**
 * Error context for analysis phases
 */
interface ErrorContext {
  phase: string
  error: Error
  timestamp: Date
  critical?: boolean
}

/**
 * Aggregated error report
 */
interface ErrorReport {
  totalErrors: number
  phases: string[]
  criticalFailure: boolean
  canContinue: boolean
  recommendation?: string
}

/**
 * Main error handler class
 */
export class ErrorHandler {
  private readonly logger = logger

  /**
   * Handle empty GitHub diff scenario
   */
  async handleEmptyDiff(prContext: GitHubPRContext): Promise<{
    fallbackUsed: boolean
    files: GitHubFileChange[]
    message?: string
  }> {
    logDebug('GitHub diff returned 0 lines, using file list as fallback', {
      prNumber: prContext.pullRequest?.number,
      fileCount: prContext.files?.length || 0,
    })

    if (prContext.files && prContext.files.length > 0) {
      logDebug('Using file list as fallback', {
        fileCount: prContext.files.length,
      })
      return {
        fallbackUsed: true,
        files: prContext.files,
        message: 'Using file list without diff data',
      }
    }

    return {
      fallbackUsed: true,
      files: [],
      message: 'No files changed in PR',
    }
  }

  /**
   * Handle GitHub API timeout
   */
  async handleGitHubTimeout(error: Error): Promise<RecoveryConfig> {
    const timeoutMatch = error.message.match(/(\d+)ms/)
    const timeout = timeoutMatch ? parseInt(timeoutMatch[1]) : 30000

    logger.error('GitHub API timeout occurred', {
      timeout,
      error: error.message,
    })

    return {
      shouldRetry: true,
      retryDelay: 5000,
      fallbackUsed: false,
      continueAnalysis: false,
    }
  }

  /**
   * Handle CodeRabbit errors gracefully
   */
  async handleCodeRabbitError(
    error: Error,
    prNumber: number,
    repo: string,
  ): Promise<{
    findings: unknown[]
    summary: string
    error?: string
    shouldRetry?: boolean
    continueAnalysis: boolean
  }> {
    const errorMessage = error.message.toLowerCase()

    // Handle specific error types
    if (
      errorMessage.includes('not configured') ||
      errorMessage.includes('not available')
    ) {
      logDebug('CodeRabbit not available for this repository', {
        prNumber,
        repo,
      })
      return {
        findings: [],
        summary: 'CodeRabbit analysis unavailable',
        continueAnalysis: true,
      }
    }

    if (
      errorMessage.includes('etimedout') ||
      errorMessage.includes('timeout')
    ) {
      logDebug('CodeRabbit API timeout', {
        prNumber,
        repo,
        error: error.message,
      })
      return {
        findings: [],
        summary: 'CodeRabbit analysis timed out',
        error: 'timeout',
        continueAnalysis: true,
      }
    }

    if (errorMessage.includes('rate limit')) {
      logDebug('CodeRabbit rate limit exceeded', {
        prNumber,
        repo,
      })
      return {
        findings: [],
        summary: 'CodeRabbit rate limit exceeded',
        error: 'rate limit',
        shouldRetry: false,
        continueAnalysis: true,
      }
    }

    // Default fallback
    logDebug('Continuing without CodeRabbit data due to error', {
      prNumber,
      repo,
      error: error.message,
    })

    return {
      findings: [],
      summary: 'CodeRabbit analysis failed',
      error: error.message,
      continueAnalysis: true,
    }
  }

  /**
   * Handle security sub-agent timeout
   */
  async handleSecurityAgentTimeout(
    error: Error,
    prContext?: GitHubPRContext,
  ): Promise<{
    findings: unknown[]
    timedOut: boolean
    fallbackMessage: string
    usedFallback?: boolean
  }> {
    logger.error('Security sub-agent timeout', {
      timeout: 30000,
      error: error.message,
    })

    // Try to use GitHub security alerts as fallback
    if (prContext?.securityAlerts && prContext.securityAlerts.length > 0) {
      logDebug('Using GitHub security alerts as fallback')

      interface SecurityAlert {
        security_advisory?: {
          cve_id?: string | null
          summary?: string
          severity?: string
        }
      }
      const findings = prContext.securityAlerts.map((alert) => {
        const typedAlert = alert as SecurityAlert
        return {
          id: `github-security-${typedAlert.security_advisory?.cve_id || Math.random()}`,
          title: typedAlert.security_advisory?.summary || 'Security Alert',
          severity: typedAlert.security_advisory?.severity || 'medium',
          source: 'github-security-alerts',
        }
      })

      return {
        findings,
        timedOut: true,
        fallbackMessage: 'Security analysis timed out, using GitHub alerts',
        usedFallback: true,
      }
    }

    return {
      findings: [],
      timedOut: true,
      fallbackMessage: 'Security analysis timed out',
      usedFallback: false,
    }
  }

  /**
   * Handle security sub-agent parse error
   */
  async handleSecurityAgentParseError(
    error: Error,
    response: string,
  ): Promise<{
    findings: unknown[]
    parseError: boolean
    errorMessage: string
  }> {
    const preview = response.substring(0, 100)

    logger.error('Failed to parse security sub-agent response', {
      error: error.message,
      responsePreview: preview,
    })

    return {
      findings: [],
      parseError: true,
      errorMessage: 'Failed to parse security analysis response',
    }
  }

  /**
   * Generate user-friendly error message
   */
  getUserFriendlyMessage(error: Error): string {
    const message = error.message.toLowerCase()

    if (message.includes('command not found') || message.includes('gh')) {
      return 'GitHub CLI (gh) is not installed. Please install it using: brew install gh or visit https://cli.github.com'
    }

    if (message.includes('authentication')) {
      return 'GitHub authentication required. Please authenticate using: gh auth login'
    }

    if (message.includes('repository not found')) {
      return 'Repository not found. Please check the repository name and your access permissions.'
    }

    if (message.includes('rate limit')) {
      return 'API rate limit exceeded. Please try again later or authenticate to increase your rate limit.'
    }

    if (message.includes('timeout')) {
      return 'Network request timeout. Please check your internet connection and try again.'
    }

    return `Error: ${error.message}`
  }

  /**
   * Get recovery suggestions for an error
   */
  getRecoverySuggestions(error: Error): string {
    const message = error.message.toLowerCase()
    const suggestions: string[] = []

    if (message.includes('gh') || message.includes('command not found')) {
      suggestions.push('brew install gh')
      suggestions.push(
        'Visit https://cli.github.com for installation instructions',
      )
    }

    if (message.includes('token') || message.includes('authentication')) {
      suggestions.push('export GITHUB_TOKEN=your-token-here')
      suggestions.push('gh auth login')
    }

    if (message.includes('rate limit')) {
      suggestions.push('Wait for rate limit reset')
      suggestions.push('Authenticate to increase rate limit')
    }

    return suggestions.join('\n')
  }

  /**
   * Aggregate multiple errors with context
   */
  aggregateErrors(errors: ErrorContext[]): ErrorReport {
    const phases = [...new Set(errors.map((e) => e.phase))]
    const criticalFailure = errors.some((e) => e.critical === true)

    return {
      totalErrors: errors.length,
      phases,
      criticalFailure,
      canContinue: !criticalFailure,
      recommendation: criticalFailure
        ? 'Analysis cannot continue due to critical errors'
        : 'Analysis can continue with partial results',
    }
  }

  /**
   * Generate comprehensive error summary
   */
  generateErrorSummary(errors: ErrorContext[]): string {
    const lines = [`${errors.length} errors encountered during analysis:`, '']

    errors.forEach(({ phase, error }) => {
      lines.push(`- ${phase}: ${error.message}`)
    })

    lines.push('')
    lines.push('Recovery suggestions:')
    errors.forEach(({ error }) => {
      const suggestions = this.getRecoverySuggestions(error)
      if (suggestions) {
        lines.push(suggestions)
      }
    })

    return lines.join('\n')
  }

  /**
   * Handle complete analysis failure
   */
  async handleCompleteFailure(analysis: unknown): Promise<{
    success: boolean
    partialResults: Record<string, unknown>
    errorSummary: string
  }> {
    const analysisData = analysis as {
      errors?: ErrorContext[]
      prNumber?: number
    }
    logger.error('Analysis failed with multiple errors', {
      errorCount: analysisData.errors?.length || 0,
      prNumber: analysisData.prNumber,
    })

    const errorSummary = this.generateErrorSummary(analysisData.errors || [])

    return {
      success: false,
      partialResults: {},
      errorSummary,
    }
  }

  /**
   * Consolidate partial results when some sources fail
   */
  async consolidatePartialResults(analysis: unknown): Promise<{
    success: boolean
    partial: boolean
    sources: string[]
    results: Record<string, unknown>
  }> {
    const sources: string[] = []
    const results: Record<string, unknown> = {}

    const analysisData = analysis as {
      githubData?: { success: boolean }
      securityData?: { success: boolean }
      codeRabbitData?: unknown
    }

    if (analysisData.githubData?.success) {
      sources.push('github')
      results.github = analysisData.githubData
    }

    if (analysisData.securityData?.success) {
      sources.push('security')
      results.security = analysisData.securityData
    }

    if (analysisData.codeRabbitData) {
      sources.push('coderabbit')
      results.coderabbit = analysisData.codeRabbitData
    }

    return {
      success: true,
      partial: true,
      sources,
      results,
    }
  }
}

/**
 * Error recovery with exponential backoff
 */
export class ErrorRecovery {
  private readonly maxDelay = 30000 // 30 seconds
  private readonly baseDelay = 1000 // 1 second

  /**
   * Calculate retry delay with exponential backoff
   */
  getRetryDelay(attempt: number): number {
    const delay = Math.min(this.baseDelay * Math.pow(2, attempt), this.maxDelay)
    return delay
  }

  /**
   * Retry an operation with exponential backoff
   */
  async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number,
  ): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        // Don't retry authentication errors
        if (lastError.name === 'AuthenticationError') {
          throw lastError
        }

        // Wait before retrying (except on last attempt)
        if (attempt < maxRetries - 1) {
          const delay = this.getRetryDelay(attempt)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }
}

// Export a function that matches what logger exports
export function logError(
  message: string,
  context?: Record<string, unknown>,
): void {
  logger.error(message, context)
}

/**
 * Log an error with user-friendly message and recovery suggestions
 */
export function logUserFriendlyError(error: Error): void {
  const errorHandler = new ErrorHandler()
  const userMessage = errorHandler.getUserFriendlyMessage(error)
  const suggestions = errorHandler.getRecoverySuggestions(error)

  logger.error(userMessage, {
    originalError: error.message,
    errorName: error.name,
    stack: error.stack,
  })

  if (suggestions) {
    logger.info('Recovery suggestions:', { suggestions })
  }
}
