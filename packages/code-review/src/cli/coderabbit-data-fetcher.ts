/**
 * CodeRabbitDataFetcher - Async data fetcher for CodeRabbit API integration
 *
 * This class provides async methods for fetching CodeRabbit comments and parsing
 * structured data from GitHub PRs, making it testable and following the same
 * patterns as GitHubDataFetcher.
 */

import { CodeRabbitFinding } from '../types/coderabbit'
import { execFileJson } from '../utils/async-exec'
import { ErrorHandler } from '../utils/error-handler'

/**
 * Validate repository name format
 */
function validateRepoName(repo: string): void {
  if (!/^[a-zA-Z0-9\-_.]+\/[a-zA-Z0-9\-_.]+$/.test(repo)) {
    throw new Error(
      `Invalid repository format: ${repo}. Expected format: owner/repo`,
    )
  }
}

/**
 * Validate PR number
 */
function validatePRNumber(prNumber: number): void {
  if (!Number.isInteger(prNumber) || prNumber <= 0) {
    throw new Error(
      `Invalid PR number: ${prNumber}. Must be a positive integer`,
    )
  }
}

interface CodeRabbitComment {
  id: number
  user: {
    login: string
    type: string
  }
  body: string
  created_at: string
  updated_at: string
}

interface PRReviewComment {
  id: number
  user: {
    login: string
    type: string
  }
  body: string
  path: string
  line?: number
  start_line?: number
  created_at: string
  updated_at: string
  pull_request_review_id?: number
}

interface ParsedCodeRabbitData {
  prNumber: number
  repository: string
  fetchedAt: string
  hasCodeRabbitReview: boolean
  issueComments: CodeRabbitComment[]
  reviewComments: PRReviewComment[]
  findings: CodeRabbitFinding[]
  summary?: string
  walkthrough?: string
  metadata?: {
    fileChanges?: Array<{ file: string; description: string }>
    reviewEffort?: { score: number; complexity: string }
    hasSequenceDiagrams?: boolean
    error?: string
    continueAnalysis?: boolean
  }
}

export interface CodeRabbitDataFetcherOptions {
  verbose?: boolean
  includeReviewComments?: boolean
}

export class CodeRabbitDataFetcher {
  private verbose: boolean
  private includeReviewComments: boolean

  constructor(options: CodeRabbitDataFetcherOptions = {}) {
    this.verbose = options.verbose ?? false
    this.includeReviewComments = options.includeReviewComments ?? true
  }

  /**
   * Fetch CodeRabbit data for a PR
   */
  async fetchCodeRabbitData(
    prNumber: number,
    repository: string,
  ): Promise<ParsedCodeRabbitData> {
    validatePRNumber(prNumber)
    validateRepoName(repository)

    const errorHandler = new ErrorHandler()

    if (this.verbose) {
      console.warn(
        `Fetching CodeRabbit data for PR ${prNumber} in ${repository}`,
      )
    }

    try {
      // Fetch issue comments (summaries/walkthroughs) using gh CLI
      const issueComments = (await execFileJson('gh', [
        'api',
        `repos/${repository}/issues/${prNumber.toString()}/comments`,
        '--paginate',
      ])) as CodeRabbitComment[]

      // Filter for CodeRabbit issue comments
      const coderabbitIssueComments = issueComments.filter(
        (comment) =>
          comment.user.login === 'coderabbitai' ||
          comment.user.login === 'coderabbitai[bot]',
      )

      let coderabbitReviewComments: PRReviewComment[] = []

      if (this.includeReviewComments) {
        try {
          // Fetch PR review comments (line-by-line feedback) using gh CLI
          const reviewComments = (await execFileJson('gh', [
            'api',
            `repos/${repository}/pulls/${prNumber.toString()}/comments`,
            '--paginate',
          ])) as PRReviewComment[]

          // Filter for CodeRabbit review comments
          coderabbitReviewComments = reviewComments.filter(
            (comment) =>
              comment.user.login === 'coderabbitai' ||
              comment.user.login === 'coderabbitai[bot]',
          )
        } catch (error) {
          if (this.verbose) {
            console.warn('Could not fetch PR review comments:', error)
          }
        }
      }

      // Parse CodeRabbit data
      const result: ParsedCodeRabbitData = {
        prNumber,
        repository,
        fetchedAt: new Date().toISOString(),
        hasCodeRabbitReview:
          coderabbitIssueComments.length > 0 ||
          coderabbitReviewComments.length > 0,
        issueComments: coderabbitIssueComments,
        reviewComments: coderabbitReviewComments,
        findings: [],
        metadata: {},
      }

      // Extract findings from issue comments (walkthroughs/summaries)
      for (const comment of coderabbitIssueComments) {
        const parsed = this.parseCodeRabbitMarkdown(comment.body)
        if (parsed.summary && !result.summary) {
          result.summary = parsed.summary
        }
        if (parsed.walkthrough && !result.walkthrough) {
          result.walkthrough = parsed.walkthrough
        }
        if (parsed.findings) {
          result.findings.push(...parsed.findings)
        }
        // Merge metadata
        if (parsed.metadata) {
          result.metadata = { ...result.metadata, ...parsed.metadata }
        }
      }

      // Extract findings from PR review comments (line-by-line feedback)
      for (const comment of coderabbitReviewComments) {
        const finding = this.parseReviewComment(comment)
        if (finding) {
          result.findings.push(finding)
        }
      }

      return result
    } catch (error) {
      // Handle CodeRabbit API errors gracefully
      if (error instanceof Error) {
        const fallbackResult = await errorHandler.handleCodeRabbitError(
          error,
          prNumber,
          repository,
        )

        if (this.verbose) {
          console.warn(
            `CodeRabbit fallback activated: ${fallbackResult.summary}`,
          )
        }

        // Return a minimal ParsedCodeRabbitData with error information
        return {
          prNumber,
          repository,
          fetchedAt: new Date().toISOString(),
          hasCodeRabbitReview: false,
          issueComments: [],
          reviewComments: [],
          findings: fallbackResult.findings as CodeRabbitFinding[],
          summary: fallbackResult.summary,
          metadata: {
            error: fallbackResult.error,
            continueAnalysis: fallbackResult.continueAnalysis,
          },
        }
      }

      // Re-throw if not an Error instance
      throw error
    }
  }

  /**
   * Parse a CodeRabbit review comment into a finding
   */
  private parseReviewComment(
    comment: PRReviewComment,
  ): CodeRabbitFinding | null {
    const body = comment.body.trim()

    // Check for CodeRabbit emoji indicators
    let severity: 'critical' | 'high' | 'medium' | 'low' | 'info' = 'medium'
    let category:
      | 'security'
      | 'performance'
      | 'maintainability'
      | 'bug_risk'
      | 'style'
      | 'documentation'
      | 'best_practices'
      | 'accessibility'
      | 'testing' = 'best_practices'
    let title = ''
    let description = body

    // Parse emoji indicators - preserve CodeRabbit's original intent more faithfully
    if (body.includes('🛠️') || body.includes('_🛠️ Refactor suggestion_')) {
      severity = 'low' // Refactoring is usually low priority
      category = 'maintainability'
      title = 'Refactor suggestion'
    } else if (body.includes('⚠️') || body.includes('_⚠️ Potential issue_')) {
      // Keep potential issues at medium/high based on content
      if (body.match(/incorrect|broken|fail|error|missing|undefined|null/i)) {
        severity = 'high' // Issues that could cause failures
        category = 'bug_risk'
        title = 'Potential bug'
      } else {
        severity = 'medium' // Other potential issues
        category = 'bug_risk'
        title = 'Potential issue'
      }
    } else if (body.includes('🔒') || body.includes('Security')) {
      // Check if it's actually about dependencies/versions
      if (body.match(/dependency|version|package\.json|npm|yarn|pnpm/i)) {
        severity = 'low' // Dependency updates are low priority
        category = 'maintainability'
        title = 'Dependency update'
      } else if (
        body.match(/CVE-|CWE-|vulnerability|exploit|injection|XSS|CSRF/i)
      ) {
        // Only mark as critical if it mentions specific vulnerabilities
        severity = 'critical'
        category = 'security'
        title = 'Security vulnerability'
      } else if (body.match(/password|auth|token|secret|credential/i)) {
        severity = 'high' // Auth-related issues are high priority
        category = 'security'
        title = 'Security issue'
      } else {
        severity = 'medium' // Other security suggestions
        category = 'security'
        title = 'Security concern'
      }
    } else if (body.includes('⚡') || body.includes('Performance')) {
      severity = 'medium' // Performance issues deserve attention
      category = 'performance'
      title = 'Performance issue'
    } else if (body.includes('📝') || body.includes('Documentation')) {
      severity = 'low'
      category = 'documentation'
      title = 'Documentation improvement'
    } else if (body.includes('💡') || body.includes('Suggestion')) {
      // Check if it's a verification or important suggestion
      if (body.includes('Verification agent') || body.includes('verify')) {
        severity = 'medium' // Verification suggestions are important
        category = 'testing'
        title = 'Verification needed'
      } else {
        severity = 'low' // General suggestions are low priority
        category = 'best_practices'
        title = 'Improvement suggestion'
      }
    } else {
      // Default to medium for unrecognized patterns (be conservative)
      severity = 'medium'
      category = 'best_practices'
      title = 'Code review comment'
    }

    // Extract the actual suggestion/issue description
    // Remove the emoji header if present
    const cleanedBody = body
      .replace(/^_?[🛠️⚠️🔒⚡📝💡].*?_?\n+/, '')
      .replace(/^\*\*.*?\*\*\n+/, '')
      .trim()

    if (cleanedBody) {
      description = cleanedBody
    }

    // Only create a finding if we have meaningful content
    if (!description || description.length < 10) {
      return null
    }

    return {
      id: `coderabbit-review-${comment.id}`,
      title: title || `Review comment on ${comment.path}`,
      description,
      severity,
      category,
      confidence: 'high',
      location: {
        file: comment.path,
        startLine: comment.start_line || comment.line || 0,
        endLine: comment.line || 0,
      },
      tags: ['coderabbit-review', category],
      source: 'coderabbit',
      timestamp: comment.created_at,
    }
  }

  /**
   * Parse CodeRabbit markdown content
   */
  private parseCodeRabbitMarkdown(
    markdown: string,
  ): Partial<ParsedCodeRabbitData> {
    const result: Partial<ParsedCodeRabbitData> = {
      findings: [],
      metadata: {},
    }

    // Extract walkthrough section (CodeRabbit's main summary)
    const walkthroughMatch = markdown.match(
      /## Walkthrough\s*\n([\s\S]*?)(?=\n##|$)/i,
    )
    if (walkthroughMatch) {
      result.walkthrough = walkthroughMatch[1].trim()
      result.summary = walkthroughMatch[1].trim() // Use walkthrough as summary
    }

    // Extract changes table
    const changesMatch = markdown.match(/## Changes\s*\n([\s\S]*?)(?=\n##|$)/i)
    if (changesMatch) {
      const changesSection = changesMatch[1]
      // Parse the markdown table
      const tableRows = changesSection.match(/^\|.*\|.*\|$/gm)
      if (tableRows && tableRows.length > 2) {
        const fileChanges: Array<{ file: string; description: string }> = []
        // Skip header and separator rows
        for (let i = 2; i < tableRows.length; i++) {
          const row = tableRows[i]
          const columns = row
            .split('|')
            .map((col) => col.trim())
            .filter((col) => col)
          if (columns.length >= 2) {
            // Extract file path from the first column (may contain HTML/markdown)
            const fileMatch = columns[0].match(/`([^`]+)`/)
            const file = fileMatch ? fileMatch[1] : columns[0]
            const description = columns[1]
            fileChanges.push({ file, description })
          }
        }

        // Store file changes in metadata
        if (result.metadata) {
          result.metadata.fileChanges = fileChanges
        }
      }
    }

    // Extract review effort estimation
    const effortMatch = markdown.match(
      /## Estimated code review effort\s*\n.*?🎯\s*(\d+)\s+\(([\w\s]+)\)/i,
    )
    if (effortMatch) {
      if (result.metadata) {
        result.metadata.reviewEffort = {
          score: parseInt(effortMatch[1]),
          complexity: effortMatch[2].trim(),
        }
      }
    }

    // Extract sequence diagrams (just note their presence)
    const hasDiagrams = markdown.includes('```mermaid')
    if (hasDiagrams && result.metadata) {
      result.metadata.hasSequenceDiagrams = true
    }

    // Since CodeRabbit doesn't provide specific findings, we'll create informational entries
    // from the file changes to help guide the review
    if (result.metadata?.fileChanges) {
      let findingId = 1
      for (const change of result.metadata.fileChanges) {
        const finding: CodeRabbitFinding = {
          id: `coderabbit-${findingId++}`,
          title: `File changed: ${change.file}`,
          description: change.description,
          severity: 'info',
          category: 'best_practices',
          confidence: 'high',
          location: {
            file: change.file,
            startLine: 0,
            endLine: 0,
          },
          tags: ['file-change', 'review-focus'],
          source: 'coderabbit',
          timestamp: new Date().toISOString(),
        }
        result.findings?.push(finding)
      }
    }

    return result
  }
}
