#!/usr/bin/env node
/**
 * Test script to verify LogManager saves logs to correct location
 */

import { existsSync, readFileSync } from 'fs'
import * as path from 'path'

// Simulate the LogManager's getProjectRoot logic
function getProjectRoot() {
  let currentDir = process.cwd()

  // Traverse up to find monorepo root
  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, 'package.json')

    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
        if (packageJson.name === 'mnemosyne') {
          return currentDir
        }
      } catch {
        // Continue searching
      }
    }

    currentDir = path.dirname(currentDir)
  }

  throw new Error('Could not find monorepo root')
}

console.log('Testing LogManager path resolution...')
console.log('Current working directory:', process.cwd())

try {
  const projectRoot = getProjectRoot()
  console.log('✅ Found monorepo root:', projectRoot)
  console.log(
    '📁 Logs will be saved to:',
    path.join(projectRoot, '.logs/pr-reviews'),
  )

  // Verify it's the correct location
  const expectedRoot = '/Users/nathanvale/code/mnemosyne'
  if (projectRoot === expectedRoot) {
    console.log('✅ Path resolution is CORRECT!')
  } else {
    console.log('❌ Path resolution is WRONG!')
    console.log('   Expected:', expectedRoot)
    console.log('   Got:', projectRoot)
  }
} catch (error) {
  console.error('❌ Error:', error.message)
}
