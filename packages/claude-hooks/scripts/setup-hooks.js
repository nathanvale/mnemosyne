#!/usr/bin/env node

/**
 * Setup script for Claude hooks
 * Creates symlinks from .claude/hooks to the built hook files
 */

import { promises as fs } from 'fs'
import { platform } from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packageRoot = path.resolve(__dirname, '..')
const projectRoot = path.resolve(packageRoot, '..', '..')

// Hook configurations
const HOOKS = [
  {
    name: 'quality-check',
    source: path.join(packageRoot, 'hooks', 'quality-check.cjs'),
    target: path.join(
      projectRoot,
      '.claude',
      'hooks',
      'react-app',
      'quality-check.cjs',
    ),
  },
  {
    name: 'sound-notification',
    source: path.join(packageRoot, 'hooks', 'sound-notification.cjs'),
    target: path.join(
      projectRoot,
      '.claude',
      'hooks',
      'task-completion',
      'sound-notification.cjs',
    ),
  },
]

/**
 * Check if a file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Create a symlink with cross-platform support
 */
async function createSymlink(source, target) {
  // Remove existing symlink/file if it exists
  try {
    const stats = await fs.lstat(target)
    if (stats.isSymbolicLink() || stats.isFile()) {
      await fs.unlink(target)
    }
  } catch {
    // File doesn't exist, that's fine
  }

  // Ensure target directory exists
  const targetDir = path.dirname(target)
  await fs.mkdir(targetDir, { recursive: true })

  // Create symlink
  try {
    // On Windows, we need to specify the type
    const type = platform() === 'win32' ? 'file' : undefined
    await fs.symlink(source, target, type)
    return true
  } catch (error) {
    // Fallback: copy the file if symlink fails (e.g., on Windows without admin rights)
    console.warn(
      `⚠️  Failed to create symlink, copying file instead: ${error.message}`,
    )
    await fs.copyFile(source, target)
    // Make it executable
    if (platform() !== 'win32') {
      await fs.chmod(target, 0o755)
    }
    return false
  }
}

/**
 * Main setup function
 */
async function setupHooks() {
  console.log('🔧 Setting up Claude hooks...\n')

  // Check if hooks are built
  const hooksBuilt = await fileExists(path.join(packageRoot, 'hooks'))
  if (!hooksBuilt) {
    console.error('❌ Hooks not built yet. Please run "pnpm run build" first.')
    process.exit(1)
  }

  let successCount = 0
  let symlinkCount = 0

  for (const hook of HOOKS) {
    process.stdout.write(`📎 Setting up ${hook.name}... `)

    // Check if source file exists
    if (!(await fileExists(hook.source))) {
      console.error(`\n❌ Source file not found: ${hook.source}`)
      console.error('   Please run "pnpm run build" first.')
      continue
    }

    // Create symlink
    const isSymlink = await createSymlink(hook.source, hook.target)
    if (isSymlink) {
      console.log('✓ (symlinked)')
      symlinkCount++
    } else {
      console.log('✓ (copied)')
    }
    successCount++
  }

  console.log('\n📊 Summary:')
  console.log(`   ✓ ${successCount}/${HOOKS.length} hooks set up successfully`)
  if (symlinkCount < successCount) {
    console.log(
      `   ⚠️  ${successCount - symlinkCount} hooks were copied instead of symlinked`,
    )
    console.log(
      '      (This is normal on Windows or without proper permissions)',
    )
  }

  // Verify setup
  console.log('\n🔍 Verifying setup...')
  let allGood = true

  for (const hook of HOOKS) {
    const exists = await fileExists(hook.target)
    if (exists) {
      console.log(`   ✓ ${hook.name} is accessible`)
    } else {
      console.log(`   ❌ ${hook.name} is NOT accessible`)
      allGood = false
    }
  }

  if (allGood) {
    console.log('\n✅ Claude hooks are ready to use!')
    console.log('   The hooks will run automatically when you use Claude Code.')
  } else {
    console.error('\n❌ Some hooks are not properly set up.')
    console.error('   Please check the errors above and try again.')
    process.exit(1)
  }
}

// Run setup
setupHooks().catch((error) => {
  console.error('❌ Setup failed:', error)
  process.exit(1)
})
