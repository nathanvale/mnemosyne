#!/usr/bin/env tsx

/**
 * Bin entry for notification hook
 * This file will be compiled to dist/bin/claude-hooks-notification.js
 */

import { main } from '../notification/notification.js'

// Execute the main function
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
