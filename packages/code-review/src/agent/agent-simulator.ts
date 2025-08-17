/**
 * Agent Simulator - Local simulation of pr-review-synthesizer agent
 *
 * This class simulates the behavior of the pr-review-synthesizer agent
 * that normally runs via the Task tool in an isolated environment.
 * It uses the existing analysis classes to produce the same quality results
 * while ensuring proper logging through LogManager.
 */

import type { CodeRabbitAnalysis } from '../types/coderabbit'
import type { GitHubPRContext } from '../types/github'

import { ExpertPRAnalysis } from '../cli/expert-pr-analysis'

/**
 * Analysis metadata interface
 */
interface AnalysisMetadata {
  confidence_score?: number
  risk_level?: string
  decision?: string
  findings_summary?: {
    critical?: number
    high?: number
    medium?: number
    low?: number
  }
}

/**
 * Agent Simulator - Provides local pr-review-synthesizer functionality
 */
export class AgentSimulator {
  /**
   * Simulate the pr-review-synthesizer agent locally
   * This produces the same comprehensive analysis that the agent would generate
   */
  static async simulatePRReviewSynthesizer(
    prompt: string,
    githubContext: GitHubPRContext,
    codeRabbitAnalysis?: CodeRabbitAnalysis,
  ): Promise<string> {
    try {
      console.warn('🤖 Simulating pr-review-synthesizer agent locally...')

      // Run comprehensive expert analysis
      const expertAnalysis = new ExpertPRAnalysis({
        confidenceThreshold: 80,
        maxFindings: 50, // Show more findings in agent mode
        outputFormat: 'markdown',
        includeMetrics: true,
        enableOWASP: true,
        enableSANS: true,
        enableCWE: true,
        enableExpertFindings: true,
      })

      // Analyze comprehensively
      const result = await expertAnalysis.analyzeComprehensive(
        githubContext,
        codeRabbitAnalysis,
      )

      // The result contains the full report in the content field
      if (result.content && result.content[0] && result.content[0].text) {
        // Add agent-specific header to distinguish from direct package usage
        const agentHeader = `# 🤖 PR Review Synthesis Report

**Agent**: pr-review-synthesizer (local simulation)
**Analysis ID**: ${result.metadata?.analysis_id || `agent-sim-${Date.now()}`}
**Timestamp**: ${new Date().toISOString()}

---

`

        return agentHeader + result.content[0].text
      }

      // Fallback to basic report if full content not available
      return this.generateFallbackReport(
        githubContext,
        codeRabbitAnalysis,
        result.metadata,
      )
    } catch (error) {
      console.error('Error in agent simulation:', error)
      return this.generateErrorReport(error as Error, githubContext)
    }
  }

  /**
   * Generate a fallback report if the main analysis fails
   */
  private static generateFallbackReport(
    githubContext: GitHubPRContext,
    codeRabbitAnalysis: CodeRabbitAnalysis | undefined,
    metadata: AnalysisMetadata | undefined,
  ): string {
    return `# PR Analysis Report (Fallback Mode)

## PR Information
- **Repository**: ${githubContext.pullRequest.base.repo.full_name}
- **PR #${githubContext.pullRequest.number}**: ${githubContext.pullRequest.title}
- **Author**: ${githubContext.pullRequest.user.login}
- **Files Changed**: ${githubContext.files.length}
- **Lines**: +${githubContext.pullRequest.additions} / -${githubContext.pullRequest.deletions}

## Analysis Results
${
  metadata
    ? `
- **Confidence Score**: ${metadata.confidence_score || 'N/A'}%
- **Risk Level**: ${metadata.risk_level || 'unknown'}
- **Decision**: ${metadata.decision || 'manual_review'}

### Findings Summary
- **Critical**: ${metadata.findings_summary?.critical || 0}
- **High**: ${metadata.findings_summary?.high || 0}
- **Medium**: ${metadata.findings_summary?.medium || 0}
- **Low**: ${metadata.findings_summary?.low || 0}
`
    : 'Analysis metadata not available'
}

## CodeRabbit Analysis
${codeRabbitAnalysis ? `Found ${codeRabbitAnalysis.summary?.totalFindings || 0} issues from CodeRabbit` : 'No CodeRabbit analysis available'}

---
*Note: This is a fallback report. Full analysis may not be available.*
`
  }

  /**
   * Generate an error report when analysis fails
   */
  private static generateErrorReport(
    error: Error,
    githubContext: GitHubPRContext,
  ): string {
    return `# ❌ PR Analysis Failed

## Error Details
- **Message**: ${error.message}
- **Type**: ${error.name}

## PR Context
- **Repository**: ${githubContext.pullRequest.base.repo.full_name}
- **PR #${githubContext.pullRequest.number}**: ${githubContext.pullRequest.title}

## Troubleshooting
1. Check that all dependencies are installed: \`pnpm install\`
2. Verify GitHub authentication: \`gh auth status\`
3. Ensure the PR is accessible: \`gh pr view ${githubContext.pullRequest.number}\`

## Stack Trace
\`\`\`
${error.stack || 'No stack trace available'}
\`\`\`

---
*Agent simulation encountered an error. Please check the logs for details.*
`
  }
}
