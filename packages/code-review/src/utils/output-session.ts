/**
 * Analysis Session Management
 *
 * Handles individual analysis sessions with automatic folder creation
 * and output tracking
 */

import { createHash } from 'crypto'
import { existsSync } from 'fs'
import * as fs from 'fs/promises'
import * as path from 'path'

import type {
  AnalysisReport,
  OutputEntry,
  OutputFormat,
  SaveOptions,
  SessionMetadata,
} from './output-types'

/**
 * Represents an active analysis session
 */
export class AnalysisSession {
  readonly id: string
  readonly folder: string
  readonly startTime: Date
  private outputs: Map<string, OutputEntry> = new Map()
  private metadata: SessionMetadata
  private finalized = false

  constructor(id: string, folder: string, metadata: SessionMetadata) {
    this.id = id
    this.folder = folder
    this.startTime = new Date(metadata.startTime)
    this.metadata = metadata
  }

  /**
   * Save data to the session
   */
  async save(data: unknown, options: SaveOptions = {}): Promise<string> {
    if (this.finalized) {
      throw new Error('Cannot save to finalized session')
    }

    const {
      type = 'analysis',
      filename,
      format = 'json',
      prettify = true,
      overwrite = true,
    } = options

    // Determine subdirectory based on type
    const subDir = this.getSubDirectory(type)
    const targetDir = path.join(this.folder, subDir)

    // Ensure directory exists
    await fs.mkdir(targetDir, { recursive: true })

    // Generate filename if not provided
    const fileName = filename || this.generateFilename(type, format)
    const filePath = path.join(targetDir, fileName)

    // Check if file exists and overwrite is false
    if (!overwrite && existsSync(filePath)) {
      throw new Error(`File already exists: ${filePath}`)
    }

    // Format data based on type
    let content: string
    if (format === 'json') {
      content = prettify ? JSON.stringify(data, null, 2) : JSON.stringify(data)
    } else if (format === 'markdown' || format === 'html') {
      content = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    } else {
      content = String(data)
    }

    // Write file
    await fs.writeFile(filePath, content, 'utf-8')

    // Track output
    const stats = await fs.stat(filePath)
    const entry: OutputEntry = {
      path: path.relative(this.folder, filePath),
      type,
      format,
      size: stats.size,
      timestamp: new Date().toISOString(),
      checksum: this.generateChecksum(content),
    }

    this.outputs.set(fileName, entry)

    return filePath
  }

  /**
   * Save analysis result (main output)
   */
  async saveAnalysis(
    data: unknown,
    format: OutputFormat = 'json',
  ): Promise<string> {
    return this.save(data, {
      type: 'analysis',
      filename: `main.${format === 'markdown' ? 'md' : format}`,
      format,
      prettify: true,
    })
  }

  /**
   * Save source data (GitHub, CodeRabbit, etc.)
   */
  async saveSource(data: unknown, sourceName: string): Promise<string> {
    return this.save(data, {
      type: 'source',
      filename: `${sourceName}.json`,
      format: 'json',
      prettify: true,
    })
  }

  /**
   * Save generated artifact (summary, report, etc.)
   */
  async saveArtifact(
    data: unknown,
    artifactName: string,
    format: OutputFormat = 'json',
  ): Promise<string> {
    const extension = format === 'markdown' ? 'md' : format
    return this.save(data, {
      type: 'artifact',
      filename: `${artifactName}.${extension}`,
      format,
      prettify: true,
    })
  }

  /**
   * Save log data
   */
  async saveLog(
    content: string,
    logName: string = 'execution',
  ): Promise<string> {
    return this.save(content, {
      type: 'log',
      filename: `${logName}.log`,
      format: 'json',
      prettify: false,
    })
  }

  /**
   * Add or update metadata
   */
  async addMetadata(key: string, value: unknown): Promise<void> {
    if (this.finalized) {
      throw new Error('Cannot update metadata of finalized session')
    }

    // Update metadata object using type assertion through unknown
    const metadataRecord = this.metadata as unknown as Record<string, unknown>
    metadataRecord[key] = value

    // Save updated metadata
    const metadataPath = path.join(this.folder, 'metadata.json')
    await fs.writeFile(
      metadataPath,
      JSON.stringify(this.metadata, null, 2),
      'utf-8',
    )
  }

  /**
   * Update summary information
   */
  async updateSummary(summary: SessionMetadata['summary']): Promise<void> {
    this.metadata.summary = { ...this.metadata.summary, ...summary }
    await this.addMetadata('summary', this.metadata.summary)
  }

  /**
   * Finalize the session
   */
  async finalize(): Promise<AnalysisReport> {
    if (this.finalized) {
      throw new Error('Session already finalized')
    }

    // Update end time and duration
    const endTime = new Date()
    this.metadata.endTime = endTime.toISOString()
    this.metadata.duration = endTime.getTime() - this.startTime.getTime()

    // Save final metadata
    await this.addMetadata('endTime', this.metadata.endTime)
    await this.addMetadata('duration', this.metadata.duration)

    // Generate README if it doesn't exist
    const readmePath = path.join(this.folder, 'README.md')
    if (!existsSync(readmePath)) {
      await this.generateReadme()
    }

    this.finalized = true

    // Create analysis report
    const report: AnalysisReport = {
      sessionId: this.id,
      folder: this.folder,
      metadata: this.metadata,
      outputs: Array.from(this.outputs.values()),
      stats: {
        totalFiles: this.outputs.size,
        totalSize: Array.from(this.outputs.values()).reduce(
          (sum, e) => sum + e.size,
          0,
        ),
        formats: [
          ...new Set(Array.from(this.outputs.values()).map((e) => e.format)),
        ],
        hasErrors: (this.metadata.execution?.errors?.length ?? 0) > 0,
      },
      paths: {
        root: this.folder,
        metadata: path.join(this.folder, 'metadata.json'),
        readme: readmePath,
        mainAnalysis: path.join(this.folder, 'analysis'),
        sources: path.join(this.folder, 'sources'),
        artifacts: path.join(this.folder, 'artifacts'),
        logs: path.join(this.folder, 'logs'),
      },
    }

    return report
  }

  /**
   * Get subdirectory for output type
   */
  private getSubDirectory(type: string): string {
    switch (type) {
      case 'analysis':
        return 'analysis'
      case 'source':
        return 'sources'
      case 'artifact':
        return 'artifacts'
      case 'log':
        return 'logs'
      default:
        return ''
    }
  }

  /**
   * Generate default filename
   */
  private generateFilename(type: string, format: OutputFormat): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5)
    const extension = format === 'markdown' ? 'md' : format
    return `${type}-${timestamp}.${extension}`
  }

  /**
   * Generate checksum for content
   */
  private generateChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex').slice(0, 8)
  }

  /**
   * Generate README.md for the session
   */
  private async generateReadme(): Promise<void> {
    const readme = `# PR Analysis Report

## Session Information
- **Session ID**: ${this.id}
- **PR Number**: ${this.metadata.prNumber || 'N/A'}
- **Repository**: ${this.metadata.repository || 'N/A'}
- **Analysis Type**: ${this.metadata.analysisType}
- **Start Time**: ${this.metadata.startTime}
- **End Time**: ${this.metadata.endTime || 'In Progress'}
- **Duration**: ${this.metadata.duration ? `${Math.round(this.metadata.duration / 1000)}s` : 'N/A'}

## Analysis Summary
${
  this.metadata.summary
    ? `
- **Risk Level**: ${this.metadata.summary.riskLevel || 'N/A'}
- **Total Findings**: ${this.metadata.summary.totalFindings || 0}
- **Recommendation**: ${this.metadata.summary.recommendation || 'N/A'}
- **Decision**: ${this.metadata.summary.decision || 'N/A'}
`
    : 'No summary available yet.'
}

## Files in this Report

### Analysis Results
- \`analysis/\` - Main analysis outputs

### Source Data
- \`sources/\` - Raw data from GitHub, CodeRabbit, etc.

### Generated Artifacts
- \`artifacts/\` - Summaries, reports, and processed data

### Execution Logs
- \`logs/\` - Tool execution and error logs

## Metadata
See \`metadata.json\` for complete session metadata.

---
*Generated by Unified Output Manager*
`

    await fs.writeFile(path.join(this.folder, 'README.md'), readme, 'utf-8')
  }
}
