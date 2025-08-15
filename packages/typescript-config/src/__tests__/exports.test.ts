import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { describe, it, expect } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packagePath = join(__dirname, '../../package.json')

describe('@studio/typescript-config exports', () => {
  it('should have correct package.json structure', () => {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

    expect(packageJson.type).toBe('module')
    expect(packageJson.exports).toBeDefined()
  })

  it('should export all TypeScript config files', () => {
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'))

    expect(packageJson.exports['./base.json']).toBe('./base.json')
    expect(packageJson.exports['./nextjs.json']).toBe('./nextjs.json')
    expect(packageJson.exports['./library.json']).toBe('./library.json')
    expect(packageJson.exports['./package.json']).toBe('./package.json')
  })

  it('should have all required config files', async () => {
    const configs = ['base.json', 'nextjs.json', 'library.json']

    for (const config of configs) {
      const configPath = join(__dirname, '../../', config)
      const configContent = readFileSync(configPath, 'utf-8')
      const parsed = JSON.parse(configContent)

      expect(parsed).toBeDefined()
      expect(parsed.compilerOptions || parsed.extends).toBeDefined()
    }
  })
})
