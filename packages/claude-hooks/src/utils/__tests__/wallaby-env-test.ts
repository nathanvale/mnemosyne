import { describe, it, expect } from 'vitest'

/**
 * Test to verify Wallaby.js environment setup
 * This should pass in both Wallaby.js and regular Vitest
 */
describe('Wallaby Environment Setup', () => {
  it('should have NODE_ENV set to test', () => {
    expect(process.env.NODE_ENV).toBe('test')
  })

  it('should detect test mode in Wallaby', () => {
    // One of these should be true in test environments
    const isTestMode =
      process.env.NODE_ENV === 'test' ||
      process.env.VITEST === 'true' ||
      process.env.WALLABY_WORKER === 'true' ||
      Boolean(process.env.VITEST_WORKER_ID) ||
      Boolean(process.env.WALLABY_WORKER_ID)

    expect(isTestMode).toBe(true)
  })

  it('should have test-safe API keys from .env.example', () => {
    // In test mode, we should have test values, not real API keys
    const openaiKey = process.env.OPENAI_API_KEY
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY

    // Real keys start with 'sk-' or 'sk_'
    if (openaiKey) {
      expect(openaiKey.startsWith('sk-')).toBe(false)
    }
    if (elevenLabsKey) {
      expect(elevenLabsKey.startsWith('sk_')).toBe(false)
    }
  })

  it('should show which test runner is active', () => {
    const runners = {
      wallaby: process.env.WALLABY_WORKER === 'true',
      vitest: process.env.VITEST === 'true',
      vitestWorker: Boolean(process.env.VITEST_WORKER_ID),
      wallabyWorker: Boolean(process.env.WALLABY_WORKER_ID),
    }

    // At least one should be true
    const hasRunner = Object.values(runners).some((v) => v)
    expect(hasRunner).toBe(true)
  })
})
