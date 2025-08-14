// Manual mock for async-exec to work in both Vitest and Wallaby
import { vi } from 'vitest'

export const execFileWithTimeout = vi.fn()
export const execFileJson = vi.fn()
export const execFileParallel = vi.fn()
export const createTimeoutController = vi.fn()

export default {
  execFileWithTimeout,
  execFileJson,
  execFileParallel,
  createTimeoutController,
}
