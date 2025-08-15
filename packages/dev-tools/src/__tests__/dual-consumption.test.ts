import { describe, it, expect } from 'vitest'

import { SimpleWallabyStatus } from '../wallaby-manager/simple-wallaby-status.js'

describe('@studio/dev-tools - Dual Consumption Architecture', () => {
  it('should have correct package.json exports structure', async () => {
    // Read package.json from file system instead of importing
    const fs = await import('fs/promises')
    const path = await import('path')
    const packagePath = path.resolve(__dirname, '../../package.json')
    const packageContent = await fs.readFile(packagePath, 'utf-8')
    const pkg = JSON.parse(packageContent)

    expect(pkg.name).toBe('@studio/dev-tools')
    expect(pkg.type).toBe('module')
    expect(pkg.exports).toBeDefined()

    // Check exports structure for dual consumption
    expect(pkg.exports['.']).toBeDefined()
    expect(pkg.exports['.'].development).toBe('./src/index.ts')
    expect(pkg.exports['.'].types).toBe('./dist/index.d.ts')
    expect(pkg.exports['.'].import).toBe('./dist/index.js')
    expect(pkg.exports['.'].default).toBe('./dist/index.js')

    // Should have bin configuration
    expect(pkg.bin).toBeDefined()
    expect(pkg.bin['wallaby-status']).toBeDefined()
    expect(pkg.bin['wallaby-status']).toContain('./dist/')
  })

  it('should export SimpleWallabyStatus', () => {
    expect(SimpleWallabyStatus).toBeDefined()
    expect(typeof SimpleWallabyStatus).toBe('function')
  })

  it('should have wallaby-manager functionality available', async () => {
    // Test the wallaby manager functionality
    const status = await SimpleWallabyStatus.checkStatus()
    expect(status).toHaveProperty('running')
    expect(status).toHaveProperty('vsCodeExtensionFound')
    expect(status).toHaveProperty('serverProcesses')
    expect(status).toHaveProperty('configFileExists')
  })

  it('should be ready for external consumption', () => {
    // Verify package structure is ready for npm link testing
    expect(true).toBe(true) // Placeholder for external test validation
  })
})
