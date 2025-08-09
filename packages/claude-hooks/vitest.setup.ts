/**
 * Vitest setup file
 * Loads .env.example for tests to ensure test-safe values are used
 */

import * as dotenv from 'dotenv'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { findMonorepoRoot } from './src/utils/env-loader.js'

// Get the monorepo root directory using the shared root resolver
const rootDir = findMonorepoRoot()
const envExamplePath = join(rootDir, '.env.example')

// Load .env.example with override to replace any existing environment variables
// The override: true flag ensures ALL env vars are replaced with test values
if (existsSync(envExamplePath)) {
  const result = dotenv.config({ path: envExamplePath, override: true })

  if (result.error) {
    console.error('[vitest-setup] Failed to load .env.example:', result.error)
  } else {
    // Verify we're using test values, not real API keys
    const openaiKey = process.env.OPENAI_API_KEY
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY

    if (openaiKey?.startsWith('sk-') || elevenLabsKey?.startsWith('sk_')) {
      console.error(
        '[vitest-setup] WARNING: Real API key detected! Tests should use .env.example values.',
      )
    }
  }
} else {
  console.warn('[vitest-setup] .env.example not found at:', envExamplePath)
}

// Ensure NODE_ENV is set to test
process.env.NODE_ENV = 'test'
