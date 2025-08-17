/**
 * Unified Output Manager
 *
 * Centralized management for all PR analysis output operations.
 * Provides consistent folder structure, metadata tracking, and cleanup.
 */

import { randomUUID } from 'crypto'
import { existsSync, readFileSync } from 'fs'
import * as fs from 'fs/promises'
import * as path from 'path'

import type {
  AnalysisFilter,
  AnalysisReport,
  AnalysisType,
  CleanupConfig,
  CleanupResult,
  IndexEntry,
  MasterIndex,
  OutputConfig,
  OutputManagerOptions,
  SessionMetadata,
} from './output-types'

import { AnalysisSession } from './output-session'

/**
 * Unified manager for all PR analysis outputs
 */
export class UnifiedOutputManager {
  private readonly baseDir: string
  private readonly subDir: string
  private readonly projectRoot: string
  private readonly enableIndex: boolean
  private readonly enableCleanup: boolean
  private sessions: Map<string, AnalysisSession> = new Map()

  constructor(options: OutputManagerOptions = {}) {
    const {
      baseDir = '.logs',
      subDir = 'pr-reviews',
      projectRoot,
      enableIndex = true,
      enableCleanup = true,
    } = options

    this.baseDir = baseDir
    this.subDir = subDir
    this.projectRoot = projectRoot || this.findProjectRoot()
    this.enableIndex = enableIndex
    this.enableCleanup = enableCleanup
  }

  /**
   * Create a new analysis session
   */
  async createAnalysisSession(config: OutputConfig): Promise<AnalysisSession> {
    // Generate session ID
    const sessionId = this.generateSessionId()

    // Create timestamped folder name
    const folderName = this.generateFolderName(config.prNumber)
    const folderPath = path.join(
      this.projectRoot,
      this.baseDir,
      this.subDir,
      folderName,
    )

    // Ensure directories exist
    await fs.mkdir(folderPath, { recursive: true })

    // Create metadata
    const metadata: SessionMetadata = {
      sessionId,
      prNumber: config.prNumber,
      repository: config.repository,
      analysisType: config.analysisType,
      source: config.source || 'cli',
      startTime: new Date().toISOString(),
      environment: this.getEnvironment(),
    }

    // Save initial metadata
    const metadataPath = path.join(folderPath, 'metadata.json')
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8')

    // Create session
    const session = new AnalysisSession(sessionId, folderPath, metadata)
    this.sessions.set(sessionId, session)

    // Update index if enabled
    if (this.enableIndex) {
      await this.updateIndex(session, folderName)
    }

    // Run cleanup if enabled
    if (this.enableCleanup && config.cleanup?.enabled !== false) {
      await this.runCleanup(config.cleanup)
    }

    return session
  }

  /**
   * Get an existing session
   */
  getSession(sessionId: string): AnalysisSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Finalize a session
   */
  async finalizeSession(sessionId: string): Promise<AnalysisReport> {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`)
    }

    const report = await session.finalize()

    // Update index with final information
    if (this.enableIndex) {
      await this.updateIndexAfterFinalization(report)
    }

    // Remove from active sessions
    this.sessions.delete(sessionId)

    return report
  }

  /**
   * Get analysis history
   */
  async getAnalysisHistory(filter?: AnalysisFilter): Promise<IndexEntry[]> {
    const indexPath = path.join(
      this.projectRoot,
      this.baseDir,
      this.subDir,
      'index.json',
    )

    if (!existsSync(indexPath)) {
      return []
    }

    const index: MasterIndex = JSON.parse(readFileSync(indexPath, 'utf-8'))

    let analyses = [...index.analyses]

    // Apply filters
    if (filter) {
      if (filter.prNumber !== undefined) {
        analyses = analyses.filter((a) => a.prNumber === filter.prNumber)
      }
      if (filter.repository) {
        analyses = analyses.filter((a) => a.repository === filter.repository)
      }
      if (filter.analysisType) {
        analyses = analyses.filter(
          (a) => a.analysisType === filter.analysisType,
        )
      }
      if (filter.riskLevel) {
        analyses = analyses.filter(
          (a) => a.summary?.riskLevel === filter.riskLevel,
        )
      }
      if (filter.startDate) {
        analyses = analyses.filter(
          (a) => new Date(a.timestamp) >= filter.startDate!,
        )
      }
      if (filter.endDate) {
        analyses = analyses.filter(
          (a) => new Date(a.timestamp) <= filter.endDate!,
        )
      }
    }

    // Apply pagination
    if (filter?.offset) {
      analyses = analyses.slice(filter.offset)
    }
    if (filter?.limit) {
      analyses = analyses.slice(0, filter.limit)
    }

    return analyses
  }

  /**
   * Clean up old analyses
   */
  async cleanupOldAnalyses(config?: CleanupConfig): Promise<CleanupResult> {
    const {
      dryRun = false,
      maxAge = 30,
      maxCount = 100,
      excludePatterns = [],
      verbose = false,
    } = config || {}

    const reviewsDir = path.join(this.projectRoot, this.baseDir, this.subDir)
    const entries = await fs.readdir(reviewsDir, { withFileTypes: true })

    // Get all analysis folders
    const folders = entries
      .filter(
        (entry) =>
          entry.isDirectory() && entry.name !== '.' && entry.name !== '..',
      )
      .map((entry) => ({
        name: entry.name,
        path: path.join(reviewsDir, entry.name),
      }))

    // Get folder stats and sort by creation time
    const folderStats = await Promise.all(
      folders.map(async (folder) => {
        const stats = await fs.stat(folder.path)
        return {
          ...folder,
          created: stats.birthtime,
          size: await this.getFolderSize(folder.path),
        }
      }),
    )

    folderStats.sort((a, b) => b.created.getTime() - a.created.getTime())

    const removed: string[] = []
    const kept: string[] = []
    let freedSpace = 0

    const now = new Date()
    const maxAgeMs = maxAge * 24 * 60 * 60 * 1000

    for (let i = 0; i < folderStats.length; i++) {
      const folder = folderStats[i]
      const age = now.getTime() - folder.created.getTime()

      // Check if folder should be excluded
      const shouldExclude = excludePatterns.some((pattern) =>
        folder.name.includes(pattern),
      )

      if (shouldExclude) {
        kept.push(folder.name)
        continue
      }

      // Remove if too old or beyond max count
      if (age > maxAgeMs || i >= maxCount) {
        if (!dryRun) {
          await fs.rm(folder.path, { recursive: true, force: true })
          if (verbose) {
            console.warn(
              `Removed: ${folder.name} (age: ${Math.round(age / 86400000)} days)`,
            )
          }
        }
        removed.push(folder.name)
        freedSpace += folder.size
      } else {
        kept.push(folder.name)
      }
    }

    // Update index after cleanup
    if (!dryRun && this.enableIndex) {
      await this.rebuildIndex()
    }

    return {
      removed,
      kept,
      freedSpace,
    }
  }

  /**
   * Run automatic cleanup
   */
  private async runCleanup(config?: OutputConfig['cleanup']): Promise<void> {
    if (!config || config.enabled === false) {
      return
    }

    try {
      await this.cleanupOldAnalyses({
        maxAge: config.maxAge,
        maxCount: config.maxCount,
        excludePatterns: config.excludePatterns,
        verbose: false,
      })
    } catch (error) {
      console.warn('Cleanup failed:', error)
    }
  }

  /**
   * Find project root directory
   */
  private findProjectRoot(): string {
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
   * Generate session ID
   */
  private generateSessionId(): string {
    return randomUUID()
  }

  /**
   * Generate folder name
   */
  private generateFolderName(prNumber?: number): string {
    const now = new Date()
    const timestamp = now
      .toISOString()
      .replace(/[:.]/g, '')
      .replace('T', '_')
      .slice(0, -5)

    if (prNumber) {
      return `pr-${prNumber}_${timestamp}`
    }

    return `analysis_${timestamp}`
  }

  /**
   * Get environment
   */
  private getEnvironment(): 'development' | 'production' | 'ci' {
    if (process.env.CI) return 'ci'
    if (process.env.NODE_ENV === 'production') return 'production'
    return 'development'
  }

  /**
   * Update master index
   */
  private async updateIndex(
    session: AnalysisSession,
    folderName: string,
  ): Promise<void> {
    const indexPath = path.join(
      this.projectRoot,
      this.baseDir,
      this.subDir,
      'index.json',
    )

    let index: MasterIndex

    if (existsSync(indexPath)) {
      index = JSON.parse(readFileSync(indexPath, 'utf-8'))
    } else {
      index = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        totalAnalyses: 0,
        analyses: [],
        stats: {
          byType: {} as Record<AnalysisType, number>,
          byRepository: {},
          byRiskLevel: {},
          totalSize: 0,
        },
      }
    }

    // Add new entry
    // Access metadata through the session's private field
    const sessionWithMetadata = session as unknown as {
      metadata: SessionMetadata
    }
    const entry: IndexEntry = {
      sessionId: session.id,
      timestamp: new Date().toISOString(),
      prNumber: sessionWithMetadata.metadata?.prNumber,
      repository: sessionWithMetadata.metadata?.repository,
      analysisType: sessionWithMetadata.metadata?.analysisType || 'full',
      folder: folderName,
      size: 0,
      fileCount: 0,
    }

    index.analyses.unshift(entry)
    index.totalAnalyses++
    index.lastUpdated = new Date().toISOString()

    // Update stats
    const analysisType = entry.analysisType
    index.stats.byType[analysisType] =
      (index.stats.byType[analysisType] || 0) + 1

    if (entry.repository) {
      index.stats.byRepository[entry.repository] =
        (index.stats.byRepository[entry.repository] || 0) + 1
    }

    // Save index
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8')
  }

  /**
   * Update index after session finalization
   */
  private async updateIndexAfterFinalization(
    report: AnalysisReport,
  ): Promise<void> {
    const indexPath = path.join(
      this.projectRoot,
      this.baseDir,
      this.subDir,
      'index.json',
    )

    if (!existsSync(indexPath)) {
      return
    }

    const index: MasterIndex = JSON.parse(readFileSync(indexPath, 'utf-8'))

    // Find and update the entry
    const entry = index.analyses.find((a) => a.sessionId === report.sessionId)
    if (entry) {
      entry.summary = report.metadata.summary
      entry.size = report.stats.totalSize
      entry.fileCount = report.stats.totalFiles

      // Update risk level stats
      if (report.metadata.summary?.riskLevel) {
        const riskLevel = report.metadata.summary.riskLevel
        index.stats.byRiskLevel[riskLevel] =
          (index.stats.byRiskLevel[riskLevel] || 0) + 1
      }

      index.stats.totalSize += report.stats.totalSize
      index.lastUpdated = new Date().toISOString()

      // Save updated index
      await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8')
    }
  }

  /**
   * Rebuild index from scratch
   */
  private async rebuildIndex(): Promise<void> {
    const reviewsDir = path.join(this.projectRoot, this.baseDir, this.subDir)
    const entries = await fs.readdir(reviewsDir, { withFileTypes: true })

    const index: MasterIndex = {
      version: '1.0.0',
      lastUpdated: new Date().toISOString(),
      totalAnalyses: 0,
      analyses: [],
      stats: {
        byType: {} as Record<AnalysisType, number>,
        byRepository: {},
        byRiskLevel: {},
        totalSize: 0,
      },
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === '.' || entry.name === '..') {
        continue
      }

      const metadataPath = path.join(reviewsDir, entry.name, 'metadata.json')
      if (existsSync(metadataPath)) {
        try {
          const metadata: SessionMetadata = JSON.parse(
            readFileSync(metadataPath, 'utf-8'),
          )

          const folderSize = await this.getFolderSize(
            path.join(reviewsDir, entry.name),
          )

          const indexEntry: IndexEntry = {
            sessionId: metadata.sessionId,
            timestamp: metadata.startTime,
            prNumber: metadata.prNumber,
            repository: metadata.repository,
            analysisType: metadata.analysisType,
            folder: entry.name,
            summary: metadata.summary,
            size: folderSize,
            fileCount: await this.countFiles(path.join(reviewsDir, entry.name)),
          }

          index.analyses.push(indexEntry)
          index.totalAnalyses++

          // Update stats
          index.stats.byType[metadata.analysisType] =
            (index.stats.byType[metadata.analysisType] || 0) + 1

          if (metadata.repository) {
            index.stats.byRepository[metadata.repository] =
              (index.stats.byRepository[metadata.repository] || 0) + 1
          }

          if (metadata.summary?.riskLevel) {
            index.stats.byRiskLevel[metadata.summary.riskLevel] =
              (index.stats.byRiskLevel[metadata.summary.riskLevel] || 0) + 1
          }

          index.stats.totalSize += folderSize
        } catch (error) {
          console.warn(`Failed to process ${entry.name}:`, error)
        }
      }
    }

    // Sort by timestamp
    index.analyses.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )

    // Save index
    const indexPath = path.join(reviewsDir, 'index.json')
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8')
  }

  /**
   * Get folder size recursively
   */
  private async getFolderSize(folderPath: string): Promise<number> {
    let size = 0

    try {
      const entries = await fs.readdir(folderPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(folderPath, entry.name)

        if (entry.isDirectory()) {
          size += await this.getFolderSize(fullPath)
        } else {
          const stats = await fs.stat(fullPath)
          size += stats.size
        }
      }
    } catch (error) {
      console.warn(`Failed to get size of ${folderPath}:`, error)
    }

    return size
  }

  /**
   * Count files in folder recursively
   */
  private async countFiles(folderPath: string): Promise<number> {
    let count = 0

    try {
      const entries = await fs.readdir(folderPath, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.isDirectory()) {
          count += await this.countFiles(path.join(folderPath, entry.name))
        } else {
          count++
        }
      }
    } catch (error) {
      console.warn(`Failed to count files in ${folderPath}:`, error)
    }

    return count
  }
}
