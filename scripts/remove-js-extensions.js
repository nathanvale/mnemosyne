#!/usr/bin/env node

/**
 * Remove .js Extensions from TypeScript Source Files
 *
 * This script removes unnecessary .js extensions from import/export statements
 * in TypeScript source files. These extensions should not be in TypeScript
 * source - they're only needed in compiled JavaScript output.
 *
 * Usage:
 *   node scripts/remove-js-extensions.js
 */

import { glob } from 'glob'
import { promises as fs } from 'node:fs'

/**
 * Remove .js extensions from TypeScript source files
 * @returns {Promise<{filesProcessed: number, filesModified: number, extensionsRemoved: number}>}
 */
async function removeJsExtensions() {
  // Find all TypeScript files
  const files = await glob('**/*.{ts,tsx}', {
    ignore: ['node_modules/**', 'dist/**', '.next/**', 'build/**', '*.d.ts'],
  })

  let filesProcessed = 0
  let filesModified = 0
  let extensionsRemoved = 0

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8')
    let modified = content
    let fileExtensionsRemoved = 0

    // Remove .js from relative imports/exports
    // Pattern matches: from './something.js' or from "../something.js"
    modified = modified.replace(
      /(from\s+['"])(\.[^'"]+?)\.js(['"'])/g,
      (match, prefix, importPath, suffix) => {
        fileExtensionsRemoved++
        return `${prefix}${importPath}${suffix}`
      },
    )

    // Remove .js from dynamic imports
    modified = modified.replace(
      /(import\s*\(\s*['"])(\.[^'"]+?)\.js(['"']\s*\))/g,
      (match, prefix, importPath, suffix) => {
        fileExtensionsRemoved++
        return `${prefix}${importPath}${suffix}`
      },
    )

    // Remove .js from export statements
    modified = modified.replace(
      /(export\s+(?:.*?\s+)?from\s+['"])(\.[^'"]+?)\.js(['"'])/g,
      (match, prefix, importPath, suffix) => {
        fileExtensionsRemoved++
        return `${prefix}${importPath}${suffix}`
      },
    )

    // Only write if changes were made
    if (modified !== content) {
      await fs.writeFile(file, modified, 'utf8')
      filesModified++
      extensionsRemoved += fileExtensionsRemoved
      console.error(
        `✅ Fixed ${file} (removed ${fileExtensionsRemoved} extensions)`,
      )
    }

    filesProcessed++
  }

  return {
    filesProcessed,
    filesModified,
    extensionsRemoved,
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  console.error('🔍 Removing .js extensions from TypeScript source files...\n')

  removeJsExtensions()
    .then((stats) => {
      console.error(`\n${'═'.repeat(60)}`)
      console.error('📊 Summary:')
      console.error('═'.repeat(60))
      console.error(`📄 Files processed: ${stats.filesProcessed}`)
      console.error(`📝 Files modified: ${stats.filesModified}`)
      console.error(`🔧 Extensions removed: ${stats.extensionsRemoved}`)
      console.error('═'.repeat(60))

      if (stats.filesModified === 0) {
        console.error('\n✨ All TypeScript files are already clean!')
      } else {
        console.error(
          '\n✅ Successfully removed .js extensions from TypeScript files!',
        )
        console.error(
          '📌 Remember: .js extensions are only added during build by fix-esm-extensions.js',
        )
      }

      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error:', error)
      process.exit(1)
    })
}

export { removeJsExtensions }
