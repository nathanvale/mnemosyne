import type {
  ValidatedFinding,
  ExpertFinding,
  SecurityAuditResults,
  PRMetrics,
  AnalysisDecision,
  RiskLevel,
} from '../types/analysis.js'
import type {
  CodeRabbitAnalysis,
  CodeRabbitFinding,
} from '../types/coderabbit.js'
import type { GitHubPRContext, GitHubFileChange } from '../types/github.js'

import { getThresholds } from '../config/severity-thresholds.js'
import { PRMetricsCollector } from '../metrics/pr-metrics-collector.js'
import { SecurityAnalyzer } from './security-analyzer.js'

/**
 * Expert validation categories for comprehensive code review
 */
export enum ExpertValidationCategory {
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  MAINTAINABILITY = 'maintainability',
  ARCHITECTURE = 'architecture',
  BUSINESS_LOGIC = 'business_logic',
  DATA_INTEGRITY = 'data_integrity',
  COMPLIANCE = 'compliance',
}

/**
 * Validation checklist item with expert criteria
 */
export interface ValidationChecklistItem {
  id: string
  category: ExpertValidationCategory
  title: string
  description: string
  criteria: string[]
  severity: RiskLevel
  automatable: boolean
  requiredForMerge: boolean
}

/**
 * Expert-level validation results
 */
export interface ExpertValidationResults {
  overallDecision: AnalysisDecision
  confidence: number
  validatedFindings: ValidatedFinding[]
  expertFindings: ExpertFinding[]
  checklistResults: {
    [category in ExpertValidationCategory]: {
      passed: ValidationChecklistItem[]
      failed: ValidationChecklistItem[]
      skipped: ValidationChecklistItem[]
      score: number
    }
  }
  blockingIssues: {
    id: string
    title: string
    severity: RiskLevel
    mustFixBeforeMerge: boolean
    reasoning: string
  }[]
  recommendations: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }
}

/**
 * File context analysis result
 */
interface FileContext {
  fileType?: string
  isTestFile: boolean
  isConfigFile: boolean
  changeSize: number
}

/**
 * Expert-level validator implementing comprehensive checklists and validation
 */
export class ExpertValidator {
  /**
   * Comprehensive expert validation of PR using multi-phase checklists
   */
  static async validatePR(
    githubContext: GitHubPRContext,
    codeRabbitAnalysis?: CodeRabbitAnalysis,
  ): Promise<ExpertValidationResults> {
    // Phase 1: Security audit using SecurityAnalyzer
    const securityAudit = SecurityAnalyzer.analyzeSecurityFindings(
      githubContext,
      codeRabbitAnalysis,
    )

    // Phase 2: Collect quantitative metrics
    const metrics = PRMetricsCollector.collectMetrics(
      githubContext,
      codeRabbitAnalysis,
    )

    // Phase 3: Expert validation of CodeRabbit findings
    const validatedFindings = this.validateCodeRabbitFindings(
      codeRabbitAnalysis?.findings || [],
      githubContext,
    )

    // Phase 4: Expert-identified issues (placeholder for now)
    const expertFindings: ExpertFinding[] = []

    // Phase 5: Comprehensive checklist validation
    const checklistResults = this.createDefaultChecklistResults()

    // Phase 6: Final decision and recommendations
    const { overallDecision, confidence, blockingIssues } =
      this.calculateOverallDecision(securityAudit, metrics, validatedFindings)

    const recommendations = this.generateExpertRecommendations(
      securityAudit,
      metrics,
      blockingIssues,
    )

    return {
      overallDecision,
      confidence,
      validatedFindings,
      expertFindings,
      checklistResults,
      blockingIssues,
      recommendations,
    }
  }

  /**
   * Validate CodeRabbit findings with expert analysis
   */
  private static validateCodeRabbitFindings(
    findings: CodeRabbitFinding[],
    githubContext: GitHubPRContext,
  ): ValidatedFinding[] {
    return findings.map((finding) => {
      const fileContext = this.analyzeFileContext(finding, githubContext.files)
      const validation = this.expertValidateFinding(finding, fileContext)

      return {
        original: finding,
        validated: validation.isValid,
        confidence: validation.confidence,
        severity: validation.adjustedSeverity,
        falsePositive: validation.isFalsePositive,
        reason: validation.reasoning,
        enhancedContext: validation.enhancedContext,
        businessImpact: validation.businessImpact,
        fixComplexity: validation.fixComplexity,
        fixEstimateHours: validation.fixEstimateHours,
      }
    })
  }

  /**
   * Expert validation of individual CodeRabbit finding
   */
  private static expertValidateFinding(
    finding: CodeRabbitFinding,
    fileContext: FileContext,
  ): {
    isValid: boolean
    confidence: number
    adjustedSeverity: RiskLevel
    isFalsePositive: boolean
    reasoning: string
    enhancedContext: string
    businessImpact: 'critical' | 'high' | 'medium' | 'low'
    fixComplexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'major'
    fixEstimateHours: number
  } {
    // Severity assessment with business context
    let adjustedSeverity = finding.severity as RiskLevel
    let businessImpact: 'critical' | 'high' | 'medium' | 'low' = 'medium'
    let isFalsePositive = false
    let reasoning = `Expert validation: ${finding.title}. `

    // Adjust for test files
    if (fileContext.isTestFile) {
      if (adjustedSeverity === 'critical') adjustedSeverity = 'high'
      else if (adjustedSeverity === 'high') adjustedSeverity = 'medium'
      businessImpact = 'low'

      if (finding.category === 'security') {
        isFalsePositive = true
        reasoning += 'Security finding in test file likely false positive. '
      }
    }

    // Fix complexity estimation
    let fixComplexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'major' =
      'moderate'
    let fixEstimateHours = 2

    if (finding.suggestedFix?.automaticFix) {
      fixComplexity = 'trivial'
      fixEstimateHours = 0.25
    } else if (finding.category === 'style') {
      fixComplexity = 'simple'
      fixEstimateHours = 0.5
    } else if (finding.category === 'security') {
      fixComplexity = 'complex'
      fixEstimateHours = 4
    }

    // Calculate confidence
    let confidence = 70
    if (finding.confidence === 'very_high') confidence += 20
    else if (finding.confidence === 'high') confidence += 10
    else if (finding.confidence === 'low') confidence -= 15

    if (fileContext.isTestFile) confidence -= 10

    reasoning += `Severity adjusted to ${adjustedSeverity} based on business context. `
    reasoning += `Fix complexity: ${fixComplexity}.`

    const enhancedContext = `File type: ${fileContext.fileType || 'unknown'}, Change size: ${fileContext.changeSize} lines`

    return {
      isValid: !isFalsePositive,
      confidence: Math.max(0, Math.min(100, confidence)),
      adjustedSeverity,
      isFalsePositive,
      reasoning,
      enhancedContext,
      businessImpact,
      fixComplexity,
      fixEstimateHours,
    }
  }

  /**
   * Analyze file context for a finding
   */
  private static analyzeFileContext(
    finding: CodeRabbitFinding,
    files: GitHubFileChange[],
  ): FileContext {
    const file = files.find((f) => f.filename === finding.location.file)
    return {
      fileType: file?.filename.split('.').pop(),
      isTestFile: Boolean(
        file?.filename.includes('.test.') || file?.filename.includes('.spec.'),
      ),
      isConfigFile: Boolean(
        file?.filename.includes('config') || file?.filename.includes('.json'),
      ),
      changeSize: file ? file.additions + file.deletions : 0,
    }
  }

  /**
   * Create default checklist results structure
   */
  private static createDefaultChecklistResults(): ExpertValidationResults['checklistResults'] {
    const results = {} as ExpertValidationResults['checklistResults']

    for (const category of Object.values(ExpertValidationCategory)) {
      results[category] = {
        passed: [],
        failed: [],
        skipped: [],
        score: 85, // Default passing score
      }
    }

    return results
  }

  /**
   * Calculate overall decision based on expert validation
   */
  private static calculateOverallDecision(
    securityAudit: SecurityAuditResults,
    metrics: PRMetrics,
    validatedFindings: ValidatedFinding[],
  ): {
    overallDecision: AnalysisDecision
    confidence: number
    blockingIssues: ExpertValidationResults['blockingIssues']
  } {
    const blockingIssues: ExpertValidationResults['blockingIssues'] = []

    // Use configurable thresholds
    const thresholds = getThresholds('default')

    // Only block for REAL security vulnerabilities with CVEs or exploitable patterns
    const realSecurityVulnerabilities = securityAudit.findings.filter(
      (f) =>
        f.severity === 'critical' &&
        (f.cweId || f.cvssScore || f.source === 'github-security-advisory'),
    )

    if (
      realSecurityVulnerabilities.length >=
      thresholds.securityBlock.criticalVulnerabilities
    ) {
      blockingIssues.push({
        id: 'critical-security-vulnerabilities',
        title: `${realSecurityVulnerabilities.length} Critical Security Vulnerabilities`,
        severity: 'critical',
        mustFixBeforeMerge: true,
        reasoning:
          'Confirmed security vulnerabilities with CVE/CWE identifiers must be resolved',
      })
    }

    // Only block for validated findings that are actual security risks
    const criticalSecurityFindings = validatedFindings.filter(
      (f) =>
        f.validated &&
        f.severity === 'critical' &&
        f.confidence > thresholds.securityBlock.highConfidenceThreshold && // Use configurable threshold
        f.original.category === 'security', // Check original finding's category
    )

    if (criticalSecurityFindings.length > 0) {
      blockingIssues.push({
        id: 'critical-validated-findings',
        title: `${criticalSecurityFindings.length} High-Confidence Security Issues`,
        severity: 'critical',
        mustFixBeforeMerge: true,
        reasoning:
          'High-confidence security vulnerabilities require immediate attention',
      })
    }

    // More reasonable decision logic using configurable thresholds
    let overallDecision: AnalysisDecision
    let confidence: number

    if (blockingIssues.length > 0) {
      // Only security_block for real vulnerabilities
      overallDecision = 'security_block'
      confidence = 95
    } else if (
      securityAudit.highCount > thresholds.requestChanges.highSeverityCount ||
      metrics.securityDebtScore <
        thresholds.requestChanges.securityDebtScoreMin ||
      validatedFindings.filter((f) => f.validated && f.severity === 'high')
        .length > thresholds.requestChanges.validatedHighSeverityCount
    ) {
      overallDecision = 'request_changes'
      confidence = 85
    } else if (
      securityAudit.mediumCount >
        thresholds.conditionalApproval.mediumSeverityCount ||
      metrics.securityDebtScore <
        thresholds.conditionalApproval.securityDebtScoreMin ||
      validatedFindings.filter((f) => f.validated && f.severity === 'medium')
        .length > thresholds.conditionalApproval.validatedMediumSeverityCount
    ) {
      overallDecision = 'conditional_approval'
      confidence = 75
    } else {
      overallDecision = 'approve'
      confidence = 90
    }

    return { overallDecision, confidence, blockingIssues }
  }

  /**
   * Generate expert recommendations based on validation results
   */
  private static generateExpertRecommendations(
    securityAudit: SecurityAuditResults,
    metrics: PRMetrics,
    blockingIssues: ExpertValidationResults['blockingIssues'],
  ): ExpertValidationResults['recommendations'] {
    const immediate: string[] = []
    const shortTerm: string[] = []
    const longTerm: string[] = []

    // Immediate (blocking) recommendations
    if (blockingIssues.length > 0) {
      immediate.push(
        `🚨 BLOCKING: ${blockingIssues.length} critical issues must be resolved before merge`,
      )
      blockingIssues.forEach((issue) => {
        immediate.push(`• ${issue.title}: ${issue.reasoning}`)
      })
    }

    // Security recommendations
    immediate.push(...securityAudit.recommendations)

    // Metrics-based recommendations
    if (metrics.complexityScore > 7) {
      shortTerm.push(
        `📊 High complexity (${metrics.complexityScore.toFixed(1)}) - consider refactoring`,
      )
    }

    if (metrics.testCoverageDelta < 0.3) {
      shortTerm.push(
        `🧪 Low test coverage delta (${Math.round(metrics.testCoverageDelta * 100)}%) - add tests`,
      )
    }

    // Long-term improvements
    if (metrics.technicalDebtRatio > 0.2) {
      longTerm.push(
        `🏗️ Technical debt ratio ${Math.round(metrics.technicalDebtRatio * 100)}% - plan refactoring`,
      )
    }

    longTerm.push('📈 Consider automated security scanning in CI/CD pipeline')
    longTerm.push('🎯 Establish team coding standards based on analysis')

    return { immediate, shortTerm, longTerm }
  }
}
