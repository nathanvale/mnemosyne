import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import StackTracey from 'stacktracey'

// Get the project root directory
const PROJECT_ROOT = resolve(process.cwd())

export interface CallSite {
  file: string
  line: number
  column: number
}

/**
 * Extract callsite information from the current stack trace
 * @param skipFrames Number of frames to skip (default: 2 to skip this function and the logger)
 * @returns CallSite information or null if not available
 */
export function getCallSite(skipFrames: number = 2): CallSite | null {
  try {
    const stack = new StackTracey()

    // Skip the specified number of frames to get to the actual caller
    const frame = stack.items[skipFrames]

    if (!frame || !frame.file || !frame.line) {
      return null
    }

    // Convert file path to relative path from project root
    let filePath = frame.file

    // Handle file:// URLs
    if (filePath.startsWith('file://')) {
      filePath = fileURLToPath(filePath)
    }

    // Make path relative to project root
    if (filePath.startsWith(PROJECT_ROOT)) {
      filePath = filePath.slice(PROJECT_ROOT.length + 1)
    }

    return {
      file: filePath,
      line: frame.line || 0,
      column: frame.column || 0,
    }
  } catch {
    // If stacktrace extraction fails, return null
    return null
  }
}
