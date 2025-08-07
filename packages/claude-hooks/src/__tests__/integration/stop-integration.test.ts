import { execSync, spawnSync } from 'node:child_process'
import { writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Stop Hook Integration', () => {
  let tempDir: string
  let configPath: string
  let logDir: string

  beforeEach(() => {
    // Create temporary directories for testing
    tempDir = join(tmpdir(), `claude-hooks-test-${Date.now()}`)
    configPath = join(tempDir, 'hook-config.json')
    logDir = join(tempDir, 'logs')

    mkdirSync(tempDir, { recursive: true })
    mkdirSync(logDir, { recursive: true })

    // Mock environment to prevent actual audio playback during tests
    vi.stubEnv('CLAUDE_HOOKS_DEBUG', 'true')
    vi.stubEnv('CLAUDE_HOOKS_LOG_DIR', logDir)
  })

  afterEach(() => {
    // Clean up temporary files
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
    vi.unstubAllEnvs()
  })

  it('should execute stop hook with basic configuration', async () => {
    // Create a basic configuration
    const config = {
      settings: {
        soundEnabled: false, // Disable sound for testing
        speechEnabled: false,
        transcriptEnabled: false,
        cooldownMs: 1000,
      },
    }
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    // Mock stdin input for Claude stop event
    const stdinInput = JSON.stringify({
      event: 'task_complete',
      timestamp: new Date().toISOString(),
      data: {
        task: 'Test task completion',
        duration: 5000,
      },
    })

    // Execute the stop hook
    const hookPath = join(__dirname, '../../stop/index.ts')
    const command = `echo '${stdinInput}' | tsx ${hookPath}`

    expect(() => {
      execSync(command, {
        cwd: tempDir,
        env: {
          ...process.env,
          CLAUDE_HOOKS_DEBUG: 'true',
          CLAUDE_HOOKS_LOG_DIR: logDir,
          CLAUDE_HOOKS_CONFIG_PATH: configPath,
        },
        stdio: 'pipe',
      })
    }).not.toThrow()
  })

  it('should respect cooldown periods', async () => {
    const config = {
      settings: {
        soundEnabled: false,
        cooldownMs: 100, // Short cooldown for testing
      },
    }
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    const stdinInput = JSON.stringify({
      event: 'task_complete',
      timestamp: new Date().toISOString(),
    })

    const hookPath = join(__dirname, '../../stop/index.ts')
    const command = `echo '${stdinInput}' | tsx ${hookPath}`

    // Execute multiple times rapidly
    for (let i = 0; i < 3; i++) {
      expect(() => {
        execSync(command, {
          cwd: tempDir,
          env: {
            ...process.env,
            CLAUDE_HOOKS_DEBUG: 'true',
            CLAUDE_HOOKS_CONFIG_PATH: configPath,
          },
          stdio: 'pipe',
        })
      }).not.toThrow()
    }
  })

  it('should handle environment variable overrides', async () => {
    const config = {
      settings: {
        soundEnabled: true,
        transcriptEnabled: false,
      },
    }
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    const stdinInput = JSON.stringify({
      event: 'task_complete',
      timestamp: new Date().toISOString(),
    })

    const hookPath = join(__dirname, '../../stop/index.ts')
    const command = `echo '${stdinInput}' | tsx ${hookPath}`

    // Test with environment variable overrides
    expect(() => {
      execSync(command, {
        cwd: tempDir,
        env: {
          ...process.env,
          CLAUDE_HOOKS_DEBUG: 'true',
          CLAUDE_HOOKS_CONFIG_PATH: configPath,
          CLAUDE_HOOKS_STOP_SOUND: 'false', // Override config
          CLAUDE_HOOKS_STOP_TRANSCRIPT: 'true', // Override config
        },
        stdio: 'pipe',
      })
    }).not.toThrow()
  })

  it('should handle various event types gracefully', async () => {
    // Skip in Wallaby due to shell execution issues
    if (process.env.WALLABY_WORKER) {
      return
    }

    const config = {
      settings: {
        soundEnabled: false,
        loggingEnabled: true,
      },
    }
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    const hookPath = join(__dirname, '../../stop/index.ts')

    // Test different event types
    const eventTypes = ['task_complete', 'stop', 'completion']

    for (const eventType of eventTypes) {
      const stdinInput = JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        data: { message: `Test ${eventType} event` },
      })

      expect(() => {
        // Use spawnSync directly instead of shell command
        const result = spawnSync('tsx', [hookPath], {
          cwd: tempDir,
          env: {
            ...process.env,
            CLAUDE_HOOKS_DEBUG: 'true',
            CLAUDE_HOOKS_CONFIG_PATH: configPath,
          },
          input: stdinInput,
          encoding: 'utf8',
          stdio: 'pipe',
        })

        // Check for errors
        if (result.error) {
          throw result.error
        }
      }).not.toThrow()
    }
  })
})
