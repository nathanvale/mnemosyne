// Manual mock for fs/promises module to work in both Vitest and Wallaby
import { vi } from 'vitest'

export const mkdir = vi.fn()
export const writeFile = vi.fn()
export const readdir = vi.fn()
export const rm = vi.fn()

export default {
  mkdir,
  writeFile,
  readdir,
  rm,
}
