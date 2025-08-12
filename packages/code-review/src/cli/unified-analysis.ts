#!/usr/bin/env tsx

/**
 * Unified Analysis Orchestrator
 * Coordinates GitHub data fetching, CodeRabbit integration, and expert analysis
 * Provides a single command to perform comprehensive PR analysis
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'

/**
 * Analysis orchestrator configuration
 */
interface UnifiedAnalysisConfig {
  prNumber: number
  repo: string
  includeCodeRabbit: boolean
  confidenceThreshold: number
  maxFindings: number
  outputFormat: 'github' | 'markdown' | 'json'
  cleanupTempFiles: boolean
  verbose: boolean
}

/**
 * Analysis metadata from expert analysis result
 */
interface AnalysisMetadata {
  analysis_id?: string
  confidence_score?: number
  risk_level?: string
  decision?: string
  findings_summary?: {
    critical?: number
    high?: number
    medium?: number
    low?: number
    expert?: number
    false_positives?: number
  }
  metrics?: {
    code_quality_score?: number
    security_score?: number
    test_coverage_delta?: number
  }
}

/**
 * Analysis result summary
 */
export interface AnalysisSummary {
  analysisId: string
  prNumber: number
  repo: string
  timestamp: string
  githubDataFile: string
  codeRabbitDataFile?: string
  analysisResultFile: string
  confidenceScore: number
  riskLevel: string
  decision: string
  findings: {
    critical: number
    high: number
    medium: number
    low: number
    expert: number
    falsePositives: number
  }
  metrics?: {
    codeQualityScore: number
    securityScore: number
    testCoverageDelta: number
  }
}

/**
 * Unified analysis orchestrator
 * Manages the complete PR analysis workflow
 */
export class UnifiedAnalysisOrchestrator {
  private config: UnifiedAnalysisConfig
  private tempFiles: string[] = []

  constructor(config: Partial<UnifiedAnalysisConfig> = {}) {
    this.config = {
      prNumber: config.prNumber || 0,
      repo: config.repo || '',
      includeCodeRabbit: config.includeCodeRabbit ?? true,
      confidenceThreshold: config.confidenceThreshold ?? 70,
      maxFindings: config.maxFindings ?? 20,
      outputFormat: config.outputFormat ?? 'github',
      cleanupTempFiles: config.cleanupTempFiles ?? true,
      verbose: config.verbose ?? false,
    }
  }

  /**
   * Run complete unified analysis workflow
   */
  async runAnalysis(): Promise<AnalysisSummary> {
    this.log('🚀 Starting unified PR analysis workflow...')
    this.log(`📋 Analyzing PR #${this.config.prNumber} in ${this.config.repo}`)

    try {
      const analysisId = this.generateAnalysisId()

      // Phase 1: Fetch GitHub data
      this.log('🔍 Phase 1: Fetching GitHub PR context...')
      const githubDataFile = await this.fetchGitHubData()

      // Phase 2: Fetch CodeRabbit data (optional)
      let codeRabbitDataFile: string | undefined
      if (this.config.includeCodeRabbit) {
        this.log('🤖 Phase 2: Fetching CodeRabbit analysis...')
        codeRabbitDataFile = await this.fetchCodeRabbitData()
      } else {
        this.log('⏭️  Phase 2: Skipping CodeRabbit (disabled)')
      }

      // Phase 3: Run expert analysis
      this.log('🎯 Phase 3: Running expert analysis...')
      const analysisResultFile = await this.runExpertAnalysis(
        githubDataFile,
        codeRabbitDataFile,
      )

      // Phase 4: Parse results and create summary
      this.log('📊 Phase 4: Generating analysis summary...')
      const summary = await this.generateSummary(
        analysisId,
        githubDataFile,
        codeRabbitDataFile,
        analysisResultFile,
      )

      // Phase 5: Cleanup (if enabled)
      if (this.config.cleanupTempFiles) {
        this.log('🧹 Phase 5: Cleaning up temporary files...')
        this.cleanupTemporaryFiles()
      }

      this.log('✅ Unified analysis completed successfully!')
      return summary
    } catch (error) {
      console.error('❌ Unified analysis failed:', error)

      // Cleanup on error
      if (this.config.cleanupTempFiles) {
        this.cleanupTemporaryFiles()
      }

      throw error
    }
  }

  /**
   * Fetch GitHub PR context data
   */
  private async fetchGitHubData(): Promise<string> {
    const outputFile = `pr-${this.config.prNumber}-github-context.json`
    this.tempFiles.push(outputFile)

    const command = [
      'pnpm --filter @studio/code-review review:fetch-github',
      this.config.prNumber.toString(),
      '--repo',
      this.config.repo,
      '--output',
      outputFile,
      this.config.verbose ? '--verbose' : '',
    ]
      .filter(Boolean)
      .join(' ')

    this.log(`🔄 Running: ${command}`)
    execSync(command, {
      encoding: 'utf-8',
      stdio: this.config.verbose ? 'inherit' : 'pipe',
    })

    if (!existsSync(outputFile)) {
      throw new Error(`GitHub data file not created: ${outputFile}`)
    }

    this.log(`✅ GitHub data saved to: ${outputFile}`)
    return outputFile
  }

  /**
   * Fetch CodeRabbit analysis data
   */
  private async fetchCodeRabbitData(): Promise<string> {
    const outputFile = `pr-${this.config.prNumber}-coderabbit.json`
    this.tempFiles.push(outputFile)

    try {
      const command = [
        'pnpm --filter @studio/code-review review:fetch-coderabbit',
        '--pr-number',
        this.config.prNumber.toString(),
        '--repo',
        this.config.repo,
        '--output',
        outputFile,
      ]
        .filter(Boolean)
        .join(' ')

      this.log(`🔄 Running: ${command}`)
      execSync(command, {
        encoding: 'utf-8',
        stdio: this.config.verbose ? 'inherit' : 'pipe',
      })

      if (!existsSync(outputFile)) {
        this.log(
          '⚠️ CodeRabbit data file not created - proceeding without CodeRabbit data',
        )
        return ''
      }

      this.log(`✅ CodeRabbit data saved to: ${outputFile}`)
      return outputFile
    } catch (error) {
      this.log(
        '⚠️ CodeRabbit fetch failed - proceeding without CodeRabbit data',
      )
      this.log(`Details: ${error}`)
      return ''
    }
  }

  /**
   * Run expert analysis with fetched data
   */
  private async runExpertAnalysis(
    githubDataFile: string,
    codeRabbitDataFile?: string,
  ): Promise<string> {
    const outputFile = `pr-${this.config.prNumber}-analysis-result.json`

    const command = [
      'pnpm --filter @studio/code-review review:expert',
      githubDataFile,
      codeRabbitDataFile ? `--coderabbit-file ${codeRabbitDataFile}` : '',
      '--confidence-threshold',
      this.config.confidenceThreshold.toString(),
      '--max-findings',
      this.config.maxFindings.toString(),
      '--output-format',
      this.config.outputFormat,
    ]
      .filter(Boolean)
      .join(' ')

    this.log(`🔄 Running: ${command}`)

    // Capture both stdout and stderr
    const result = execSync(command, { encoding: 'utf-8' })

    // Save the analysis result to a file for summary generation
    writeFileSync(outputFile, result)
    this.tempFiles.push(outputFile)

    this.log(`✅ Expert analysis completed, result saved to: ${outputFile}`)
    return outputFile
  }

  /**
   * Generate comprehensive analysis summary
   */
  private async generateSummary(
    analysisId: string,
    githubDataFile: string,
    codeRabbitDataFile: string | undefined,
    analysisResultFile: string,
  ): Promise<AnalysisSummary> {
    // Parse the analysis result to extract metadata
    const analysisContent = readFileSync(analysisResultFile, 'utf-8')

    // Try to extract metadata from the analysis result
    // The expert analysis returns structured response with metadata
    let metadata: AnalysisMetadata = {}
    try {
      // Look for metadata section in the output
      const metadataMatch = analysisContent.match(
        /--- Analysis Metadata ---\n(.*?)$/s,
      )
      if (metadataMatch) {
        metadata = JSON.parse(metadataMatch[1])
      }
    } catch {
      // Fallback if metadata parsing fails
      this.log('⚠️ Could not parse analysis metadata - using defaults')
      metadata = {
        analysis_id: analysisId,
        confidence_score: 0,
        risk_level: 'unknown',
        decision: 'manual_review',
        findings_summary: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          expert: 0,
          false_positives: 0,
        },
      }
    }

    return {
      analysisId,
      prNumber: this.config.prNumber,
      repo: this.config.repo,
      timestamp: new Date().toISOString(),
      githubDataFile,
      codeRabbitDataFile,
      analysisResultFile,
      confidenceScore: metadata.confidence_score || 0,
      riskLevel: metadata.risk_level || 'unknown',
      decision: metadata.decision || 'manual_review',
      findings: {
        critical: metadata.findings_summary?.critical || 0,
        high: metadata.findings_summary?.high || 0,
        medium: metadata.findings_summary?.medium || 0,
        low: metadata.findings_summary?.low || 0,
        expert: metadata.findings_summary?.expert || 0,
        falsePositives: metadata.findings_summary?.false_positives || 0,
      },
      ...(metadata.metrics && {
        metrics: {
          codeQualityScore: metadata.metrics.code_quality_score || 0,
          securityScore: metadata.metrics.security_score || 0,
          testCoverageDelta: metadata.metrics.test_coverage_delta || 0,
        },
      }),
    }
  }

  /**
   * Generate unique analysis ID
   */
  private generateAnalysisId(): string {
    return `unified-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Clean up temporary files
   */
  private cleanupTemporaryFiles(): void {
    this.tempFiles.forEach((file) => {
      try {
        if (existsSync(file)) {
          unlinkSync(file)
          this.log(`🗑️ Cleaned up: ${file}`)
        }
      } catch (error) {
        this.log(`⚠️ Could not clean up ${file}: ${error}`)
      }
    })
    this.tempFiles = []
  }

  /**
   * Log message if verbose mode is enabled
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.error(message)
    }
  }

  /**
   * Display analysis summary
   */
  displaySummary(summary: AnalysisSummary): void {
    const totalFindings =
      summary.findings.critical +
      summary.findings.high +
      summary.findings.medium +
      summary.findings.low

    console.error(`
🔍 PR Analysis Summary
${'='.repeat(50)}

📋 PR Details:
   Repository: ${summary.repo}
   PR Number: #${summary.prNumber}
   Analysis ID: ${summary.analysisId}
   Timestamp: ${new Date(summary.timestamp).toLocaleString()}

🎯 Analysis Results:
   Decision: ${this.formatDecision(summary.decision)}
   Risk Level: ${this.formatRiskLevel(summary.riskLevel)}
   Confidence: ${summary.confidenceScore}%

📊 Findings Summary:
   🚨 Critical: ${summary.findings.critical}
   ⚠️  High: ${summary.findings.high}
   📋 Medium: ${summary.findings.medium}
   💡 Low: ${summary.findings.low}
   👨‍💻 Expert: ${summary.findings.expert}
   ✅ False Positives: ${summary.findings.falsePositives}
   📈 Total Issues: ${totalFindings}

${
  summary.metrics
    ? `📈 Quality Metrics:
   Code Quality: ${summary.metrics.codeQualityScore}/100
   Security Score: ${summary.metrics.securityScore}/100
   Test Coverage Δ: ${summary.metrics.testCoverageDelta > 0 ? '+' : ''}${summary.metrics.testCoverageDelta}%
`
    : ''
}📁 Analysis Files:
   GitHub Data: ${summary.githubDataFile}
   ${summary.codeRabbitDataFile ? `CodeRabbit Data: ${summary.codeRabbitDataFile}` : 'CodeRabbit: Not used'}
   Analysis Result: ${summary.analysisResultFile}

${'='.repeat(50)}
`)
  }

  /**
   * Format decision for display
   */
  private formatDecision(decision: string): string {
    const decisionMap: Record<string, string> = {
      approve: '✅ APPROVE',
      conditional_approval: '⚠️ CONDITIONAL APPROVAL',
      request_changes: '❌ REQUEST CHANGES',
      security_block: '🚨 SECURITY BLOCK',
      manual_review: '🔍 MANUAL REVIEW NEEDED',
    }
    return decisionMap[decision] || `❓ ${decision.toUpperCase()}`
  }

  /**
   * Format risk level for display
   */
  private formatRiskLevel(level: string): string {
    const levelMap: Record<string, string> = {
      critical: '🚨 CRITICAL',
      high: '⚠️ HIGH',
      medium: '📋 MEDIUM',
      low: '💡 LOW',
      unknown: '❓ UNKNOWN',
    }
    return levelMap[level] || `❓ ${level.toUpperCase()}`
  }
}

/**
 * CLI interface for unified analysis
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    console.error(`
Unified PR Analysis - Complete workflow with GitHub data, CodeRabbit, and expert analysis

Usage:
  pnpm --filter @studio/code-review review:unified <pr-number> --repo <owner/repo> [options]

Arguments:
  pr-number                    Pull request number to analyze

Required Options:
  --repo <owner/repo>          Repository (e.g., "owner/repo")

Options:
  --no-coderabbit             Skip CodeRabbit integration
  --confidence-threshold <n>   Minimum confidence for findings (default: 70)
  --max-findings <n>           Maximum findings to display (default: 20)
  --output-format <format>     Output format: github|markdown|json (default: github)
  --keep-temp-files           Keep temporary files after analysis
  --verbose, -v               Enable verbose logging
  --help, -h                  Show this help message

Examples:
  pnpm --filter @studio/code-review review:unified 123 --repo owner/repo
  pnpm --filter @studio/code-review review:unified 456 --repo owner/repo --no-coderabbit --verbose
  pnpm --filter @studio/code-review review:unified 789 --repo owner/repo --confidence-threshold 80 --keep-temp-files
`)
    process.exit(0)
  }

  if (args.length < 1) {
    console.error('Error: PR number is required')
    console.error('Run with --help for usage information')
    process.exit(1)
  }

  try {
    const prNumber = parseInt(args[0])
    if (isNaN(prNumber)) {
      console.error('Error: PR number must be a valid integer')
      process.exit(1)
    }

    // Parse arguments
    const repoIndex = args.indexOf('--repo')
    const repo = repoIndex !== -1 ? args[repoIndex + 1] : undefined

    if (!repo) {
      console.error('Error: --repo is required')
      process.exit(1)
    }

    const confidenceThresholdIndex = args.indexOf('--confidence-threshold')
    const confidenceThreshold =
      confidenceThresholdIndex !== -1
        ? parseInt(args[confidenceThresholdIndex + 1])
        : 70

    const maxFindingsIndex = args.indexOf('--max-findings')
    const maxFindings =
      maxFindingsIndex !== -1 ? parseInt(args[maxFindingsIndex + 1]) : 20

    const outputFormatIndex = args.indexOf('--output-format')
    const outputFormat = (
      outputFormatIndex !== -1 ? args[outputFormatIndex + 1] : 'github'
    ) as 'github' | 'markdown' | 'json'

    const config = {
      prNumber,
      repo,
      includeCodeRabbit: !args.includes('--no-coderabbit'),
      confidenceThreshold,
      maxFindings,
      outputFormat,
      cleanupTempFiles: !args.includes('--keep-temp-files'),
      verbose: args.includes('--verbose') || args.includes('-v'),
    }

    // Run unified analysis
    const orchestrator = new UnifiedAnalysisOrchestrator(config)
    const summary = await orchestrator.runAnalysis()

    // Display summary
    orchestrator.displaySummary(summary)

    // Exit with appropriate code based on decision
    if (summary.decision === 'security_block') {
      process.exit(2) // Security block - special exit code
    } else if (
      summary.decision === 'request_changes' ||
      summary.findings.critical > 0
    ) {
      process.exit(1) // Changes requested or critical issues
    } else {
      process.exit(0) // Approved or conditional approval
    }
  } catch (error) {
    console.error('Fatal error in unified analysis:', error)
    process.exit(3)
  }
}

// Run CLI interface if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(3)
  })
}
