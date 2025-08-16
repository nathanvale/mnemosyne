import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { fixEsmExtensions } from '../fix-esm-extensions.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('fix-esm-extensions', () => {
  let tempDir

  beforeEach(async () => {
    // Create a temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'esm-test-'))
  })

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  async function createTestFile(filename, content) {
    const filePath = path.join(tempDir, filename)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, content, 'utf8')
    return filePath
  }

  async function readTestFile(filename) {
    const filePath = path.join(tempDir, filename)
    return fs.readFile(filePath, 'utf8')
  }

  it('should add .js to relative imports', async () => {
    await createTestFile('test.js', `import { x } from './module'`)

    await fixEsmExtensions(tempDir)

    const content = await readTestFile('test.js')
    expect(content).toBe(`import { x } from './module.js'`)
  })

  it('should add .js to default imports', async () => {
    await createTestFile('test.js', `import x from './module'`)

    await fixEsmExtensions(tempDir)

    const content = await readTestFile('test.js')
    expect(content).toBe(`import x from './module.js'`)
  })

  it('should add .js to namespace imports', async () => {
    await createTestFile('test.js', `import * as x from './module'`)

    await fixEsmExtensions(tempDir)

    const content = await readTestFile('test.js')
    expect(content).toBe(`import * as x from './module.js'`)
  })

  it('should add .js to side-effect imports', async () => {
    await createTestFile('test.js', `import './module'`)

    await fixEsmExtensions(tempDir)

    const content = await readTestFile('test.js')
    expect(content).toBe(`import './module.js'`)
  })

  it('should add .js to dynamic imports', async () => {
    await createTestFile('test.js', `await import('./module')`)

    await fixEsmExtensions(tempDir)

    const content = await readTestFile('test.js')
    expect(content).toBe(`await import('./module.js')`)
  })

  it('should add .js to re-exports', async () => {
    await createTestFile('test.js', `export { x } from './module'`)

    await fixEsmExtensions(tempDir)

    const content = await readTestFile('test.js')
    expect(content).toBe(`export { x } from './module.js'`)
  })

  it('should add .js to export all statements', async () => {
    await createTestFile('test.js', `export * from './module'`)

    await fixEsmExtensions(tempDir)

    const content = await readTestFile('test.js')
    expect(content).toBe(`export * from './module.js'`)
  })

  it('should not modify package imports', async () => {
    const content = `import { x } from '@studio/logger'`
    await createTestFile('test.js', content)

    await fixEsmExtensions(tempDir)

    const result = await readTestFile('test.js')
    expect(result).toBe(content)
  })

  it('should not modify node built-in imports', async () => {
    const content = `import fs from 'fs'`
    await createTestFile('test.js', content)

    await fixEsmExtensions(tempDir)

    const result = await readTestFile('test.js')
    expect(result).toBe(content)
  })

  it('should not modify node: prefixed imports', async () => {
    const content = `import { readFile } from 'node:fs'`
    await createTestFile('test.js', content)

    await fixEsmExtensions(tempDir)

    const result = await readTestFile('test.js')
    expect(result).toBe(content)
  })

  it('should preserve existing .js extensions', async () => {
    const content = `import { x } from './module.js'`
    await createTestFile('test.js', content)

    await fixEsmExtensions(tempDir)

    const result = await readTestFile('test.js')
    expect(result).toBe(content)
  })

  it('should preserve .json extensions', async () => {
    const content = `import data from './config.json'`
    await createTestFile('test.js', content)

    await fixEsmExtensions(tempDir)

    const result = await readTestFile('test.js')
    expect(result).toBe(content)
  })

  it('should handle multiple imports in the same file', async () => {
    const input = `
import { x } from './module1'
import y from './module2'
import * as z from './module3'
await import('./module4')
export { a } from './module5'
export * from './module6'
`
    const expected = `
import { x } from './module1.js'
import y from './module2.js'
import * as z from './module3.js'
await import('./module4.js')
export { a } from './module5.js'
export * from './module6.js'
`
    await createTestFile('test.js', input)

    await fixEsmExtensions(tempDir)

    const result = await readTestFile('test.js')
    expect(result).toBe(expected)
  })

  it('should handle nested directories', async () => {
    await createTestFile('src/test.js', `import { x } from '../lib/module'`)

    await fixEsmExtensions(tempDir)

    const content = await readTestFile('src/test.js')
    expect(content).toBe(`import { x } from '../lib/module.js'`)
  })

  it('should handle imports with directory traversal', async () => {
    await createTestFile('test.js', `import { x } from '../../lib/module'`)

    await fixEsmExtensions(tempDir)

    const content = await readTestFile('test.js')
    expect(content).toBe(`import { x } from '../../lib/module.js'`)
  })

  it('should not modify source map comments', async () => {
    const content = `
import { x } from './module'
//# sourceMappingURL=test.js.map
`
    const expected = `
import { x } from './module.js'
//# sourceMappingURL=test.js.map
`
    await createTestFile('test.js', content)

    await fixEsmExtensions(tempDir)

    const result = await readTestFile('test.js')
    expect(result).toBe(expected)
  })

  it('should handle files in subdirectories', async () => {
    await createTestFile(
      'src/components/Button.js',
      `import { x } from './styles'`,
    )
    await createTestFile(
      'src/utils/helpers.js',
      `import { y } from '../constants'`,
    )

    await fixEsmExtensions(tempDir)

    const button = await readTestFile('src/components/Button.js')
    const helpers = await readTestFile('src/utils/helpers.js')

    expect(button).toBe(`import { x } from './styles.js'`)
    expect(helpers).toBe(`import { y } from '../constants.js'`)
  })

  it('should return statistics about processing', async () => {
    await createTestFile('file1.js', `import { x } from './module'`)
    await createTestFile('file2.js', `import { y } from '@studio/logger'`)
    await createTestFile('file3.js', `import { z } from './other'`)

    const stats = await fixEsmExtensions(tempDir)

    expect(stats.filesProcessed).toBe(3)
    expect(stats.filesModified).toBe(2) // file2.js not modified
    expect(stats.importsFixed).toBe(2)
  })

  it('should handle imports with complex paths', async () => {
    const input = `
import { helper } from './utils/helpers/string-utils'
import config from '../../../config/app-config'
import Component from './components/ui/Button/Button'
`
    const expected = `
import { helper } from './utils/helpers/string-utils.js'
import config from '../../../config/app-config.js'
import Component from './components/ui/Button/Button.js'
`
    await createTestFile('test.js', input)

    await fixEsmExtensions(tempDir)

    const result = await readTestFile('test.js')
    expect(result).toBe(expected)
  })

  it('should handle multiline imports correctly', async () => {
    const input = `import {
  ComponentA,
  ComponentB,
  ComponentC
} from './components'`

    const expected = `import {
  ComponentA,
  ComponentB,
  ComponentC
} from './components.js'`

    await createTestFile('test.js', input)

    await fixEsmExtensions(tempDir)

    const result = await readTestFile('test.js')
    expect(result).toBe(expected)
  })

  it('should handle dynamic imports with template literals when they are simple paths', async () => {
    // For simple template literals with just a path, we should handle them
    const input = `await import(\`./module\`)`
    const expected = `await import(\`./module.js\`)`

    await createTestFile('test.js', input)

    await fixEsmExtensions(tempDir)

    const result = await readTestFile('test.js')
    expect(result).toBe(expected)
  })
})
