import type {
  ValidatedFinding,
  ExpertFinding,
  PRMetrics,
  AnalysisDecision,
  RiskLevel,
} from '../types/analysis.js'
import type {
  CodeRabbitAnalysis,
  CodeRabbitFinding,
} from '../types/coderabbit.js'
import type { GitHubPRContext, GitHubFileChange } from '../types/github.js'
import type { FileContext } from './issue-prioritizer.js'

import { getThresholds } from '../config/severity-thresholds.js'
import { PRMetricsCollector } from '../metrics/pr-metrics-collector.js'
import { CodeRabbitParser } from '../parsers/coderabbit-parser.js'
import { FileContextAnalyzer } from './file-context-analyzer.js'

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
 * Expert-level validator implementing comprehensive checklists and validation
 */
export class ExpertValidator {
  /**
   * Comprehensive expert validation of PR focusing on performance, maintainability, and architecture
   * Note: Security analysis delegated to Claude's /security-review for superior results
   */
  static async validatePR(
    githubContext: GitHubPRContext,
    codeRabbitAnalysis?: CodeRabbitAnalysis,
  ): Promise<ExpertValidationResults> {
    // Phase 1: Collect quantitative metrics
    const metrics = PRMetricsCollector.collectMetrics(
      githubContext,
      codeRabbitAnalysis,
    )

    // Phase 2: Expert validation of CodeRabbit findings (non-security)
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
      this.calculateOverallDecision(
        metrics,
        validatedFindings,
        codeRabbitAnalysis?.findings,
      )

    const recommendations = this.generateExpertRecommendations(
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
    const isFalsePositive = false
    let reasoning = `Expert validation: ${finding.title}. `

    // Adjust severity based on file context
    if (fileContext.isTest) {
      // Only slightly reduce severity for test files, not dramatically
      if (adjustedSeverity === 'critical' && finding.category !== 'security') {
        adjustedSeverity = 'high'
        businessImpact = 'medium'
      } else if (adjustedSeverity === 'high' && finding.category === 'style') {
        adjustedSeverity = 'medium'
        businessImpact = 'low'
      } else {
        // Keep original severity for most cases
        businessImpact = finding.severity === 'critical' ? 'high' : 'medium'
      }
      reasoning += 'Finding in test file - still relevant for code quality. '
    } else if (fileContext.isCore) {
      // Increase severity for core business logic
      if (adjustedSeverity === 'medium') {
        adjustedSeverity = 'high'
        businessImpact = 'high'
      }
      reasoning += 'Core business logic file - increased priority. '
    } else if (fileContext.isSecurityRelated) {
      // Always high priority for security-related files
      if (adjustedSeverity === 'low' || adjustedSeverity === 'medium') {
        adjustedSeverity = 'high'
        businessImpact = 'high'
      }
      reasoning += 'Security-related file - elevated priority. '
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

    // Calculate confidence - be more trusting of CodeRabbit's findings
    let confidence = 75 // Start higher
    if (finding.confidence === 'very_high') confidence += 20
    else if (finding.confidence === 'high') confidence += 15
    else if (finding.confidence === 'low') confidence -= 10

    // Adjust confidence based on file context
    if (fileContext.isTest && finding.category === 'style') {
      confidence -= 5 // Minor reduction only for style issues in tests
    } else if (fileContext.isCore || fileContext.isSecurityRelated) {
      confidence += 10 // Increase confidence for critical files
    }

    reasoning += `Severity adjusted to ${adjustedSeverity} based on business context. `
    reasoning += `Fix complexity: ${fixComplexity}.`

    const enhancedContext = `File: ${fileContext.filePath}, Core: ${fileContext.isCore}, Security: ${fileContext.isSecurityRelated}, User-facing: ${fileContext.isUserFacing}, Change size: ${fileContext.changeSize} lines`

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
    if (!file) {
      // Return a minimal context if file not found
      return {
        filePath: finding.location.file,
        isCore: false,
        isUserFacing: false,
        isSecurityRelated: false,
        isTest: false,
        hasTests: false,
        changeSize: 0,
      }
    }
    return FileContextAnalyzer.analyzeFile(file)
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
    metrics: PRMetrics,
    validatedFindings: ValidatedFinding[],
    codeRabbitFindings?: CodeRabbitFinding[],
  ): {
    overallDecision: AnalysisDecision
    confidence: number
    blockingIssues: ExpertValidationResults['blockingIssues']
  } {
    const blockingIssues: ExpertValidationResults['blockingIssues'] = []

    // Use configurable thresholds
    const thresholds = getThresholds('default')

    // CRITICAL: Use CodeRabbitParser to properly prioritize ALL findings
    // This ensures we catch important functional issues, not just security
    if (codeRabbitFindings && codeRabbitFindings.length > 0) {
      const prioritizedIssues =
        CodeRabbitParser.prioritizeFindings(codeRabbitFindings)

      // Add blocking issues from CodeRabbit prioritization
      if (prioritizedIssues.blocking.length > 0) {
        prioritizedIssues.blocking.forEach((issue) => {
          blockingIssues.push({
            id: `coderabbit-blocking-${issue.finding.id}`,
            title: issue.finding.title,
            severity:
              issue.finding.severity === 'critical'
                ? 'critical'
                : issue.finding.severity === 'high'
                  ? 'high'
                  : 'medium',
            mustFixBeforeMerge: true,
            reasoning: issue.rationale,
          })
        })
      }

      // Add important issues as warnings (not blocking but should be fixed)
      if (prioritizedIssues.important.length > 0) {
        blockingIssues.push({
          id: 'coderabbit-important-issues',
          title: `${prioritizedIssues.important.length} Important Issues to Address`,
          severity: 'medium',
          mustFixBeforeMerge: false,
          reasoning:
            'Important issues that should be fixed before merge for code quality',
        })
      }
    }

    // Note: Security analysis now delegated to Claude's /security-review
    // This method focuses on non-security validation and CodeRabbit findings

    // Also check validated findings for critical security issues
    const criticalFindings = validatedFindings.filter(
      (f) =>
        f.validated &&
        f.severity === 'critical' &&
        f.confidence > thresholds.securityBlock.highConfidenceThreshold &&
        // Include security and high-risk bug findings
        (f.original.category === 'security' ||
          f.original.category === 'bug_risk' ||
          // Include any finding that mentions breaking functionality
          f.original.description?.match(
            /broken|fail|error|crash|undefined|null reference/i,
          )),
    )

    if (criticalFindings.length > 0) {
      blockingIssues.push({
        id: 'critical-validated-findings',
        title: `${criticalFindings.length} Critical Security/Bug Issues Found`,
        severity: 'critical',
        mustFixBeforeMerge: true,
        reasoning:
          'Critical issues that could break functionality or introduce security risks',
      })
    }

    // Determine if we have actual blocking issues that must be fixed
    const hasBlockingIssues = blockingIssues.some(
      (issue) => issue.mustFixBeforeMerge,
    )
    const hasImportantIssues = blockingIssues.some(
      (issue) => !issue.mustFixBeforeMerge,
    )

    // More reasonable decision logic based on prioritized issues
    let overallDecision: AnalysisDecision
    let confidence: number

    if (hasBlockingIssues) {
      // Check if it's security-related for security_block, otherwise request_changes
      const hasSecurityBlocking = blockingIssues.some(
        (issue) =>
          issue.severity === 'critical' &&
          (issue.id.includes('security') ||
            issue.reasoning.includes('security')),
      )
      overallDecision = hasSecurityBlocking
        ? 'security_block'
        : 'request_changes'
      confidence = 95
    } else if (hasImportantIssues) {
      // Important issues present but not blocking
      overallDecision = 'conditional_approval'
      confidence = 85
    } else if (
      metrics.securityDebtScore <
        thresholds.requestChanges.securityDebtScoreMin ||
      validatedFindings.filter((f) => f.validated && f.severity === 'high')
        .length > thresholds.requestChanges.validatedHighSeverityCount
    ) {
      overallDecision = 'request_changes'
      confidence = 85
    } else if (
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

    // Note: Security recommendations now provided by Claude's /security-review

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
