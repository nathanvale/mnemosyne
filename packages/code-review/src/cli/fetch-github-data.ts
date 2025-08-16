#!/usr/bin/env tsx

/**
 * GitHub Data Fetcher
 * Fetches comprehensive PR context data from GitHub API using gh CLI
 * Provides data needed for expert PR analysis
 */

import { writeFileSync } from 'node:fs'

import { GitHubPRContext, GitHubSecurityAlert } from '../types/github'
import { execFileWithTimeout, execFileJson } from '../utils/async-exec'

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
 * GitHub data fetcher configuration
 */
interface GitHubFetcherConfig {
  repo?: string
  outputFile?: string
  includeSecurityAlerts: boolean
  includeDiffData: boolean
  verbose: boolean
}

/**
 * GitHub CLI API response interfaces
 */
interface GitHubUserAPI {
  id?: number
  login: string
  avatarUrl?: string
  url?: string
  type?: string
}

interface GitHubRepositoryAPI {
  id?: number
  name: string
  nameWithOwner: string
  isPrivate: boolean
  url: string
  defaultBranchRef?: { name: string }
  primaryLanguage?: { name: string }
}

interface GitHubLabelAPI {
  id?: number
  name: string
  color?: string
  description?: string
}

interface GitHubCommitAPI {
  oid: string
  messageHeadline: string
  messageBody?: string
  authors?: Array<{ name: string; email: string }>
  committer?: { name: string; email: string }
  committedDate: string
  tree?: { oid: string }
  url?: string
}

interface GitHubPRDataAPI {
  id: number
  number: number
  title: string
  body?: string
  state: string
  mergedAt?: string
  mergeable?: boolean
  mergeStateStatus?: string
  author: GitHubUserAPI
  assignees?: GitHubUserAPI[]
  reviewRequests?: Array<{ requestedReviewer: GitHubUserAPI }>
  labels?: GitHubLabelAPI[]
  baseRefName: string
  headRefName: string
  baseRefOid: string
  headRefOid: string
  headRepository: GitHubRepositoryAPI
  url: string
  createdAt: string
  updatedAt: string
  closedAt?: string
  mergeCommit?: { oid: string }
  additions?: number
  deletions?: number
  changedFiles?: number
  commits?: { totalCount: number }
  comments?: { totalCount: number }
  isDraft: boolean
}

interface GitHubCheckAPI {
  name: string
  state: string
  conclusion?: string
  startedAt?: string
  completedAt?: string
  link?: string
}

/**
 * GitHub PR data fetcher using gh CLI
 */
export class GitHubDataFetcher {
  private config: GitHubFetcherConfig

  constructor(config: Partial<GitHubFetcherConfig> = {}) {
    this.config = {
      repo: config.repo,
      outputFile: config.outputFile,
      includeSecurityAlerts: config.includeSecurityAlerts ?? true,
      includeDiffData: config.includeDiffData ?? true,
      verbose: config.verbose ?? false,
    }
  }

  /**
   * Fetch comprehensive PR context data
   */
  async fetchPRContext(
    prNumber: number,
    repo?: string,
  ): Promise<GitHubPRContext> {
    const repository = repo || this.config.repo
    if (!repository) {
      throw new Error(
        'Repository must be specified either in config or as parameter',
      )
    }

    this.log(`🔍 Fetching PR #${prNumber} from ${repository}...`)

    try {
      // Fetch PR data
      this.log('📋 Fetching pull request details...')
      const pullRequest = await this.fetchPullRequest(prNumber, repository)

      // Fetch file changes
      this.log('📁 Fetching file changes...')
      const files = await this.fetchFileChanges(prNumber, repository)

      // Fetch commits
      this.log('📝 Fetching commits...')
      const commits = await this.fetchCommits(prNumber, repository)

      // Fetch check runs
      this.log('✅ Fetching check runs...')
      const checkRuns = await this.fetchCheckRuns(prNumber, repository)

      // Fetch security alerts (if enabled)
      let securityAlerts: GitHubSecurityAlert[] = []
      if (this.config.includeSecurityAlerts) {
        this.log('🛡️ Fetching security alerts...')
        securityAlerts = await this.fetchSecurityAlerts(repository)
      }

      // Calculate metadata
      this.log('📊 Calculating metadata...')
      const metadata = this.calculateMetadata(files, pullRequest)

      // Assemble context
      const context: GitHubPRContext = {
        pullRequest,
        files,
        commits,
        checkRuns,
        securityAlerts,
        metadata,
      }

      // Validate the data structure
      const validatedContext = GitHubPRContext.parse(context)

      this.log(`✅ Successfully fetched PR context for #${prNumber}`)
      return validatedContext
    } catch (error) {
      console.error(`❌ Failed to fetch PR context for #${prNumber}:`, error)
      throw error
    }
  }

  /**
   * Fetch pull request details
   */
  private async fetchPullRequest(prNumber: number, repo: string) {
    validatePRNumber(prNumber)
    validateRepoName(repo)

    const jsonFields = [
      'id',
      'number',
      'title',
      'body',
      'state',
      'mergedAt',
      'mergeable',
      'mergeStateStatus',
      'author',
      'assignees',
      'reviewRequests',
      'labels',
      'baseRefName',
      'headRefName',
      'baseRefOid',
      'headRefOid',
      'headRepository',
      'url',
      'createdAt',
      'updatedAt',
      'closedAt',
      'mergedAt',
      'mergeCommit',
      'additions',
      'deletions',
      'changedFiles',
      'commits',
      'comments',
      'reviewDecision',
      'isDraft',
    ].join(',')

    const prData = await execFileJson<GitHubPRDataAPI>('gh', [
      'pr',
      'view',
      prNumber.toString(),
      '--repo',
      repo,
      '--json',
      jsonFields,
    ])

    // Transform GitHub API response to our schema format
    const merged = !!prData.mergedAt
    return {
      id:
        typeof prData.id === 'string'
          ? isNaN(parseInt(prData.id))
            ? 0
            : parseInt(prData.id)
          : prData.id,
      number: prData.number,
      title: prData.title,
      body: prData.body || null,
      state: this.mapPRState(prData.state, merged),
      merged,
      mergeable:
        typeof prData.mergeable === 'string'
          ? prData.mergeable === 'MERGEABLE'
          : (prData.mergeable ?? null),
      mergeable_state: prData.mergeStateStatus || 'unknown',
      user: this.mapUser(prData.author),
      assignees: (prData.assignees || []).map((user: GitHubUserAPI) =>
        this.mapUser(user),
      ),
      requested_reviewers: (prData.reviewRequests || []).map((request) =>
        this.mapUser(request.requestedReviewer),
      ),
      labels: (prData.labels || []).map((label: GitHubLabelAPI) => ({
        id: label.id || 0,
        name: label.name,
        color: label.color || 'ffffff',
        description: label.description || null,
      })),
      base: {
        ref: prData.baseRefName,
        sha: prData.baseRefOid,
        repo: this.mapRepository(prData.headRepository),
      },
      head: {
        ref: prData.headRefName,
        sha: prData.headRefOid,
        repo: this.mapRepository(prData.headRepository),
      },
      html_url: prData.url,
      diff_url: `${prData.url}.diff`,
      patch_url: `${prData.url}.patch`,
      commits_url: `${prData.url}/commits`,
      comments_url: `${prData.url}/comments`,
      created_at: prData.createdAt,
      updated_at: prData.updatedAt,
      closed_at: prData.closedAt || null,
      merged_at: prData.mergedAt || null,
      merge_commit_sha: prData.mergeCommit?.oid || null,
      additions: prData.additions || 0,
      deletions: prData.deletions || 0,
      changed_files: prData.changedFiles || 0,
      commits: prData.commits?.totalCount || 0,
      comments: prData.comments?.totalCount || 0,
      review_comments: 0, // Not available in gh CLI output
      maintainer_can_modify: false, // Not available in gh CLI output
      draft: prData.isDraft,
    }
  }

  /**
   * Fetch file changes for the PR
   */
  private async fetchFileChanges(prNumber: number, repo: string) {
    validatePRNumber(prNumber)
    validateRepoName(repo)

    const fileListOutput = await execFileWithTimeout('gh', [
      'pr',
      'diff',
      prNumber.toString(),
      '--repo',
      repo,
      '--name-only',
    ])
    const fileList = fileListOutput
      .split('\n')
      .filter((file: string) => file.trim())

    // Get detailed file information
    const files = []
    for (const filename of fileList) {
      try {
        // Get file diff stats
        const diffOutput = await execFileWithTimeout('gh', [
          'pr',
          'diff',
          prNumber.toString(),
          '--repo',
          repo,
          '--',
          filename,
        ])

        const additions = this.countDiffLines(diffOutput, '+')
        const deletions = this.countDiffLines(diffOutput, '-')

        files.push({
          sha: '', // Not available from gh CLI
          filename,
          status: this.inferFileStatus(diffOutput),
          additions,
          deletions,
          changes: additions + deletions,
          blob_url: '', // Would need additional API call
          raw_url: '', // Would need additional API call
          contents_url: '', // Would need additional API call
          patch: this.config.includeDiffData ? diffOutput : undefined,
        })
      } catch {
        this.log(`⚠️ Could not get diff for file: ${filename}`)
        // Add file with minimal info
        files.push({
          sha: '',
          filename,
          status: 'modified' as const,
          additions: 0,
          deletions: 0,
          changes: 0,
          blob_url: '',
          raw_url: '',
          contents_url: '',
        })
      }
    }

    return files
  }

  /**
   * Fetch commits for the PR
   */
  private async fetchCommits(prNumber: number, repo: string) {
    validatePRNumber(prNumber)
    validateRepoName(repo)

    const data = await execFileJson<{ commits?: GitHubCommitAPI[] }>('gh', [
      'pr',
      'view',
      prNumber.toString(),
      '--repo',
      repo,
      '--json',
      'commits',
    ])

    return (data.commits || []).map((commit: GitHubCommitAPI) => ({
      sha: commit.oid,
      message:
        commit.messageHeadline +
        (commit.messageBody ? `\n\n${commit.messageBody}` : ''),
      author: {
        name: commit.authors?.[0]?.name || 'Unknown',
        email: commit.authors?.[0]?.email || 'unknown@example.com',
        date: commit.committedDate,
      },
      committer: {
        name: commit.committer?.name || commit.authors?.[0]?.name || 'Unknown',
        email:
          commit.committer?.email ||
          commit.authors?.[0]?.email ||
          'unknown@example.com',
        date: commit.committedDate,
      },
      tree: {
        sha: commit.tree?.oid || '',
      },
      url: commit.url || '',
      comment_count: 0, // Not available in gh CLI output
    }))
  }

  /**
   * Fetch check runs for the PR
   */
  private async fetchCheckRuns(prNumber: number, repo: string) {
    try {
      validatePRNumber(prNumber)
      validateRepoName(repo)

      const checks = await execFileJson<GitHubCheckAPI[]>('gh', [
        'pr',
        'checks',
        prNumber.toString(),
        '--repo',
        repo,
        '--json',
        'state,name,startedAt,completedAt,link',
      ])

      return checks.map((check: GitHubCheckAPI, index: number) => ({
        id: index, // gh CLI doesn't provide actual ID
        name: check.name,
        status: this.mapCheckStatus(check.state),
        conclusion: this.mapCheckConclusion(check.conclusion || null),
        started_at: check.startedAt || null,
        completed_at: check.completedAt || null,
        output: {
          title: null,
          summary: null,
          text: null,
          annotations_count: 0,
          annotations_url: '',
        },
        html_url: check.link || '',
      }))
    } catch {
      this.log('⚠️ Could not fetch check runs (may not be available)')
      return []
    }
  }

  /**
   * Fetch security alerts for the repository
   */
  private async fetchSecurityAlerts(repo: string) {
    try {
      validateRepoName(repo)

      // Note: This requires special permissions and may not be available
      const alerts = await execFileJson<Record<string, unknown>[]>('gh', [
        'api',
        `repos/${repo}/security-advisories`,
        '--paginate',
      ])

      return alerts.map(
        (alert: Record<string, unknown>): GitHubSecurityAlert => ({
          number: (alert.id as number) || 0,
          state: (alert.state as 'open' | 'fixed' | 'dismissed') || 'open',
          created_at: (alert.created_at as string) || '',
          updated_at: (alert.updated_at as string) || '',
          fixed_at: (alert.fixed_at as string) || null,
          dismissed_at: (alert.dismissed_at as string) || null,
          security_advisory: {
            ghsa_id: (alert.ghsa_id as string) || '',
            cve_id: (alert.cve_id as string) || null,
            summary: (alert.summary as string) || '',
            description: (alert.description as string) || '',
            severity:
              (alert.severity as 'low' | 'medium' | 'high' | 'critical') ||
              'medium',
            cvss: {
              vector_string:
                (alert.cvss as { vector_string?: string })?.vector_string || '',
              score: (alert.cvss as { score?: number })?.score || 0,
            },
          },
          security_vulnerability: {
            package: {
              name: (alert.package as { name?: string })?.name || '',
              ecosystem:
                (alert.package as { ecosystem?: string })?.ecosystem || '',
            },
            vulnerable_version_range:
              (alert.vulnerable_version_range as string) || '',
            first_patched_version: alert.first_patched_version
              ? { identifier: alert.first_patched_version as string }
              : null,
          },
          url: (alert.url as string) || '',
          html_url: (alert.html_url as string) || '',
        }),
      )
    } catch {
      this.log(
        '⚠️ Could not fetch security alerts (may require additional permissions)',
      )
      return []
    }
  }

  /**
   * Calculate metadata about the PR
   */
  private calculateMetadata(
    files: Array<{ additions: number; deletions: number; filename: string }>,
    _pullRequest: unknown,
  ) {
    const totalLinesChanged = files.reduce(
      (sum, file) => sum + file.additions + file.deletions,
      0,
    )

    // Identify affected components based on file paths
    const affectedComponents = this.identifyAffectedComponents(files)

    // Calculate complexity score based on various factors
    const complexityScore = this.calculateComplexityScore(files)

    return {
      fetchedAt: new Date().toISOString(),
      totalLinesChanged,
      affectedComponents,
      complexityScore,
    }
  }

  /**
   * Identify affected components from file changes
   */
  private identifyAffectedComponents(
    files: Array<{ filename: string }>,
  ): string[] {
    const components = new Set<string>()

    files.forEach((file) => {
      const path = file.filename

      // Frontend components
      if (
        path.includes('components/') ||
        path.includes('pages/') ||
        path.includes('app/')
      ) {
        components.add('frontend')
      }

      // API/Backend
      if (
        path.includes('api/') ||
        path.includes('server/') ||
        path.includes('backend/')
      ) {
        components.add('backend')
      }

      // Database
      if (
        path.includes('migration') ||
        path.includes('schema') ||
        path.includes('prisma/')
      ) {
        components.add('database')
      }

      // Tests
      if (
        path.includes('test') ||
        path.includes('spec') ||
        path.includes('__tests__')
      ) {
        components.add('testing')
      }

      // Configuration
      if (
        path.includes('config') ||
        path.match(/\.(json|yaml|yml|toml|env)$/)
      ) {
        components.add('configuration')
      }

      // Documentation
      if (path.match(/\.(md|txt|rst)$/)) {
        components.add('documentation')
      }
    })

    return Array.from(components)
  }

  /**
   * Calculate complexity score
   */
  private calculateComplexityScore(
    files: Array<{ additions: number; deletions: number; filename: string }>,
  ): number {
    let score = 0

    // Base score from file count
    score += Math.min(files.length * 0.5, 10)

    // Score from total lines changed
    const totalLines = files.reduce(
      (sum, f) => sum + f.additions + f.deletions,
      0,
    )
    score += Math.min(totalLines * 0.01, 15)

    // Score from number of affected components
    const components = this.identifyAffectedComponents(files)
    score += components.length * 1.5

    // Bonus for certain file types
    files.forEach((file) => {
      if (file.filename.match(/\.(ts|tsx|js|jsx)$/)) score += 0.5
      if (file.filename.includes('migration')) score += 2
      if (file.filename.includes('config')) score += 1
    })

    return Math.min(score, 50) // Cap at 50
  }

  // Helper methods for data transformation
  private mapPRState(
    state: string,
    merged: boolean,
  ): 'open' | 'closed' | 'merged' {
    if (merged) return 'merged'
    // GitHub CLI returns uppercase, we need lowercase
    return state.toLowerCase() as 'open' | 'closed'
  }

  private mapUser(user: GitHubUserAPI) {
    return {
      id:
        typeof user.id === 'string'
          ? isNaN(parseInt(user.id))
            ? 0
            : parseInt(user.id)
          : user.id || 0,
      login: user.login,
      avatar_url: user.avatarUrl || '',
      html_url: user.url || '',
      type: (user.type === 'Bot' ? 'Bot' : 'User') as 'User' | 'Bot',
    }
  }

  private mapRepository(repo: GitHubRepositoryAPI) {
    return {
      id:
        typeof repo.id === 'string'
          ? isNaN(parseInt(repo.id))
            ? 0
            : parseInt(repo.id)
          : repo.id || 0,
      name: repo.name,
      full_name: repo.nameWithOwner || `${repo.name}`,
      private: repo.isPrivate ?? false,
      html_url: repo.url || `https://github.com/${repo.name}`,
      default_branch: repo.defaultBranchRef?.name || 'main',
      language: repo.primaryLanguage?.name || null,
      languages_url: '', // Not available in gh CLI
    }
  }

  private mapCheckStatus(
    state: string,
  ): 'queued' | 'in_progress' | 'completed' {
    const statusMap: Record<string, 'queued' | 'in_progress' | 'completed'> = {
      pending: 'in_progress',
      expected: 'queued',
      error: 'completed',
      failure: 'completed',
      neutral: 'completed',
      success: 'completed',
      skipped: 'completed',
      cancelled: 'completed',
      timed_out: 'completed',
    }
    return statusMap[state] || 'completed'
  }

  private mapCheckConclusion(
    conclusion: string | null,
  ):
    | 'success'
    | 'failure'
    | 'neutral'
    | 'cancelled'
    | 'skipped'
    | 'timed_out'
    | 'action_required'
    | null {
    if (!conclusion) return null
    const validConclusions: Array<
      | 'success'
      | 'failure'
      | 'neutral'
      | 'cancelled'
      | 'skipped'
      | 'timed_out'
      | 'action_required'
    > = [
      'success',
      'failure',
      'neutral',
      'cancelled',
      'skipped',
      'timed_out',
      'action_required',
    ]
    return validConclusions.includes(
      conclusion as (typeof validConclusions)[number],
    )
      ? (conclusion as (typeof validConclusions)[number])
      : 'failure'
  }

  private countDiffLines(diff: string, prefix: string): number {
    return diff.split('\n').filter((line) => line.startsWith(prefix)).length
  }

  private inferFileStatus(
    diff: string,
  ): 'added' | 'removed' | 'modified' | 'renamed' {
    if (diff.includes('new file mode')) return 'added'
    if (diff.includes('deleted file mode')) return 'removed'
    if (diff.includes('rename from') || diff.includes('rename to'))
      return 'renamed'
    return 'modified'
  }

  private log(message: string) {
    if (this.config.verbose) {
      console.error(message)
    }
  }

  /**
   * Save PR context to file
   */
  async savePRContext(
    context: GitHubPRContext,
    outputFile?: string,
  ): Promise<string> {
    const filePath =
      outputFile ||
      this.config.outputFile ||
      `pr-${context.pullRequest.number}-context.json`

    writeFileSync(filePath, JSON.stringify(context, null, 2))
    this.log(`💾 Saved PR context to ${filePath}`)

    return filePath
  }
}

/**
 * CLI interface for GitHub data fetcher
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h')) {
    console.error(`
GitHub Data Fetcher - Fetch comprehensive PR context for analysis

Usage:
  pnpm --filter @studio/code-review review:fetch-github <pr-number> [options]

Arguments:
  pr-number                    Pull request number to fetch

Options:
  --repo <owner/repo>          Repository (e.g., "owner/repo") - required
  --output <file>              Output file path (default: pr-<number>-context.json)
  --no-security-alerts         Skip fetching security alerts
  --no-diff-data              Skip including diff/patch data 
  --verbose, -v               Enable verbose logging
  --help, -h                  Show this help message

Examples:
  pnpm --filter @studio/code-review review:fetch-github 123 --repo owner/repo
  pnpm --filter @studio/code-review review:fetch-github 456 --repo owner/repo --output pr-data.json --verbose
`)
    process.exit(0)
  }

  if (args.length < 1) {
    console.error('Error: PR number is required')
    console.error('Run with --help for usage information')
    process.exit(1)
  }

  try {
    const prNumber = parseInt(args[0])
    if (isNaN(prNumber)) {
      console.error('Error: PR number must be a valid integer')
      process.exit(1)
    }

    // Parse arguments
    const repoIndex = args.indexOf('--repo')
    const repo = repoIndex !== -1 ? args[repoIndex + 1] : undefined

    const outputIndex = args.indexOf('--output')
    const outputFile = outputIndex !== -1 ? args[outputIndex + 1] : undefined

    const config = {
      repo,
      outputFile,
      includeSecurityAlerts: !args.includes('--no-security-alerts'),
      includeDiffData: !args.includes('--no-diff-data'),
      verbose: args.includes('--verbose') || args.includes('-v'),
    }

    if (!repo) {
      console.error('Error: --repo is required')
      process.exit(1)
    }

    // Check for common placeholder values
    if (repo === 'owner/repo' || repo.includes('owner/repo')) {
      console.error(
        'Error: "owner/repo" is a placeholder - you need to provide a real repository name',
      )
      console.error('')
      console.error('Examples of valid repository names:')
      console.error('  • nathanvale/mnemosyne')
      console.error('  • microsoft/vscode')
      console.error('  • facebook/react')
      console.error('')
      console.error(
        'Replace "owner" with the GitHub username/organization and "repo" with the repository name',
      )
      process.exit(1)
    }

    // Fetch PR data
    const fetcher = new GitHubDataFetcher(config)
    const context = await fetcher.fetchPRContext(prNumber, repo)

    // Save to file
    const savedFile = await fetcher.savePRContext(context, outputFile)

    console.error(`✅ Successfully fetched PR #${prNumber} context`)
    console.error(`📁 Saved to: ${savedFile}`)
    console.error(
      `📊 Summary: ${context.files.length} files, ${context.metadata.totalLinesChanged} lines changed`,
    )
    console.error(
      `🏗️ Components affected: ${context.metadata.affectedComponents.join(', ') || 'none detected'}`,
    )
  } catch (error) {
    console.error('Fatal error in GitHub data fetcher:', error)
    process.exit(1)
  }
}

// Run CLI interface if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
}
