import { execSync } from 'node:child_process'
import { writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Subagent Stop Hook Integration', () => {
  let tempDir: string
  let configPath: string
  let logDir: string
  const rootDir = join(__dirname, '../../../../../')

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

  afterEach(async () => {
    // Clean up temporary files
    if (existsSync(tempDir)) {
      try {
        // Add a small delay to ensure any file handles are released
        await new Promise((resolve) => setTimeout(resolve, 100))
        rmSync(tempDir, { recursive: true, force: true, maxRetries: 3 })
      } catch (error) {
        // If cleanup fails, log but don't fail the test
        // This can happen in Wallaby when tests are skipped
        if (process.env.WALLABY_WORKER) {
          console.warn(`Failed to clean up temp dir ${tempDir}:`, error)
        } else {
          // Re-throw in non-Wallaby environments
          throw error
        }
      }
    }
    vi.unstubAllEnvs()
  })

  it('should execute subagent stop hook with basic configuration', async () => {
    // Skip in Wallaby and CI due to file system and spawn issues
    if (process.env.WALLABY_WORKER || process.env.CI) {
      return
    }
    // Create a basic configuration
    const config = {
      settings: {
        soundEnabled: false, // Disable sound for testing
        volume: 'low',
        loggingEnabled: true,
        cooldownMs: 1000,
      },
    }
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    // Mock stdin input for subagent completion event
    const stdinInput = JSON.stringify({
      type: 'SubagentStop',
      timestamp: new Date().toISOString(),
      data: {
        subagentId: 'test-subagent-123',
        task: 'Test subagent task',
        duration: 3000,
        result: 'success',
      },
    })

    // Execute the subagent stop hook
    const hookPath = join(__dirname, '../../subagent-stop/index.ts')
    // Use tsx with root tsconfig for path mappings
    const command = `echo '${stdinInput}' | cd ${rootDir} && npx tsx --tsconfig ${rootDir}/tsconfig.json ${hookPath}`

    expect(() => {
      execSync(command, {
        cwd: tempDir,
        env: {
          ...process.env,
          NODE_ENV: 'development',
          CLAUDE_HOOKS_DEBUG: 'true',
          CLAUDE_HOOKS_LOG_DIR: logDir,
          CLAUDE_HOOKS_CONFIG_PATH: configPath,
        },
        stdio: 'pipe',
      })
    }).not.toThrow()

    // Verify log file was created
    const logFiles = execSync('ls', { cwd: logDir, encoding: 'utf8' })
      .split('\n')
      .filter((f) => f.endsWith('.jsonl'))
    expect(logFiles.length).toBeGreaterThan(0)
  }, 30000)

  it('should handle detailed subagent tracking configuration', async () => {
    // Create detailed configuration
    const config = {
      settings: {
        soundEnabled: false,
        volume: 'medium',
        loggingEnabled: true,
        trackMetrics: true,
        alertOnLongTasks: true,
        longTaskThresholdMs: 10000,
        cooldownMs: 500,
      },
    }
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    // Mock stdin input for long-running subagent
    const stdinInput = JSON.stringify({
      event: 'subagent_complete',
      timestamp: new Date().toISOString(),
      data: {
        subagentId: 'long-running-subagent',
        task: 'Complex analysis task',
        duration: 15000, // Exceeds threshold
        result: 'success',
        metrics: {
          tokensUsed: 1500,
          apiCalls: 5,
        },
      },
    })

    const hookPath = join(__dirname, '../../subagent-stop/index.ts')
    // Use tsx with root tsconfig for path mappings
    const command = `echo '${stdinInput}' | cd ${rootDir} && npx tsx --tsconfig ${rootDir}/tsconfig.json ${hookPath}`

    expect(() => {
      execSync(command, {
        cwd: tempDir,
        env: {
          ...process.env,
          NODE_ENV: 'development',
          CLAUDE_HOOKS_DEBUG: 'true',
          CLAUDE_HOOKS_LOG_DIR: logDir,
          CLAUDE_HOOKS_CONFIG_PATH: configPath,
        },
        stdio: 'pipe',
      })
    }).not.toThrow()
  }, 30000)

  it('should handle multiple subagent completions', async () => {
    // Skip in Wallaby and CI due to file system and spawn issues
    if (process.env.WALLABY_WORKER || process.env.CI) {
      return
    }
    const config = {
      settings: {
        soundEnabled: false,
        loggingEnabled: true,
        cooldownMs: 100, // Short cooldown for testing
      },
    }
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    const hookPath = join(__dirname, '../../subagent-stop/index.ts')

    // Simulate multiple subagent completions
    const subagents = [
      { id: 'subagent-1', task: 'Task 1', duration: 2000 },
      { id: 'subagent-2', task: 'Task 2', duration: 3000 },
      { id: 'subagent-3', task: 'Task 3', duration: 1500 },
    ]

    for (const subagent of subagents) {
      const stdinInput = JSON.stringify({
        event: 'subagent_complete',
        timestamp: new Date().toISOString(),
        data: {
          subagentId: subagent.id,
          task: subagent.task,
          duration: subagent.duration,
          result: 'success',
        },
      })

      // Use tsx with root tsconfig for path mappings
      const command = `echo '${stdinInput}' | cd ${rootDir} && npx tsx --tsconfig ${rootDir}/tsconfig.json ${hookPath}`

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

      // Small delay between executions
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  })

  it('should handle environment variable overrides', async () => {
    const config = {
      settings: {
        soundEnabled: true,
        volume: 'high',
        loggingEnabled: false,
      },
    }
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    const stdinInput = JSON.stringify({
      event: 'subagent_complete',
      timestamp: new Date().toISOString(),
      data: {
        subagentId: 'test-subagent',
        task: 'Environment test',
      },
    })

    const hookPath = join(__dirname, '../../subagent-stop/index.ts')
    // Use tsx with root tsconfig for path mappings
    const command = `echo '${stdinInput}' | cd ${rootDir} && npx tsx --tsconfig ${rootDir}/tsconfig.json ${hookPath}`

    // Test with environment variable overrides
    expect(() => {
      execSync(command, {
        cwd: tempDir,
        env: {
          ...process.env,
          NODE_ENV: 'development',
          CLAUDE_HOOKS_DEBUG: 'true',
          CLAUDE_HOOKS_CONFIG_PATH: configPath,
          CLAUDE_HOOKS_SUBAGENT_SOUND: 'false', // Override config
          CLAUDE_HOOKS_SUBAGENT_VOLUME: 'low', // Override config
          CLAUDE_HOOKS_SUBAGENT_LOGGING: 'true', // Override config
        },
        stdio: 'pipe',
      })
    }).not.toThrow()
  })

  it('should handle invalid subagent data gracefully', async () => {
    const config = {
      settings: {
        soundEnabled: false,
        loggingEnabled: true,
      },
    }
    writeFileSync(configPath, JSON.stringify(config, null, 2))

    const hookPath = join(__dirname, '../../subagent-stop/index.ts')

    // Test with missing subagent data
    const stdinInputMissing = JSON.stringify({
      event: 'subagent_complete',
      timestamp: new Date().toISOString(),
      data: {}, // Empty data
    })

    // Use tsx with root tsconfig for path mappings
    const commandMissing = `echo '${stdinInputMissing}' | cd ${rootDir} && npx tsx --tsconfig ${rootDir}/tsconfig.json ${hookPath}`

    expect(() => {
      execSync(commandMissing, {
        cwd: tempDir,
        env: {
          ...process.env,
          CLAUDE_HOOKS_DEBUG: 'true',
          CLAUDE_HOOKS_CONFIG_PATH: configPath,
        },
        stdio: 'pipe',
      })
    }).not.toThrow()

    // Test with malformed event
    const stdinInputMalformed = JSON.stringify({
      event: 'unknown_event',
      timestamp: new Date().toISOString(),
      data: {
        subagentId: 'test-subagent',
      },
    })

    // Use tsx with root tsconfig for path mappings
    const commandMalformed = `echo '${stdinInputMalformed}' | cd ${rootDir} && npx tsx --tsconfig ${rootDir}/tsconfig.json ${hookPath}`

    expect(() => {
      execSync(commandMalformed, {
        cwd: tempDir,
        env: {
          ...process.env,
          CLAUDE_HOOKS_DEBUG: 'true',
          CLAUDE_HOOKS_CONFIG_PATH: configPath,
        },
        stdio: 'pipe',
      })
    }).not.toThrow()
  }, 30000)
})
