/**
 * Entry point for the notification hook
 */

import { main } from './notification.js'

// Run the hook
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
