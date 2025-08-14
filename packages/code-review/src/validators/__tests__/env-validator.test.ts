import { describe, it, expect, beforeEach, vi } from 'vitest'

import {
  validateEnvironment,
  validateStartupEnvironment,
  getEnvVar,
  createTestEnvironment,
  prAnalysisEnvSchema,
} from '../env-validator.js'

describe('Environment Validator', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset environment for each test
    process.env = { ...originalEnv }
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('validateEnvironment', () => {
    it('should validate environment with all required variables', () => {
      process.env = {
        ...process.env,
        GITHUB_TOKEN: 'ghp_test123',
        REPO: 'owner/repo',
        PR: '42',
        PR_ANALYSIS_CONFIDENCE_THRESHOLD: '85',
        PR_ANALYSIS_MAX_FINDINGS: '30',
        PR_ANALYSIS_OUTPUT_FORMAT: 'json',
        PR_ANALYSIS_TIMEOUT_MS: '60000',
      }

      const env = validateEnvironment()

      expect(env.GITHUB_TOKEN).toBe('ghp_test123')
      expect(env.REPO).toBe('owner/repo')
      expect(env.PR).toBe('42')
      expect(env.PR_ANALYSIS_CONFIDENCE_THRESHOLD).toBe(85)
      expect(env.PR_ANALYSIS_MAX_FINDINGS).toBe(30)
      expect(env.PR_ANALYSIS_OUTPUT_FORMAT).toBe('json')
      expect(env.PR_ANALYSIS_TIMEOUT_MS).toBe(60000)
    })

    it('should use default values when optional variables are not provided', () => {
      process.env = {}

      const env = validateEnvironment()

      expect(env.GITHUB_TOKEN).toBe('')
      expect(env.REPO).toBe('')
      expect(env.PR).toBe('')
      expect(env.PR_ANALYSIS_CONFIDENCE_THRESHOLD).toBe(70)
      expect(env.PR_ANALYSIS_MAX_FINDINGS).toBe(20)
      expect(env.PR_ANALYSIS_OUTPUT_FORMAT).toBe('github')
      expect(env.PR_ANALYSIS_TIMEOUT_MS).toBe(120000)
      expect(env.PR_ANALYSIS_INCLUDE_OWASP).toBe(true)
      expect(env.PR_ANALYSIS_INCLUDE_SANS).toBe(true)
      expect(env.PR_ANALYSIS_INCLUDE_CWE).toBe(true)
      expect(env.PR_ANALYSIS_ENABLE_EXPERT_FINDINGS).toBe(true)
      expect(env.PR_ANALYSIS_DEBUG).toBe(false)
    })

    it('should parse boolean environment variables correctly', () => {
      // Test 'false' string
      process.env.PR_ANALYSIS_INCLUDE_OWASP = 'false'
      process.env.PR_ANALYSIS_DEBUG = 'false'
      let env = validateEnvironment()
      expect(env.PR_ANALYSIS_INCLUDE_OWASP).toBe(false)
      expect(env.PR_ANALYSIS_DEBUG).toBe(false)

      // Test '0' string
      process.env.PR_ANALYSIS_INCLUDE_SANS = '0'
      env = validateEnvironment()
      expect(env.PR_ANALYSIS_INCLUDE_SANS).toBe(false)

      // Test any other string as true
      process.env.PR_ANALYSIS_INCLUDE_CWE = 'yes'
      process.env.PR_ANALYSIS_ENABLE_EXPERT_FINDINGS = '1'
      env = validateEnvironment()
      expect(env.PR_ANALYSIS_INCLUDE_CWE).toBe(true)
      expect(env.PR_ANALYSIS_ENABLE_EXPERT_FINDINGS).toBe(true)
    })

    it('should throw error for invalid integer values', () => {
      process.env.PR_ANALYSIS_MAX_FINDINGS = 'not-a-number'

      expect(() => validateEnvironment()).toThrow(
        'Invalid integer value: not-a-number',
      )
    })

    it('should throw error for confidence threshold out of range', () => {
      process.env.PR_ANALYSIS_CONFIDENCE_THRESHOLD = '150'

      expect(() => validateEnvironment()).toThrow(
        'Confidence threshold must be between 0 and 100',
      )
    })

    it('should throw error for negative max findings', () => {
      process.env.PR_ANALYSIS_MAX_FINDINGS = '-5'

      expect(() => validateEnvironment()).toThrow(
        'Max findings must be greater than 0',
      )
    })

    it('should throw error for invalid output format', () => {
      process.env.PR_ANALYSIS_OUTPUT_FORMAT = 'invalid'

      expect(() => validateEnvironment()).toThrow()
    })
  })

  describe('validateStartupEnvironment', () => {
    it('should return validated environment on success', () => {
      process.env.PR_ANALYSIS_CONFIDENCE_THRESHOLD = '80'

      const env = validateStartupEnvironment({ silent: true })

      expect(env).not.toBeNull()
      expect(env?.PR_ANALYSIS_CONFIDENCE_THRESHOLD).toBe(80)
    })

    it('should exit process on error when exitOnError is true', () => {
      process.env.PR_ANALYSIS_CONFIDENCE_THRESHOLD = 'invalid'
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called')
      })

      expect(() =>
        validateStartupEnvironment({ exitOnError: true, silent: true }),
      ).toThrow('process.exit called')

      expect(exitSpy).toHaveBeenCalledWith(1)
    })

    it('should return null on error when exitOnError is false', () => {
      process.env.PR_ANALYSIS_CONFIDENCE_THRESHOLD = 'invalid'

      const env = validateStartupEnvironment({
        exitOnError: false,
        silent: true,
      })

      expect(env).toBeNull()
    })

    it('should log error messages when not silent', () => {
      process.env.PR_ANALYSIS_CONFIDENCE_THRESHOLD = 'invalid'
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      validateStartupEnvironment({ exitOnError: false, silent: false })

      expect(errorSpy).toHaveBeenCalledWith('❌ Environment Validation Error:')
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid integer value'),
      )
    })
  })

  describe('getEnvVar', () => {
    it('should return typed environment variable value', () => {
      process.env.PR_ANALYSIS_CONFIDENCE_THRESHOLD = '90'
      process.env.GITHUB_TOKEN = 'ghp_secret'

      expect(getEnvVar('PR_ANALYSIS_CONFIDENCE_THRESHOLD')).toBe(90)
      expect(getEnvVar('GITHUB_TOKEN')).toBe('ghp_secret')
    })

    it('should return undefined on validation error', () => {
      process.env.PR_ANALYSIS_CONFIDENCE_THRESHOLD = 'invalid'

      expect(getEnvVar('PR_ANALYSIS_CONFIDENCE_THRESHOLD')).toBeUndefined()
    })
  })

  describe('createTestEnvironment', () => {
    it('should create test environment with defaults', () => {
      const env = createTestEnvironment()

      expect(env.GITHUB_TOKEN).toBe('')
      expect(env.REPO).toBe('test/repo')
      expect(env.PR).toBe('1')
      expect(env.PR_ANALYSIS_CONFIDENCE_THRESHOLD).toBe(70)
      expect(env.PR_ANALYSIS_MAX_FINDINGS).toBe(20)
      expect(env.PR_ANALYSIS_OUTPUT_FORMAT).toBe('json')
      expect(env.PR_ANALYSIS_LOG_DIR).toBe('.logs/test')
    })

    it('should allow overriding defaults', () => {
      const env = createTestEnvironment({
        GITHUB_TOKEN: 'test-token',
        PR_ANALYSIS_CONFIDENCE_THRESHOLD: 95,
        PR_ANALYSIS_DEBUG: true,
      })

      expect(env.GITHUB_TOKEN).toBe('test-token')
      expect(env.PR_ANALYSIS_CONFIDENCE_THRESHOLD).toBe(95)
      expect(env.PR_ANALYSIS_DEBUG).toBe(true)
      // Other values should still have defaults
      expect(env.REPO).toBe('test/repo')
      expect(env.PR_ANALYSIS_MAX_FINDINGS).toBe(20)
    })
  })

  describe('prAnalysisEnvSchema', () => {
    it('should parse valid environment object', () => {
      const input = {
        GITHUB_TOKEN: 'token',
        PR_ANALYSIS_CONFIDENCE_THRESHOLD: '75',
        PR_ANALYSIS_OUTPUT_FORMAT: 'markdown',
      }

      const result = prAnalysisEnvSchema.parse(input)

      expect(result.GITHUB_TOKEN).toBe('token')
      expect(result.PR_ANALYSIS_CONFIDENCE_THRESHOLD).toBe(75)
      expect(result.PR_ANALYSIS_OUTPUT_FORMAT).toBe('markdown')
    })

    it('should handle edge cases for boolean parsing', () => {
      const testCases = [
        { input: 'false', expected: false },
        { input: '0', expected: false },
        { input: 'true', expected: true },
        { input: '1', expected: true },
        { input: 'yes', expected: true },
        { input: '', expected: true }, // Empty string defaults to true
        { input: undefined, expected: true }, // Undefined defaults to true
      ]

      testCases.forEach(({ input, expected }) => {
        const result = prAnalysisEnvSchema.parse({
          PR_ANALYSIS_INCLUDE_OWASP: input,
        })
        expect(result.PR_ANALYSIS_INCLUDE_OWASP).toBe(expected)
      })
    })
  })
})
