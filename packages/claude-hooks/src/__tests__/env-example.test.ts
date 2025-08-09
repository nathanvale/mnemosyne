import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'

import { findMonorepoRoot } from '../utils/env-loader.js'

describe('.env.example file', () => {
  // Use shared root resolver utility
  const rootDir = findMonorepoRoot()
  const envExamplePath = join(rootDir, '.env.example')

  it('should exist in the monorepo root', () => {
    expect(existsSync(envExamplePath)).toBe(true)
  })

  it('should contain all required environment variables', () => {
    const content = readFileSync(envExamplePath, 'utf-8')

    // Required API keys
    expect(content).toContain('OPENAI_API_KEY')
    expect(content).toContain('ELEVENLABS_API_KEY')
    expect(content).toContain('TAVILY_API_KEY')

    // Claude hooks configuration
    expect(content).toContain('CLAUDE_HOOKS_DEBUG')
    expect(content).toContain('CLAUDE_HOOKS_CONFIG_DIR')
    expect(content).toContain('CLAUDE_HOOKS_LOG_DIR')
    expect(content).toContain('CLAUDE_HOOKS_USE_LOCAL_DIR')

    // TTS configuration
    expect(content).toContain('CLAUDE_HOOKS_TTS_PROVIDER')
    expect(content).toContain('CLAUDE_HOOKS_TTS_FALLBACK_PROVIDER')

    // OpenAI TTS specific
    expect(content).toContain('CLAUDE_HOOKS_OPENAI_TTS_MODEL')
    expect(content).toContain('CLAUDE_HOOKS_OPENAI_TTS_VOICE')
    expect(content).toContain('CLAUDE_HOOKS_OPENAI_TTS_SPEED')

    // ElevenLabs TTS specific
    expect(content).toContain('CLAUDE_HOOKS_ELEVENLABS_TTS_VOICE')
    expect(content).toContain('CLAUDE_HOOKS_ELEVENLABS_TTS_MODEL')

    // Sound notification configuration
    expect(content).toContain('CLAUDE_HOOKS_SOUND_SUCCESS')
    expect(content).toContain('CLAUDE_HOOKS_SOUND_WARNING')
    expect(content).toContain('CLAUDE_HOOKS_SOUND_ERROR')
    expect(content).toContain('CLAUDE_HOOKS_SOUND_VOLUME')
    expect(content).toContain('CLAUDE_HOOKS_SOUND_DELAY')
    expect(content).toContain('CLAUDE_HOOKS_SOUND_COOLDOWN')
    expect(content).toContain('CLAUDE_HOOKS_MIN_EXEC_TIME')

    // Quiet hours configuration
    expect(content).toContain('CLAUDE_HOOKS_QUIET_HOURS_ENABLED')
    expect(content).toContain('CLAUDE_HOOKS_QUIET_HOURS_ALLOW_URGENT')
    expect(content).toContain('CLAUDE_HOOKS_QUIET_HOURS_TIMEZONE')
    expect(content).toContain('CLAUDE_HOOKS_QUIET_HOURS_DAYS')
    expect(content).toContain('CLAUDE_HOOKS_QUIET_HOURS_RANGES')
  })

  it('should have documentation comments for each variable', () => {
    const content = readFileSync(envExamplePath, 'utf-8')
    const lines = content.split('\n')

    // Check that important variables have comments
    const importantVars = [
      'OPENAI_API_KEY',
      'ELEVENLABS_API_KEY',
      'CLAUDE_HOOKS_TTS_PROVIDER',
      'CLAUDE_HOOKS_DEBUG',
    ]

    for (const varName of importantVars) {
      const varIndex = lines.findIndex((line) => line.includes(varName))
      if (varIndex > 0) {
        // Check if there's a comment line before the variable
        const previousLine = lines[varIndex - 1]
        expect(previousLine).toMatch(/^#/)
      }
    }
  })

  it('should provide example values that work for tests', () => {
    const content = readFileSync(envExamplePath, 'utf-8')

    // Check for test-safe example values
    expect(content).toMatch(/OPENAI_API_KEY=test-openai-key/)
    expect(content).toMatch(/ELEVENLABS_API_KEY=test-elevenlabs-key/)

    // Boolean values should be set to safe defaults
    expect(content).toMatch(/CLAUDE_HOOKS_DEBUG=false/)

    // TTS provider should default to macos for tests
    expect(content).toMatch(/CLAUDE_HOOKS_TTS_PROVIDER=macos/)
  })

  it('should not contain real API keys', () => {
    const content = readFileSync(envExamplePath, 'utf-8')

    // Check that no real-looking API keys are present
    expect(content).not.toMatch(/sk-[a-zA-Z0-9]{48}/) // OpenAI format
    expect(content).not.toMatch(/[a-f0-9]{32}/) // 32-char hex (common API key format)

    // Should contain placeholder patterns
    expect(content).toMatch(/test-.*-key|your_.*_key|example|placeholder/i)
  })
})
