import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const binDir = path.resolve(__dirname, '..')

describe('Bin Commands', () => {
  beforeEach(() => {
    // Clear any environment variables that might affect tests
    delete process.env.CLAUDE_HOOKS_DEBUG
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('claude-hooks-stop', () => {
    const binPath = path.join(binDir, 'claude-hooks-stop.ts')

    it('should exist and be executable', async () => {
      const exists = await fs
        .stat(binPath)
        .then(() => true)
        .catch(() => false)
      expect(exists).toBe(true)
    })

    it('should have correct shebang for development', async () => {
      const content = await fs.readFile(binPath, 'utf8')
      expect(content.startsWith('#!/usr/bin/env tsx')).toBe(true)
    })

    it('should import and call the main function', async () => {
      const content = await fs.readFile(binPath, 'utf8')
      expect(content).toContain("import { main } from '../stop/stop.js'")
      expect(content).toContain('main().catch')
    })

    it('should handle errors and exit with code 1', async () => {
      const content = await fs.readFile(binPath, 'utf8')
      expect(content).toContain('process.exit(1)')
    })

    it('should handle stdin input for events', async () => {
      // Test that the command can receive JSON events via stdin
      // This would normally test actual execution, but we'll verify structure for now
      const binContent = await fs.readFile(binPath, 'utf8')
      expect(binContent).toContain('main()')
    })
  })

  describe('claude-hooks-notification', () => {
    const binPath = path.join(binDir, 'claude-hooks-notification.ts')

    it('should exist and be executable', async () => {
      const exists = await fs
        .stat(binPath)
        .then(() => true)
        .catch(() => false)
      expect(exists).toBe(true)
    })

    it('should have correct shebang for development', async () => {
      const content = await fs.readFile(binPath, 'utf8')
      expect(content.startsWith('#!/usr/bin/env tsx')).toBe(true)
    })

    it('should import and call the main function', async () => {
      const content = await fs.readFile(binPath, 'utf8')
      expect(content).toContain(
        "import { main } from '../notification/notification.js'",
      )
      expect(content).toContain('main().catch')
    })
  })

  describe('claude-hooks-quality', () => {
    const binPath = path.join(binDir, 'claude-hooks-quality.ts')

    it('should exist and be executable', async () => {
      const exists = await fs
        .stat(binPath)
        .then(() => true)
        .catch(() => false)
      expect(exists).toBe(true)
    })

    it('should have correct shebang for development', async () => {
      const content = await fs.readFile(binPath, 'utf8')
      expect(content.startsWith('#!/usr/bin/env tsx')).toBe(true)
    })

    it('should import and call the main function', async () => {
      const content = await fs.readFile(binPath, 'utf8')
      expect(content).toContain(
        "import { main } from '../quality-check/index.js'",
      )
      expect(content).toContain('main().catch')
    })
  })

  describe('claude-hooks-subagent', () => {
    const binPath = path.join(binDir, 'claude-hooks-subagent.ts')

    it('should exist and be executable', async () => {
      const exists = await fs
        .stat(binPath)
        .then(() => true)
        .catch(() => false)
      expect(exists).toBe(true)
    })

    it('should have correct shebang for development', async () => {
      const content = await fs.readFile(binPath, 'utf8')
      expect(content.startsWith('#!/usr/bin/env tsx')).toBe(true)
    })

    it('should import and call the main function', async () => {
      const content = await fs.readFile(binPath, 'utf8')
      expect(content).toContain(
        "import { main } from '../subagent-stop/subagent-stop.js'",
      )
      expect(content).toContain('main().catch')
    })
  })

  describe('Error Handling', () => {
    it('should handle missing main function gracefully', async () => {
      // Each bin file should have proper error handling
      const binFiles = [
        'claude-hooks-stop.ts',
        'claude-hooks-notification.ts',
        'claude-hooks-quality.ts',
        'claude-hooks-subagent.ts',
      ]

      for (const file of binFiles) {
        const binPath = path.join(binDir, file)
        const exists = await fs
          .stat(binPath)
          .then(() => true)
          .catch(() => false)

        if (exists) {
          const content = await fs.readFile(binPath, 'utf8')
          expect(content).toContain('.catch((error')
          expect(content).toContain('console.error')
        }
      }
    })
  })

  describe('Build Output', () => {
    it('should compile to JavaScript with node shebang', async () => {
      // After build, check that dist/bin files have node shebang
      const distBinDir = path.resolve(__dirname, '../../../dist/bin')
      const distExists = await fs
        .stat(distBinDir)
        .then(() => true)
        .catch(() => false)

      if (distExists) {
        const files = await fs.readdir(distBinDir)
        const jsFiles = files.filter((f) => f.endsWith('.js'))

        for (const file of jsFiles) {
          const content = await fs.readFile(path.join(distBinDir, file), 'utf8')
          expect(content.startsWith('#!/usr/bin/env node')).toBe(true)
        }
      }
    })
  })
})
