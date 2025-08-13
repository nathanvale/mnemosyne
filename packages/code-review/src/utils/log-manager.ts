/**
 * LogManager - Handles logging of PR analysis reports and sub-agent responses
 * Saves reports to .logs directory for debugging and audit purposes
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Log entry metadata
 */
interface LogMetadata {
  timestamp: string
  prNumber?: number
  repository?: string
  analysisId?: string
  source: 'claude-sub-agent' | 'coderabbit' | 'github' | 'expert-analysis'
  format: 'json' | 'markdown' | 'text'
}

/**
 * LogManager - Centralized logging for PR analysis reports
 */
export class LogManager {
  private static readonly LOG_BASE_DIR = '.logs'
  private static readonly PR_REVIEWS_DIR = 'pr-reviews'

  /**
   * Get the project root directory (where .logs should be created)
   */
  private static getProjectRoot(): string {
    // Go up from src/utils to packages/code-review, then to monorepo root
    const packageRoot = path.resolve(__dirname, '..', '..')
    const monorepoRoot = path.resolve(packageRoot, '..', '..')
    return monorepoRoot
  }

  /**
   * Ensure log directories exist
   */
  private static async ensureLogDirectories(): Promise<string> {
    const projectRoot = this.getProjectRoot()
    const logsDir = path.join(projectRoot, this.LOG_BASE_DIR)
    const prReviewsDir = path.join(logsDir, this.PR_REVIEWS_DIR)

    // Create directories if they don't exist
    await fs.mkdir(prReviewsDir, { recursive: true })

    return prReviewsDir
  }

  /**
   * Generate timestamped folder name
   */
  private static generateTimestampedFolder(prNumber?: number): string {
    const now = new Date()
    const timestamp = now
      .toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, -5)

    if (prNumber) {
      return `pr-${prNumber}_${timestamp}`
    }
    return `analysis_${timestamp}`
  }

  /**
   * Save PR analysis report
   */
  static async savePRAnalysisReport(
    content: string | object,
    metadata: LogMetadata,
  ): Promise<string> {
    try {
      const prReviewsDir = await this.ensureLogDirectories()
      const folderName = this.generateTimestampedFolder(metadata.prNumber)
      const reportDir = path.join(prReviewsDir, folderName)

      // Create report directory
      await fs.mkdir(reportDir, { recursive: true })

      // Save metadata
      const metadataPath = path.join(reportDir, 'metadata.json')
      await fs.writeFile(
        metadataPath,
        JSON.stringify(metadata, null, 2),
        'utf-8',
      )

      // Save content based on format
      let contentPath: string
      let contentToSave: string

      if (metadata.format === 'json') {
        contentPath = path.join(reportDir, 'report.json')
        contentToSave =
          typeof content === 'string'
            ? content
            : JSON.stringify(content, null, 2)
      } else if (metadata.format === 'markdown') {
        contentPath = path.join(reportDir, 'report.md')
        contentToSave =
          typeof content === 'string'
            ? content
            : JSON.stringify(content, null, 2)
      } else {
        contentPath = path.join(reportDir, 'report.txt')
        contentToSave =
          typeof content === 'string'
            ? content
            : JSON.stringify(content, null, 2)
      }

      await fs.writeFile(contentPath, contentToSave, 'utf-8')

      // Create README for easy navigation
      const readmePath = path.join(reportDir, 'README.md')
      const readmeContent = this.generateReadme(metadata, folderName)
      await fs.writeFile(readmePath, readmeContent, 'utf-8')

      console.warn(
        `📁 Report saved to: ${path.relative(this.getProjectRoot(), reportDir)}`,
      )
      return reportDir
    } catch (error) {
      console.error('Failed to save PR analysis report:', error)
      throw error
    }
  }

  /**
   * Save Claude sub-agent response
   */
  static async saveSubAgentResponse(
    response: string,
    prompt: string,
    metadata: Partial<LogMetadata> = {},
  ): Promise<string> {
    const fullMetadata: LogMetadata = {
      timestamp: new Date().toISOString(),
      source: 'claude-sub-agent',
      format: 'json',
      ...metadata,
    }

    try {
      const prReviewsDir = await this.ensureLogDirectories()
      const folderName = this.generateTimestampedFolder(fullMetadata.prNumber)
      const reportDir = path.join(prReviewsDir, folderName)

      // Create report directory
      await fs.mkdir(reportDir, { recursive: true })

      // Save the prompt that was sent
      const promptPath = path.join(reportDir, 'sub-agent-prompt.txt')
      await fs.writeFile(promptPath, prompt, 'utf-8')

      // Save the raw response
      const responsePath = path.join(reportDir, 'sub-agent-response.json')
      await fs.writeFile(responsePath, response, 'utf-8')

      // Try to parse and save formatted version
      try {
        const parsed = JSON.parse(response)
        const formattedPath = path.join(reportDir, 'sub-agent-formatted.json')
        await fs.writeFile(
          formattedPath,
          JSON.stringify(parsed, null, 2),
          'utf-8',
        )

        // Generate summary if findings exist
        if (parsed.findings && Array.isArray(parsed.findings)) {
          const summaryPath = path.join(reportDir, 'findings-summary.md')
          const summary = this.generateFindingsSummary(parsed.findings)
          await fs.writeFile(summaryPath, summary, 'utf-8')
        }
      } catch {
        console.warn('Could not parse sub-agent response as JSON')
      }

      // Save metadata
      const metadataPath = path.join(reportDir, 'metadata.json')
      await fs.writeFile(
        metadataPath,
        JSON.stringify(fullMetadata, null, 2),
        'utf-8',
      )

      console.warn(
        `🤖 Sub-agent response saved to: ${path.relative(this.getProjectRoot(), reportDir)}`,
      )
      return reportDir
    } catch (error) {
      console.error('Failed to save sub-agent response:', error)
      throw error
    }
  }

  /**
   * List all saved reports
   */
  static async listReports(): Promise<string[]> {
    try {
      const prReviewsDir = await this.ensureLogDirectories()
      const entries = await fs.readdir(prReviewsDir, { withFileTypes: true })

      const reports = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort()
        .reverse() // Most recent first

      return reports
    } catch (error) {
      console.error('Failed to list reports:', error)
      return []
    }
  }

  /**
   * Clean up old reports (keep last N reports)
   */
  static async cleanupOldReports(keepCount: number = 50): Promise<number> {
    try {
      const reports = await this.listReports()

      if (reports.length <= keepCount) {
        return 0
      }

      const prReviewsDir = await this.ensureLogDirectories()
      const toDelete = reports.slice(keepCount)

      for (const report of toDelete) {
        const reportPath = path.join(prReviewsDir, report)
        await fs.rm(reportPath, { recursive: true, force: true })
      }

      console.warn(`🧹 Cleaned up ${toDelete.length} old reports`)
      return toDelete.length
    } catch (error) {
      console.error('Failed to cleanup old reports:', error)
      return 0
    }
  }

  /**
   * Generate README content for a report
   */
  private static generateReadme(
    metadata: LogMetadata,
    folderName: string,
  ): string {
    return `# PR Analysis Report

## Metadata
- **Timestamp**: ${metadata.timestamp}
- **PR Number**: ${metadata.prNumber || 'N/A'}
- **Repository**: ${metadata.repository || 'N/A'}
- **Analysis ID**: ${metadata.analysisId || 'N/A'}
- **Source**: ${metadata.source}
- **Format**: ${metadata.format}

## Files in this Report
- \`metadata.json\` - Report metadata
- \`report.${metadata.format === 'json' ? 'json' : metadata.format === 'markdown' ? 'md' : 'txt'}\` - Main report content
${
  metadata.source === 'claude-sub-agent'
    ? `- \`sub-agent-prompt.txt\` - Prompt sent to Claude sub-agent
- \`sub-agent-response.json\` - Raw response from Claude
- \`sub-agent-formatted.json\` - Formatted response (if parseable)
- \`findings-summary.md\` - Summary of findings (if available)`
    : ''
}

## Report Location
\`${folderName}\`

## View Report
Open the report file above to view the full analysis results.
`
  }

  /**
   * Generate findings summary markdown
   */
  private static generateFindingsSummary(
    findings: Array<{
      severity: string
      title?: string
      location?: { file?: string; line?: number }
    }>,
  ): string {
    const critical = findings.filter((f) => f.severity === 'critical')
    const high = findings.filter((f) => f.severity === 'high')
    const medium = findings.filter((f) => f.severity === 'medium')
    const low = findings.filter((f) => f.severity === 'low')

    let summary = `# 🔍 Security Findings Summary

## 📊 Statistics

| Severity | Count | Status |
|----------|-------|--------|
| **Critical** | ${critical.length} | ${critical.length > 0 ? '🔴 Action Required' : '✅ None'} |
| **High** | ${high.length} | ${high.length > 0 ? '🟠 Review Needed' : '✅ None'} |
| **Medium** | ${medium.length} | ${medium.length > 0 ? '🟡 Consider' : '✅ None'} |
| **Low** | ${low.length} | ${low.length > 0 ? '🔵 Info' : '✅ None'} |
| **Total** | ${findings.length} | ${findings.length > 0 ? '⚠️ Issues Found' : '✅ Clean'} |

---

## 🛡️ Findings by Severity
`

    if (critical.length > 0) {
      summary += '\n### 🔴 Critical Issues (Must Fix Before Merge)\n\n'
      critical.forEach((f) => {
        summary += `#### ${f.title || 'Untitled Finding'}\n`
        summary += `- **Location:** \`${f.location?.file || 'unknown'}:${f.location?.line || '?'}\`\n`
        summary += `- **Action Required:** Immediate fix needed\n\n`
      })
    }

    if (high.length > 0) {
      summary += '\n### 🟠 High Priority Issues\n\n'
      high.forEach((f) => {
        summary += `#### ${f.title || 'Untitled Finding'}\n`
        summary += `- **Location:** \`${f.location?.file || 'unknown'}:${f.location?.line || '?'}\`\n`
        summary += `- **Action Required:** Should be addressed\n\n`
      })
    }

    if (medium.length > 0) {
      summary += '\n### 🟡 Medium Priority Issues\n\n'
      medium.forEach((f) => {
        summary += `#### ${f.title || 'Untitled Finding'}\n`
        summary += `- **Location:** \`${f.location?.file || 'unknown'}:${f.location?.line || '?'}\`\n`
        summary += `- **Action:** Consider fixing\n\n`
      })
    }

    if (low.length > 0) {
      summary += '\n### 🔵 Low Priority / Informational\n\n'
      low.forEach((f) => {
        summary += `#### ${f.title || 'Untitled Finding'}\n`
        summary += `- **Location:** \`${f.location?.file || 'unknown'}:${f.location?.line || '?'}\`\n`
        summary += `- **Note:** Minor issue or best practice suggestion\n\n`
      })
    }

    if (findings.length === 0) {
      summary +=
        '\n✅ **No security findings detected** - Code appears to be secure!\n'
    }

    summary += '\n---\n\n*Generated by Security Analysis Engine*\n'

    return summary
  }
}
