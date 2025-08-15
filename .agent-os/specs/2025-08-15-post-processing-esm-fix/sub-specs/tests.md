# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-15-post-processing-esm-fix/spec.md

> Created: 2025-08-15
> Version: 1.0.0

## Test Coverage

### Unit Tests

**Script Functionality Tests**

- Correctly adds `.js` to relative imports without extensions
- Preserves imports that already have `.js` extension
- Ignores non-relative imports (packages, node modules)
- Preserves `.json` imports unchanged
- Handles dynamic imports correctly
- Processes re-export statements
- Preserves source map comments
- Handles edge cases (multiline imports, etc.)

**Pattern Matching Tests**

- Standard import: `import { x } from './module'`
- Default import: `import x from './module'`
- Namespace import: `import * as x from './module'`
- Side-effect import: `import './module'`
- Dynamic import: `await import('./module')`
- Re-export: `export { x } from './module'`
- Export all: `export * from './module'`

**File Processing Tests**

- Processes all `.js` files in directory
- Skips non-JavaScript files
- Handles nested directories
- Reports correct statistics

### Integration Tests

**Build Pipeline Tests**

- Script runs successfully after TypeScript compilation
- Build completes without errors
- Output directory structure is preserved
- Source maps remain valid

**Runtime Tests**

- Fixed modules import correctly in Node.js
- CLI binaries execute without import errors
- Cross-package imports work correctly
- Dynamic imports resolve at runtime

**Package-Specific Tests**

- @studio/logger builds and runs correctly
- @studio/claude-hooks CLI tools work
- @studio/ui components can be imported
- All packages pass their existing tests

### End-to-End Tests

**Developer Workflow Tests**

```typescript
describe('Developer Workflow', () => {
  it('should maintain fast development cycle', async () => {
    // Make a change to source
    await fs.writeFile('src/test.ts', 'export const value = 1')

    // Build with fix script
    await exec('pnpm build')

    // Verify output has .js extensions
    const output = await fs.readFile('dist/test.js', 'utf8')
    expect(output).toContain("from './utils.js'")

    // Verify it runs
    const { stdout } = await exec('node dist/test.js')
    expect(stdout).not.toContain('ERR_MODULE_NOT_FOUND')
  })
})
```

**Production Build Tests**

```typescript
describe('Production Build', () => {
  it('should produce valid ES modules', async () => {
    process.env.NODE_ENV = 'production'
    await exec('pnpm build')

    // Test import in Node.js
    const module = await import('../dist/index.js')
    expect(module).toBeDefined()
  })

  it('should work with npm link', async () => {
    await exec('pnpm build')
    await exec('npm link')

    // In test consumer
    await exec('npm link @studio/logger')
    const { stderr } = await exec('node test.js')
    expect(stderr).not.toContain('Cannot find module')
  })
})
```

## Test Implementation

### Unit Test Suite

```typescript
// scripts/__tests__/fix-esm-extensions.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { fixEsmExtensions } from '../fix-esm-extensions.js'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

describe('fixEsmExtensions', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true })
  })

  it('should add .js to relative imports', async () => {
    const inputCode = `
      import { logger } from './logger';
      import utils from './utils';
      export { config } from './config';
    `

    const expectedCode = `
      import { logger } from './logger.js';
      import utils from './utils.js';
      export { config } from './config.js';
    `

    await fs.writeFile(path.join(tempDir, 'test.js'), inputCode)
    await fixEsmExtensions(tempDir)

    const result = await fs.readFile(path.join(tempDir, 'test.js'), 'utf8')
    expect(result).toBe(expectedCode)
  })

  it('should not modify package imports', async () => {
    const code = `
      import React from 'react';
      import { PrismaClient } from '@studio/db';
      import fs from 'node:fs';
    `

    await fs.writeFile(path.join(tempDir, 'test.js'), code)
    await fixEsmExtensions(tempDir)

    const result = await fs.readFile(path.join(tempDir, 'test.js'), 'utf8')
    expect(result).toBe(code) // Should be unchanged
  })

  it('should handle dynamic imports', async () => {
    const inputCode = `
      const module = await import('./lazy-module');
      import('./another').then(m => console.log(m));
    `

    const expectedCode = `
      const module = await import('./lazy-module.js');
      import('./another.js').then(m => console.log(m));
    `

    await fs.writeFile(path.join(tempDir, 'test.js'), inputCode)
    await fixEsmExtensions(tempDir)

    const result = await fs.readFile(path.join(tempDir, 'test.js'), 'utf8')
    expect(result).toBe(expectedCode)
  })

  it('should preserve JSON imports', async () => {
    const code = `
      import config from './config.json';
      import data from './data.json' assert { type: 'json' };
    `

    await fs.writeFile(path.join(tempDir, 'test.js'), code)
    await fixEsmExtensions(tempDir)

    const result = await fs.readFile(path.join(tempDir, 'test.js'), 'utf8')
    expect(result).toBe(code) // JSON imports unchanged
  })

  it('should handle files in nested directories', async () => {
    const nestedDir = path.join(tempDir, 'nested', 'deep')
    await fs.mkdir(nestedDir, { recursive: true })

    const code = `import { x } from './module';`
    await fs.writeFile(path.join(nestedDir, 'test.js'), code)

    await fixEsmExtensions(tempDir)

    const result = await fs.readFile(path.join(nestedDir, 'test.js'), 'utf8')
    expect(result).toBe(`import { x } from './module.js';`)
  })
})
```

### Integration Test Suite

```typescript
// packages/test-integration/__tests__/build-integration.test.ts
describe('Build Integration', () => {
  it('should build package with fixed extensions', async () => {
    // Build a test package
    const { stderr } = await exec('pnpm --filter @studio/logger build')
    expect(stderr).not.toContain('error')

    // Check output has .js extensions
    const indexPath = 'packages/logger/dist/index.js'
    const content = await fs.readFile(indexPath, 'utf8')

    // Should have .js in imports
    expect(content).toMatch(/from ['"]\.\/.*\.js['"]/)

    // Should not have imports without extensions
    expect(content).not.toMatch(/from ['"]\.\/[^'"]*(?<!\.js|\.json)['"]/)
  })

  it('should produce runnable CLI binaries', async () => {
    await exec('pnpm --filter @studio/claude-hooks build')

    const { stdout, stderr } = await exec(
      'node packages/claude-hooks/dist/bin/claude-hooks-stop.js --help',
    )

    expect(stderr).toBe('')
    expect(stdout).toContain('Usage:')
  })

  it('should maintain cross-package imports', async () => {
    // Build dependencies in order
    await exec('pnpm --filter @studio/schema build')
    await exec('pnpm --filter @studio/logger build')

    // Test cross-package import
    const testCode = `
      import { logger } from '@studio/logger';
      logger.info('Test');
    `

    await fs.writeFile('test-import.js', testCode)
    const { stderr } = await exec('node test-import.js')

    expect(stderr).not.toContain('Cannot find module')
  })
})
```

## Test Execution Plan

### Phase 1: Script Testing

Test the script in isolation:

```bash
# Run script unit tests
pnpm test scripts/__tests__/fix-esm-extensions.test.ts
```

### Phase 2: Single Package Testing

Test with one package:

```bash
# Build and test @studio/logger
pnpm --filter @studio/logger build
pnpm --filter @studio/logger test
```

### Phase 3: Full Integration Testing

Test entire monorepo:

```bash
# Build everything
pnpm build

# Run all tests
pnpm test

# Test specific scenarios
pnpm test:integration
```

## Performance Benchmarks

```typescript
describe('Performance', () => {
  it('should process files quickly', async () => {
    // Create 100 test files
    for (let i = 0; i < 100; i++) {
      await fs.writeFile(
        path.join(tempDir, `file${i}.js`),
        `import { x } from './module';`,
      )
    }

    const start = Date.now()
    await fixEsmExtensions(tempDir)
    const duration = Date.now() - start

    // Should process 100 files in under 500ms
    expect(duration).toBeLessThan(500)
  })

  it('should add minimal overhead to build', async () => {
    // Measure build without script
    const startTsc = Date.now()
    await exec('tsc')
    const tscTime = Date.now() - startTsc

    // Measure build with script
    const startFull = Date.now()
    await exec('tsc && node scripts/fix-esm-extensions.js dist')
    const fullTime = Date.now() - startFull

    // Script should add < 1 second
    expect(fullTime - tscTime).toBeLessThan(1000)
  })
})
```

## Edge Case Testing

```typescript
describe('Edge Cases', () => {
  it('should handle multiline imports', async () => {
    const input = `
      import {
        logger,
        createLogger
      } from './logger';
    `

    const expected = `
      import {
        logger,
        createLogger
      } from './logger.js';
    `

    // Test processing
  })

  it('should preserve source map comments', async () => {
    const code = `
      import { x } from './module';
      //# sourceMappingURL=index.js.map
    `

    // Source map comment should remain unchanged
  })

  it('should handle empty files', async () => {
    await fs.writeFile(path.join(tempDir, 'empty.js'), '')

    // Should not crash
    await expect(fixEsmExtensions(tempDir)).resolves.not.toThrow()
  })
})
```

## Success Metrics

### Test Coverage

- Unit test coverage: > 90%
- Integration test coverage: > 80%
- All edge cases covered

### Quality Gates

- Zero failing tests
- No runtime errors
- All packages build successfully
- CLI tools execute correctly

### Performance Targets

- Script execution: < 200ms per package
- Total build overhead: < 1 second
- No memory leaks

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test ESM Fix

on:
  pull_request:
    paths:
      - 'scripts/fix-esm-extensions.js'
      - 'packages/*/package.json'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm test:script
      - run: pnpm build
      - run: pnpm test
      - run: pnpm test:integration
```
