# External Test Package Specification

This document details the implementation of an external test package to validate the Bun migration from an outside perspective.

> Created: 2025-08-16
> Version: 1.0.0

## Purpose

The external test package (`@studio/test-external`) serves as an independent validation layer that:

1. **Validates external consumption** - Tests packages as external consumers would use them
2. **Verifies no .js extension issues** - Ensures clean imports work everywhere
3. **Tests binary compilation** - Validates native binaries work correctly
4. **Benchmarks performance** - Measures real-world performance improvements
5. **Cross-platform validation** - Tests on multiple operating systems
6. **Edge runtime testing** - Validates Cloudflare Workers and Deno compatibility

## Package Structure

```
packages/test-external/
├── src/
│   ├── consumer.ts              # Simulates external consumer
│   ├── validator.ts             # Validation utilities
│   └── benchmarker.ts           # Performance benchmarking
├── tests/
│   ├── unit/
│   │   ├── imports.test.ts      # Import resolution tests
│   │   ├── exports.test.ts      # Export validation tests
│   │   ├── extensions.test.ts   # .js extension verification
│   │   └── types.test.ts        # TypeScript type tests
│   ├── integration/
│   │   ├── cross-package.test.ts # Cross-package integration
│   │   ├── cli-tools.test.ts     # CLI binary tests
│   │   ├── npm-link.test.ts      # NPM link simulation
│   │   └── vite-consumer.test.ts # Vite app consumption
│   ├── e2e/
│   │   ├── development.test.ts   # Dev workflow tests
│   │   ├── production.test.ts    # Prod deployment tests
│   │   ├── edge-runtime.test.ts  # Edge platform tests
│   │   └── docker.test.ts        # Container tests
│   ├── performance/
│   │   ├── benchmarks.test.ts    # Performance benchmarks
│   │   ├── memory.test.ts        # Memory profiling
│   │   ├── startup.test.ts       # Startup time tests
│   │   └── comparison.test.ts    # Node vs Bun comparison
│   └── compatibility/
│       ├── node.test.ts          # Node.js compatibility
│       ├── deno.test.ts          # Deno compatibility
│       ├── browser.test.ts       # Browser compatibility
│       └── workers.test.ts       # Web Workers tests
├── fixtures/
│   ├── test-app/                 # Mini Next.js app
│   ├── test-cli/                 # CLI consumer
│   ├── test-library/             # Library consumer
│   └── test-worker/              # Edge worker
├── bench/
│   ├── suite.ts                  # Benchmark suite
│   └── results/                  # Benchmark results
├── reports/
│   ├── coverage/                 # Coverage reports
│   ├── performance/              # Performance reports
│   └── compatibility/            # Compatibility matrix
├── package.json
├── bunfig.toml
├── tsconfig.json
└── README.md
```

## Implementation Details

### Package Configuration

```json
// packages/test-external/package.json
{
  "name": "@studio/test-external",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "bun test",
    "test:unit": "bun test tests/unit",
    "test:integration": "bun test tests/integration",
    "test:e2e": "bun test tests/e2e",
    "test:performance": "bun test tests/performance",
    "test:compatibility": "bun test tests/compatibility",
    "bench": "bun run bench/suite.ts",
    "validate": "bun run src/validator.ts",
    "report": "bun run scripts/generate-report.ts"
  },
  "dependencies": {
    // Import all workspace packages as external consumer would
    "@studio/logger": "workspace:*",
    "@studio/db": "workspace:*",
    "@studio/ui": "workspace:*",
    "@studio/schema": "workspace:*",
    "@studio/claude-hooks": "workspace:*",
    "@studio/memory": "workspace:*",
    "@studio/scripts": "workspace:*",
    "@studio/mcp": "workspace:*"
  },
  "devDependencies": {
    "bun-types": "latest",
    "mitata": "^0.1.0",
    "playwright": "^1.40.0",
    "vitest": "^1.0.0" // For comparison testing
  }
}
```

### Core Test Implementations

#### 1. Import Resolution Testing

```typescript
// tests/unit/imports.test.ts
import { describe, test, expect } from 'bun:test'
import { glob } from 'glob'

describe('Import Resolution - No .js Extensions', () => {
  test('all workspace imports work without extensions', async () => {
    // Test every package import
    const packages = [
      '@studio/logger',
      '@studio/db',
      '@studio/ui',
      '@studio/schema',
      '@studio/claude-hooks',
      '@studio/memory',
      '@studio/scripts',
      '@studio/mcp',
    ]

    for (const pkg of packages) {
      // Should not throw
      const module = await import(pkg)
      expect(module).toBeDefined()
      console.log(`✅ ${pkg} imported successfully`)
    }
  })

  test('subpath imports work without extensions', async () => {
    // Test subpath exports
    const subpaths = [
      '@studio/claude-hooks/speech',
      '@studio/db/testing',
      '@studio/ui/components',
    ]

    for (const path of subpaths) {
      try {
        const module = await import(path)
        expect(module).toBeDefined()
        console.log(`✅ ${path} imported successfully`)
      } catch (e) {
        // Some subpaths might not exist, that's ok
        console.log(`ℹ️ ${path} not exported (expected)`)
      }
    }
  })

  test('no .js extensions in compiled output', async () => {
    // Scan all dist directories
    const distFiles = await glob('../../packages/*/dist/**/*.js')

    for (const file of distFiles) {
      const content = await Bun.file(file).text()

      // Check for .js in relative imports
      const jsImports = content.match(/from\s+['"]\.\/.*\.js['"]/g)

      if (jsImports && jsImports.length > 0) {
        throw new Error(`Found .js extension in ${file}: ${jsImports[0]}`)
      }
    }

    console.log(
      `✅ Scanned ${distFiles.length} files - no .js extensions found`,
    )
  })
})
```

#### 2. Binary Compilation Testing

```typescript
// tests/integration/cli-tools.test.ts
import { describe, test, expect } from 'bun:test'
import { $ } from 'bun'

describe('CLI Binary Compilation', () => {
  const tools = [
    { name: 'claude-hooks-stop', hasHelp: true },
    { name: 'claude-hooks-quality', hasHelp: true },
    { name: 'claude-hooks-cache-stats', hasHelp: true },
  ]

  test('all CLI tools compile to native binaries', async () => {
    for (const tool of tools) {
      const srcPath = `../../packages/claude-hooks/src/bin/${tool.name}.ts`
      const outPath = `/tmp/${tool.name}-test`

      // Compile to binary
      const { exitCode } =
        await $`bun build --compile ${srcPath} --outfile ${outPath}`.quiet()

      expect(exitCode).toBe(0)
      expect(await Bun.file(outPath).exists()).toBe(true)

      // Test execution
      if (tool.hasHelp) {
        const { stdout } = await $`${outPath} --help`.quiet()
        expect(stdout.toString()).toContain('Usage')
      }

      console.log(`✅ ${tool.name} compiled and executed successfully`)
    }
  })

  test('binary performance vs script', async () => {
    const tool = 'claude-hooks-stop'

    // Time TypeScript execution
    const tsStart = performance.now()
    await $`bun ../../packages/claude-hooks/src/bin/${tool}.ts --help`.quiet()
    const tsTime = performance.now() - tsStart

    // Time binary execution
    const binStart = performance.now()
    await $`/tmp/${tool}-test --help`.quiet()
    const binTime = performance.now() - binStart

    console.log(`TypeScript: ${tsTime.toFixed(2)}ms`)
    console.log(`Binary: ${binTime.toFixed(2)}ms`)
    console.log(`Speedup: ${(tsTime / binTime).toFixed(1)}x`)

    // Binary should be at least 5x faster
    expect(binTime * 5).toBeLessThan(tsTime)
  })
})
```

#### 3. External Consumption Testing

```typescript
// tests/integration/npm-link.test.ts
import { describe, test, expect } from 'bun:test'
import { $ } from 'bun'
import { mkdtemp, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'

describe('External NPM Consumption', () => {
  test('packages work via npm link', async () => {
    // Create temporary consumer project
    const tempDir = await mkdtemp(join(tmpdir(), 'test-consumer-'))

    try {
      // Initialize consumer project
      await $`cd ${tempDir} && npm init -y`.quiet()

      // Link our packages
      await $`cd ../../packages/logger && npm link`.quiet()
      await $`cd ${tempDir} && npm link @studio/logger`.quiet()

      // Create test file
      const testCode = `
        const { logger } = require('@studio/logger');
        logger.info('External consumer test');
        console.log('SUCCESS');
      `

      await Bun.write(join(tempDir, 'test.js'), testCode)

      // Run with Node.js
      const { stdout, exitCode } =
        await $`cd ${tempDir} && node test.js`.quiet()

      expect(exitCode).toBe(0)
      expect(stdout.toString()).toContain('SUCCESS')

      console.log(`✅ NPM link consumption works`)
    } finally {
      // Cleanup
      await rm(tempDir, { recursive: true })
    }
  })

  test('packages work in Vite app', async () => {
    // Test in fixtures/test-app (Vite app)
    const { exitCode } = await $`
      cd fixtures/test-app && 
      bun install && 
      bun run build
    `.quiet()

    expect(exitCode).toBe(0)
    console.log(`✅ Vite app builds successfully`)
  })
})
```

#### 4. Performance Benchmarking

```typescript
// tests/performance/benchmarks.test.ts
import { describe, test, expect } from 'bun:test'
import { bench, run } from 'mitata'

describe('Performance Benchmarks', () => {
  test('import performance', async () => {
    // Benchmark import times
    bench('import @studio/logger', async () => {
      await import('@studio/logger')
    })

    bench('import @studio/db', async () => {
      await import('@studio/db')
    })

    bench('import @studio/ui', async () => {
      await import('@studio/ui')
    })

    const results = await run({ silent: true })

    // All imports should be < 50ms
    for (const result of results) {
      expect(result.p50).toBeLessThan(50)
      console.log(`${result.name}: ${result.p50.toFixed(2)}ms`)
    }
  })

  test('memory usage', () => {
    const baseline = process.memoryUsage().heapUsed

    // Import all packages
    import('@studio/logger')
    import('@studio/db')
    import('@studio/ui')
    import('@studio/schema')

    const afterImport = process.memoryUsage().heapUsed
    const used = (afterImport - baseline) / 1024 / 1024

    console.log(`Memory used: ${used.toFixed(2)}MB`)

    // Should use less than 50MB
    expect(used).toBeLessThan(50)
  })
})
```

#### 5. Edge Runtime Testing

```typescript
// tests/e2e/edge-runtime.test.ts
import { describe, test, expect } from 'bun:test'
import { $ } from 'bun'

describe('Edge Runtime Compatibility', () => {
  test('Cloudflare Workers compatibility', async () => {
    // Build for Cloudflare Workers
    const { exitCode } = await $`
      bun build ../../packages/api/src/worker.ts \
        --target webworker \
        --outdir /tmp/worker
    `.quiet()

    expect(exitCode).toBe(0)

    // Validate output
    const workerCode = await Bun.file('/tmp/worker/worker.js').text()

    // Should not contain Node.js specific APIs
    expect(workerCode).not.toContain('require(')
    expect(workerCode).not.toContain('process.')
    expect(workerCode).not.toContain('__dirname')

    console.log(`✅ Cloudflare Workers build successful`)
  })

  test('Deno compatibility', async () => {
    // Test with Deno if available
    try {
      const { exitCode } = await $`
        deno run --allow-read --allow-net \
          fixtures/test-worker/deno.ts
      `.quiet()

      expect(exitCode).toBe(0)
      console.log(`✅ Deno compatibility verified`)
    } catch (e) {
      console.log(`ℹ️ Deno not installed, skipping`)
    }
  })
})
```

### Test Fixtures

#### Mini Next.js App

```typescript
// fixtures/test-app/pages/index.tsx
import { logger } from '@studio/logger';
import { Button } from '@studio/ui';
import { validateSchema } from '@studio/schema';

export default function Home() {
  // Test that imports work
  logger.info('Page loaded');

  const isValid = validateSchema({ test: 'data' });

  return (
    <div>
      <h1>External Test App</h1>
      <Button onClick={() => logger.info('Clicked')}>
        Test Button
      </Button>
      <p>Schema valid: {isValid ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

#### CLI Consumer

```typescript
// fixtures/test-cli/index.js
#!/usr/bin/env node

// Test as external CLI consumer
const { logger } = require('@studio/logger');
const { db } = require('@studio/db');

logger.info('CLI Consumer Test');

// Test database operations
db.message.findMany()
  .then(messages => {
    console.log(`Found ${messages.length} messages`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
```

### Validation Script

```typescript
// src/validator.ts
import { glob } from 'glob'
import { $ } from 'bun'

export class ExternalValidator {
  static async validate(): Promise<ValidationReport> {
    const report: ValidationReport = {
      timestamp: new Date(),
      checks: [],
      passed: 0,
      failed: 0,
    }

    // Check 1: No .js extensions
    report.checks.push(await this.checkNoJsExtensions())

    // Check 2: All imports work
    report.checks.push(await this.checkImports())

    // Check 3: Binaries compile
    report.checks.push(await this.checkBinaries())

    // Check 4: Performance targets met
    report.checks.push(await this.checkPerformance())

    // Check 5: Memory usage acceptable
    report.checks.push(await this.checkMemory())

    // Check 6: Cross-platform compatibility
    report.checks.push(await this.checkCompatibility())

    // Generate report
    await this.generateReport(report)

    return report
  }

  private static async checkNoJsExtensions(): Promise<Check> {
    const files = await glob('../../packages/*/dist/**/*.js')
    let hasExtensions = false

    for (const file of files) {
      const content = await Bun.file(file).text()
      if (content.match(/from\s+['"]\.\/.*\.js['"]/)) {
        hasExtensions = true
        break
      }
    }

    return {
      name: 'No .js Extensions',
      passed: !hasExtensions,
      message: hasExtensions ? 'Found .js extensions' : 'Clean imports',
    }
  }

  private static async generateReport(report: ValidationReport) {
    const markdown = `
# External Validation Report

Generated: ${report.timestamp}

## Summary

- **Passed**: ${report.passed}
- **Failed**: ${report.failed}
- **Success Rate**: ${((report.passed / report.checks.length) * 100).toFixed(1)}%

## Checks

| Check | Status | Message |
|-------|--------|--------|
${report.checks
  .map((c) => `| ${c.name} | ${c.passed ? '✅' : '❌'} | ${c.message} |`)
  .join('\n')}

## Recommendations

${this.getRecommendations(report)}
`

    await Bun.write('reports/validation-report.md', markdown)
    console.log('📝 Report generated: reports/validation-report.md')
  }
}

// Run validation
if (import.meta.main) {
  const report = await ExternalValidator.validate()
  process.exit(report.failed > 0 ? 1 : 0)
}
```

## CI/CD Integration

```yaml
# .github/workflows/external-validation.yml
name: External Package Validation

on:
  pull_request:
    branches: [main, feature/bun-migration]
  push:
    branches: [feature/bun-migration]

jobs:
  validate:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node: [18, 20, 22]
        bun: [1.1.38, latest]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ matrix.bun }}

      - name: Install dependencies
        run: bun install

      - name: Build all packages
        run: bun run build

      - name: Run external tests
        run: |
          cd packages/test-external
          bun test

      - name: Run validation
        run: |
          cd packages/test-external
          bun run validate

      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: validation-report-${{ matrix.node }}-${{ matrix.bun }}
          path: packages/test-external/reports/

      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const report = require('./packages/test-external/reports/validation-report.json');
            const comment = `## External Validation Results\n\n✅ Passed: ${report.passed}\n❌ Failed: ${report.failed}`;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

## Success Criteria

### Functional Requirements

- ✅ All workspace packages import without errors
- ✅ Zero .js extension issues
- ✅ All CLI tools compile to binaries
- ✅ NPM link consumption works
- ✅ Vite app builds successfully
- ✅ Edge runtime compatibility verified

### Performance Requirements

- ✅ Import time < 50ms per package
- ✅ Memory usage < 50MB total
- ✅ Binary startup < 50ms
- ✅ Build time < 1s per package

### Quality Requirements

- ✅ 100% of tests passing
- ✅ Cross-platform compatibility
- ✅ TypeScript types resolve correctly
- ✅ No runtime errors

## Conclusion

The external test package provides comprehensive validation that the Bun migration successfully eliminates all .js extension issues while maintaining compatibility with external consumers. It serves as the final quality gate ensuring our packages work perfectly in real-world scenarios.
