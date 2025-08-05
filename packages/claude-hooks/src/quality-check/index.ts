/**
 * React App Quality Check Hook
 * Optimized for React applications with sensible defaults
 */

import path from 'path'

import type { FileToolInput } from '../types/claude.js'

import { HookExitCode } from '../types/claude.js'
import {
  parseJsonInput,
  fileExists,
  isSourceFile,
} from '../utils/file-utils.js'
import { createLogger, colors } from '../utils/logger.js'
import { createCommonIssuesChecker } from './checkers/common-issues.js'
import { createESLintChecker } from './checkers/eslint.js'
import { createPrettierChecker } from './checkers/prettier.js'
import { createTypeScriptChecker } from './checkers/typescript.js'
import { loadQualityConfig } from './config.js'
import { TypeScriptConfigCache } from './typescript-cache.js'

/**
 * Quality checker for a single file
 */
class QualityChecker {
  private filePath: string
  private fileType: string
  private errors: string[] = []
  private autofixes: string[] = []

  constructor(filePath: string) {
    this.filePath = filePath
    this.fileType = this.detectFileType(filePath)
  }

  /**
   * Detect file type from path
   */
  private detectFileType(filePath: string): string {
    if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath)) {
      return 'test'
    }
    if (/\/store\/|\/slices\/|\/reducers\//.test(filePath)) {
      return 'redux'
    }
    if (/\/components\/.*\.(tsx|jsx)$/.test(filePath)) {
      return 'component'
    }
    if (/\.(ts|tsx)$/.test(filePath)) {
      return 'typescript'
    }
    if (/\.(js|jsx)$/.test(filePath)) {
      return 'javascript'
    }
    return 'unknown'
  }

  /**
   * Run all quality checks
   */
  async checkAll(
    config: Awaited<ReturnType<typeof loadQualityConfig>>,
    log: ReturnType<typeof createLogger>,
    tsConfigCache: TypeScriptConfigCache,
  ): Promise<{ errors: string[]; autofixes: string[] }> {
    if (this.fileType === 'unknown') {
      log.info('Unknown file type, skipping detailed checks')
      return { errors: [], autofixes: [] }
    }

    // Create checkers
    const checkers = await Promise.all([
      createTypeScriptChecker(this.filePath, config, log, tsConfigCache),
      createESLintChecker(this.filePath, config, log),
      createPrettierChecker(this.filePath, config, log),
      createCommonIssuesChecker(this.filePath, config, log),
    ])

    // Run checks in parallel
    const results = await Promise.all([
      checkers[0] ? checkers[0].check() : Promise.resolve([]),
      checkers[1]
        ? checkers[1].check()
        : Promise.resolve({ errors: [], autofixes: [] }),
      checkers[2]
        ? checkers[2].check()
        : Promise.resolve({ errors: [], autofixes: [] }),
      checkers[3].check(this.fileType),
    ])

    // Collect results
    this.errors.push(...(results[0] as string[]))
    this.errors.push(...results[1].errors)
    this.autofixes.push(...results[1].autofixes)
    this.errors.push(...results[2].errors)
    this.autofixes.push(...results[2].autofixes)
    this.errors.push(...results[3])

    // Check for related tests
    await this.suggestRelatedTests(log)

    return {
      errors: this.errors,
      autofixes: this.autofixes,
    }
  }

  /**
   * Suggest related test files
   */
  private async suggestRelatedTests(
    log: ReturnType<typeof createLogger>,
  ): Promise<void> {
    if (this.fileType === 'test') {
      return
    }

    const baseName = this.filePath.replace(/\.[^.]+$/, '')
    const testExtensions = ['test.ts', 'test.tsx', 'spec.ts', 'spec.tsx']
    let hasTests = false

    for (const ext of testExtensions) {
      if (await fileExists(`${baseName}.${ext}`)) {
        hasTests = true
        log.warning(`💡 Related test found: ${path.basename(baseName)}.${ext}`)
        log.warning('   Consider running the tests to ensure nothing broke')
        break
      }
    }

    // Check __tests__ directory
    if (!hasTests) {
      const dir = path.dirname(this.filePath)
      const fileName = path.basename(this.filePath)
      const baseFileName = fileName.replace(/\.[^.]+$/, '')

      for (const ext of testExtensions) {
        if (
          await fileExists(
            path.join(dir, '__tests__', `${baseFileName}.${ext}`),
          )
        ) {
          hasTests = true
          log.warning(`💡 Related test found: __tests__/${baseFileName}.${ext}`)
          log.warning('   Consider running the tests to ensure nothing broke')
          break
        }
      }
    }

    if (!hasTests) {
      log.warning(`💡 No test file found for ${path.basename(this.filePath)}`)
      log.warning('   Consider adding tests for better code quality')
    }

    // Special reminders
    if (/\/state\/slices\//.test(this.filePath)) {
      log.warning('💡 Redux state file! Consider testing state updates')
    } else if (/\/components\//.test(this.filePath)) {
      log.warning('💡 Component file! Consider testing UI behavior')
    } else if (/\/services\//.test(this.filePath)) {
      log.warning('💡 Service file! Consider testing business logic')
    }
  }
}

/**
 * Extract file path from tool input
 */
function extractFilePath(input: FileToolInput): string | null {
  const { tool_input } = input
  if (!tool_input) {
    return null
  }

  return (
    tool_input.file_path || tool_input.path || tool_input.notebook_path || null
  )
}

/**
 * Print summary of errors and autofixes
 */
function printSummary(errors: string[], autofixes: string[]): void {
  // Show auto-fixes if any
  if (autofixes.length > 0) {
    console.error(`\n${colors.blue}═══ Auto-fixes Applied ═══${colors.reset}`)
    autofixes.forEach((fix) => {
      console.error(`${colors.green}✨${colors.reset} ${fix}`)
    })
    console.error(
      `${colors.green}Automatically fixed ${autofixes.length} issue(s) for you!${colors.reset}`,
    )
  }

  // Show errors if any
  if (errors.length > 0) {
    console.error(
      `\n${colors.blue}═══ Quality Check Summary ═══${colors.reset}`,
    )
    errors.forEach((error) => {
      console.error(`${colors.red}❌${colors.reset} ${error}`)
    })

    console.error(
      `\n${colors.red}Found ${errors.length} issue(s) that MUST be fixed!${colors.reset}`,
    )
    console.error(
      `${colors.red}════════════════════════════════════════════${colors.reset}`,
    )
    console.error(`${colors.red}❌ ALL ISSUES ARE BLOCKING ❌${colors.reset}`)
    console.error(
      `${colors.red}════════════════════════════════════════════${colors.reset}`,
    )
    console.error(
      `${colors.red}Fix EVERYTHING above until all checks are ✅ GREEN${colors.reset}`,
    )
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  // Load configuration
  const configPath = path.join(
    process.cwd(),
    '.claude/hooks/react-app/hook-config.json',
  )
  const config = await loadQualityConfig(configPath)
  const log = createLogger('INFO', config.debug)

  // Show header
  const hookVersion = config.fileConfig.version || '1.0.0'
  console.error('')
  console.error(`⚛️  React App Quality Check v${hookVersion} - Starting...`)
  console.error('────────────────────────────────────────────')

  // Debug: show loaded configuration
  log.debug(`Loaded config: ${JSON.stringify(config, null, 2)}`)

  // Parse input
  const input = await parseJsonInput<FileToolInput>()
  const filePath = input ? extractFilePath(input) : null

  if (!filePath) {
    log.warning(
      'No file path found in JSON input. Tool might not be file-related.',
    )
    log.debug(`JSON input was: ${JSON.stringify(input)}`)
    console.error(
      `\n${colors.yellow}👉 No file to check - tool may not be file-related.${colors.reset}`,
    )
    process.exit(HookExitCode.Success)
  }

  // Check if file exists
  if (!(await fileExists(filePath))) {
    log.info(`File does not exist: ${filePath} (may have been deleted)`)
    console.error(
      `\n${colors.yellow}👉 File skipped - doesn't exist.${colors.reset}`,
    )
    process.exit(HookExitCode.Success)
  }

  // For non-source files, exit successfully
  if (!isSourceFile(filePath)) {
    log.info(`Skipping non-source file: ${filePath}`)
    console.error(
      `\n${colors.yellow}👉 File skipped - not a source file.${colors.reset}`,
    )
    console.error(
      `\n${colors.green}✅ No checks needed for ${path.basename(filePath)}${colors.reset}`,
    )
    process.exit(HookExitCode.Success)
  }

  // Update header with file name
  console.error('')
  console.error(`🔍 Validating: ${path.basename(filePath)}`)
  console.error('────────────────────────────────────────────')
  log.info(`Checking: ${filePath}`)

  // Create TypeScript config cache
  const tsConfigCache = new TypeScriptConfigCache(process.cwd())

  // Run quality checks
  const checker = new QualityChecker(filePath)
  const { errors, autofixes } = await checker.checkAll(
    config,
    log,
    tsConfigCache,
  )

  // Print summary
  printSummary(errors, autofixes)

  // Separate edited file errors from other issues
  const editedFileErrors = errors.filter(
    (e) =>
      e.includes('edited file') ||
      e.includes('ESLint found issues') ||
      e.includes('Prettier formatting issues') ||
      e.includes('console statements') ||
      e.includes("'as any' usage") ||
      e.includes('were auto-fixed'),
  )

  const dependencyWarnings = errors.filter((e) => !editedFileErrors.includes(e))

  // Exit with appropriate code
  if (editedFileErrors.length > 0) {
    // Critical - blocks immediately
    console.error(
      `\n${colors.red}🛑 FAILED - Fix issues in your edited file! 🛑${colors.reset}`,
    )
    console.error(`${colors.cyan}💡 CLAUDE.md CHECK:${colors.reset}`)
    console.error(
      `${colors.cyan}  → What CLAUDE.md pattern would have prevented this?${colors.reset}`,
    )
    console.error(
      `${colors.cyan}  → Are you following JSDoc batching strategy?${colors.reset}`,
    )
    console.error(`${colors.yellow}📋 NEXT STEPS:${colors.reset}`)
    console.error(
      `${colors.yellow}  1. Fix the issues listed above${colors.reset}`,
    )
    console.error(
      `${colors.yellow}  2. The hook will run again automatically${colors.reset}`,
    )
    console.error(
      `${colors.yellow}  3. Continue with your original task once all checks pass${colors.reset}`,
    )
    process.exit(HookExitCode.QualityIssues)
  } else if (dependencyWarnings.length > 0) {
    // Warning - shows but doesn't block
    console.error(
      `\n${colors.yellow}⚠️ WARNING - Dependency issues found${colors.reset}`,
    )
    console.error(
      `${colors.yellow}These won't block your progress but should be addressed${colors.reset}`,
    )
    console.error(
      `\n${colors.green}✅ Quality check passed for ${path.basename(filePath)}${colors.reset}`,
    )

    if (autofixes.length > 0 && config.autofixSilent) {
      console.error(
        `\n${colors.yellow}👉 File quality verified. Auto-fixes applied. Continue with your task.${colors.reset}`,
      )
    } else {
      console.error(
        `\n${colors.yellow}👉 File quality verified. Continue with your task.${colors.reset}`,
      )
    }
    process.exit(HookExitCode.Success)
  } else {
    console.error(
      `\n${colors.green}✅ Quality check passed for ${path.basename(filePath)}${colors.reset}`,
    )

    if (autofixes.length > 0 && config.autofixSilent) {
      console.error(
        `\n${colors.yellow}👉 File quality verified. Auto-fixes applied. Continue with your task.${colors.reset}`,
      )
    } else {
      console.error(
        `\n${colors.yellow}👉 File quality verified. Continue with your task.${colors.reset}`,
      )
    }
    process.exit(HookExitCode.Success)
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  const log = createLogger('INFO', false)
  log.error(
    `Unhandled error: ${error instanceof Error ? error.message : 'Unknown error'}`,
  )
  process.exit(HookExitCode.GeneralError)
})

// Run main
main().catch((error) => {
  const log = createLogger('INFO', false)
  log.error(
    `Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`,
  )
  process.exit(HookExitCode.GeneralError)
})
