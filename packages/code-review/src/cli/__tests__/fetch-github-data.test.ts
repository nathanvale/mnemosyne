import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { GitHubPRContext } from '../../types/github.js'

// Mock the async-exec module
vi.mock('../../utils/async-exec.js')
vi.mock('node:fs')

// Import after mocks are set up
import { writeFileSync } from 'node:fs'

import * as asyncExec from '../../utils/async-exec.js'
import { GitHubDataFetcher } from '../fetch-github-data.js'

const mockExecFileWithTimeout = vi.mocked(asyncExec.execFileWithTimeout)
const mockExecFileJson = vi.mocked(asyncExec.execFileJson)
const mockWriteFileSync = vi.mocked(writeFileSync)

describe('GitHubDataFetcher', () => {
  // Skip all tests in Wallaby due to async-exec mock limitations
  // These tests execute real commands in Wallaby but work correctly in Vitest
  if (process.env.WALLABY_WORKER) {
    it.skip('skipped in Wallaby.js environment - async-exec mocking not supported', () => {})
    return
  }

  let fetcher: GitHubDataFetcher
  const mockRepo = 'owner/test-repo'
  const mockPRNumber = 123

  // Helper function to create test user
  function createTestUser(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 12345,
      login: 'testuser',
      avatarUrl: 'https://avatars.githubusercontent.com/u/12345',
      url: 'https://github.com/testuser',
      type: 'User',
      ...overrides,
    }
  }

  // Helper function to create test repository
  function createTestRepo(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 67890,
      name: 'test-repo',
      nameWithOwner: 'owner/test-repo',
      isPrivate: false,
      url: 'https://github.com/owner/test-repo',
      defaultBranchRef: { name: 'main' },
      primaryLanguage: { name: 'TypeScript' },
      ...overrides,
    }
  }

  // Helper function to create test PR data
  function createTestPRData(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 98765,
      number: mockPRNumber,
      title: 'Test PR',
      body: 'Test PR description',
      state: 'OPEN',
      mergedAt: null,
      mergeable: true,
      mergeStateStatus: 'clean',
      author: createTestUser(),
      assignees: [],
      reviewRequests: [],
      labels: [],
      baseRefName: 'main',
      headRefName: 'feature-branch',
      baseRefOid: 'abc123',
      headRefOid: 'def456',
      headRepository: createTestRepo(),
      url: 'https://github.com/owner/test-repo/pull/123',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T01:00:00Z',
      closedAt: null,
      mergeCommit: null,
      additions: 10,
      deletions: 5,
      changedFiles: 2,
      commits: { totalCount: 3 },
      comments: { totalCount: 1 },
      isDraft: false,
      ...overrides,
    }
  }

  // Helper function to create test commit
  function createTestCommit(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      oid: 'commit123',
      messageHeadline: 'Test commit',
      messageBody: 'Test commit description',
      authors: [{ name: 'Test Author', email: 'test@example.com' }],
      committer: { name: 'Test Committer', email: 'committer@example.com' },
      committedDate: '2023-01-01T00:00:00Z',
      tree: { oid: 'tree123' },
      url: 'https://github.com/owner/test-repo/commit/commit123',
      ...overrides,
    }
  }

  // Helper function to create test check run
  function createTestCheck(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      name: 'test-check',
      state: 'success',
      conclusion: 'success',
      startedAt: '2023-01-01T00:00:00Z',
      completedAt: '2023-01-01T00:30:00Z',
      link: 'https://github.com/owner/test-repo/actions/runs/123',
      ...overrides,
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    fetcher = new GitHubDataFetcher({
      repo: mockRepo,
      verbose: false,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const defaultFetcher = new GitHubDataFetcher()
      expect(defaultFetcher).toBeDefined()
    })

    it('should merge provided config with defaults', () => {
      const customFetcher = new GitHubDataFetcher({
        repo: 'custom/repo',
        verbose: true,
        includeSecurityAlerts: false,
        includeDiffData: false,
      })
      expect(customFetcher).toBeDefined()
    })
  })

  describe('fetchPRContext', () => {
    it('should fetch complete PR context successfully', async () => {
      // Mock all the individual fetch methods
      const mockPRData = createTestPRData()
      const mockCommits = [createTestCommit()]
      const mockChecks = [createTestCheck()]

      mockExecFileJson
        .mockResolvedValueOnce(mockPRData) // fetchPullRequest
        .mockResolvedValueOnce({ commits: mockCommits }) // fetchCommits
        .mockResolvedValueOnce(mockChecks) // fetchCheckRuns

      mockExecFileWithTimeout
        .mockResolvedValueOnce('src/file1.ts\nsrc/file2.ts') // fetchFileChanges file list
        .mockResolvedValueOnce(
          '--- a/src/file1.ts\n+++ b/src/file1.ts\n@@ -1,3 +1,4 @@\n+new line\n existing line',
        ) // file1 diff
        .mockResolvedValueOnce(
          '--- a/src/file2.ts\n+++ b/src/file2.ts\n@@ -1,2 +1,1 @@\n-deleted line',
        ) // file2 diff

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result).toBeDefined()
      expect(result.pullRequest.number).toBe(mockPRNumber)
      expect(result.files).toHaveLength(2)
      expect(result.commits).toHaveLength(1)
      expect(result.checkRuns).toHaveLength(1)
      expect(result.metadata.fetchedAt).toBeDefined()
    })

    it('should use provided repo parameter over config', async () => {
      const customRepo = 'different/repo'
      const mockPRData = createTestPRData()

      mockExecFileJson.mockResolvedValueOnce(mockPRData)
      mockExecFileWithTimeout.mockResolvedValueOnce('')
      mockExecFileJson
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])

      await fetcher.fetchPRContext(mockPRNumber, customRepo)

      expect(mockExecFileJson).toHaveBeenCalledWith(
        'gh',
        expect.arrayContaining(['--repo', customRepo]),
      )
    })

    it('should throw error when no repository specified', async () => {
      const noRepoFetcher = new GitHubDataFetcher()

      await expect(noRepoFetcher.fetchPRContext(mockPRNumber)).rejects.toThrow(
        'Repository must be specified',
      )
    })

    it('should handle fetch errors gracefully', async () => {
      mockExecFileJson.mockRejectedValueOnce(new Error('GitHub API error'))

      await expect(fetcher.fetchPRContext(mockPRNumber)).rejects.toThrow(
        'GitHub API error',
      )
    })

    it('should skip security alerts when disabled', async () => {
      const noSecurityFetcher = new GitHubDataFetcher({
        repo: mockRepo,
        includeSecurityAlerts: false,
      })

      const mockPRData = createTestPRData()
      mockExecFileJson
        .mockResolvedValueOnce(mockPRData)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])
      mockExecFileWithTimeout.mockResolvedValueOnce('')

      const result = await noSecurityFetcher.fetchPRContext(mockPRNumber)

      expect(result.securityAlerts).toEqual([])
    })
  })

  describe('data transformation', () => {
    it('should handle merged PR state correctly', async () => {
      const mergedPRData = createTestPRData({
        state: 'CLOSED',
        mergedAt: '2023-01-01T12:00:00Z',
      })

      mockExecFileJson
        .mockResolvedValueOnce(mergedPRData)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])
      mockExecFileWithTimeout.mockResolvedValueOnce('')

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result.pullRequest.state).toBe('merged')
      expect(result.pullRequest.merged).toBe(true)
    })

    it('should handle string ID conversion', async () => {
      const prDataWithStringId = createTestPRData({
        id: '98765',
        author: createTestUser({ id: '12345' }),
      })

      mockExecFileJson
        .mockResolvedValueOnce(prDataWithStringId)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])
      mockExecFileWithTimeout.mockResolvedValueOnce('')

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result.pullRequest.id).toBe(98765)
      expect(result.pullRequest.user.id).toBe(12345)
    })

    it('should handle invalid string ID conversion', async () => {
      const prDataWithInvalidId = createTestPRData({
        id: 'invalid-id',
        author: createTestUser({ id: 'invalid-id' }),
      })

      mockExecFileJson
        .mockResolvedValueOnce(prDataWithInvalidId)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])
      mockExecFileWithTimeout.mockResolvedValueOnce('')

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result.pullRequest.id).toBe(0)
      expect(result.pullRequest.user.id).toBe(0)
    })

    it('should handle Bot user type', async () => {
      const prDataWithBot = createTestPRData({
        author: createTestUser({ type: 'Bot' }),
      })

      mockExecFileJson
        .mockResolvedValueOnce(prDataWithBot)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])
      mockExecFileWithTimeout.mockResolvedValueOnce('')

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result.pullRequest.user.type).toBe('Bot')
    })
  })

  describe('file changes processing', () => {
    it('should process file additions correctly', async () => {
      const mockPRData = createTestPRData()

      mockExecFileJson
        .mockResolvedValueOnce(mockPRData)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])

      mockExecFileWithTimeout
        .mockResolvedValueOnce('src/new-file.ts')
        .mockResolvedValueOnce(
          'new file mode 100644\n--- /dev/null\n+++ b/src/new-file.ts\n@@ -0,0 +1,10 @@\n+new content',
        )

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result.files).toHaveLength(1)
      expect(result.files[0].status).toBe('added')
      expect(result.files[0].additions).toBeGreaterThan(0)
    })

    it('should process file deletions correctly', async () => {
      const mockPRData = createTestPRData()

      mockExecFileJson
        .mockResolvedValueOnce(mockPRData)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])

      mockExecFileWithTimeout
        .mockResolvedValueOnce('src/deleted-file.ts')
        .mockResolvedValueOnce(
          'deleted file mode 100644\n--- a/src/deleted-file.ts\n+++ /dev/null\n@@ -1,5 +0,0 @@\n-deleted content',
        )

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result.files[0].status).toBe('removed')
      expect(result.files[0].deletions).toBeGreaterThan(0)
    })

    it('should process file renames correctly', async () => {
      const mockPRData = createTestPRData()

      mockExecFileJson
        .mockResolvedValueOnce(mockPRData)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])

      mockExecFileWithTimeout
        .mockResolvedValueOnce('src/renamed-file.ts')
        .mockResolvedValueOnce(
          'rename from src/old-name.ts\nrename to src/renamed-file.ts',
        )

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result.files[0].status).toBe('renamed')
    })

    it('should handle file diff errors gracefully', async () => {
      const mockPRData = createTestPRData()

      mockExecFileJson
        .mockResolvedValueOnce(mockPRData)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])

      mockExecFileWithTimeout
        .mockResolvedValueOnce('src/error-file.ts')
        .mockRejectedValueOnce(new Error('Cannot get diff'))

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result.files).toHaveLength(1)
      expect(result.files[0].status).toBe('modified')
      expect(result.files[0].additions).toBe(0)
      expect(result.files[0].deletions).toBe(0)
    })

    it('should exclude patch data when disabled', async () => {
      const noDiffFetcher = new GitHubDataFetcher({
        repo: mockRepo,
        includeDiffData: false,
      })

      const mockPRData = createTestPRData()

      mockExecFileJson
        .mockResolvedValueOnce(mockPRData)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])

      mockExecFileWithTimeout
        .mockResolvedValueOnce('src/file.ts')
        .mockResolvedValueOnce(
          '--- a/src/file.ts\n+++ b/src/file.ts\n@@ -1,1 +1,2 @@\n+new line',
        )

      const result = await noDiffFetcher.fetchPRContext(mockPRNumber)

      expect(result.files[0].patch).toBeUndefined()
    })
  })

  describe('commits processing', () => {
    it('should handle commits with message body', async () => {
      const mockPRData = createTestPRData()
      const commitWithBody = createTestCommit({
        messageHeadline: 'Fix bug',
        messageBody: 'This fixes the issue with parsing',
      })

      mockExecFileJson
        .mockResolvedValueOnce(mockPRData)
        .mockResolvedValueOnce({ commits: [commitWithBody] })
        .mockResolvedValueOnce([])
      mockExecFileWithTimeout.mockResolvedValueOnce('')

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result.commits[0].message).toBe(
        'Fix bug\n\nThis fixes the issue with parsing',
      )
    })

    it('should handle commits without authors gracefully', async () => {
      const mockPRData = createTestPRData()
      const commitWithoutAuthors = createTestCommit({
        authors: undefined,
        committer: undefined,
      })

      mockExecFileJson
        .mockResolvedValueOnce(mockPRData)
        .mockResolvedValueOnce({ commits: [commitWithoutAuthors] })
        .mockResolvedValueOnce([])
      mockExecFileWithTimeout.mockResolvedValueOnce('')

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result.commits[0].author.name).toBe('Unknown')
      expect(result.commits[0].author.email).toBe('unknown@example.com')
      expect(result.commits[0].committer.name).toBe('Unknown')
    })
  })

  describe('check runs processing', () => {
    it('should map check statuses correctly', async () => {
      const mockPRData = createTestPRData()
      const checks = [
        createTestCheck({ state: 'pending' }),
        createTestCheck({ state: 'success' }),
        createTestCheck({ state: 'failure' }),
      ]

      mockExecFileJson
        .mockResolvedValueOnce(mockPRData)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce(checks)
      mockExecFileWithTimeout.mockResolvedValueOnce('')

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result.checkRuns[0].status).toBe('in_progress')
      expect(result.checkRuns[1].status).toBe('completed')
      expect(result.checkRuns[2].status).toBe('completed')
    })

    it('should handle check runs fetch failure', async () => {
      const mockPRData = createTestPRData()

      mockExecFileJson
        .mockResolvedValueOnce(mockPRData)
        .mockResolvedValueOnce({ commits: [] })
        .mockRejectedValueOnce(new Error('No access to checks'))
      mockExecFileWithTimeout.mockResolvedValueOnce('')

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result.checkRuns).toEqual([])
    })
  })

  describe('security alerts processing', () => {
    it('should handle security alerts fetch failure', async () => {
      const mockPRData = createTestPRData()

      mockExecFileJson
        .mockResolvedValueOnce(mockPRData)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])
        .mockRejectedValueOnce(new Error('No access to security alerts'))
      mockExecFileWithTimeout.mockResolvedValueOnce('')

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result.securityAlerts).toEqual([])
    })

    it('should process security alerts correctly', async () => {
      const mockPRData = createTestPRData()
      const securityAlert = {
        id: 123,
        state: 'open',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T01:00:00Z',
        fixed_at: null,
        dismissed_at: null,
        ghsa_id: 'GHSA-xxxx-xxxx-xxxx',
        cve_id: 'CVE-2023-1234',
        summary: 'Test vulnerability',
        description: 'Test vulnerability description',
        severity: 'high',
        cvss: {
          vector_string: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
          score: 9.8,
        },
        package: { name: 'test-package', ecosystem: 'npm' },
        vulnerable_version_range: '<1.0.0',
        first_patched_version: '1.0.0',
        url: 'https://api.github.com/repos/owner/repo/security-advisories/123',
        html_url:
          'https://github.com/owner/repo/security/advisories/GHSA-xxxx-xxxx-xxxx',
      }

      mockExecFileJson
        .mockResolvedValueOnce(mockPRData)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([securityAlert])
      mockExecFileWithTimeout.mockResolvedValueOnce('')

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result.securityAlerts).toHaveLength(1)
      expect(result.securityAlerts[0].state).toBe('open')
      expect(result.securityAlerts[0].security_advisory.severity).toBe('high')
    })
  })

  describe('metadata calculation', () => {
    it('should identify affected components correctly', async () => {
      const mockPRData = createTestPRData()

      mockExecFileJson
        .mockResolvedValueOnce(mockPRData)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])

      mockExecFileWithTimeout
        .mockResolvedValueOnce(
          'src/components/Button.tsx\nsrc/api/users.ts\nschema.sql\nsrc/__tests__/utils.test.ts\nREADME.md\npackage.json',
        )
        .mockResolvedValueOnce('+new line') // Button.tsx
        .mockResolvedValueOnce('+api change') // users.ts
        .mockResolvedValueOnce('+schema change') // schema.sql
        .mockResolvedValueOnce('+test change') // utils.test.ts
        .mockResolvedValueOnce('+doc change') // README.md
        .mockResolvedValueOnce('+config change') // package.json

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result.metadata.affectedComponents).toContain('frontend')
      expect(result.metadata.affectedComponents).toContain('backend')
      expect(result.metadata.affectedComponents).toContain('database')
      expect(result.metadata.affectedComponents).toContain('testing')
      expect(result.metadata.affectedComponents).toContain('documentation')
      expect(result.metadata.affectedComponents).toContain('configuration')
    })

    it('should calculate complexity score correctly', async () => {
      const mockPRData = createTestPRData()

      mockExecFileJson
        .mockResolvedValueOnce(mockPRData)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])

      mockExecFileWithTimeout
        .mockResolvedValueOnce(
          'src/complex.ts\nmigrations/001.sql\nconfig/app.json',
        )
        .mockResolvedValueOnce(Array(50).fill('+new line').join('\n')) // 50 additions
        .mockResolvedValueOnce('+migration change')
        .mockResolvedValueOnce('+config change')

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result.metadata.complexityScore).toBeGreaterThan(0)
      expect(result.metadata.complexityScore).toBeLessThanOrEqual(50) // Should be capped
    })

    it('should calculate total lines changed', async () => {
      const mockPRData = createTestPRData()

      mockExecFileJson
        .mockResolvedValueOnce(mockPRData)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])

      mockExecFileWithTimeout
        .mockResolvedValueOnce('src/file1.ts\nsrc/file2.ts')
        .mockResolvedValueOnce('+++\n+++\n---') // 2 additions, 1 deletion
        .mockResolvedValueOnce('+++\n---\n---') // 1 addition, 2 deletions

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result.metadata.totalLinesChanged).toBe(6) // 3 + 3
    })
  })

  describe('savePRContext', () => {
    it('should save PR context to specified file', async () => {
      const mockContext = {
        pullRequest: { number: 123 },
      } as unknown as GitHubPRContext

      const outputFile = 'custom-output.json'

      const result = await fetcher.savePRContext(mockContext, outputFile)

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        outputFile,
        JSON.stringify(mockContext, null, 2),
      )
      expect(result).toBe(outputFile)
    })

    it('should use default filename when not specified', async () => {
      const mockContext = {
        pullRequest: { number: 123 },
      } as unknown as GitHubPRContext

      const result = await fetcher.savePRContext(mockContext)

      expect(result).toBe('pr-123-context.json')
    })

    it('should use config output file when available', async () => {
      const fetcherWithOutputFile = new GitHubDataFetcher({
        outputFile: 'config-output.json',
      })

      const mockContext = {
        pullRequest: { number: 123 },
      } as unknown as GitHubPRContext

      const result = await fetcherWithOutputFile.savePRContext(mockContext)

      expect(result).toBe('config-output.json')
    })
  })

  describe('input validation', () => {
    it('should validate repository name format', async () => {
      await expect(
        fetcher.fetchPRContext(123, 'invalid-repo-name'),
      ).rejects.toThrow('Invalid repository format')
    })

    it('should validate PR number is positive integer', async () => {
      await expect(fetcher.fetchPRContext(-1)).rejects.toThrow(
        'Invalid PR number',
      )

      await expect(fetcher.fetchPRContext(0)).rejects.toThrow(
        'Invalid PR number',
      )
    })
  })

  describe('verbose logging', () => {
    it('should log messages when verbose is enabled', async () => {
      const verboseFetcher = new GitHubDataFetcher({
        repo: mockRepo,
        verbose: true,
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const mockPRData = createTestPRData()
      mockExecFileJson
        .mockResolvedValueOnce(mockPRData)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])
      mockExecFileWithTimeout.mockResolvedValueOnce('')

      await verboseFetcher.fetchPRContext(mockPRNumber)

      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it('should not log when verbose is disabled', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const mockPRData = createTestPRData()
      mockExecFileJson
        .mockResolvedValueOnce(mockPRData)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])
      mockExecFileWithTimeout.mockResolvedValueOnce('')

      await fetcher.fetchPRContext(mockPRNumber)

      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('edge cases', () => {
    it('should handle empty file list', async () => {
      const mockPRData = createTestPRData()

      mockExecFileJson
        .mockResolvedValueOnce(mockPRData)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])
      mockExecFileWithTimeout.mockResolvedValueOnce('') // Empty file list

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result.files).toEqual([])
      expect(result.metadata.totalLinesChanged).toBe(0)
    })

    it('should handle missing optional fields', async () => {
      const minimalPRData = {
        id: 123,
        number: mockPRNumber,
        title: 'Minimal PR',
        state: 'OPEN',
        author: { login: 'user' },
        baseRefName: 'main',
        headRefName: 'feature',
        baseRefOid: 'abc',
        headRefOid: 'def',
        headRepository: {
          name: 'repo',
          nameWithOwner: 'owner/repo',
          isPrivate: false,
          url: 'https://github.com/owner/repo',
        },
        url: 'https://github.com/owner/repo/pull/123',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        isDraft: false,
      }

      mockExecFileJson
        .mockResolvedValueOnce(minimalPRData)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])
      mockExecFileWithTimeout.mockResolvedValueOnce('')

      const result = await fetcher.fetchPRContext(mockPRNumber)

      expect(result.pullRequest.body).toBeNull()
      expect(result.pullRequest.assignees).toEqual([])
      expect(result.pullRequest.labels).toEqual([])
    })

    it('should validate final context with Zod schema', async () => {
      const mockPRData = createTestPRData()

      mockExecFileJson
        .mockResolvedValueOnce(mockPRData)
        .mockResolvedValueOnce({ commits: [] })
        .mockResolvedValueOnce([])
      mockExecFileWithTimeout.mockResolvedValueOnce('')

      const result = await fetcher.fetchPRContext(mockPRNumber)

      // Should not throw - the result should be valid according to the schema
      expect(result).toBeDefined()
      expect(result.pullRequest).toBeDefined()
      expect(result.files).toBeDefined()
      expect(result.commits).toBeDefined()
      expect(result.checkRuns).toBeDefined()
      expect(result.securityAlerts).toBeDefined()
      expect(result.metadata).toBeDefined()
    })
  })
})
