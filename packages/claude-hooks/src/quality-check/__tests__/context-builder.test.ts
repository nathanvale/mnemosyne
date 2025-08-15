/**
 * Tests for SubAgentContextBuilder
 */

import { describe, expect, it, vi } from 'vitest'

import { SubAgentContextBuilder } from '../context-builder.js'
import { TypeScriptConfigCache } from '../typescript-cache.js'

// Mock the TypeScript config cache
vi.mock('../typescript-cache.js')

// Mock fs module - must be hoisted for Wallaby
vi.mock('fs')

describe('SubAgentContextBuilder', () => {
  describe('buildContext', () => {
    it('builds comprehensive context for TypeScript errors', async () => {
      const mockCache = {
        getTsConfigForFile: vi.fn().mockReturnValue('/project/tsconfig.json'),
        getCachedMappings: vi.fn().mockReturnValue({
          '/src/components': {
            configPath: '/project/tsconfig.json',
            excludes: [],
          },
        }),
      } as unknown as TypeScriptConfigCache

      const builder = new SubAgentContextBuilder(mockCache)

      const errors = [
        "Property 'user' does not exist on type 'Session'",
        "Cannot find module '@studio/db'",
      ]

      const context = await builder.buildContext(
        errors,
        '/project/src/components/UserProfile.tsx',
      )

      expect(context).toHaveProperty('filePath')
      expect(context).toHaveProperty('tsConfigPath')
      expect(context).toHaveProperty('errorDetails')
      expect(context).toHaveProperty('projectPatterns')
      expect(context).toHaveProperty('relatedImports')
      expect(context.errorDetails).toHaveLength(2)
    })

    it('enriches context with file content when available', async () => {
      const fs = await import('fs')
      const mockFileContent = `
import { Session } from '@studio/auth'
import { db } from '@studio/db'

export function getUserProfile(session: Session) {
  return session.user.profile
}
`
      vi.mocked(fs.existsSync).mockImplementation(() => true)
      vi.mocked(fs.readFileSync).mockImplementation(() => mockFileContent)

      const mockCache = {
        getTsConfigForFile: vi.fn().mockReturnValue('/project/tsconfig.json'),
        getCachedMappings: vi.fn().mockReturnValue({}),
      } as unknown as TypeScriptConfigCache

      const builder = new SubAgentContextBuilder(mockCache)

      const context = await builder.buildContext(
        ["Property 'user' does not exist on type 'Session'"],
        '/project/src/components/UserProfile.tsx',
      )

      expect(context.fileContent).toBe(mockFileContent)
      expect(context.relatedImports).toHaveLength(2)
      expect(context.relatedImports[0].importPath).toBe('@studio/auth')
      expect(context.relatedImports[1].importPath).toBe('@studio/db')
    })

    it('handles missing file content gracefully', async () => {
      const fs = await import('fs')
      vi.mocked(fs.existsSync).mockImplementation(() => false)

      const mockCache = {
        getTsConfigForFile: vi.fn().mockReturnValue('/project/tsconfig.json'),
        getCachedMappings: vi.fn().mockReturnValue({}),
      } as unknown as TypeScriptConfigCache

      const builder = new SubAgentContextBuilder(mockCache)

      const context = await builder.buildContext(
        ['Type error in file'],
        '/project/src/nonexistent.ts',
      )

      expect(context.fileContent).toBeUndefined()
      expect(context.relatedImports).toEqual([])
    })

    it('detects monorepo patterns correctly', async () => {
      const mockCache = {
        getTsConfigForFile: vi.fn().mockReturnValue('/project/tsconfig.json'),
        getCachedMappings: vi.fn().mockReturnValue({}),
      } as unknown as TypeScriptConfigCache

      const builder = new SubAgentContextBuilder(mockCache)

      const monorepoContext = await builder.buildContext(
        ['Error in monorepo'],
        '/project/packages/ui/src/Button.tsx',
      )

      expect(monorepoContext.projectPatterns.isMonorepo).toBe(true)
      expect(monorepoContext.projectPatterns.packagePattern).toBe('@studio/*')

      const regularContext = await builder.buildContext(
        ['Error in regular project'],
        '/project/src/utils/helper.ts',
      )

      expect(regularContext.projectPatterns.isMonorepo).toBe(false)
      expect(regularContext.projectPatterns.packagePattern).toBeUndefined()
    })

    it('extracts line numbers from TypeScript errors when available', async () => {
      const mockCache = {
        getTsConfigForFile: vi.fn().mockReturnValue('/project/tsconfig.json'),
        getCachedMappings: vi.fn().mockReturnValue({}),
      } as unknown as TypeScriptConfigCache

      const builder = new SubAgentContextBuilder(mockCache)

      const errors = [
        "src/component.tsx(15,5): error TS2339: Property 'onClick' does not exist",
        "src/utils.ts(42,10): error TS2304: Cannot find name 'MyType'",
      ]

      const context = await builder.buildContext(
        errors,
        '/project/src/component.tsx',
      )

      expect(context.errorDetails[0].lineNumber).toBe(15)
      expect(context.errorDetails[1].lineNumber).toBe(42)
    })

    it('analyzes import patterns from file content', async () => {
      const fs = await import('fs')
      const mockFileContent = `
import React from 'react'
import type { User } from '@studio/db'
import { Button } from '../components/Button'
import './styles.css'
import config from './config.json' assert { type: 'json' }

export const Component = () => <Button />
`
      vi.mocked(fs.existsSync).mockImplementation(() => true)
      vi.mocked(fs.readFileSync).mockImplementation(() => mockFileContent)

      const mockCache = {
        getTsConfigForFile: vi.fn().mockReturnValue('/project/tsconfig.json'),
        getCachedMappings: vi.fn().mockReturnValue({}),
      } as unknown as TypeScriptConfigCache

      const builder = new SubAgentContextBuilder(mockCache)

      const context = await builder.buildContext(
        ['Error'],
        '/project/src/test.tsx',
      )

      expect(context.relatedImports).toHaveLength(5)
      expect(
        context.relatedImports.find((i) => i.importPath === 'react'),
      ).toBeDefined()
      expect(
        context.relatedImports.find((i) => i.importPath === '@studio/db'),
      ).toBeDefined()
      expect(
        context.relatedImports.find(
          (i) => i.importPath === '../components/Button',
        ),
      ).toBeDefined()
    })

    it('includes TypeScript config mappings in context', async () => {
      // Since TypeScriptConfigCache doesn't expose getCachedMappings,
      // we'll test that configMappings is at least present in the context
      const mockCache = {
        getTsConfigForFile: vi
          .fn()
          .mockReturnValue('/packages/ui/tsconfig.json'),
      } as unknown as TypeScriptConfigCache

      const builder = new SubAgentContextBuilder(mockCache)

      const context = await builder.buildContext(
        ['Type error'],
        '/packages/ui/src/Button.tsx',
      )

      expect(context.tsConfigPath).toBe('/packages/ui/tsconfig.json')
      expect(context.configMappings).toBeDefined()
      expect(context.configMappings).toEqual({})
    })

    it('extracts nearby files for additional context', async () => {
      const fs = await import('fs')
      vi.mocked(fs.existsSync).mockImplementation((pathArg) => {
        const validPaths = [
          '/project/src/components/Button.tsx',
          '/project/src/components/Button.test.tsx',
          '/project/src/components/Button.stories.tsx',
          '/project/src/components/index.ts',
        ]
        return validPaths.includes(pathArg as string)
      })

      const mockCache = {
        getTsConfigForFile: vi.fn().mockReturnValue('/project/tsconfig.json'),
        getCachedMappings: vi.fn().mockReturnValue({}),
      } as unknown as TypeScriptConfigCache

      const builder = new SubAgentContextBuilder(mockCache)

      const context = await builder.buildContext(
        ['Error'],
        '/project/src/components/Button.tsx',
      )

      expect(context.nearbyFiles).toBeDefined()
      expect(context.nearbyFiles).toContain('Button.test.tsx')
      expect(context.nearbyFiles).toContain('Button.stories.tsx')
      expect(context.nearbyFiles).toContain('index.ts')
    })

    it('categorizes errors correctly for escalation decisions', async () => {
      const mockCache = {
        getTsConfigForFile: vi.fn().mockReturnValue('/project/tsconfig.json'),
        getCachedMappings: vi.fn().mockReturnValue({}),
      } as unknown as TypeScriptConfigCache

      const builder = new SubAgentContextBuilder(mockCache)

      const errors = [
        "Property 'name' does not exist on type 'User'", // needs-reasoning
        'Missing semicolon', // auto-fixable
        "Cannot find module 'node_modules/react'", // dependency-warning
      ]

      const context = await builder.buildContext(errors, '/project/src/app.tsx')

      expect(context.errorDetails[0].category).toBe('needs-reasoning')
      expect(context.errorDetails[1].category).toBe('auto-fixable')
      expect(context.errorDetails[2].category).toBe('dependency-warning')
    })
  })

  describe('enrichWithProjectPatterns', () => {
    it('detects common project patterns and structures', async () => {
      const mockCache = {
        getTsConfigForFile: vi.fn().mockReturnValue('/project/tsconfig.json'),
        getCachedMappings: vi.fn().mockReturnValue({}),
      } as unknown as TypeScriptConfigCache

      const builder = new SubAgentContextBuilder(mockCache)

      const context = await builder.buildContext(
        ['Error'],
        '/project/packages/ui/src/components/Button/Button.tsx',
      )

      expect(context.projectPatterns.isMonorepo).toBe(true)
      expect(context.projectPatterns.packagePattern).toBe('@studio/*')
      expect(context.projectPatterns.relativePath).toBe(
        'packages/ui/src/components/Button/Button.tsx',
      )
      expect(context.projectPatterns.packageName).toBe('ui')
      expect(context.projectPatterns.componentPath).toBe(
        'src/components/Button',
      )
    })

    it('identifies Next.js app directory structure', async () => {
      const mockCache = {
        getTsConfigForFile: vi.fn().mockReturnValue('/project/tsconfig.json'),
        getCachedMappings: vi.fn().mockReturnValue({}),
      } as unknown as TypeScriptConfigCache

      const builder = new SubAgentContextBuilder(mockCache)

      const context = await builder.buildContext(
        ['Error'],
        '/project/app/dashboard/page.tsx',
      )

      expect(context.projectPatterns.framework).toBe('nextjs')
      expect(context.projectPatterns.isAppRouter).toBe(true)
    })
  })
})
