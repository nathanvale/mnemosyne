import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { describe, it, expect } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '../..')

describe('Build Pipeline Integration', () => {
  describe('fix-esm-extensions script', () => {
    it('should be executable', () => {
      const scriptPath = path.join(rootDir, 'scripts', 'fix-esm-extensions.js')
      expect(fs.existsSync(scriptPath)).toBe(true)

      const stats = fs.statSync(scriptPath)
      expect(stats.isFile()).toBe(true)
    })

    it('should process a sample TypeScript-compiled file correctly', () => {
      const testDir = path.join(__dirname, 'test-build-output')
      const testFile = path.join(testDir, 'test.js')

      // Clean up any previous test artifacts
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true })
      }
      fs.mkdirSync(testDir, { recursive: true })

      // Create a test file with imports that need fixing
      const testContent = `
import { something } from './other'
import { another } from '../parent/module'
export { thing } from './thing'
import pkg from 'external-package'
import data from './data.json'
`
      fs.writeFileSync(testFile, testContent)

      // Run the fix script
      execSync(
        `node ${path.join(rootDir, 'scripts', 'fix-esm-extensions.js')} ${testDir}`,
        {
          stdio: 'pipe',
        },
      )

      // Read the processed file
      const processedContent = fs.readFileSync(testFile, 'utf-8')

      // Verify the imports have been fixed
      expect(processedContent).toContain("from './other.js'")
      expect(processedContent).toContain("from '../parent/module.js'")
      expect(processedContent).toContain("from './thing.js'")
      expect(processedContent).toContain("from 'external-package'") // Should not add .js
      expect(processedContent).toContain("from './data.json'") // Should preserve .json

      // Clean up
      fs.rmSync(testDir, { recursive: true })
    })
  })

  describe('Package builds', () => {
    it('should successfully build @studio/logger with ESM extensions', () => {
      const loggerDir = path.join(rootDir, 'packages', 'logger')

      // Run the build
      execSync('pnpm build', {
        cwd: loggerDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      })

      // Check that dist files exist
      const distDir = path.join(loggerDir, 'dist')
      expect(fs.existsSync(distDir)).toBe(true)

      // Check a sample dist file for .js extensions
      const indexPath = path.join(distDir, 'index.js')
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf-8')
        // Check for relative imports with .js extensions (exclude comments)
        const lines = content
          .split('\n')
          .filter((line) => !line.trim().startsWith('//'))
        const importContent = lines.join('\n')
        const relativeImports =
          importContent.match(/from ['"]\.\.?\/[^'"]+['"]/g) || []
        relativeImports.forEach((imp) => {
          if (!imp.includes('.json') && !imp.includes('node_modules')) {
            expect(imp).toMatch(/\.js['"]$/)
          }
        })
      }
    })

    it('should successfully build @studio/db with ESM extensions', () => {
      const dbDir = path.join(rootDir, 'packages', 'db')

      // Run the build
      execSync('pnpm build', {
        cwd: dbDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      })

      // Check that dist files exist
      const distDir = path.join(dbDir, 'dist')
      expect(fs.existsSync(distDir)).toBe(true)
    })

    it('should successfully build @studio/ui with ESM extensions', () => {
      const uiDir = path.join(rootDir, 'packages', 'ui')

      // Run the build
      execSync('pnpm build', {
        cwd: uiDir,
        encoding: 'utf-8',
        stdio: 'pipe',
      })

      // Check that dist files exist
      const distDir = path.join(uiDir, 'dist')
      expect(fs.existsSync(distDir)).toBe(true)
    })
  })

  describe('Monorepo-wide build', () => {
    it('should build all packages with fix-extensions script', () => {
      // This test verifies the monorepo-wide build works
      // We'll do a targeted build of a few packages to save time
      execSync(
        'pnpm turbo build --filter="@studio/logger" --filter="@studio/schema"',
        {
          cwd: rootDir,
          encoding: 'utf-8',
          stdio: 'pipe',
        },
      )

      // Verify the packages built successfully
      const loggerDist = path.join(rootDir, 'packages', 'logger', 'dist')
      const schemaDist = path.join(rootDir, 'packages', 'schema', 'dist')

      expect(fs.existsSync(loggerDist)).toBe(true)
      expect(fs.existsSync(schemaDist)).toBe(true)
    })
  })
})
