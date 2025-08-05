/**
 * Logging utilities with colored output
 */

// ANSI color codes
export const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[0;33m',
  blue: '\x1b[0;34m',
  cyan: '\x1b[0;36m',
  reset: '\x1b[0m',
} as const

export interface Logger {
  info: (msg: string) => void
  error: (msg: string) => void
  success: (msg: string) => void
  warning: (msg: string) => void
  debug: (msg: string) => void
}

/**
 * Create a logger with optional debug mode
 */
export function createLogger(prefix: string, debug = false): Logger {
  return {
    info: (msg: string) =>
      console.error(`${colors.blue}[${prefix}]${colors.reset} ${msg}`),
    error: (msg: string) =>
      console.error(`${colors.red}[ERROR]${colors.reset} ${msg}`),
    success: (msg: string) =>
      console.error(`${colors.green}[OK]${colors.reset} ${msg}`),
    warning: (msg: string) =>
      console.error(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
    debug: (msg: string) => {
      if (debug) {
        console.error(`${colors.cyan}[DEBUG]${colors.reset} ${msg}`)
      }
    },
  }
}
