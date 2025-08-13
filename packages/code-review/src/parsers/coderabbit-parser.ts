import {
  IssuePrioritizer,
  type PrioritizationResult,
} from '../analysis/issue-prioritizer.js'
import {
  CodeRabbitAPIResponse,
  CodeRabbitAnalysis,
  CodeRabbitFinding,
} from '../types/coderabbit.js'

/**
 * Parser for CodeRabbit API responses and webhook data
 */
export class CodeRabbitParser {
  /**
   * Parse CodeRabbit API response with Zod validation
   */
  static parseAPIResponse(rawData: unknown): CodeRabbitAPIResponse | null {
    const result = CodeRabbitAPIResponse.safeParse(rawData)
    return result.success ? result.data : null
  }

  /**
   * Parse CodeRabbit analysis with Zod validation
   */
  static parseAnalysis(rawData: unknown): CodeRabbitAnalysis | null {
    const result = CodeRabbitAnalysis.safeParse(rawData)
    return result.success ? result.data : null
  }

  /**
   * Parse individual CodeRabbit finding with Zod validation
   */
  static parseFinding(rawData: unknown): CodeRabbitFinding | null {
    const result = CodeRabbitFinding.safeParse(rawData)
    return result.success ? result.data : null
  }

  /**
   * Filter findings by severity
   */
  static filterBySeverity(
    findings: CodeRabbitFinding[],
    minSeverity: 'critical' | 'high' | 'medium' | 'low' | 'info' = 'low',
  ): CodeRabbitFinding[] {
    const severityOrder = {
      critical: 5,
      high: 4,
      medium: 3,
      low: 2,
      info: 1,
    }

    const threshold = severityOrder[minSeverity]
    return findings.filter((f) => (severityOrder[f.severity] || 0) >= threshold)
  }

  /**
   * Filter findings by category
   */
  static filterByCategory(
    findings: CodeRabbitFinding[],
    categories: string[],
  ): CodeRabbitFinding[] {
    return findings.filter((f) => categories.includes(f.category))
  }

  /**
   * Group findings by file
   */
  static groupByFile(
    findings: CodeRabbitFinding[],
  ): Record<string, CodeRabbitFinding[]> {
    return findings.reduce(
      (groups, finding) => {
        const file = finding.location.file
        if (!groups[file]) {
          groups[file] = []
        }
        groups[file].push(finding)
        return groups
      },
      {} as Record<string, CodeRabbitFinding[]>,
    )
  }

  /**
   * Extract security-related findings
   */
  static extractSecurityFindings(
    findings: CodeRabbitFinding[],
  ): CodeRabbitFinding[] {
    return findings.filter(
      (f) =>
        f.category === 'security' ||
        f.cweId ||
        f.owasp ||
        f.cvss !== undefined ||
        f.tags.some((tag) =>
          ['security', 'vulnerability'].some((keyword) =>
            tag.toLowerCase().includes(keyword),
          ),
        ),
    )
  }

  /**
   * Calculate confidence statistics
   */
  static calculateConfidenceStats(findings: CodeRabbitFinding[]): {
    averageConfidence: number
    highConfidenceCount: number
    lowConfidenceCount: number
  } {
    if (findings.length === 0) {
      return {
        averageConfidence: 0,
        highConfidenceCount: 0,
        lowConfidenceCount: 0,
      }
    }

    const confidenceScores = findings.map((f) => {
      switch (f.confidence) {
        case 'very_high':
          return 5
        case 'high':
          return 4
        case 'medium':
          return 3
        case 'low':
          return 2
        case 'very_low':
          return 1
        default:
          return 3
      }
    })

    const averageConfidence =
      confidenceScores.reduce((sum, score) => sum + score, 0) /
      confidenceScores.length

    const highConfidenceCount = findings.filter(
      (f) => f.confidence === 'very_high' || f.confidence === 'high',
    ).length

    const lowConfidenceCount = findings.filter(
      (f) => f.confidence === 'very_low' || f.confidence === 'low',
    ).length

    return {
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      highConfidenceCount,
      lowConfidenceCount,
    }
  }

  /**
   * Get findings summary statistics
   */
  static getFindingsSummary(findings: CodeRabbitFinding[]): {
    total: number
    bySeverity: Record<string, number>
    byCategory: Record<string, number>
    securityCount: number
  } {
    const bySeverity: Record<string, number> = {}
    const byCategory: Record<string, number> = {}

    findings.forEach((finding) => {
      bySeverity[finding.severity] = (bySeverity[finding.severity] || 0) + 1
      byCategory[finding.category] = (byCategory[finding.category] || 0) + 1
    })

    return {
      total: findings.length,
      bySeverity,
      byCategory,
      securityCount: this.extractSecurityFindings(findings).length,
    }
  }

  /**
   * Prioritize findings based on severity, category, and impact
   * This method maps CodeRabbit findings to blocking/important/suggestion categories
   */
  static prioritizeFindings(
    findings: CodeRabbitFinding[],
  ): PrioritizationResult {
    return IssuePrioritizer.prioritizeFindings(findings)
  }

  /**
   * Generate a prioritization report for findings
   */
  static generatePrioritizationReport(findings: CodeRabbitFinding[]): string {
    const prioritization = this.prioritizeFindings(findings)
    return IssuePrioritizer.generatePrioritizationReport(prioritization)
  }
}
