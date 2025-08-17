import type {
  ContextAnalysisResults,
  BusinessRiskAssessment,
  ArchitecturalInsight,
} from '../analysis/context-analyzer'
import type { ExpertValidationResults } from '../analysis/expert-validator'
import type { PrioritizedIssue } from '../analysis/issue-prioritizer'
import type { CombinedSecurityData } from '../analysis/security-data-integrator'
import type {
  PRAnalysisResult,
  SecurityAuditResults,
  PRMetrics,
  AnalysisDecision,
  RiskLevel,
} from '../types/analysis'

/**
 * Report formatting options
 */
export interface ReportOptions {
  format: 'markdown' | 'html' | 'json' | 'github_comment'
  includeMetrics: boolean
  includeTechnicalDetails: boolean
  includeRecommendations: boolean
  includeArchitecturalInsights: boolean
  maxFindingsDisplayed?: number
  confidenceThreshold?: number
}

/**
 * Report section configuration
 */
export interface ReportSection {
  id: string
  title: string
  emoji: string
  priority: number
  required: boolean
  content: string
}

/**
 * Executive summary for leadership
 */
export interface ExecutiveSummary {
  decision: AnalysisDecision
  riskLevel: RiskLevel
  confidenceScore: number
  keyFindings: string[]
  businessImpact: string
  recommendedAction: string
  timeToReview: string
  blockers: string[]
}

/**
 * Technical summary for developers
 */
export interface TechnicalSummary {
  codeQualityScore: number
  securityScore: number
  testCoverageImpact: number
  performanceImpact: string
  architecturalConcerns: string[]
  frameworkCompliance: boolean
  technicalDebt: number
}

/**
 * Detailed findings breakdown
 */
export interface DetailedFindings {
  critical: FindingSummary[]
  high: FindingSummary[]
  medium: FindingSummary[]
  low: FindingSummary[]
  falsePositives: FindingSummary[]
  expertFindings: FindingSummary[]
}

/**
 * Individual finding summary
 */
export interface FindingSummary {
  id: string
  title: string
  severity: RiskLevel
  confidence: number
  file: string
  line?: number
  category: string
  description: string
  recommendation: string
  fixEstimate: string
  businessJustification?: string
}

/**
 * Comprehensive PR analysis report generator
 */
export class ReportGenerator {
  /**
   * Generate comprehensive PR analysis report with Claude security integration
   */
  static generateReport(
    analysisResult: PRAnalysisResult,
    expertValidation: ExpertValidationResults,
    contextAnalysis: ContextAnalysisResults,
    combinedSecurityData?: CombinedSecurityData,
    options: ReportOptions = {
      format: 'markdown',
      includeMetrics: true,
      includeTechnicalDetails: true,
      includeRecommendations: true,
      includeArchitecturalInsights: true,
      maxFindingsDisplayed: 50, // Show more findings by default
      confidenceThreshold: 50, // Lower threshold to be more inclusive
    },
  ): string {
    const sections: ReportSection[] = []

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(
      analysisResult,
      expertValidation,
      contextAnalysis,
    )
    sections.push({
      id: 'executive-summary',
      title: 'Executive Summary',
      emoji: '📊',
      priority: 1,
      required: true,
      content: this.formatExecutiveSummary(executiveSummary, options.format),
    })

    // Generate technical summary
    if (options.includeTechnicalDetails) {
      const technicalSummary = this.generateTechnicalSummary(
        analysisResult,
        expertValidation,
        contextAnalysis,
      )
      sections.push({
        id: 'technical-summary',
        title: 'Technical Summary',
        emoji: '🔧',
        priority: 2,
        required: false,
        content: this.formatTechnicalSummary(technicalSummary, options.format),
      })
    }

    // Generate prioritized issues section (CodeRabbit findings)
    if (analysisResult.prioritizedIssues) {
      sections.push({
        id: 'prioritized-issues',
        title: 'Prioritized Issues from CodeRabbit',
        emoji: '🎯',
        priority: 3,
        required: true,
        content: this.formatPrioritizedIssues(
          analysisResult.prioritizedIssues,
          options.format,
        ),
      })
    }

    // Generate security analysis - use Claude's analysis if available
    if (combinedSecurityData) {
      sections.push({
        id: 'security-analysis',
        title: 'Security Analysis (Claude Enhanced)',
        emoji: '🛡️',
        priority: 3,
        required: true,
        content: this.formatClaudeSecurityAnalysis(
          combinedSecurityData,
          options.format,
        ),
      })
    } else {
      sections.push({
        id: 'security-analysis',
        title: 'Security Analysis',
        emoji: '🛡️',
        priority: 3,
        required: true,
        content: this.formatSecurityAnalysis(
          analysisResult.securityAudit,
          options.format,
        ),
      })
    }

    // Generate detailed findings
    const detailedFindings = this.generateDetailedFindings(
      analysisResult,
      expertValidation,
      options.maxFindingsDisplayed || 20,
      options.confidenceThreshold || 70,
    )
    sections.push({
      id: 'detailed-findings',
      title: 'Detailed Findings',
      emoji: '🔍',
      priority: 4,
      required: true,
      content: this.formatDetailedFindings(detailedFindings, options.format),
    })

    // Generate architectural insights
    if (
      options.includeArchitecturalInsights &&
      contextAnalysis.architecturalInsights.length > 0
    ) {
      sections.push({
        id: 'architectural-insights',
        title: 'Architectural Insights',
        emoji: '🏗️',
        priority: 5,
        required: false,
        content: this.formatArchitecturalInsights(
          contextAnalysis.architecturalInsights,
          options.format,
        ),
      })
    }

    // Generate metrics dashboard
    if (options.includeMetrics) {
      sections.push({
        id: 'metrics-dashboard',
        title: 'Metrics Dashboard',
        emoji: '📈',
        priority: 6,
        required: false,
        content: this.formatMetricsDashboard(
          analysisResult.metrics,
          options.format,
        ),
      })
    }

    // Generate recommendations
    if (options.includeRecommendations) {
      sections.push({
        id: 'recommendations',
        title: 'Recommendations',
        emoji: '💡',
        priority: 7,
        required: true,
        content: this.formatRecommendations(
          analysisResult.recommendations,
          expertValidation.recommendations,
          options.format,
        ),
      })
    }

    // Generate business risk assessment
    sections.push({
      id: 'business-risk',
      title: 'Business Risk Assessment',
      emoji: '⚠️',
      priority: 8,
      required: true,
      content: this.formatBusinessRiskAssessment(
        contextAnalysis.businessRiskAssessment,
        options.format,
      ),
    })

    // Assemble final report
    return this.assembleReport(sections, analysisResult, options)
  }

  /**
   * Generate executive summary
   */
  private static generateExecutiveSummary(
    analysisResult: PRAnalysisResult,
    expertValidation: ExpertValidationResults,
    contextAnalysis: ContextAnalysisResults,
  ): ExecutiveSummary {
    const decision = expertValidation.overallDecision
    const riskLevel = analysisResult.riskLevel
    const confidenceScore = analysisResult.confidenceScore

    // Key findings from expert validation and Claude security analysis
    const keyFindings = [
      `${analysisResult.securityAudit.totalFindings} security findings identified`,
      `${expertValidation.validatedFindings.length} CodeRabbit findings validated`,
      `${expertValidation.expertFindings.length} additional expert findings`,
      `${contextAnalysis.businessRiskAssessment.affectedDomains.length} business domains affected`,
    ]

    // Business impact assessment
    const businessImpact = this.assessOverallBusinessImpact(
      contextAnalysis.businessRiskAssessment,
      analysisResult.securityAudit,
    )

    // Recommended action based on decision
    const recommendedAction = this.getRecommendedAction(decision)

    // Time to review estimation
    const timeToReview = this.estimateReviewTime(
      analysisResult.metrics,
      analysisResult.securityAudit,
    )

    // Extract blocking issues
    const blockers = expertValidation.blockingIssues.map((issue) => issue.title)

    return {
      decision,
      riskLevel,
      confidenceScore,
      keyFindings,
      businessImpact,
      recommendedAction,
      timeToReview,
      blockers,
    }
  }

  /**
   * Generate technical summary
   */
  private static generateTechnicalSummary(
    analysisResult: PRAnalysisResult,
    expertValidation: ExpertValidationResults,
    contextAnalysis: ContextAnalysisResults,
  ): TechnicalSummary {
    // Calculate composite scores
    const codeQualityScore = this.calculateCodeQualityScore(
      analysisResult.metrics,
    )
    const securityScore = analysisResult.metrics.securityDebtScore

    return {
      codeQualityScore,
      securityScore,
      testCoverageImpact: Math.round(
        analysisResult.metrics.testCoverageDelta * 100,
      ),
      performanceImpact: analysisResult.metrics.performanceImpact,
      architecturalConcerns: contextAnalysis.architecturalInsights.map(
        (i) => i.title,
      ),
      frameworkCompliance: this.assessFrameworkCompliance(contextAnalysis),
      technicalDebt: Math.round(
        analysisResult.metrics.technicalDebtRatio * 100,
      ),
    }
  }

  /**
   * Generate detailed findings breakdown
   */
  private static generateDetailedFindings(
    analysisResult: PRAnalysisResult,
    expertValidation: ExpertValidationResults,
    maxFindings: number,
    _confidenceThreshold: number,
  ): DetailedFindings {
    const findings: DetailedFindings = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      falsePositives: [],
      expertFindings: [],
    }

    // Process validated findings - be more inclusive
    // Sort by severity and confidence to prioritize important findings
    const sortedFindings = expertValidation.validatedFindings
      .filter((f) => f.validated && !f.falsePositive) // Only exclude invalidated/false positives
      .sort((a, b) => {
        // Priority: critical > high > medium > low
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        const severityDiff =
          (severityOrder[b.severity as keyof typeof severityOrder] || 0) -
          (severityOrder[a.severity as keyof typeof severityOrder] || 0)
        if (severityDiff !== 0) return severityDiff
        // Then sort by confidence
        return b.confidence - a.confidence
      })

    // Take more findings if they exist, but respect maxFindings
    sortedFindings
      .slice(0, Math.max(maxFindings, 50)) // Show at least 50 findings if available
      .forEach((finding) => {
        const summary: FindingSummary = {
          id: finding.original.id,
          title: finding.original.title,
          severity: finding.severity,
          confidence: finding.confidence,
          file: finding.original.location.file,
          line: finding.original.location.startLine,
          category: finding.original.category,
          description: finding.original.description,
          recommendation: finding.reason,
          fixEstimate: finding.fixEstimateHours
            ? `${finding.fixEstimateHours} hours`
            : 'Not estimated',
          businessJustification: `Business impact: ${finding.businessImpact}`,
        }

        if (finding.falsePositive) {
          findings.falsePositives.push(summary)
        } else {
          // Only push to arrays that exist in DetailedFindings interface
          const severityKey = finding.severity as keyof Pick<
            DetailedFindings,
            'critical' | 'high' | 'medium' | 'low'
          >
          if (severityKey in findings && Array.isArray(findings[severityKey])) {
            findings[severityKey].push(summary)
          } else {
            // Fallback: treat unknown severities as low
            findings.low.push(summary)
          }
        }
      })

    // Process expert findings
    expertValidation.expertFindings.forEach((finding) => {
      const summary: FindingSummary = {
        id: finding.id,
        title: finding.title,
        severity: finding.severity,
        confidence: 95, // Expert findings have high confidence
        file: finding.location.file,
        line: finding.location.startLine,
        category: finding.category,
        description: finding.description,
        recommendation: finding.suggestedFix,
        fixEstimate: `${finding.fixEstimateHours} hours`,
        businessJustification: finding.businessJustification,
      }

      findings.expertFindings.push(summary)
    })

    return findings
  }

  /**
   * Format executive summary
   */
  private static formatExecutiveSummary(
    summary: ExecutiveSummary,
    format: ReportOptions['format'],
  ): string {
    if (format === 'markdown' || format === 'github_comment') {
      return `
## 📊 Executive Summary

**Decision:** ${this.formatDecision(summary.decision)} | **Risk Level:** ${this.formatRiskLevel(summary.riskLevel)} | **Confidence:** ${summary.confidenceScore}%

### Key Findings
${summary.keyFindings.map((finding) => `- ${finding}`).join('\n')}

### Business Impact
${summary.businessImpact}

### Recommended Action
${summary.recommendedAction}

### Review Time Estimate
${summary.timeToReview}

${
  summary.blockers.length > 0
    ? `
### 🚨 Blocking Issues
${summary.blockers.map((blocker) => `- ${blocker}`).join('\n')}
`
    : ''
}
`.trim()
    }

    // JSON format
    return JSON.stringify(summary, null, 2)
  }

  /**
   * Format technical summary
   */
  private static formatTechnicalSummary(
    summary: TechnicalSummary,
    format: ReportOptions['format'],
  ): string {
    if (format === 'markdown' || format === 'github_comment') {
      return `
## 🔧 Technical Summary

| Metric | Score | Status |
|--------|--------|---------|
| Code Quality | ${summary.codeQualityScore}/100 | ${this.getScoreStatus(summary.codeQualityScore)} |
| Security Score | ${summary.securityScore}/100 | ${this.getScoreStatus(summary.securityScore)} |
| Test Coverage Impact | ${summary.testCoverageImpact}% | ${summary.testCoverageImpact > 0 ? '✅ Improved' : '⚠️ Decreased'} |
| Performance Impact | ${summary.performanceImpact} | ${summary.performanceImpact === 'none' ? '✅ None' : '⚠️ Impact detected'} |
| Technical Debt | ${summary.technicalDebt}% | ${this.getDebtStatus(summary.technicalDebt)} |
| Framework Compliance | ${summary.frameworkCompliance ? 'Yes' : 'No'} | ${summary.frameworkCompliance ? '✅ Compliant' : '⚠️ Issues detected'} |

${
  summary.architecturalConcerns.length > 0
    ? `
### Architectural Concerns
${summary.architecturalConcerns.map((concern) => `- ${concern}`).join('\n')}
`
    : ''
}
`.trim()
    }

    return JSON.stringify(summary, null, 2)
  }

  /**
   * Format prioritized issues from CodeRabbit
   */
  private static formatPrioritizedIssues(
    prioritizedIssues: {
      blocking: PrioritizedIssue[]
      important: PrioritizedIssue[]
      suggestions: PrioritizedIssue[]
    },
    format: ReportOptions['format'],
  ): string {
    if (format === 'markdown' || format === 'github_comment') {
      const sections: string[] = []

      // Blocking issues
      if (prioritizedIssues.blocking.length > 0) {
        sections.push(`### 🚨 Blocking Issues (Must Fix Before Merge)
        
${prioritizedIssues.blocking
  .map(
    (issue, idx) => `
**${idx + 1}. ${issue.finding.title}**
- **Severity:** ${issue.finding.severity.toUpperCase()}
- **Category:** ${issue.finding.category}
- **Location:** ${issue.finding.location.file}:${issue.finding.location.startLine}
- **Rationale:** ${issue.rationale}
- **Description:** ${issue.finding.description}
${issue.finding.suggestedFix ? `- **Fix Available:** ✅ ${issue.finding.suggestedFix.description}` : ''}
`,
  )
  .join('\n')}`)
      }

      // Important issues
      if (prioritizedIssues.important.length > 0) {
        sections.push(`### ⚠️ Important Issues (Should Fix)
        
${prioritizedIssues.important
  .map(
    (issue, idx) => `
**${idx + 1}. ${issue.finding.title}**
- **Severity:** ${issue.finding.severity}
- **Category:** ${issue.finding.category}
- **Location:** ${issue.finding.location.file}:${issue.finding.location.startLine}
- **Rationale:** ${issue.rationale}
`,
  )
  .join('\n')}`)
      }

      // Suggestions
      if (prioritizedIssues.suggestions.length > 0) {
        sections.push(`### 💡 Suggestions (Nice to Have)
        
**${prioritizedIssues.suggestions.length} suggestion(s)** for code quality improvements.`)
      }

      // Summary
      const totalIssues =
        prioritizedIssues.blocking.length +
        prioritizedIssues.important.length +
        prioritizedIssues.suggestions.length

      return `## 🎯 Prioritized CodeRabbit Issues

**Total Issues:** ${totalIssues}
**Blocking:** ${prioritizedIssues.blocking.length} | **Important:** ${prioritizedIssues.important.length} | **Suggestions:** ${prioritizedIssues.suggestions.length}

${sections.join('\n\n')}
`
    }

    return JSON.stringify(prioritizedIssues, null, 2)
  }

  /**
   * Format Claude-enhanced security analysis
   */
  private static formatClaudeSecurityAnalysis(
    combinedData: CombinedSecurityData,
    format: ReportOptions['format'],
  ): string {
    if (format === 'markdown' || format === 'github_comment') {
      const { claudeAnalysis, overallAssessment } = combinedData

      return `
## 🛡️ Security Analysis (Claude Enhanced)

**Overall Risk:** ${this.formatRiskLevel(overallAssessment.riskLevel)} | **Total Findings:** ${overallAssessment.totalFindings}
**Claude Confidence:** ${claudeAnalysis.confidence}% | **Must Fix Before Merge:** ${overallAssessment.mustFixBeforeMerge ? '🚨 YES' : '✅ NO'}

### Claude Security Findings
| Severity | Count | Status |
|----------|-------|--------|
| Critical | ${claudeAnalysis.vulnerabilityCount.critical} | ${claudeAnalysis.vulnerabilityCount.critical > 0 ? '🚨 Immediate action required' : '✅ None'} |
| High | ${claudeAnalysis.vulnerabilityCount.high} | ${claudeAnalysis.vulnerabilityCount.high > 0 ? '⚠️ Review recommended' : '✅ None'} |
| Medium | ${claudeAnalysis.vulnerabilityCount.medium} | ${claudeAnalysis.vulnerabilityCount.medium > 0 ? '📋 Address when possible' : '✅ None'} |
| Low | ${claudeAnalysis.vulnerabilityCount.low} | ${claudeAnalysis.vulnerabilityCount.low > 0 ? '💡 Informational' : '✅ None'} |

### Data Sources Combined
- **Claude pr-review-synthesizer:** ${claudeAnalysis.findings.length} findings
- **CodeRabbit Security Insights:** ${combinedData.codeRabbitSecurityFindings.length} findings
- **GitHub Security Alerts:** ${combinedData.githubSecurityAlerts.length} alerts

### Claude Security Recommendations
${overallAssessment.recommendations.map((rec) => `- ${rec}`).join('\n')}

### Individual Claude Findings
${
  claudeAnalysis.findings.length > 0
    ? claudeAnalysis.findings
        .map(
          (finding) => `
**${finding.title}** (${finding.severity})
- **File:** ${finding.location?.file || 'N/A'}${finding.location?.line ? `:${finding.location.line}` : ''}
- **Category:** ${finding.category}
- **Confidence:** ${finding.confidence}
- **Description:** ${finding.description}
${finding.remediation ? `- **Remediation:** ${finding.remediation}` : ''}
${finding.cweId ? `- **CWE ID:** ${finding.cweId}` : ''}
${finding.cvssScore ? `- **CVSS Score:** ${finding.cvssScore}` : ''}`,
        )
        .join('\n')
    : 'No specific security findings from Claude analysis.'
}
`.trim()
    }

    return JSON.stringify(combinedData, null, 2)
  }

  /**
   * Format legacy security analysis (fallback)
   */
  private static formatSecurityAnalysis(
    securityAudit: SecurityAuditResults,
    format: ReportOptions['format'],
  ): string {
    if (format === 'markdown' || format === 'github_comment') {
      return `
## 🛡️ Security Analysis

**Risk Level:** ${this.formatRiskLevel(securityAudit.riskLevel)} | **Total Findings:** ${securityAudit.totalFindings}

### Security Findings Breakdown
| Severity | Count | Status |
|----------|-------|--------|
| Critical | ${securityAudit.criticalCount} | ${securityAudit.criticalCount > 0 ? '🚨 Immediate action required' : '✅ None'} |
| High | ${securityAudit.highCount} | ${securityAudit.highCount > 0 ? '⚠️ Review recommended' : '✅ None'} |
| Medium | ${securityAudit.mediumCount} | ${securityAudit.mediumCount > 0 ? '📋 Address when possible' : '✅ None'} |
| Low | ${securityAudit.lowCount} | ${securityAudit.lowCount > 0 ? '💡 Informational' : '✅ None'} |

### Framework Coverage
| Framework | Coverage | Findings |
|-----------|----------|----------|
| OWASP Top 10 | ${securityAudit.owaspCoverage.coveragePercentage.toFixed(1)}% | ${securityAudit.owaspCoverage.categoriesFound}/${securityAudit.owaspCoverage.totalCategories} categories |
| SANS Top 25 | ${securityAudit.sansCoverage.coveragePercentage.toFixed(1)}% | ${securityAudit.sansCoverage.categoriesFound}/${securityAudit.sansCoverage.totalCategories} categories |
| CWE | ${securityAudit.cweCoverage.coveragePercentage.toFixed(1)}% | ${securityAudit.cweCoverage.categoriesFound}/${securityAudit.cweCoverage.totalCategories} categories |

### Security Recommendations
${securityAudit.recommendations.map((rec) => `- ${rec}`).join('\n')}
`.trim()
    }

    return JSON.stringify(securityAudit, null, 2)
  }

  /**
   * Format detailed findings
   */
  private static formatDetailedFindings(
    findings: DetailedFindings,
    format: ReportOptions['format'],
  ): string {
    if (format === 'markdown' || format === 'github_comment') {
      let content = '## 🔍 Detailed Findings\n\n'

      // Critical findings
      if (findings.critical.length > 0) {
        content += '### 🚨 Critical Issues\n'
        findings.critical.forEach((finding) => {
          content += this.formatFindingDetail(finding, '🚨')
        })
      }

      // High findings
      if (findings.high.length > 0) {
        content += '### ⚠️ High Priority Issues\n'
        findings.high.forEach((finding) => {
          content += this.formatFindingDetail(finding, '⚠️')
        })
      }

      // Medium findings
      if (findings.medium.length > 0) {
        content += '### 📋 Medium Priority Issues\n'
        // Show first 10 medium findings expanded, rest collapsed
        findings.medium.slice(0, 10).forEach((finding) => {
          content += this.formatFindingDetail(finding, '📋', false)
        })
        findings.medium.slice(10).forEach((finding) => {
          content += this.formatFindingDetail(finding, '📋', true)
        })
      }

      // Expert findings
      if (findings.expertFindings.length > 0) {
        content += '### 👨‍💻 Expert Identified Issues\n'
        findings.expertFindings.forEach((finding) => {
          content += this.formatFindingDetail(finding, '👨‍💻')
        })
      }

      // Low priority findings - show collapsed by default
      if (findings.low.length > 0) {
        content += `### 💡 Low Priority Issues (${findings.low.length} total)\n`
        // Show first 5 low findings, rest hidden
        findings.low.slice(0, 5).forEach((finding) => {
          content += this.formatFindingDetail(finding, '💡', true)
        })
        if (findings.low.length > 5) {
          content += `\n<details>\n<summary>➕ Show ${findings.low.length - 5} more low priority issues</summary>\n\n`
          findings.low.slice(5).forEach((finding) => {
            content += this.formatFindingDetail(finding, '💡', true)
          })
          content += '\n</details>\n\n'
        }
      }

      // False positives - show count but collapsed
      if (findings.falsePositives.length > 0) {
        content += `### ✅ Dismissed (${findings.falsePositives.length} False Positives)\n`
        content += '<details>\n<summary>View dismissed findings</summary>\n\n'
        findings.falsePositives.forEach((finding) => {
          content += this.formatFindingDetail(finding, '✅', true)
        })
        content += '\n</details>\n\n'
      }

      return content.trim()
    }

    return JSON.stringify(findings, null, 2)
  }

  /**
   * Format individual finding detail
   */
  private static formatFindingDetail(
    finding: FindingSummary,
    emoji: string,
    collapsed: boolean = false,
  ): string {
    return `
<details${collapsed ? '' : ' open'}>
<summary>${emoji} <strong>${finding.title}</strong> - ${finding.file}:${finding.line || 'N/A'} (Confidence: ${finding.confidence}%)</summary>

**Category:** ${finding.category} | **Severity:** ${finding.severity} | **Fix Estimate:** ${finding.fixEstimate}

**Description:** ${finding.description}

**Recommendation:** ${finding.recommendation}

${finding.businessJustification ? `**Business Justification:** ${finding.businessJustification}` : ''}

</details>

`
  }

  /**
   * Format architectural insights
   */
  private static formatArchitecturalInsights(
    insights: ArchitecturalInsight[],
    format: ReportOptions['format'],
  ): string {
    if (format === 'markdown' || format === 'github_comment') {
      let content = '## 🏗️ Architectural Insights\n\n'

      insights.forEach((insight) => {
        const emoji = this.getInsightEmoji(insight.type)
        content += `
### ${emoji} ${insight.title}

**Type:** ${insight.type} | **Severity:** ${insight.severity}

**Description:** ${insight.description}

**Affected Files:** ${insight.files.join(', ')}

**Recommendation:** ${insight.recommendation}

`
      })

      return content.trim()
    }

    return JSON.stringify(insights, null, 2)
  }

  /**
   * Format metrics dashboard
   */
  private static formatMetricsDashboard(
    metrics: PRMetrics,
    format: ReportOptions['format'],
  ): string {
    if (format === 'markdown' || format === 'github_comment') {
      return `
## 📈 Metrics Dashboard

### Code Metrics
| Metric | Value | Trend |
|--------|-------|-------|
| Lines Changed | ${metrics.linesChanged} | - |
| Files Changed | ${metrics.filesChanged} | - |
| Functions Changed | ${metrics.functionsChanged} | - |
| Complexity Score | ${metrics.complexityScore.toFixed(1)} | ${this.getComplexityTrend(metrics.complexityScore)} |

### Quality Metrics
| Metric | Value | Status |
|--------|-------|--------|
| Test Coverage Delta | ${(metrics.testCoverageDelta * 100).toFixed(1)}% | ${metrics.testCoverageDelta > 0 ? '📈 Improved' : '📉 Decreased'} |
| Technical Debt Ratio | ${(metrics.technicalDebtRatio * 100).toFixed(1)}% | ${this.getDebtStatus(metrics.technicalDebtRatio * 100)} |
| Documentation Coverage | ${metrics.documentationCoverage.toFixed(1)}% | ${this.getDocumentationStatus(metrics.documentationCoverage)} |

### Security Metrics
| Metric | Value | Status |
|--------|-------|--------|
| Security Issues Found | ${metrics.securityIssuesFound} | ${metrics.securityIssuesFound > 0 ? '⚠️ Issues detected' : '✅ None'} |
| Critical Vulnerabilities | ${metrics.criticalVulnerabilities} | ${metrics.criticalVulnerabilities > 0 ? '🚨 Critical' : '✅ None'} |
| Security Debt Score | ${metrics.securityDebtScore}/100 | ${this.getScoreStatus(metrics.securityDebtScore)} |

### Performance Metrics
| Metric | Value | Impact |
|--------|-------|--------|
| Performance Impact | ${metrics.performanceImpact} | ${this.getPerformanceStatus(metrics.performanceImpact)} |
| Bundle Size Impact | ${metrics.bundleSizeImpact} KB | ${metrics.bundleSizeImpact > 50 ? '⚠️ Significant' : '✅ Minimal'} |

### Analysis Metrics
| Metric | Value | Status |
|--------|-------|--------|
| Analysis Time | ${(metrics.analysisTimeMs / 1000).toFixed(1)}s | - |
| Confidence Score | ${metrics.confidenceScore}% | ${this.getConfidenceStatus(metrics.confidenceScore)} |
| Coverage Percentage | ${metrics.coveragePercentage}% | ${this.getCoverageStatus(metrics.coveragePercentage)} |
`.trim()
    }

    return JSON.stringify(metrics, null, 2)
  }

  /**
   * Format recommendations
   */
  private static formatRecommendations(
    analysisRecommendations: PRAnalysisResult['recommendations'],
    expertRecommendations: ExpertValidationResults['recommendations'],
    format: ReportOptions['format'],
  ): string {
    if (format === 'markdown' || format === 'github_comment') {
      return `
## 💡 Recommendations

### 🚨 Immediate Actions Required
${expertRecommendations.immediate.map((rec) => `- ${rec}`).join('\n')}
${analysisRecommendations.immediate.map((rec) => `- ${rec}`).join('\n')}

### 📋 Short-term Improvements
${expertRecommendations.shortTerm.map((rec) => `- ${rec}`).join('\n')}
${analysisRecommendations.shortTerm.map((rec) => `- ${rec}`).join('\n')}

### 🎯 Long-term Optimizations
${expertRecommendations.longTerm.map((rec) => `- ${rec}`).join('\n')}
${analysisRecommendations.longTerm.map((rec) => `- ${rec}`).join('\n')}
`.trim()
    }

    return JSON.stringify(
      {
        analysis: analysisRecommendations,
        expert: expertRecommendations,
      },
      null,
      2,
    )
  }

  /**
   * Format business risk assessment
   */
  private static formatBusinessRiskAssessment(
    assessment: BusinessRiskAssessment,
    format: ReportOptions['format'],
  ): string {
    if (format === 'markdown' || format === 'github_comment') {
      return `
## ⚠️ Business Risk Assessment

**Overall Risk:** ${this.formatRiskLevel(assessment.overallRisk)}

### Affected Business Domains
${assessment.affectedDomains.map((domain) => `- ${this.formatBusinessDomain(domain)}`).join('\n')}

### Critical Paths Affected
${assessment.criticalPathsAffected.length > 0 ? assessment.criticalPathsAffected.map((path) => `- ${path}`).join('\n') : '✅ No critical paths affected'}

### Impact Assessment
- **User Experience Impact:** ${this.formatUserImpact(assessment.userExperienceImpact)}
- **Data Security Risk:** ${assessment.dataSecurityRisk ? '🚨 Yes - Review required' : '✅ No significant risk'}

${
  assessment.complianceImplications.length > 0
    ? `
### Compliance Implications
${assessment.complianceImplications.map((impl) => `- ${impl}`).join('\n')}
`
    : ''
}
`.trim()
    }

    return JSON.stringify(assessment, null, 2)
  }

  /**
   * Assemble final report
   */
  private static assembleReport(
    sections: ReportSection[],
    analysisResult: PRAnalysisResult,
    options: ReportOptions,
  ): string {
    if (options.format === 'json') {
      return JSON.stringify(
        {
          metadata: {
            analysisId: analysisResult.analysisId,
            timestamp: analysisResult.analysisTimestamp,
            version: analysisResult.analysisVersion,
          },
          sections: sections.map((s) => ({
            id: s.id,
            title: s.title,
            content: JSON.parse(s.content),
          })),
        },
        null,
        2,
      )
    }

    // Markdown/HTML format
    const sortedSections = sections.sort((a, b) => a.priority - b.priority)

    let report = `# 🔍 PR Analysis Report\n\n`
    report += `**Analysis ID:** ${analysisResult.analysisId} | **Generated:** ${new Date(analysisResult.analysisTimestamp).toLocaleString()}\n\n`

    // Add quick navigation
    report += `## Quick Navigation\n`
    sortedSections.forEach((section) => {
      report += `- [${section.emoji} ${section.title}](#${section.id})\n`
    })
    report += '\n---\n\n'

    // Add sections
    sortedSections.forEach((section) => {
      report += `${section.content}\n\n---\n\n`
    })

    // Add footer
    report += `*Report generated by PR Analysis Engine v${analysisResult.analysisVersion}*`

    return report
  }

  // Helper methods for formatting
  private static formatDecision(decision: AnalysisDecision): string {
    const decisionMap = {
      approve: '✅ **APPROVE**',
      conditional_approval: '⚠️ **CONDITIONAL APPROVAL**',
      request_changes: '❌ **REQUEST CHANGES**',
      security_block: '🚨 **SECURITY BLOCK**',
    }
    return decisionMap[decision]
  }

  private static formatRiskLevel(level: RiskLevel): string {
    const levelMap = {
      critical: '🚨 **CRITICAL**',
      high: '⚠️ **HIGH**',
      medium: '📋 **MEDIUM**',
      low: '💡 **LOW**',
    }
    return levelMap[level]
  }

  private static getScoreStatus(score: number): string {
    if (score >= 90) return '✅ Excellent'
    if (score >= 80) return '✅ Good'
    if (score >= 70) return '⚠️ Acceptable'
    if (score >= 60) return '⚠️ Needs improvement'
    return '❌ Poor'
  }

  private static getDebtStatus(debt: number): string {
    if (debt <= 10) return '✅ Low'
    if (debt <= 20) return '⚠️ Moderate'
    if (debt <= 35) return '⚠️ High'
    return '❌ Critical'
  }

  private static getInsightEmoji(type: ArchitecturalInsight['type']): string {
    const emojiMap = {
      pattern_violation: '🔴',
      design_concern: '🟡',
      scalability_issue: '📈',
      coupling_issue: '🔗',
    }
    return emojiMap[type]
  }

  private static getComplexityTrend(score: number): string {
    if (score <= 5) return '✅ Low complexity'
    if (score <= 8) return '⚠️ Moderate complexity'
    return '❌ High complexity'
  }

  private static getDocumentationStatus(coverage: number): string {
    if (coverage >= 80) return '✅ Well documented'
    if (coverage >= 60) return '⚠️ Moderately documented'
    return '❌ Poorly documented'
  }

  private static getPerformanceStatus(impact: string): string {
    const statusMap = {
      none: '✅ No impact',
      low: '✅ Minimal impact',
      medium: '⚠️ Moderate impact',
      high: '❌ Significant impact',
    }
    return statusMap[impact as keyof typeof statusMap] || '❓ Unknown'
  }

  private static getConfidenceStatus(score: number): string {
    if (score >= 90) return '✅ Very high'
    if (score >= 80) return '✅ High'
    if (score >= 70) return '⚠️ Moderate'
    return '❌ Low'
  }

  private static getCoverageStatus(coverage: number): string {
    if (coverage >= 95) return '✅ Comprehensive'
    if (coverage >= 80) return '✅ Good coverage'
    if (coverage >= 60) return '⚠️ Partial coverage'
    return '❌ Limited coverage'
  }

  private static formatBusinessDomain(domain: string): string {
    return domain.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  private static formatUserImpact(
    impact: BusinessRiskAssessment['userExperienceImpact'],
  ): string {
    const impactMap = {
      none: '✅ No impact',
      low: '✅ Minimal impact',
      medium: '⚠️ Moderate impact',
      high: '❌ Significant impact',
    }
    return impactMap[impact]
  }

  // Business logic helpers
  private static assessOverallBusinessImpact(
    riskAssessment: BusinessRiskAssessment,
    securityAudit: SecurityAuditResults,
  ): string {
    if (securityAudit.criticalCount > 0) {
      return 'Critical security vulnerabilities pose immediate business risk requiring urgent attention.'
    }

    if (riskAssessment.dataSecurityRisk) {
      return 'Data security concerns identified that may affect user trust and regulatory compliance.'
    }

    if (riskAssessment.userExperienceImpact === 'high') {
      return 'Significant user experience impact that may affect product adoption and satisfaction.'
    }

    if (riskAssessment.complianceImplications.length > 0) {
      return 'Compliance implications identified that require review before deployment.'
    }

    return 'Low to moderate business impact. Changes appear safe for production deployment.'
  }

  private static getRecommendedAction(decision: AnalysisDecision): string {
    if (decision === 'security_block') {
      return 'BLOCK: Do not merge until critical security issues are resolved.'
    }

    if (decision === 'request_changes') {
      return 'REQUEST CHANGES: Address high-priority issues before approval.'
    }

    if (decision === 'conditional_approval') {
      return 'CONDITIONAL APPROVAL: May proceed with monitoring of identified issues.'
    }

    return 'APPROVE: Changes meet quality and security standards.'
  }

  private static estimateReviewTime(
    metrics: PRMetrics,
    securityAudit: SecurityAuditResults,
  ): string {
    let baseTime = 15 // Base 15 minutes

    // Add time based on code size
    if (metrics.linesChanged > 500) baseTime += 30
    else if (metrics.linesChanged > 200) baseTime += 15
    else if (metrics.linesChanged > 100) baseTime += 10

    // Add time for security issues
    baseTime += securityAudit.criticalCount * 20
    baseTime += securityAudit.highCount * 10
    baseTime += securityAudit.mediumCount * 5

    // Add time for complexity
    if (metrics.complexityScore > 8) baseTime += 20
    else if (metrics.complexityScore > 6) baseTime += 10

    const hours = Math.floor(baseTime / 60)
    const minutes = baseTime % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  private static calculateCodeQualityScore(metrics: PRMetrics): number {
    let score = 100

    // Penalize high complexity
    if (metrics.complexityScore > 8) score -= 20
    else if (metrics.complexityScore > 6) score -= 10

    // Penalize high technical debt
    if (metrics.technicalDebtRatio > 0.3) score -= 15
    else if (metrics.technicalDebtRatio > 0.2) score -= 10

    // Reward good test coverage
    if (metrics.testCoverageDelta > 0.1) score += 5
    else if (metrics.testCoverageDelta < -0.1) score -= 10

    // Penalize poor documentation
    if (metrics.documentationCoverage < 50) score -= 10

    return Math.max(0, Math.min(100, score))
  }

  private static assessFrameworkCompliance(
    contextAnalysis: ContextAnalysisResults,
  ): boolean {
    // Check for architectural violations
    const hasViolations = contextAnalysis.architecturalInsights.some(
      (insight) => insight.type === 'pattern_violation',
    )

    return !hasViolations
  }
}
