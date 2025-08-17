import { describe, it, expect, vi } from 'vitest'

import type { CodeRabbitAnalysis } from '../../types/coderabbit'
import type { GitHubPRContext } from '../../types/github'

import { SecurityDataIntegrator } from '../security-data-integrator'
import { MockTaskExecutor } from '../task-executor'

// Mock the LogManager
vi.mock('../../utils/log-manager.js', () => ({
  LogManager: {
    saveSubAgentResponse: vi.fn().mockResolvedValue('/logs/test.json'),
  },
}))

describe('SecurityDataIntegrator', () => {
  describe('analyzeWithClaudeSubAgent', () => {
    it('should analyze PR with Claude sub-agent', async () => {
      const mockResponse = {
        findings: [
          {
            id: 'sec-001',
            title: 'SQL Injection Risk',
            description: 'Potential SQL injection vulnerability',
            severity: 'high' as const,
            category: 'security',
            confidence: 'high',
            location: {
              file: 'api/users.ts',
              line: 42,
            },
          },
        ],
        riskLevel: 'high' as const,
        recommendations: ['Use parameterized queries'],
        confidence: 0.9,
      }

      const mockExecutor = new MockTaskExecutor(mockResponse)
      const integrator = new SecurityDataIntegrator(mockExecutor)

      const githubContext: GitHubPRContext = {
        pullRequest: {
          number: 123,
          title: 'Test PR',
          body: 'Test description',
          base: {
            repo: {
              full_name: 'test/repo',
            },
          },
          additions: 100,
          deletions: 50,
        },
        files: [
          {
            filename: 'api/users.ts',
            status: 'modified',
            additions: 50,
            deletions: 20,
            patch: '+ const query = `SELECT * FROM users WHERE id = ${userId}`',
          },
        ],
        securityAlerts: [],
      } as unknown as GitHubPRContext

      const result = await integrator.analyzeWithClaudeSubAgent(githubContext)

      expect(result).toBeDefined()
      expect(result.findings).toHaveLength(1)
      expect(result.findings[0].title).toBe('SQL Injection Risk')
      expect(result.overallRiskLevel).toBe('high')
      expect(result.recommendations).toContain('Use parameterized queries')
      expect(result.confidence).toBe(0.9)
    })

    it('should handle errors gracefully', async () => {
      const mockExecutor = {
        execute: vi.fn().mockRejectedValue(new Error('Network error')),
      }
      const integrator = new SecurityDataIntegrator(mockExecutor)

      const githubContext: GitHubPRContext = {
        pullRequest: {
          number: 123,
          title: 'Test PR',
          body: 'Test description',
          base: {
            repo: {
              full_name: 'test/repo',
            },
          },
          additions: 100,
          deletions: 50,
        },
        files: [],
        securityAlerts: [],
      } as unknown as GitHubPRContext

      const result = await integrator.analyzeWithClaudeSubAgent(githubContext)

      expect(result).toBeDefined()
      expect(result.findings).toHaveLength(0)
      expect(result.overallRiskLevel).toBe('low')
      expect(result.recommendations).toContain(
        'Error in sub-agent communication',
      )
      expect(result.confidence).toBe(0)
    })
  })

  describe('combineSecurityData', () => {
    it('should combine data from multiple sources', async () => {
      const mockResponse = {
        findings: [],
        riskLevel: 'low' as const,
        recommendations: ['No issues found'],
        confidence: 0.95,
      }

      const mockExecutor = new MockTaskExecutor(mockResponse)
      const integrator = new SecurityDataIntegrator(mockExecutor)

      const githubContext: GitHubPRContext = {
        pullRequest: {
          number: 123,
          title: 'Test PR',
          body: 'Test description',
          base: {
            repo: {
              full_name: 'test/repo',
            },
          },
          additions: 100,
          deletions: 50,
        },
        files: [],
        securityAlerts: [
          {
            security_advisory: {
              summary: 'Dependency vulnerability',
              description: 'A security issue in dependency',
              severity: 'medium',
              cve_id: 'CVE-2024-001',
              cvss: {
                score: 5.5,
              },
            },
          },
        ],
      } as unknown as GitHubPRContext

      const codeRabbitAnalysis: CodeRabbitAnalysis = {
        findings: [
          {
            id: 'cr-001',
            title: 'Security: Hardcoded secret',
            description: 'Found hardcoded API key',
            severity: 'critical',
            category: 'security',
            confidence: 'high',
            location: {
              file: 'config.ts',
              startLine: 10,
              endLine: 10,
            },
            tags: [],
            source: 'coderabbit',
            timestamp: new Date().toISOString(),
          },
        ],
        summary: {
          totalFindings: 1,
          criticalCount: 1,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          infoCount: 0,
          securityIssues: 1,
          performanceIssues: 0,
          maintainabilityIssues: 0,
        },
        confidence: {
          overall: 'high' as const,
          securityAnalysis: 'high' as const,
          performanceAnalysis: 'medium' as const,
          codeQualityAnalysis: 'medium' as const,
        },
        coverage: {
          filesAnalyzed: 1,
          linesAnalyzed: 100,
          functionsAnalyzed: 5,
          coveragePercentage: 80,
        },
        processingMetrics: {
          analysisTimeMs: 100,
          rulesExecuted: 20,
        },
        timestamp: new Date().toISOString(),
        pullRequestId: 123,
        analysisId: 'analysis-001',
      }

      const result = await integrator.combineSecurityData(
        githubContext,
        codeRabbitAnalysis,
      )

      expect(result).toBeDefined()
      expect(result.claudeAnalysis).toBeDefined()
      expect(result.codeRabbitSecurityFindings).toHaveLength(1)
      expect(result.githubSecurityAlerts).toHaveLength(1)
      expect(result.overallAssessment).toBeDefined()
      expect(result.overallAssessment.totalFindings).toBeGreaterThan(0)
    })

    it('should determine critical risk level for critical findings', async () => {
      const mockResponse = {
        findings: [
          {
            id: 'sec-001',
            title: 'Critical vulnerability',
            description: 'Critical security issue',
            severity: 'critical' as const,
            category: 'security',
            confidence: 'very_high',
          },
        ],
        riskLevel: 'critical' as const,
        recommendations: ['Fix immediately'],
        confidence: 0.99,
      }

      const mockExecutor = new MockTaskExecutor(mockResponse)
      const integrator = new SecurityDataIntegrator(mockExecutor)

      const githubContext: GitHubPRContext = {
        pullRequest: {
          number: 123,
          title: 'Test PR',
          body: 'Test description',
          base: {
            repo: {
              full_name: 'test/repo',
            },
          },
          additions: 100,
          deletions: 50,
        },
        files: [],
        securityAlerts: [],
      } as unknown as GitHubPRContext

      const result = await integrator.combineSecurityData(githubContext)

      expect(result.overallAssessment.riskLevel).toBe('critical')
      expect(result.overallAssessment.mustFixBeforeMerge).toBe(true)
      expect(result.overallAssessment.recommendations).toContain(
        '🚨 BLOCKING: Critical security issues must be resolved before merge',
      )
    })
  })
})
