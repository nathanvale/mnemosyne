#!/usr/bin/env tsx

/**
 * Generates a formatted code review report from analysis data
 */

import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

interface CLIOptions {
  'analysis-file'?: string
  format?: string
  output?: string
  'github-ready'?: boolean
  help?: boolean
}

interface Finding {
  type: string
  severity: string
  message: string
  file?: string
  line?: number
  description?: string
  aiPrompt?: string
}

/**
 * Format AI prompt text for better readability
 */
function formatAIPrompt(prompt: string): string {
  // Clean up excessive whitespace and normalize line breaks
  let text = prompt
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/\s+/g, ' ')
    .trim()

  // Break at natural boundaries for better readability
  const breakPoints = [
    // Line numbers and file references
    /(\d+[-–]\d+[,)])/g,
    // Parenthetical clauses
    /(\([^)]{30,}\))/g,
    // Action words that start new instructions
    /(; (?=update|add|change|ensure|remove|apply|create|define))/gi,
    // Comma-separated lists
    /(, (?=and |or |but ))/g,
    // Semi-colons with space
    /(; )/g,
  ]

  // Apply breaks at natural points
  breakPoints.forEach((pattern) => {
    text = text.replace(pattern, '$1\n')
  })

  // Break very long lines (over 100 chars) at logical points
  const lines = text.split('\n')
  const wrappedLines = lines.map((line) => {
    if (line.length <= 100) return line

    // Find good break points in long lines
    const words = line.split(' ')
    const result = []
    let currentLine = ''

    words.forEach((word) => {
      if (currentLine.length + word.length + 1 <= 85) {
        currentLine += (currentLine ? ' ' : '') + word
      } else {
        if (currentLine) result.push(currentLine)
        currentLine = word
      }
    })

    if (currentLine) result.push(currentLine)
    return result.join('\n')
  })

  // Clean up excessive line breaks and return
  return wrappedLines
    .join('\n')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\n+|\n+$/g, '')
}

interface AnalysisData {
  pullRequest: {
    number: number
    title: string
    author: string
    repository: string
    state?: string
  }
  analysis: {
    findings: Finding[]
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
  timestamp: string
}

function generateMarkdownReport(data: AnalysisData): string {
  const { pullRequest, analysis } = data

  const severityEmoji = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
    info: 'ℹ️',
  }

  const riskEmoji = {
    critical: '🚨',
    high: '⚠️',
    medium: '⚡',
    low: '✅',
  }

  let report = `# Code Review Report

## Pull Request: #${pullRequest.number} - ${pullRequest.title}

**Author:** ${pullRequest.author}  
**Repository:** ${pullRequest.repository}  
**Generated:** ${new Date(data.timestamp).toLocaleString()}

## Summary

${riskEmoji[analysis.summary.riskLevel]} **Risk Level:** ${analysis.summary.riskLevel.toUpperCase()}  
**Total Findings:** ${analysis.summary.totalFindings}  
**Recommendation:** ${analysis.summary.recommendation}

## Metrics

- **Files Changed:** ${analysis.metrics.filesChanged}
- **Lines Added:** ${analysis.metrics.linesAdded}
- **Lines Deleted:** ${analysis.metrics.linesDeleted}
- **Complexity:** ${analysis.metrics.complexity}

`

  if (analysis.findings.length > 0) {
    report += `## Findings\n\n`

    // Group findings by severity
    const groupedFindings: Record<string, Finding[]> = {}
    analysis.findings.forEach((finding) => {
      if (!groupedFindings[finding.severity]) {
        groupedFindings[finding.severity] = []
      }
      groupedFindings[finding.severity].push(finding)
    })

    // Sort severities
    const severityOrder = ['critical', 'high', 'medium', 'low', 'info']
    severityOrder.forEach((severity) => {
      if (groupedFindings[severity] && groupedFindings[severity].length > 0) {
        report += `### ${severityEmoji[severity as keyof typeof severityEmoji]} ${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity\n\n`

        groupedFindings[severity].forEach((finding) => {
          if (
            finding.type === 'coderabbit' &&
            (finding.description || finding.aiPrompt)
          ) {
            // Enhanced formatting for CodeRabbit findings with detailed information
            report += `- **[${finding.type}]** ${finding.message}\n`

            if (finding.file) {
              report += `  \n  📍 \`${finding.file}`
              if (finding.line) {
                report += `:${finding.line}`
              }
              report += `\`\n`
            }

            if (finding.description) {
              report += `  \n  **Issue**: ${finding.description}\n`
            }

            if (finding.aiPrompt) {
              // Clean up and format AI prompts for better readability
              const cleanPrompt = formatAIPrompt(finding.aiPrompt)
              report += `  \n  <details>\n  <summary>🤖 AI Fix Instructions</summary>\n  \n  ${cleanPrompt}\n  \n  </details>\n`
            }

            report += `\n`
          } else {
            // Standard formatting for other finding types
            report += `- **[${finding.type}]** ${finding.message}`
            if (finding.file) {
              report += ` (${finding.file}`
              if (finding.line) {
                report += `:${finding.line}`
              }
              report += `)`
            }
            report += `\n`
          }
        })
        report += `\n`
      }
    })
  } else {
    report += `## Findings\n\n✅ No issues found!\n\n`
  }

  return report
}

function generateGitHubComment(data: AnalysisData): string {
  const { analysis } = data

  const riskEmoji = {
    critical: '🚨',
    high: '⚠️',
    medium: '⚡',
    low: '✅',
  }

  let comment = `## ${riskEmoji[analysis.summary.riskLevel]} Automated Code Review

**Risk Level:** ${analysis.summary.riskLevel.toUpperCase()}  
**Findings:** ${analysis.summary.totalFindings}  
**Recommendation:** ${analysis.summary.recommendation}

`

  if (analysis.findings.length > 0) {
    const critical = analysis.findings.filter((f) => f.severity === 'critical')
    const high = analysis.findings.filter((f) => f.severity === 'high')
    const medium = analysis.findings.filter((f) => f.severity === 'medium')

    if (critical.length > 0) {
      comment += `### 🔴 Critical Issues (${critical.length})\n`
      critical.slice(0, 3).forEach((f) => {
        comment += `- ${f.message}\n`
      })
      if (critical.length > 3) {
        comment += `- _(${critical.length - 3} more critical issues)_\n`
      }
      comment += `\n`
    }

    if (high.length > 0) {
      comment += `### 🟠 High Priority (${high.length})\n`
      high.slice(0, 3).forEach((f) => {
        comment += `- ${f.message}\n`
      })
      if (high.length > 3) {
        comment += `- _(${high.length - 3} more high priority issues)_\n`
      }
      comment += `\n`
    }

    if (medium.length > 0) {
      comment += `### 🟡 Medium Priority (${medium.length})\n`
      medium.slice(0, 2).forEach((f) => {
        comment += `- ${f.message}\n`
      })
      if (medium.length > 2) {
        comment += `- _(${medium.length - 2} more medium priority issues)_\n`
      }
      comment += `\n`
    }
  }

  comment += `---\n_Generated by @studio/code-review_`

  return comment
}

function generateJsonReport(data: AnalysisData): string {
  return JSON.stringify(data, null, 2)
}

async function main() {
  const { values } = parseArgs({
    options: {
      'analysis-file': { type: 'string' },
      format: { type: 'string', default: 'markdown' },
      output: { type: 'string' },
      'github-ready': { type: 'boolean', default: false },
      help: { type: 'boolean' },
    },
  }) as { values: CLIOptions }

  if (values.help) {
    // eslint-disable-next-line no-console
    console.log(`
Usage: npx tsx generate-report.ts --analysis-file <file> [options]

Generates a formatted code review report from analysis data.

Options:
  --analysis-file    Path to analysis JSON file (required)
  --format           Output format: markdown, json, github (default: markdown)
  --github-ready     Generate concise GitHub comment format
  --output           Output file (defaults to stdout)
  --help             Show this help message

Examples:
  npx tsx generate-report.ts --analysis-file analysis.json --format markdown
  npx tsx generate-report.ts --analysis-file analysis.json --github-ready --output comment.md
`)
    process.exit(0)
  }

  if (!values['analysis-file']) {
    console.error('Error: --analysis-file is required')
    console.error('Run with --help for usage information')
    process.exit(1)
  }

  try {
    // Load analysis data
    const analysisData: AnalysisData = JSON.parse(
      readFileSync(values['analysis-file'], 'utf-8'),
    )

    // Generate report based on format
    let report: string
    if (values['github-ready'] || values.format === 'github') {
      report = generateGitHubComment(analysisData)
    } else if (values.format === 'json') {
      report = generateJsonReport(analysisData)
    } else {
      report = generateMarkdownReport(analysisData)
    }

    // Output report
    if (values.output) {
      const fs = await import('node:fs')
      fs.writeFileSync(values.output, report)
      console.error(`Report written to ${values.output}`)
    } else {
      // eslint-disable-next-line no-console
      console.log(report)
    }
  } catch (error) {
    console.error('Error generating report:', error)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
