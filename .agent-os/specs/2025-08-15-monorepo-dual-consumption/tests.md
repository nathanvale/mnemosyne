# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-15-monorepo-dual-consumption/spec.md

> Created: 2025-08-15
> Version: 1.0.0

## Test Coverage

### Unit Tests

**Package Export Resolution**

- Verify development condition resolves to source files
- Verify production condition resolves to built files
- Verify types always resolve to .d.ts files
- Test subpath export resolution
- Test wildcard export patterns

**Build Output Validation**

- Verify TypeScript compilation succeeds
- Verify declaration files are generated
- Verify source maps are created
- Test tree-shaking markers (sideEffects)
- Validate output file structure

**Import Resolution**

- Test ES module imports with .js extensions
- Test type-only imports
- Test dynamic imports
- Test circular dependency handling
- Verify workspace protocol resolution

### Integration Tests

**Cross-Package Dependencies**

- Test package A importing from package B in development
- Test package A importing from package B in production
- Verify hot reload propagates across packages
- Test nested dependency resolution
- Validate type checking across packages

**Next.js Integration**

- Test transpilePackages configuration in development
- Verify production build uses compiled packages
- Test server-side rendering with packages
- Validate client-side hydration
- Test API routes using packages

**Vite Integration**

- Test optimizeDeps exclusion for workspace packages
- Verify preserveSymlinks configuration
- Test HMR with linked packages
- Validate production build optimization
- Test CSS module imports from packages

### End-to-End Tests

**Development Workflow**

- Start dev server with source file consumption
- Make changes to package source
- Verify hot reload updates app
- Test debugging with source maps
- Validate TypeScript error reporting

**Production Workflow**

- Build all packages successfully
- Build Next.js app with compiled packages
- Start production server
- Verify no TypeScript in runtime
- Test performance metrics

**External Consumption**

- Create external test repository
- Link built packages via npm link
- Import in Vite project
- Verify ES modules work
- Test TypeScript types resolution

### Performance Tests

**Build Performance**

- Measure initial build time
- Test incremental build performance
- Validate Turborepo cache hits
- Test parallel build execution
- Measure bundle size impact

**Runtime Performance**

- Test development server startup time
- Measure hot reload speed
- Validate production load time
- Test tree-shaking effectiveness
- Measure memory usage

## Mocking Requirements

### File System Mocks

- **Mock package.json reads**: Test export resolution logic
- **Mock dist folder checks**: Validate build detection
- **Mock node_modules structure**: Test linking behavior

### Environment Mocks

- **NODE_ENV variations**: Test development/production/test modes
- **Process.cwd mocking**: Test path resolution
- **Import.meta.env**: Test Vite environment handling

### Build Tool Mocks

- **TypeScript compiler**: Test build success/failure scenarios
- **Turborepo cache**: Test cache hit/miss behavior
- **Bundler output**: Test optimization scenarios

## Test Implementation Examples

### Testing Export Resolution

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { resolveExport } from '../utils/resolve-export'

describe('Export Resolution', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'development'
  })

  it('should resolve to source in development', () => {
    const result = resolveExport('@studio/logger', {
      exports: {
        '.': {
          development: './src/index.ts',
          import: './dist/index.js',
        },
      },
    })
    expect(result).toBe('./src/index.ts')
  })

  it('should resolve to dist in production', () => {
    process.env.NODE_ENV = 'production'
    const result = resolveExport('@studio/logger', {
      exports: {
        '.': {
          development: './src/index.ts',
          import: './dist/index.js',
        },
      },
    })
    expect(result).toBe('./dist/index.js')
  })
})
```

### Testing Hot Reload

```typescript
import { describe, it, expect } from 'vitest'
import { createServer } from 'vite'

describe('Hot Module Replacement', () => {
  it('should reload on package source change', async () => {
    const server = await createServer({
      root: './test-app',
      server: { port: 5173 },
    })

    await server.listen()

    // Simulate file change in package
    const module = server.moduleGraph.getModuleById(
      '/packages/ui/src/Button.tsx',
    )

    await server.reloadModule(module)

    // Verify HMR update sent
    expect(server.ws.send).toHaveBeenCalledWith({
      type: 'update',
      updates: expect.arrayContaining([
        expect.objectContaining({
          path: '/packages/ui/src/Button.tsx',
        }),
      ]),
    })

    await server.close()
  })
})
```

### Testing External Consumption

```typescript
import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { existsSync } from 'fs'

describe('External Package Consumption', () => {
  it('should link and import successfully', () => {
    // Build package
    execSync('pnpm --filter @studio/logger build')

    // Create npm link
    execSync('npm link', { cwd: 'packages/logger' })

    // Link in test repo
    execSync('npm link @studio/logger', {
      cwd: '../test-consumer',
    })

    // Test import
    const result = execSync('node -e "import(\'@studio/logger\')"', {
      cwd: '../test-consumer',
    })

    expect(result.toString()).not.toContain('Error')
  })

  it('should resolve TypeScript types', () => {
    const typesPath =
      '../test-consumer/node_modules/@studio/logger/dist/index.d.ts'
    expect(existsSync(typesPath)).toBe(true)
  })
})
```

### Testing Build Output

```typescript
import { describe, it, expect } from 'vitest'
import { build } from 'vite'
import { analyze } from 'rollup-plugin-analyzer'

describe('Build Optimization', () => {
  it('should tree-shake unused exports', async () => {
    const result = await build({
      root: './test-app',
      build: {
        rollupOptions: {
          plugins: [analyze({ summaryOnly: true })],
        },
      },
    })

    // Verify unused Button component is not in bundle
    const output = result.output[0]
    expect(output.code).not.toContain('UnusedButton')
    expect(output.code).toContain('UsedButton')
  })

  it('should generate source maps', async () => {
    const result = await build({
      root: './packages/logger',
      build: { sourcemap: true },
    })

    const mapFile = result.output.find((f) => f.fileName.endsWith('.map'))
    expect(mapFile).toBeDefined()
  })
})
```

## Test Execution Strategy

### Local Development

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test tests/export-resolution.test.ts

# Run with coverage
pnpm test --coverage

# Watch mode
pnpm test --watch
```

### CI Pipeline

```yaml
- name: Test Dual Consumption
  run: |
    # Unit tests
    pnpm test:unit

    # Integration tests
    pnpm test:integration

    # E2E tests
    pnpm test:e2e

    # External consumption test
    ./scripts/test-external-consumption.sh
```

### Test Matrix

| Environment | Node Version | Package Manager | Bundler |
| ----------- | ------------ | --------------- | ------- |
| Development | 22.x         | pnpm            | Next.js |
| Production  | 22.x         | pnpm            | Next.js |
| External    | 22.x         | npm             | Vite    |
| CI          | 20.x, 22.x   | pnpm            | Both    |

## Success Criteria

Tests pass when:

- ✅ All unit tests pass (100% coverage)
- ✅ Integration tests complete without errors
- ✅ E2E workflows execute successfully
- ✅ External consumption works with Vite
- ✅ Performance benchmarks meet targets
- ✅ No regression in existing functionality
- ✅ TypeScript types resolve correctly
- ✅ Hot reload works across packages
- ✅ Production builds are optimized
- ✅ Source maps work in all environments
