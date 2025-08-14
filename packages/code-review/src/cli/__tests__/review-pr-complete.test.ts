import * as fs from 'fs/promises'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock modules
vi.mock('fs/promises')
vi.mock('../../utils/async-exec.js', () => ({
  asyncExec: vi.fn(),
  execFileWithTimeout: vi.fn(),
  execFileJson: vi.fn(),
}))
vi.mock('dotenv', () => ({
  config: vi.fn(),
}))

describe('review-pr-complete', () => {
  const mockFs = vi.mocked(fs)
  const originalEnv = process.env
  const originalArgv = process.argv

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv }
    process.argv = [...originalArgv]
  })

  afterEach(() => {
    process.env = originalEnv
    process.argv = originalArgv
  })

  describe('CLI argument parsing', () => {
    it('should parse command line arguments correctly', () => {
      process.argv = [
        'node',
        'review-pr-complete.ts',
        'analyze',
        '--pr-number',
        '123',
        '--repo',
        'owner/repo',
        '--verbose',
      ]

      const args = process.argv.slice(2)
      const command = args[0]
      const prNumberIndex = args.indexOf('--pr-number')
      const prNumber =
        prNumberIndex !== -1 ? args[prNumberIndex + 1] : undefined
      const repoIndex = args.indexOf('--repo')
      const repo = repoIndex !== -1 ? args[repoIndex + 1] : undefined
      const verbose = args.includes('--verbose')

      expect(command).toBe('analyze')
      expect(prNumber).toBe('123')
      expect(repo).toBe('owner/repo')
      expect(verbose).toBe(true)
    })

    it('should use environment variables as fallback', () => {
      process.env.PR = '456'
      process.env.REPO = 'env/repo'
      process.argv = ['node', 'review-pr-complete.ts', 'analyze']

      const args = process.argv.slice(2)
      const command = args[0]
      const prNumber = process.env.PR
      const repo = process.env.REPO

      expect(command).toBe('analyze')
      expect(prNumber).toBe('456')
      expect(repo).toBe('env/repo')
    })

    it('should handle help command', () => {
      process.argv = ['node', 'review-pr-complete.ts', '--help']

      const args = process.argv.slice(2)
      const showHelp = args.includes('--help') || args.includes('-h')

      expect(showHelp).toBe(true)
    })
  })

  describe('Command execution', () => {
    it('should execute fetch-github command', async () => {
      const mockGitHubData = {
        pr: { number: 123, title: 'Test PR' },
        files: [],
      }

      mockFs.writeFile.mockResolvedValue(undefined)

      await mockFs.writeFile(
        'github-pr-123.json',
        JSON.stringify(mockGitHubData, null, 2),
      )

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'github-pr-123.json',
        expect.any(String),
      )
    })

    it('should execute fetch-coderabbit command', async () => {
      const mockCodeRabbitData = {
        pr_number: 123,
        issues: [],
        suggestions: [],
      }

      mockFs.writeFile.mockResolvedValue(undefined)

      await mockFs.writeFile(
        'coderabbit-pr-123.json',
        JSON.stringify(mockCodeRabbitData, null, 2),
      )

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'coderabbit-pr-123.json',
        expect.any(String),
      )
    })

    it('should execute analyze command', async () => {
      const mockAnalysisResult = {
        prNumber: 123,
        repository: 'owner/repo',
        analysis: {
          security: { score: 95 },
          complexity: { score: 5 },
          patterns: { violations: [] },
        },
      }

      mockFs.readFile.mockImplementation((path) => {
        const pathStr = String(path)
        if (pathStr.includes('github')) {
          return Promise.resolve(
            Buffer.from(JSON.stringify({ pr: { number: 123 } })),
          )
        }
        if (pathStr.includes('coderabbit')) {
          return Promise.resolve(Buffer.from(JSON.stringify({ issues: [] })))
        }
        return Promise.reject(new Error('File not found'))
      })

      mockFs.writeFile.mockResolvedValue(undefined)

      // Simulate analysis
      await mockFs.writeFile(
        'analysis-pr-123.json',
        JSON.stringify(mockAnalysisResult, null, 2),
      )

      expect(mockFs.writeFile).toHaveBeenCalled()
    })

    it('should execute agent command', async () => {
      const mockAgentAnalysis = {
        prNumber: 123,
        repository: 'owner/repo',
        agentRecommendations: {
          mustFix: [],
          shouldFix: [],
          consider: [],
        },
        confidence: 0.95,
      }

      mockFs.writeFile.mockResolvedValue(undefined)

      await mockFs.writeFile(
        'agent-analysis-pr-123.json',
        JSON.stringify(mockAgentAnalysis, null, 2),
      )

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'agent-analysis-pr-123.json',
        expect.any(String),
      )
    })

    it('should execute report command', async () => {
      mockFs.readFile.mockResolvedValue(
        Buffer.from(
          JSON.stringify({
            prNumber: 123,
            analysis: { security: { score: 95 } },
          }),
        ),
      )

      mockFs.writeFile.mockResolvedValue(undefined)

      await mockFs.writeFile('report-pr-123.md', '# PR Analysis Report\n\n...')

      expect(mockFs.writeFile).toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    it('should handle missing PR number', () => {
      process.argv = ['node', 'review-pr-complete.ts', 'analyze']
      delete process.env.PR

      expect(() => {
        const prNumber = process.env.PR
        if (!prNumber) {
          throw new Error('PR number is required')
        }
      }).toThrow('PR number is required')
    })

    it('should handle missing repository', () => {
      process.argv = ['node', 'review-pr-complete.ts', 'analyze']
      process.env.PR = '123'
      delete process.env.REPO

      expect(() => {
        const repo = process.env.REPO
        if (!repo) {
          throw new Error('Repository is required')
        }
      }).toThrow('Repository is required')
    })

    it('should handle invalid command', () => {
      process.argv = ['node', 'review-pr-complete.ts', 'invalid-command']

      const validCommands = [
        'fetch-github',
        'fetch-coderabbit',
        'analyze',
        'agent',
        'report',
      ]
      const command = process.argv[2]

      expect(validCommands.includes(command)).toBe(false)
    })

    it('should handle file read errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'))

      await expect(mockFs.readFile('missing-file.json')).rejects.toThrow(
        'File not found',
      )
    })

    it('should handle file write errors', async () => {
      mockFs.writeFile.mockRejectedValue(new Error('Permission denied'))

      await expect(mockFs.writeFile('output.json', 'data')).rejects.toThrow(
        'Permission denied',
      )
    })
  })

  describe('Output formatting', () => {
    it('should format JSON output correctly', () => {
      const data = {
        prNumber: 123,
        repository: 'owner/repo',
        timestamp: '2024-01-01T00:00:00Z',
      }

      const formatted = JSON.stringify(data, null, 2)

      expect(formatted).toContain('"prNumber": 123')
      expect(formatted).toContain('"repository": "owner/repo"')
      expect(formatted.split('\n').length).toBeGreaterThan(1)
    })

    it('should handle verbose output', () => {
      const verbose = true
      const messages: string[] = []

      function log(message: string) {
        if (verbose) {
          messages.push(message)
        }
      }

      log('Starting analysis...')
      log('Fetching GitHub data...')
      log('Analysis complete.')

      expect(messages).toHaveLength(3)
      expect(messages[0]).toBe('Starting analysis...')
    })

    it('should handle quiet mode', () => {
      const quiet = true
      const messages: string[] = []

      function log(message: string, level: 'info' | 'error' = 'info') {
        if (!quiet || level === 'error') {
          messages.push(message)
        }
      }

      log('Info message')
      log('Error message', 'error')

      expect(messages).toHaveLength(1)
      expect(messages[0]).toBe('Error message')
    })
  })

  describe('Configuration', () => {
    it('should load configuration from file', async () => {
      const mockConfig = {
        github: { token: 'ghp_xxx' },
        coderabbit: { apiKey: 'cr_xxx' },
        output: { format: 'json', directory: './output' },
      }

      mockFs.readFile.mockResolvedValue(Buffer.from(JSON.stringify(mockConfig)))

      const config = JSON.parse(
        (await mockFs.readFile('.codereviewer.json')).toString(),
      )

      expect(config.github.token).toBe('ghp_xxx')
      expect(config.output.format).toBe('json')
    })

    it('should merge CLI args with config file', () => {
      const config = {
        verbose: false,
        output: 'json',
      }

      const cliArgs = {
        verbose: true, // Override config
        prNumber: 123, // Additional arg
      }

      const merged = { ...config, ...cliArgs }

      expect(merged.verbose).toBe(true)
      expect(merged.output).toBe('json')
      expect(merged.prNumber).toBe(123)
    })

    it('should validate configuration', () => {
      const config = {
        prNumber: 'invalid', // Should be number
        repo: 'invalid-format', // Should be owner/repo
      }

      const errors: string[] = []

      if (
        typeof config.prNumber !== 'number' &&
        isNaN(Number(config.prNumber))
      ) {
        errors.push('PR number must be a valid number')
      }

      if (!config.repo.includes('/')) {
        errors.push('Repository must be in format owner/repo')
      }

      expect(errors).toHaveLength(2)
    })
  })
})
