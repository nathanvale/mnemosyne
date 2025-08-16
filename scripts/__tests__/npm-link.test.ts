import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { describe, it, expect } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '../..')

describe('NPM Link Functionality', () => {
  describe('Package configuration for external consumption', () => {
    it('should have proper exports field for npm packages', () => {
      const packagesToCheck = [
        'logger',
        'db',
        'ui',
        'schema',
        'memory',
        'validation',
        'claude-hooks',
        'code-review',
      ]

      packagesToCheck.forEach((pkg) => {
        const packageJsonPath = path.join(
          rootDir,
          'packages',
          pkg,
          'package.json',
        )
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf-8'),
        )

        // Check for exports field
        expect(packageJson.exports).toBeDefined()

        // Main export should be defined
        expect(packageJson.exports['.']).toBeDefined()

        // Should have import and types for external consumption
        const mainExport = packageJson.exports['.']
        if (typeof mainExport === 'object') {
          // Should have types for TypeScript consumers
          expect(mainExport.types).toBeDefined()
          expect(mainExport.types).toMatch(/\.d\.ts$/)

          // Should have import for ES modules
          expect(mainExport.import || mainExport.default).toBeDefined()
          if (mainExport.import) {
            expect(mainExport.import).toMatch(/\.js$/)
          }
        }
      })
    })

    it('should have correct file paths in exports', () => {
      const packagesToCheck = ['logger', 'schema', 'validation']

      packagesToCheck.forEach((pkg) => {
        const packageDir = path.join(rootDir, 'packages', pkg)
        const packageJsonPath = path.join(packageDir, 'package.json')
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf-8'),
        )

        // Check that exported files would exist after build
        const mainExport = packageJson.exports['.']
        if (typeof mainExport === 'object') {
          // Check types path
          if (mainExport.types) {
            const typesPath = mainExport.types.replace(/^\.\//, '')
            // Should be in dist directory
            expect(typesPath).toMatch(/^dist\//)
          }

          // Check import path
          if (mainExport.import) {
            const importPath = mainExport.import.replace(/^\.\//, '')
            // Should be in dist directory
            expect(importPath).toMatch(/^dist\//)
          }

          // Check development path (for internal use)
          if (mainExport.development) {
            const devPath = mainExport.development.replace(/^\.\//, '')
            // Should be in src directory
            expect(devPath).toMatch(/^src\//)
          }
        }
      })
    })

    it('should have type declaration files after build', () => {
      // Check a sample package that has been built
      const loggerDir = path.join(rootDir, 'packages', 'logger')
      const distDir = path.join(loggerDir, 'dist')

      if (fs.existsSync(distDir)) {
        // Should have .d.ts files
        const dtsFiles = findFiles(distDir, '.d.ts')
        expect(dtsFiles.length).toBeGreaterThan(0)

        // index.d.ts should exist
        const indexDts = path.join(distDir, 'index.d.ts')
        expect(fs.existsSync(indexDts)).toBe(true)
      }
    })

    it('should have ESM module type in package.json', () => {
      const packagesToCheck = [
        'logger',
        'db',
        'ui',
        'schema',
        'memory',
        'validation',
        'claude-hooks',
      ]

      packagesToCheck.forEach((pkg) => {
        const packageJsonPath = path.join(
          rootDir,
          'packages',
          pkg,
          'package.json',
        )
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf-8'),
        )

        // Should be ESM module
        expect(packageJson.type).toBe('module')
      })
    })

    it('should have proper subpath exports where applicable', () => {
      // Check packages that have subpath exports
      const claudeHooksPath = path.join(
        rootDir,
        'packages',
        'claude-hooks',
        'package.json',
      )
      const claudeHooks = JSON.parse(fs.readFileSync(claudeHooksPath, 'utf-8'))

      if (claudeHooks.exports['./speech']) {
        const speechExport = claudeHooks.exports['./speech']

        // Should have proper structure
        expect(speechExport.development || speechExport.import).toBeDefined()
        expect(speechExport.types).toBeDefined()

        // Check file extensions
        if (speechExport.development) {
          expect(speechExport.development).toMatch(/\.ts$/)
        }
        if (speechExport.import) {
          expect(speechExport.import).toMatch(/\.js$/)
        }
        if (speechExport.types) {
          expect(speechExport.types).toMatch(/\.d\.ts$/)
        }
      }
    })

    it('should not have legacy main/module fields conflicting with exports', () => {
      const packagesToCheck = ['logger', 'schema', 'validation']

      packagesToCheck.forEach((pkg) => {
        const packageJsonPath = path.join(
          rootDir,
          'packages',
          pkg,
          'package.json',
        )
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf-8'),
        )

        // If exports field exists, main/module should either not exist or match exports
        if (packageJson.exports) {
          if (packageJson.main) {
            // Main should point to a valid file
            expect(packageJson.main).toMatch(/\.(js|ts)$/)
          }

          if (packageJson.module) {
            // Module should point to ES module
            expect(packageJson.module).toMatch(/\.js$/)
          }
        }
      })
    })
  })

  describe('Build output structure', () => {
    it('should maintain directory structure in dist', () => {
      const loggerDir = path.join(rootDir, 'packages', 'logger')
      const distDir = path.join(loggerDir, 'dist')

      if (fs.existsSync(distDir)) {
        // Should have index file
        expect(fs.existsSync(path.join(distDir, 'index.js'))).toBe(true)
        expect(fs.existsSync(path.join(distDir, 'index.d.ts'))).toBe(true)

        // Should have lib directory if src has it
        const srcLibDir = path.join(loggerDir, 'src', 'lib')
        if (fs.existsSync(srcLibDir)) {
          const distLibDir = path.join(distDir, 'lib')
          expect(fs.existsSync(distLibDir)).toBe(true)
        }
      }
    })

    it('should have source maps for debugging', () => {
      const loggerDir = path.join(rootDir, 'packages', 'logger')
      const distDir = path.join(loggerDir, 'dist')

      if (fs.existsSync(distDir)) {
        // Should have .js.map files
        const mapFiles = findFiles(distDir, '.js.map')
        expect(mapFiles.length).toBeGreaterThan(0)
      }
    })
  })
})

function findFiles(dir: string, extension: string): string[] {
  const results: string[] = []
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (
      stat.isDirectory() &&
      !file.startsWith('.') &&
      file !== 'node_modules'
    ) {
      results.push(...findFiles(filePath, extension))
    } else if (file.endsWith(extension)) {
      results.push(filePath)
    }
  }

  return results
}
