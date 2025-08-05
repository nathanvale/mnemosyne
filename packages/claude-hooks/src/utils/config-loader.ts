/**
 * Configuration loading utilities
 */

import { promises as fs, statSync } from 'fs'
import path from 'path'

/**
 * Load JSON configuration file with environment variable overrides
 */
export async function loadConfig<T extends Record<string, unknown>>(
  configPath: string,
  envOverrides: Record<string, (value: string | undefined) => unknown> = {},
): Promise<T | null> {
  let fileConfig: T | null = null

  // Try to load file config
  try {
    const content = await fs.readFile(configPath, 'utf8')
    fileConfig = JSON.parse(content) as T
  } catch {
    // Config file not found or invalid
    return null
  }

  // Apply environment variable overrides
  const config = { ...fileConfig }

  for (const [envKey, transformer] of Object.entries(envOverrides)) {
    const envValue = process.env[envKey]
    if (envValue !== undefined) {
      const transformed = transformer(envValue)
      if (transformed !== undefined) {
        // Apply the transformed value to the config
        // This is a simplified version - in real implementation
        // we'd need to handle nested paths
        Object.assign(config, transformed)
      }
    }
  }

  return config
}

/**
 * Find project root by looking for package.json
 */
export function findProjectRoot(startPath: string): string {
  let currentPath = startPath
  while (currentPath !== '/') {
    try {
      const stat = statSync(path.join(currentPath, 'package.json'))
      if (stat.isFile()) {
        return currentPath
      }
    } catch {
      // Continue searching
    }
    currentPath = path.dirname(currentPath)
  }
  return process.cwd()
}

/**
 * Parse boolean environment variable
 */
export function parseBoolean(
  value: string | undefined,
  defaultValue = false,
): boolean {
  if (value === undefined) return defaultValue
  return value !== 'false'
}

/**
 * Parse integer environment variable
 */
export function parseInteger(
  value: string | undefined,
  defaultValue = 0,
): number {
  if (value === undefined) return defaultValue
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}
