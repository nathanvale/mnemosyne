/**
 * Auto-configuration loading for Claude hooks
 * Automatically loads JSON configs from .claude/hooks directory at repo root
 */

import { promises as fs } from 'fs'
import path from 'path'

import { findProjectRoot } from './config-loader.js'

/**
 * Load JSON configuration from .claude/hooks directory
 * @param hookName - Name of the hook (e.g., 'notification', 'stop', 'quality-check')
 * @returns Parsed JSON config or empty object if not found
 */
export async function loadAutoConfig<T extends Record<string, unknown>>(
  hookName: string,
): Promise<T> {
  try {
    // Find project root (where package.json is)
    const projectRoot = findProjectRoot(process.cwd())

    // Build path to config file in .claude/hooks directory
    const configPath = path.join(
      projectRoot,
      '.claude',
      'hooks',
      `${hookName}.config.json`,
    )

    // Try to load the config
    const content = await fs.readFile(configPath, 'utf8')
    const config = JSON.parse(content) as T

    // Extract settings if it exists, otherwise return the whole config
    if (config && typeof config === 'object' && 'settings' in config) {
      return (config as unknown as { settings: T }).settings
    }

    return config
  } catch {
    // Config not found or invalid - return empty object
    return {} as T
  }
}

/**
 * Get the path to a hook's config file in .claude/hooks directory
 * @param hookName - Name of the hook
 * @returns Full path to the config file
 */
export function getAutoConfigPath(hookName: string): string {
  const projectRoot = findProjectRoot(process.cwd())
  return path.join(projectRoot, '.claude', 'hooks', `${hookName}.config.json`)
}
