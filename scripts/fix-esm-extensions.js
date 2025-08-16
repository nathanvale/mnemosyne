#!/usr/bin/env node

/**
 * ES Module Extension Fixer
 *
 * This script automatically adds .js extensions to relative imports in compiled
 * JavaScript output, solving Node.js ES module compatibility issues.
 *
 * Usage:
 *   # Fix extensions in a specific directory
 *   node scripts/fix-esm-extensions.js dist
 *
 *   # Fix extensions in all packages (monorepo)
 *   pnpm build:fix-extensions
 *
 *   # Use in package.json build script
 *   "build": "tsc && node ../../scripts/fix-esm-extensions.js dist"
 *
 * What it does:
 * - Finds all .js files in the specified directory
 * - Adds .js extensions to relative imports/exports
 * - Preserves existing .json, .mjs, .cjs extensions
 * - Ignores node_modules and package imports
 * - Handles static imports, dynamic imports, and re-exports
 *
 * @module fix-esm-extensions
 */

import { glob } from 'glob'
import { promises as fs } from 'node:fs'

/**
 * Fixes ES module imports by adding .js extensions where needed
 * @param {string} distDir - The directory containing JavaScript files to process
 * @returns {Promise<{filesProcessed: number, filesModified: number, importsFixed: number}>}
 */
export async function fixEsmExtensions(distDir) {
  // Find all JavaScript files in the dist directory
  const files = await glob(`${distDir}/**/*.js`)

  let filesProcessed = 0
  let filesModified = 0
  let importsFixed = 0

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8')
    let modified = content
    let fileImportsFixed = 0

    // Regular expression patterns for different import/export types
    // Pattern explanation:
    // - Matches import/export statements
    // - Captures relative paths starting with './' or '../'
    // - Excludes paths that already have .js or .json extensions
    // - Handles single and double quotes, including template literals

    // Fix static imports (including side-effect imports)
    modified = modified.replace(
      /(\bimport\s+(?:(?:[\w{},*\s]+\s+from\s+)?)?['"`])(\.[^'"`]+?)(?<!\.js)(?<!\.json)(?<!\.mjs)(?<!\.cjs)(['"`])/g,
      (match, prefix, importPath, suffix) => {
        // Skip if it's a directory import (ends with /)
        if (importPath.endsWith('/')) {
          return match
        }
        fileImportsFixed++
        return `${prefix}${importPath}.js${suffix}`
      },
    )

    // Fix dynamic imports
    modified = modified.replace(
      /(\bimport\s*\(\s*['"`])(\.[^'"`]+?)(?<!\.js)(?<!\.json)(?<!\.mjs)(?<!\.cjs)(['"`]\s*\))/g,
      (match, prefix, importPath, suffix) => {
        if (importPath.endsWith('/')) {
          return match
        }
        fileImportsFixed++
        return `${prefix}${importPath}.js${suffix}`
      },
    )

    // Fix export from statements (including export *)
    modified = modified.replace(
      /(\bexport\s+(?:(?:[\w{},*\s]+\s+)?)?from\s+['"`])(\.[^'"`]+?)(?<!\.js)(?<!\.json)(?<!\.mjs)(?<!\.cjs)(['"`])/g,
      (match, prefix, importPath, suffix) => {
        if (importPath.endsWith('/')) {
          return match
        }
        fileImportsFixed++
        return `${prefix}${importPath}.js${suffix}`
      },
    )

    // Only write if changes were made
    if (modified !== content) {
      await fs.writeFile(file, modified, 'utf8')
      filesModified++
      importsFixed += fileImportsFixed
    }

    filesProcessed++
  }

  const stats = {
    filesProcessed,
    filesModified,
    importsFixed,
  }

  // Log results if running as CLI
  if (import.meta.url === `file://${process.argv[1]}`) {
    // Using console.error to output to stderr (allowed by ESLint)
    console.error(`✅ Processed ${filesProcessed} files`)
    console.error(`📝 Modified ${filesModified} files`)
    console.error(`🔧 Fixed ${importsFixed} imports`)
  }

  return stats
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const distDir = process.argv[2] || 'dist'

  // Check if directory exists
  try {
    await fs.access(distDir)
  } catch {
    console.error(`❌ Directory not found: ${distDir}`)
    process.exit(1)
  }

  fixEsmExtensions(distDir)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error fixing extensions:', err)
      process.exit(1)
    })
}
