import { describe, it, expect } from 'vitest'

import { GitHubParser } from '../github-parser.js'

// Helper function to create a valid GitHub user
const createTestUser = (login = 'testuser', id = 1) => ({
  id,
  login,
  avatar_url: `https://github.com/${login}.png`,
  html_url: `https://github.com/${login}`,
  type: 'User' as const,
})

// Helper function to create a valid GitHub repository
const createTestRepo = (name = 'repo', owner = 'test') => ({
  id: 1,
  name,
  full_name: `${owner}/${name}`,
  private: false,
  html_url: `https://github.com/${owner}/${name}`,
  default_branch: 'main',
  language: 'TypeScript' as string | null,
  languages_url: `https://api.github.com/repos/${owner}/${name}/languages`,
})

describe('GitHubParser', () => {
  describe('parsePRContext', () => {
    it('should parse valid PR context data', () => {
      const validPRContext = {
        pullRequest: {
          id: 123,
          number: 456,
          title: 'Test PR',
          body: 'Test description',
          state: 'open' as const,
          merged: false,
          mergeable: true,
          mergeable_state: 'clean',
          user: createTestUser(),
          assignees: [],
          requested_reviewers: [],
          labels: [],
          base: {
            ref: 'main',
            sha: 'abc123',
            repo: createTestRepo(),
          },
          head: {
            ref: 'feature',
            sha: 'def456',
            repo: createTestRepo(),
          },
          html_url: 'https://github.com/test/repo/pull/456',
          diff_url: 'https://github.com/test/repo/pull/456.diff',
          patch_url: 'https://github.com/test/repo/pull/456.patch',
          commits_url: 'https://github.com/test/repo/pull/456/commits',
          comments_url: 'https://github.com/test/repo/pull/456/comments',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          closed_at: null,
          merged_at: null,
          merge_commit_sha: null,
          additions: 10,
          deletions: 5,
          changed_files: 2,
          commits: 1,
          comments: 0,
          review_comments: 0,
          maintainer_can_modify: true,
          draft: false,
        },
        files: [],
        commits: [],
        checkRuns: [],
        securityAlerts: [],
        metadata: {
          fetchedAt: '2024-01-01T00:00:00Z',
          totalLinesChanged: 15,
          affectedComponents: [],
          complexityScore: 2,
        },
      }

      const result = GitHubParser.parsePRContext(validPRContext)
      expect(result).not.toBeNull()
      expect(result?.pullRequest.title).toBe('Test PR')
      expect(result?.pullRequest.number).toBe(456)
    })

    it('should return null for invalid PR context data', () => {
      const invalidData = {
        invalidField: 'test',
      }

      const result = GitHubParser.parsePRContext(invalidData)
      expect(result).toBeNull()
    })

    it('should handle null input', () => {
      const result = GitHubParser.parsePRContext(null)
      expect(result).toBeNull()
    })

    it('should handle undefined input', () => {
      const result = GitHubParser.parsePRContext(undefined)
      expect(result).toBeNull()
    })
  })

  describe('parsePullRequest', () => {
    it('should parse valid pull request data', () => {
      const validPR = {
        id: 123,
        number: 456,
        title: 'Test PR',
        body: 'Test description',
        state: 'open' as const,
        merged: false,
        mergeable: true,
        mergeable_state: 'clean',
        user: createTestUser(),
        assignees: [],
        requested_reviewers: [],
        labels: [],
        base: {
          ref: 'main',
          sha: 'abc123',
          repo: createTestRepo(),
        },
        head: {
          ref: 'feature',
          sha: 'def456',
          repo: createTestRepo(),
        },
        html_url: 'https://github.com/test/repo/pull/456',
        diff_url: 'https://github.com/test/repo/pull/456.diff',
        patch_url: 'https://github.com/test/repo/pull/456.patch',
        commits_url: 'https://github.com/test/repo/pull/456/commits',
        comments_url: 'https://github.com/test/repo/pull/456/comments',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        closed_at: null,
        merged_at: null,
        merge_commit_sha: null,
        additions: 10,
        deletions: 5,
        changed_files: 2,
        commits: 1,
        comments: 0,
        review_comments: 0,
        maintainer_can_modify: true,
        draft: false,
      }

      const result = GitHubParser.parsePullRequest(validPR)
      expect(result).not.toBeNull()
      expect(result?.title).toBe('Test PR')
      expect(result?.state).toBe('open')
      expect(result?.merged).toBe(false)
    })

    it('should return null for invalid pull request data', () => {
      const invalidPR = {
        title: 'Test PR',
        // Missing required fields
      }

      const result = GitHubParser.parsePullRequest(invalidPR)
      expect(result).toBeNull()
    })

    it('should handle missing optional fields', () => {
      const prWithoutOptionals = {
        id: 123,
        number: 456,
        title: 'Test PR',
        body: null,
        state: 'open' as const,
        merged: false,
        mergeable: null,
        mergeable_state: 'unknown',
        user: createTestUser(),
        assignees: [],
        requested_reviewers: [],
        labels: [],
        base: {
          ref: 'main',
          sha: 'abc123',
          repo: createTestRepo(),
        },
        head: {
          ref: 'feature',
          sha: 'def456',
          repo: null,
        },
        html_url: 'https://github.com/test/repo/pull/456',
        diff_url: 'https://github.com/test/repo/pull/456.diff',
        patch_url: 'https://github.com/test/repo/pull/456.patch',
        commits_url: 'https://github.com/test/repo/pull/456/commits',
        comments_url: 'https://github.com/test/repo/pull/456/comments',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        closed_at: null,
        merged_at: null,
        merge_commit_sha: null,
        additions: 10,
        deletions: 5,
        changed_files: 2,
        commits: 1,
        comments: 0,
        review_comments: 0,
        maintainer_can_modify: false,
        draft: false,
      }

      const result = GitHubParser.parsePullRequest(prWithoutOptionals)
      expect(result).not.toBeNull()
      expect(result?.body).toBeNull()
    })
  })

  describe('parseFileChanges', () => {
    it('should parse valid file changes array', () => {
      const validFileChanges = [
        {
          sha: 'abc123',
          filename: 'src/test.ts',
          status: 'modified' as const,
          additions: 5,
          deletions: 2,
          changes: 7,
          blob_url: 'https://github.com/test/repo/blob/abc123/src/test.ts',
          raw_url: 'https://github.com/test/repo/raw/abc123/src/test.ts',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/src/test.ts',
          patch: '@@ -1,3 +1,6 @@',
        },
        {
          sha: 'def456',
          filename: 'src/new.ts',
          status: 'added' as const,
          additions: 10,
          deletions: 0,
          changes: 10,
          blob_url: 'https://github.com/test/repo/blob/def456/src/new.ts',
          raw_url: 'https://github.com/test/repo/raw/def456/src/new.ts',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/src/new.ts',
          patch: '@@ -0,0 +1,10 @@',
        },
      ]

      const result = GitHubParser.parseFileChanges(validFileChanges)
      expect(result).toHaveLength(2)
      expect(result[0].filename).toBe('src/test.ts')
      expect(result[0].status).toBe('modified')
      expect(result[1].filename).toBe('src/new.ts')
      expect(result[1].status).toBe('added')
    })

    it('should filter out invalid file changes', () => {
      const mixedFileChanges = [
        {
          sha: 'abc123',
          filename: 'src/valid.ts',
          status: 'modified' as const,
          additions: 5,
          deletions: 2,
          changes: 7,
          blob_url: 'https://github.com/test/repo/blob/abc123/src/valid.ts',
          raw_url: 'https://github.com/test/repo/raw/abc123/src/valid.ts',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/src/valid.ts',
          patch: '@@ -1,3 +1,6 @@',
        },
        {
          // Invalid - missing required fields
          filename: 'src/invalid.ts',
        },
        {
          sha: 'def456',
          filename: 'src/another-valid.ts',
          status: 'added' as const,
          additions: 3,
          deletions: 0,
          changes: 3,
          blob_url:
            'https://github.com/test/repo/blob/def456/src/another-valid.ts',
          raw_url:
            'https://github.com/test/repo/raw/def456/src/another-valid.ts',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/src/another-valid.ts',
          patch: '@@ -0,0 +1,3 @@',
        },
      ]

      const result = GitHubParser.parseFileChanges(mixedFileChanges)
      expect(result).toHaveLength(2)
      expect(result[0].filename).toBe('src/valid.ts')
      expect(result[1].filename).toBe('src/another-valid.ts')
    })

    it('should return empty array for non-array input', () => {
      const nonArrayInput = {
        filename: 'test.ts',
        status: 'modified',
      }

      const result = GitHubParser.parseFileChanges(nonArrayInput)
      expect(result).toEqual([])
    })

    it('should return empty array for null input', () => {
      const result = GitHubParser.parseFileChanges(null)
      expect(result).toEqual([])
    })

    it('should return empty array for undefined input', () => {
      const result = GitHubParser.parseFileChanges(undefined)
      expect(result).toEqual([])
    })
  })

  describe('parseCommits', () => {
    it('should parse valid commits array', () => {
      const validCommits = [
        {
          sha: 'abc123',
          message: 'Initial commit',
          author: {
            name: 'testuser',
            email: 'test@example.com',
            date: '2024-01-01T00:00:00Z',
          },
          committer: {
            name: 'testuser',
            email: 'test@example.com',
            date: '2024-01-01T00:00:00Z',
          },
          tree: {
            sha: 'tree123',
          },
          url: 'https://github.com/test/repo/commit/abc123',
          comment_count: 0,
        },
        {
          sha: 'def456',
          message: 'Add feature',
          author: {
            name: 'testuser2',
            email: 'test2@example.com',
            date: '2024-01-02T00:00:00Z',
          },
          committer: {
            name: 'testuser2',
            email: 'test2@example.com',
            date: '2024-01-02T00:00:00Z',
          },
          tree: {
            sha: 'tree456',
          },
          url: 'https://github.com/test/repo/commit/def456',
          comment_count: 1,
        },
      ]

      const result = GitHubParser.parseCommits(validCommits)
      expect(result).toHaveLength(2)
      expect(result[0].sha).toBe('abc123')
      expect(result[0].message).toBe('Initial commit')
      expect(result[1].sha).toBe('def456')
      expect(result[1].author.name).toBe('testuser2')
    })

    it('should filter out invalid commits', () => {
      const mixedCommits = [
        {
          sha: 'abc123',
          message: 'Valid commit',
          author: {
            name: 'testuser',
            email: 'test@example.com',
            date: '2024-01-01T00:00:00Z',
          },
          committer: {
            name: 'testuser',
            email: 'test@example.com',
            date: '2024-01-01T00:00:00Z',
          },
          tree: {
            sha: 'tree123',
          },
          url: 'https://github.com/test/repo/commit/abc123',
          comment_count: 0,
        },
        {
          // Invalid - missing required fields
          message: 'Invalid commit',
        },
      ]

      const result = GitHubParser.parseCommits(mixedCommits)
      expect(result).toHaveLength(1)
      expect(result[0].sha).toBe('abc123')
    })

    it('should return empty array for non-array input', () => {
      const result = GitHubParser.parseCommits('not an array')
      expect(result).toEqual([])
    })
  })

  describe('parseCheckRuns', () => {
    it('should parse valid check runs array', () => {
      const validCheckRuns = [
        {
          id: 1,
          name: 'CI',
          status: 'completed' as const,
          conclusion: 'success' as const,
          started_at: '2024-01-01T00:00:00Z',
          completed_at: '2024-01-01T00:05:00Z',
          output: {
            title: 'Success',
            summary: 'All tests passed',
            text: 'Detailed output',
            annotations_count: 0,
            annotations_url:
              'https://api.github.com/repos/test/repo/check-runs/1/annotations',
          },
          html_url: 'https://github.com/test/repo/runs/1',
        },
        {
          id: 2,
          name: 'Tests',
          status: 'completed' as const,
          conclusion: 'failure' as const,
          started_at: '2024-01-01T00:00:00Z',
          completed_at: '2024-01-01T00:03:00Z',
          output: {
            title: 'Failed',
            summary: 'Some tests failed',
            text: null,
            annotations_count: 3,
            annotations_url:
              'https://api.github.com/repos/test/repo/check-runs/2/annotations',
          },
          html_url: 'https://github.com/test/repo/runs/2',
        },
      ]

      const result = GitHubParser.parseCheckRuns(validCheckRuns)
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('CI')
      expect(result[0].conclusion).toBe('success')
      expect(result[1].name).toBe('Tests')
      expect(result[1].conclusion).toBe('failure')
    })

    it('should filter out invalid check runs', () => {
      const mixedCheckRuns = [
        {
          id: 1,
          name: 'Valid Check',
          status: 'completed' as const,
          conclusion: 'success' as const,
          started_at: '2024-01-01T00:00:00Z',
          completed_at: '2024-01-01T00:05:00Z',
          output: {
            title: 'Success',
            summary: 'Check passed',
            text: null,
            annotations_count: 0,
            annotations_url:
              'https://api.github.com/repos/test/repo/check-runs/1/annotations',
          },
          html_url: 'https://github.com/test/repo/runs/1',
        },
        {
          // Invalid - missing required fields
          name: 'Invalid Check',
        },
      ]

      const result = GitHubParser.parseCheckRuns(mixedCheckRuns)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Valid Check')
    })

    it('should return empty array for non-array input', () => {
      const result = GitHubParser.parseCheckRuns({ name: 'test' })
      expect(result).toEqual([])
    })
  })

  describe('parseSecurityAlerts', () => {
    it('should parse valid security alerts array', () => {
      const validSecurityAlerts = [
        {
          number: 1,
          state: 'open' as const,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          fixed_at: null,
          dismissed_at: null,
          security_advisory: {
            ghsa_id: 'GHSA-1234-5678-9012',
            cve_id: 'CVE-2024-1234',
            summary: 'Test vulnerability',
            description: 'A test security issue',
            severity: 'high' as const,
            cvss: {
              vector_string: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
              score: 9.8,
            },
          },
          security_vulnerability: {
            package: {
              name: 'test-package',
              ecosystem: 'npm',
            },
            vulnerable_version_range: '< 1.0.0',
            first_patched_version: {
              identifier: '1.0.0',
            },
          },
          url: 'https://api.github.com/repos/test/repo/security-advisories/1',
          html_url:
            'https://github.com/test/repo/security/advisories/GHSA-1234-5678-9012',
        },
      ]

      const result = GitHubParser.parseSecurityAlerts(validSecurityAlerts)
      expect(result).toHaveLength(1)
      expect(result[0].number).toBe(1)
      expect(result[0].state).toBe('open')
      expect(result[0].security_advisory.severity).toBe('high')
      expect(result[0].security_vulnerability.package.name).toBe('test-package')
    })

    it('should filter out invalid security alerts', () => {
      const mixedSecurityAlerts = [
        {
          number: 1,
          state: 'open' as const,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          fixed_at: null,
          dismissed_at: null,
          security_advisory: {
            ghsa_id: 'GHSA-1234-5678-9012',
            cve_id: null,
            summary: 'Test vulnerability',
            description: 'A test security issue',
            severity: 'medium' as const,
            cvss: {
              vector_string: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:L',
              score: 6.3,
            },
          },
          security_vulnerability: {
            package: {
              name: 'test-package',
              ecosystem: 'npm',
            },
            vulnerable_version_range: '< 1.0.0',
            first_patched_version: null,
          },
          url: 'https://api.github.com/repos/test/repo/security-advisories/1',
          html_url:
            'https://github.com/test/repo/security/advisories/GHSA-1234-5678-9012',
        },
        {
          // Invalid - missing required fields
          number: 2,
          state: 'fixed' as const,
        },
      ]

      const result = GitHubParser.parseSecurityAlerts(mixedSecurityAlerts)
      expect(result).toHaveLength(1)
      expect(result[0].number).toBe(1)
    })

    it('should return empty array for non-array input', () => {
      const result = GitHubParser.parseSecurityAlerts({ number: 1 })
      expect(result).toEqual([])
    })
  })

  describe('extractPRMetadata', () => {
    it('should extract metadata from PR and files', () => {
      const pr = {
        id: 123,
        number: 456,
        title: 'Add new feature',
        body: 'This PR adds a new feature with tests',
        state: 'open' as const,
        merged: false,
        mergeable: true,
        mergeable_state: 'clean',
        user: createTestUser(),
        assignees: [createTestUser('reviewer1', 2)],
        requested_reviewers: [],
        labels: [
          {
            id: 1,
            name: 'enhancement',
            color: 'a2eeef',
            description: 'New feature',
          },
          { id: 2, name: 'needs-review', color: 'fbca04', description: null },
        ],
        base: {
          ref: 'main',
          sha: 'abc123',
          repo: createTestRepo(),
        },
        head: {
          ref: 'feature/new-feature',
          sha: 'def456',
          repo: createTestRepo(),
        },
        html_url: 'https://github.com/test/repo/pull/456',
        diff_url: 'https://github.com/test/repo/pull/456.diff',
        patch_url: 'https://github.com/test/repo/pull/456.patch',
        commits_url: 'https://github.com/test/repo/pull/456/commits',
        comments_url: 'https://github.com/test/repo/pull/456/comments',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T01:00:00Z',
        closed_at: null,
        merged_at: null,
        merge_commit_sha: null,
        additions: 150,
        deletions: 25,
        changed_files: 8,
        commits: 3,
        comments: 2,
        review_comments: 1,
        maintainer_can_modify: true,
        draft: false,
      }

      const files = [
        {
          sha: 'abc123',
          filename: 'src/feature.ts',
          status: 'added' as const,
          additions: 100,
          deletions: 0,
          changes: 100,
          blob_url: 'https://github.com/test/repo/blob/abc123/src/feature.ts',
          raw_url: 'https://github.com/test/repo/raw/abc123/src/feature.ts',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/src/feature.ts',
          patch: '@@ -0,0 +1,100 @@',
        },
        {
          sha: 'def456',
          filename: 'src/feature.test.ts',
          status: 'added' as const,
          additions: 50,
          deletions: 0,
          changes: 50,
          blob_url:
            'https://github.com/test/repo/blob/def456/src/feature.test.ts',
          raw_url:
            'https://github.com/test/repo/raw/def456/src/feature.test.ts',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/src/feature.test.ts',
          patch: '@@ -0,0 +1,50 @@',
        },
      ]

      const result = GitHubParser.extractPRMetadata(pr, files)
      expect(result).toBeDefined()
      expect(result.size).toBe('medium') // 175 lines (150+25)
      expect(result.isDraft).toBe(false)
      expect(result.hasBreakingChanges).toBe(false)
      expect(result.touchesCriticalFiles).toBe(false)
      expect(result.estimatedReviewTime).toBeGreaterThanOrEqual(10)
    })

    it('should detect draft PR', () => {
      const draftPR = {
        id: 123,
        number: 456,
        title: 'WIP: Add new feature',
        body: 'Work in progress',
        state: 'open' as const,
        merged: false,
        mergeable: true,
        mergeable_state: 'clean',
        user: createTestUser(),
        assignees: [],
        requested_reviewers: [],
        labels: [],
        base: {
          ref: 'main',
          sha: 'abc123',
          repo: createTestRepo(),
        },
        head: {
          ref: 'feature/wip',
          sha: 'def456',
          repo: createTestRepo(),
        },
        html_url: 'https://github.com/test/repo/pull/456',
        diff_url: 'https://github.com/test/repo/pull/456.diff',
        patch_url: 'https://github.com/test/repo/pull/456.patch',
        commits_url: 'https://github.com/test/repo/pull/456/commits',
        comments_url: 'https://github.com/test/repo/pull/456/comments',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        closed_at: null,
        merged_at: null,
        merge_commit_sha: null,
        additions: 30,
        deletions: 5,
        changed_files: 2,
        commits: 1,
        comments: 0,
        review_comments: 0,
        maintainer_can_modify: true,
        draft: true,
      }

      const result = GitHubParser.extractPRMetadata(draftPR, [])
      expect(result.isDraft).toBe(true)
      expect(result.size).toBe('small') // 35 lines total
    })

    it('should detect breaking changes', () => {
      const breakingPR = {
        id: 123,
        number: 456,
        title: 'BREAKING: Remove deprecated API',
        body: 'This is a breaking change that removes old endpoints',
        state: 'open' as const,
        merged: false,
        mergeable: true,
        mergeable_state: 'clean',
        user: createTestUser(),
        assignees: [],
        requested_reviewers: [],
        labels: [],
        base: {
          ref: 'main',
          sha: 'abc123',
          repo: createTestRepo(),
        },
        head: {
          ref: 'feature/breaking-change',
          sha: 'def456',
          repo: createTestRepo(),
        },
        html_url: 'https://github.com/test/repo/pull/456',
        diff_url: 'https://github.com/test/repo/pull/456.diff',
        patch_url: 'https://github.com/test/repo/pull/456.patch',
        commits_url: 'https://github.com/test/repo/pull/456/commits',
        comments_url: 'https://github.com/test/repo/pull/456/comments',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        closed_at: null,
        merged_at: null,
        merge_commit_sha: null,
        additions: 100,
        deletions: 200,
        changed_files: 5,
        commits: 2,
        comments: 1,
        review_comments: 0,
        maintainer_can_modify: true,
        draft: false,
      }

      const result = GitHubParser.extractPRMetadata(breakingPR, [])
      expect(result.hasBreakingChanges).toBe(true)
      expect(result.size).toBe('large') // 300 lines total
    })

    it('should detect critical files', () => {
      const pr = {
        id: 123,
        number: 456,
        title: 'Update package dependencies',
        body: 'Update to latest versions',
        state: 'open' as const,
        merged: false,
        mergeable: true,
        mergeable_state: 'clean',
        user: createTestUser(),
        assignees: [],
        requested_reviewers: [],
        labels: [],
        base: {
          ref: 'main',
          sha: 'abc123',
          repo: createTestRepo(),
        },
        head: {
          ref: 'deps/update',
          sha: 'def456',
          repo: createTestRepo(),
        },
        html_url: 'https://github.com/test/repo/pull/456',
        diff_url: 'https://github.com/test/repo/pull/456.diff',
        patch_url: 'https://github.com/test/repo/pull/456.patch',
        commits_url: 'https://github.com/test/repo/pull/456/commits',
        comments_url: 'https://github.com/test/repo/pull/456/comments',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        closed_at: null,
        merged_at: null,
        merge_commit_sha: null,
        additions: 20,
        deletions: 15,
        changed_files: 2,
        commits: 1,
        comments: 0,
        review_comments: 0,
        maintainer_can_modify: true,
        draft: false,
      }

      const files = [
        {
          sha: 'abc123',
          filename: 'package.json',
          status: 'modified' as const,
          additions: 15,
          deletions: 10,
          changes: 25,
          blob_url: 'https://github.com/test/repo/blob/abc123/package.json',
          raw_url: 'https://github.com/test/repo/raw/abc123/package.json',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/package.json',
          patch: '@@ -10,5 +10,10 @@',
        },
        {
          sha: 'def456',
          filename: 'pnpm-lock.yaml',
          status: 'modified' as const,
          additions: 5,
          deletions: 5,
          changes: 10,
          blob_url: 'https://github.com/test/repo/blob/def456/pnpm-lock.yaml',
          raw_url: 'https://github.com/test/repo/raw/def456/pnpm-lock.yaml',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/pnpm-lock.yaml',
          patch: '@@ -100,10 +100,10 @@',
        },
      ]

      const result = GitHubParser.extractPRMetadata(pr, files)
      expect(result.touchesCriticalFiles).toBe(true)
      expect(result.size).toBe('small') // 35 lines total
    })
  })

  describe('calculateComplexityScore', () => {
    it('should calculate complexity score', () => {
      const files = [
        {
          sha: 'abc123',
          filename: 'src/file1.ts',
          status: 'modified' as const,
          additions: 50,
          deletions: 20,
          changes: 70,
          blob_url: 'https://github.com/test/repo/blob/abc123/src/file1.ts',
          raw_url: 'https://github.com/test/repo/raw/abc123/src/file1.ts',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/src/file1.ts',
          patch: '@@ -1,20 +1,50 @@',
        },
        {
          sha: 'def456',
          filename: 'src/file2.ts',
          status: 'added' as const,
          additions: 100,
          deletions: 0,
          changes: 100,
          blob_url: 'https://github.com/test/repo/blob/def456/src/file2.ts',
          raw_url: 'https://github.com/test/repo/raw/def456/src/file2.ts',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/src/file2.ts',
          patch: '@@ -0,0 +1,100 @@',
        },
      ]

      const commits = [
        {
          sha: 'abc123',
          message: 'Add feature',
          author: {
            name: 'testuser',
            email: 'test@example.com',
            date: '2024-01-01T00:00:00Z',
          },
          committer: {
            name: 'testuser',
            email: 'test@example.com',
            date: '2024-01-01T00:00:00Z',
          },
          tree: {
            sha: 'tree123',
          },
          url: 'https://github.com/test/repo/commit/abc123',
          comment_count: 0,
        },
        {
          sha: 'def456',
          message: 'Fix tests',
          author: {
            name: 'testuser',
            email: 'test@example.com',
            date: '2024-01-01T00:30:00Z',
          },
          committer: {
            name: 'testuser',
            email: 'test@example.com',
            date: '2024-01-01T00:30:00Z',
          },
          tree: {
            sha: 'tree456',
          },
          url: 'https://github.com/test/repo/commit/def456',
          comment_count: 1,
        },
      ]

      const score = GitHubParser.calculateComplexityScore(files, commits)
      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(10)
    })

    it('should handle empty inputs', () => {
      const score = GitHubParser.calculateComplexityScore([], [])
      expect(score).toBe(0)
    })
  })

  describe('getFilesByChangeType', () => {
    it('should group files by change type', () => {
      const files = [
        {
          sha: 'abc123',
          filename: 'src/new.ts',
          status: 'added' as const,
          additions: 50,
          deletions: 0,
          changes: 50,
          blob_url: 'https://github.com/test/repo/blob/abc123/src/new.ts',
          raw_url: 'https://github.com/test/repo/raw/abc123/src/new.ts',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/src/new.ts',
          patch: '@@ -0,0 +1,50 @@',
        },
        {
          sha: 'def456',
          filename: 'src/existing.ts',
          status: 'modified' as const,
          additions: 10,
          deletions: 5,
          changes: 15,
          blob_url: 'https://github.com/test/repo/blob/def456/src/existing.ts',
          raw_url: 'https://github.com/test/repo/raw/def456/src/existing.ts',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/src/existing.ts',
          patch: '@@ -1,5 +1,10 @@',
        },
        {
          sha: 'ghi789',
          filename: 'src/old.ts',
          status: 'removed' as const,
          additions: 0,
          deletions: 30,
          changes: 30,
          blob_url: 'https://github.com/test/repo/blob/ghi789/src/old.ts',
          raw_url: 'https://github.com/test/repo/raw/ghi789/src/old.ts',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/src/old.ts',
          patch: '@@ -1,30 +0,0 @@',
        },
        {
          sha: 'jkl012',
          filename: 'src/moved.ts',
          status: 'renamed' as const,
          additions: 5,
          deletions: 5,
          changes: 10,
          blob_url: 'https://github.com/test/repo/blob/jkl012/src/moved.ts',
          raw_url: 'https://github.com/test/repo/raw/jkl012/src/moved.ts',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/src/moved.ts',
          patch: '@@ -1,5 +1,5 @@',
        },
      ]

      const grouped = GitHubParser.getFilesByChangeType(files)
      expect(grouped.added).toHaveLength(1)
      expect(grouped.modified).toHaveLength(1)
      expect(grouped.removed).toHaveLength(1)
      expect(grouped.renamed).toHaveLength(1)
      expect(grouped.added[0].filename).toBe('src/new.ts')
      expect(grouped.modified[0].filename).toBe('src/existing.ts')
      expect(grouped.removed[0].filename).toBe('src/old.ts')
      expect(grouped.renamed[0].filename).toBe('src/moved.ts')
    })
  })

  describe('identifyAffectedComponents', () => {
    it('should identify components from file paths', () => {
      const files = [
        {
          sha: 'abc123',
          filename: 'src/components/Button.tsx',
          status: 'modified' as const,
          additions: 10,
          deletions: 5,
          changes: 15,
          blob_url:
            'https://github.com/test/repo/blob/abc123/src/components/Button.tsx',
          raw_url:
            'https://github.com/test/repo/raw/abc123/src/components/Button.tsx',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/src/components/Button.tsx',
          patch: '@@ -1,5 +1,10 @@',
        },
        {
          sha: 'def456',
          filename: 'backend/api/users.py',
          status: 'added' as const,
          additions: 50,
          deletions: 0,
          changes: 50,
          blob_url:
            'https://github.com/test/repo/blob/def456/backend/api/users.py',
          raw_url:
            'https://github.com/test/repo/raw/def456/backend/api/users.py',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/backend/api/users.py',
          patch: '@@ -0,0 +1,50 @@',
        },
        {
          sha: 'ghi789',
          filename: 'docs/README.md',
          status: 'modified' as const,
          additions: 5,
          deletions: 2,
          changes: 7,
          blob_url: 'https://github.com/test/repo/blob/ghi789/docs/README.md',
          raw_url: 'https://github.com/test/repo/raw/ghi789/docs/README.md',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/docs/README.md',
          patch: '@@ -1,2 +1,5 @@',
        },
        {
          sha: 'jkl012',
          filename: 'package.json',
          status: 'modified' as const,
          additions: 3,
          deletions: 1,
          changes: 4,
          blob_url: 'https://github.com/test/repo/blob/jkl012/package.json',
          raw_url: 'https://github.com/test/repo/raw/jkl012/package.json',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/package.json',
          patch: '@@ -10,1 +10,3 @@',
        },
      ]

      const components = GitHubParser.identifyAffectedComponents(files)
      expect(components).toContain('src')
      expect(components).toContain('backend')
      expect(components).toContain('docs')
      expect(components).toContain('react') // .tsx file
      expect(components).toContain('python') // .py file
      expect(components).toContain('documentation') // .md file
      expect(components).toContain('dependencies') // package.json
    })
  })

  describe('getFailedCheckRuns', () => {
    it('should filter failed check runs', () => {
      const checkRuns = [
        {
          id: 1,
          name: 'Tests',
          status: 'completed' as const,
          conclusion: 'success' as const,
          started_at: '2024-01-01T00:00:00Z',
          completed_at: '2024-01-01T00:05:00Z',
          output: {
            title: 'Success',
            summary: 'All tests passed',
            text: null,
            annotations_count: 0,
            annotations_url:
              'https://api.github.com/repos/test/repo/check-runs/1/annotations',
          },
          html_url: 'https://github.com/test/repo/runs/1',
        },
        {
          id: 2,
          name: 'Lint',
          status: 'completed' as const,
          conclusion: 'failure' as const,
          started_at: '2024-01-01T00:00:00Z',
          completed_at: '2024-01-01T00:03:00Z',
          output: {
            title: 'Failed',
            summary: 'Linting errors found',
            text: null,
            annotations_count: 5,
            annotations_url:
              'https://api.github.com/repos/test/repo/check-runs/2/annotations',
          },
          html_url: 'https://github.com/test/repo/runs/2',
        },
        {
          id: 3,
          name: 'Build',
          status: 'completed' as const,
          conclusion: 'failure' as const,
          started_at: '2024-01-01T00:00:00Z',
          completed_at: '2024-01-01T00:10:00Z',
          output: {
            title: 'Failed',
            summary: 'Build failed',
            text: 'Compilation errors',
            annotations_count: 2,
            annotations_url:
              'https://api.github.com/repos/test/repo/check-runs/3/annotations',
          },
          html_url: 'https://github.com/test/repo/runs/3',
        },
      ]

      const failed = GitHubParser.getFailedCheckRuns(checkRuns)
      expect(failed).toHaveLength(2)
      expect(failed[0].name).toBe('Lint')
      expect(failed[1].name).toBe('Build')
    })
  })

  describe('getCriticalSecurityAlerts', () => {
    it('should filter critical security alerts', () => {
      const alerts = [
        {
          number: 1,
          state: 'open' as const,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          fixed_at: null,
          dismissed_at: null,
          security_advisory: {
            ghsa_id: 'GHSA-1234-5678-9012',
            cve_id: 'CVE-2024-1234',
            summary: 'Critical vulnerability',
            description: 'A critical security issue',
            severity: 'critical' as const,
            cvss: {
              vector_string: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
              score: 9.8,
            },
          },
          security_vulnerability: {
            package: {
              name: 'test-package',
              ecosystem: 'npm',
            },
            vulnerable_version_range: '< 1.0.0',
            first_patched_version: {
              identifier: '1.0.0',
            },
          },
          url: 'https://api.github.com/repos/test/repo/security-advisories/1',
          html_url:
            'https://github.com/test/repo/security/advisories/GHSA-1234-5678-9012',
        },
        {
          number: 2,
          state: 'open' as const,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          fixed_at: null,
          dismissed_at: null,
          security_advisory: {
            ghsa_id: 'GHSA-2345-6789-0123',
            cve_id: null,
            summary: 'Medium vulnerability',
            description: 'A medium security issue',
            severity: 'medium' as const,
            cvss: {
              vector_string: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:L',
              score: 6.3,
            },
          },
          security_vulnerability: {
            package: {
              name: 'another-package',
              ecosystem: 'npm',
            },
            vulnerable_version_range: '< 2.0.0',
            first_patched_version: null,
          },
          url: 'https://api.github.com/repos/test/repo/security-advisories/2',
          html_url:
            'https://github.com/test/repo/security/advisories/GHSA-2345-6789-0123',
        },
      ]

      const critical = GitHubParser.getCriticalSecurityAlerts(alerts)
      expect(critical).toHaveLength(1)
      expect(critical[0].security_advisory.severity).toBe('critical')
    })
  })

  describe('estimateTestCoverageImpact', () => {
    it('should estimate test coverage impact', () => {
      const files = [
        {
          sha: 'abc123',
          filename: 'src/feature.ts',
          status: 'added' as const,
          additions: 100,
          deletions: 0,
          changes: 100,
          blob_url: 'https://github.com/test/repo/blob/abc123/src/feature.ts',
          raw_url: 'https://github.com/test/repo/raw/abc123/src/feature.ts',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/src/feature.ts',
          patch: '@@ -0,0 +1,100 @@',
        },
        {
          sha: 'def456',
          filename: 'src/feature.test.ts',
          status: 'added' as const,
          additions: 50,
          deletions: 0,
          changes: 50,
          blob_url:
            'https://github.com/test/repo/blob/def456/src/feature.test.ts',
          raw_url:
            'https://github.com/test/repo/raw/def456/src/feature.test.ts',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/src/feature.test.ts',
          patch: '@@ -0,0 +1,50 @@',
        },
        {
          sha: 'ghi789',
          filename: 'src/utils.js',
          status: 'modified' as const,
          additions: 20,
          deletions: 10,
          changes: 30,
          blob_url: 'https://github.com/test/repo/blob/ghi789/src/utils.js',
          raw_url: 'https://github.com/test/repo/raw/ghi789/src/utils.js',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/src/utils.js',
          patch: '@@ -1,10 +1,20 @@',
        },
      ]

      const impact = GitHubParser.estimateTestCoverageImpact(files)
      expect(impact).toBe(0.38) // 50 test changes / 130 source changes
    })

    it('should return 0 for no source files', () => {
      const files = [
        {
          sha: 'abc123',
          filename: 'README.md',
          status: 'modified' as const,
          additions: 10,
          deletions: 5,
          changes: 15,
          blob_url: 'https://github.com/test/repo/blob/abc123/README.md',
          raw_url: 'https://github.com/test/repo/raw/abc123/README.md',
          contents_url:
            'https://api.github.com/repos/test/repo/contents/README.md',
          patch: '@@ -1,5 +1,10 @@',
        },
      ]

      const impact = GitHubParser.estimateTestCoverageImpact(files)
      expect(impact).toBe(0)
    })
  })
})
