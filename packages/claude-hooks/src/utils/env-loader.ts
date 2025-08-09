/**
 * Environment variable loader for Claude Hooks
 * Automatically loads .env files from monorepo root with test mode support
 */

import * as dotenv from 'dotenv'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Result of environment loading operation
 */
export interface EnvLoadResult {
  /** Path to the loaded environment file */
  path: string
  /** Whether the environment was loaded successfully */
  loaded: boolean
  /** Whether test mode is active */
  isTestMode: boolean
  /** Whether fallback to .env.example was used */
  fallbackUsed?: boolean
  /** Error message if loading failed */
  error?: string
}

/**
 * Find the monorepo root directory by looking for marker files
 */
export function findMonorepoRoot(): string {
  // Start from the current file's directory
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  let currentDir = __dirname

  // Look for monorepo markers
  const markers = ['pnpm-workspace.yaml', 'turbo.json', '.git']

  // Travel up the directory tree
  while (currentDir !== '/') {
    for (const marker of markers) {
      if (existsSync(join(currentDir, marker))) {
        return currentDir
      }
    }
    const parentDir = dirname(currentDir)
    if (parentDir === currentDir) {
      // Reached filesystem root
      break
    }
    currentDir = parentDir
  }

  // Fallback to current working directory
  return process.cwd()
}

/**
 * Detect if we're running in test mode
 */
export function isTestMode(): boolean {
  return (
    process.env.NODE_ENV === 'test' ||
    process.env.VITEST === 'true' ||
    Boolean(process.env.VITEST_WORKER_ID) ||
    Boolean(process.env.JEST_WORKER_ID)
  )
}

/**
 * Load environment variables from .env or .env.example
 */
export function loadEnv(): EnvLoadResult {
  const rootDir = findMonorepoRoot()
  const envPath = join(rootDir, '.env')
  const examplePath = join(rootDir, '.env.example')
  const testMode = isTestMode()

  // Determine which file to load
  let pathToLoad: string
  let fallbackUsed = false

  if (testMode && existsSync(examplePath)) {
    // In test mode, prefer .env.example
    pathToLoad = examplePath
  } else if (existsSync(envPath)) {
    // In production, use .env
    pathToLoad = envPath
  } else if (existsSync(examplePath)) {
    // Fall back to .env.example if .env doesn't exist
    pathToLoad = examplePath
    fallbackUsed = true
  } else {
    // Neither file exists
    return {
      path: envPath,
      loaded: false,
      isTestMode: testMode,
      error: `No environment file found. Expected ${envPath} or ${examplePath}`,
    }
  }

  // Load the environment file
  try {
    dotenv.config({ path: pathToLoad })
    return {
      path: pathToLoad,
      loaded: true,
      isTestMode: testMode,
      fallbackUsed,
    }
  } catch (error) {
    return {
      path: pathToLoad,
      loaded: false,
      isTestMode: testMode,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Substitute environment variables in a string using ${VAR_NAME} syntax
 */
export function substituteEnvVars(value: string): string {
  return value.replace(/\$\{([^}]+)\}/g, (match, varName) => {
    return process.env[varName] || match
  })
}

/**
 * Load environment variables on module import
 * This ensures env vars are available before any other code runs
 */
const result = loadEnv()

// Log loading result in debug mode
if (process.env.CLAUDE_HOOKS_DEBUG === 'true') {
  // Use console.error for debug output (allowed by ESLint)
  console.error('[env-loader] Environment loading result:', {
    path: result.path,
    loaded: result.loaded,
    isTestMode: result.isTestMode,
    fallbackUsed: result.fallbackUsed,
    error: result.error,
  })
}

export default result
