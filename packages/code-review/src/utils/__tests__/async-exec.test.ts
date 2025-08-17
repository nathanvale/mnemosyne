import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted to ensure mock function is created before vi.mock
const mockExecFileAsync = vi.hoisted(() => vi.fn())

// Mock node:util first to intercept promisify
vi.mock('node:util', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:util')>()
  return {
    ...actual,
    promisify: vi.fn(() => mockExecFileAsync),
  }
})

// Now import the module under test - it will use our mocked promisify
import {
  execFileWithTimeout,
  execFileJson,
  execFileParallel,
  createTimeoutController,
} from '../async-exec'

describe('Async Execution Utilities', () => {
  // Skip all tests in Wallaby due to promisify mock limitations
  // These tests execute real commands in Wallaby but work correctly in Vitest
  if (process.env.WALLABY_WORKER) {
    it.skip('skipped in Wallaby.js environment - promisify mocking not supported', () => {})
    return
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('execFileWithTimeout', () => {
    it('should execute command successfully', async () => {
      mockExecFileAsync.mockResolvedValue({
        stdout: 'success output',
        stderr: '',
      })

      const result = await execFileWithTimeout('echo', ['hello'])

      expect(result).toBe('success output')
      expect(mockExecFileAsync).toHaveBeenCalledWith(
        'echo',
        ['hello'],
        expect.objectContaining({
          encoding: 'utf-8',
          maxBuffer: 10 * 1024 * 1024,
          timeout: 120000,
        }),
      )
    })

    it('should handle stderr warnings without failing', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      mockExecFileAsync.mockResolvedValue({
        stdout: 'success output',
        stderr: 'warning message',
      })

      const result = await execFileWithTimeout('echo', ['hello'])

      expect(result).toBe('success output')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Warning from echo:',
        'warning message',
      )
    })

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Command timed out') as Error & {
        code: string
      }
      timeoutError.code = 'ETIMEDOUT'
      mockExecFileAsync.mockRejectedValue(timeoutError)

      await expect(execFileWithTimeout('slow-command', [])).rejects.toThrow(
        'Command timed out after 120000ms: slow-command',
      )
    })

    it('should handle command not found errors', async () => {
      const notFoundError = new Error('Command not found') as Error & {
        code: string
      }
      notFoundError.code = 'ENOENT'
      mockExecFileAsync.mockRejectedValue(notFoundError)

      await expect(execFileWithTimeout('nonexistent', [])).rejects.toThrow(
        "Command not found: nonexistent. Make sure it's installed and in your PATH.",
      )
    })

    it('should handle generic command failures', async () => {
      const genericError = new Error('Generic error') as Error & {
        stderr: string
      }
      genericError.stderr = 'error details'
      mockExecFileAsync.mockRejectedValue(genericError)

      await expect(
        execFileWithTimeout('failing-command', ['arg']),
      ).rejects.toThrow('Command failed: failing-command arg\nerror details')
    })

    it('should use custom options', async () => {
      mockExecFileAsync.mockResolvedValue({
        stdout: 'output',
        stderr: '',
      })

      await execFileWithTimeout('command', ['arg'], {
        timeout: 30000,
        maxBuffer: 1024,
      })

      expect(mockExecFileAsync).toHaveBeenCalledWith(
        'command',
        ['arg'],
        expect.objectContaining({
          timeout: 30000,
          maxBuffer: 1024,
          encoding: 'utf-8', // Still includes defaults
        }),
      )
    })
  })

  describe('execFileJson', () => {
    it('should execute command and parse JSON output', async () => {
      const jsonOutput = { result: 'success', count: 42 }
      mockExecFileAsync.mockResolvedValue({
        stdout: JSON.stringify(jsonOutput),
        stderr: '',
      })

      const result = await execFileJson('command', ['--json'])

      expect(result).toEqual(jsonOutput)
    })

    it('should handle JSON parse errors', async () => {
      mockExecFileAsync.mockResolvedValue({
        stdout: 'invalid json output',
        stderr: '',
      })

      await expect(execFileJson('command', ['--json'])).rejects.toThrow(
        'Failed to parse JSON output from command: command --json',
      )
    })

    it('should work with typed generic', async () => {
      interface TestResponse {
        name: string
        value: number
      }

      const jsonOutput: TestResponse = { name: 'test', value: 123 }
      mockExecFileAsync.mockResolvedValue({
        stdout: JSON.stringify(jsonOutput),
        stderr: '',
      })

      const result = await execFileJson<TestResponse>('command', ['--json'])

      expect(result.name).toBe('test')
      expect(result.value).toBe(123)
    })
  })

  describe('execFileParallel', () => {
    it('should execute multiple commands in parallel', async () => {
      mockExecFileAsync
        .mockResolvedValueOnce({ stdout: 'result1', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'result2', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'result3', stderr: '' })

      const commands = [
        { command: 'cmd1', args: ['arg1'] },
        { command: 'cmd2', args: ['arg2'] },
        { command: 'cmd3', args: ['arg3'] },
      ]

      const results = await execFileParallel(commands)

      expect(results).toEqual(['result1', 'result2', 'result3'])
      expect(mockExecFileAsync).toHaveBeenCalledTimes(3)
    })

    it('should handle parallel execution with one failure', async () => {
      mockExecFileAsync
        .mockResolvedValueOnce({ stdout: 'result1', stderr: '' })
        .mockRejectedValueOnce(new Error('Command failed'))
        .mockResolvedValueOnce({ stdout: 'result3', stderr: '' })

      const commands = [
        { command: 'cmd1', args: ['arg1'] },
        { command: 'cmd2', args: ['arg2'] },
        { command: 'cmd3', args: ['arg3'] },
      ]

      await expect(execFileParallel(commands)).rejects.toThrow()
    })

    it('should handle custom options for each command', async () => {
      mockExecFileAsync
        .mockResolvedValueOnce({ stdout: 'result1', stderr: '' })
        .mockResolvedValueOnce({ stdout: 'result2', stderr: '' })

      const commands = [
        { command: 'cmd1', args: ['arg1'], options: { timeout: 5000 } },
        { command: 'cmd2', args: ['arg2'], options: { maxBuffer: 2048 } },
      ]

      await execFileParallel(commands)

      expect(mockExecFileAsync).toHaveBeenNthCalledWith(
        1,
        'cmd1',
        ['arg1'],
        expect.objectContaining({ timeout: 5000 }),
      )
      expect(mockExecFileAsync).toHaveBeenNthCalledWith(
        2,
        'cmd2',
        ['arg2'],
        expect.objectContaining({ maxBuffer: 2048 }),
      )
    })
  })

  describe('createTimeoutController', () => {
    it('should create an AbortController that aborts after timeout', async () => {
      vi.useFakeTimers()

      const controller = createTimeoutController(1000)
      expect(controller.signal.aborted).toBe(false)

      // Fast-forward time
      vi.advanceTimersByTime(1000)

      expect(controller.signal.aborted).toBe(true)

      vi.useRealTimers()
    })

    it('should not abort before timeout', () => {
      vi.useFakeTimers()

      const controller = createTimeoutController(5000)
      expect(controller.signal.aborted).toBe(false)

      // Advance time but not past timeout
      vi.advanceTimersByTime(2000)
      expect(controller.signal.aborted).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('graceful shutdown', () => {
    it('should handle graceful shutdown initialization', async () => {
      const { initializeGracefulShutdown, registerShutdownCleanup } =
        await import('../async-exec')

      // Initialize graceful shutdown
      expect(() => initializeGracefulShutdown()).not.toThrow()

      // Register cleanup function
      const cleanupMock = vi.fn().mockResolvedValue(undefined)
      expect(() => registerShutdownCleanup(cleanupMock)).not.toThrow()
    })

    it('should execute with graceful shutdown support', async () => {
      const { execFileWithGracefulShutdown } = await import('../async-exec')

      mockExecFileAsync.mockResolvedValue({
        stdout: 'success with graceful shutdown',
        stderr: '',
      })

      const result = await execFileWithGracefulShutdown('echo', ['hello'])

      expect(result).toBe('success with graceful shutdown')
      expect(mockExecFileAsync).toHaveBeenCalledWith(
        'echo',
        ['hello'],
        expect.objectContaining({
          signal: expect.any(Object), // AbortSignal
        }),
      )
    })

    it('should handle abort signal during execution', async () => {
      const { execFileWithGracefulShutdown } = await import('../async-exec')

      const abortError = new Error('Command aborted')
      abortError.name = 'AbortError'
      mockExecFileAsync.mockRejectedValue(abortError)

      await expect(
        execFileWithGracefulShutdown('long-running-command', []),
      ).rejects.toThrow('Command aborted')
    })
  })

  describe('integration scenarios', () => {
    it('should handle real-world git command simulation', async () => {
      const gitOutput = {
        commits: [
          { sha: 'abc123', message: 'Initial commit' },
          { sha: 'def456', message: 'Add feature' },
        ],
      }

      mockExecFileAsync.mockResolvedValue({
        stdout: JSON.stringify(gitOutput),
        stderr: '',
      })

      const result = await execFileJson<{
        commits: Array<{ sha: string; message: string }>
      }>('gh', [
        'pr',
        'view',
        '123',
        '--repo',
        'owner/repo',
        '--json',
        'commits',
      ])

      expect(result.commits).toHaveLength(2)
      expect(result.commits[0].sha).toBe('abc123')
    })

    it('should handle GitHub CLI error scenarios', async () => {
      const cliError = new Error('GitHub CLI error') as Error & {
        stderr: string
      }
      cliError.stderr = 'Authentication failed. Please run `gh auth login`'
      mockExecFileAsync.mockRejectedValue(cliError)

      await expect(
        execFileWithTimeout('gh', [
          'pr',
          'view',
          '999',
          '--repo',
          'owner/repo',
        ]),
      ).rejects.toThrow('Authentication failed. Please run `gh auth login`')
    })
  })
})
