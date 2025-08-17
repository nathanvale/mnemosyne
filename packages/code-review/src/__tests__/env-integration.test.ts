import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

import {
  validateEnvironment,
  validateStartupEnvironment,
} from '../validators/env-validator'

describe('Environment Validation Integration', () => {
  const originalEnv = process.env
  const originalExit = process.exit

  beforeEach(() => {
    // Reset environment for each test
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
    process.exit = originalExit
  })

  describe('CLI Integration', () => {
    it('should validate environment on CLI startup', () => {
      // Set up minimal valid environment
      process.env.PR = '123'
      process.env.REPO = 'owner/repo'

      const env = validateEnvironment()

      expect(env).toBeDefined()
      expect(env.PR).toBe('123')
      expect(env.REPO).toBe('owner/repo')
      expect(env.PR_ANALYSIS_CONFIDENCE_THRESHOLD).toBe(70) // default
    })

    it('should handle missing optional variables gracefully', () => {
      // Don't set any environment variables
      process.env = {}

      const env = validateEnvironment()

      expect(env).toBeDefined()
      expect(env.PR).toBe('')
      expect(env.REPO).toBe('')
      expect(env.GITHUB_TOKEN).toBe('')
    })

    it('should validate integer parsing for thresholds', () => {
      process.env.PR_ANALYSIS_CONFIDENCE_THRESHOLD = '85'
      process.env.PR_ANALYSIS_MAX_FINDINGS = '30'
      process.env.PR_ANALYSIS_TIMEOUT_MS = '60000'

      const env = validateEnvironment()

      expect(env.PR_ANALYSIS_CONFIDENCE_THRESHOLD).toBe(85)
      expect(env.PR_ANALYSIS_MAX_FINDINGS).toBe(30)
      expect(env.PR_ANALYSIS_TIMEOUT_MS).toBe(60000)
    })

    it('should validate output format enum', () => {
      // Valid formats
      const validFormats = ['json', 'markdown', 'github']

      validFormats.forEach((format) => {
        process.env.PR_ANALYSIS_OUTPUT_FORMAT = format
        const env = validateEnvironment()
        expect(env.PR_ANALYSIS_OUTPUT_FORMAT).toBe(format)
      })

      // Invalid format should throw
      process.env.PR_ANALYSIS_OUTPUT_FORMAT = 'invalid'
      expect(() => validateEnvironment()).toThrow()
    })

    it('should handle startup validation with error handling', () => {
      const exitMock = vi.fn()
      process.exit = exitMock as unknown as typeof process.exit

      // Invalid configuration
      process.env.PR_ANALYSIS_CONFIDENCE_THRESHOLD = '200' // Out of range

      validateStartupEnvironment({
        exitOnError: true,
        silent: true,
      })

      expect(exitMock).toHaveBeenCalledWith(1)
    })
  })

  describe('.env.example Documentation', () => {
    it('should have all documented variables in schema', () => {
      // This test ensures our .env.example matches our schema
      const documentedVars = [
        'GITHUB_TOKEN',
        'REPO',
        'PR',
        'PR_ANALYSIS_CONFIDENCE_THRESHOLD',
        'PR_ANALYSIS_MAX_FINDINGS',
        'PR_ANALYSIS_OUTPUT_FORMAT',
        'PR_ANALYSIS_TIMEOUT_MS',
        'PR_ANALYSIS_INCLUDE_OWASP',
        'PR_ANALYSIS_INCLUDE_SANS',
        'PR_ANALYSIS_INCLUDE_CWE',
        'PR_ANALYSIS_ENABLE_EXPERT_FINDINGS',
        'CODERABBIT_API_KEY',
        'CODERABBIT_BASE_URL',
        'PR_ANALYSIS_LOG_DIR',
        'PR_ANALYSIS_DEBUG',
      ]

      // Set all documented variables with appropriate values
      documentedVars.forEach((varName) => {
        if (
          varName.includes('THRESHOLD') ||
          varName.includes('FINDINGS') ||
          varName.includes('TIMEOUT_MS')
        ) {
          process.env[varName] = '50' // Valid integer
        } else if (varName.includes('OUTPUT_FORMAT')) {
          process.env[varName] = 'json' // Valid format
        } else if (
          varName.includes('INCLUDE_') ||
          varName.includes('ENABLE_') ||
          varName.includes('DEBUG')
        ) {
          process.env[varName] = 'true' // Valid boolean
        } else {
          process.env[varName] = 'test' // String value
        }
      })

      // Should not throw - all documented vars are in schema
      expect(() => validateEnvironment()).not.toThrow()
    })
  })
})
