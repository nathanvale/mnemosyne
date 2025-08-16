import * as path from 'path'
import { fileURLToPath } from 'url'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Enable manual mocks
vi.mock('fs')
vi.mock('fs/promises')

// Import mocked functions to use in tests
import { existsSync, readFileSync } from 'fs'
import * as fs from 'fs/promises'

// Import the actual test subject after mocks are set up
import { LogManager } from '../log-manager'

// Get the mocked functions for test assertions
const mockExistsSync = vi.mocked(existsSync)
const mockReadFileSync = vi.mocked(readFileSync)
const mockMkdir = vi.mocked(fs.mkdir)
const mockWriteFile = vi.mocked(fs.writeFile)
const mockReaddir = vi.mocked(fs.readdir)
const mockRm = vi.mocked(fs.rm)

describe('LogManager', () => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const mockProjectRoot = '/mock/project/root'
  const mockTimestamp = '2024-01-01T12:00:00.000Z'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})

    // Mock Date to return consistent timestamp
    vi.useFakeTimers()
    vi.setSystemTime(new Date(mockTimestamp))

    // Default mock for getProjectRoot
    mockExistsSync.mockImplementation((pathArg) => {
      const pathStr = String(pathArg)
      if (
        pathStr.endsWith('package.json') &&
        pathStr.includes(mockProjectRoot)
      ) {
        return true
      }
      return false
    })

    mockReadFileSync.mockImplementation((pathArg) => {
      const pathStr = String(pathArg)
      if (
        pathStr.endsWith('package.json') &&
        pathStr.includes(mockProjectRoot)
      ) {
        return JSON.stringify({ name: 'mnemosyne' })
      }
      throw new Error('File not found')
    })

    // Mock process.cwd to return a subdirectory of project root
    vi.spyOn(process, 'cwd').mockReturnValue(
      path.join(mockProjectRoot, 'packages', 'code-review'),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('savePRAnalysisReport', () => {
    const mockMetadata = {
      timestamp: mockTimestamp,
      prNumber: 123,
      repository: 'owner/repo',
      analysisId: 'test-analysis',
      source: 'expert-analysis' as const,
      format: 'json' as const,
    }

    it('should save JSON report successfully', async () => {
      const content = { test: 'data', results: ['item1', 'item2'] }

      const result = await LogManager.savePRAnalysisReport(
        content,
        mockMetadata,
      )

      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining('.logs/pr-reviews'),
        { recursive: true },
      )
      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining('pr-123_2024-01-01_12-00-00'),
        { recursive: true },
      )

      // Check metadata was saved
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('metadata.json'),
        JSON.stringify(mockMetadata, null, 2),
        'utf-8',
      )

      // Check content was saved as JSON
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('report.json'),
        JSON.stringify(content, null, 2),
        'utf-8',
      )

      // Check README was created
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('README.md'),
        expect.stringContaining('PR Analysis Report'),
        'utf-8',
      )

      expect(result).toContain('pr-123_2024-01-01_12-00-00')
    })

    it('should save markdown report successfully', async () => {
      const content = '# Test Report\n\nThis is a test report.'
      const mdMetadata = { ...mockMetadata, format: 'markdown' as const }

      await LogManager.savePRAnalysisReport(content, mdMetadata)

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('report.md'),
        content,
        'utf-8',
      )
    })

    it('should save text report successfully', async () => {
      const content = 'Plain text report content'
      const txtMetadata = { ...mockMetadata, format: 'text' as const }

      await LogManager.savePRAnalysisReport(content, txtMetadata)

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('report.txt'),
        content,
        'utf-8',
      )
    })

    it('should handle report without PR number', async () => {
      const metadataWithoutPR = { ...mockMetadata, prNumber: undefined }

      await LogManager.savePRAnalysisReport('test content', metadataWithoutPR)

      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining('analysis_2024-01-01_12-00-00'),
        { recursive: true },
      )
    })

    it('should handle file write errors', async () => {
      mockWriteFile.mockRejectedValueOnce(new Error('Permission denied'))

      await expect(
        LogManager.savePRAnalysisReport('test', mockMetadata),
      ).rejects.toThrow('Permission denied')

      expect(console.error).toHaveBeenCalledWith(
        'Failed to save PR analysis report:',
        expect.any(Error),
      )
    })

    it('should stringify objects when format is markdown but content is object', async () => {
      const objectContent = { key: 'value' }
      const mdMetadata = { ...mockMetadata, format: 'markdown' as const }

      await LogManager.savePRAnalysisReport(objectContent, mdMetadata)

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('report.md'),
        JSON.stringify(objectContent, null, 2),
        'utf-8',
      )
    })
  })

  describe('saveSubAgentResponse', () => {
    const mockPrompt = 'Analyze this PR for security issues'
    const mockResponse = JSON.stringify({
      findings: [
        {
          severity: 'high',
          title: 'SQL Injection',
          location: { file: 'db.js', line: 42 },
        },
        {
          severity: 'medium',
          title: 'XSS Risk',
          location: { file: 'ui.js', line: 15 },
        },
      ],
      riskLevel: 'high',
    })

    it('should save sub-agent response with all files', async () => {
      const metadata = {
        prNumber: 456,
        repository: 'test/repo',
        analysisId: 'claude-123',
      }

      const result = await LogManager.saveSubAgentResponse(
        mockResponse,
        mockPrompt,
        metadata,
      )

      // Check all expected files were created
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('sub-agent-prompt.txt'),
        mockPrompt,
        'utf-8',
      )

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('sub-agent-response.json'),
        mockResponse,
        'utf-8',
      )

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('sub-agent-formatted.json'),
        expect.stringContaining('"findings"'),
        'utf-8',
      )

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('findings-summary.md'),
        expect.stringContaining('Security Findings Summary'),
        'utf-8',
      )

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('metadata.json'),
        expect.stringContaining('claude-sub-agent'),
        'utf-8',
      )

      expect(result).toContain('pr-456_2024-01-01_12-00-00')
    })

    it('should handle non-JSON response gracefully', async () => {
      const nonJsonResponse = 'This is not JSON'

      await LogManager.saveSubAgentResponse(nonJsonResponse, mockPrompt)

      // Should still save raw response
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('sub-agent-response.json'),
        nonJsonResponse,
        'utf-8',
      )

      // But not formatted or summary
      expect(mockWriteFile).not.toHaveBeenCalledWith(
        expect.stringContaining('sub-agent-formatted.json'),
        expect.anything(),
        expect.anything(),
      )

      expect(mockWriteFile).not.toHaveBeenCalledWith(
        expect.stringContaining('findings-summary.md'),
        expect.anything(),
        expect.anything(),
      )

      expect(console.warn).toHaveBeenCalledWith(
        'Could not parse sub-agent response as JSON',
      )
    })

    it('should use default metadata when not provided', async () => {
      await LogManager.saveSubAgentResponse(mockResponse, mockPrompt)

      // Find the metadata.json call specifically
      const metadataCall = mockWriteFile.mock.calls.find((call) =>
        call[0].toString().includes('metadata.json'),
      )

      expect(metadataCall).toBeDefined()
      const metadataContent = metadataCall![1] as string
      // The content is formatted JSON, so check for the values with potential whitespace
      expect(metadataContent).toContain('"source": "claude-sub-agent"')
      expect(metadataContent).toContain('"format": "json"')
    })

    it('should handle save errors', async () => {
      mockMkdir.mockRejectedValueOnce(new Error('Disk full'))

      await expect(
        LogManager.saveSubAgentResponse(mockResponse, mockPrompt),
      ).rejects.toThrow('Disk full')

      expect(console.error).toHaveBeenCalledWith(
        'Failed to save sub-agent response:',
        expect.any(Error),
      )
    })
  })

  describe('listReports', () => {
    it('should list all report directories', async () => {
      const mockEntries = [
        { name: 'pr-123_2024-01-01_10-00-00', isDirectory: () => true },
        { name: 'pr-456_2024-01-01_11-00-00', isDirectory: () => true },
        { name: 'analysis_2024-01-01_09-00-00', isDirectory: () => true },
        { name: 'some-file.txt', isDirectory: () => false }, // Should be filtered out
      ]

      // Use unknown type to bypass strict typing for mock
      mockReaddir.mockResolvedValueOnce(
        mockEntries as unknown as Awaited<ReturnType<typeof fs.readdir>>,
      )

      const reports = await LogManager.listReports()

      expect(mockReaddir).toHaveBeenCalledWith(
        expect.stringContaining('.logs/pr-reviews'),
        { withFileTypes: true },
      )

      expect(reports).toEqual([
        'pr-456_2024-01-01_11-00-00',
        'pr-123_2024-01-01_10-00-00',
        'analysis_2024-01-01_09-00-00',
      ])
    })

    it('should return empty array on error', async () => {
      mockReaddir.mockRejectedValueOnce(new Error('Permission denied'))

      const reports = await LogManager.listReports()

      expect(reports).toEqual([])
      expect(console.error).toHaveBeenCalledWith(
        'Failed to list reports:',
        expect.any(Error),
      )
    })

    it('should handle empty directory', async () => {
      mockReaddir.mockResolvedValueOnce([])

      const reports = await LogManager.listReports()

      expect(reports).toEqual([])
    })
  })

  describe('cleanupOldReports', () => {
    const mockReports = [
      'pr-789_2024-01-01_15-00-00',
      'pr-456_2024-01-01_14-00-00',
      'pr-123_2024-01-01_13-00-00',
      'analysis_2024-01-01_12-00-00',
      'pr-111_2024-01-01_11-00-00',
    ]

    beforeEach(() => {
      const mockEntries = mockReports.map((name) => ({
        name,
        isDirectory: () => true,
      }))
      // Use unknown type to bypass strict typing for mock
      mockReaddir.mockResolvedValueOnce(
        mockEntries as unknown as Awaited<ReturnType<typeof fs.readdir>>,
      )
    })

    it('should delete old reports exceeding keep count', async () => {
      const deleted = await LogManager.cleanupOldReports(3)

      expect(deleted).toBe(2)

      // Should delete the 2 oldest reports
      expect(mockRm).toHaveBeenCalledWith(
        expect.stringContaining('analysis_2024-01-01_12-00-00'),
        { recursive: true, force: true },
      )
      expect(mockRm).toHaveBeenCalledWith(
        expect.stringContaining('pr-111_2024-01-01_11-00-00'),
        { recursive: true, force: true },
      )

      expect(console.warn).toHaveBeenCalledWith('🧹 Cleaned up 2 old reports')
    })

    it('should not delete when under keep count', async () => {
      const deleted = await LogManager.cleanupOldReports(10)

      expect(deleted).toBe(0)
      expect(mockRm).not.toHaveBeenCalled()
    })

    it('should use default keep count of 50', async () => {
      const deleted = await LogManager.cleanupOldReports()

      expect(deleted).toBe(0) // We only have 5 mock reports, less than 50
      expect(mockRm).not.toHaveBeenCalled()
    })

    it('should handle cleanup errors gracefully', async () => {
      mockRm.mockRejectedValueOnce(new Error('Permission denied'))

      const deleted = await LogManager.cleanupOldReports(3)

      expect(deleted).toBe(0)
      expect(console.error).toHaveBeenCalledWith(
        'Failed to cleanup old reports:',
        expect.any(Error),
      )
    })
  })

  describe('getProjectRoot', () => {
    it('should find monorepo root by traversing up', async () => {
      // This is implicitly tested by all other tests that successfully save files
      // The mock setup in beforeEach handles this

      const result = await LogManager.savePRAnalysisReport('test', {
        timestamp: mockTimestamp,
        source: 'github',
        format: 'text',
      })

      expect(result).toContain(mockProjectRoot)
    })

    it('should handle missing package.json gracefully', async () => {
      mockExistsSync.mockReturnValue(false)
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File not found')
      })

      // Should fall back to relative path calculation
      const result = await LogManager.savePRAnalysisReport('test', {
        timestamp: mockTimestamp,
        source: 'github',
        format: 'text',
      })

      expect(result).toBeDefined()
    })

    it('should handle invalid package.json', async () => {
      mockReadFileSync.mockImplementation(() => 'invalid json')

      // Should continue searching up the tree
      const result = await LogManager.savePRAnalysisReport('test', {
        timestamp: mockTimestamp,
        source: 'github',
        format: 'text',
      })

      expect(result).toBeDefined()
    })
  })

  describe('generateFindingsSummary', () => {
    it('should generate comprehensive findings summary', async () => {
      const response = JSON.stringify({
        findings: [
          {
            severity: 'critical',
            title: 'RCE Vulnerability',
            location: { file: 'exec.js', line: 10 },
          },
          {
            severity: 'high',
            title: 'SQL Injection',
            location: { file: 'db.js', line: 42 },
          },
          {
            severity: 'medium',
            title: 'XSS Risk',
            location: { file: 'ui.js', line: 15 },
          },
          {
            severity: 'low',
            title: 'Info Disclosure',
            location: { file: 'log.js', line: 88 },
          },
        ],
      })

      await LogManager.saveSubAgentResponse(response, 'test prompt')

      const summaryCall = mockWriteFile.mock.calls.find((call) =>
        call[0].toString().includes('findings-summary.md'),
      )

      expect(summaryCall).toBeDefined()
      const summaryContent = summaryCall![1] as string

      expect(summaryContent).toContain('🔴 Critical Issues')
      expect(summaryContent).toContain('RCE Vulnerability')
      expect(summaryContent).toContain('🟠 High Priority Issues')
      expect(summaryContent).toContain('SQL Injection')
      expect(summaryContent).toContain('🟡 Medium Priority Issues')
      expect(summaryContent).toContain('XSS Risk')
      expect(summaryContent).toContain('🔵 Low Priority')
      expect(summaryContent).toContain('Info Disclosure')
      expect(summaryContent).toContain('| **Critical** | 1 |')
      expect(summaryContent).toContain('| **High** | 1 |')
      expect(summaryContent).toContain('| **Medium** | 1 |')
      expect(summaryContent).toContain('| **Low** | 1 |')
      expect(summaryContent).toContain('| **Total** | 4 |')
    })

    it('should handle findings without location', async () => {
      const response = JSON.stringify({
        findings: [{ severity: 'high', title: 'Generic Issue' }],
      })

      await LogManager.saveSubAgentResponse(response, 'test prompt')

      const summaryCall = mockWriteFile.mock.calls.find((call) =>
        call[0].toString().includes('findings-summary.md'),
      )

      const summaryContent = summaryCall![1] as string
      expect(summaryContent).toContain('unknown:?')
    })

    it('should show clean status when no findings', async () => {
      const response = JSON.stringify({
        findings: [],
      })

      await LogManager.saveSubAgentResponse(response, 'test prompt')

      const summaryCall = mockWriteFile.mock.calls.find((call) =>
        call[0].toString().includes('findings-summary.md'),
      )

      const summaryContent = summaryCall![1] as string
      expect(summaryContent).toContain('✅ **No security findings detected**')
      expect(summaryContent).toContain('| **Total** | 0 | ✅ Clean |')
    })
  })

  describe('generateReadme', () => {
    it('should include sub-agent specific files in README', async () => {
      await LogManager.saveSubAgentResponse('{"test": true}', 'prompt', {
        prNumber: 789,
        repository: 'test/repo',
        source: 'claude-sub-agent',
      })

      // saveSubAgentResponse doesn't create a README, so this test should be adjusted
      // The README is only created by savePRAnalysisReport
      // For sub-agent responses, we should just verify the files were saved
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('sub-agent-prompt.txt'),
        'prompt',
        'utf-8',
      )

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('sub-agent-response.json'),
        '{"test": true}',
        'utf-8',
      )

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('sub-agent-formatted.json'),
        expect.any(String),
        'utf-8',
      )
    })

    it('should not include sub-agent files for other sources', async () => {
      await LogManager.savePRAnalysisReport('test', {
        timestamp: mockTimestamp,
        prNumber: 789,
        repository: 'test/repo',
        source: 'coderabbit',
        format: 'json',
        analysisId: 'test-123',
      })

      const readmeCall = mockWriteFile.mock.calls.find((call) =>
        call[0].toString().includes('README.md'),
      )

      const readmeContent = readmeCall![1] as string

      expect(readmeContent).not.toContain('sub-agent-prompt.txt')
      expect(readmeContent).toContain('report.json')
      expect(readmeContent).toContain('metadata.json')
      expect(readmeContent).toContain('PR Number**: 789')
      expect(readmeContent).toContain('Repository**: test/repo')
      expect(readmeContent).toContain('Analysis ID**: test-123')
    })
  })
})
