/**
 * SimplifiedLogManager - Lightweight logging for PR analysis
 *
 * Saves only essential audit data in a single, compact JSON file.
 * Includes automatic cleanup of old logs (30 days or last 100 analyses).
 */

import { existsSync, readFileSync } from 'fs'
import * as fs from 'fs/promises'
import * as path from 'path'

/**
 * Analysis result structure
 */
interface AnalysisResult {
  analysisId?: string
  riskLevel?: 'critical' | 'high' | 'medium' | 'low'
  decision?:
    | 'approve'
    | 'conditional_approval'
    | 'request_changes'
    | 'security_block'
  findingSummary?: {
    critical: number
    high: number
    medium: number
    low: number
    total: number
  }
  detailedFindings?: {
    critical?: Array<{
      title?: string
      description?: string
      severity?: string
      file?: string
      location?: { file?: string }
    }>
    high?: Array<{
      title?: string
      description?: string
      severity?: string
      file?: string
      location?: { file?: string }
    }>
  }
  executionTime?: number
  source?: string
}

/**
 * Essential log data only
 */
interface SimplifiedLogEntry {
  timestamp: string
  prNumber: number
  repository: string
  analysisId: string
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  recommendation:
    | 'approve'
    | 'conditional_approval'
    | 'request_changes'
    | 'security_block'
  findingSummary: {
    critical: number
    high: number
    medium: number
    low: number
    total: number
  }
  topIssues: Array<{
    title: string
    severity: string
    file?: string
  }>
  executionTime?: number
  source: string
}

export class SimplifiedLogManager {
  private static readonly LOG_BASE_DIR = '.logs'
  private static readonly PR_REVIEWS_DIR = 'pr-reviews'
  private static readonly MAX_LOG_SIZE_KB = 10
  private static readonly MAX_LOGS_TO_KEEP = 100
  private static readonly MAX_AGE_DAYS = 30

  /**
   * Get the project root directory
   */
  private static getProjectRoot(): string {
    let currentDir = process.cwd()

    while (currentDir !== path.dirname(currentDir)) {
      const packageJsonPath = path.join(currentDir, 'package.json')

      if (existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
          if (packageJson.name === 'mnemosyne') {
            return currentDir
          }
        } catch {
          // Continue searching
        }
      }

      currentDir = path.dirname(currentDir)
    }

    // Fallback to current working directory
    return process.cwd()
  }

  /**
   * Save simplified analysis log
   */
  static async saveAnalysisLog(
    logEntry: SimplifiedLogEntry,
  ): Promise<string | null> {
    try {
      const projectRoot = this.getProjectRoot()
      const logsDir = path.join(
        projectRoot,
        this.LOG_BASE_DIR,
        this.PR_REVIEWS_DIR,
      )

      // Create directory if it doesn't exist
      await fs.mkdir(logsDir, { recursive: true })

      // Generate simple filename
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19)
      const filename = `pr-${logEntry.prNumber}_${timestamp}.json`
      const filepath = path.join(logsDir, filename)

      // Ensure log entry is compact (max 10KB)
      const compactEntry = this.createCompactEntry(logEntry)
      const content = JSON.stringify(compactEntry, null, 2)

      // Check size limit
      const sizeKB = Buffer.byteLength(content, 'utf-8') / 1024
      if (sizeKB > this.MAX_LOG_SIZE_KB) {
        // Truncate top issues if too large
        compactEntry.topIssues = compactEntry.topIssues.slice(0, 3)
        const truncatedContent = JSON.stringify(compactEntry, null, 2)
        await fs.writeFile(filepath, truncatedContent, 'utf-8')
      } else {
        await fs.writeFile(filepath, content, 'utf-8')
      }

      // Clean up old logs
      await this.cleanupOldLogs(logsDir)

      return filepath
    } catch {
      // Logging is non-critical - fail silently
      return null
    }
  }

  /**
   * Create compact log entry
   */
  private static createCompactEntry(
    entry: SimplifiedLogEntry,
  ): SimplifiedLogEntry {
    // Keep only top 5 issues
    return {
      ...entry,
      topIssues: entry.topIssues.slice(0, 5).map((issue) => ({
        title: issue.title.slice(0, 100), // Limit title length
        severity: issue.severity,
        file: issue.file?.slice(0, 50), // Limit file path length
      })),
    }
  }

  /**
   * Clean up old logs based on age and count
   */
  private static async cleanupOldLogs(logsDir: string): Promise<void> {
    try {
      const files = await fs.readdir(logsDir)
      const now = Date.now()
      const maxAgeMs = this.MAX_AGE_DAYS * 24 * 60 * 60 * 1000

      // Get file stats
      const fileStats = await Promise.all(
        files.map(async (file) => {
          const filepath = path.join(logsDir, file)
          const stats = await fs.stat(filepath)
          return { file, filepath, mtime: stats.mtime.getTime() }
        }),
      )

      // Sort by modification time (newest first)
      fileStats.sort((a, b) => b.mtime - a.mtime)

      // Delete old files (by age or count)
      const filesToDelete = fileStats.filter((stat, index) => {
        const isOld = now - stat.mtime > maxAgeMs
        const exceedsCount = index >= this.MAX_LOGS_TO_KEEP
        return isOld || exceedsCount
      })

      await Promise.all(
        filesToDelete.map((stat) => fs.unlink(stat.filepath).catch(() => {})),
      )

      // Silently cleaned up old files
    } catch {
      // Cleanup is non-critical - fail silently
    }
  }

  /**
   * Create log entry from analysis result
   */
  static createLogEntry(
    prNumber: number,
    repository: string,
    analysisResult: AnalysisResult,
  ): SimplifiedLogEntry {
    // Extract essential data from analysis result
    const findingSummary = analysisResult.findingSummary || {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
    }

    // Extract top issues (max 5)
    const topIssues = []
    if (analysisResult.detailedFindings) {
      const { critical = [], high = [] } = analysisResult.detailedFindings
      const allIssues = [...critical, ...high].slice(0, 5)
      topIssues.push(
        ...allIssues.map((issue) => ({
          title: issue.title || issue.description || 'Unknown issue',
          severity: issue.severity || 'unknown',
          file: issue.file || issue.location?.file,
        })),
      )
    }

    return {
      timestamp: new Date().toISOString(),
      prNumber,
      repository,
      analysisId: analysisResult.analysisId || `analysis-${Date.now()}`,
      riskLevel: analysisResult.riskLevel || 'low',
      recommendation: analysisResult.decision || 'conditional_approval',
      findingSummary,
      topIssues,
      executionTime: analysisResult.executionTime,
      source: analysisResult.source || 'code-review',
    }
  }
}
