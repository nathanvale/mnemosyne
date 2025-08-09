import { describe, it, expect } from 'vitest'

describe('Environment loading behavior', () => {
  it('should detect test mode in Vitest', () => {
    // Vitest sets VITEST_WORKER_ID when running tests
    expect(process.env.VITEST_WORKER_ID).toBeDefined()
    expect(process.env.NODE_ENV).toBe('test')
  })

  it('should load test-safe values from .env.example', () => {
    // The vitest.setup.ts file should have loaded .env.example values
    expect(process.env.OPENAI_API_KEY).toBeDefined()
    expect(process.env.OPENAI_API_KEY).toBe('test-openai-key')
    expect(process.env.OPENAI_API_KEY).not.toMatch(/^sk-/)
  })

  it('should have all required test environment variables', () => {
    // Verify all environment variables from .env.example are loaded
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    expect(process.env.ELEVENLABS_API_KEY).toBe('test-elevenlabs-key')
    expect(process.env.CLAUDE_HOOKS_TTS_PROVIDER).toBe('macos')
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    expect(process.env.CLAUDE_HOOKS_TTS_VOICE).toBe('Samantha')
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    expect(process.env.CLAUDE_HOOKS_TTS_MACOS_VOICE).toBe('Samantha')
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    expect(process.env.CLAUDE_HOOKS_TTS_MACOS_RATE).toBe('200')
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    expect(process.env.CLAUDE_HOOKS_TTS_OPENAI_VOICE).toBe('nova')
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    expect(process.env.CLAUDE_HOOKS_TTS_OPENAI_MODEL).toBe('tts-1')
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    expect(process.env.CLAUDE_HOOKS_TTS_OPENAI_SPEED).toBe('1.0')
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    expect(process.env.CLAUDE_HOOKS_AUDIO_COOLDOWN_MS).toBe('2000')
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    expect(process.env.CLAUDE_HOOKS_CACHE_TTL_MS).toBe('3600000')
  })
})
