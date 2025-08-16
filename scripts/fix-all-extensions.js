#!/usr/bin/env node

import { glob } from 'glob'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { fixEsmExtensions } from './fix-esm-extensions.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

/**
 * Fix ESM extensions for all packages in the monorepo
 * @returns {Promise<void>}
 */
async function fixAllPackages() {
  // Using console.error for CLI output (allowed by ESLint)
  console.error('🔧 Fixing ESM extensions for all packages...\n')

  // Find all package.json files in packages directory
  const packageFiles = await glob('packages/*/package.json', {
    cwd: rootDir,
    absolute: true,
  })

  let totalFilesProcessed = 0
  let totalFilesModified = 0
  let totalImportsFixed = 0
  let packagesProcessed = 0
  let packagesSkipped = 0

  for (const packageFile of packageFiles) {
    const packageDir = path.dirname(packageFile)
    const packageJson = JSON.parse(await fs.readFile(packageFile, 'utf8'))
    const packageName = packageJson.name

    // Skip packages without TypeScript build
    if (
      !packageJson.scripts?.build ||
      !packageJson.scripts.build.includes('tsc') ||
      packageJson.scripts.build.includes('echo')
    ) {
      console.error(`⏭️  Skipping ${packageName} (no TypeScript build)`)
      packagesSkipped++
      continue
    }

    const distDir = path.join(packageDir, 'dist')

    // Check if dist directory exists
    try {
      await fs.access(distDir)
    } catch {
      console.error(`⏭️  Skipping ${packageName} (no dist directory)`)
      packagesSkipped++
      continue
    }

    console.error(`📦 Processing ${packageName}...`)

    try {
      const stats = await fixEsmExtensions(distDir)
      totalFilesProcessed += stats.filesProcessed
      totalFilesModified += stats.filesModified
      totalImportsFixed += stats.importsFixed
      packagesProcessed++

      if (stats.filesModified > 0) {
        console.error(
          `   ✅ Processed ${stats.filesProcessed} files, modified ${stats.filesModified}, fixed ${stats.importsFixed} imports`,
        )
      } else {
        console.error(
          `   ✓ No changes needed (${stats.filesProcessed} files checked)`,
        )
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${packageName}:`, error.message)
    }
  }

  // Print summary
  console.error(`\n${'═'.repeat(60)}`)
  console.error('📊 Summary:')
  console.error('═'.repeat(60))
  console.error(`📦 Packages processed: ${packagesProcessed}`)
  console.error(`⏭️  Packages skipped: ${packagesSkipped}`)
  console.error(`📄 Total files processed: ${totalFilesProcessed}`)
  console.error(`📝 Total files modified: ${totalFilesModified}`)
  console.error(`🔧 Total imports fixed: ${totalImportsFixed}`)
  console.error('═'.repeat(60))

  if (totalFilesModified === 0) {
    console.error('\n✨ All packages already have correct ESM extensions!')
  } else {
    console.error('\n✅ Successfully fixed ESM extensions across all packages!')
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  fixAllPackages()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Error:', error)
      process.exit(1)
    })
}

export { fixAllPackages }
