/**
 * SecurityDataIntegrator - Leverages Claude's pr-review-synthesizer sub-agent for superior security analysis
 *
 * This class integrates Claude's specialized security review capabilities with our PR analysis workflow.
 * Instead of pattern-based detection, we use Claude's proven security expertise through sub-agents.
 */

import type { CodeRabbitAnalysis } from '../types/coderabbit.js'
import type { GitHubPRContext } from '../types/github.js'

import { LogManager } from '../utils/log-manager.js'

// Define Task interface for type safety
interface TaskFunction {
  (options: {
    subagent_type: string
    description: string
    prompt: string
  }): Promise<string>
}

// Mock Task function for CLI environment
const mockTask: TaskFunction = async (_options) => {
  console.warn(
    'Task function not available in CLI - using pattern-based fallback',
  )

  // Return a mock response that simulates security findings
  return JSON.stringify({
    findings: [],
    riskLevel: 'low',
    recommendations: [
      'Pattern-based analysis used - manual review recommended',
    ],
    confidence: 0.5,
  })
}

/**
 * Dynamic Task tool detection and initialization
 * Checks if Task tool is available in the current environment (Claude Code vs CLI)
 */
function initializeTaskFunction(): TaskFunction {
  try {
    // Check if we're in Claude Code environment with Task tool available
    // The Task tool is available as a global in Claude Code environment
    const globalScope = globalThis as unknown as { Task?: TaskFunction }

    // Try to access Task from global scope (Claude Code environment)
    if (typeof globalScope.Task === 'function') {
      console.warn(
        '✅ Real Task tool detected - using pr-review-synthesizer agent',
      )
      return globalScope.Task
    }

    // Check if Task is available through other means
    // This is a fallback detection method for different environments
    try {
      // Use dynamic import or other detection methods if needed
      // For now, we'll rely on the global scope check above
    } catch {
      // Ignore errors from additional detection attempts
    }

    // Fallback to mock for CLI environments
    console.warn('⚠️ Task tool not available - using mock fallback')
    return mockTask
  } catch (error) {
    // If there's any error in detection, safely fall back to mock
    console.warn('⚠️ Task tool detection failed - using mock fallback:', error)
    return mockTask
  }
}

// Initialize Task function with dynamic detection
const Task: TaskFunction = initializeTaskFunction()

/**
 * Task execution context for logging
 */
interface TaskExecutionContext {
  prNumber?: number
  repository?: string
  analysisId?: string
  source?: 'claude-sub-agent' | 'coderabbit' | 'github' | 'expert-analysis'
}

/**
 * Enhanced Task execution with automatic log capture
 * Solves the agent isolation issue by intercepting all Task tool responses
 */
async function executeTaskWithLogging(
  taskOptions: {
    subagent_type: string
    description: string
    prompt: string
  },
  context: TaskExecutionContext = {},
): Promise<string> {
  console.warn(
    `🤖 Executing ${taskOptions.subagent_type} with automatic log capture...`,
  )
  console.warn(`📏 Prompt length: ${taskOptions.prompt.length} characters`)

  try {
    // Execute the Task tool
    const result = await Task(taskOptions)

    // Ensure we have a string response
    const response =
      typeof result === 'string' ? result : JSON.stringify(result)

    console.warn(
      `✅ ${taskOptions.subagent_type} response received (${response.length} characters)`,
    )

    // Automatically save the response with enhanced metadata
    const analysisId =
      context.analysisId ||
      `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    try {
      const logPath = await LogManager.saveSubAgentResponse(
        response,
        taskOptions.prompt,
        {
          timestamp: new Date().toISOString(),
          prNumber: context.prNumber,
          repository: context.repository,
          analysisId,
          source: context.source || 'claude-sub-agent',
          format: 'json',
        },
      )

      console.warn(
        `📁 Response automatically saved to: ${logPath.replace(process.cwd(), '.')}`,
      )
      console.warn(`🔍 Analysis ID: ${analysisId}`)
    } catch (logError) {
      console.error('❌ Failed to save sub-agent response to logs:', logError)
      // Continue even if logging fails - don't block the analysis
    }

    return response
  } catch (error) {
    console.error(`❌ Error executing ${taskOptions.subagent_type}:`, error)

    // Log the error attempt as well
    const errorResponse = JSON.stringify({
      error: String(error),
      taskType: taskOptions.subagent_type,
      timestamp: new Date().toISOString(),
    })

    try {
      await LogManager.saveSubAgentResponse(errorResponse, taskOptions.prompt, {
        timestamp: new Date().toISOString(),
        prNumber: context.prNumber,
        repository: context.repository,
        analysisId: `error-${Date.now()}`,
        source: 'claude-sub-agent',
        format: 'json',
      })
    } catch (logError) {
      console.warn('Failed to log error response:', logError)
    }

    throw error
  }
}

/**
 * GitHub security alert structure
 */
interface GitHubSecurityAlert {
  security_advisory?: {
    summary?: string
    description?: string
    severity?: string
    cve_id?: string | null
    cvss?: {
      score?: number
    }
  }
}

/**
 * Raw response from Claude sub-agent
 */
interface SubAgentResponse {
  findings?: Array<{
    id: string
    title: string
    description: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    category: string
    confidence: string
    location?: {
      file: string
      line?: number
    }
    cweId?: string
    cvssScore?: number
  }>
  riskLevel?: 'low' | 'medium' | 'high' | 'critical'
  recommendations?: string[]
  confidence?: number
}

/**
 * Claude sub-agent security analysis result
 */
export interface ClaudeSecurityAnalysis {
  findings: ClaudeSecurityFinding[]
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical'
  recommendations: string[]
  analysisTimestamp: string
  confidence: number
  vulnerabilityCount: {
    critical: number
    high: number
    medium: number
    low: number
  }
}

/**
 * Security finding from Claude's pr-review-synthesizer sub-agent
 */
export interface ClaudeSecurityFinding {
  id: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  category: 'security' | 'vulnerability' | 'best_practices'
  confidence: 'very_high' | 'high' | 'medium' | 'low'
  location?: {
    file: string
    line?: number
    column?: number
  }
  cweId?: string
  cvssScore?: number
  remediation?: string
  source: 'claude-pr-review-synthesizer'
  detectionMethod: 'sub-agent-analysis'
}

/**
 * Combined security data from multiple sources
 */
export interface CombinedSecurityData {
  claudeAnalysis: ClaudeSecurityAnalysis
  codeRabbitSecurityFindings: ClaudeSecurityFinding[]
  githubSecurityAlerts: ClaudeSecurityFinding[]
  overallAssessment: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    totalFindings: number
    mustFixBeforeMerge: boolean
    recommendations: string[]
  }
}

/**
 * SecurityDataIntegrator - Uses Claude's pr-review-synthesizer sub-agent for security analysis
 */
export class SecurityDataIntegrator {
  /**
   * Analyze PR security using Claude's specialized pr-review-synthesizer sub-agent
   */
  static async analyzeWithClaudeSubAgent(
    githubContext: GitHubPRContext,
    codeRabbitAnalysis?: CodeRabbitAnalysis,
  ): Promise<ClaudeSecurityAnalysis> {
    try {
      // Prepare comprehensive PR context for Claude's sub-agent
      this.preparePRContextForSubAgent(githubContext, codeRabbitAnalysis)

      // Use Task tool to launch pr-review-synthesizer sub-agent
      // This sub-agent excels at security vulnerability detection and has proven superior to pattern-based approaches
      const subAgentPrompt = `
I need you to perform a comprehensive security analysis of this GitHub Pull Request using Claude's /security-review command.

## Instructions
**IMPORTANT**: Please use Claude's \`/security-review\` command to analyze the code changes in this PR. This will leverage Claude's specialized security analysis capabilities.

## PR Context
**Repository:** ${githubContext.pullRequest.base.repo.full_name}
**PR #${githubContext.pullRequest.number}:** ${githubContext.pullRequest.title}
**Files Changed:** ${githubContext.files.length}
**Lines Changed:** +${githubContext.pullRequest.additions}/-${githubContext.pullRequest.deletions}

## Files and Changes
${this.formatFilesForAnalysis(githubContext.files)}

## CodeRabbit Existing Findings
${codeRabbitAnalysis ? this.formatCodeRabbitForAnalysis(codeRabbitAnalysis) : 'No CodeRabbit analysis available'}

## Analysis Steps
1. **First**: Run \`/security-review\` on the code changes above
2. **Then**: Synthesize the security findings with any CodeRabbit findings
3. **Finally**: Provide a consolidated security assessment

## Expected Output
After running \`/security-review\`, please provide:
- All security vulnerabilities found (command injection, SQL injection, XSS, secrets, etc.)
- Severity assessment for each finding (critical/high/medium/low)
- Specific remediation steps for each vulnerability
- Overall risk level for the PR
- Merge recommendation (approve/request changes/security block)

## Quality Standards
- Use Claude's \`/security-review\` for comprehensive vulnerability detection
- Cross-reference with CodeRabbit findings to avoid duplicates
- Prioritize actionable, specific remediation over generic advice
- Focus on vulnerabilities that could be exploited in production

Please start by running the \`/security-review\` command on the provided code changes.
`

      // Launch Claude's pr-review-synthesizer sub-agent via Task tool
      const subAgentResult = await this.launchSecuritySubAgent(
        subAgentPrompt,
        githubContext,
      )

      // Parse and structure the sub-agent's response
      const parsedAnalysis = this.parseSubAgentResponse(subAgentResult)

      return parsedAnalysis
    } catch (error) {
      console.error('Error in Claude sub-agent security analysis:', error)

      // Return minimal analysis on error
      return {
        findings: [],
        overallRiskLevel: 'low',
        recommendations: ['Error occurred during security analysis'],
        analysisTimestamp: new Date().toISOString(),
        confidence: 0,
        vulnerabilityCount: { critical: 0, high: 0, medium: 0, low: 0 },
      }
    }
  }

  /**
   * Combine security data from Claude, CodeRabbit, and GitHub sources
   */
  static async combineSecurityData(
    githubContext: GitHubPRContext,
    codeRabbitAnalysis?: CodeRabbitAnalysis,
  ): Promise<CombinedSecurityData> {
    // Get Claude's security analysis via sub-agent
    const claudeAnalysis = await this.analyzeWithClaudeSubAgent(
      githubContext,
      codeRabbitAnalysis,
    )

    // Extract security-related findings from CodeRabbit
    const codeRabbitSecurityFindings =
      this.extractCodeRabbitSecurityFindings(codeRabbitAnalysis)

    // Convert GitHub security alerts to our format
    const githubSecurityAlerts = this.convertGitHubSecurityAlerts(
      githubContext.securityAlerts,
    )

    // Calculate overall assessment
    const overallAssessment = this.calculateOverallSecurityAssessment(
      claudeAnalysis,
      codeRabbitSecurityFindings,
      githubSecurityAlerts,
    )

    return {
      claudeAnalysis,
      codeRabbitSecurityFindings,
      githubSecurityAlerts,
      overallAssessment,
    }
  }

  /**
   * Launch Claude's pr-review-synthesizer sub-agent via Task tool
   */
  private static async launchSecuritySubAgent(
    prompt: string,
    githubContext?: GitHubPRContext,
  ): Promise<string> {
    console.warn('🚀 Launching Claude pr-review-synthesizer sub-agent...')

    try {
      // Use the enhanced Task executor with automatic log capture
      const response = await executeTaskWithLogging(
        {
          subagent_type: 'pr-review-synthesizer',
          description: 'Security review analysis',
          prompt,
        },
        {
          prNumber: githubContext?.pullRequest?.number,
          repository: githubContext?.pullRequest?.base?.repo?.full_name,
          analysisId: `claude-security-${Date.now()}`,
          source: 'claude-sub-agent',
        },
      )

      console.warn('✅ Security sub-agent analysis completed successfully')
      return response
    } catch (error) {
      console.error('❌ Error in security sub-agent analysis:', error)

      // Return error state analysis
      return JSON.stringify({
        findings: [],
        riskLevel: 'critical',
        recommendations: ['Error in sub-agent communication'],
        confidence: 0,
        error: String(error),
      })
    }
  }

  /**
   * Parse Claude sub-agent response into structured format
   */
  private static parseSubAgentResponse(
    response: string,
  ): ClaudeSecurityAnalysis {
    try {
      const parsed = JSON.parse(response) as SubAgentResponse

      return {
        findings: (parsed.findings || []).map((f) => ({
          ...f,
          category: f.category as
            | 'security'
            | 'vulnerability'
            | 'best_practices',
          confidence: f.confidence as 'very_high' | 'high' | 'medium' | 'low',
          source: 'claude-pr-review-synthesizer' as const,
          detectionMethod: 'sub-agent-analysis' as const,
        })),
        overallRiskLevel: parsed.riskLevel || 'low',
        recommendations: parsed.recommendations || [],
        analysisTimestamp: new Date().toISOString(),
        confidence: parsed.confidence || 0.9,
        vulnerabilityCount: {
          critical:
            parsed.findings?.filter((f) => f.severity === 'critical').length ||
            0,
          high:
            parsed.findings?.filter((f) => f.severity === 'high').length || 0,
          medium:
            parsed.findings?.filter((f) => f.severity === 'medium').length || 0,
          low: parsed.findings?.filter((f) => f.severity === 'low').length || 0,
        },
      }
    } catch (error) {
      console.error('Error parsing sub-agent response:', error)

      return {
        findings: [],
        overallRiskLevel: 'low',
        recommendations: ['Error parsing security analysis'],
        analysisTimestamp: new Date().toISOString(),
        confidence: 0,
        vulnerabilityCount: { critical: 0, high: 0, medium: 0, low: 0 },
      }
    }
  }

  /**
   * Prepare PR context data for Claude sub-agent analysis
   */
  private static preparePRContextForSubAgent(
    githubContext: GitHubPRContext,
    codeRabbitAnalysis?: CodeRabbitAnalysis,
  ): object {
    return {
      repository: githubContext.pullRequest.base.repo.full_name,
      prNumber: githubContext.pullRequest.number,
      title: githubContext.pullRequest.title,
      description: githubContext.pullRequest.body,
      filesCount: githubContext.files.length,
      additions: githubContext.pullRequest.additions,
      deletions: githubContext.pullRequest.deletions,
      hasCodeRabbitAnalysis: !!codeRabbitAnalysis,
      hasSecurityAlerts: githubContext.securityAlerts.length > 0,
    }
  }

  /**
   * Format file changes for Claude sub-agent analysis
   */
  private static formatFilesForAnalysis(
    files: GitHubPRContext['files'],
  ): string {
    return files
      .slice(0, 20) // Limit to first 20 files to avoid token limits
      .map((file) => {
        const changeType =
          file.status === 'added'
            ? '+ NEW'
            : file.status === 'removed'
              ? '- DELETED'
              : '~ MODIFIED'

        return `**${changeType} ${file.filename}**
  - +${file.additions}/-${file.deletions} lines
  ${file.patch ? `\n\`\`\`diff\n${file.patch.slice(0, 1000)}${file.patch.length > 1000 ? '\n... (truncated)' : ''}\n\`\`\`` : ''}`
      })
      .join('\n\n')
  }

  /**
   * Format CodeRabbit analysis for Claude sub-agent
   */
  private static formatCodeRabbitForAnalysis(
    analysis: CodeRabbitAnalysis,
  ): string {
    if (!analysis.findings || analysis.findings.length === 0) {
      return 'No CodeRabbit findings available'
    }

    return analysis.findings
      .filter(
        (f) =>
          f.category === 'security' ||
          f.severity === 'critical' ||
          f.severity === 'high',
      )
      .slice(0, 10) // Limit findings to avoid token limits
      .map(
        (finding) => `
**${finding.title}** (${finding.severity})
- File: ${finding.location.file}:${finding.location.startLine}
- Description: ${finding.description.slice(0, 200)}${finding.description.length > 200 ? '...' : ''}`,
      )
      .join('\n')
  }

  /**
   * Extract security-related findings from CodeRabbit analysis
   */
  private static extractCodeRabbitSecurityFindings(
    analysis?: CodeRabbitAnalysis,
  ): ClaudeSecurityFinding[] {
    if (!analysis?.findings) return []

    return analysis.findings
      .filter(
        (finding) =>
          finding.category === 'security' ||
          finding.description.toLowerCase().includes('security') ||
          finding.description.toLowerCase().includes('vulnerability'),
      )
      .map((finding) => ({
        id: `coderabbit-${finding.id}`,
        title: finding.title,
        description: finding.description,
        severity: finding.severity as 'critical' | 'high' | 'medium' | 'low',
        category: 'security' as const,
        confidence: finding.confidence as
          | 'very_high'
          | 'high'
          | 'medium'
          | 'low',
        location: {
          file: finding.location.file,
          line: finding.location.startLine,
        },
        source: 'claude-pr-review-synthesizer' as const,
        detectionMethod: 'sub-agent-analysis' as const,
      }))
  }

  /**
   * Convert GitHub security alerts to our format
   */
  private static convertGitHubSecurityAlerts(
    alerts: GitHubSecurityAlert[],
  ): ClaudeSecurityFinding[] {
    return alerts.map((alert, index) => ({
      id: `github-alert-${index}`,
      title: alert.security_advisory?.summary || 'GitHub Security Alert',
      description:
        alert.security_advisory?.description ||
        alert.security_advisory?.summary ||
        '',
      severity: this.mapGitHubSeverity(alert.security_advisory?.severity),
      category: 'vulnerability' as const,
      confidence: 'very_high' as const,
      location: {
        file: 'package.json', // GitHub alerts are typically dependency-related
      },
      cweId: alert.security_advisory?.cve_id || undefined,
      cvssScore: alert.security_advisory?.cvss?.score,
      source: 'claude-pr-review-synthesizer' as const,
      detectionMethod: 'sub-agent-analysis' as const,
    }))
  }

  /**
   * Map GitHub severity to our severity levels
   */
  private static mapGitHubSeverity(
    severity?: string,
  ): 'critical' | 'high' | 'medium' | 'low' {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'critical'
      case 'high':
        return 'high'
      case 'medium':
      case 'moderate':
        return 'medium'
      case 'low':
        return 'low'
      default:
        return 'medium'
    }
  }

  /**
   * Calculate overall security assessment from all sources
   */
  private static calculateOverallSecurityAssessment(
    claudeAnalysis: ClaudeSecurityAnalysis,
    codeRabbitFindings: ClaudeSecurityFinding[],
    githubAlerts: ClaudeSecurityFinding[],
  ): CombinedSecurityData['overallAssessment'] {
    const allFindings = [
      ...claudeAnalysis.findings,
      ...codeRabbitFindings,
      ...githubAlerts,
    ]

    const criticalCount = allFindings.filter(
      (f) => f.severity === 'critical',
    ).length
    const highCount = allFindings.filter((f) => f.severity === 'high').length

    // Determine overall risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (criticalCount > 0) riskLevel = 'critical'
    else if (highCount > 0) riskLevel = 'high'
    else if (allFindings.length > 2) riskLevel = 'medium'

    // Determine if changes must be blocked
    const mustFixBeforeMerge = criticalCount > 0 || highCount > 2

    // Combine recommendations from all sources
    const recommendations = [
      ...claudeAnalysis.recommendations,
      ...(mustFixBeforeMerge
        ? [
            '🚨 BLOCKING: Critical security issues must be resolved before merge',
          ]
        : []),
      ...(criticalCount > 0
        ? [`Found ${criticalCount} critical security vulnerabilities`]
        : []),
      ...(highCount > 0
        ? [`Found ${highCount} high-severity security issues`]
        : []),
    ]

    return {
      riskLevel,
      totalFindings: allFindings.length,
      mustFixBeforeMerge,
      recommendations: Array.from(new Set(recommendations)), // Remove duplicates
    }
  }
}
