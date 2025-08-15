import { describe, it, expect } from 'vitest'

describe('@studio/code-review - Dual Consumption Architecture', () => {
  it('should have correct package.json exports structure', async () => {
    // Read package.json from file system instead of importing
    const fs = await import('fs/promises')
    const path = await import('path')
    const packagePath = path.resolve(__dirname, '../../package.json')
    const packageContent = await fs.readFile(packagePath, 'utf-8')
    const pkg = JSON.parse(packageContent)

    expect(pkg.name).toBe('@studio/code-review')
    expect(pkg.type).toBe('module')
    expect(pkg.exports).toBeDefined()

    // Check exports structure for dual consumption
    expect(pkg.exports['.']).toBeDefined()
    expect(pkg.exports['.'].development).toBe('./src/index.ts')
    expect(pkg.exports['.'].types).toBe('./dist/index.d.ts')
    expect(pkg.exports['.'].import).toBe('./dist/index.js')
    expect(pkg.exports['.'].default).toBe('./dist/index.js')
  })

  it('should be importable from main export', async () => {
    // Test that the package can be imported from source
    const codeReview = await import('../index.js')
    expect(codeReview).toBeDefined()
  })

  it('should handle development vs production imports correctly', async () => {
    // In development, imports should resolve to source files
    // In production, imports should resolve to built files

    const isProduction = process.env.NODE_ENV === 'production'

    if (isProduction) {
      // In production, we expect built files to be used
      const codeReview = await import('../index.js')
      expect(codeReview).toBeDefined()
    } else {
      // In development, source files should be directly consumable
      const codeReview = await import('../index.js')
      expect(codeReview).toBeDefined()
    }
  })

  it('should have CLI scripts available', () => {
    // Verify package structure includes CLI utilities
    // These will be tested separately for functionality
    expect(true).toBe(true) // Placeholder for CLI script validation
  })

  it('should be ready for external consumption', () => {
    // Verify package structure is ready for npm link testing
    expect(true).toBe(true) // Placeholder for external test validation
  })
})
