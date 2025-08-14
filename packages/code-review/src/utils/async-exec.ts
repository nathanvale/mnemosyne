import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'

/**
 * Promisified version of execFile for async execution
 */
const execFileAsync = promisify(execFileCallback)

/**
 * Options for executing a file asynchronously
 */
export interface ExecFileOptions {
  encoding?: BufferEncoding
  maxBuffer?: number
  timeout?: number
  cwd?: string
  env?: NodeJS.ProcessEnv
  signal?: AbortSignal
}

/**
 * Default options for execFile
 */
const DEFAULT_OPTIONS: ExecFileOptions = {
  encoding: 'utf-8',
  maxBuffer: 10 * 1024 * 1024, // 10MB
  timeout: 120000, // 2 minutes
}

/**
 * Execute a file asynchronously with proper error handling and timeout support
 *
 * @param command The command to execute
 * @param args Arguments to pass to the command
 * @param options Execution options
 * @returns Promise resolving to the command output
 * @throws Error if the command fails or times out
 */
export async function execFileWithTimeout(
  command: string,
  args: string[],
  options: ExecFileOptions = {},
): Promise<string> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  try {
    const { stdout, stderr } = await execFileAsync(
      command,
      args,
      mergedOptions as unknown as Parameters<typeof execFileAsync>[2],
    )

    // Log stderr as warning if present but don't fail
    if (stderr && stderr.toString().trim()) {
      console.error(`Warning from ${command}:`, stderr.toString())
    }

    return stdout.toString()
  } catch (error: unknown) {
    // Enhanced error message with command details
    const commandStr = `${command} ${args.join(' ')}`
    const err = error as NodeJS.ErrnoException

    if (err.code === 'ETIMEDOUT') {
      throw new Error(
        `Command timed out after ${mergedOptions.timeout}ms: ${commandStr}`,
      )
    }

    if (err.code === 'ENOENT') {
      throw new Error(
        `Command not found: ${command}. Make sure it's installed and in your PATH.`,
      )
    }

    // Include stderr in error message if available
    const errorMessage =
      (err as unknown as { stderr?: string }).stderr ||
      err.message ||
      'Unknown error'
    throw new Error(`Command failed: ${commandStr}\n${errorMessage}`)
  }
}

/**
 * Execute a command and parse the JSON output
 *
 * @param command The command to execute
 * @param args Arguments to pass to the command
 * @param options Execution options
 * @returns Promise resolving to the parsed JSON
 */
export async function execFileJson<T = unknown>(
  command: string,
  args: string[],
  options: ExecFileOptions = {},
): Promise<T> {
  const output = await execFileWithTimeout(command, args, options)

  try {
    return JSON.parse(output)
  } catch {
    throw new Error(
      `Failed to parse JSON output from command: ${command} ${args.join(' ')}\n` +
        `Output: ${output.substring(0, 200)}...`,
    )
  }
}

/**
 * Execute multiple commands in parallel with proper error handling
 *
 * @param commands Array of command configurations
 * @returns Promise resolving to array of outputs
 */
export async function execFileParallel(
  commands: Array<{
    command: string
    args: string[]
    options?: ExecFileOptions
  }>,
): Promise<string[]> {
  return Promise.all(
    commands.map(({ command, args, options }) =>
      execFileWithTimeout(command, args, options),
    ),
  )
}

/**
 * Create an AbortController with timeout for command cancellation
 *
 * @param timeoutMs Timeout in milliseconds
 * @returns AbortController instance
 */
export function createTimeoutController(timeoutMs: number): AbortController {
  const controller = new AbortController()

  setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  return controller
}

/**
 * Global signal handler for graceful shutdown
 */
class SignalHandler {
  private activeControllers = new Set<AbortController>()
  private cleanup: (() => Promise<void>)[] = []
  private initialized = false

  /**
   * Initialize signal handlers for graceful shutdown
   */
  init(): void {
    if (this.initialized) return
    this.initialized = true

    // Handle SIGTERM and SIGINT (Ctrl+C)
    process.once('SIGTERM', () => this.handleShutdown('SIGTERM'))
    process.once('SIGINT', () => this.handleShutdown('SIGINT'))

    // Handle uncaught exceptions gracefully
    process.once('uncaughtException', (error) => {
      console.error('Uncaught exception during shutdown:', error)
      this.handleShutdown('uncaughtException')
    })

    // Handle unhandled promise rejections
    process.once('unhandledRejection', (reason) => {
      console.error('Unhandled promise rejection during shutdown:', reason)
      this.handleShutdown('unhandledRejection')
    })
  }

  /**
   * Register an AbortController for graceful cancellation
   */
  registerController(controller: AbortController): void {
    this.activeControllers.add(controller)
  }

  /**
   * Unregister an AbortController when operation completes
   */
  unregisterController(controller: AbortController): void {
    this.activeControllers.delete(controller)
  }

  /**
   * Register a cleanup function to run on shutdown
   */
  registerCleanup(cleanup: () => Promise<void>): void {
    this.cleanup.push(cleanup)
  }

  /**
   * Handle graceful shutdown
   */
  private async handleShutdown(signal: string): Promise<void> {
    console.error(`\n🛑 Received ${signal}, shutting down gracefully...`)

    // Abort all active operations
    console.error('📋 Cancelling active operations...')
    for (const controller of this.activeControllers) {
      try {
        controller.abort()
      } catch (error) {
        console.error('Warning: Failed to abort operation:', error)
      }
    }

    // Run cleanup functions
    console.error('🧹 Running cleanup functions...')
    for (const cleanupFn of this.cleanup) {
      try {
        await cleanupFn()
      } catch (error) {
        console.error('Warning: Cleanup function failed:', error)
      }
    }

    console.error('✅ Graceful shutdown completed')
    process.exit(signal === 'SIGINT' ? 130 : 1)
  }
}

// Global instance
const globalSignalHandler = new SignalHandler()

/**
 * Initialize graceful shutdown handling
 * Call this once at the start of your application
 */
export function initializeGracefulShutdown(): void {
  globalSignalHandler.init()
}

/**
 * Execute a command with graceful shutdown support
 * Automatically registers the AbortController for cancellation on shutdown
 *
 * @param command The command to execute
 * @param args Arguments to pass to the command
 * @param options Execution options
 * @returns Promise resolving to the command output
 */
export async function execFileWithGracefulShutdown(
  command: string,
  args: string[],
  options: ExecFileOptions = {},
): Promise<string> {
  const controller = new AbortController()
  globalSignalHandler.registerController(controller)

  try {
    const result = await execFileWithTimeout(command, args, {
      ...options,
      signal: controller.signal,
    })
    return result
  } finally {
    globalSignalHandler.unregisterController(controller)
  }
}

/**
 * Register a cleanup function to be called during graceful shutdown
 */
export function registerShutdownCleanup(cleanup: () => Promise<void>): void {
  globalSignalHandler.registerCleanup(cleanup)
}
