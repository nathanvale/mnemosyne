#!/usr/bin/env tsx

/**
 * Expert PR Analysis Integration
 * Direct integration with @studio/code-review sophisticated analysis classes
 * Replaces basic CLI pattern matching with enterprise-grade security analysis
 */

import type { ReportOptions } from '../reporting/report-generator.js'
import type { PRAnalysisResult, PRMetrics } from '../types/analysis.js'
import type { CodeRabbitAnalysis } from '../types/coderabbit.js'
import type { GitHubPRContext } from '../types/github.js'

import { ContextAnalyzer } from '../analysis/context-analyzer.js'
import { ExpertValidator } from '../analysis/expert-validator.js'
import { SecurityDataIntegrator } from '../analysis/security-data-integrator.js'
import { PRMetricsCollector } from '../metrics/pr-metrics-collector.js'
import { ReportGenerator } from '../reporting/report-generator.js'
import { LogManager } from '../utils/log-manager.js'

/**
 * Expert analysis configuration
 */
interface ExpertAnalysisConfig {
  confidenceThreshold: number
  maxFindings: number
  includeMetrics: boolean
  outputFormat: 'github' | 'markdown' | 'json'
  enableOWASP: boolean
  enableSANS: boolean
  enableCWE: boolean
  enableExpertFindings: boolean
}

/**
 * Structured response following Firecrawl MCP patterns
 */
interface StructuredResponse {
  content: Array<{
    type: 'text'
    text: string
  }>
  isError: boolean
  metadata?: {
    analysis_id: string
    timestamp: string
    confidence_score: number
    risk_level: string
    decision: string
    frameworks_used: string[]
    findings_summary: {
      critical: number
      high: number
      medium: number
      low: number
      expert: number
      false_positives: number
    }
    metrics?: {
      code_quality_score: number
      security_score: number
      test_coverage_delta: number
    }
  }
}

/**
 * Expert PR Analysis Engine
 * Orchestrates sophisticated analysis using all available package capabilities
 */
export class ExpertPRAnalysis {
  private config: ExpertAnalysisConfig

  constructor(config: Partial<ExpertAnalysisConfig> = {}) {
    this.config = {
      confidenceThreshold: config.confidenceThreshold ?? 70,
      maxFindings: config.maxFindings ?? 20,
      includeMetrics: config.includeMetrics ?? true,
      outputFormat: config.outputFormat ?? 'github',
      enableOWASP: config.enableOWASP ?? true,
      enableSANS: config.enableSANS ?? true,
      enableCWE: config.enableCWE ?? true,
      enableExpertFindings: config.enableExpertFindings ?? true,
    }
  }

  /**
   * Run comprehensive expert analysis using sophisticated package classes
   */
  async analyzeComprehensive(
    githubContext: GitHubPRContext,
    codeRabbitAnalysis?: CodeRabbitAnalysis,
  ): Promise<StructuredResponse> {
    const analysisId = this.generateAnalysisId()

    try {
      console.error(`🔍 Starting expert analysis (ID: ${analysisId})`)

      // Phase 1: Claude-enhanced security analysis using SecurityDataIntegrator
      console.error(
        '🛡️ Running Claude security analysis with pr-review-synthesizer...',
      )
      const combinedSecurityData =
        await SecurityDataIntegrator.combineSecurityData(
          githubContext,
          codeRabbitAnalysis,
        )

      // Create legacy SecurityAuditResults for compatibility
      const securityAudit = {
        riskLevel: combinedSecurityData.overallAssessment.riskLevel,
        totalFindings: combinedSecurityData.overallAssessment.totalFindings,
        criticalCount:
          combinedSecurityData.claudeAnalysis.vulnerabilityCount.critical,
        highCount: combinedSecurityData.claudeAnalysis.vulnerabilityCount.high,
        mediumCount:
          combinedSecurityData.claudeAnalysis.vulnerabilityCount.medium,
        lowCount: combinedSecurityData.claudeAnalysis.vulnerabilityCount.low,
        findings: combinedSecurityData.claudeAnalysis.findings.map(
          (finding) => ({
            id: finding.id,
            title: finding.title,
            description: finding.description,
            severity: finding.severity,
            confidence:
              finding.confidence === 'very_high' ? 'high' : finding.confidence,
            file: finding.location?.file || 'unknown',
            line: finding.location?.line || 0,
            remediation:
              finding.remediation || 'No specific remediation provided',
            source: 'pattern-analysis' as const, // Map Claude source to expected enum
            owaspCategory: undefined,
            sansCategory: undefined,
            cweCategory: undefined,
            cweId: finding.cweId,
            cvssScore: finding.cvssScore,
            exploitability: undefined,
            impact: undefined,
          }),
        ),
        owaspCoverage: {
          coveragePercentage: 0,
          categoriesFound: 0,
          totalCategories: 10,
        },
        sansCoverage: {
          coveragePercentage: 0,
          categoriesFound: 0,
          totalCategories: 25,
        },
        cweCoverage: {
          coveragePercentage: 0,
          categoriesFound: 0,
          totalCategories: 100,
        },
        recommendations: combinedSecurityData.overallAssessment.recommendations,
      }

      // Phase 2: Expert validation with confidence scoring
      console.error('🎯 Running expert validation with confidence scoring...')
      const expertValidation = await ExpertValidator.validatePR(
        githubContext,
        codeRabbitAnalysis,
      )

      // Phase 3: Business context analysis
      console.error('🏗️ Analyzing business context and architectural impact...')
      const contextAnalysis = await ContextAnalyzer.analyzeWithContext(
        githubContext,
        codeRabbitAnalysis,
      )

      // Phase 4: Collect comprehensive metrics
      console.error('📈 Collecting comprehensive quality metrics...')
      const metrics = PRMetricsCollector.collectMetrics(
        githubContext,
        codeRabbitAnalysis,
      )

      // Phase 5: Combine into comprehensive analysis result
      const analysisResult: PRAnalysisResult = {
        analysisId,
        pullRequestNumber: githubContext.pullRequest.number,
        analysisTimestamp: new Date().toISOString(),
        analysisVersion: '2.0.0-expert',
        decision: 'conditional_approval' as const, // TODO: Map expertValidation.overallDecision to AnalysisDecision
        riskLevel: securityAudit.riskLevel,
        confidenceScore: expertValidation.confidence,
        githubContext,
        codeRabbitAnalysis,
        validatedFindings: expertValidation.validatedFindings,
        expertFindings: expertValidation.expertFindings,
        falsePositives: expertValidation.validatedFindings
          .filter((f) => f.falsePositive)
          .map((f) => ({ finding: f.original, reason: f.reason })),
        securityAudit,
        metrics,
        blockingIssues: securityAudit.findings
          .filter((f) => f.severity === 'critical')
          .map((f) => ({
            id: f.id,
            title: f.title,
            severity: f.severity,
            mustFixBeforeMerge: true,
          })),
        recommendations: {
          immediate: [
            ...securityAudit.recommendations,
            ...expertValidation.recommendations.immediate,
          ],
          shortTerm: expertValidation.recommendations.shortTerm,
          longTerm: expertValidation.recommendations.longTerm,
        },
        trendAnalysis: {
          historicalComparison: {
            securityTrend: 'stable' as const,
            qualityTrend: 'stable' as const,
            complexityTrend: 'stable' as const,
          },
          teamMetrics: {
            averageSecurityIssues: 0,
            averageReviewTime: 0,
            averageFixTime: 0,
          },
        },
      }

      // Phase 6: Generate sophisticated report
      console.error('📄 Generating comprehensive report...')
      const reportOptions: ReportOptions = {
        format:
          this.config.outputFormat === 'github'
            ? 'github_comment'
            : this.config.outputFormat,
        includeMetrics: this.config.includeMetrics,
        includeTechnicalDetails: true,
        includeRecommendations: true,
        includeArchitecturalInsights: true,
        maxFindingsDisplayed: this.config.maxFindings,
        confidenceThreshold: this.config.confidenceThreshold,
      }

      const report = ReportGenerator.generateReport(
        analysisResult,
        expertValidation,
        contextAnalysis,
        combinedSecurityData, // Use Claude's security analysis
        reportOptions,
      )

      // Save the expert analysis report to logs
      try {
        await LogManager.savePRAnalysisReport(report, {
          timestamp: analysisResult.analysisTimestamp,
          prNumber: githubContext.pullRequest.number,
          repository: githubContext.pullRequest.base.repo.full_name,
          analysisId,
          source: 'expert-analysis',
          format: this.config.outputFormat === 'json' ? 'json' : 'markdown',
        })
      } catch (logError) {
        console.warn('Failed to save analysis report to logs:', logError)
        // Continue even if logging fails
      }

      console.error('✅ Expert analysis completed successfully')

      // Return structured response following Firecrawl MCP patterns
      return {
        content: [
          {
            type: 'text',
            text: report,
          },
        ],
        isError: false,
        metadata: {
          analysis_id: analysisId,
          timestamp: analysisResult.analysisTimestamp,
          confidence_score: expertValidation.confidence,
          risk_level: securityAudit.riskLevel,
          decision: expertValidation.overallDecision,
          frameworks_used: this.getFrameworksUsed(),
          findings_summary: {
            critical: securityAudit.criticalCount,
            high: securityAudit.highCount,
            medium: securityAudit.mediumCount,
            low: securityAudit.lowCount,
            expert: expertValidation.expertFindings.length,
            false_positives: expertValidation.validatedFindings.filter(
              (f) => f.falsePositive,
            ).length,
          },
          ...(this.config.includeMetrics && {
            metrics: {
              code_quality_score: this.calculateCodeQualityScore(metrics),
              security_score: metrics.securityDebtScore,
              test_coverage_delta: metrics.testCoverageDelta,
            },
          }),
        },
      }
    } catch (error) {
      console.error('❌ Expert analysis failed:', error)

      // Return structured error response
      return {
        content: [
          {
            type: 'text',
            text: this.formatErrorMessage(error),
          },
        ],
        isError: true,
        metadata: {
          analysis_id: analysisId,
          timestamp: new Date().toISOString(),
          confidence_score: 0,
          risk_level: 'critical',
          decision: 'security_block',
          frameworks_used: [],
          findings_summary: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            expert: 0,
            false_positives: 0,
          },
        },
      }
    }
  }

  /**
   * Generate unique analysis ID
   */
  private generateAnalysisId(): string {
    return `expert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get frameworks used in analysis
   */
  private getFrameworksUsed(): string[] {
    const frameworks: string[] = []
    if (this.config.enableOWASP) frameworks.push('OWASP')
    if (this.config.enableSANS) frameworks.push('SANS')
    if (this.config.enableCWE) frameworks.push('CWE')
    if (this.config.enableExpertFindings) frameworks.push('Expert Validation')
    return frameworks
  }

  /**
   * Calculate composite code quality score
   */
  private calculateCodeQualityScore(metrics: PRMetrics): number {
    // Simple composite score calculation
    let score = 100

    if (metrics.complexityScore > 8) score -= 20
    else if (metrics.complexityScore > 6) score -= 10

    if (metrics.technicalDebtRatio > 0.3) score -= 15
    else if (metrics.technicalDebtRatio > 0.2) score -= 10

    if (metrics.testCoverageDelta > 0.1) score += 5
    else if (metrics.testCoverageDelta < -0.1) score -= 10

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Format error message for user display
   */
  private formatErrorMessage(error: unknown): string {
    let message = '❌ Expert analysis failed\n\n'

    // Type guard to safely access error properties
    const err = error as Error & { code?: string }

    if (err.code === 'ENOENT') {
      message += '**Issue**: Required dependency not found\n'
      message += '**Solution**: Ensure all package dependencies are installed\n'
      message += '**Command**: `pnpm install`'
    } else if (err.message?.includes('GitHub')) {
      message += '**Issue**: GitHub API access failed\n'
      message += '**Solution**: Check GitHub authentication and permissions\n'
      message += '**Commands**:\n'
      message += '1. `gh auth status` - Check authentication\n'
      message += '2. `gh auth login` - Re-authenticate if needed'
    } else if (err.message?.includes('CodeRabbit')) {
      message += '**Issue**: CodeRabbit integration failed\n'
      message +=
        '**Solution**: Proceeding with expert analysis only (CodeRabbit data will be skipped)\n'
      message +=
        '**Impact**: Reduced finding validation but core analysis still available'
    } else {
      message += `**Error Details**: ${err.message || String(error)}\n`
      message += '**Solution**: Please check the logs and try again'
    }

    message +=
      '\n\n*If this error persists, please report it with the analysis ID above*'
    return message
  }
}

/**
 * CLI Interface for expert analysis
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    console.error(`
Expert PR Analysis - Direct Integration with Sophisticated Analysis Classes

Usage:
  pnpm --filter @studio/code-review review:expert <github-context-file> [options]

Arguments:
  github-context-file   Path to JSON file with GitHub PR context

Options:
  --coderabbit-file <file>     Path to CodeRabbit analysis JSON
  --confidence-threshold <n>   Minimum confidence for findings (default: 70)
  --max-findings <n>           Maximum findings to display (default: 20)
  --output-format <format>     Output format: github|markdown|json (default: github)
  --no-metrics                 Skip metrics collection
  --help, -h                   Show this help message

Examples:
  pnpm --filter @studio/code-review review:expert pr-context.json
  pnpm --filter @studio/code-review review:expert pr-context.json --coderabbit-file coderabbit.json --confidence-threshold 80
`)
    process.exit(0)
  }

  if (args.length < 1) {
    console.error('Error: GitHub context file is required')
    console.error('Run with --help for usage information')
    process.exit(1)
  }

  try {
    // Load GitHub context (this will be provided by the GitHub data fetcher)
    const githubContextFile = args[0]
    const githubContext = JSON.parse(
      await import('fs').then((fs) =>
        fs.readFileSync(githubContextFile, 'utf-8'),
      ),
    )

    // Load CodeRabbit analysis if provided
    let codeRabbitAnalysis: CodeRabbitAnalysis | undefined
    const codeRabbitFileIndex = args.indexOf('--coderabbit-file')
    if (codeRabbitFileIndex !== -1 && args[codeRabbitFileIndex + 1]) {
      const codeRabbitFile = args[codeRabbitFileIndex + 1]
      codeRabbitAnalysis = JSON.parse(
        await import('fs').then((fs) =>
          fs.readFileSync(codeRabbitFile, 'utf-8'),
        ),
      )
    }

    // Parse configuration options
    const config = {
      confidenceThreshold: parseInt(
        args[args.indexOf('--confidence-threshold') + 1] || '70',
      ),
      maxFindings: parseInt(args[args.indexOf('--max-findings') + 1] || '20'),
      outputFormat:
        (args[args.indexOf('--output-format') + 1] as
          | 'github'
          | 'markdown'
          | 'json') || 'github',
      includeMetrics: !args.includes('--no-metrics'),
    }

    // Run expert analysis
    const analyzer = new ExpertPRAnalysis(config)
    const result = await analyzer.analyzeComprehensive(
      githubContext,
      codeRabbitAnalysis,
    )

    // Output result
    if (result.isError) {
      console.error(result.content[0].text)
      process.exit(1)
    } else {
      console.error(result.content[0].text)

      // Output metadata to stderr for programmatic access
      if (result.metadata) {
        console.error(`\n--- Analysis Metadata ---`)
        console.error(JSON.stringify(result.metadata, null, 2))
      }
    }
  } catch (error) {
    console.error('Fatal error in expert analysis:', error)
    process.exit(1)
  }
}

// Run CLI interface if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
}
