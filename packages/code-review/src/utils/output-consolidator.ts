/**
 * Output Consolidator
 * Merges findings from multiple analysis sources into a single consolidated JSON structure
 * for agent consumption
 */

import type { PrioritizedIssue } from '../analysis/issue-prioritizer.js'
import type {
  ConsolidatedAnalysisOutput,
  AnalysisDecision,
  RiskLevel,
  SecurityFinding,
} from '../types/analysis.js'
import type { CodeRabbitFinding } from '../types/coderabbit.js'
import type { GitHubPRContext } from '../types/github.js'

/**
 * Configuration for output consolidation
 */
interface ConsolidatorConfig {
  prNumber: number
  repository: string
  analysisVersion?: string
  verbose?: boolean
}

/**
 * Input data for consolidation
 */
interface ConsolidatorInput {
  githubContext: GitHubPRContext
  coderabbitFindings?: CodeRabbitFinding[]
  securityFindings?: SecurityFinding[]
  expertFindings?: PrioritizedIssue[]
  metrics?: {
    codeQualityScore?: number
    securityScore?: number
    testCoverageDelta?: number
    complexityScore?: number
    confidenceScore?: number
  }
  recommendations?: {
    immediate?: string[]
    shortTerm?: string[]
    longTerm?: string[]
  }
  decision?: AnalysisDecision
  riskLevel?: RiskLevel
}

/**
 * Consolidates analysis outputs from multiple sources into a single JSON structure
 */
export class OutputConsolidator {
  private config: ConsolidatorConfig
  private analysisId: string

  constructor(config: ConsolidatorConfig) {
    this.config = config
    // Generate a simple unique ID based on timestamp and random number
    this.analysisId = `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Consolidate all analysis findings into a single output
   */
  consolidate(input: ConsolidatorInput): ConsolidatedAnalysisOutput {
    const {
      githubContext,
      coderabbitFindings = [],
      securityFindings = [],
      expertFindings = [],
    } = input

    // Count findings by severity
    const severityCounts = this.countSeverities(
      coderabbitFindings,
      securityFindings,
      expertFindings,
    )

    // Find blocking issues
    const blockingIssues = this.findBlockingIssues(expertFindings)

    // Calculate total findings
    const totalCount =
      coderabbitFindings.length +
      securityFindings.length +
      expertFindings.length

    // Generate summary
    const summary = this.generateSummary(input, totalCount, blockingIssues)

    // Build the consolidated output
    const output: ConsolidatedAnalysisOutput = {
      // Metadata
      analysis_id: this.analysisId,
      pr_number: this.config.prNumber,
      repository: this.config.repository,
      timestamp: new Date().toISOString(),
      analysis_version: this.config.analysisVersion || '1.0.0',

      // Context
      github_context: {
        title: githubContext.pullRequest.title || '',
        description: githubContext.pullRequest.body || '',
        author: githubContext.pullRequest.user?.login || 'unknown',
        base_branch: githubContext.pullRequest.base?.ref || 'main',
        head_branch: githubContext.pullRequest.head?.ref || 'unknown',
        files_changed: githubContext.pullRequest.changed_files || 0,
        additions: githubContext.pullRequest.additions || 0,
        deletions: githubContext.pullRequest.deletions || 0,
      },

      // All findings merged
      findings: {
        coderabbit: coderabbitFindings,
        security: securityFindings,
        expert: expertFindings,
        total_count: totalCount,
        by_severity: severityCounts,
      },

      // Metrics
      metrics: {
        code_quality_score: input.metrics?.codeQualityScore || 0,
        security_score: input.metrics?.securityScore || 0,
        test_coverage_delta: input.metrics?.testCoverageDelta,
        complexity_score: input.metrics?.complexityScore || 0,
        confidence_score: input.metrics?.confidenceScore || 0,
      },

      // Decision and recommendations
      decision: input.decision || 'request_changes',
      risk_level: input.riskLevel || this.calculateRiskLevel(severityCounts),
      blocking_issues: blockingIssues,
      recommendations: {
        immediate: input.recommendations?.immediate || [],
        short_term: input.recommendations?.shortTerm || [],
        long_term: input.recommendations?.longTerm || [],
      },

      // Summary
      summary,
    }

    return output
  }

  /**
   * Count findings by severity across all sources
   */
  private countSeverities(
    coderabbitFindings: CodeRabbitFinding[],
    securityFindings: SecurityFinding[],
    expertFindings: PrioritizedIssue[],
  ): ConsolidatedAnalysisOutput['findings']['by_severity'] {
    const counts = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    }

    // Count CodeRabbit findings
    coderabbitFindings.forEach((finding) => {
      const severity = this.mapCodeRabbitSeverity(finding.severity)
      if (severity in counts) {
        counts[severity as keyof typeof counts]++
      }
    })

    // Count security findings
    securityFindings.forEach((finding) => {
      if (finding.severity in counts) {
        counts[finding.severity as keyof typeof counts]++
      }
    })

    // Count expert findings
    expertFindings.forEach((finding) => {
      const severity = this.mapPrioritySeverity(finding.priority)
      if (severity in counts) {
        counts[severity as keyof typeof counts]++
      }
    })

    return counts
  }

  /**
   * Map CodeRabbit severity to standard severity
   */
  private mapCodeRabbitSeverity(severity?: string): string {
    if (!severity) return 'low'

    const severityLower = severity.toLowerCase()
    if (severityLower.includes('critical') || severityLower.includes('🔴'))
      return 'critical'
    if (severityLower.includes('high') || severityLower.includes('🟠'))
      return 'high'
    if (severityLower.includes('medium') || severityLower.includes('🟡'))
      return 'medium'
    return 'low'
  }

  /**
   * Map priority to severity
   */
  private mapPrioritySeverity(priority: PrioritizedIssue['priority']): string {
    switch (priority) {
      case 'blocking':
        return 'critical'
      case 'important':
        return 'high'
      case 'suggestion':
        return 'low'
      default:
        return 'low'
    }
  }

  /**
   * Find blocking issues from expert findings
   */
  private findBlockingIssues(
    expertFindings: PrioritizedIssue[],
  ): PrioritizedIssue[] {
    return expertFindings.filter(
      (finding) =>
        finding.priority === 'blocking' || finding.priority === 'important',
    )
  }

  /**
   * Calculate risk level based on severity counts
   */
  private calculateRiskLevel(
    severityCounts: ConsolidatedAnalysisOutput['findings']['by_severity'],
  ): RiskLevel {
    if (severityCounts.critical > 0) return 'critical'
    if (severityCounts.high > 2) return 'high'
    if (severityCounts.high > 0 || severityCounts.medium > 5) return 'medium'
    return 'low'
  }

  /**
   * Generate a human-readable summary
   */
  private generateSummary(
    input: ConsolidatorInput,
    totalCount: number,
    blockingIssues: PrioritizedIssue[],
  ): ConsolidatedAnalysisOutput['summary'] {
    const keyFindings: string[] = []
    const actionItems: string[] = []

    // Add key findings
    if (blockingIssues.length > 0) {
      keyFindings.push(`${blockingIssues.length} blocking issue(s) found`)
    }
    if (input.securityFindings && input.securityFindings.length > 0) {
      keyFindings.push(
        `${input.securityFindings.length} security concern(s) identified`,
      )
    }
    if (input.coderabbitFindings && input.coderabbitFindings.length > 0) {
      keyFindings.push(
        `${input.coderabbitFindings.length} CodeRabbit finding(s)`,
      )
    }

    // Add action items
    if (blockingIssues.length > 0) {
      actionItems.push('Address blocking issues before merging')
    }
    if (
      input.recommendations?.immediate &&
      input.recommendations.immediate.length > 0
    ) {
      actionItems.push(...input.recommendations.immediate.slice(0, 3))
    }

    // Generate overview
    let overview = `PR analysis found ${totalCount} total issue(s).`
    if (blockingIssues.length > 0) {
      overview += ` ${blockingIssues.length} issue(s) are blocking and must be addressed.`
    }
    if (input.decision) {
      overview += ` Recommendation: ${input.decision.replace('_', ' ')}.`
    }

    return {
      overview,
      key_findings: keyFindings,
      action_items: actionItems,
    }
  }
}

/**
 * Helper function to create a consolidator instance
 */
export function createOutputConsolidator(
  config: ConsolidatorConfig,
): OutputConsolidator {
  return new OutputConsolidator(config)
}
