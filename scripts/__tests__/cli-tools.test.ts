import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { describe, it, expect } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '../..')

describe('CLI Tools Verification', () => {
  describe('Claude Hooks CLI binaries', () => {
    it('should have correct bin paths in package.json', () => {
      const packageJsonPath = path.join(
        rootDir,
        'packages',
        'claude-hooks',
        'package.json',
      )
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

      expect(packageJson.bin).toBeDefined()

      // Check that bin paths point to dist
      Object.values(packageJson.bin as Record<string, string>).forEach(
        (binPath) => {
          expect(binPath).toMatch(/^\.\/dist\/bin\//)
          expect(binPath).toMatch(/\.js$/)
        },
      )
    })

    it('should generate executable files after build', () => {
      const claudeHooksDir = path.join(rootDir, 'packages', 'claude-hooks')

      // Build the package
      execSync('pnpm build', {
        cwd: claudeHooksDir,
        stdio: 'pipe',
      })

      // Check that bin files exist in dist
      const binFiles = [
        'dist/bin/claude-hooks-stop.js',
        'dist/bin/claude-hooks-quality.js',
        'dist/bin/claude-hooks-cache-stats.js',
        'dist/bin/claude-hooks-cache-explorer.js',
        'dist/bin/claude-hooks-list-voices.js',
        'dist/bin/claude-hooks-notification.js',
        'dist/bin/claude-hooks-subagent.js',
      ]

      binFiles.forEach((file) => {
        const filePath = path.join(claudeHooksDir, file)
        expect(fs.existsSync(filePath)).toBe(true)

        // Check that files have shebang
        const content = fs.readFileSync(filePath, 'utf-8')
        expect(content.startsWith('#!/usr/bin/env node')).toBe(true)
      })
    })

    it('should have proper imports with .js extensions in bin files', () => {
      const claudeHooksDir = path.join(rootDir, 'packages', 'claude-hooks')
      const binFile = path.join(
        claudeHooksDir,
        'dist',
        'bin',
        'claude-hooks-stop.js',
      )

      if (fs.existsSync(binFile)) {
        const content = fs.readFileSync(binFile, 'utf-8')

        // Check for relative imports with .js extensions
        const relativeImports =
          content.match(/from ['"]\.\.?\/[^'"]+['"]/g) || []

        relativeImports.forEach((imp) => {
          if (!imp.includes('.json') && !imp.includes('node_modules')) {
            expect(imp).toMatch(/\.js['"]$/)
          }
        })
      }
    })
  })

  describe('Scripts package CLI tools', () => {
    it('should have correct bin configuration', () => {
      const packageJsonPath = path.join(
        rootDir,
        'packages',
        'scripts',
        'package.json',
      )
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

      if (packageJson.bin) {
        Object.values(packageJson.bin as Record<string, string>).forEach(
          (binPath) => {
            // Should point to dist directory
            expect(binPath).toMatch(/^\.\/dist\//)
            expect(binPath).toMatch(/\.js$/)
          },
        )
      }
    })

    it('should build successfully with ESM extensions', () => {
      const scriptsDir = path.join(rootDir, 'packages', 'scripts')

      // Build the package
      execSync('pnpm build', {
        cwd: scriptsDir,
        stdio: 'pipe',
      })

      // Check that dist directory exists
      const distDir = path.join(scriptsDir, 'dist')
      expect(fs.existsSync(distDir)).toBe(true)

      // Check for import-messages binary if it exists
      const binPath = path.join(distDir, 'bin', 'import-messages.js')
      if (fs.existsSync(binPath)) {
        const content = fs.readFileSync(binPath, 'utf-8')

        // Should have shebang
        expect(content.startsWith('#!/usr/bin/env node')).toBe(true)

        // Check for .js extensions in imports
        const relativeImports =
          content.match(/from ['"]\.\.?\/[^'"]+['"]/g) || []
        relativeImports.forEach((imp) => {
          if (!imp.includes('.json') && !imp.includes('node_modules')) {
            expect(imp).toMatch(/\.js['"]$/)
          }
        })
      }
    })
  })

  describe('Dev Tools CLI', () => {
    it('should have Wallaby management scripts', () => {
      const devToolsDir = path.join(rootDir, 'packages', 'dev-tools')
      const packageJsonPath = path.join(devToolsDir, 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

      // Check for bin configuration
      if (packageJson.bin) {
        expect(packageJson.bin['wallaby-status']).toBeDefined()
        expect(packageJson.bin['wallaby-status']).toMatch(/\.js$/)
      }
    })

    it('should build with proper ESM extensions', () => {
      const devToolsDir = path.join(rootDir, 'packages', 'dev-tools')

      // Build the package
      execSync('pnpm build', {
        cwd: devToolsDir,
        stdio: 'pipe',
      })

      const distDir = path.join(devToolsDir, 'dist')
      expect(fs.existsSync(distDir)).toBe(true)

      // Check for wallaby-status binary
      const binPath = path.join(distDir, 'bin', 'wallaby-status.js')
      if (fs.existsSync(binPath)) {
        const content = fs.readFileSync(binPath, 'utf-8')

        // Check for proper imports
        const relativeImports =
          content.match(/from ['"]\.\.?\/[^'"]+['"]/g) || []
        relativeImports.forEach((imp) => {
          if (!imp.includes('.json') && !imp.includes('node_modules')) {
            expect(imp).toMatch(/\.js['"]$/)
          }
        })
      }
    })
  })

  describe('Code Review CLI', () => {
    it('should have correct exports configuration', () => {
      const codeReviewDir = path.join(rootDir, 'packages', 'code-review')
      const packageJsonPath = path.join(codeReviewDir, 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

      // Check exports configuration
      expect(packageJson.exports).toBeDefined()
      expect(packageJson.exports['.']).toBeDefined()

      // Should have dual consumption setup
      if (packageJson.exports['.'].development) {
        expect(packageJson.exports['.'].development).toMatch(/\.ts$/)
      }
      if (packageJson.exports['.'].import) {
        expect(packageJson.exports['.'].import).toMatch(/\.js$/)
      }
    })

    it('should build with ESM extensions', () => {
      const codeReviewDir = path.join(rootDir, 'packages', 'code-review')

      // Build the package
      execSync('pnpm build', {
        cwd: codeReviewDir,
        stdio: 'pipe',
      })

      const distDir = path.join(codeReviewDir, 'dist')
      expect(fs.existsSync(distDir)).toBe(true)

      // Check a sample file for proper imports
      const indexPath = path.join(distDir, 'index.js')
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf-8')

        const relativeImports =
          content.match(/from ['"]\.\.?\/[^'"]+['"]/g) || []
        relativeImports.forEach((imp) => {
          if (!imp.includes('.json') && !imp.includes('node_modules')) {
            expect(imp).toMatch(/\.js['"]$/)
          }
        })
      }
    })
  })
})
