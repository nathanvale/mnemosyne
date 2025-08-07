#!/usr/bin/env node

import { loadAutoConfig } from './packages/claude-hooks/src/utils/auto-config.js'
import { existsSync, readFileSync } from 'fs'
import path from 'path'
import { findProjectRoot } from './packages/claude-hooks/src/utils/config-loader.js'

// Log the config path it's trying to use
const root = findProjectRoot(process.cwd())
const configPath = path.join(root, '.claude', 'hooks', 'stop.config.json')

console.log('Looking for config at:', configPath)
console.log('Config file exists:', existsSync(configPath))

if (existsSync(configPath)) {
  const content = readFileSync(configPath, 'utf8')
  console.log('\nRaw config file content:')
  console.log(content)
}

// Load the actual config
const config = await loadAutoConfig('stop')
console.log('\nLoaded config object:', JSON.stringify(config, null, 2))

// Check what the stop hook will get
console.log('\n=== Stop Hook Config Processing ===')
const jsonConfig = config
const hookConfig = {
  ...jsonConfig,
  chat: process.argv.includes('--chat') || jsonConfig.chat,
  speak: process.argv.includes('--speak') || jsonConfig.speak,
  debug: process.argv.includes('--debug') || jsonConfig.debug,
}

console.log('\nFinal hook config:', JSON.stringify(hookConfig, null, 2))
