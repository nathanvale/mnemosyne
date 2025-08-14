#!/usr/bin/env tsx

/**
 * Unified PR Review CLI - Complete Workflow Entry Point
 *
 * This is the main entry point for all PR analysis functionality within the code-review package.
 * Provides a clean, unified interface that replaces the old .claude/scripts approach.
 *
 * Usage:
 *   pnpm --filter @studio/code-review review:pr <command> [options]
 *
 * Commands:
 *   analyze <pr> <repo>  - Run complete unified analysis
 *   agent <pr> <repo>    - Run PR reviewer agent with expert analysis
 *   fetch <pr> <repo>    - Fetch GitHub PR data
 *   help                 - Show this help message
 */

import { PRReviewerAgent } from '../agent/pr-reviewer-agent.js'
import { initializeGracefulShutdown } from '../utils/async-exec.js'
import { validateStartupEnvironment } from '../validators/env-validator.js'
import { GitHubDataFetcher } from './fetch-github-data.js'
import { UnifiedAnalysisOrchestrator } from './unified-analysis.js'

/**
 * Command configuration
 */
interface CommandConfig {
  prNumber?: string
  repo?: string
  format?: 'github' | 'markdown' | 'json'
  confidenceThreshold?: number
  skipCoderabbit?: boolean
  verbose?: boolean
  outputFile?: string
}

/**
 * Parse command line arguments and environment variables
 */
function parseArgs(): { command: string; config: CommandConfig } {
  const args = process.argv.slice(2)

  // Support environment variables (PR=123 REPO=owner/repo pattern)
  const prFromEnv = process.env.PR
  const repoFromEnv = process.env.REPO

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp()
    process.exit(0)
  }

  const command = args[0]
  const config: CommandConfig = {
    prNumber: prFromEnv,
    repo: repoFromEnv,
    format: 'github',
    verbose: false,
  }

  // Parse remaining arguments
  for (let i = 1; i < args.length; i++) {
    const arg = args[i]

    switch (arg) {
      case '--pr':
        config.prNumber = args[++i]
        break
      case '--repo':
        config.repo = args[++i]
        break
      case '--format':
        config.format = args[++i] as 'github' | 'markdown' | 'json'
        break
      case '--confidence-threshold':
        config.confidenceThreshold = parseInt(args[++i])
        break
      case '--skip-coderabbit':
        config.skipCoderabbit = true
        break
      case '--verbose':
      case '-v':
        config.verbose = true
        break
      case '--output':
      case '-o':
        config.outputFile = args[++i]
        break
      default:
        // Handle positional arguments
        if (!config.prNumber && /^\d+$/.test(arg)) {
          config.prNumber = arg
        } else if (!config.repo && arg.includes('/')) {
          config.repo = arg
        }
    }
  }

  return { command, config }
}

/**
 * Validate required arguments
 */
function validateConfig(command: string, config: CommandConfig): void {
  if (command === 'help') return

  if (!config.prNumber) {
    console.error('Error: PR number is required')
    console.error(
      'Provide via --pr flag, environment variable PR, or as first argument',
    )
    process.exit(1)
  }

  if (!config.repo) {
    console.error('Error: Repository is required')
    console.error(
      'Provide via --repo flag, environment variable REPO, or as second argument',
    )
    process.exit(1)
  }

  if (!/^\d+$/.test(config.prNumber)) {
    console.error('Error: PR number must be a valid integer')
    process.exit(1)
  }

  if (!config.repo.includes('/')) {
    console.error('Error: Repository must be in format owner/repo')
    process.exit(1)
  }

  // Check for common placeholder values
  if (config.repo === 'owner/repo' || config.repo.includes('owner/repo')) {
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
}

/**
 * Show help message
 */
function showHelp(): void {
  console.error(`
Unified PR Review CLI - Complete Analysis Workflow

Usage:
  pnpm --filter @studio/code-review review:pr <command> [options]

Commands:
  analyze <pr> <repo>     Run complete unified analysis with expert validation
  agent <pr> <repo>       Run PR reviewer agent with Firecrawl MCP patterns
  fetch <pr> <repo>       Fetch comprehensive GitHub PR data
  help                    Show this help message

Options:
  --pr <number>           Pull request number
  --repo <owner/repo>     Repository in owner/repo format
  --format <format>       Output format: github|markdown|json (default: github)
  --confidence-threshold <n>  Override confidence threshold (default: 70)
  --skip-coderabbit       Skip CodeRabbit integration
  --output, -o <file>     Output file path
  --verbose, -v           Enable verbose logging
  --help, -h              Show this help message

Environment Variables:
  PR                      Pull request number
  REPO                    Repository in owner/repo format

Examples:
  # Run complete analysis
  pnpm --filter @studio/code-review review:pr analyze 123 owner/repo
  
  # Using environment variables
  PR=123 REPO=owner/repo pnpm --filter @studio/code-review review:pr analyze
  
  # Run agent with specific format
  pnpm --filter @studio/code-review review:pr agent 456 owner/repo --format json
  
  # Fetch GitHub data with verbose output
  pnpm --filter @studio/code-review review:pr fetch 789 owner/repo --verbose
  
  # With confidence threshold
  pnpm --filter @studio/code-review review:pr analyze 123 owner/repo --confidence-threshold 80

Authentication:
  Uses GitHub CLI authentication (run 'gh auth login' if needed)
  GITHUB_TOKEN environment variable is optional
`)
}

/**
 * Execute the analyze command
 */
async function executeAnalyze(config: CommandConfig): Promise<void> {
  console.error('🔍 Starting unified PR analysis...')

  const orchestrator = new UnifiedAnalysisOrchestrator({
    prNumber: parseInt(config.prNumber!),
    repo: config.repo!,
    includeCodeRabbit: !config.skipCoderabbit,
    confidenceThreshold: config.confidenceThreshold || 70,
    maxFindings: 20,
    outputFormat: config.format!,
    cleanupTempFiles: true,
    verbose: config.verbose || false,
  })

  try {
    const result = await orchestrator.runAnalysis()
    console.error('✅ Unified analysis completed successfully')

    if (config.outputFile) {
      const fs = await import('node:fs/promises')
      await fs.writeFile(config.outputFile, JSON.stringify(result, null, 2))
      console.error(`📁 Results saved to: ${config.outputFile}`)
    }
  } catch (error) {
    console.error('❌ Unified analysis failed:', error)
    process.exit(1)
  }
}

/**
 * Execute the agent command
 */
async function executeAgent(config: CommandConfig): Promise<void> {
  console.error('🤖 Starting PR reviewer agent...')

  const agent = new PRReviewerAgent()

  try {
    const result = await agent.analyzePRComprehensive(
      config.prNumber!,
      config.repo!,
      config.confidenceThreshold,
      true, // includeMetrics
      config.format,
    )

    if (result.isError) {
      console.error(result.content[0].text)
      process.exit(1)
    }

    // Output the analysis content
    console.error(result.content[0].text)

    if (config.verbose) {
      console.error('\n--- Analysis Metadata ---')
      console.error(JSON.stringify(result.metadata, null, 2))
    }

    if (config.outputFile) {
      const fs = await import('node:fs/promises')
      await fs.writeFile(config.outputFile, JSON.stringify(result, null, 2))
      console.error(`📁 Results saved to: ${config.outputFile}`)
    }

    console.error('✅ PR reviewer agent completed successfully')
  } catch (error) {
    console.error('❌ PR reviewer agent failed:', error)
    process.exit(1)
  }
}

/**
 * Execute the fetch command
 */
async function executeFetch(config: CommandConfig): Promise<void> {
  console.error('📡 Fetching GitHub PR data...')

  const fetcher = new GitHubDataFetcher({
    repo: config.repo,
    outputFile: config.outputFile,
    includeSecurityAlerts: true,
    includeDiffData: true,
    verbose: config.verbose || false,
  })

  try {
    const context = await fetcher.fetchPRContext(
      parseInt(config.prNumber!),
      config.repo!,
    )

    const outputFile = config.outputFile || `pr-${config.prNumber}-context.json`
    await fetcher.savePRContext(context, outputFile)

    console.error(`✅ Successfully fetched PR #${config.prNumber} context`)
    console.error(`📁 Saved to: ${outputFile}`)
    console.error(
      `📊 Summary: ${context.files.length} files, ${context.metadata.totalLinesChanged} lines changed`,
    )
    console.error(
      `🏗️ Components affected: ${context.metadata.affectedComponents.join(', ') || 'none detected'}`,
    )
  } catch (error) {
    console.error('❌ Failed to fetch GitHub PR data:', error)
    process.exit(1)
  }
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  try {
    // Initialize graceful shutdown handling
    initializeGracefulShutdown()

    // Validate environment variables at startup
    const env = validateStartupEnvironment({
      exitOnError: false,
      silent: false,
    })

    if (!env) {
      console.error(
        '\n💡 Tip: Copy .env.example to .env and configure as needed',
      )
      process.exit(1)
    }

    const { command, config } = parseArgs()

    validateConfig(command, config)

    switch (command) {
      case 'analyze':
        await executeAnalyze(config)
        break

      case 'agent':
        await executeAgent(config)
        break

      case 'fetch':
        await executeFetch(config)
        break

      case 'help':
        showHelp()
        break

      default:
        console.error(`Error: Unknown command '${command}'`)
        console.error('Run with --help to see available commands')
        process.exit(1)
    }
  } catch (error) {
    console.error('Fatal error in PR review CLI:', error)
    process.exit(1)
  }
}

// Add proper error handling for module execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}
