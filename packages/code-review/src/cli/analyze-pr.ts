#!/usr/bin/env tsx

/**
 * Analyzes a GitHub PR and generates a comprehensive code review using the @studio/code-review package
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

import type { CodeRabbitFinding } from '../types/coderabbit.js'

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

/**
 * Extract AI prompt from CodeRabbit description
 */
function extractAIPrompt(description: string): string | undefined {
  // Look for "🤖 Prompt for AI Agents" section
  const aiPromptMatch = description.match(
    /<summary>🤖 Prompt for AI Agents<\/summary>\s*\n+```\s*([\s\S]*?)\s*```/,
  )

  if (aiPromptMatch) {
    return aiPromptMatch[1].trim()
  }

  return undefined
}

/**
 * Clean and truncate description for display
 */
function cleanDescription(description: string): string {
  // Remove HTML details/summary blocks and markdown artifacts
  const cleaned = description
    .replace(/<details>[\s\S]*?<\/details>/g, '')
    .replace(/<!-- .*? -->/g, '')
    .replace(/^_.*?_\n*/m, '') // Remove italic headers like "_🛠️ Refactor suggestion_"
    .replace(/```diff[\s\S]*?```/g, '') // Remove diff code blocks
    .replace(/```[\s\S]*?```/g, '') // Remove other code blocks
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown but keep content

  // Take first few lines and clean up
  const lines = cleaned.split('\n').filter((line) => line.trim())
  let result = lines.slice(0, 4).join(' ').trim()

  // Clean up extra spaces and normalize whitespace
  result = result.replace(/\s+/g, ' ')

  // Truncate if too long with better word boundary
  if (result.length > 350) {
    const truncated = result.substring(0, 347)
    const lastSpace = truncated.lastIndexOf(' ')
    return lastSpace > 250
      ? `${truncated.substring(0, lastSpace)}...`
      : `${truncated}...`
  }

  return result
}

interface CLIOptions {
  'pr-number'?: string
  pr?: string
  repo?: string
  repository?: string
  'coderabbit-file'?: string
  'include-diff'?: boolean
  output?: string
  help?: boolean
}

interface PRAnalysis {
  findings: Array<{
    type: string
    severity: string
    message: string
    file?: string
    line?: number
  }>
  summary: {
    totalFindings: number
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    needsReview: boolean
    recommendation: string
  }
  metrics: {
    filesChanged: number
    linesAdded: number
    linesDeleted: number
    complexity: string
  }
}

async function fetchPRData(repo: string, prNumber: string) {
  try {
    const prNum = parseInt(prNumber, 10)
    validatePRNumber(prNum)
    validateRepoName(repo)

    // Fetch PR metadata
    const prData = JSON.parse(
      execFileSync(
        'gh',
        [
          'pr',
          'view',
          prNumber,
          '--repo',
          repo,
          '--json',
          'title,body,author,state,files,additions,deletions,commits',
        ],
        { encoding: 'utf-8' },
      ),
    )

    // Fetch PR diff
    const diff = execFileSync('gh', ['pr', 'diff', prNumber, '--repo', repo], {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    })

    return {
      metadata: prData,
      diff,
    }
  } catch (error) {
    console.error('Error fetching PR data:', error)
    throw error
  }
}

interface PRMetadata {
  title: string
  body?: string
  author?: { login: string }
  state: string
  additions?: number
  deletions?: number
  files?: Array<{
    path: string
    additions: number
    deletions: number
  }>
  commits?: Array<{ sha: string }>
}

function analyzePR(
  prData: PRMetadata,
  diff: string,
  coderabbitFindings: CodeRabbitFinding[],
): PRAnalysis {
  const findings = []

  // Enhanced security analysis using pattern matching but with improved patterns
  const securityPatterns = [
    {
      // Improved hardcoded API key detection
      pattern:
        /(?:api[_-]?key|apikey)\s*[=:]\s*["'](?!test|mock|fake|example|dummy|placeholder|your-key|api-key)[a-zA-Z0-9_-]{20,}["']/gi,
      message: 'Hardcoded API key detected - Security risk',
      severity: 'critical' as const,
      owaspCategory: 'A05_security_misconfiguration',
    },
    {
      // Improved password detection
      pattern:
        /password\s*[=:]\s*["'](?!test|mock|fake|example|dummy|password|123|admin|changeme)[^"']{8,}["']/gi,
      message: 'Hardcoded password detected - Security vulnerability',
      severity: 'critical' as const,
      owaspCategory: 'A07_identification_authentication_failures',
    },
    {
      // SQL injection patterns
      pattern:
        /(?:SELECT|INSERT|UPDATE|DELETE)[\s\S]*?(?:\$\{|" \+|' \+|\+ "|\+ ')/gi,
      message: 'Potential SQL injection vulnerability detected',
      severity: 'high' as const,
      owaspCategory: 'A03_injection',
    },
    {
      // XSS patterns
      pattern: /innerHTML\s*=|document\.write\s*\(/gi,
      message: 'Potential XSS vulnerability - Use safe DOM methods',
      severity: 'high' as const,
      owaspCategory: 'A03_injection',
    },
    {
      // Insecure crypto
      pattern: /crypto\.createHash\s*\(\s*["']md5["']\s*\)/gi,
      message: 'Insecure hash algorithm MD5 detected - Use SHA-256 or better',
      severity: 'medium' as const,
      owaspCategory: 'A02_cryptographic_failures',
    },
  ]

  const diffLines = diff.split('\n')
  let currentFile = ''

  diffLines.forEach((line, index) => {
    // Track current file from diff headers
    if (line.startsWith('+++')) {
      const fileMatch = line.match(/\+\+\+ b\/(.+)/)
      currentFile = fileMatch ? fileMatch[1] : ''
    }

    if (line.startsWith('+') && !line.startsWith('+++')) {
      // Skip test files and obvious test contexts
      const isTestContext =
        currentFile.includes('.test.') ||
        currentFile.includes('__tests__') ||
        currentFile.includes('.spec.') ||
        line.includes('@studio/') ||
        line.includes('✓') ||
        line.includes('stderr') ||
        line.includes('[DEBUG]') ||
        line.includes('[INFO]')

      securityPatterns.forEach(
        ({ pattern, message, severity, owaspCategory }) => {
          // Apply security patterns to non-test code
          if (!isTestContext && pattern.test(line)) {
            findings.push({
              type: 'security',
              severity,
              message,
              line: index + 1,
              file: currentFile,
              owaspCategory,
              confidence: 0.85, // High confidence in pattern-based detection
            })
          }
        },
      )

      // Basic console.log detection (but skip in tests)
      if (!isTestContext && /console\.(log|debug|info|warn)\s*\(/g.test(line)) {
        findings.push({
          type: 'code_quality',
          severity: 'low' as const,
          message: 'Console statements should be removed from production code',
          line: index + 1,
          file: currentFile,
        })
      }
    }
  })

  // Enhanced complexity analysis
  try {
    // Simple metrics collection without full GitHub context
    const totalChanges = (prData.additions || 0) + (prData.deletions || 0)
    const fileCount = prData.files?.length || 0

    // Complexity scoring based on change size and file count
    let complexityScore = 0
    if (totalChanges > 1000) complexityScore += 15
    else if (totalChanges > 500) complexityScore += 10
    else if (totalChanges > 200) complexityScore += 5

    if (fileCount > 20) complexityScore += 10
    else if (fileCount > 10) complexityScore += 5

    // Check for high-risk file patterns
    const riskFilePatterns = [
      /config/,
      /auth/,
      /security/,
      /crypto/,
      /password/,
      /key/,
    ]
    const hasRiskFiles =
      prData.files?.some((f) =>
        riskFilePatterns.some((pattern) => pattern.test(f.path.toLowerCase())),
      ) || false

    if (hasRiskFiles) {
      complexityScore += 5
      findings.push({
        type: 'security_review',
        severity: 'medium' as const,
        message: 'Changes in security-sensitive files require extra review',
        owaspCategory: 'A05_security_misconfiguration',
      })
    }

    // Enhanced analysis for validated CodeRabbit findings
    coderabbitFindings
      .filter((finding) => finding.severity !== 'info')
      .forEach((finding) => {
        const description = cleanDescription(finding.description)
        const aiPrompt = extractAIPrompt(finding.description)

        // Apply confidence scoring based on finding characteristics
        let confidence = 0.7 // Base confidence for CodeRabbit
        if (finding.severity === 'critical') confidence = 0.95
        else if (finding.severity === 'high') confidence = 0.85
        else if (finding.severity === 'medium') confidence = 0.75

        // Boost confidence for security-related findings
        if (
          finding.category === 'security' ||
          finding.description.toLowerCase().includes('security') ||
          finding.description.toLowerCase().includes('vulnerability')
        ) {
          confidence = Math.min(confidence + 0.1, 1.0)
        }

        findings.push({
          type: 'coderabbit',
          severity: finding.severity,
          message: finding.title,
          file: finding.location.file,
          line: finding.location.startLine,
          description,
          aiPrompt,
          confidence,
        })
      })

    // PR structure analysis
    if (totalChanges > 500) {
      findings.push({
        type: 'pr-size',
        severity: 'medium' as const,
        message: `Large PR with ${totalChanges} lines changed. Consider breaking into smaller PRs.`,
      })
    }

    if (!prData.body || prData.body.trim().length < 50) {
      findings.push({
        type: 'documentation',
        severity: 'low' as const,
        message:
          'PR description is too brief. Add more context about the changes.',
      })
    }

    const testFiles =
      prData.files?.filter(
        (f) => f.path.includes('.test.') || f.path.includes('.spec.'),
      ) || []
    const sourceFiles =
      prData.files?.filter(
        (f) => !f.path.includes('.test.') && !f.path.includes('.spec.'),
      ) || []

    if (sourceFiles.length > 0 && testFiles.length === 0) {
      findings.push({
        type: 'testing',
        severity: 'medium' as const,
        message:
          'No test files modified. Consider adding tests for the changes.',
      })
    }

    // Calculate risk level based on findings and patterns
    const criticalCount = findings.filter(
      (f) => (f.severity as string) === 'critical',
    ).length
    const highCount = findings.filter(
      (f) => (f.severity as string) === 'high',
    ).length
    const securityCount = findings.filter((f) => f.type === 'security').length

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (criticalCount > 0 || securityCount > 2) {
      riskLevel = 'critical'
    } else if (highCount > 0 || securityCount > 0) {
      riskLevel = 'high'
    } else if (findings.length > 3 || complexityScore > 10) {
      riskLevel = 'medium'
    }

    return {
      findings,
      summary: {
        totalFindings: findings.length,
        riskLevel,
        needsReview: findings.length > 0 || totalChanges > 200 || hasRiskFiles,
        recommendation:
          riskLevel === 'critical'
            ? 'Address critical security issues before merging'
            : riskLevel === 'high'
              ? 'Address high-priority issues before merging'
              : findings.length > 0
                ? 'Review and address findings'
                : 'PR looks good to merge',
      },
      metrics: {
        filesChanged: prData.files?.length || 0,
        linesAdded: prData.additions || 0,
        linesDeleted: prData.deletions || 0,
        complexity:
          complexityScore > 15
            ? 'high'
            : complexityScore > 8
              ? 'medium'
              : 'low',
      },
    }
  } catch (error) {
    console.error(
      'Error in advanced analysis, falling back to basic analysis:',
      error,
    )

    // Fallback to basic analysis
    const criticalCount = findings.filter(
      (f) => (f.severity as string) === 'critical',
    ).length
    const highCount = findings.filter(
      (f) => (f.severity as string) === 'high',
    ).length
    const totalChanges = (prData.additions || 0) + (prData.deletions || 0)

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
    if (criticalCount > 0) riskLevel = 'critical'
    else if (highCount > 0) riskLevel = 'high'
    else if (findings.length > 2) riskLevel = 'medium'

    return {
      findings,
      summary: {
        totalFindings: findings.length,
        riskLevel,
        needsReview: findings.length > 0 || totalChanges > 200,
        recommendation:
          riskLevel === 'critical' || riskLevel === 'high'
            ? 'Address critical issues before merging'
            : findings.length > 0
              ? 'Review and address findings'
              : 'PR looks good to merge',
      },
      metrics: {
        filesChanged: prData.files?.length || 0,
        linesAdded: prData.additions || 0,
        linesDeleted: prData.deletions || 0,
        complexity:
          totalChanges > 500 ? 'high' : totalChanges > 200 ? 'medium' : 'low',
      },
    }
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      'pr-number': { type: 'string' },
      pr: { type: 'string' },
      repo: { type: 'string' },
      repository: { type: 'string' },
      'coderabbit-file': { type: 'string' },
      'include-diff': { type: 'boolean', default: false },
      output: { type: 'string' },
      help: { type: 'boolean' },
    },
  }) as { values: CLIOptions }

  if (values.help) {
    // eslint-disable-next-line no-console
    console.log(`
Usage: npx tsx analyze-pr.ts --pr-number <number> --repo <owner/repo> [options]

Analyzes a GitHub PR and generates a comprehensive code review.

Options:
  --pr-number, --pr        PR number to analyze
  --repo, --repository     GitHub repository in format owner/repo
  --coderabbit-file        Path to CodeRabbit findings JSON file
  --include-diff           Include full diff in analysis output
  --output                 Output file (defaults to stdout)
  --help                   Show this help message

Example:
  npx tsx analyze-pr.ts --pr 139 --repo nathanvale/mnemosyne --coderabbit-file coderabbit.json
`)
    process.exit(0)
  }

  const prNumber = values['pr-number'] || values.pr
  const repo = values.repo || values.repository

  if (!prNumber || !repo) {
    console.error('Error: --pr-number and --repo are required')
    console.error('Run with --help for usage information')
    process.exit(1)
  }

  try {
    // Fetch PR data from GitHub
    const { metadata, diff } = await fetchPRData(repo, prNumber)

    // Load CodeRabbit findings if provided
    let coderabbitFindings: CodeRabbitFinding[] = []
    if (values['coderabbit-file']) {
      try {
        const coderabbitData = JSON.parse(
          readFileSync(values['coderabbit-file'], 'utf-8'),
        )
        if (coderabbitData.findings) {
          coderabbitFindings = coderabbitData.findings
        }
      } catch (error) {
        console.error(`Warning: Could not load CodeRabbit file: ${error}`)
      }
    }

    // Perform analysis
    const analysis = analyzePR(metadata, diff, coderabbitFindings)

    // Prepare output
    const output = {
      pullRequest: {
        number: parseInt(prNumber),
        title: metadata.title,
        author: metadata.author?.login || 'unknown',
        repository: repo,
        state: metadata.state,
      },
      analysis,
      timestamp: new Date().toISOString(),
      diff: values['include-diff'] ? diff : undefined,
    }

    // Output results
    const jsonOutput = JSON.stringify(output, null, 2)
    if (values.output) {
      const fs = await import('node:fs')
      fs.writeFileSync(values.output, jsonOutput)
      console.error(`Analysis written to ${values.output}`)
      console.error(
        `Analyzed PR #${prNumber}: ${analysis.findings.length} findings, risk level: ${analysis.summary.riskLevel}`,
      )
    } else {
      // eslint-disable-next-line no-console
      console.log(jsonOutput)
    }
  } catch (error) {
    console.error('Error analyzing PR:', error)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
