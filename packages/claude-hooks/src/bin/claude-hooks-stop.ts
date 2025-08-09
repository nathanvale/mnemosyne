#!/usr/bin/env tsx

/**
 * Bin entry for stop hook
 * This file will be compiled to dist/bin/claude-hooks-stop.js
 */

// Load environment variables before any other imports
import '../utils/env-loader.js'
import { main } from '../stop/stop.js'

// Execute the main function
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
