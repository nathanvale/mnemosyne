#!/usr/bin/env tsx

/**
 * Agent Wrapper - Bridge between Task tool agents and code-review package
 *
 * This wrapper allows us to simulate the pr-review-synthesizer agent locally
 * and ensures that all analysis results are properly logged to the filesystem.
 *
 * When the pr-review-synthesizer is invoked via Task tool, it runs in an isolated
 * environment without access to LogManager. This wrapper solves that problem.
 */

import type { CodeRabbitAnalysis } from '../types/coderabbit.js'
import type { GitHubPRContext } from '../types/github.js'

import { AgentSimulator } from '../agent/agent-simulator.js'
import { LogManager } from '../utils/log-manager.js'

/**
 * Wrapper configuration
 */
interface WrapperConfig {
  prNumber: number
  repo: string
  verbose: boolean
  saveToFile?: string
}

/**
 * Agent Wrapper - Simulates Task tool agent execution with logging
 */
class AgentWrapper {
  private config: WrapperConfig

  constructor(config: WrapperConfig) {
    this.config = config
  }

  /**
   * Run the agent simulation with full logging
   */
  async run(): Promise<void> {
    try {
      this.log('🤖 Starting PR Review Agent Wrapper...')
      this.log(
        `📋 Analyzing PR #${this.config.prNumber} in ${this.config.repo}`,
      )

      // Phase 1: Fetch GitHub data
      this.log('🔍 Phase 1: Fetching GitHub PR context...')
      const githubContext = await this.fetchGitHubData()

      // Phase 2: Fetch CodeRabbit data
      this.log('🤖 Phase 2: Fetching CodeRabbit analysis...')
      const codeRabbitAnalysis = await this.fetchCodeRabbitData(githubContext)

      // Phase 3: Prepare agent prompt
      this.log('📝 Phase 3: Preparing agent prompt...')
      const prompt = this.prepareAgentPrompt(githubContext, codeRabbitAnalysis)

      // Phase 4: Run agent simulation
      this.log('🎯 Phase 4: Running pr-review-synthesizer simulation...')
      const agentResponse = await AgentSimulator.simulatePRReviewSynthesizer(
        prompt,
        githubContext,
        codeRabbitAnalysis,
      )

      // Phase 5: Save logs
      this.log('💾 Phase 5: Saving analysis logs...')
      const logPath = await this.saveAgentResponse(
        agentResponse,
        prompt,
        githubContext,
      )

      // Phase 6: Display results
      this.log('✅ Phase 6: Analysis complete!')
      console.warn(`\n${'='.repeat(80)}`)
      console.warn(agentResponse)
      console.warn('='.repeat(80))
      console.warn(`\n📁 Full report saved to: ${logPath}`)

      // Save to file if requested
      if (this.config.saveToFile) {
        const fs = await import('fs/promises')
        await fs.writeFile(this.config.saveToFile, agentResponse, 'utf-8')
        console.warn(`📄 Report also saved to: ${this.config.saveToFile}`)
      }
    } catch (error) {
      console.error('❌ Agent wrapper failed:', error)
      process.exit(1)
    }
  }

  /**
   * Fetch GitHub PR context
   */
  private async fetchGitHubData(): Promise<GitHubPRContext> {
    // For now, we'll use a simple approach to fetch GitHub data
    // In a real implementation, this would use the GitHub API
    const repoName = this.config.repo.split('/')[1]

    const mockContext: GitHubPRContext = {
      pullRequest: {
        id: 123456789,
        number: this.config.prNumber,
        title: 'Mock PR Title',
        body: 'Mock PR Description',
        state: 'open',
        merged: false,
        mergeable: true,
        mergeable_state: 'clean',
        user: {
          id: 12345,
          login: 'mockuser',
          avatar_url: 'https://github.com/mockuser.png',
          html_url: 'https://github.com/mockuser',
          type: 'User',
        },
        assignees: [],
        requested_reviewers: [],
        labels: [],
        base: {
          ref: 'main',
          sha: 'abc123def456',
          repo: {
            id: 987654321,
            name: repoName,
            full_name: this.config.repo,
            private: false,
            html_url: `https://github.com/${this.config.repo}`,
            default_branch: 'main',
            language: 'TypeScript',
            languages_url: `https://api.github.com/repos/${this.config.repo}/languages`,
          },
        },
        head: {
          ref: 'feature-branch',
          sha: 'def456abc123',
          repo: {
            id: 987654321,
            name: repoName,
            full_name: this.config.repo,
            private: false,
            html_url: `https://github.com/${this.config.repo}`,
            default_branch: 'main',
            language: 'TypeScript',
            languages_url: `https://api.github.com/repos/${this.config.repo}/languages`,
          },
        },
        html_url: `https://github.com/${this.config.repo}/pull/${this.config.prNumber}`,
        diff_url: `https://github.com/${this.config.repo}/pull/${this.config.prNumber}.diff`,
        patch_url: `https://github.com/${this.config.repo}/pull/${this.config.prNumber}.patch`,
        commits_url: `https://api.github.com/repos/${this.config.repo}/pulls/${this.config.prNumber}/commits`,
        comments_url: `https://api.github.com/repos/${this.config.repo}/issues/${this.config.prNumber}/comments`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        closed_at: null,
        merged_at: null,
        merge_commit_sha: null,
        additions: 50,
        deletions: 10,
        changed_files: 3,
        commits: 2,
        comments: 0,
        review_comments: 0,
        maintainer_can_modify: true,
        draft: false,
      },
      files: [],
      commits: [],
      checkRuns: [],
      securityAlerts: [],
      metadata: {
        fetchedAt: new Date().toISOString(),
        totalLinesChanged: 60,
        affectedComponents: ['components', 'utils'],
      },
    }

    // In production, this would make actual API calls
    this.log('Note: Using mock GitHub data. Real API integration needed.')
    return mockContext
  }

  /**
   * Fetch CodeRabbit analysis
   */
  private async fetchCodeRabbitData(
    githubContext: GitHubPRContext,
  ): Promise<CodeRabbitAnalysis | undefined> {
    try {
      // Try to fetch CodeRabbit comments from GitHub
      // Note: Mock context doesn't have comments array on pullRequest
      const codeRabbitComments = githubContext.commits?.filter(
        // Mock filter - in real implementation this would filter PR comments
        () => false,
      )

      if (codeRabbitComments && codeRabbitComments.length > 0) {
        // TODO: Replace with actual CodeRabbitParser method when available
        return undefined
      }

      this.log('⚠️ No CodeRabbit analysis found for this PR (using mock data)')
      return undefined
    } catch (error) {
      this.log(`⚠️ Failed to fetch CodeRabbit data: ${error}`)
      return undefined
    }
  }

  /**
   * Prepare the prompt for the agent
   */
  private prepareAgentPrompt(
    githubContext: GitHubPRContext,
    codeRabbitAnalysis?: CodeRabbitAnalysis,
  ): string {
    const filesChanged = githubContext.files.map((f) => ({
      filename: f.filename,
      additions: f.additions,
      deletions: f.deletions,
      changes: f.changes,
      patch: f.patch,
    }))

    return `Analyze this Pull Request and provide a comprehensive security and quality review.

## PR Context
Repository: ${githubContext.pullRequest.base.repo.full_name}
PR #${githubContext.pullRequest.number}: ${githubContext.pullRequest.title}
Author: ${githubContext.pullRequest.user.login}
Base Branch: ${githubContext.pullRequest.base.ref}
Head Branch: ${githubContext.pullRequest.head.ref}
Files Changed: ${githubContext.files.length}
Lines Added: +${githubContext.pullRequest.additions}
Lines Deleted: -${githubContext.pullRequest.deletions}

## Files Changed
${JSON.stringify(filesChanged, null, 2)}

## CodeRabbit Analysis
${codeRabbitAnalysis ? JSON.stringify(codeRabbitAnalysis, null, 2) : 'No CodeRabbit analysis available'}

## Instructions
1. Analyze all code changes for security vulnerabilities
2. Review CodeRabbit findings and validate them
3. Identify any additional issues CodeRabbit may have missed
4. Provide specific, actionable recommendations
5. Include file paths and line numbers where applicable
6. Prioritize findings by severity (critical, high, medium, low)
7. Make a clear merge recommendation

Please provide a comprehensive analysis with ALL findings listed, not just summaries.`
  }

  /**
   * Save agent response using LogManager
   */
  private async saveAgentResponse(
    response: string,
    prompt: string,
    githubContext: GitHubPRContext,
  ): Promise<string> {
    // Save as sub-agent response
    const logPath = await LogManager.saveSubAgentResponse(response, prompt, {
      prNumber: githubContext.pullRequest.number,
      repository: githubContext.pullRequest.base.repo.full_name,
      analysisId: `agent-wrapper-${Date.now()}`,
      source: 'claude-sub-agent',
    })

    return logPath
  }

  /**
   * Log message if verbose mode is enabled
   */
  private log(message: string): void {
    if (this.config.verbose) {
      console.warn(message)
    }
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--help') || args.includes('-h') || args.length < 2) {
    console.error(`
Agent Wrapper - Bridge for PR Review Agent with Logging

This tool simulates the pr-review-synthesizer agent locally and ensures
all analysis results are properly saved to the logs directory.

Usage:
  pnpm --filter @studio/code-review review:agent-wrapper <pr-number> <repo> [options]

Arguments:
  pr-number    Pull request number to analyze
  repo         Repository in owner/repo format

Options:
  --verbose, -v           Show detailed progress messages
  --save-to <file>        Save the report to a specific file
  --help, -h              Show this help message

Examples:
  pnpm --filter @studio/code-review review:agent-wrapper 139 nathanvale/mnemosyne
  pnpm --filter @studio/code-review review:agent-wrapper 139 nathanvale/mnemosyne --verbose
  pnpm --filter @studio/code-review review:agent-wrapper 139 nathanvale/mnemosyne --save-to report.md

Why use this?
  When the pr-review-synthesizer agent is invoked directly via Task tool,
  it runs in an isolated environment without access to LogManager. This
  wrapper solves that problem by running the analysis locally and ensuring
  all results are properly logged.
`)
    process.exit(0)
  }

  const prNumber = parseInt(args[0])
  const repo = args[1]

  if (isNaN(prNumber)) {
    console.error('Error: PR number must be a valid integer')
    process.exit(1)
  }

  if (!repo || !repo.includes('/')) {
    console.error('Error: Repository must be in owner/repo format')
    process.exit(1)
  }

  // Parse options
  const saveToIndex = args.indexOf('--save-to')
  const saveToFile = saveToIndex !== -1 ? args[saveToIndex + 1] : undefined

  const config: WrapperConfig = {
    prNumber,
    repo,
    verbose: args.includes('--verbose') || args.includes('-v'),
    saveToFile,
  }

  // Run the wrapper
  const wrapper = new AgentWrapper(config)
  await wrapper.run()
}

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unhandled error:', error)
    process.exit(1)
  })
}
