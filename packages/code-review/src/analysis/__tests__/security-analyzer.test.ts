import { describe, it, expect, vi, beforeEach } from 'vitest'

import type { SecurityRiskLevel } from '../../types/analysis.js'
import type {
  CodeRabbitAnalysis,
  CodeRabbitFinding,
  CodeRabbitSeverity,
} from '../../types/coderabbit.js'
import type {
  GitHubPRContext,
  GitHubSecurityAlert,
} from '../../types/github.js'

import { CodeRabbitParser } from '../../parsers/coderabbit-parser.js'
import { SecurityAnalyzer } from '../security-analyzer.js'

// Mock the CodeRabbitParser
vi.mock('../../parsers/coderabbit-parser.js')

const mockCodeRabbitParser = vi.mocked(CodeRabbitParser)

describe('SecurityAnalyzer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper function to create test GitHub PR context
  function createTestGitHubContext(
    overrides: Partial<GitHubPRContext> = {},
  ): GitHubPRContext {
    return {
      pullRequest: {
        id: 123,
        number: 456,
        title: 'Test PR',
        body: null,
        state: 'open',
        merged: false,
        mergeable: true,
        mergeable_state: 'clean',
        user: {
          id: 1,
          login: 'testuser',
          avatar_url: 'https://example.com/avatar.jpg',
          html_url: 'https://github.com/testuser',
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
            full_name: 'owner/test-repo',
            private: false,
            html_url: 'https://github.com/owner/test-repo',
            default_branch: 'main',
            language: 'TypeScript',
            languages_url:
              'https://api.github.com/repos/owner/test-repo/languages',
          },
        },
        head: {
          ref: 'feature',
          sha: 'def456',
          repo: {
            id: 1,
            name: 'test-repo',
            full_name: 'owner/test-repo',
            private: false,
            html_url: 'https://github.com/owner/test-repo',
            default_branch: 'main',
            language: 'TypeScript',
            languages_url:
              'https://api.github.com/repos/owner/test-repo/languages',
          },
        },
        html_url: 'https://github.com/owner/test-repo/pull/456',
        diff_url: 'https://github.com/owner/test-repo/pull/456.diff',
        patch_url: 'https://github.com/owner/test-repo/pull/456.patch',
        commits_url: 'https://github.com/owner/test-repo/pull/456/commits',
        comments_url: 'https://github.com/owner/test-repo/pull/456/comments',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T01:00:00Z',
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
      },
      files: [],
      commits: [],
      checkRuns: [],
      securityAlerts: [],
      metadata: {
        fetchedAt: '2023-01-01T00:00:00Z',
        totalLinesChanged: 15,
        affectedComponents: ['frontend'],
        complexityScore: 5,
      },
      ...overrides,
    }
  }

  // Helper function to create test security alert
  function createTestSecurityAlert(
    overrides: Partial<GitHubSecurityAlert> = {},
  ): GitHubSecurityAlert {
    return {
      number: 1,
      state: 'open',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T01:00:00Z',
      fixed_at: null,
      dismissed_at: null,
      security_advisory: {
        ghsa_id: 'GHSA-xxxx-xxxx-xxxx',
        cve_id: 'CVE-2023-1234',
        summary: 'Test vulnerability',
        description: 'Test vulnerability description',
        severity: 'high',
        cvss: {
          vector_string: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
          score: 8.5,
        },
      },
      security_vulnerability: {
        package: {
          name: 'test-package',
          ecosystem: 'npm',
        },
        vulnerable_version_range: '<1.0.0',
        first_patched_version: {
          identifier: '1.0.0',
        },
      },
      url: 'https://api.github.com/repos/owner/repo/security-advisories/1',
      html_url:
        'https://github.com/owner/repo/security/advisories/GHSA-xxxx-xxxx-xxxx',
      ...overrides,
    }
  }

  // Helper function to create test CodeRabbit finding
  function createTestCodeRabbitFinding(
    overrides: Partial<CodeRabbitFinding> = {},
  ): CodeRabbitFinding {
    return {
      id: 'finding-1',
      title: 'Test security finding',
      description: 'Test description',
      severity: 'high',
      confidence: 'high',
      category: 'security',
      location: {
        file: 'src/test.ts',
        startLine: 10,
        endLine: 15,
        startColumn: 1,
        endColumn: 10,
      },
      cweId: 'CWE-79',
      cvss: 7.5,
      tags: ['security', 'xss'],
      suggestedFix: {
        description: 'Sanitize user input',
        oldCode: 'userInput',
        newCode: 'sanitizeInput(userInput)',
        confidence: 'high',
        automaticFix: false,
      },
      source: 'coderabbit',
      timestamp: '2023-01-01T00:00:00Z',
      ...overrides,
    }
  }

  // Helper function to create test CodeRabbit analysis
  function createTestCodeRabbitAnalysis(
    findings: CodeRabbitFinding[] = [],
  ): CodeRabbitAnalysis {
    return {
      pullRequestId: 123,
      analysisId: 'analysis-1',
      timestamp: '2023-01-01T00:00:00Z',
      findings,
      summary: {
        totalFindings: findings.length,
        criticalCount: findings.filter((f) => f.severity === 'critical').length,
        highCount: findings.filter((f) => f.severity === 'high').length,
        mediumCount: findings.filter((f) => f.severity === 'medium').length,
        lowCount: findings.filter((f) => f.severity === 'low').length,
        infoCount: findings.filter((f) => f.severity === 'info').length,
        securityIssues: findings.filter((f) => f.category === 'security')
          .length,
        performanceIssues: findings.filter((f) => f.category === 'performance')
          .length,
        maintainabilityIssues: findings.filter(
          (f) => f.category === 'maintainability',
        ).length,
      },
      confidence: {
        overall: 'high',
        securityAnalysis: 'high',
        performanceAnalysis: 'medium',
        codeQualityAnalysis: 'high',
      },
      coverage: {
        filesAnalyzed: 10,
        linesAnalyzed: 1000,
        functionsAnalyzed: 50,
        coveragePercentage: 85,
      },
      processingMetrics: {
        analysisTimeMs: 5000,
        rulesExecuted: 100,
        falsePositiveRate: 0.05,
      },
    }
  }

  describe('analyzeSecurityFindings', () => {
    it('should analyze security findings without CodeRabbit analysis', () => {
      const githubContext = createTestGitHubContext()

      mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([])

      const result = SecurityAnalyzer.analyzeSecurityFindings(githubContext)

      expect(result).toBeDefined()
      expect(result.riskLevel).toBe('low')
      expect(result.totalFindings).toBe(0)
      expect(result.findings).toEqual([])
      expect(result.owaspCoverage.categoriesFound).toBe(0)
      expect(result.sansCoverage.categoriesFound).toBe(0)
      expect(result.cweCoverage.categoriesFound).toBe(0)
    })

    it('should analyze CodeRabbit security findings', () => {
      const securityFinding = createTestCodeRabbitFinding({
        severity: 'critical',
        cweId: 'CWE-79',
        confidence: 'high',
      })

      const codeRabbitAnalysis = createTestCodeRabbitAnalysis([securityFinding])
      const githubContext = createTestGitHubContext()

      mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([
        securityFinding,
      ])

      const result = SecurityAnalyzer.analyzeSecurityFindings(
        githubContext,
        codeRabbitAnalysis,
      )

      expect(result.riskLevel).toBe('critical')
      expect(result.totalFindings).toBe(1)
      expect(result.criticalCount).toBe(1)
      expect(result.findings[0].severity).toBe('critical')
      expect(result.findings[0].owaspCategory).toBe('A03_injection')
      expect(result.owaspCoverage.categoriesFound).toBe(1)
    })

    it('should filter out low confidence CodeRabbit findings', () => {
      const lowConfidenceFinding = createTestCodeRabbitFinding({
        confidence: 'low',
        severity: 'high',
      })

      const codeRabbitAnalysis = createTestCodeRabbitAnalysis([
        lowConfidenceFinding,
      ])
      const githubContext = createTestGitHubContext()

      mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([
        lowConfidenceFinding,
      ])

      const result = SecurityAnalyzer.analyzeSecurityFindings(
        githubContext,
        codeRabbitAnalysis,
      )

      expect(result.totalFindings).toBe(0)
      expect(result.riskLevel).toBe('low')
    })

    it('should analyze GitHub security alerts', () => {
      const securityAlert = createTestSecurityAlert({
        state: 'open',
        security_advisory: {
          ghsa_id: 'GHSA-xxxx-xxxx-xxxx',
          cve_id: 'CVE-2023-1234',
          summary: 'SQL injection vulnerability',
          description: 'Critical SQL injection',
          severity: 'critical',
          cvss: {
            vector_string: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
            score: 9.8,
          },
        },
      })

      const githubContext = createTestGitHubContext({
        securityAlerts: [securityAlert],
      })

      mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([])

      const result = SecurityAnalyzer.analyzeSecurityFindings(githubContext)

      expect(result.totalFindings).toBe(1)
      expect(result.criticalCount).toBe(1)
      expect(result.riskLevel).toBe('critical')
      expect(result.findings[0].source).toBe('github-security-advisory')
      expect(result.findings[0].title).toBe('SQL injection vulnerability')
    })

    it('should ignore dismissed GitHub security alerts', () => {
      const dismissedAlert = createTestSecurityAlert({
        state: 'dismissed',
      })

      const githubContext = createTestGitHubContext({
        securityAlerts: [dismissedAlert],
      })

      mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([])

      const result = SecurityAnalyzer.analyzeSecurityFindings(githubContext)

      expect(result.totalFindings).toBe(0)
    })

    it('should calculate overall risk level correctly', () => {
      const highFinding = createTestCodeRabbitFinding({
        severity: 'high',
        confidence: 'high',
      })
      const mediumFinding = createTestCodeRabbitFinding({
        id: 'finding-2',
        severity: 'medium',
        confidence: 'high',
      })

      const codeRabbitAnalysis = createTestCodeRabbitAnalysis([
        highFinding,
        mediumFinding,
      ])
      const githubContext = createTestGitHubContext()

      mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([
        highFinding,
        mediumFinding,
      ])

      const result = SecurityAnalyzer.analyzeSecurityFindings(
        githubContext,
        codeRabbitAnalysis,
      )

      expect(result.riskLevel).toBe('high')
      expect(result.highCount).toBe(1)
      expect(result.mediumCount).toBe(1)
    })

    it('should generate appropriate security recommendations', () => {
      const criticalFinding = createTestCodeRabbitFinding({
        severity: 'critical',
        cweId: 'CWE-89', // SQL Injection
        confidence: 'high',
      })
      const xssFinding = createTestCodeRabbitFinding({
        id: 'finding-2',
        severity: 'high',
        cweId: 'CWE-79', // XSS
        confidence: 'high',
      })

      const codeRabbitAnalysis = createTestCodeRabbitAnalysis([
        criticalFinding,
        xssFinding,
      ])
      const githubContext = createTestGitHubContext()

      mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([
        criticalFinding,
        xssFinding,
      ])

      const result = SecurityAnalyzer.analyzeSecurityFindings(
        githubContext,
        codeRabbitAnalysis,
      )

      expect(result.recommendations).toContain(
        '🚨 CRITICAL: Address critical security vulnerabilities immediately before merge',
      )
      expect(result.recommendations).toContain(
        '🛡️ SQL Injection: Found 1 potential SQL injection vulnerabilities - implement parameterized queries',
      )
      expect(result.recommendations).toContain(
        '🔒 XSS Prevention: Found 1 XSS vulnerabilities - sanitize user input and escape HTML output',
      )
    })

    it('should provide success message when no vulnerabilities found', () => {
      const githubContext = createTestGitHubContext()

      mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([])

      const result = SecurityAnalyzer.analyzeSecurityFindings(githubContext)

      expect(result.recommendations).toContain(
        '✅ No significant security vulnerabilities detected',
      )
    })
  })

  describe('OWASP mapping', () => {
    it('should map CWE-79 to A03_injection', () => {
      const xssFinding = createTestCodeRabbitFinding({
        cweId: 'CWE-79',
        confidence: 'high',
      })

      const codeRabbitAnalysis = createTestCodeRabbitAnalysis([xssFinding])
      const githubContext = createTestGitHubContext()

      mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([xssFinding])

      const result = SecurityAnalyzer.analyzeSecurityFindings(
        githubContext,
        codeRabbitAnalysis,
      )

      expect(result.findings[0].owaspCategory).toBe('A03_injection')
    })

    it('should map CWE-89 to A03_injection', () => {
      const sqlFinding = createTestCodeRabbitFinding({
        cweId: 'CWE-89',
        confidence: 'high',
      })

      const codeRabbitAnalysis = createTestCodeRabbitAnalysis([sqlFinding])
      const githubContext = createTestGitHubContext()

      mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([sqlFinding])

      const result = SecurityAnalyzer.analyzeSecurityFindings(
        githubContext,
        codeRabbitAnalysis,
      )

      expect(result.findings[0].owaspCategory).toBe('A03_injection')
    })

    it('should map CWE-22 to A01_broken_access_control', () => {
      const pathTraversalFinding = createTestCodeRabbitFinding({
        cweId: 'CWE-22',
        confidence: 'high',
      })

      const codeRabbitAnalysis = createTestCodeRabbitAnalysis([
        pathTraversalFinding,
      ])
      const githubContext = createTestGitHubContext()

      mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([
        pathTraversalFinding,
      ])

      const result = SecurityAnalyzer.analyzeSecurityFindings(
        githubContext,
        codeRabbitAnalysis,
      )

      expect(result.findings[0].owaspCategory).toBe('A01_broken_access_control')
    })

    it('should use explicit OWASP category when provided', () => {
      const findingWithOwasp = createTestCodeRabbitFinding({
        confidence: 'high',
        owasp: 'A07_identification_authentication_failures',
      })

      const codeRabbitAnalysis = createTestCodeRabbitAnalysis([
        findingWithOwasp,
      ])
      const githubContext = createTestGitHubContext()

      mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([
        findingWithOwasp,
      ])

      const result = SecurityAnalyzer.analyzeSecurityFindings(
        githubContext,
        codeRabbitAnalysis,
      )

      expect(result.findings[0].owaspCategory).toBe(
        'A07_identification_authentication_failures',
      )
    })
  })

  describe('severity normalization', () => {
    it('should normalize CodeRabbit severities correctly', () => {
      const testCases: Array<{
        input: CodeRabbitSeverity
        expected: SecurityRiskLevel
      }> = [
        { input: 'critical', expected: 'critical' },
        { input: 'high', expected: 'high' },
        { input: 'medium', expected: 'medium' },
        { input: 'low', expected: 'low' },
        { input: 'info', expected: 'low' },
      ]

      testCases.forEach(({ input, expected }) => {
        const finding = createTestCodeRabbitFinding({
          severity: input,
          confidence: 'high',
        })

        const codeRabbitAnalysis = createTestCodeRabbitAnalysis([finding])
        const githubContext = createTestGitHubContext()

        mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([finding])

        const result = SecurityAnalyzer.analyzeSecurityFindings(
          githubContext,
          codeRabbitAnalysis,
        )

        expect(result.findings[0].severity).toBe(expected)
      })
    })

    it('should map GitHub severities correctly', () => {
      const testCases = [
        { input: 'critical', expected: 'critical' },
        { input: 'high', expected: 'high' },
        { input: 'medium', expected: 'medium' },
        { input: 'moderate', expected: 'medium' },
        { input: 'low', expected: 'low' },
        { input: 'unknown', expected: 'medium' }, // fallback
      ]

      testCases.forEach(({ input, expected }) => {
        const alert = createTestSecurityAlert({
          security_advisory: {
            ghsa_id: 'GHSA-xxxx-xxxx-xxxx',
            cve_id: 'CVE-2023-1234',
            summary: 'Test vulnerability',
            description: 'Test description',
            severity: input as 'low' | 'medium' | 'high' | 'critical',
            cvss: {
              vector_string: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
              score: 5.0,
            },
          },
        })

        const githubContext = createTestGitHubContext({
          securityAlerts: [alert],
        })

        mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([])

        const result = SecurityAnalyzer.analyzeSecurityFindings(githubContext)

        expect(result.findings[0].severity).toBe(expected)
      })
    })
  })

  describe('exploitability and impact calculation', () => {
    it('should calculate exploitability based on CVSS score', () => {
      const testCases = [
        { cvss: 9.5, expected: 'critical' },
        { cvss: 8.0, expected: 'high' },
        { cvss: 5.0, expected: 'medium' },
        { cvss: 2.0, expected: 'low' },
        { cvss: undefined, expected: 'low' },
      ]

      testCases.forEach(({ cvss, expected }) => {
        const finding = createTestCodeRabbitFinding({
          cvss,
          confidence: 'high',
        })

        const codeRabbitAnalysis = createTestCodeRabbitAnalysis([finding])
        const githubContext = createTestGitHubContext()

        mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([finding])

        const result = SecurityAnalyzer.analyzeSecurityFindings(
          githubContext,
          codeRabbitAnalysis,
        )

        expect(result.findings[0].exploitability).toBe(expected)
        expect(result.findings[0].impact).toBe(expected)
      })
    })
  })

  describe('GitHub alert OWASP inference', () => {
    it('should infer OWASP categories from GitHub alert summaries', () => {
      const testCases = [
        { summary: 'SQL injection vulnerability', expected: 'A03_injection' },
        { summary: 'XSS in user input', expected: 'A03_injection' },
        { summary: 'Cross-site scripting attack', expected: 'A03_injection' },
        {
          summary: 'Authentication bypass',
          expected: 'A07_identification_authentication_failures',
        },
        {
          summary: 'Authorization failure',
          expected: 'A01_broken_access_control',
        },
        { summary: 'Generic vulnerability', expected: undefined },
      ]

      testCases.forEach(({ summary, expected }) => {
        const alert = createTestSecurityAlert({
          security_advisory: {
            ghsa_id: 'GHSA-xxxx-xxxx-xxxx',
            cve_id: 'CVE-2023-1234',
            summary,
            description: 'Test description',
            severity: 'medium',
            cvss: {
              vector_string: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
              score: 5.0,
            },
          },
        })

        const githubContext = createTestGitHubContext({
          securityAlerts: [alert],
        })

        mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([])

        const result = SecurityAnalyzer.analyzeSecurityFindings(githubContext)

        expect(result.findings[0].owaspCategory).toBe(expected)
      })
    })
  })

  describe('coverage calculation', () => {
    it('should calculate framework coverage percentages correctly', () => {
      const findings = [
        createTestCodeRabbitFinding({
          id: 'finding-1',
          cweId: 'CWE-79',
          confidence: 'high',
        }),
        createTestCodeRabbitFinding({
          id: 'finding-2',
          cweId: 'CWE-89',
          confidence: 'high',
        }),
        createTestCodeRabbitFinding({
          id: 'finding-3',
          cweId: 'CWE-22',
          confidence: 'high',
        }),
      ]

      const codeRabbitAnalysis = createTestCodeRabbitAnalysis(findings)
      const githubContext = createTestGitHubContext()

      mockCodeRabbitParser.extractSecurityFindings.mockReturnValue(findings)

      const result = SecurityAnalyzer.analyzeSecurityFindings(
        githubContext,
        codeRabbitAnalysis,
      )

      // 3 OWASP categories found (mapped from CWE) out of 10 total
      expect(result.owaspCoverage.categoriesFound).toBe(3)
      expect(result.owaspCoverage.coveragePercentage).toBe(30)

      // 3 SANS categories found out of 25 total
      expect(result.sansCoverage.categoriesFound).toBe(3)
      expect(result.sansCoverage.coveragePercentage).toBe(12)

      // 3 CWE categories found out of 40 total
      expect(result.cweCoverage.categoriesFound).toBe(3)
      expect(result.cweCoverage.coveragePercentage).toBe(7.5)
    })

    it('should cap coverage percentages at 100%', () => {
      // Create more findings than total categories (impossible scenario)
      const findings = Array.from({ length: 15 }, (_, i) =>
        createTestCodeRabbitFinding({
          id: `finding-${i}`,
          cweId: `CWE-${79 + i}`,
          confidence: 'high',
        }),
      )

      const codeRabbitAnalysis = createTestCodeRabbitAnalysis(findings)
      const githubContext = createTestGitHubContext()

      mockCodeRabbitParser.extractSecurityFindings.mockReturnValue(findings)

      const result = SecurityAnalyzer.analyzeSecurityFindings(
        githubContext,
        codeRabbitAnalysis,
      )

      expect(result.owaspCoverage.coveragePercentage).toBeLessThanOrEqual(100)
      expect(result.sansCoverage.coveragePercentage).toBeLessThanOrEqual(100)
      expect(result.cweCoverage.coveragePercentage).toBeLessThanOrEqual(100)
    })
  })

  describe('edge cases', () => {
    it('should handle findings without CWE IDs', () => {
      const findingWithoutCWE = createTestCodeRabbitFinding({
        cweId: undefined,
        confidence: 'high',
      })

      const codeRabbitAnalysis = createTestCodeRabbitAnalysis([
        findingWithoutCWE,
      ])
      const githubContext = createTestGitHubContext()

      mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([
        findingWithoutCWE,
      ])

      const result = SecurityAnalyzer.analyzeSecurityFindings(
        githubContext,
        codeRabbitAnalysis,
      )

      expect(result.findings[0].owaspCategory).toBeUndefined()
      expect(result.findings[0].sansCategory).toBeUndefined()
      expect(result.findings[0].cweCategory).toBeUndefined()
    })

    it('should filter out non-security-related findings', () => {
      const nonSecurityFinding = createTestCodeRabbitFinding({
        category: 'style',
        cweId: undefined,
        cvss: undefined,
        tags: ['formatting', 'style'],
        confidence: 'high',
      })

      const codeRabbitAnalysis = createTestCodeRabbitAnalysis([
        nonSecurityFinding,
      ])
      const githubContext = createTestGitHubContext()

      mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([
        nonSecurityFinding,
      ])

      const result = SecurityAnalyzer.analyzeSecurityFindings(
        githubContext,
        codeRabbitAnalysis,
      )

      expect(result.totalFindings).toBe(0)
    })

    it('should handle empty security alerts and findings', () => {
      const githubContext = createTestGitHubContext({
        securityAlerts: [],
        files: [],
      })

      mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([])

      const result = SecurityAnalyzer.analyzeSecurityFindings(
        githubContext,
        undefined,
      )

      expect(result.totalFindings).toBe(0)
      expect(result.riskLevel).toBe('low')
      expect(result.recommendations).toContain(
        '✅ No significant security vulnerabilities detected',
      )
    })

    it('should handle GitHub alerts without CVSS scores', () => {
      const alertWithoutCVSS = createTestSecurityAlert({
        security_advisory: {
          ghsa_id: 'GHSA-xxxx-xxxx-xxxx',
          cve_id: null,
          summary: 'Test vulnerability',
          description: 'Test description',
          severity: 'medium',
          cvss: {
            vector_string: '',
            score: 0,
          },
        },
      })

      const githubContext = createTestGitHubContext({
        securityAlerts: [alertWithoutCVSS],
      })

      mockCodeRabbitParser.extractSecurityFindings.mockReturnValue([])

      const result = SecurityAnalyzer.analyzeSecurityFindings(githubContext)

      expect(result.findings[0].exploitability).toBe('low')
      expect(result.findings[0].impact).toBe('low')
    })
  })
})
