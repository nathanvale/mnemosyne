import { describe, it, expect } from 'vitest'

import type {
  CodeRabbitAnalysis,
  CodeRabbitFinding,
} from '../../types/coderabbit.js'
import type { GitHubPRContext, GitHubFileChange } from '../../types/github.js'

import { PRMetricsCollector } from '../pr-metrics-collector.js'

describe('PRMetricsCollector', () => {
  const mockGitHubContext: GitHubPRContext = {
    pullRequest: {
      id: 1,
      number: 123,
      title: 'Add user authentication',
      body: 'Implements OAuth2 authentication for users',
      state: 'open',
      draft: false,
      merged: false,
      html_url: 'https://github.com/test/repo/pull/123',
      mergeable: true,
      mergeable_state: 'clean',
      assignees: [],
      requested_reviewers: [],
      labels: [],
      comments: 0,
      review_comments: 0,
      commits: 3,
      additions: 150,
      deletions: 25,
      changed_files: 8,
      created_at: '2024-01-01T10:00:00Z',
      updated_at: '2024-01-01T11:00:00Z',
      closed_at: null,
      merged_at: null,
      merge_commit_sha: null,
      maintainer_can_modify: true,
      diff_url: 'https://github.com/test/repo/pull/123.diff',
      patch_url: 'https://github.com/test/repo/pull/123.patch',
      commits_url: 'https://api.github.com/repos/test/repo/pulls/123/commits',
      comments_url:
        'https://api.github.com/repos/test/repo/issues/123/comments',
      user: {
        login: 'testuser',
        id: 123,
        type: 'User',
        avatar_url: 'https://github.com/testuser.avatar',
        html_url: 'https://github.com/testuser',
      },
      base: {
        ref: 'main',
        sha: 'abc123',
        repo: {
          id: 456,
          html_url: 'https://github.com/test/repo',
          name: 'repo',
          full_name: 'test/repo',
          private: false,
          default_branch: 'main',
          language: 'TypeScript',
          languages_url: 'https://api.github.com/repos/test/repo/languages',
        },
      },
      head: {
        ref: 'feature/auth',
        sha: 'def456',
        repo: {
          id: 456,
          html_url: 'https://github.com/test/repo',
          name: 'repo',
          full_name: 'test/repo',
          private: false,
          default_branch: 'main',
          language: 'TypeScript',
          languages_url: 'https://api.github.com/repos/test/repo/languages',
        },
      },
    },
    files: [
      {
        filename: 'src/auth/oauth.ts',
        status: 'added',
        additions: 80,
        deletions: 0,
        changes: 80,
        patch: '@@ -0,0 +1,80 @@\n+export class OAuth2Service {',
      },
      {
        filename: 'src/auth/oauth.test.ts',
        status: 'added',
        additions: 40,
        deletions: 0,
        changes: 40,
        patch: '@@ -0,0 +1,40 @@\n+describe("OAuth2Service", () => {',
      },
      {
        filename: 'src/database/user.model.ts',
        status: 'modified',
        additions: 20,
        deletions: 15,
        changes: 35,
        patch: '@@ -10,15 +10,20 @@\n-old code\n+new code',
      },
      {
        filename: 'README.md',
        status: 'modified',
        additions: 10,
        deletions: 5,
        changes: 15,
        patch: '@@ -1,5 +1,10 @@\n-old readme\n+new readme',
      },
      {
        filename: 'package.json',
        status: 'modified',
        additions: 0,
        deletions: 5,
        changes: 5,
        patch: '@@ -20,5 +20,0 @@\n-removed dependency',
      },
    ] as GitHubFileChange[],
    commits: [
      {
        sha: 'commit1',
        message: 'Add OAuth2 service',
        author: {
          name: 'Test User',
          email: 'test@example.com',
          date: '2024-01-01T10:00:00Z',
        },
        committer: {
          name: 'Test User',
          email: 'test@example.com',
          date: '2024-01-01T10:00:00Z',
        },
        tree: { sha: 'tree1' },
        url: 'https://api.github.com/repos/test/repo/git/commits/commit1',
        comment_count: 0,
      },
      {
        sha: 'commit2',
        message: 'Add OAuth2 tests',
        author: {
          name: 'Test User',
          email: 'test@example.com',
          date: '2024-01-01T10:00:00Z',
        },
        committer: {
          name: 'Test User',
          email: 'test@example.com',
          date: '2024-01-01T10:00:00Z',
        },
        tree: { sha: 'tree2' },
        url: 'https://api.github.com/repos/test/repo/git/commits/commit2',
        comment_count: 0,
      },
      {
        sha: 'commit3',
        message: 'Update user model',
        author: {
          name: 'Test User',
          email: 'test@example.com',
          date: '2024-01-01T10:00:00Z',
        },
        committer: {
          name: 'Test User',
          email: 'test@example.com',
          date: '2024-01-01T10:00:00Z',
        },
        tree: { sha: 'tree3' },
        url: 'https://api.github.com/repos/test/repo/git/commits/commit3',
        comment_count: 0,
      },
    ],
    checkRuns: [],
    securityAlerts: [],
    metadata: {
      fetchedAt: '2024-01-01T11:00:00Z',
      totalLinesChanged: 175,
      affectedComponents: ['auth', 'database', 'documentation'],
    },
  }

  const mockCodeRabbitAnalysis: CodeRabbitAnalysis = {
    confidence: {
      overall: 'high',
      securityAnalysis: 'high',
      performanceAnalysis: 'medium',
      codeQualityAnalysis: 'high',
    },
    timestamp: '2024-01-01T10:30:00Z',
    pullRequestId: 123,
    analysisId: 'analysis-456',
    summary: {
      totalFindings: 2,
      criticalCount: 0,
      highCount: 1,
      mediumCount: 1,
      lowCount: 0,
      infoCount: 0,
      securityIssues: 1,
      performanceIssues: 0,
      maintainabilityIssues: 0,
    },
    findings: [
      {
        id: 'finding-1',
        title: 'Potential SQL injection vulnerability',
        description: 'User input is not properly sanitized',
        severity: 'high',
        category: 'security',
        confidence: 'high',
        source: 'coderabbit-security',
        timestamp: '2024-01-01T10:30:00Z',
        location: {
          file: 'src/database/user.model.ts',
          startLine: 45,
          startColumn: 12,
          endColumn: 32,
        },
        cweId: 'CWE-89',
        owasp: 'A03:2021',
        cvss: 7.5,
        tags: ['security', 'injection'],
        suggestedFix: {
          description: 'Use parameterized queries',
          oldCode: 'const query = "SELECT * FROM users WHERE id = " + userId',
          newCode: 'const query = "SELECT * FROM users WHERE id = $1"',
          confidence: 'high',
          automaticFix: false,
        },
      } as CodeRabbitFinding,
      {
        id: 'finding-2',
        title: 'Missing error handling',
        description: 'Function does not handle errors properly',
        severity: 'medium',
        category: 'bug_risk',
        confidence: 'medium',
        source: 'coderabbit-quality',
        timestamp: '2024-01-01T10:31:00Z',
        location: {
          file: 'src/auth/oauth.ts',
          startLine: 23,
          startColumn: 8,
          endColumn: 23,
        },
        tags: ['error-handling'],
      } as CodeRabbitFinding,
    ],
    coverage: {
      filesAnalyzed: 4,
      linesAnalyzed: 500,
      functionsAnalyzed: 25,
      coveragePercentage: 80,
    },
    processingMetrics: {
      analysisTimeMs: 2500,
      rulesExecuted: 147,
    },
  }

  describe('collectMetrics', () => {
    it('should collect basic code metrics correctly', () => {
      const metrics = PRMetricsCollector.collectMetrics(mockGitHubContext)

      expect(metrics.linesReviewed).toBe(263) // (150 + 25) * 1.5 rounded
      expect(metrics.linesChanged).toBe(175) // 150 + 25
      expect(metrics.filesChanged).toBe(8)
      expect(metrics.functionsChanged).toBe(8) // Estimated based on lines changed
      expect(metrics.complexityScore).toBe(2.9) // Based on files, changes, and commits
    })

    it('should calculate security metrics without CodeRabbit analysis', () => {
      const metrics = PRMetricsCollector.collectMetrics(mockGitHubContext)

      expect(metrics.securityIssuesFound).toBe(0)
      expect(metrics.criticalVulnerabilities).toBe(0)
      expect(metrics.securityDebtScore).toBe(100) // Perfect score with no issues
    })

    it('should calculate security metrics with CodeRabbit analysis', () => {
      const metrics = PRMetricsCollector.collectMetrics(
        mockGitHubContext,
        mockCodeRabbitAnalysis,
      )

      expect(metrics.securityIssuesFound).toBe(1) // One security finding
      expect(metrics.criticalVulnerabilities).toBe(0) // High severity, not critical
      expect(metrics.securityDebtScore).toBe(95) // 100 - (1 * 5) = 95
    })

    it('should calculate quality metrics correctly', () => {
      const metrics = PRMetricsCollector.collectMetrics(mockGitHubContext)

      expect(metrics.testCoverageDelta).toBe(0.35) // Test changes vs source changes ratio
      expect(metrics.technicalDebtRatio).toBe(0) // No large files detected
      expect(metrics.documentationCoverage).toBe(20) // 1 doc file out of 5 total files
    })

    it('should assess performance impact correctly', () => {
      const metrics = PRMetricsCollector.collectMetrics(mockGitHubContext)

      expect(metrics.performanceImpact).toBe('medium') // Database-related files present
      expect(metrics.bundleSizeImpact).toBe(2) // Estimated based on frontend changes
    })

    it('should calculate analysis metrics with CodeRabbit data', () => {
      const metrics = PRMetricsCollector.collectMetrics(
        mockGitHubContext,
        mockCodeRabbitAnalysis,
      )

      expect(metrics.analysisTimeMs).toBe(2500)
      expect(metrics.confidenceScore).toBe(70) // Average confidence converted to 0-100 scale
      expect(metrics.coveragePercentage).toBe(80)
    })

    it('should calculate historical metrics', () => {
      const metrics = PRMetricsCollector.collectMetrics(mockGitHubContext)

      expect(metrics.authorPatternScore).toBe(75) // Default reasonable score
      expect(metrics.teamVelocityImpact).toBe('neutral') // Medium-sized PR
    })

    it('should handle velocity impact based on PR size', () => {
      // Small PR (positive impact)
      const smallPR = {
        ...mockGitHubContext,
        pullRequest: {
          ...mockGitHubContext.pullRequest,
          additions: 30,
          deletions: 20,
        },
      }
      const smallMetrics = PRMetricsCollector.collectMetrics(smallPR)
      expect(smallMetrics.teamVelocityImpact).toBe('positive')

      // Large PR (negative impact)
      const largePR = {
        ...mockGitHubContext,
        pullRequest: {
          ...mockGitHubContext.pullRequest,
          additions: 400,
          deletions: 200,
        },
      }
      const largeMetrics = PRMetricsCollector.collectMetrics(largePR)
      expect(largeMetrics.teamVelocityImpact).toBe('negative')
    })
  })

  describe('calculateTrendMetrics', () => {
    it('should calculate trends with no historical data', () => {
      const currentMetrics = PRMetricsCollector.collectMetrics(
        mockGitHubContext,
        mockCodeRabbitAnalysis,
      )

      const trends = PRMetricsCollector.calculateTrendMetrics(
        currentMetrics,
        [],
      )

      expect(trends.securityTrend).toBe('stable')
      expect(trends.qualityTrend).toBe('stable')
      expect(trends.complexityTrend).toBe('stable')
      expect(trends.averageSecurityIssues).toBe(1)
      expect(trends.averageComplexity).toBe(2.9)
    })

    it('should calculate improving trends', () => {
      const currentMetrics = PRMetricsCollector.collectMetrics(
        mockGitHubContext,
        mockCodeRabbitAnalysis,
      )

      // Historical data with worse metrics
      const historicalMetrics = [
        {
          ...currentMetrics,
          securityIssuesFound: 5,
          testCoverageDelta: 0.1,
          complexityScore: 5.0,
        },
        {
          ...currentMetrics,
          securityIssuesFound: 3,
          testCoverageDelta: 0.15,
          complexityScore: 4.0,
        },
      ]

      const trends = PRMetricsCollector.calculateTrendMetrics(
        currentMetrics,
        historicalMetrics,
      )

      expect(trends.securityTrend).toBe('improving') // 1 < 4 * 0.9
      expect(trends.qualityTrend).toBe('improving') // 0.29 > 0.125 * 1.1
      expect(trends.complexityTrend).toBe('improving') // 1.3 < 4.5 * 0.9
      expect(trends.averageSecurityIssues).toBe(4)
      expect(trends.averageComplexity).toBe(4.5)
    })

    it('should calculate declining trends', () => {
      const currentMetrics = {
        ...PRMetricsCollector.collectMetrics(mockGitHubContext),
        securityIssuesFound: 8,
        testCoverageDelta: 0.05,
        complexityScore: 8.0,
      }

      // Historical data with better metrics
      const historicalMetrics = [
        {
          ...currentMetrics,
          securityIssuesFound: 2,
          testCoverageDelta: 0.5,
          complexityScore: 2.0,
        },
        {
          ...currentMetrics,
          securityIssuesFound: 1,
          testCoverageDelta: 0.4,
          complexityScore: 1.5,
        },
      ]

      const trends = PRMetricsCollector.calculateTrendMetrics(
        currentMetrics,
        historicalMetrics,
      )

      expect(trends.securityTrend).toBe('declining') // 8 > 1.5 * 1.1
      expect(trends.qualityTrend).toBe('declining') // 0.05 < 0.45 * 0.9
      expect(trends.complexityTrend).toBe('declining') // 8.0 > 1.75 * 1.1
      expect(trends.averageSecurityIssues).toBe(1.5)
      expect(trends.averageComplexity).toBe(1.8)
    })
  })

  describe('edge cases', () => {
    it('should handle empty file changes', () => {
      const emptyContext = {
        ...mockGitHubContext,
        files: [],
        pullRequest: {
          ...mockGitHubContext.pullRequest,
          additions: 0,
          deletions: 0,
          changed_files: 0,
        },
      }

      const metrics = PRMetricsCollector.collectMetrics(emptyContext)

      expect(metrics.linesReviewed).toBe(0)
      expect(metrics.linesChanged).toBe(0)
      expect(metrics.filesChanged).toBe(0)
      expect(metrics.functionsChanged).toBe(0)
      expect(metrics.testCoverageDelta).toBe(0)
      expect(metrics.documentationCoverage).toBe(0)
    })

    it('should handle CodeRabbit analysis without security findings', () => {
      const nonSecurityAnalysis: CodeRabbitAnalysis = {
        confidence: {
          overall: 'high',
          securityAnalysis: 'high',
          performanceAnalysis: 'medium',
          codeQualityAnalysis: 'high',
        },
        timestamp: '2024-01-01T10:30:00Z',
        pullRequestId: 123,
        analysisId: 'analysis-789',
        summary: {
          totalFindings: 1,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 1,
          infoCount: 0,
          securityIssues: 0,
          performanceIssues: 0,
          maintainabilityIssues: 0,
        },
        findings: [
          {
            id: 'finding-1',
            title: 'Code style issue',
            description: 'Consider using const instead of let',
            severity: 'low',
            category: 'style',
            confidence: 'high',
            location: {
              file: 'src/auth/oauth.ts',
              startLine: 10,
              startColumn: 5,
              endColumn: 8,
            },
            tags: ['style'],
          } as CodeRabbitFinding,
        ],
        coverage: mockCodeRabbitAnalysis.coverage,
        processingMetrics: mockCodeRabbitAnalysis.processingMetrics,
      }

      const metrics = PRMetricsCollector.collectMetrics(
        mockGitHubContext,
        nonSecurityAnalysis,
      )

      expect(metrics.securityIssuesFound).toBe(0)
      expect(metrics.securityDebtScore).toBe(100)
    })
  })
})
