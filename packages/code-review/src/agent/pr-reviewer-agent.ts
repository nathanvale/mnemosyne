#!/usr/bin/env tsx

/**
 * PR Reviewer Agent
 * Expert-level PR analysis using @studio/code-review package's sophisticated analysis classes
 * Follows Firecrawl MCP patterns with structured responses
 */

import {
  UnifiedAnalysisOrchestrator,
  type AnalysisSummary,
} from '../cli/unified-analysis.js'

/**
 * Environment configuration
 */
interface AgentConfig {
  githubToken: string
  confidenceThreshold: number
  maxFindings: number
  outputFormat: 'github' | 'markdown' | 'json'
  includeOWASP: boolean
  includeSANS: boolean
  includeCWE: boolean
  enableExpertFindings: boolean
  timeoutMs: number
}

/**
 * Firecrawl MCP structured response
 */
interface StructuredResponse {
  content: Array<{ type: 'text'; text: string }>
  isError: boolean
  metadata: {
    analysis_id?: string
    timestamp?: string
    confidence_score?: number
    risk_level?: string
    decision?: string
    frameworks_used?: string[]
    findings_summary?: {
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
    error_type?: string
    error_code?: string
    log_path?: string
  }
}

/**
 * PR Reviewer Agent
 */
export class PRReviewerAgent {
  private config: AgentConfig

  constructor() {
    this.config = this.loadConfiguration()
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfiguration(): AgentConfig {
    return {
      githubToken: process.env.GITHUB_TOKEN || '', // Optional - gh CLI auth is preferred
      confidenceThreshold: parseInt(
        process.env.PR_ANALYSIS_CONFIDENCE_THRESHOLD || '70',
      ),
      maxFindings: parseInt(process.env.PR_ANALYSIS_MAX_FINDINGS || '20'),
      outputFormat: (process.env.PR_ANALYSIS_OUTPUT_FORMAT || 'github') as
        | 'github'
        | 'markdown'
        | 'json',
      includeOWASP: process.env.PR_ANALYSIS_INCLUDE_OWASP !== 'false',
      includeSANS: process.env.PR_ANALYSIS_INCLUDE_SANS !== 'false',
      includeCWE: process.env.PR_ANALYSIS_INCLUDE_CWE !== 'false',
      enableExpertFindings:
        process.env.PR_ANALYSIS_ENABLE_EXPERT_FINDINGS !== 'false',
      timeoutMs: parseInt(process.env.PR_ANALYSIS_TIMEOUT_MS || '120000'),
    }
  }

  /**
   * Analyze PR comprehensively using expert validation and security frameworks
   */
  async analyzePRComprehensive(
    prNumber: string,
    repo: string,
    confidenceThreshold?: number,
    includeMetrics: boolean = true,
    outputFormat?: 'github' | 'markdown' | 'json',
  ): Promise<StructuredResponse> {
    try {
      // Create orchestrator with merged configuration
      const orchestrator = new UnifiedAnalysisOrchestrator({
        prNumber: parseInt(prNumber),
        repo,
        includeCodeRabbit: true,
        confidenceThreshold:
          confidenceThreshold || this.config.confidenceThreshold,
        maxFindings: this.config.maxFindings,
        outputFormat: outputFormat || this.config.outputFormat,
        cleanupTempFiles: true,
        verbose: false,
      })

      // Run the unified analysis
      const summary = await orchestrator.runAnalysis()

      // Return the full report if available, otherwise format a summary
      const content =
        summary.fullReport ||
        this.formatAnalysisContent(summary, includeMetrics)

      return {
        content: [{ type: 'text', text: content }],
        isError: false,
        metadata: {
          analysis_id: summary.analysisId,
          timestamp: summary.timestamp,
          confidence_score: summary.confidenceScore,
          risk_level: summary.riskLevel,
          decision: summary.decision,
          frameworks_used: this.getEnabledFrameworks(),
          findings_summary: {
            critical: summary.findings.critical,
            high: summary.findings.high,
            medium: summary.findings.medium,
            low: summary.findings.low,
            expert: summary.findings.expert,
            false_positives: summary.findings.falsePositives,
          },
          ...(summary.metrics && {
            metrics: {
              code_quality_score: summary.metrics.codeQualityScore,
              security_score: summary.metrics.securityScore,
              test_coverage_delta: summary.metrics.testCoverageDelta,
            },
          }),
          ...(summary.logPath && { log_path: summary.logPath }),
        },
      }
    } catch (error) {
      return this.createErrorResponse(error as Error)
    }
  }

  private formatAnalysisContent(
    summary: AnalysisSummary,
    includeMetrics: boolean,
  ): string {
    const totalFindings =
      summary.findings.critical +
      summary.findings.high +
      summary.findings.medium +
      summary.findings.low
    const decision = this.formatDecision(summary.decision)
    const riskLevel = this.formatRiskLevel(summary.riskLevel)

    let content = `## 🔍 Expert PR Analysis

**Decision**: ${decision}
**Risk Level**: ${riskLevel}
**Confidence**: ${summary.confidenceScore}%

### 🛡️ Security Analysis
- **Framework Coverage**: ${this.getEnabledFrameworks().join(', ')}
- **Critical Issues**: ${summary.findings.critical}
- **High Priority**: ${summary.findings.high}
- **Medium Priority**: ${summary.findings.medium}

### 👨‍💻 Expert Validation
- **Total Findings**: ${totalFindings}
- **Expert Findings**: ${summary.findings.expert}
- **False Positives**: ${summary.findings.falsePositives}
- **Confidence Score**: ${summary.confidenceScore}%`

    if (includeMetrics && summary.metrics) {
      content += `

### 📊 Quality Metrics
- **Code Quality Score**: ${summary.metrics.codeQualityScore}/100
- **Security Score**: ${summary.metrics.securityScore}/100
- **Test Coverage Δ**: ${summary.metrics.testCoverageDelta > 0 ? '+' : ''}${summary.metrics.testCoverageDelta}%`
    }

    content += `

---
*Analysis ID: ${summary.analysisId} | Generated by Expert PR Analysis Engine*`

    if (summary.logPath) {
      content += `
*📁 Full report saved to: ${summary.logPath}*`
    }

    return content
  }

  private formatDecision(decision: string): string {
    const decisionMap: Record<string, string> = {
      approve: '✅ **APPROVE**',
      conditional_approval: '⚠️ **CONDITIONAL APPROVAL**',
      request_changes: '❌ **REQUEST CHANGES**',
      security_block: '🚨 **SECURITY BLOCK**',
      manual_review: '🔍 **MANUAL REVIEW NEEDED**',
    }
    return decisionMap[decision] || `❓ **${decision.toUpperCase()}**`
  }

  private formatRiskLevel(level: string): string {
    const levelMap: Record<string, string> = {
      critical: '🚨 **CRITICAL**',
      high: '⚠️ **HIGH**',
      medium: '📋 **MEDIUM**',
      low: '💡 **LOW**',
      unknown: '❓ **UNKNOWN**',
    }
    return levelMap[level] || `❓ **${level.toUpperCase()}**`
  }

  private getEnabledFrameworks(): string[] {
    const frameworks = []
    if (this.config.includeOWASP) frameworks.push('OWASP')
    if (this.config.includeSANS) frameworks.push('SANS')
    if (this.config.includeCWE) frameworks.push('CWE')
    return frameworks
  }

  private createErrorResponse(error: Error): StructuredResponse {
    let errorType = 'unknown_error'
    let errorCode = 'ERR_001'
    let message = `❌ Error: ${error.message}`

    if (error.message.includes('GITHUB_TOKEN')) {
      errorType = 'github_auth_failure'
      errorCode = 'AUTH_001'
      message = `❌ Error: GitHub authentication failed

Details: ${error.message}

Suggested actions:
1. Run \`gh auth status\` to check authentication
2. Run \`gh auth login\` to re-authenticate  
3. Verify GITHUB_TOKEN environment variable`
    } else if (error.message.includes('not found')) {
      errorType = 'pr_not_found'
      errorCode = 'PR_001'
    } else if (error.message.includes('timeout')) {
      errorType = 'analysis_timeout'
      errorCode = 'TIME_001'
    }

    return {
      content: [{ type: 'text', text: message }],
      isError: true,
      metadata: {
        error_type: errorType,
        error_code: errorCode,
        timestamp: new Date().toISOString(),
      },
    }
  }
}

/**
 * CLI interface for testing the PR Reviewer Agent
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h') || args.length < 2) {
    console.error(`
PR Reviewer Agent - Expert-level PR analysis using sophisticated security frameworks

Usage:
  pnpm --filter @studio/code-review review:agent <pr-number> <repo> [options]

Arguments:
  pr-number                    Pull request number to analyze
  repo                         Repository in owner/repo format

Options:
  --confidence-threshold <n>   Override confidence threshold (default: from env or 70)
  --no-metrics                Skip including detailed metrics
  --output-format <format>     Output format: github|markdown|json (default: from env or github)
  --help, -h                  Show this help message

Authentication:
  Uses GitHub CLI authentication (run 'gh auth login' if needed)
  GITHUB_TOKEN environment variable is optional

Environment Variables:
  PR_ANALYSIS_CONFIDENCE_THRESHOLD  Default confidence threshold (default: 70)
  PR_ANALYSIS_MAX_FINDINGS     Maximum findings to display (default: 20)
  PR_ANALYSIS_OUTPUT_FORMAT    Output format (default: github)

Examples:
  pnpm --filter @studio/code-review review:agent 123 owner/repo
  pnpm --filter @studio/code-review review:agent 456 owner/repo --confidence-threshold 80 --no-metrics
`)
    process.exit(0)
  }

  try {
    const prNumber = args[0]
    const repo = args[1]

    // Check for common placeholder values
    if (repo === 'owner/repo' || repo.includes('owner/repo')) {
      console.error(
        'Error: "owner/repo" is a placeholder - you need to provide a real repository name',
      )
      console.error('')
      console.error('Examples of valid repository names:')
      console.error('  • nathanvale/mnemosyne')
      console.error('  • microsoft/vscode')
      console.error('  • facebook/react')
      console.error('')
      console.error(
        'Replace "owner" with the GitHub username/organization and "repo" with the repository name',
      )
      process.exit(1)
    }

    // Parse optional arguments
    const confidenceThresholdIndex = args.indexOf('--confidence-threshold')
    const confidenceThreshold =
      confidenceThresholdIndex !== -1
        ? parseInt(args[confidenceThresholdIndex + 1])
        : undefined

    const outputFormatIndex = args.indexOf('--output-format')
    const outputFormat =
      outputFormatIndex !== -1
        ? (args[outputFormatIndex + 1] as 'github' | 'markdown' | 'json')
        : undefined

    const includeMetrics = !args.includes('--no-metrics')

    // Create and run agent
    const agent = new PRReviewerAgent()
    const result = await agent.analyzePRComprehensive(
      prNumber,
      repo,
      confidenceThreshold,
      includeMetrics,
      outputFormat,
    )

    // Output result
    if (result.isError) {
      console.error(result.content[0].text)
      process.exit(1)
    } else {
      console.error(result.content[0].text)
      console.error(`\n--- Analysis Metadata ---`)
      console.error(JSON.stringify(result.metadata, null, 2))
    }
  } catch (error) {
    console.error('Fatal error in PR Reviewer Agent:', error)
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
