import type {
  CodeRabbitFinding,
  CodeRabbitSeverity,
  CodeRabbitCategory,
} from '../types/coderabbit.js'

/**
 * Issue priority levels for PR review decisions
 */
export enum IssuePriority {
  Blocking = 'blocking', // Must fix before merge
  Important = 'important', // Should fix before merge
  Suggestion = 'suggestion', // Consider fixing
}

/**
 * Categorized issue for review reporting
 */
export interface PrioritizedIssue {
  finding: CodeRabbitFinding
  priority: IssuePriority
  rationale: string
  estimatedEffort?: 'trivial' | 'small' | 'medium' | 'large'
}

/**
 * Issue prioritization result
 */
export interface PrioritizationResult {
  blocking: PrioritizedIssue[]
  important: PrioritizedIssue[]
  suggestions: PrioritizedIssue[]
  summary: {
    totalIssues: number
    blockingCount: number
    importantCount: number
    suggestionCount: number
    mustFixBeforeMerge: boolean
    recommendedAction: 'approve' | 'conditional_approval' | 'request_changes'
  }
}

/**
 * Service for prioritizing CodeRabbit findings based on severity, category, and context
 */
export class IssuePrioritizer {
  private static readonly BLOCKING_COMBINATIONS: Array<{
    severity?: CodeRabbitSeverity[]
    category?: CodeRabbitCategory[]
    keywords?: string[]
  }> = [
    // Critical severity is always blocking
    { severity: ['critical'] },
    // High severity security issues are blocking
    { severity: ['high'], category: ['security'] },
    // High severity bugs are blocking
    { severity: ['high'], category: ['bug_risk'] },
    // Package.json configuration errors (like the one CodeRabbit found)
    {
      severity: ['high', 'medium'],
      keywords: ['package.json', 'exports', 'runtime error', 'production'],
    },
  ]

  private static readonly IMPORTANT_COMBINATIONS: Array<{
    severity?: CodeRabbitSeverity[]
    category?: CodeRabbitCategory[]
    keywords?: string[]
  }> = [
    // High severity non-security issues
    { severity: ['high'] },
    // Medium severity in critical categories
    {
      severity: ['medium'],
      category: ['security', 'bug_risk', 'performance'],
    },
    // Architecture and maintainability issues with medium/high confidence
    {
      category: ['maintainability'],
      keywords: ['tree-shaking', 'bundle size'],
    },
    // Cross-platform compatibility issues
    { keywords: ['cross-platform', 'Windows', 'file path', 'compatibility'] },
    // Magic numbers and hardcoded values
    { keywords: ['magic number', 'hardcoded', 'configurable'] },
  ]

  /**
   * Prioritize a list of CodeRabbit findings
   */
  static prioritizeFindings(
    findings: CodeRabbitFinding[],
  ): PrioritizationResult {
    const blocking: PrioritizedIssue[] = []
    const important: PrioritizedIssue[] = []
    const suggestions: PrioritizedIssue[] = []

    for (const finding of findings) {
      const prioritized = this.prioritizeSingleFinding(finding)

      switch (prioritized.priority) {
        case IssuePriority.Blocking:
          blocking.push(prioritized)
          break
        case IssuePriority.Important:
          important.push(prioritized)
          break
        case IssuePriority.Suggestion:
          suggestions.push(prioritized)
          break
      }
    }

    // Sort within each category by severity and confidence
    blocking.sort(this.compareFindings)
    important.sort(this.compareFindings)
    suggestions.sort(this.compareFindings)

    const mustFixBeforeMerge = blocking.length > 0
    const hasImportantIssues = important.length > 0

    let recommendedAction:
      | 'approve'
      | 'conditional_approval'
      | 'request_changes'
    if (mustFixBeforeMerge) {
      recommendedAction = 'request_changes'
    } else if (hasImportantIssues) {
      recommendedAction = 'conditional_approval'
    } else {
      recommendedAction = 'approve'
    }

    return {
      blocking,
      important,
      suggestions,
      summary: {
        totalIssues: findings.length,
        blockingCount: blocking.length,
        importantCount: important.length,
        suggestionCount: suggestions.length,
        mustFixBeforeMerge,
        recommendedAction,
      },
    }
  }

  /**
   * Prioritize a single finding
   */
  private static prioritizeSingleFinding(
    finding: CodeRabbitFinding,
  ): PrioritizedIssue {
    // Check if it's a blocking issue
    if (this.matchesCriteria(finding, this.BLOCKING_COMBINATIONS)) {
      return {
        finding,
        priority: IssuePriority.Blocking,
        rationale: this.getBlockingRationale(finding),
        estimatedEffort: this.estimateEffort(finding),
      }
    }

    // Check if it's an important issue
    if (this.matchesCriteria(finding, this.IMPORTANT_COMBINATIONS)) {
      return {
        finding,
        priority: IssuePriority.Important,
        rationale: this.getImportantRationale(finding),
        estimatedEffort: this.estimateEffort(finding),
      }
    }

    // Everything else is a suggestion
    return {
      finding,
      priority: IssuePriority.Suggestion,
      rationale: 'Nice-to-have improvement for code quality',
      estimatedEffort: this.estimateEffort(finding),
    }
  }

  /**
   * Check if a finding matches any of the given criteria
   */
  private static matchesCriteria(
    finding: CodeRabbitFinding,
    criteria: Array<{
      severity?: CodeRabbitSeverity[]
      category?: CodeRabbitCategory[]
      keywords?: string[]
    }>,
  ): boolean {
    return criteria.some((criterion) => {
      const severityMatch =
        !criterion.severity || criterion.severity.includes(finding.severity)
      const categoryMatch =
        !criterion.category || criterion.category.includes(finding.category)
      const keywordMatch =
        !criterion.keywords ||
        criterion.keywords.some(
          (keyword) =>
            finding.title.toLowerCase().includes(keyword.toLowerCase()) ||
            finding.description.toLowerCase().includes(keyword.toLowerCase()),
        )

      return severityMatch && categoryMatch && keywordMatch
    })
  }

  /**
   * Get rationale for why an issue is blocking
   */
  private static getBlockingRationale(finding: CodeRabbitFinding): string {
    if (finding.severity === 'critical') {
      return 'Critical severity issues must be fixed before merge'
    }

    if (finding.category === 'security' && finding.severity === 'high') {
      return 'High severity security issues are blocking'
    }

    if (finding.category === 'bug_risk' && finding.severity === 'high') {
      return 'High severity bug risks must be addressed'
    }

    if (
      finding.description.toLowerCase().includes('runtime error') ||
      finding.description.toLowerCase().includes('production')
    ) {
      return 'Issues that cause runtime errors in production are blocking'
    }

    return 'This issue could cause significant problems if deployed'
  }

  /**
   * Get rationale for why an issue is important
   */
  private static getImportantRationale(finding: CodeRabbitFinding): string {
    if (finding.severity === 'high') {
      return 'High severity issues should be addressed before merge'
    }

    if (finding.category === 'performance') {
      return 'Performance issues can impact user experience'
    }

    if (finding.category === 'maintainability') {
      return 'Maintainability issues increase technical debt'
    }

    if (
      finding.description.toLowerCase().includes('tree-shaking') ||
      finding.description.toLowerCase().includes('bundle size')
    ) {
      return 'Bundle size impacts application performance'
    }

    if (finding.description.toLowerCase().includes('cross-platform')) {
      return 'Cross-platform compatibility ensures wider usability'
    }

    return 'This issue impacts code quality and should be addressed'
  }

  /**
   * Estimate the effort required to fix an issue
   */
  private static estimateEffort(
    finding: CodeRabbitFinding,
  ): 'trivial' | 'small' | 'medium' | 'large' {
    // If a suggested fix is provided with high confidence, it's likely trivial
    if (
      finding.suggestedFix &&
      (finding.suggestedFix.confidence === 'very_high' ||
        finding.suggestedFix.confidence === 'high')
    ) {
      return 'trivial'
    }

    // Style and documentation issues are usually small
    if (finding.category === 'style' || finding.category === 'documentation') {
      return 'small'
    }

    // Security and architecture issues are usually larger
    if (
      finding.category === 'security' ||
      finding.description.toLowerCase().includes('architecture') ||
      finding.description.toLowerCase().includes('refactor')
    ) {
      return 'large'
    }

    // Default to medium
    return 'medium'
  }

  /**
   * Compare two prioritized issues for sorting
   */
  private static compareFindings(
    a: PrioritizedIssue,
    b: PrioritizedIssue,
  ): number {
    // Sort by severity first
    const severityOrder = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
      info: 4,
    }
    const severityDiff =
      severityOrder[a.finding.severity] - severityOrder[b.finding.severity]
    if (severityDiff !== 0) return severityDiff

    // Then by confidence
    const confidenceOrder = {
      very_high: 0,
      high: 1,
      medium: 2,
      low: 3,
      very_low: 4,
    }
    return (
      confidenceOrder[a.finding.confidence] -
      confidenceOrder[b.finding.confidence]
    )
  }

  /**
   * Generate a summary report of prioritization
   */
  static generatePrioritizationReport(result: PrioritizationResult): string {
    const lines: string[] = []

    lines.push('## Issue Prioritization Summary\n')
    lines.push(`**Total Issues:** ${result.summary.totalIssues}`)
    lines.push(
      `**Action Required:** ${result.summary.recommendedAction.replace('_', ' ').toUpperCase()}`,
    )
    lines.push(
      `**Must Fix Before Merge:** ${result.summary.mustFixBeforeMerge ? '🚨 YES' : '✅ NO'}\n`,
    )

    if (result.blocking.length > 0) {
      lines.push('### 🚨 Blocking Issues (Must Fix)')
      lines.push(
        `Found ${result.blocking.length} blocking issue(s) that must be resolved:\n`,
      )
      result.blocking.forEach((issue, index) => {
        lines.push(`${index + 1}. **${issue.finding.title}**`)
        lines.push(`   - Severity: ${issue.finding.severity.toUpperCase()}`)
        lines.push(`   - Category: ${issue.finding.category}`)
        lines.push(`   - Rationale: ${issue.rationale}`)
        lines.push(`   - Effort: ${issue.estimatedEffort || 'unknown'}`)
        lines.push(
          `   - Location: ${issue.finding.location.file}:${issue.finding.location.startLine}`,
        )
        if (issue.finding.suggestedFix) {
          lines.push(
            `   - Fix Available: ✅ (${issue.finding.suggestedFix.confidence} confidence)`,
          )
        }
        lines.push('')
      })
    }

    if (result.important.length > 0) {
      lines.push('### ⚠️ Important Issues (Should Fix)')
      lines.push(
        `Found ${result.important.length} important issue(s) that should be addressed:\n`,
      )
      result.important.forEach((issue, index) => {
        lines.push(`${index + 1}. **${issue.finding.title}**`)
        lines.push(`   - Severity: ${issue.finding.severity}`)
        lines.push(`   - Rationale: ${issue.rationale}`)
        lines.push(`   - Effort: ${issue.estimatedEffort || 'unknown'}`)
        lines.push('')
      })
    }

    if (result.suggestions.length > 0) {
      lines.push('### 💡 Suggestions (Consider)')
      lines.push(
        `${result.suggestions.length} suggestion(s) for code improvement`,
      )
    }

    return lines.join('\n')
  }
}
