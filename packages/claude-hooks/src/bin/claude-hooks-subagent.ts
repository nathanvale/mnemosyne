#!/usr/bin/env tsx

/**
 * Bin entry for subagent stop hook
 * This file will be compiled to dist/bin/claude-hooks-subagent.js
 */

import { main } from '../subagent-stop/subagent-stop.js'

// Execute the main function
main().catch((error: unknown) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
