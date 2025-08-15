# Testing Strategy

This document outlines the comprehensive testing strategy for the Bun migration.

> Created: 2025-08-16
> Version: 1.0.0

## Testing Philosophy

### Core Principles

1. **Test Everything Twice** - Once in Node.js (before), once in Bun (after)
2. **External Validation** - Separate test package to validate external consumption
3. **Performance Tracking** - Measure and document all improvements
4. **Zero Regression** - Every existing test must pass after migration
5. **New Capabilities** - Test Bun-specific features thoroughly

## Test Categories

### 1. Unit Tests

#### Migration from Vitest to Bun Test

```typescript
// Before (Vitest)
import { describe, it, expect, vi } from 'vitest'

describe('Logger', () => {
  it('should log messages', () => {
    const spy = vi.spyOn(console, 'log')
    logger.info('test')
    expect(spy).toHaveBeenCalledWith('test')
  })
})

// After (Bun)
import { describe, it, expect, spyOn } from 'bun:test'

describe('Logger', () => {
  it('should log messages', () => {
    const spy = spyOn(console, 'log')
    logger.info('test')
    expect(spy).toHaveBeenCalledWith('test')
  })
})
```

#### Test Coverage Requirements

- **Minimum Coverage**: 80% across all packages
- **Critical Paths**: 100% coverage for core functionality
- **Edge Cases**: Comprehensive testing of error conditions
- **Performance**: Benchmark tests for all critical operations

### 2. Integration Tests

#### Cross-Package Testing

```typescript
// packages/test-external/tests/cross-package.test.ts
import { describe, test, expect } from 'bun:test'
import { logger } from '@studio/logger'
import { db } from '@studio/db'
import { validateSchema } from '@studio/schema'

describe('Cross-Package Integration', () => {
  test('packages work together', async () => {
    // Test that logger works with db
    const spy = spyOn(logger, 'info')
    await db.message.create({ data: testData })
    expect(spy).toHaveBeenCalled()

    // Test schema validation
    const result = validateSchema(testData)
    expect(result.success).toBe(true)
  })

  test('no .js extensions in runtime', () => {
    // This would fail with Node.js if .js extensions were missing
    // But works perfectly with Bun
    expect(() => require('@studio/logger')).not.toThrow()
  })
})
```

### 3. End-to-End Tests

#### CLI Binary Testing

```typescript
// Test native binary compilation
describe('Binary Compilation', () => {
  test('claude-hooks compiles to binary', async () => {
    const { exitCode } = await $`bun build --compile \
      ./packages/claude-hooks/src/bin/claude-hooks-stop.ts \
      --outfile ./test-binary`

    expect(exitCode).toBe(0)
    expect(await Bun.file('./test-binary').exists()).toBe(true)

    // Test binary execution
    const { stdout } = await $`./test-binary --help`
    expect(stdout.toString()).toContain('Usage')
  })
})
```

#### Edge Runtime Testing

```typescript
// Test Cloudflare Workers compatibility
describe('Edge Runtime', () => {
  test('runs in Cloudflare Workers', async () => {
    const worker = await unstable_dev('packages/api/src/worker.ts', {
      experimental: { disableExperimentalWarning: true },
    })

    const resp = await worker.fetch('/api/health')
    expect(await resp.text()).toBe('OK')

    await worker.stop()
  })

  test('runs in Deno Deploy', async () => {
    // Test Deno compatibility
    const { exitCode } = await $`deno run \
      --allow-read --allow-net \
      packages/api/src/deno.ts`

    expect(exitCode).toBe(0)
  })
})
```

### 4. Performance Tests

#### Benchmark Suite

```typescript
// packages/test-external/bench/performance.ts
import { bench, run } from 'mitata'

// Startup Performance
bench('cold start - Node.js baseline', async () => {
  await $`node packages/logger/dist/index.js`
})

bench('cold start - Bun', async () => {
  await $`bun packages/logger/src/index.ts`
})

bench('cold start - Bun compiled', async () => {
  await $`./packages/logger/dist/logger-binary`
})

// Build Performance
bench('build time - tsc', async () => {
  await $`cd packages/logger && tsc`
})

bench('build time - Bun', async () => {
  await $`cd packages/logger && bun run build.ts`
})

// Module Loading
bench('import @studio/logger - Node.js', async () => {
  await import('@studio/logger')
})

bench('import @studio/logger - Bun', async () => {
  await import('@studio/logger')
})

// Test Execution
bench('test suite - Vitest', async () => {
  await $`cd packages/logger && vitest run`
})

bench('test suite - Bun', async () => {
  await $`cd packages/logger && bun test`
})

await run({
  percentiles: [0.5, 0.75, 0.9, 0.99],
  colors: true,
})
```

#### Expected Performance Improvements

| Metric       | Node.js/Vitest | Bun   | Improvement |
| ------------ | -------------- | ----- | ----------- |
| Cold Start   | 500ms          | 50ms  | 10x         |
| Build Time   | 5000ms         | 500ms | 10x         |
| Test Suite   | 3000ms         | 300ms | 10x         |
| HMR Update   | 1000ms         | 50ms  | 20x         |
| Module Load  | 100ms          | 10ms  | 10x         |
| Memory Usage | 150MB          | 50MB  | 3x          |

### 5. Compatibility Tests

#### Node.js Fallback Testing

```typescript
// Ensure packages still work with Node.js
describe('Node.js Compatibility', () => {
  test('packages work in Node.js', async () => {
    // Build for Node.js
    await $`bun run build`

    // Test with Node.js
    const { exitCode, stderr } = await $`node -e "
      const { logger } = require('@studio/logger');
      logger.info('Node.js test');
    "`

    expect(exitCode).toBe(0)
    expect(stderr.toString()).not.toContain('Error')
  })
})
```

## External Test Package

### Structure

```
packages/test-external/
├── tests/
│   ├── unit/
│   │   ├── imports.test.ts      # Test import patterns
│   │   ├── exports.test.ts      # Test export patterns
│   │   └── extensions.test.ts   # Verify no .js issues
│   ├── integration/
│   │   ├── cross-package.test.ts
│   │   ├── cli-tools.test.ts
│   │   └── build-pipeline.test.ts
│   ├── e2e/
│   │   ├── development.test.ts
│   │   ├── production.test.ts
│   │   └── edge-runtime.test.ts
│   └── performance/
│       ├── benchmarks.ts
│       └── memory-profiling.ts
├── bench/
│   └── suite.ts
├── fixtures/
│   └── test-app/           # Mini app for testing
├── package.json
└── bunfig.toml
```

### Test Scenarios

#### 1. Import Resolution Testing

```typescript
// Verify ALL import patterns work without .js extensions
describe('Import Resolution', () => {
  test('relative imports', async () => {
    const code = `
      import { utils } from './utils';
      import type { Config } from './types';
      export { utils };
    `

    await Bun.write('test.ts', code)
    const module = await import('./test.ts')
    expect(module.utils).toBeDefined()
  })

  test('workspace imports', async () => {
    const modules = [
      '@studio/logger',
      '@studio/db',
      '@studio/ui',
      '@studio/claude-hooks',
    ]

    for (const mod of modules) {
      expect(async () => await import(mod)).not.toThrow()
    }
  })

  test('dynamic imports', async () => {
    const lazyModule = await import('@studio/logger')
    expect(lazyModule.logger).toBeDefined()
  })
})
```

#### 2. Binary Testing

```typescript
describe('Binary Compilation', () => {
  test('all CLI tools compile', async () => {
    const tools = [
      'claude-hooks-stop',
      'claude-hooks-quality',
      'claude-hooks-cache-stats',
    ]

    for (const tool of tools) {
      const { exitCode } = await $`bun build --compile \
        packages/claude-hooks/src/bin/${tool}.ts \
        --outfile dist/${tool}`

      expect(exitCode).toBe(0)

      // Test execution
      const { stdout } = await $`./dist/${tool} --help`
      expect(stdout.toString()).toContain('Usage')
    }
  })
})
```

#### 3. External Consumption Testing

```typescript
// Simulate external npm package consuming our packages
describe('External NPM Consumption', () => {
  test('packages work via npm link', async () => {
    // Create test consumer
    await $`mkdir -p /tmp/test-consumer`
    await $`cd /tmp/test-consumer && npm init -y`

    // Link our packages
    await $`cd packages/logger && npm link`
    await $`cd /tmp/test-consumer && npm link @studio/logger`

    // Test import
    const testCode = `
      const { logger } = require('@studio/logger');
      logger.info('External test');
    `

    await Bun.write('/tmp/test-consumer/test.js', testCode)
    const { exitCode } = await $`node /tmp/test-consumer/test.js`

    expect(exitCode).toBe(0)
  })
})
```

## Test Automation

### CI/CD Pipeline

```yaml
# .github/workflows/bun-tests.yml
name: Bun Migration Tests

on:
  pull_request:
    branches: [main, feature/bun-migration]
  push:
    branches: [feature/bun-migration]

jobs:
  test-matrix:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        bun-version: [1.1.38, latest]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ matrix.bun-version }}

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun test

      - name: Run benchmarks
        run: bun run bench

      - name: Test binary compilation
        run: bun run test:binary

      - name: Test external package
        run: cd packages/test-external && bun test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### Pre-Migration Testing

```bash
#!/bin/bash
# scripts/pre-migration-baseline.sh

echo "📊 Capturing baseline metrics..."

# Capture current build times
time pnpm build > baseline-build.log 2>&1

# Capture current test times
time pnpm test > baseline-tests.log 2>&1

# Capture bundle sizes
du -sh packages/*/dist > baseline-sizes.log

# Capture memory usage
/usr/bin/time -l pnpm dev > baseline-memory.log 2>&1 &
sleep 10
kill $!

echo "✅ Baseline captured"
```

### Post-Migration Validation

```bash
#!/bin/bash
# scripts/post-migration-validate.sh

echo "🔍 Validating migration..."

# Check for .js extensions
if grep -r "\.js['\"]" packages/*/src; then
  echo "❌ Found .js extensions in source!"
  exit 1
fi

# Verify all packages build
for pkg in packages/*; do
  if [ -f "$pkg/package.json" ]; then
    echo "Building $pkg..."
    (cd $pkg && bun run build) || exit 1
  fi
done

# Run external tests
(cd packages/test-external && bun test) || exit 1

echo "✅ Migration validated successfully"
```

## Testing Best Practices

### 1. Test Migration Strategy

- **Parallel Testing**: Run Node.js and Bun tests side-by-side during migration
- **Incremental Migration**: Migrate tests package by package
- **Fallback Plan**: Keep Vitest config as backup

### 2. Coverage Requirements

```toml
# bunfig.toml test configuration
[test]
coverage = true
coverageThreshold = {
  line = 80,
  function = 80,
  branch = 70
}
coverageSkipTestFiles = true
```

### 3. Performance Regression Detection

```typescript
// Automated performance regression detection
import { bench } from 'mitata'

const baseline = {
  startup: 500, // ms
  build: 5000, // ms
  test: 3000, // ms
}

bench.threshold('startup', baseline.startup * 0.2) // Must be 5x faster
bench.threshold('build', baseline.build * 0.2) // Must be 5x faster
bench.threshold('test', baseline.test * 0.2) // Must be 5x faster
```

## Success Metrics

### Functional Success

- ✅ All existing tests pass in Bun
- ✅ Zero .js extension errors
- ✅ Binary compilation works for all CLIs
- ✅ External package validates all integrations
- ✅ Edge runtime deployment successful

### Performance Success

- ✅ 10x faster test execution
- ✅ 10x faster builds
- ✅ 20x faster HMR
- ✅ 3x less memory usage
- ✅ Sub-second CI/CD runs

### Quality Success

- ✅ Code coverage > 80%
- ✅ Zero runtime errors
- ✅ All benchmarks pass thresholds
- ✅ Security audit clean
- ✅ Type safety maintained
