import { describe, it, expect, beforeEach, vi } from 'vitest'

import {
  calculateComplexityScore,
  createConfigFromArgs,
  DEFAULT_CONFIG,
  loadConfigFromEnv,
  mergeConfig,
  SENSITIVITY_CONFIGS,
  shouldEscalateError,
  validateConfig,
} from '../sub-agent-config'

describe('SubAgentConfig', () => {
  beforeEach(() => {
    // Clear all environment variables
    vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_ENABLED', undefined)
    vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_SENSITIVITY', undefined)
    vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_MAX_ESCALATION_RATE', undefined)
    vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_MONTHLY_COST_LIMIT', undefined)
    vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_DAILY_LIMIT', undefined)
    vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_TIMEOUT', undefined)
    vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_MAX_FAILURES', undefined)
    vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_COOLDOWN', undefined)
    vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_DEBUG', undefined)
  })

  describe('DEFAULT_CONFIG', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_CONFIG.enabled).toBe(true)
      expect(DEFAULT_CONFIG.escalationSensitivity).toBe('conservative')
      expect(DEFAULT_CONFIG.maxEscalationRate).toBe(0.15)
      expect(DEFAULT_CONFIG.monthlyCostLimit).toBe(10)
      expect(DEFAULT_CONFIG.dailyInvocationLimit).toBe(100)
      expect(DEFAULT_CONFIG.timeout).toBe(30000)
      expect(DEFAULT_CONFIG.circuitBreaker.maxFailures).toBe(3)
      expect(DEFAULT_CONFIG.circuitBreaker.cooldownPeriod).toBe(60000)
    })
  })

  describe('SENSITIVITY_CONFIGS', () => {
    it('should define appropriate complexity scores for each level', () => {
      expect(SENSITIVITY_CONFIGS.conservative.minComplexityScore).toBe(70)
      expect(SENSITIVITY_CONFIGS.conservative.targetEscalationRate).toBe(0.125)

      expect(SENSITIVITY_CONFIGS.balanced.minComplexityScore).toBe(50)
      expect(SENSITIVITY_CONFIGS.balanced.targetEscalationRate).toBe(0.2)

      expect(SENSITIVITY_CONFIGS.aggressive.minComplexityScore).toBe(30)
      expect(SENSITIVITY_CONFIGS.aggressive.targetEscalationRate).toBe(0.325)
    })
  })

  describe('loadConfigFromEnv', () => {
    it('should load enabled state from env', () => {
      vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_ENABLED', 'true')
      const config = loadConfigFromEnv()
      expect(config.enabled).toBe(true)

      vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_ENABLED', 'false')
      const config2 = loadConfigFromEnv()
      expect(config2.enabled).toBe(false)
    })

    it('should load sensitivity from env', () => {
      vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_SENSITIVITY', 'aggressive')
      const config = loadConfigFromEnv()
      expect(config.escalationSensitivity).toBe('aggressive')
    })

    it('should ignore invalid sensitivity values', () => {
      vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_SENSITIVITY', 'invalid')
      const config = loadConfigFromEnv()
      expect(config.escalationSensitivity).toBeUndefined()
    })

    it('should load escalation rate from env', () => {
      vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_MAX_ESCALATION_RATE', '0.25')
      const config = loadConfigFromEnv()
      expect(config.maxEscalationRate).toBe(0.25)
    })

    it('should ignore invalid escalation rates', () => {
      vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_MAX_ESCALATION_RATE', '1.5')
      const config = loadConfigFromEnv()
      expect(config.maxEscalationRate).toBeUndefined()

      vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_MAX_ESCALATION_RATE', 'invalid')
      const config2 = loadConfigFromEnv()
      expect(config2.maxEscalationRate).toBeUndefined()
    })

    it('should load cost and invocation limits', () => {
      vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_MONTHLY_COST_LIMIT', '25.50')
      vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_DAILY_LIMIT', '200')
      const config = loadConfigFromEnv()
      expect(config.monthlyCostLimit).toBe(25.5)
      expect(config.dailyInvocationLimit).toBe(200)
    })

    it('should load timeout from env', () => {
      vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_TIMEOUT', '45000')
      const config = loadConfigFromEnv()
      expect(config.timeout).toBe(45000)
    })

    it('should load circuit breaker settings', () => {
      vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_MAX_FAILURES', '5')
      vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_COOLDOWN', '120000')
      const config = loadConfigFromEnv()
      expect(config.circuitBreaker?.maxFailures).toBe(5)
      expect(config.circuitBreaker?.cooldownPeriod).toBe(120000)
    })

    it('should load debug flag from env', () => {
      vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_DEBUG', 'true')
      const config = loadConfigFromEnv()
      expect(config.debug).toBe(true)

      vi.stubEnv('CLAUDE_HOOKS_SUBAGENT_DEBUG', 'false')
      const config2 = loadConfigFromEnv()
      expect(config2.debug).toBe(false)
    })
  })

  describe('mergeConfig', () => {
    it('should merge multiple configs with proper precedence', () => {
      const config1 = { enabled: false, timeout: 10000 }
      const config2 = { escalationSensitivity: 'balanced' as const }
      const config3 = { timeout: 20000, debug: true }

      const merged = mergeConfig(config1, config2, config3)

      expect(merged.enabled).toBe(false) // from config1
      expect(merged.escalationSensitivity).toBe('balanced') // from config2
      expect(merged.timeout).toBe(20000) // overridden by config3
      expect(merged.debug).toBe(true) // from config3
      expect(merged.maxEscalationRate).toBe(0.15) // default
    })

    it('should merge circuit breaker settings properly', () => {
      const config1 = {
        circuitBreaker: { maxFailures: 5, cooldownPeriod: 30000 },
      }
      const config2 = {
        circuitBreaker: { maxFailures: 10, cooldownPeriod: 30000 },
      }

      const merged = mergeConfig(config1, config2)

      expect(merged.circuitBreaker.maxFailures).toBe(10)
      expect(merged.circuitBreaker.cooldownPeriod).toBe(30000)
    })

    it('should apply sensitivity level overrides', () => {
      const config = { escalationSensitivity: 'aggressive' as const }
      const merged = mergeConfig(config)

      // Should use aggressive's default minComplexityScore
      expect(merged.minComplexityScore).toBe(30)
    })

    it('should not override explicit minComplexityScore', () => {
      const config = {
        escalationSensitivity: 'aggressive' as const,
        minComplexityScore: 60,
      }
      const merged = mergeConfig(config)

      // Should keep explicit value
      expect(merged.minComplexityScore).toBe(60)
    })
  })

  describe('validateConfig', () => {
    it('should return no errors for valid config', () => {
      const errors = validateConfig(DEFAULT_CONFIG)
      expect(errors).toHaveLength(0)
    })

    it('should validate escalation rate bounds', () => {
      const config = { ...DEFAULT_CONFIG, maxEscalationRate: 1.5 }
      const errors = validateConfig(config)
      expect(errors).toContain('maxEscalationRate must be between 0 and 1')
    })

    it('should validate positive cost limit', () => {
      const config = { ...DEFAULT_CONFIG, monthlyCostLimit: -10 }
      const errors = validateConfig(config)
      expect(errors).toContain('monthlyCostLimit must be positive')
    })

    it('should validate complexity score bounds', () => {
      const config = { ...DEFAULT_CONFIG, minComplexityScore: 150 }
      const errors = validateConfig(config)
      expect(errors).toContain('minComplexityScore must be between 0 and 100')
    })

    it('should validate regex patterns', () => {
      const config = {
        ...DEFAULT_CONFIG,
        alwaysEscalatePatterns: ['[invalid regex'],
      }
      const errors = validateConfig(config)
      expect(errors.some((e) => e.includes('Invalid regex pattern'))).toBe(true)
    })
  })

  describe('calculateComplexityScore', () => {
    it('should score generic errors highly', () => {
      const error = "Type 'T' does not satisfy the constraint 'generic<U>'"
      const score = calculateComplexityScore(error)
      expect(score).toBeGreaterThanOrEqual(55) // generic + constraint
    })

    it('should score simple errors lower', () => {
      const error = "Cannot find module 'fs'"
      const score = calculateComplexityScore(error)
      expect(score).toBeLessThan(30)
    })

    it('should consider error length', () => {
      const shortError = 'Type error'
      const longError = `Type error: ${'x'.repeat(600)}`

      const shortScore = calculateComplexityScore(shortError)
      const longScore = calculateComplexityScore(longError)

      expect(longScore).toBeGreaterThan(shortScore)
    })

    it('should cap score at 100', () => {
      const complexError = `Generic constraint with Promise<infer T extends keyof typeof interface> doesn't match ${'x'.repeat(600)}`
      const score = calculateComplexityScore(complexError)
      expect(score).toBe(100)
    })
  })

  describe('shouldEscalateError', () => {
    const baseConfig = { ...DEFAULT_CONFIG }

    it('should not escalate when disabled', () => {
      const config = { ...baseConfig, enabled: false }
      const result = shouldEscalateError('Complex error', config, 0)
      expect(result).toBe(false)
    })

    it('should respect never escalate patterns', () => {
      const config = {
        ...baseConfig,
        neverEscalatePatterns: ['node_modules', 'dist/'],
      }
      const result = shouldEscalateError(
        'Error in node_modules/package',
        config,
        0,
      )
      expect(result).toBe(false)
    })

    it('should respect always escalate patterns', () => {
      const config = {
        ...baseConfig,
        alwaysEscalatePatterns: ['critical', 'emergency'],
        minComplexityScore: 100, // Would normally not escalate
      }
      const result = shouldEscalateError('critical: type error', config, 0)
      expect(result).toBe(true)
    })

    it('should respect escalation rate limit', () => {
      const config = { ...baseConfig, maxEscalationRate: 0.1 }
      const result = shouldEscalateError('Complex generic error', config, 0.15)
      expect(result).toBe(false)
    })

    it('should check complexity score', () => {
      const config = { ...baseConfig, minComplexityScore: 50 }

      const simpleError = 'Simple error'
      const complexError =
        'Complex generic<T extends keyof typeof interface> constraint error'

      expect(shouldEscalateError(simpleError, config, 0)).toBe(false)
      expect(shouldEscalateError(complexError, config, 0)).toBe(true)
    })
  })

  describe('createConfigFromArgs', () => {
    it('should parse enabled flag', () => {
      const args = ['--subagent-enabled', 'false']
      const config = createConfigFromArgs(args)
      expect(config.enabled).toBe(false)
    })

    it('should parse sensitivity level', () => {
      const args = ['--subagent-sensitivity', 'balanced']
      const config = createConfigFromArgs(args)
      expect(config.escalationSensitivity).toBe('balanced')
    })

    it('should parse numeric values', () => {
      const args = [
        '--subagent-max-rate',
        '0.25',
        '--subagent-cost-limit',
        '15.50',
        '--subagent-daily-limit',
        '150',
        '--subagent-timeout',
        '45000',
      ]
      const config = createConfigFromArgs(args)
      expect(config.maxEscalationRate).toBe(0.25)
      expect(config.monthlyCostLimit).toBe(15.5)
      expect(config.dailyInvocationLimit).toBe(150)
      expect(config.timeout).toBe(45000)
    })

    it('should parse debug flag', () => {
      const args = ['--subagent-debug']
      const config = createConfigFromArgs(args)
      expect(config.debug).toBe(true)
    })

    it('should ignore invalid arguments', () => {
      const args = [
        '--unknown-flag',
        'value',
        '--subagent-sensitivity',
        'invalid',
      ]
      const config = createConfigFromArgs(args)
      expect(config.escalationSensitivity).toBeUndefined()
    })
  })
})
