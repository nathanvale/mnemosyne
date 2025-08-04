#!/usr/bin/env node
/**
 * Task Completion Sound Hook
 * Plays notification sounds when tasks complete successfully
 *
 * EXIT CODES:
 *   0 - Success (sound played or conditions not met)
 *   1 - Error (failed to play sound)
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// ANSI color codes
const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[0;33m',
  blue: '\x1b[0;34m',
  cyan: '\x1b[0;36m',
  reset: '\x1b[0m',
}

/**
 * Load configuration from JSON file with environment variable overrides
 * @returns {Object} Configuration object
 */
function loadConfig() {
  let fileConfig = {}

  try {
    const configPath = path.join(__dirname, 'hook-config.json')
    if (fs.existsSync(configPath)) {
      fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    }
  } catch (e) {
    // Config file not found or invalid, use defaults
  }

  return {
    // Sound settings
    playOnSuccess:
      process.env.CLAUDE_HOOKS_SOUND_SUCCESS !== 'false' &&
      (fileConfig.settings?.playOnSuccess ?? true),

    playOnWarning:
      process.env.CLAUDE_HOOKS_SOUND_WARNING === 'true' ||
      (fileConfig.settings?.playOnWarning ?? false),

    playOnError:
      process.env.CLAUDE_HOOKS_SOUND_ERROR === 'true' ||
      (fileConfig.settings?.playOnError ?? false),

    // Volume control
    volume:
      process.env.CLAUDE_HOOKS_SOUND_VOLUME ||
      (fileConfig.settings?.volume ?? 'medium'),

    // Timing
    delay:
      parseInt(process.env.CLAUDE_HOOKS_SOUND_DELAY) ||
      (fileConfig.settings?.delay ?? 0),

    cooldown:
      parseInt(process.env.CLAUDE_HOOKS_SOUND_COOLDOWN) ||
      (fileConfig.settings?.cooldown ?? 2000),

    // Filters
    minExecutionTime:
      parseInt(process.env.CLAUDE_HOOKS_MIN_EXEC_TIME) ||
      (fileConfig.filters?.minExecutionTime ?? 1000),

    // Debug
    debug: process.env.CLAUDE_HOOKS_DEBUG === 'true',

    // Store full config for access
    _fileConfig: fileConfig,
  }
}

const config = loadConfig()

// Logging functions
const log = {
  info: (msg) => console.error(`${colors.blue}[SOUND]${colors.reset} ${msg}`),
  error: (msg) => console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  success: (msg) => console.error(`${colors.green}[OK]${colors.reset} ${msg}`),
  warning: (msg) =>
    console.error(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  debug: (msg) => {
    if (config.debug) {
      console.error(`${colors.cyan}[DEBUG]${colors.reset} ${msg}`)
    }
  },
}

// Cooldown tracking
let lastSoundTime = 0

/**
 * Check if we're in quiet hours
 * @returns {boolean} True if in quiet hours
 */
function isQuietHours() {
  const quietConfig = config._fileConfig.filters?.quietHours
  if (!quietConfig?.enabled) return false

  const now = new Date()
  const currentTime = now.getHours() * 100 + now.getMinutes()

  const startTime = parseInt(quietConfig.start.replace(':', ''))
  const endTime = parseInt(quietConfig.end.replace(':', ''))

  if (startTime > endTime) {
    // Crosses midnight (e.g., 22:00 to 08:00)
    return currentTime >= startTime || currentTime <= endTime
  } else {
    // Same day (e.g., 13:00 to 17:00)
    return currentTime >= startTime && currentTime <= endTime
  }
}

/**
 * Check cooldown period
 * @returns {boolean} True if cooldown period has passed
 */
function checkCooldown() {
  const now = Date.now()
  const timeSinceLastSound = now - lastSoundTime

  if (timeSinceLastSound < config.cooldown) {
    log.debug(
      `Cooldown active: ${config.cooldown - timeSinceLastSound}ms remaining`,
    )
    return false
  }

  return true
}

/**
 * Play system sound
 * @param {string} soundFile - Path to sound file
 * @returns {boolean} True if sound played successfully
 */
function playSound(soundFile) {
  try {
    // Check if sound file exists
    if (!fs.existsSync(soundFile)) {
      log.debug(`Sound file not found: ${soundFile}`)
      return false
    }

    // Play sound using afplay (macOS)
    if (config.delay > 0) {
      log.debug(`Waiting ${config.delay}ms before playing sound`)
      setTimeout(() => {
        execSync(`afplay "${soundFile}"`, { stdio: 'ignore' })
      }, config.delay)
    } else {
      execSync(`afplay "${soundFile}"`, { stdio: 'ignore' })
    }

    lastSoundTime = Date.now()
    log.success(`Played sound: ${path.basename(soundFile)}`)
    return true
  } catch (error) {
    log.debug(`Failed to play sound: ${error.message}`)
    return false
  }
}

/**
 * Determine sound type based on tool result
 * @param {Object} input - Tool input object
 * @returns {string|null} Sound type or null
 */
function determineSoundType(input) {
  const { tool_name, tool_result } = input

  // Skip excluded tools
  const excludeTools = config._fileConfig.filters?.excludeTools || []
  if (excludeTools.includes(tool_name)) {
    log.debug(`Tool ${tool_name} is excluded from sound notifications`)
    return null
  }

  // Check for error indicators
  if (tool_result) {
    const resultStr = JSON.stringify(tool_result).toLowerCase()

    if (
      resultStr.includes('error') ||
      resultStr.includes('failed') ||
      resultStr.includes('❌')
    ) {
      return config.playOnError ? 'error' : null
    }

    if (resultStr.includes('warning') || resultStr.includes('⚠️')) {
      return config.playOnWarning ? 'warning' : null
    }
  }

  // Check for success indicators
  const successTools = config._fileConfig.triggers?.successTools || []
  if (successTools.includes(tool_name)) {
    return config.playOnSuccess ? 'success' : null
  }

  // Check completion patterns in tool result
  if (tool_result) {
    const patterns = config._fileConfig.triggers?.completionPatterns || []
    const resultStr = JSON.stringify(tool_result).toLowerCase()

    for (const pattern of patterns) {
      if (resultStr.includes(pattern.toLowerCase())) {
        return config.playOnSuccess ? 'success' : null
      }
    }
  }

  return null
}

/**
 * Parse JSON input from stdin
 * @returns {Promise<Object>} Parsed JSON object
 */
async function parseJsonInput() {
  let inputData = ''

  // Read from stdin
  for await (const chunk of process.stdin) {
    inputData += chunk
  }

  if (!inputData.trim()) {
    log.debug('No JSON input provided - hook may be called for non-tool events')
    return null
  }

  try {
    return JSON.parse(inputData)
  } catch (error) {
    log.debug(`Failed to parse JSON input: ${error.message}`)
    return null
  }
}

/**
 * Main entry point
 * @returns {Promise<void>}
 */
async function main() {
  log.debug('🔊 Task Completion Sound Hook - Starting...')

  // Check quiet hours
  if (isQuietHours()) {
    log.debug('Quiet hours active - sounds disabled')
    process.exit(0)
  }

  // Check cooldown
  if (!checkCooldown()) {
    log.debug('Cooldown active - skipping sound')
    process.exit(0)
  }

  // Parse input
  const input = await parseJsonInput()
  if (!input) {
    log.debug('No valid input - exiting silently')
    process.exit(0)
  }

  log.debug(`Processing tool: ${input.tool_name}`)

  // Determine what sound to play
  const soundType = determineSoundType(input)
  if (!soundType) {
    log.debug('No sound notification needed for this tool/result')
    process.exit(0)
  }

  // Get sound configuration
  const soundConfig = config._fileConfig.sounds?.[soundType]
  if (!soundConfig?.enabled) {
    log.debug(`Sound type '${soundType}' is disabled`)
    process.exit(0)
  }

  // Try to play the sound
  let soundPlayed = false

  // Try primary sound file
  if (soundConfig.file) {
    soundPlayed = playSound(soundConfig.file)
  }

  // Try fallback if primary failed
  if (!soundPlayed && soundConfig.fallback) {
    log.debug('Trying fallback sound...')
    soundPlayed = playSound(soundConfig.fallback)
  }

  if (!soundPlayed) {
    log.warning(`Failed to play ${soundType} sound notification`)
    process.exit(1)
  }

  process.exit(0)
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log.error(`Unhandled error: ${error.message}`)
  process.exit(1)
})

// Run main
main().catch((error) => {
  log.error(`Fatal error: ${error.message}`)
  process.exit(1)
})
