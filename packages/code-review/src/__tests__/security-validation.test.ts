import { describe, it, expect } from 'vitest'

import type { CodeRabbitAnalysis } from '../types/coderabbit.js'
import type { GitHubPRContext, GitHubFileChange } from '../types/github.js'

import { SecurityAnalyzer } from '../analysis/security-analyzer.js'

describe('Security Validation - Known Security Issues', () => {
  it('should detect SQL injection patterns', () => {
    const mockFiles: GitHubFileChange[] = [
      {
        sha: 'test-sha',
        filename: 'user-service.js',
        status: 'modified',
        additions: 5,
        deletions: 2,
        changes: 7,
        blob_url: 'https://example.com/blob',
        raw_url: 'https://example.com/raw',
        contents_url: 'https://example.com/contents',
        patch: `
+    const query = "SELECT * FROM users WHERE id = " + userId;
+    return db.execute(query);
        `,
      },
    ]

    const mockPR: GitHubPRContext = {
      pullRequest: {
        id: 1,
        number: 1,
        title: 'Fix user lookup',
        body: 'Updates user service',
        state: 'open',
        merged: false,
        mergeable: true,
        mergeable_state: 'clean',
        user: {
          id: 1,
          login: 'developer',
          avatar_url: 'https://example.com/avatar.png',
          html_url: 'https://example.com/developer',
          type: 'User',
        },
        assignees: [],
        requested_reviewers: [],
        labels: [],
        base: {
          ref: 'main',
          sha: 'abc123',
          repo: {
            id: 1,
            name: 'test-repo',
            full_name: 'org/test-repo',
            private: false,
            html_url: 'https://example.com/repo',
            default_branch: 'main',
            language: 'JavaScript',
            languages_url: 'https://example.com/languages',
          },
        },
        head: {
          ref: 'fix-user-lookup',
          sha: 'def456',
          repo: {
            id: 1,
            name: 'test-repo',
            full_name: 'org/test-repo',
            private: false,
            html_url: 'https://example.com/repo',
            default_branch: 'main',
            language: 'JavaScript',
            languages_url: 'https://example.com/languages',
          },
        },
        html_url: 'https://example.com/pr/1',
        diff_url: 'https://example.com/pr/1.diff',
        patch_url: 'https://example.com/pr/1.patch',
        commits_url: 'https://example.com/pr/1/commits',
        comments_url: 'https://example.com/pr/1/comments',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        closed_at: null,
        merged_at: null,
        merge_commit_sha: null,
        additions: 5,
        deletions: 2,
        changed_files: 1,
        commits: 1,
        comments: 0,
        review_comments: 0,
        maintainer_can_modify: false,
        draft: false,
      },
      files: mockFiles,
      commits: [],
      checkRuns: [],
      securityAlerts: [],
      metadata: {
        fetchedAt: '2024-01-01T00:00:00Z',
        totalLinesChanged: 7,
        affectedComponents: ['user-service'],
      },
    }

    const results = SecurityAnalyzer.analyzeSecurityFindings(mockPR)

    // Should detect the SQL injection pattern
    expect(results.totalFindings).toBeGreaterThan(0)

    const sqlInjectionFindings = results.findings.filter(
      (finding) => finding.cweId === 'CWE-89',
    )
    expect(sqlInjectionFindings.length).toBeGreaterThanOrEqual(1)
    expect(sqlInjectionFindings[0].title).toContain('SQL Injection')
    expect(sqlInjectionFindings[0].severity).toBe('high')
    expect(sqlInjectionFindings[0].file).toBe('user-service.js')
  })

  it('should detect XSS vulnerabilities', () => {
    const mockFiles: GitHubFileChange[] = [
      {
        sha: 'test-sha',
        filename: 'comments.js',
        status: 'modified',
        additions: 3,
        deletions: 1,
        changes: 4,
        blob_url: 'https://example.com/blob',
        raw_url: 'https://example.com/raw',
        contents_url: 'https://example.com/contents',
        patch: `
+    element.innerHTML = userComment + "<br>";
+    document.write(content);
        `,
      },
    ]

    const mockPR: GitHubPRContext = {
      pullRequest: {
        id: 2,
        number: 2,
        title: 'Add comment display',
        body: 'Displays user comments',
        state: 'open',
        merged: false,
        mergeable: true,
        mergeable_state: 'clean',
        user: {
          id: 1,
          login: 'developer',
          avatar_url: 'https://example.com/avatar.png',
          html_url: 'https://example.com/developer',
          type: 'User',
        },
        assignees: [],
        requested_reviewers: [],
        labels: [],
        base: {
          ref: 'main',
          sha: 'abc123',
          repo: {
            id: 1,
            name: 'test-repo',
            full_name: 'org/test-repo',
            private: false,
            html_url: 'https://example.com/repo',
            default_branch: 'main',
            language: 'JavaScript',
            languages_url: 'https://example.com/languages',
          },
        },
        head: {
          ref: 'add-comments',
          sha: 'ghi789',
          repo: {
            id: 1,
            name: 'test-repo',
            full_name: 'org/test-repo',
            private: false,
            html_url: 'https://example.com/repo',
            default_branch: 'main',
            language: 'JavaScript',
            languages_url: 'https://example.com/languages',
          },
        },
        html_url: 'https://example.com/pr/2',
        diff_url: 'https://example.com/pr/2.diff',
        patch_url: 'https://example.com/pr/2.patch',
        commits_url: 'https://example.com/pr/2/commits',
        comments_url: 'https://example.com/pr/2/comments',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        closed_at: null,
        merged_at: null,
        merge_commit_sha: null,
        additions: 3,
        deletions: 1,
        changed_files: 1,
        commits: 1,
        comments: 0,
        review_comments: 0,
        maintainer_can_modify: false,
        draft: false,
      },
      files: mockFiles,
      commits: [],
      checkRuns: [],
      securityAlerts: [],
      metadata: {
        fetchedAt: '2024-01-01T00:00:00Z',
        totalLinesChanged: 4,
        affectedComponents: ['comments'],
      },
    }

    const results = SecurityAnalyzer.analyzeSecurityFindings(mockPR)

    // Should detect XSS patterns
    expect(results.totalFindings).toBeGreaterThan(0)

    const xssFindings = results.findings.filter(
      (finding) => finding.cweId === 'CWE-79',
    )
    expect(xssFindings.length).toBeGreaterThanOrEqual(1)
    expect(xssFindings[0].title).toContain('Cross-Site Scripting')
    expect(xssFindings[0].severity).toBe('high')
  })

  it('should detect hardcoded secrets', () => {
    const mockFiles: GitHubFileChange[] = [
      {
        sha: 'test-sha',
        filename: 'config.js',
        status: 'modified',
        additions: 2,
        deletions: 0,
        changes: 2,
        blob_url: 'https://example.com/blob',
        raw_url: 'https://example.com/raw',
        contents_url: 'https://example.com/contents',
        patch: `
+    const api_key = "sk_test_FAKE_KEY_FOR_TESTING_ONLY";
+    const password = "supersecretpassword123";
        `,
      },
    ]

    const mockPR: GitHubPRContext = {
      pullRequest: {
        id: 3,
        number: 3,
        title: 'Add API configuration',
        body: 'Configures API keys',
        state: 'open',
        merged: false,
        mergeable: true,
        mergeable_state: 'clean',
        user: {
          id: 1,
          login: 'developer',
          avatar_url: 'https://example.com/avatar.png',
          html_url: 'https://example.com/developer',
          type: 'User',
        },
        assignees: [],
        requested_reviewers: [],
        labels: [],
        base: {
          ref: 'main',
          sha: 'abc123',
          repo: {
            id: 1,
            name: 'test-repo',
            full_name: 'org/test-repo',
            private: false,
            html_url: 'https://example.com/repo',
            default_branch: 'main',
            language: 'JavaScript',
            languages_url: 'https://example.com/languages',
          },
        },
        head: {
          ref: 'add-api-config',
          sha: 'jkl012',
          repo: {
            id: 1,
            name: 'test-repo',
            full_name: 'org/test-repo',
            private: false,
            html_url: 'https://example.com/repo',
            default_branch: 'main',
            language: 'JavaScript',
            languages_url: 'https://example.com/languages',
          },
        },
        html_url: 'https://example.com/pr/3',
        diff_url: 'https://example.com/pr/3.diff',
        patch_url: 'https://example.com/pr/3.patch',
        commits_url: 'https://example.com/pr/3/commits',
        comments_url: 'https://example.com/pr/3/comments',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        closed_at: null,
        merged_at: null,
        merge_commit_sha: null,
        additions: 2,
        deletions: 0,
        changed_files: 1,
        commits: 1,
        comments: 0,
        review_comments: 0,
        maintainer_can_modify: false,
        draft: false,
      },
      files: mockFiles,
      commits: [],
      checkRuns: [],
      securityAlerts: [],
      metadata: {
        fetchedAt: '2024-01-01T00:00:00Z',
        totalLinesChanged: 2,
        affectedComponents: ['config'],
      },
    }

    const results = SecurityAnalyzer.analyzeSecurityFindings(mockPR)

    // Should detect hardcoded secrets
    expect(results.totalFindings).toBeGreaterThan(0)

    const secretFindings = results.findings.filter(
      (finding) => finding.cweId === 'CWE-798',
    )
    expect(secretFindings.length).toBeGreaterThanOrEqual(1)
    expect(secretFindings[0].title).toContain('Hardcoded Secret')
    expect(secretFindings[0].severity).toBe('critical')
  })

  it('should validate security framework coverage', () => {
    const mockCodeRabbitAnalysis: CodeRabbitAnalysis = {
      pullRequestId: 4,
      analysisId: 'analysis-123',
      timestamp: '2024-01-01T00:00:00Z',
      findings: [
        {
          id: 'CR001',
          title: 'SQL Injection vulnerability',
          description: 'Unsafe query construction detected',
          severity: 'high',
          category: 'security',
          location: {
            file: 'user-service.js',
            startLine: 15,
            endLine: 15,
            startColumn: 1,
            endColumn: 50,
          },
          suggestedFix: {
            description: 'Use parameterized queries',
            oldCode: 'SELECT * FROM users WHERE id = " + userId',
            newCode: 'SELECT * FROM users WHERE id = ?',
            confidence: 'high',
            automaticFix: false,
          },
          confidence: 'high',
          cweId: 'CWE-89',
          owasp: 'A03_injection',
          tags: ['security', 'injection'],
          source: 'coderabbit',
          timestamp: '2024-01-01T00:00:00Z',
        },
      ],
      summary: {
        totalFindings: 1,
        criticalCount: 0,
        highCount: 1,
        mediumCount: 0,
        lowCount: 0,
        infoCount: 0,
        securityIssues: 1,
        performanceIssues: 0,
        maintainabilityIssues: 0,
      },
      confidence: {
        overall: 'high',
        securityAnalysis: 'high',
        performanceAnalysis: 'medium',
        codeQualityAnalysis: 'medium',
      },
      coverage: {
        filesAnalyzed: 1,
        linesAnalyzed: 100,
        functionsAnalyzed: 5,
        coveragePercentage: 85,
      },
      processingMetrics: {
        analysisTimeMs: 5000,
        rulesExecuted: 50,
      },
    }

    const mockPR: GitHubPRContext = {
      pullRequest: {
        id: 4,
        number: 4,
        title: 'Framework coverage test',
        body: 'Testing security framework mapping',
        state: 'open',
        merged: false,
        mergeable: true,
        mergeable_state: 'clean',
        user: {
          id: 1,
          login: 'developer',
          avatar_url: 'https://example.com/avatar.png',
          html_url: 'https://example.com/developer',
          type: 'User',
        },
        assignees: [],
        requested_reviewers: [],
        labels: [],
        base: {
          ref: 'main',
          sha: 'abc123',
          repo: {
            id: 1,
            name: 'test-repo',
            full_name: 'org/test-repo',
            private: false,
            html_url: 'https://example.com/repo',
            default_branch: 'main',
            language: 'JavaScript',
            languages_url: 'https://example.com/languages',
          },
        },
        head: {
          ref: 'framework-test',
          sha: 'mno345',
          repo: {
            id: 1,
            name: 'test-repo',
            full_name: 'org/test-repo',
            private: false,
            html_url: 'https://example.com/repo',
            default_branch: 'main',
            language: 'JavaScript',
            languages_url: 'https://example.com/languages',
          },
        },
        html_url: 'https://example.com/pr/4',
        diff_url: 'https://example.com/pr/4.diff',
        patch_url: 'https://example.com/pr/4.patch',
        commits_url: 'https://example.com/pr/4/commits',
        comments_url: 'https://example.com/pr/4/comments',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        closed_at: null,
        merged_at: null,
        merge_commit_sha: null,
        additions: 10,
        deletions: 5,
        changed_files: 1,
        commits: 1,
        comments: 0,
        review_comments: 0,
        maintainer_can_modify: false,
        draft: false,
      },
      files: [],
      commits: [],
      checkRuns: [],
      securityAlerts: [],
      metadata: {
        fetchedAt: '2024-01-01T00:00:00Z',
        totalLinesChanged: 15,
        affectedComponents: ['user-service'],
      },
    }

    const results = SecurityAnalyzer.analyzeSecurityFindings(
      mockPR,
      mockCodeRabbitAnalysis,
    )

    // Should map to security frameworks
    expect(results.totalFindings).toBe(1)
    expect(results.highCount).toBe(1)
    expect(results.riskLevel).toBe('high')

    // Should have OWASP coverage
    expect(results.owaspCoverage.categoriesFound).toBeGreaterThan(0)
    expect(results.owaspCoverage.coveragePercentage).toBeGreaterThan(0)

    // Should have CWE coverage
    expect(results.cweCoverage.categoriesFound).toBeGreaterThan(0)

    // Should have security recommendations
    expect(results.recommendations.length).toBeGreaterThan(0)
    expect(results.recommendations[0]).toContain('SQL Injection')
  })
})
