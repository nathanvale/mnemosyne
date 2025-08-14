/**
 * Progress indicator utilities for long-running operations
 * Provides visual feedback during CLI operations
 */

/**
 * Progress spinner characters
 */
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

/**
 * Progress indicator class for managing visual feedback
 */
export class ProgressIndicator {
  private isEnabled: boolean
  private currentSpinner?: NodeJS.Timeout
  private currentFrame = 0
  private startTime?: number

  constructor(enabled = true) {
    this.isEnabled = enabled && process.stderr.isTTY
  }

  /**
   * Start a spinner with a message
   */
  startSpinner(message: string): void {
    if (!this.isEnabled) {
      this.logStep(message)
      return
    }

    this.stopSpinner()
    this.startTime = Date.now()
    this.currentFrame = 0

    // Write initial message
    process.stderr.write(`${SPINNER_FRAMES[0]} ${message}`)

    // Start animation
    this.currentSpinner = setInterval(() => {
      this.currentFrame = (this.currentFrame + 1) % SPINNER_FRAMES.length
      // Clear line and rewrite
      process.stderr.write(`\r${SPINNER_FRAMES[this.currentFrame]} ${message}`)
    }, 80)
  }

  /**
   * Stop the current spinner
   */
  stopSpinner(success = true): void {
    if (this.currentSpinner) {
      clearInterval(this.currentSpinner)
      this.currentSpinner = undefined

      if (this.isEnabled) {
        const elapsed = this.startTime
          ? ` (${((Date.now() - this.startTime) / 1000).toFixed(1)}s)`
          : ''
        const icon = success ? '✅' : '❌'
        process.stderr.write(`\r${icon} Done${elapsed}\n`)
      }
    }
  }

  /**
   * Log a step without spinner
   */
  logStep(message: string, icon = '•'): void {
    process.stderr.write(`${icon} ${message}\n`)
  }

  /**
   * Log a success message
   */
  logSuccess(message: string): void {
    this.logStep(message, '✅')
  }

  /**
   * Log an error message
   */
  logError(message: string): void {
    this.logStep(message, '❌')
  }

  /**
   * Log a warning message
   */
  logWarning(message: string): void {
    this.logStep(message, '⚠️')
  }

  /**
   * Log info message
   */
  logInfo(message: string): void {
    this.logStep(message, 'ℹ️')
  }

  /**
   * Execute an async operation with progress indicator
   */
  async withProgress<T>(
    message: string,
    operation: () => Promise<T>,
  ): Promise<T> {
    this.startSpinner(message)
    try {
      const result = await operation()
      this.stopSpinner(true)
      return result
    } catch (error) {
      this.stopSpinner(false)
      throw error
    }
  }

  /**
   * Execute multiple operations with progress tracking
   */
  async withMultiProgress<T>(
    operations: Array<{
      message: string
      operation: () => Promise<T>
    }>,
  ): Promise<T[]> {
    const results: T[] = []
    const total = operations.length

    for (let i = 0; i < operations.length; i++) {
      const { message, operation } = operations[i]
      const progressMessage = `[${i + 1}/${total}] ${message}`

      try {
        const result = await this.withProgress(progressMessage, operation)
        results.push(result)
      } catch (error) {
        this.logError(`Failed: ${message}`)
        throw error
      }
    }

    return results
  }

  /**
   * Create a progress bar for known quantities
   */
  createProgressBar(total: number, width = 30): (current: number) => void {
    if (!this.isEnabled) {
      return () => {} // No-op for non-TTY
    }

    return (current: number) => {
      const percentage = Math.min(100, Math.round((current / total) * 100))
      const completed = Math.round((width * current) / total)
      const bar = '█'.repeat(completed) + '░'.repeat(width - completed)

      process.stderr.write(`\r[${bar}] ${percentage}% (${current}/${total})`)

      if (current >= total) {
        process.stderr.write('\n')
      }
    }
  }

  /**
   * Log a section header
   */
  logSection(title: string): void {
    const separator = '─'.repeat(50)
    process.stderr.write(`\n${separator}\n📋 ${title}\n${separator}\n`)
  }

  /**
   * Clear the current line
   */
  clearLine(): void {
    if (this.isEnabled) {
      process.stderr.write('\r\x1b[K')
    }
  }
}

/**
 * Default progress indicator instance
 */
export const progress = new ProgressIndicator()

/**
 * Create a custom progress indicator
 */
export function createProgressIndicator(enabled = true): ProgressIndicator {
  return new ProgressIndicator(enabled)
}
