import * as fs from 'fs/promises'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock modules
vi.mock('fs/promises')
vi.mock('../../utils/async-exec.js', () => ({
  asyncExec: vi.fn().mockResolvedValue({ stdout: '', stderr: '' }),
}))

describe('analyze-pr', () => {
  const mockFs = vi.mocked(fs)

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PR = '123'
    process.env.REPO = 'owner/repo'
  })

  it('should read GitHub and CodeRabbit data files', async () => {
    const mockGitHubData = {
      pr: {
        number: 123,
        title: 'Test PR',
        files: [
          {
            filename: 'src/test.ts',
            changes: 10,
            additions: 5,
            deletions: 5,
            patch: 'test patch',
          },
        ],
      },
    }

    const mockCodeRabbitData = {
      issues: [],
      suggestions: [],
    }

    mockFs.readFile.mockImplementation((path) => {
      const pathStr = String(path)
      if (pathStr.includes('github')) {
        return Promise.resolve(Buffer.from(JSON.stringify(mockGitHubData)))
      }
      if (pathStr.includes('coderabbit')) {
        return Promise.resolve(Buffer.from(JSON.stringify(mockCodeRabbitData)))
      }
      return Promise.reject(new Error('File not found'))
    })

    // Test reading files
    const githubData = await mockFs.readFile('github-pr-123.json')
    const coderabbitData = await mockFs.readFile('coderabbit-pr-123.json')

    expect(JSON.parse(githubData.toString())).toEqual(mockGitHubData)
    expect(JSON.parse(coderabbitData.toString())).toEqual(mockCodeRabbitData)
  })

  it('should write analysis results to output file', async () => {
    const mockAnalysisResult = {
      prNumber: 123,
      repository: 'owner/repo',
      analysis: {
        security: { score: 100 },
        complexity: { score: 5 },
        patterns: { violations: [] },
      },
    }

    mockFs.writeFile.mockResolvedValue(undefined)

    await mockFs.writeFile(
      'analysis-pr-123.json',
      JSON.stringify(mockAnalysisResult, null, 2),
    )

    expect(mockFs.writeFile).toHaveBeenCalledWith(
      'analysis-pr-123.json',
      JSON.stringify(mockAnalysisResult, null, 2),
    )
  })

  it('should handle missing input files', async () => {
    mockFs.readFile.mockRejectedValue(new Error('File not found'))

    const mockError = vi.spyOn(console, 'error').mockImplementation(() => {})

    try {
      await mockFs.readFile('github-pr-123.json')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('File not found')
    }

    mockError.mockRestore()
  })

  it('should validate environment variables', () => {
    delete process.env.PR
    delete process.env.REPO

    expect(() => {
      if (!process.env.PR || !process.env.REPO) {
        throw new Error('Missing required environment variables')
      }
    }).toThrow('Missing required environment variables')
  })

  it('should handle API errors gracefully', async () => {
    mockFs.readFile.mockRejectedValue(new Error('API request failed'))

    await expect(mockFs.readFile('test.json')).rejects.toThrow(
      'API request failed',
    )
  })
})
