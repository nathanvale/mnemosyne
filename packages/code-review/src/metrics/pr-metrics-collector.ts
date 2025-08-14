import type { PRMetrics } from '../types/analysis.js'
import type { CodeRabbitAnalysis } from '../types/coderabbit.js'
import type { GitHubPRContext, GitHubFileChange } from '../types/github.js'

import { GitHubParser } from '../parsers/github-parser.js'

/**
 * Union type for CodeRabbit data - can be either the full analysis or parsed data from fetcher
 */
type CodeRabbitInput =
  | CodeRabbitAnalysis
  | {
      findings?: Array<{
        severity?: string
        category?: string
        confidence?: string
      }>
      processingMetrics?: { analysisTimeMs?: number }
      coverage?: { coveragePercentage?: number }
    }

/**
 * Collects quantitative metrics for PR analysis
 */
export class PRMetricsCollector {
  /**
   * Collect comprehensive PR metrics
   */
  static collectMetrics(
    githubContext: GitHubPRContext,
    codeRabbitAnalysis?: CodeRabbitInput,
  ): PRMetrics {
    const { pullRequest, files, commits } = githubContext

    // Code metrics
    const linesReviewed = this.calculateLinesReviewed(files)
    const linesChanged = pullRequest.additions + pullRequest.deletions
    const filesChanged = pullRequest.changed_files
    const functionsChanged = this.estimateFunctionsChanged(files)
    const complexityScore = GitHubParser.calculateComplexityScore(
      files,
      commits,
    )

    // Security metrics
    const securityMetrics = this.calculateSecurityMetrics(
      codeRabbitAnalysis,
      githubContext,
    )

    // Quality metrics
    const qualityMetrics = this.calculateQualityMetrics(files)

    // Performance metrics
    const performanceImpact = this.assessPerformanceImpact(files)
    const bundleSizeImpact = this.estimateBundleSizeImpact(files)

    // Analysis metrics
    const analysisMetrics = this.calculateAnalysisMetrics(codeRabbitAnalysis)

    // Historical context
    const historicalMetrics = this.calculateHistoricalMetrics(pullRequest)

    return {
      // Code metrics
      linesReviewed,
      linesChanged,
      filesChanged,
      functionsChanged,
      complexityScore,

      // Security metrics
      securityIssuesFound: securityMetrics.issuesFound,
      criticalVulnerabilities: securityMetrics.criticalCount,
      securityDebtScore: securityMetrics.debtScore,

      // Quality metrics
      testCoverageDelta: qualityMetrics.testCoverageDelta,
      technicalDebtRatio: qualityMetrics.technicalDebtRatio,
      documentationCoverage: qualityMetrics.documentationCoverage,

      // Performance metrics
      performanceImpact,
      bundleSizeImpact,

      // Analysis metrics
      analysisTimeMs: analysisMetrics.timeMs,
      confidenceScore: analysisMetrics.confidenceScore,
      coveragePercentage: analysisMetrics.coveragePercentage,

      // Historical context
      authorPatternScore: historicalMetrics.authorPatternScore,
      teamVelocityImpact: historicalMetrics.velocityImpact,
    }
  }

  /**
   * Calculate lines reviewed (including context)
   */
  private static calculateLinesReviewed(files: GitHubFileChange[]): number {
    // Estimate lines reviewed as 1.5x lines changed (includes context)
    return Math.round(
      files.reduce((sum, file) => sum + file.additions + file.deletions, 0) *
        1.5,
    )
  }

  /**
   * Estimate functions changed based on file types and changes
   */
  private static estimateFunctionsChanged(files: GitHubFileChange[]): number {
    return files.reduce((sum, file) => {
      const isCodeFile = /\.(ts|tsx|js|jsx|py|java|go|rs|c|cpp)$/i.test(
        file.filename,
      )
      if (!isCodeFile) return sum

      // Rough estimate: 1 function per 20 lines changed
      return sum + Math.ceil((file.additions + file.deletions) / 20)
    }, 0)
  }

  /**
   * Calculate security-related metrics
   */
  private static calculateSecurityMetrics(
    codeRabbitAnalysis?: CodeRabbitInput,
    githubContext?: GitHubPRContext,
  ): {
    issuesFound: number
    criticalCount: number
    debtScore: number
  } {
    let issuesFound = 0
    let criticalCount = 0
    let debtScore = 100 // Start with perfect score

    if (codeRabbitAnalysis && codeRabbitAnalysis.findings) {
      const findings = codeRabbitAnalysis.findings

      // Count security-related findings
      const securityFindings = findings.filter(
        (f: { category?: string; severity?: string }) =>
          f.category === 'security' ||
          (f.severity === 'critical' && !f.category),
      )
      issuesFound = securityFindings.length

      // Count critical findings
      criticalCount = findings.filter(
        (f: { severity?: string }) => f.severity === 'critical',
      ).length

      // Calculate debt score based on security issues
      debtScore = Math.max(0, 100 - issuesFound * 5 - criticalCount * 15)
    }

    // Factor in GitHub security alerts
    if (githubContext) {
      const criticalAlerts = GitHubParser.getCriticalSecurityAlerts(
        githubContext.securityAlerts,
      )
      criticalCount += criticalAlerts.length
      debtScore = Math.max(0, debtScore - criticalAlerts.length * 20)
    }

    return {
      issuesFound,
      criticalCount,
      debtScore,
    }
  }

  /**
   * Calculate quality metrics
   */
  private static calculateQualityMetrics(files: GitHubFileChange[]): {
    testCoverageDelta: number
    technicalDebtRatio: number
    documentationCoverage: number
  } {
    const testCoverageDelta = GitHubParser.estimateTestCoverageImpact(files)

    // Estimate technical debt ratio based on file complexity
    const codeFiles = files.filter((f) =>
      /\.(ts|tsx|js|jsx|py|java|go|rs)$/i.test(f.filename),
    )
    const largeFiles = codeFiles.filter((f) => f.additions > 100)
    const technicalDebtRatio =
      codeFiles.length > 0
        ? Math.round((largeFiles.length / codeFiles.length) * 100) / 100
        : 0

    // Calculate documentation coverage
    const docFiles = files.filter(
      (f) =>
        f.filename.endsWith('.md') ||
        f.filename.includes('README') ||
        f.filename.includes('doc'),
    )
    const totalFiles = files.length
    const documentationCoverage =
      totalFiles > 0 ? Math.round((docFiles.length / totalFiles) * 100) : 0

    return {
      testCoverageDelta,
      technicalDebtRatio,
      documentationCoverage,
    }
  }

  /**
   * Assess performance impact
   */
  private static assessPerformanceImpact(
    files: GitHubFileChange[],
  ): 'none' | 'low' | 'medium' | 'high' {
    const performanceFiles = files.filter(
      (f) =>
        f.filename.includes('performance') ||
        f.filename.includes('benchmark') ||
        f.filename.includes('database') ||
        f.filename.includes('query') ||
        f.filename.includes('cache'),
    )

    const totalChanges = files.reduce(
      (sum, file) => sum + file.additions + file.deletions,
      0,
    )
    const performanceChanges = performanceFiles.reduce(
      (sum, file) => sum + file.additions + file.deletions,
      0,
    )

    const ratio = totalChanges > 0 ? performanceChanges / totalChanges : 0

    if (ratio > 0.3) return 'high'
    if (ratio > 0.1) return 'medium'
    if (ratio > 0) return 'low'
    return 'none'
  }

  /**
   * Estimate bundle size impact in KB
   */
  private static estimateBundleSizeImpact(files: GitHubFileChange[]): number {
    const frontendFiles = files.filter(
      (f) =>
        /\.(ts|tsx|js|jsx|css|scss|sass)$/i.test(f.filename) &&
        !f.filename.includes('.test.') &&
        !f.filename.includes('.spec.'),
    )

    // Rough estimate: 1KB per 40 lines of frontend code
    return Math.round(
      frontendFiles.reduce(
        (sum, file) => sum + (file.additions - file.deletions),
        0,
      ) / 40,
    )
  }

  /**
   * Calculate analysis metrics
   */
  private static calculateAnalysisMetrics(
    codeRabbitAnalysis?: CodeRabbitInput,
  ): {
    timeMs: number
    confidenceScore: number
    coveragePercentage: number
  } {
    if (!codeRabbitAnalysis) {
      return {
        timeMs: 0,
        confidenceScore: 0,
        coveragePercentage: 0,
      }
    }

    // Calculate confidence stats from available data
    let averageConfidence = 0
    if (codeRabbitAnalysis.findings && codeRabbitAnalysis.findings.length > 0) {
      // Map confidence strings to numbers (1-5 scale)
      const confidenceMap: Record<string, number> = {
        very_low: 1,
        low: 2,
        medium: 3,
        high: 4,
        very_high: 5,
      }

      const confidenceValues = codeRabbitAnalysis.findings
        .map((f: { confidence?: string }) =>
          f.confidence ? confidenceMap[f.confidence] || 3 : 3,
        )
        .filter((v: number) => v > 0)

      averageConfidence =
        confidenceValues.length > 0
          ? confidenceValues.reduce(
              (sum: number, val: number) => sum + val,
              0,
            ) / confidenceValues.length
          : 3.5 // Default medium confidence
    }

    return {
      timeMs: codeRabbitAnalysis.processingMetrics?.analysisTimeMs ?? 0,
      confidenceScore: Math.round(averageConfidence * 20), // Convert 1-5 scale to 0-100
      coveragePercentage: codeRabbitAnalysis.coverage?.coveragePercentage ?? 0,
    }
  }

  /**
   * Calculate historical metrics (simplified for now)
   */
  private static calculateHistoricalMetrics(pullRequest: {
    additions: number
    deletions: number
  }): {
    authorPatternScore: number
    velocityImpact: 'positive' | 'neutral' | 'negative'
  } {
    // Placeholder implementation - would integrate with historical data
    const authorPatternScore = 75 // Default reasonable score

    // Simple heuristic based on PR size
    const totalChanges = pullRequest.additions + pullRequest.deletions
    let velocityImpact: 'positive' | 'neutral' | 'negative' = 'neutral'

    if (totalChanges < 100) velocityImpact = 'positive'
    else if (totalChanges > 500) velocityImpact = 'negative'

    return {
      authorPatternScore,
      velocityImpact,
    }
  }

  /**
   * Calculate trend metrics for historical comparison
   */
  static calculateTrendMetrics(
    currentMetrics: PRMetrics,
    historicalMetrics: PRMetrics[],
  ): {
    securityTrend: 'improving' | 'stable' | 'declining'
    qualityTrend: 'improving' | 'stable' | 'declining'
    complexityTrend: 'improving' | 'stable' | 'declining'
    averageSecurityIssues: number
    averageComplexity: number
  } {
    if (historicalMetrics.length === 0) {
      return {
        securityTrend: 'stable',
        qualityTrend: 'stable',
        complexityTrend: 'stable',
        averageSecurityIssues: currentMetrics.securityIssuesFound,
        averageComplexity: currentMetrics.complexityScore,
      }
    }

    const avgSecurityIssues =
      historicalMetrics.reduce((sum, m) => sum + m.securityIssuesFound, 0) /
      historicalMetrics.length

    const avgComplexity =
      historicalMetrics.reduce((sum, m) => sum + m.complexityScore, 0) /
      historicalMetrics.length

    const avgTestCoverage =
      historicalMetrics.reduce((sum, m) => sum + m.testCoverageDelta, 0) /
      historicalMetrics.length

    // Determine trends
    const securityTrend =
      currentMetrics.securityIssuesFound < avgSecurityIssues * 0.9
        ? 'improving'
        : currentMetrics.securityIssuesFound > avgSecurityIssues * 1.1
          ? 'declining'
          : 'stable'

    const qualityTrend =
      currentMetrics.testCoverageDelta > avgTestCoverage * 1.1
        ? 'improving'
        : currentMetrics.testCoverageDelta < avgTestCoverage * 0.9
          ? 'declining'
          : 'stable'

    const complexityTrend =
      currentMetrics.complexityScore < avgComplexity * 0.9
        ? 'improving'
        : currentMetrics.complexityScore > avgComplexity * 1.1
          ? 'declining'
          : 'stable'

    return {
      securityTrend,
      qualityTrend,
      complexityTrend,
      averageSecurityIssues: Math.round(avgSecurityIssues * 10) / 10,
      averageComplexity: Math.round(avgComplexity * 10) / 10,
    }
  }
}
