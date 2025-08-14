// Manual mock for fs module to work in both Vitest and Wallaby
import { vi } from 'vitest'

export const existsSync = vi.fn()
export const readFileSync = vi.fn()

export default {
  existsSync,
  readFileSync,
}
