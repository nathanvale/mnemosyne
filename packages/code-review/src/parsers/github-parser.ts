import {
  GitHubPRContext,
  GitHubPullRequest,
  GitHubFileChange,
  GitHubCommit,
  GitHubCheckRun,
  GitHubSecurityAlert,
} from '../types/github.js'

/**
 * Parser for GitHub API responses and webhook data
 */
export class GitHubParser {
  /**
   * Parse complete GitHub PR context with Zod validation
   */
  static parsePRContext(rawData: unknown): GitHubPRContext | null {
    const result = GitHubPRContext.safeParse(rawData)
    return result.success ? result.data : null
  }

  /**
   * Parse GitHub pull request with Zod validation
   */
  static parsePullRequest(rawData: unknown): GitHubPullRequest | null {
    const result = GitHubPullRequest.safeParse(rawData)
    return result.success ? result.data : null
  }

  /**
   * Parse GitHub file changes with Zod validation
   */
  static parseFileChanges(rawData: unknown): GitHubFileChange[] {
    if (!Array.isArray(rawData)) {
      return []
    }

    return rawData
      .map((item) => {
        const result = GitHubFileChange.safeParse(item)
        return result.success ? result.data : null
      })
      .filter((item): item is GitHubFileChange => item !== null)
  }

  /**
   * Parse GitHub commits with Zod validation
   */
  static parseCommits(rawData: unknown): GitHubCommit[] {
    if (!Array.isArray(rawData)) {
      return []
    }

    return rawData
      .map((item) => {
        const result = GitHubCommit.safeParse(item)
        return result.success ? result.data : null
      })
      .filter((item): item is GitHubCommit => item !== null)
  }

  /**
   * Parse GitHub check runs with Zod validation
   */
  static parseCheckRuns(rawData: unknown): GitHubCheckRun[] {
    if (!Array.isArray(rawData)) {
      return []
    }

    return rawData
      .map((item) => {
        const result = GitHubCheckRun.safeParse(item)
        return result.success ? result.data : null
      })
      .filter((item): item is GitHubCheckRun => item !== null)
  }

  /**
   * Parse GitHub security alerts with Zod validation
   */
  static parseSecurityAlerts(rawData: unknown): GitHubSecurityAlert[] {
    if (!Array.isArray(rawData)) {
      return []
    }

    return rawData
      .map((item) => {
        const result = GitHubSecurityAlert.safeParse(item)
        return result.success ? result.data : null
      })
      .filter((item): item is GitHubSecurityAlert => item !== null)
  }

  /**
   * Calculate PR complexity score based on changes
   */
  static calculateComplexityScore(
    files: GitHubFileChange[],
    commits: GitHubCommit[],
  ): number {
    const fileScore = files.length * 0.1
    const changeScore =
      files.reduce((sum, file) => sum + file.additions + file.deletions, 0) *
      0.01
    const commitScore = commits.length * 0.2

    return Math.min(
      Math.round((fileScore + changeScore + commitScore) * 10) / 10,
      10,
    )
  }

  /**
   * Get files by change type
   */
  static getFilesByChangeType(files: GitHubFileChange[]): {
    added: GitHubFileChange[]
    modified: GitHubFileChange[]
    removed: GitHubFileChange[]
    renamed: GitHubFileChange[]
  } {
    return {
      added: files.filter((f) => f.status === 'added'),
      modified: files.filter((f) => f.status === 'modified'),
      removed: files.filter((f) => f.status === 'removed'),
      renamed: files.filter((f) => f.status === 'renamed'),
    }
  }

  /**
   * Identify affected components based on file paths
   */
  static identifyAffectedComponents(files: GitHubFileChange[]): string[] {
    const components = new Set<string>()

    files.forEach((file) => {
      const parts = file.filename.split('/')

      // Extract directory-based components
      if (parts.length > 1) {
        components.add(parts[0])
        if (parts.length > 2 && parts[1] !== 'src') {
          components.add(`${parts[0]}/${parts[1]}`)
        }
      }

      // Extract language-based components
      const extension = file.filename.split('.').pop()?.toLowerCase()
      if (extension) {
        const languageComponents = {
          ts: 'typescript',
          tsx: 'react',
          js: 'javascript',
          jsx: 'react',
          py: 'python',
          java: 'java',
          go: 'golang',
          rs: 'rust',
          css: 'styling',
          scss: 'styling',
          sql: 'database',
          yml: 'configuration',
          yaml: 'configuration',
          json: 'configuration',
          md: 'documentation',
          dockerfile: 'infrastructure',
        }

        const component =
          languageComponents[extension as keyof typeof languageComponents]
        if (component) {
          components.add(component)
        }
      }

      // Extract framework-based components
      if (
        file.filename.includes('package.json') ||
        file.filename.includes('pnpm-')
      ) {
        components.add('dependencies')
      }
      if (file.filename.includes('test') || file.filename.includes('spec')) {
        components.add('testing')
      }
      if (file.filename.includes('docker') || file.filename.includes('k8s')) {
        components.add('infrastructure')
      }
    })

    return Array.from(components).sort()
  }

  /**
   * Get failed check runs
   */
  static getFailedCheckRuns(checkRuns: GitHubCheckRun[]): GitHubCheckRun[] {
    return checkRuns.filter((check) => check.conclusion === 'failure')
  }

  /**
   * Get critical security alerts
   */
  static getCriticalSecurityAlerts(
    alerts: GitHubSecurityAlert[],
  ): GitHubSecurityAlert[] {
    return alerts.filter(
      (alert) =>
        alert.state === 'open' &&
        alert.security_advisory.severity === 'critical',
    )
  }

  /**
   * Calculate test coverage impact estimate
   */
  static estimateTestCoverageImpact(files: GitHubFileChange[]): number {
    const testFiles = files.filter(
      (file) =>
        file.filename.includes('.test.') ||
        file.filename.includes('.spec.') ||
        file.filename.includes('__tests__'),
    )

    const sourceFiles = files.filter(
      (file) =>
        !file.filename.includes('.test.') &&
        !file.filename.includes('.spec.') &&
        !file.filename.includes('__tests__') &&
        (file.filename.endsWith('.ts') ||
          file.filename.endsWith('.tsx') ||
          file.filename.endsWith('.js') ||
          file.filename.endsWith('.jsx')),
    )

    if (sourceFiles.length === 0) {
      return 0
    }

    // Simple heuristic: ratio of test changes to source changes
    const testChanges = testFiles.reduce(
      (sum, file) => sum + file.additions + file.deletions,
      0,
    )
    const sourceChanges = sourceFiles.reduce(
      (sum, file) => sum + file.additions + file.deletions,
      0,
    )

    return sourceChanges > 0
      ? Math.round((testChanges / sourceChanges) * 100) / 100
      : 0
  }

  /**
   * Extract PR metadata for analysis
   */
  static extractPRMetadata(
    pr: GitHubPullRequest,
    files: GitHubFileChange[],
  ): {
    isDraft: boolean
    size: 'small' | 'medium' | 'large' | 'huge'
    hasBreakingChanges: boolean
    touchesCriticalFiles: boolean
    estimatedReviewTime: number
  } {
    const totalChanges = pr.additions + pr.deletions

    let size: 'small' | 'medium' | 'large' | 'huge'
    if (totalChanges < 50) size = 'small'
    else if (totalChanges < 200) size = 'medium'
    else if (totalChanges < 500) size = 'large'
    else size = 'huge'

    const hasBreakingChanges =
      pr.title.toLowerCase().includes('breaking') ||
      pr.body?.toLowerCase().includes('breaking') ||
      files.some((file) => file.filename.includes('migration'))

    const criticalFiles = [
      'package.json',
      'Dockerfile',
      'docker-compose',
      '.env',
      'prisma/schema.prisma',
      'tsconfig.json',
    ]

    const touchesCriticalFiles = files.some((file) =>
      criticalFiles.some((critical) => file.filename.includes(critical)),
    )

    // Rough estimate: 5 minutes per 100 lines changed, minimum 10 minutes
    const estimatedReviewTime = Math.max(10, Math.round(totalChanges / 20))

    return {
      isDraft: pr.draft,
      size,
      hasBreakingChanges,
      touchesCriticalFiles,
      estimatedReviewTime,
    }
  }
}
