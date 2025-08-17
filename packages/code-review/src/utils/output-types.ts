/**
 * Type definitions for the Unified Output Management System
 *
 * Provides consistent types for all PR analysis output operations
 */

/**
 * Type of analysis being performed
 */
export type AnalysisType =
  | 'full' // Complete PR analysis
  | 'security' // Security-focused analysis
  | 'coderabbit' // CodeRabbit findings
  | 'github' // GitHub PR data fetch
  | 'expert' // Expert analysis
  | 'agent' // Agent-based analysis
  | 'unified' // Unified analysis

/**
 * Output format options
 */
export type OutputFormat = 'json' | 'markdown' | 'html' | 'all'

/**
 * Source of the analysis
 */
export type AnalysisSource =
  | 'cli'
  | 'agent'
  | 'github-action'
  | 'api'
  | 'manual'

/**
 * Configuration for output management
 */
export interface OutputConfig {
  // PR Information
  prNumber?: number
  repository?: string

  // Analysis Configuration
  analysisType: AnalysisType
  outputFormat?: OutputFormat
  source?: AnalysisSource

  // Output Options
  customPath?: string // For backwards compatibility with --output flag
  preserveExistingStructure?: boolean // If true, doesn't create timestamped folders

  // Features
  includeMetadata?: boolean
  includeSources?: boolean
  includeArtifacts?: boolean
  generateReadme?: boolean
  updateIndex?: boolean

  // Cleanup Configuration
  cleanup?: {
    enabled?: boolean
    maxAge?: number // Days to keep
    maxCount?: number // Maximum number of analyses to keep
    excludePatterns?: string[] // Patterns to exclude from cleanup
  }
}

/**
 * Analysis session metadata
 */
export interface SessionMetadata {
  sessionId: string
  prNumber?: number
  repository?: string
  analysisType: AnalysisType
  source: AnalysisSource
  startTime: string
  endTime?: string
  duration?: number
  toolVersion?: string
  gitCommit?: string
  environment?: 'development' | 'production' | 'ci'

  // Analysis results summary
  summary?: {
    riskLevel?: 'critical' | 'high' | 'medium' | 'low'
    totalFindings?: number
    recommendation?: string
    decision?:
      | 'approve'
      | 'conditional_approval'
      | 'request_changes'
      | 'security_block'
  }

  // Execution details
  execution?: {
    exitCode?: number
    errors?: string[]
    warnings?: string[]
  }
}

/**
 * Options for saving data
 */
export interface SaveOptions {
  type?: 'analysis' | 'source' | 'artifact' | 'log'
  filename?: string
  format?: OutputFormat
  prettify?: boolean
  overwrite?: boolean
}

/**
 * Entry in the output index
 */
export interface OutputEntry {
  path: string
  type: string
  format: OutputFormat
  size: number
  timestamp: string
  checksum?: string
}

/**
 * Analysis report generated at session finalization
 */
export interface AnalysisReport {
  sessionId: string
  folder: string
  metadata: SessionMetadata
  outputs: OutputEntry[]

  // Summary statistics
  stats: {
    totalFiles: number
    totalSize: number
    formats: OutputFormat[]
    hasErrors: boolean
  }

  // Quick access paths
  paths: {
    root: string
    metadata: string
    readme?: string
    mainAnalysis?: string
    sources?: string
    artifacts?: string
    logs?: string
  }
}

/**
 * Filter options for querying analysis history
 */
export interface AnalysisFilter {
  prNumber?: number
  repository?: string
  analysisType?: AnalysisType
  startDate?: Date
  endDate?: Date
  riskLevel?: 'critical' | 'high' | 'medium' | 'low'
  hasErrors?: boolean
  limit?: number
  offset?: number
}

/**
 * Entry in the master index
 */
export interface IndexEntry {
  sessionId: string
  timestamp: string
  prNumber?: number
  repository?: string
  analysisType: AnalysisType
  folder: string
  summary?: {
    riskLevel?: string
    totalFindings?: number
    recommendation?: string
  }
  size: number
  fileCount: number
}

/**
 * Master index structure
 */
export interface MasterIndex {
  version: string
  lastUpdated: string
  totalAnalyses: number
  analyses: IndexEntry[]

  // Statistics
  stats: {
    byType: Record<AnalysisType, number>
    byRepository: Record<string, number>
    byRiskLevel: Record<string, number>
    totalSize: number
  }
}

/**
 * Cleanup configuration
 */
export interface CleanupConfig {
  dryRun?: boolean
  maxAge?: number // Days
  maxCount?: number // Number to keep
  excludePatterns?: string[]
  verbose?: boolean
}

/**
 * Cleanup result
 */
export interface CleanupResult {
  removed: string[]
  kept: string[]
  freedSpace: number
  errors?: string[]
}

/**
 * Export format options
 */
export type ExportFormat = 'zip' | 'tar' | 'json'

/**
 * Error types for output operations
 */
export enum OutputError {
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  INVALID_PATH = 'INVALID_PATH',
  WRITE_FAILED = 'WRITE_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DISK_FULL = 'DISK_FULL',
  INVALID_FORMAT = 'INVALID_FORMAT',
}

/**
 * Output manager options
 */
export interface OutputManagerOptions {
  baseDir?: string // Default: .logs
  subDir?: string // Default: pr-reviews
  projectRoot?: string // Override project root detection
  enableIndex?: boolean // Default: true
  enableCleanup?: boolean // Default: true
  defaultFormat?: OutputFormat // Default: json
  timezone?: string // For timestamp formatting
}
