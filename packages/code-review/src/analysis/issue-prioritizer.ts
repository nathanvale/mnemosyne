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
 * File context for prioritization
 */
export interface FileContext {
  isCore: boolean // Is it in core business logic?
  isUserFacing: boolean // Does it affect UI/API?
  isSecurityRelated: boolean
  isTest: boolean // Is it a test file?
  hasTests: boolean // Are there tests covering this?
  changeSize: number // Larger changes = higher risk
  filePath: string
}

/**
 * Categorized issue for review reporting
 */
export interface PrioritizedIssue {
  finding: CodeRabbitFinding
  priority: IssuePriority
  rationale: string
  estimatedEffort?: 'trivial' | 'small' | 'medium' | 'large'
  severityScore: number // Technical impact score (0-100)
  priorityScore: number // Business urgency score (0-100)
  confidenceAdjustment: number // Confidence multiplier (0.0-1.0)
  finalScore: number // Combined weighted score
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
    averageConfidence: number
    algorithmVersion: string
  }
}

/**
 * Service for prioritizing CodeRabbit findings based on severity, category, and context
 */
export class IssuePrioritizer {
  private static readonly ALGORITHM_VERSION = '2.0.0' // Two-dimensional scoring

  // Severity scores (technical impact)
  private static readonly SEVERITY_SCORES: Record<CodeRabbitSeverity, number> =
    {
      critical: 100,
      high: 80,
      medium: 50,
      low: 30,
      info: 10,
    }

  // Category weights for priority scoring
  private static readonly CATEGORY_WEIGHTS: Record<CodeRabbitCategory, number> =
    {
      security: 1.5,
      bug_risk: 1.3,
      performance: 1.1,
      maintainability: 0.9,
      style: 0.7,
      documentation: 0.6,
      best_practices: 0.8,
      accessibility: 1.0,
      testing: 1.2,
    }

  // Confidence multipliers
  private static readonly CONFIDENCE_MULTIPLIERS = {
    very_high: 1.0,
    high: 0.9,
    medium: 0.7,
    low: 0.5,
    very_low: 0.3,
  }
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
    // Data loss or corruption risks
    {
      severity: ['high', 'medium'],
      keywords: ['data loss', 'data corruption', 'database integrity'],
    },
    // Authentication and authorization failures
    {
      category: ['security'],
      keywords: [
        'authentication bypass',
        'authorization failure',
        'privilege escalation',
      ],
    },
    // Memory leaks and performance degradation that affects production
    {
      severity: ['high'],
      category: ['performance'],
      keywords: ['memory leak', 'infinite loop', 'stack overflow'],
    },
    // Breaking API changes
    {
      severity: ['high', 'medium'],
      keywords: [
        'breaking change',
        'api compatibility',
        'backward compatibility',
      ],
    },
    // Critical dependency vulnerabilities
    {
      keywords: [
        'critical vulnerability',
        'zero-day',
        'CVE',
        'security advisory',
      ],
    },
    // Deployment and build failures
    {
      severity: ['high', 'medium'],
      keywords: [
        'build failure',
        'deployment error',
        'compilation error',
        'syntax error',
      ],
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
    fileContexts?: Map<string, FileContext>,
  ): PrioritizationResult {
    const blocking: PrioritizedIssue[] = []
    const important: PrioritizedIssue[] = []
    const suggestions: PrioritizedIssue[] = []

    for (const finding of findings) {
      const fileContext = fileContexts?.get(finding.location.file)
      const prioritized = this.prioritizeSingleFinding(finding, fileContext)

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

    // Sort within each category by final score
    const sortByFinalScore = (a: PrioritizedIssue, b: PrioritizedIssue) =>
      b.finalScore - a.finalScore

    blocking.sort(sortByFinalScore)
    important.sort(sortByFinalScore)
    suggestions.sort(sortByFinalScore)

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

    // Calculate average confidence
    const allIssues = [...blocking, ...important, ...suggestions]
    const averageConfidence =
      allIssues.length > 0
        ? allIssues.reduce(
            (sum, issue) => sum + issue.confidenceAdjustment,
            0,
          ) / allIssues.length
        : 0

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
        averageConfidence,
        algorithmVersion: this.ALGORITHM_VERSION,
      },
    }
  }

  /**
   * Prioritize a single finding with two-dimensional scoring
   */
  private static prioritizeSingleFinding(
    finding: CodeRabbitFinding,
    fileContext?: FileContext,
  ): PrioritizedIssue {
    // Calculate base scores
    const severityScore = this.calculateSeverityScore(finding)
    const priorityScore = this.calculatePriorityScore(finding, fileContext)
    const confidenceAdjustment = this.CONFIDENCE_MULTIPLIERS[finding.confidence]

    // Calculate final weighted score
    const finalScore =
      (severityScore * 0.6 + priorityScore * 0.4) * confidenceAdjustment

    // Determine priority based on final score and patterns
    let priority: IssuePriority
    let rationale: string

    // Check blocking patterns first (override score-based decision)
    if (
      this.matchesCriteria(finding, this.BLOCKING_COMBINATIONS) ||
      finalScore >= 85
    ) {
      priority = IssuePriority.Blocking
      rationale = this.getBlockingRationale(finding)
    } else if (
      this.matchesCriteria(finding, this.IMPORTANT_COMBINATIONS) ||
      finalScore >= 60
    ) {
      priority = IssuePriority.Important
      rationale = this.getImportantRationale(finding)
    } else {
      priority = IssuePriority.Suggestion
      rationale = 'Nice-to-have improvement for code quality'
    }

    return {
      finding,
      priority,
      rationale,
      estimatedEffort: this.estimateEffort(finding),
      severityScore,
      priorityScore,
      confidenceAdjustment,
      finalScore,
    }
  }

  /**
   * Calculate severity score (technical impact)
   */
  private static calculateSeverityScore(finding: CodeRabbitFinding): number {
    let score = this.SEVERITY_SCORES[finding.severity]

    // Boost score for specific technical impacts
    if (finding.description.toLowerCase().includes('runtime error')) {
      score = Math.min(100, score * 1.3)
    }
    if (finding.description.toLowerCase().includes('data loss')) {
      score = Math.min(100, score * 1.2)
    }
    if (finding.description.toLowerCase().includes('crash')) {
      score = Math.min(100, score * 1.2)
    }

    return score
  }

  /**
   * Calculate priority score (business urgency)
   */
  private static calculatePriorityScore(
    finding: CodeRabbitFinding,
    fileContext?: FileContext,
  ): number {
    let score = 50 // Base priority

    // Apply category weight
    const categoryWeight = this.CATEGORY_WEIGHTS[finding.category] || 1.0
    score = score * categoryWeight

    // Apply file context modifiers if available
    if (fileContext) {
      if (fileContext.isCore) score *= 1.3
      if (fileContext.isUserFacing) score *= 1.2
      if (fileContext.isSecurityRelated) score *= 1.5
      if (fileContext.isTest) score *= 0.5 // Lower priority for test files
      if (!fileContext.hasTests) score *= 1.1 // Higher priority if no tests

      // Adjust based on change size
      if (fileContext.changeSize > 500) score *= 1.2 // Large changes = higher risk
    }

    // Check for critical keywords that increase priority
    const criticalKeywords = [
      'production',
      'security',
      'authentication',
      'authorization',
      'payment',
      'user data',
      'privacy',
      'compliance',
    ]

    const description = finding.description.toLowerCase()
    const title = finding.title.toLowerCase()

    for (const keyword of criticalKeywords) {
      if (description.includes(keyword) || title.includes(keyword)) {
        score *= 1.2
        break
      }
    }

    return Math.min(100, score) // Cap at 100
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
