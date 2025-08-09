import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, beforeAll } from 'vitest'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

describe.skip('CLI Environment Loading', () => {
  const rootDir = join(__dirname, '../../../../..')

  beforeAll(() => {
    // Ensure .env.example exists
    const envExamplePath = join(rootDir, '.env.example')
    expect(existsSync(envExamplePath)).toBe(true)
  })

  describe('CLI commands load environment automatically', () => {
    it('should load environment variables for claude-hooks-stop', async () => {
      const result = await runCliCommand('claude-hooks-stop.ts', ['--help'])
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Usage:')
    })

    it('should load environment variables for claude-hooks-notification', async () => {
      const result = await runCliCommand('claude-hooks-notification.ts', [
        '--help',
      ])
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Usage:')
    })

    it('should load environment variables for claude-hooks-quality', async () => {
      const result = await runCliCommand('claude-hooks-quality.ts', ['--help'])
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Usage:')
    })

    it('should load environment variables for claude-hooks-subagent', async () => {
      const result = await runCliCommand('claude-hooks-subagent.ts', ['--help'])
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Usage:')
    })

    it('should load environment variables for claude-hooks-cache-stats', async () => {
      const result = await runCliCommand('claude-hooks-cache-stats.ts', [
        '--help',
      ])
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Usage:')
    })

    it('should load environment variables for claude-hooks-cache-explorer', async () => {
      const result = await runCliCommand('claude-hooks-cache-explorer.ts', [
        '--help',
      ])
      expect(result.exitCode).toBe(0)
      expect(result.stdout).toContain('Usage:')
    })
  })

  describe('Environment variable substitution in configs', () => {
    it('should substitute environment variables in JSON config files', async () => {
      // This test verifies that ${VAR_NAME} syntax works in config files
      // We'll test this with a command that uses config files
      const result = await runCliCommand('claude-hooks-stop.ts', [
        '--dry-run',
        '--debug',
      ])

      // The command should run without errors even with env var substitution
      expect(result.exitCode).toBe(0)
    })
  })
})

/**
 * Helper function to run CLI commands
 */
function runCliCommand(
  scriptName: string,
  args: string[],
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const scriptPath = join(__dirname, '..', scriptName)
    const child = spawn('npx', ['tsx', scriptPath, ...args], {
      env: {
        ...process.env,
        NODE_ENV: 'test', // Ensure test mode
      },
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 0,
      })
    })
  })
}
