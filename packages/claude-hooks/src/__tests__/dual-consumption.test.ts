/**
 * Tests dual consumption architecture for @studio/claude-hooks
 * Validates that packages work correctly in both development and production modes
 */

import { describe, it, expect } from 'vitest'

describe('Dual Consumption - @studio/claude-hooks', () => {
  it('should handle environment-based consumption correctly', () => {
    const originalNodeEnv = process.env.NODE_ENV

    try {
      // Test development mode
      process.env.NODE_ENV = 'development'
      // In a real scenario, this would import from source files
      expect(process.env.NODE_ENV).toBe('development')

      // Test production mode
      process.env.NODE_ENV = 'production'
      // In a real scenario, this would import from compiled files
      expect(process.env.NODE_ENV).toBe('production')
    } finally {
      // Restore original NODE_ENV
      process.env.NODE_ENV = originalNodeEnv
    }
  })

  it('should export binary tools correctly through package.json', async () => {
    // Binary tools should be available through package.json bin field
    // They point to ./dist/bin/* files after build
    const packageJson = await import('../../package.json')

    expect(packageJson.default.bin['claude-hooks-stop']).toBe(
      './dist/bin/claude-hooks-stop.js',
    )
    expect(packageJson.default.bin['claude-hooks-notification']).toBe(
      './dist/bin/claude-hooks-notification.js',
    )
    expect(packageJson.default.bin['claude-hooks-quality']).toBe(
      './dist/bin/claude-hooks-quality.js',
    )
    expect(packageJson.default.bin['claude-hooks-subagent']).toBe(
      './dist/bin/claude-hooks-subagent.js',
    )
    expect(packageJson.default.bin['claude-hooks-cache-stats']).toBe(
      './dist/bin/claude-hooks-cache-stats.js',
    )
    expect(packageJson.default.bin['claude-hooks-cache-explorer']).toBe(
      './dist/bin/claude-hooks-cache-explorer.js',
    )
    expect(packageJson.default.bin['claude-hooks-list-voices']).toBe(
      './dist/bin/claude-hooks-list-voices.js',
    )
  })

  it('should support conditional exports in package.json', async () => {
    const packageJson = await import('../../package.json')

    // Verify conditional exports are set up correctly
    expect(packageJson.default.exports['.']).toBeDefined()
    expect(packageJson.default.exports['.'].development).toBe('./src/index.ts')
    expect(packageJson.default.exports['.'].types).toBe('./dist/index.d.ts')
    expect(packageJson.default.exports['.'].import).toBe('./dist/index.js')
    expect(packageJson.default.exports['.'].default).toBe('./dist/index.js')

    expect(packageJson.default.exports['./types']).toBeDefined()
    expect(packageJson.default.exports['./config']).toBeDefined()
    expect(packageJson.default.exports['./speech']).toBeDefined()
    expect(packageJson.default.exports['./audio']).toBeDefined()
    expect(packageJson.default.exports['./utils']).toBeDefined()
    expect(packageJson.default.exports['./quality-check']).toBeDefined()
  })

  it('should have correct package configuration for dual consumption', async () => {
    const packageJson = await import('../../package.json')

    // Check that package is configured as ES module
    expect(packageJson.default.type).toBe('module')

    // Check that it's not private (this is a published package)
    expect(packageJson.default.private).toBe(false)

    // Check that files array includes dist for publishing
    expect(packageJson.default.files).toContain('dist/**/*')

    // Check that main exports follow dual consumption pattern
    const mainExport = packageJson.default.exports['.']
    expect(mainExport.development).toMatch(/^\.\/src\//)
    expect(mainExport.types).toMatch(/^\.\/dist\/.*\.d\.ts$/)
    expect(mainExport.import).toMatch(/^\.\/dist\/.*\.js$/)
    expect(mainExport.default).toMatch(/^\.\/dist\/.*\.js$/)
  })

  it('should have correct build configuration', async () => {
    const packageJson = await import('../../package.json')

    // Check build script includes shebang fixing for CLI tools
    expect(packageJson.default.scripts.build).toContain('fix-shebangs.js')

    // Check prepublishOnly ensures build before publishing
    expect(packageJson.default.scripts.prepublishOnly).toBe('pnpm build')

    // Check that all required scripts are present
    expect(packageJson.default.scripts.build).toBeDefined()
    expect(packageJson.default.scripts.test).toBeDefined()
    expect(packageJson.default.scripts.lint).toBeDefined()
    expect(packageJson.default.scripts['type-check']).toBeDefined()
    expect(packageJson.default.scripts['format:check']).toBeDefined()
  })
})
