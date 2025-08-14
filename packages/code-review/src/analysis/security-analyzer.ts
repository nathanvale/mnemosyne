import type {
  SecurityAuditResults,
  SecurityFinding,
  SecurityRiskLevel,
  OWASPCategory,
  SANSCategory,
  CWECategory,
} from '../types/analysis.js'
import type {
  CodeRabbitAnalysis,
  CodeRabbitFinding,
  CodeRabbitSeverity,
} from '../types/coderabbit.js'
import type {
  GitHubPRContext,
  GitHubFileChange,
  GitHubSecurityAlert,
} from '../types/github.js'

import { CodeRabbitParser } from '../parsers/coderabbit-parser.js'

/**
 * Multi-phase security analyzer implementing OWASP Top 10, SANS Top 25, and CWE frameworks
 */
export class SecurityAnalyzer {
  /**
   * Phase 1: Comprehensive Security Analysis
   * Implements systematic security audit across multiple frameworks
   */
  static analyzeSecurityFindings(
    githubContext: GitHubPRContext,
    codeRabbitAnalysis?: CodeRabbitAnalysis,
  ): SecurityAuditResults {
    const findings: SecurityFinding[] = []
    let riskLevel: SecurityRiskLevel = 'low'
    let owaspFindings = 0
    let sansFindings = 0
    let cweFindings = 0

    // Extract and validate CodeRabbit security findings
    if (codeRabbitAnalysis) {
      const securityFindings = CodeRabbitParser.extractSecurityFindings(
        codeRabbitAnalysis.findings,
      )

      securityFindings.forEach((finding) => {
        const securityFinding = this.validateSecurityFinding(finding)
        if (securityFinding) {
          findings.push(securityFinding)

          // Update framework counters
          if (securityFinding.owaspCategory) owaspFindings++
          if (securityFinding.sansCategory) sansFindings++
          if (securityFinding.cweCategory) cweFindings++

          // Update overall risk level
          riskLevel = this.calculateRiskLevel(
            riskLevel,
            securityFinding.severity,
          )
        }
      })
    }

    // Analyze GitHub security alerts
    const githubFindings = this.analyzeGitHubSecurityAlerts(
      githubContext.securityAlerts,
    )
    findings.push(...githubFindings)

    // Perform pattern-based security analysis
    const patternFindings = this.performPatternAnalysis(githubContext.files)
    findings.push(...patternFindings)

    // Calculate final risk level
    const finalRiskLevel = this.determineFinalRiskLevel(findings, riskLevel)

    return {
      riskLevel: finalRiskLevel,
      totalFindings: findings.length,
      criticalCount: findings.filter((f) => f.severity === 'critical').length,
      highCount: findings.filter((f) => f.severity === 'high').length,
      mediumCount: findings.filter((f) => f.severity === 'medium').length,
      lowCount: findings.filter((f) => f.severity === 'low').length,
      findings,
      owaspCoverage: {
        totalCategories: 10,
        categoriesFound: owaspFindings,
        coveragePercentage: Math.min((owaspFindings / 10) * 100, 100),
      },
      sansCoverage: {
        totalCategories: 25,
        categoriesFound: sansFindings,
        coveragePercentage: Math.min((sansFindings / 25) * 100, 100),
      },
      cweCoverage: {
        totalCategories: 40, // Top 40 CWE categories
        categoriesFound: cweFindings,
        coveragePercentage: Math.min((cweFindings / 40) * 100, 100),
      },
      recommendations: this.generateSecurityRecommendations(findings),
    }
  }

  /**
   * Validate and enhance CodeRabbit security finding with framework mapping
   */
  private static validateSecurityFinding(
    finding: CodeRabbitFinding,
  ): SecurityFinding | null {
    if (!this.isSecurityRelated(finding)) {
      return null
    }

    const owaspCategory = this.mapToOWASPCategory(finding)
    const sansCategory = this.mapToSANSCategory(finding)
    const cweCategory = this.mapToCWECategory(finding)

    // Validate confidence level - reject low confidence security findings
    if (finding.confidence === 'very_low' || finding.confidence === 'low') {
      return null
    }

    return {
      id: finding.id,
      title: finding.title,
      description: finding.description,
      severity: this.normalizeSeverity(finding.severity),
      confidence: finding.confidence,
      file: finding.location.file,
      line: finding.location.startLine,
      owaspCategory,
      sansCategory,
      cweCategory,
      cweId: finding.cweId,
      cvssScore: finding.cvss,
      exploitability: this.calculateExploitability(finding),
      impact: this.calculateImpact(finding),
      remediation: finding.suggestedFix?.description || '',
      source: 'coderabbit',
    }
  }

  /**
   * Analyze GitHub security alerts for critical vulnerabilities
   */
  private static analyzeGitHubSecurityAlerts(
    alerts: GitHubSecurityAlert[],
  ): SecurityFinding[] {
    const findings: SecurityFinding[] = []

    alerts
      .filter((alert) => alert.state === 'open')
      .forEach((alert) => {
        const severity = this.mapGitHubSeverityToSecuritySeverity(
          alert.security_advisory.severity,
        )

        findings.push({
          id: `github-alert-${alert.number}`,
          title: alert.security_advisory.summary,
          description:
            alert.security_advisory.description ||
            alert.security_advisory.summary,
          severity,
          confidence: 'very_high', // GitHub alerts are high confidence
          file: 'package.json',
          line: 1,
          owaspCategory: this.inferOWASPFromGitHubAlert(alert),
          cweId: alert.security_advisory.cve_id || undefined,
          cvssScore: alert.security_advisory.cvss?.score,
          exploitability: this.calculateGitHubExploitability(alert),
          impact: this.calculateGitHubImpact(alert),
          remediation: `Update ${alert.security_vulnerability.package.name} to fix security vulnerability`,
          source: 'github-security-advisory',
        })
      })

    return findings
  }

  /**
   * Placeholder for pattern-based security analysis
   * Note: Pattern-based security analysis has been removed in favor of Claude's superior security review
   * This method is kept for API compatibility but returns empty findings
   */
  private static performPatternAnalysis(
    _files: GitHubFileChange[],
  ): SecurityFinding[] {
    // Pattern-based security analysis removed - delegated to Claude's /security-review
    return []
  }

  /**
   * Security framework mapping utilities
   */
  private static mapToOWASPCategory(
    finding: CodeRabbitFinding,
  ): OWASPCategory | undefined {
    if (finding.owasp) return finding.owasp as OWASPCategory

    // Infer from CWE or tags
    if (finding.cweId) {
      const cweToOwasp: Record<string, OWASPCategory> = {
        'CWE-79': 'A03_injection', // XSS
        'CWE-89': 'A03_injection', // SQL Injection
        'CWE-22': 'A01_broken_access_control', // Path Traversal
        'CWE-352': 'A01_broken_access_control', // CSRF
        'CWE-798': 'A07_identification_authentication_failures', // Hardcoded credentials
        'CWE-306': 'A07_identification_authentication_failures', // Missing authentication
        'CWE-862': 'A01_broken_access_control', // Missing authorization
      }
      return cweToOwasp[finding.cweId]
    }

    return undefined
  }

  private static mapToSANSCategory(
    finding: CodeRabbitFinding,
  ): SANSCategory | undefined {
    if (finding.cweId) {
      return finding.cweId as SANSCategory
    }
    return undefined
  }

  private static mapToCWECategory(
    finding: CodeRabbitFinding,
  ): CWECategory | undefined {
    if (finding.cweId) {
      return finding.cweId as CWECategory
    }
    return undefined
  }

  /**
   * Risk calculation utilities
   */
  private static calculateRiskLevel(
    current: SecurityRiskLevel,
    newSeverity: string,
  ): SecurityRiskLevel {
    const riskHierarchy = { low: 1, medium: 2, high: 3, critical: 4 }
    const currentLevel = riskHierarchy[current] || 1
    const newLevel =
      riskHierarchy[newSeverity as keyof typeof riskHierarchy] || 1

    const maxLevel = Math.max(currentLevel, newLevel)
    return Object.keys(riskHierarchy).find(
      (key) => riskHierarchy[key as keyof typeof riskHierarchy] === maxLevel,
    ) as SecurityRiskLevel
  }

  private static determineFinalRiskLevel(
    findings: SecurityFinding[],
    baseRisk: SecurityRiskLevel,
  ): SecurityRiskLevel {
    if (findings.some((f) => f.severity === 'critical')) return 'critical'
    if (findings.some((f) => f.severity === 'high')) return 'high'
    if (findings.some((f) => f.severity === 'medium')) return 'medium'
    return baseRisk
  }

  /**
   * Helper utilities
   */
  private static isSecurityRelated(finding: CodeRabbitFinding): boolean {
    return (
      finding.category === 'security' ||
      finding.cweId !== undefined ||
      finding.cvss !== undefined ||
      finding.tags.some((tag) =>
        ['security', 'vulnerability', 'exploit', 'attack'].includes(
          tag.toLowerCase(),
        ),
      )
    )
  }

  private static normalizeSeverity(
    severity: CodeRabbitSeverity,
  ): SecurityRiskLevel {
    const severityMap: Record<CodeRabbitSeverity, SecurityRiskLevel> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      low: 'low',
      info: 'low',
    }
    return severityMap[severity] || 'medium'
  }

  private static calculateExploitability(
    finding: CodeRabbitFinding,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (finding.cvss && finding.cvss >= 9.0) return 'critical'
    if (finding.cvss && finding.cvss >= 7.0) return 'high'
    if (finding.cvss && finding.cvss >= 4.0) return 'medium'
    return 'low'
  }

  private static calculateImpact(
    finding: CodeRabbitFinding,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (finding.cvss && finding.cvss >= 9.0) return 'critical'
    if (finding.cvss && finding.cvss >= 7.0) return 'high'
    if (finding.cvss && finding.cvss >= 4.0) return 'medium'
    return 'low'
  }

  private static mapGitHubSeverityToSecuritySeverity(
    githubSeverity: string,
  ): SecurityRiskLevel {
    const severityMap: Record<string, SecurityRiskLevel> = {
      critical: 'critical',
      high: 'high',
      medium: 'medium',
      moderate: 'medium',
      low: 'low',
    }
    return severityMap[githubSeverity.toLowerCase()] || 'medium'
  }

  private static inferOWASPFromGitHubAlert(
    alert: GitHubSecurityAlert,
  ): OWASPCategory | undefined {
    const summary = alert.security_advisory.summary.toLowerCase()
    if (summary.includes('injection')) return 'A03_injection'
    if (summary.includes('authentication'))
      return 'A07_identification_authentication_failures'
    if (summary.includes('authorization')) return 'A01_broken_access_control'
    if (summary.includes('xss') || summary.includes('cross-site'))
      return 'A03_injection'
    return undefined
  }

  private static calculateGitHubExploitability(
    alert: GitHubSecurityAlert,
  ): 'low' | 'medium' | 'high' | 'critical' {
    const score = alert.security_advisory.cvss?.score
    if (score && score >= 9.0) return 'critical'
    if (score && score >= 7.0) return 'high'
    if (score && score >= 4.0) return 'medium'
    return 'low'
  }

  private static calculateGitHubImpact(
    alert: GitHubSecurityAlert,
  ): 'low' | 'medium' | 'high' | 'critical' {
    const score = alert.security_advisory.cvss?.score
    if (score && score >= 9.0) return 'critical'
    if (score && score >= 7.0) return 'high'
    if (score && score >= 4.0) return 'medium'
    return 'low'
  }

  private static extractLineNumber(patch: string, pattern: RegExp): number {
    const lines = patch.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        // Extract line number from git diff format
        const match = patch
          .substring(0, patch.indexOf(lines[i]))
          .match(/@@ -\d+,\d+ \+(\d+)/g)
        if (match) {
          const lineMatch = match[match.length - 1].match(/\+(\d+)/)
          return lineMatch ? parseInt(lineMatch[1], 10) + i : 1
        }
        return i + 1
      }
    }
    return 1
  }

  private static generateSecurityRecommendations(
    findings: SecurityFinding[],
  ): string[] {
    const recommendations: string[] = []

    if (findings.some((f) => f.severity === 'critical')) {
      recommendations.push(
        '🚨 CRITICAL: Address critical security vulnerabilities immediately before merge',
      )
    }

    const sqlInjectionCount = findings.filter(
      (f) => f.cweId === 'CWE-89',
    ).length
    if (sqlInjectionCount > 0) {
      recommendations.push(
        `🛡️ SQL Injection: Found ${sqlInjectionCount} potential SQL injection vulnerabilities - implement parameterized queries`,
      )
    }

    const xssCount = findings.filter((f) => f.cweId === 'CWE-79').length
    if (xssCount > 0) {
      recommendations.push(
        `🔒 XSS Prevention: Found ${xssCount} XSS vulnerabilities - sanitize user input and escape HTML output`,
      )
    }

    const secretsCount = findings.filter((f) => f.cweId === 'CWE-798').length
    if (secretsCount > 0) {
      recommendations.push(
        `🔐 Secret Management: Found ${secretsCount} hardcoded secrets - move to environment variables`,
      )
    }

    if (findings.length === 0) {
      recommendations.push(
        '✅ No significant security vulnerabilities detected',
      )
    }

    return recommendations
  }
}
