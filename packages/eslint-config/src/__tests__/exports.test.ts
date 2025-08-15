import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { describe, it, expect } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packagePath = join(__dirname, '../../package.json')

describe('@studio/eslint-config exports', () => {
  it('should have correct package.json structure', () => {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

    expect(packageJson.type).toBe('module')
    expect(packageJson.exports).toBeDefined()
  })

  it('should export all ESLint config modules with dual consumption pattern', () => {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

    // Check current exports
    expect(packageJson.exports['./base']).toBeDefined()
    expect(packageJson.exports['./next']).toBeDefined()
    expect(packageJson.exports['./library']).toBeDefined()
  })

  it('should have all required config files', () => {
    const configs = ['base.js', 'next.js', 'library.js']

    for (const config of configs) {
      const configPath = join(__dirname, '../', config)
      expect(existsSync(configPath)).toBe(true)
    }
  })

  it('should be importable as ES modules', async () => {
    const baseConfig = await import('../base.js')
    const libraryConfig = await import('../library.js')
    // Note: next.js imports eslint-config-next which has compatibility issues in test environment

    expect(baseConfig).toBeDefined()
    expect(libraryConfig).toBeDefined()
  })
})
