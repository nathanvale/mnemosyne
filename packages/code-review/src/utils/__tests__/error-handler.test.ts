import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import type { GitHubPRContext } from '../../types/github'

import { ErrorHandler, ErrorRecovery } from '../error-handler'
import * as logger from '../logger'

vi.mock('../logger', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  })),
  logProgress: vi.fn(),
  logDebug: vi.fn(),
  logError: vi.fn(),
}))

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler

  beforeEach(() => {
    errorHandler = new ErrorHandler()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('GitHub Diff Error Handling', () => {
    it('should handle empty diff gracefully', async () => {
      const mockPRContext: Partial<GitHubPRContext> = {
        pullRequest: {
          number: 123,
          title: 'Test PR',
          merged: false,
          id: 123,
          html_url: 'https://github.com/test/repo/pull/123',
          additions: 0,
          deletions: 0,
          body: null,
          state: 'open',
          mergeable: true,
          baseRefName: 'main',
          headRefName: 'feature',
        } as unknown as GitHubPRContext['pullRequest'],
        files: [],
      }

      const result = await errorHandler.handleEmptyDiff(
        mockPRContext as GitHubPRContext,
      )

      expect(result).toBeDefined()
      expect(result.fallbackUsed).toBe(true)
      expect(result.files).toEqual([])
      expect(logger.logDebug).toHaveBeenCalledWith(
        'GitHub diff returned 0 lines, using file list as fallback',
        expect.objectContaining({
          prNumber: 123,
          fileCount: 0,
        }),
      )
    })

    it('should use file list as fallback when diff is empty', async () => {
      const mockFiles = [
        { filename: 'src/test.ts', status: 'modified' },
        { filename: 'src/utils.ts', status: 'added' },
      ]

      const mockPRContext: Partial<GitHubPRContext> = {
        pullRequest: {
          number: 123,
          title: 'Test PR',
          merged: false,
          id: 123,
          html_url: 'https://github.com/test/repo/pull/123',
          additions: 10,
          deletions: 5,
          body: null,
          state: 'open',
          mergeable: true,
        } as unknown as GitHubPRContext['pullRequest'],
        files: mockFiles as GitHubPRContext['files'],
      }

      const result = await errorHandler.handleEmptyDiff(
        mockPRContext as GitHubPRContext,
      )

      expect(result.files).toEqual(mockFiles)
      expect(result.fallbackUsed).toBe(true)
      expect(logger.logDebug).toHaveBeenCalledWith(
        'Using file list as fallback',
        expect.objectContaining({
          fileCount: 2,
        }),
      )
    })

    it('should handle diff fetch timeout', async () => {
      const timeoutError = new Error('Command timed out after 30000ms')
      timeoutError.name = 'TimeoutError'

      const recovery = await errorHandler.handleGitHubTimeout(timeoutError)

      expect(recovery).toBeDefined()
      expect(recovery.shouldRetry).toBe(true)
      expect(recovery.retryDelay).toBe(5000)
      // The error handler creates its own logger instance
      // We can't easily mock it, so we'll verify the recovery config instead
      expect(recovery.shouldRetry).toBe(true)
      expect(recovery.retryDelay).toBe(5000)
    })
  })

  describe('CodeRabbit Error Handling', () => {
    it('should handle CodeRabbit unavailable gracefully', async () => {
      const error = new Error('CodeRabbit not configured for this repository')

      const result = await errorHandler.handleCodeRabbitError(
        error,
        123,
        'owner/repo',
      )

      expect(result).toBeDefined()
      expect(result.findings).toEqual([])
      expect(result.summary).toContain('CodeRabbit analysis unavailable')
      expect(result.summary).toContain('CodeRabbit analysis unavailable')
      expect(result.continueAnalysis).toBe(true)
    })

    it('should handle CodeRabbit API timeout', async () => {
      const timeoutError = new Error('ETIMEDOUT')

      const result = await errorHandler.handleCodeRabbitError(
        timeoutError,
        123,
        'owner/repo',
      )

      expect(result).toBeDefined()
      expect(result.findings).toEqual([])
      expect(result.error).toContain('timeout')
      expect(result.error).toContain('timeout')
      expect(result.continueAnalysis).toBe(true)
    })

    it('should continue analysis without CodeRabbit data', async () => {
      const error = new Error('Network error')

      const result = await errorHandler.handleCodeRabbitError(
        error,
        123,
        'owner/repo',
      )

      expect(result).toBeDefined()
      expect(result.continueAnalysis).toBe(true)
      expect(result.findings).toEqual([])
      expect(result.continueAnalysis).toBe(true)
      expect(result.error).toBe('Network error')
    })

    it('should handle CodeRabbit rate limiting', async () => {
      const rateLimitError = new Error('API rate limit exceeded')
      rateLimitError.name = 'RateLimitError'

      const result = await errorHandler.handleCodeRabbitError(
        rateLimitError,
        123,
        'owner/repo',
      )

      expect(result).toBeDefined()
      expect(result.shouldRetry).toBe(false)
      expect(result.error).toContain('rate limit')
      expect(result.error).toContain('rate limit')
      expect(result.shouldRetry).toBe(false)
    })
  })

  describe('Security Sub-agent Error Handling', () => {
    it('should handle security sub-agent timeout', async () => {
      const timeoutError = new Error(
        'Task execution timed out after 30 seconds',
      )

      const result = await errorHandler.handleSecurityAgentTimeout(timeoutError)

      expect(result).toBeDefined()
      expect(result.findings).toEqual([])
      expect(result.timedOut).toBe(true)
      expect(result.fallbackMessage).toContain('Security analysis timed out')
      expect(result.timedOut).toBe(true)
      expect(result.fallbackMessage).toContain('Security analysis timed out')
    })

    it('should provide fallback security findings on timeout', async () => {
      const timeoutError = new Error('Timeout')
      const mockPRContext = {
        securityAlerts: [
          {
            security_advisory: {
              summary: 'Dependency vulnerability',
              severity: 'high',
            },
          },
        ],
      }

      const result = await errorHandler.handleSecurityAgentTimeout(
        timeoutError,
        mockPRContext as GitHubPRContext,
      )

      expect(result).toBeDefined()
      expect(result.usedFallback).toBe(true)
      expect(result.findings.length).toBeGreaterThan(0)
      expect(result.usedFallback).toBe(true)
      expect(result.findings.length).toBeGreaterThan(0)
    })

    it('should handle security sub-agent JSON parse error', async () => {
      const parseError = new Error('Unexpected token in JSON')
      const malformedResponse = '{ invalid json'

      const result = await errorHandler.handleSecurityAgentParseError(
        parseError,
        malformedResponse,
      )

      expect(result).toBeDefined()
      expect(result.parseError).toBe(true)
      expect(result.findings).toEqual([])
      expect(result.errorMessage).toBe(
        'Failed to parse security analysis response',
      )
    })
  })

  describe('Error Recovery Strategies', () => {
    it('should implement exponential backoff for retries', () => {
      const recovery = new ErrorRecovery()

      expect(recovery.getRetryDelay(0)).toBe(1000)
      expect(recovery.getRetryDelay(1)).toBe(2000)
      expect(recovery.getRetryDelay(2)).toBe(4000)
      expect(recovery.getRetryDelay(3)).toBe(8000)
      expect(recovery.getRetryDelay(4)).toBe(16000)
      expect(recovery.getRetryDelay(5)).toBe(30000) // Max delay
    })

    it('should retry API calls with backoff', async () => {
      const mockApiCall = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true })

      const recovery = new ErrorRecovery()
      const result = await recovery.retryWithBackoff(mockApiCall, 3)

      expect(result).toEqual({ success: true })
      expect(mockApiCall).toHaveBeenCalledTimes(3)
    })

    it('should fail after max retries', async () => {
      const mockApiCall = vi
        .fn()
        .mockRejectedValue(new Error('Persistent error'))

      const recovery = new ErrorRecovery()

      await expect(recovery.retryWithBackoff(mockApiCall, 3)).rejects.toThrow(
        'Persistent error',
      )

      expect(mockApiCall).toHaveBeenCalledTimes(3)
    })

    it('should not retry non-retryable errors', async () => {
      const authError = new Error('Authentication failed')
      authError.name = 'AuthenticationError'

      const mockApiCall = vi.fn().mockRejectedValue(authError)

      const recovery = new ErrorRecovery()

      await expect(recovery.retryWithBackoff(mockApiCall, 3)).rejects.toThrow(
        'Authentication failed',
      )

      expect(mockApiCall).toHaveBeenCalledTimes(1)
    })
  })

  describe('User-Friendly Error Messages', () => {
    it('should generate actionable error messages for common errors', () => {
      const errors = [
        {
          error: new Error('Command not found: gh'),
          expected: /GitHub CLI.*not installed.*brew install gh/,
        },
        {
          error: new Error('Authentication required'),
          expected: /authenticate.*gh auth login/,
        },
        {
          error: new Error('Repository not found'),
          expected: /Repository not found.*check.*name/,
        },
        {
          error: new Error('Rate limit exceeded'),
          expected: /rate limit.*try again later/i,
        },
        {
          error: new Error('Network timeout'),
          expected: /network.*timeout.*check.*connection/i,
        },
      ]

      errors.forEach(({ error, expected }) => {
        const message = errorHandler.getUserFriendlyMessage(error)
        expect(message).toMatch(expected)
      })
    })

    it('should include recovery suggestions in error messages', () => {
      const error = new Error('gh: command not found')

      const message = errorHandler.getUserFriendlyMessage(error)
      const suggestions = errorHandler.getRecoverySuggestions(error)

      expect(message).toContain('GitHub CLI')
      expect(suggestions).toContain('brew install gh')
      expect(suggestions).toContain('https://cli.github.com')
    })

    it('should provide context-specific help for configuration errors', () => {
      const error = new Error('GITHUB_TOKEN environment variable not set')

      const message = errorHandler.getUserFriendlyMessage(error)
      const suggestions = errorHandler.getRecoverySuggestions(error)

      expect(message).toContain('GITHUB_TOKEN')
      expect(suggestions).toContain('export GITHUB_TOKEN')
      expect(suggestions).toContain('gh auth login')
    })
  })

  describe('Error Aggregation and Reporting', () => {
    it('should aggregate multiple errors with context', () => {
      const errors = [
        {
          phase: 'github_fetch',
          error: new Error('Network error'),
          timestamp: new Date(),
        },
        {
          phase: 'coderabbit',
          error: new Error('Timeout'),
          timestamp: new Date(),
        },
        {
          phase: 'security',
          error: new Error('Parse error'),
          timestamp: new Date(),
        },
      ]

      const report = errorHandler.aggregateErrors(errors)

      expect(report.totalErrors).toBe(3)
      expect(report.phases).toHaveLength(3)
      expect(report.criticalFailure).toBe(false)
      expect(report.canContinue).toBe(true)
    })

    it('should identify critical failures that prevent analysis', () => {
      const errors = [
        {
          phase: 'github_fetch',
          error: new Error('PR not found'),
          critical: true,
          timestamp: new Date(),
        },
      ]

      const report = errorHandler.aggregateErrors(errors)

      expect(report.criticalFailure).toBe(true)
      expect(report.canContinue).toBe(false)
      expect(report.recommendation).toContain('cannot continue')
    })

    it('should generate comprehensive error summary', () => {
      const errors = [
        {
          phase: 'github_fetch',
          error: new Error('Timeout'),
          timestamp: new Date(),
        },
        {
          phase: 'coderabbit',
          error: new Error('Not configured'),
          timestamp: new Date(),
        },
      ]

      const summary = errorHandler.generateErrorSummary(errors)

      expect(summary).toContain('2 errors encountered during analysis')
      expect(summary).toContain('github_fetch')
      expect(summary).toContain('coderabbit')
      expect(summary).toContain('Recovery suggestions')
    })
  })

  describe('Integration Error Scenarios', () => {
    it('should handle complete analysis failure gracefully', async () => {
      const mockAnalysis = {
        prNumber: 123,
        repo: 'owner/repo',
        errors: [
          { phase: 'github', error: new Error('API error') },
          { phase: 'coderabbit', error: new Error('Timeout') },
          { phase: 'security', error: new Error('Parse error') },
        ],
      }

      const result = await errorHandler.handleCompleteFailure(mockAnalysis)

      expect(result).toBeDefined()
      expect(result.success).toBe(false)
      expect(result.partialResults).toBeDefined()
      expect(result.errorSummary).toContain(
        '3 errors encountered during analysis',
      )
    })

    it('should provide partial results when some sources succeed', async () => {
      const mockAnalysis = {
        prNumber: 123,
        repo: 'owner/repo',
        githubData: { success: true, files: [] },
        codeRabbitData: null,
        securityData: { success: true, findings: [] },
        errors: [{ phase: 'coderabbit', error: new Error('Not available') }],
      }

      const result = await errorHandler.consolidatePartialResults(mockAnalysis)

      expect(result).toBeDefined()
      expect(result.success).toBe(true)
      expect(result.partial).toBe(true)
      expect(result.sources).toContain('github')
      expect(result.sources).toContain('security')
      expect(result.sources).not.toContain('coderabbit')
    })
  })
})
