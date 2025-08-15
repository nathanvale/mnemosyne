import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { describe, it, expect } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packagePath = join(__dirname, '../../package.json')

describe('@studio/prettier-config exports', () => {
  it('should have correct package.json structure', () => {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

    expect(packageJson.type).toBe('module')
    expect(packageJson.exports).toBeDefined()
  })

  it('should export the config with dual consumption pattern', () => {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

    // Current export for now
    expect(packageJson.exports['.']).toBeDefined()
    expect(packageJson.exports['./package.json']).toBe('./package.json')
  })

  it('should have the config file', () => {
    const configPath = join(__dirname, '../../index.js')
    expect(existsSync(configPath)).toBe(true)
  })

  it('should be importable as ES module', async () => {
    const prettierConfig = await import('../../index.js')

    expect(prettierConfig).toBeDefined()
    expect(prettierConfig.default).toBeDefined()
  })
})
