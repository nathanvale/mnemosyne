# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-16-bun-migration-complete/spec.md

> Created: 2025-08-16
> Version: 1.0.0

## Technical Requirements

### Core Requirements

- Complete migration from Node.js/TypeScript to Bun runtime
- Eliminate ALL `.js` extension requirements permanently
- Implement native binary compilation for production
- Enable edge runtime compatibility
- Set up comprehensive testing including external test package
- Achieve <1 second build times per package
- Support hot module replacement with <100ms refresh
- Maintain 100% backward compatibility during migration

### Architecture Decisions

1. **Runtime**: Bun v1.1.38+ (latest stable)
2. **Build System**: Bun.build API with custom configurations
3. **Test Framework**: Bun's native test runner
4. **Package Manager**: Bun's built-in package manager
5. **Binary Compilation**: Bun's --compile flag
6. **Edge Compatibility**: Cloudflare Workers + Deno Deploy support
7. **Caching**: Multi-layer with Bun's cache + Turborepo

## Bun Configuration Architecture

### Global Configuration (bunfig.toml)

```toml
# Root bunfig.toml
[install]
registry = "https://registry.npmjs.org/"
lockfile.save = true
lockfile.print = "yarn"  # For compatibility

[install.cache]
dir = "~/.bun/cache"
disable = false
disableManifest = false
compression = "zstd"

[install.global]
dir = "~/.bun/global"

[install.lockfile]
save = true
print = "yarn"

[workspace]
packages = ["apps/*", "packages/*"]

[install.linkWorkspacePackages]
enabled = true

[dev]
port = 3000

[test]
root = "./__tests__"
preload = ["./test-setup.ts"]
coverage = true
coverageSkipTestFiles = true
coverageDirectory = "./coverage"
coverageReporter = ["text", "lcov", "html"]

[run]
silent = false
logLevel = "debug"

# Performance optimizations
[bundle]
minify = true
sourcemap = "external"
target = "node"
splitting = true
```

### Package-Level Build Configuration

```typescript
// packages/[name]/build.config.ts
import type { BuildConfig } from 'bun'

export default {
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'node',
  format: 'esm',
  splitting: true,
  sourcemap: 'external',
  minify: process.env.NODE_ENV === 'production',
  external: [
    '@studio/*', // Workspace packages
    'node:*', // Node built-ins
    '@prisma/client', // Special handling
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV || 'development',
    ),
    'import.meta.env.MODE': JSON.stringify(
      process.env.NODE_ENV || 'development',
    ),
  },
  loader: {
    '.sql': 'text',
    '.graphql': 'text',
    '.wasm': 'file',
  },
  // Native compilation settings
  compile: {
    target: 'bun-linux-x64',
    minify: true,
    sourcemap: false,
    define: {
      'Bun.env.NODE_ENV': '"production"',
    },
  },
} satisfies BuildConfig
```

## Package Migration Patterns

### Standard Library Package

```typescript
// packages/logger/package.json
{
  "name": "@studio/logger",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "bun": "./src/index.ts",        // Bun runs TypeScript directly!
      "development": "./src/index.ts", // Development mode
      "types": "./dist/index.d.ts",    // TypeScript types
      "import": "./dist/index.js",     // Production ESM
      "require": "./dist/index.cjs",   // Legacy CommonJS
      "default": "./dist/index.js"     // Default fallback
    },
    "./testing": {
      "bun": "./src/testing.ts",
      "development": "./src/testing.ts",
      "default": "./dist/testing.js"
    }
  },
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "build": "bun run build.ts",
    "build:binary": "bun build --compile ./src/cli.ts --outfile dist/logger-cli",
    "test": "bun test",
    "bench": "bun run bench.ts",
    "clean": "rm -rf dist coverage"
  },
  "devDependencies": {
    "bun-types": "latest"
  }
}
```

### CLI Package with Binary Compilation

```typescript
// packages/claude-hooks/build.ts
import { $ } from 'bun'

// Build configuration for multiple entry points
const entrypoints = [
  { in: './src/index.ts', out: './dist/index.js' },
  {
    in: './src/bin/claude-hooks-stop.ts',
    out: './dist/bin/claude-hooks-stop.js',
  },
  {
    in: './src/bin/claude-hooks-quality.ts',
    out: './dist/bin/claude-hooks-quality.js',
  },
]

// Build JavaScript bundles
for (const entry of entrypoints) {
  await Bun.build({
    entrypoints: [entry.in],
    outdir: './dist',
    target: 'node',
    format: 'esm',
    external: ['@studio/*'],
  })
}

// Compile to native binaries for production
if (process.env.BUILD_BINARY === 'true') {
  await $`bun build --compile ./src/bin/claude-hooks-stop.ts --outfile ./dist/bin/claude-hooks-stop`
  await $`bun build --compile ./src/bin/claude-hooks-quality.ts --outfile ./dist/bin/claude-hooks-quality`

  // Make binaries executable
  await $`chmod +x ./dist/bin/claude-hooks-*`
}
```

## Advanced Features Implementation

### 1. Native Binary Compilation

```typescript
// scripts/compile-binaries.ts
import { $ } from 'bun'
import { glob } from 'glob'

const cliPackages = await glob('packages/*/src/bin/*.ts')

for (const entry of cliPackages) {
  const outfile = entry.replace('/src/', '/dist/').replace('.ts', '')

  await $`bun build --compile ${entry} --outfile ${outfile} --minify`

  console.log(`✅ Compiled ${entry} → ${outfile}`)
}
```

### 2. Edge Runtime Compatibility

```typescript
// packages/[name]/edge.config.ts
export default {
  // Cloudflare Workers compatible build
  cloudflare: {
    target: 'webworker',
    format: 'esm',
    conditions: ['worker', 'browser'],
    external: ['node:*'],
    define: {
      'process.env': 'globalThis.env',
    },
  },
  // Deno Deploy compatible build
  deno: {
    target: 'deno',
    format: 'esm',
    external: ['node:*'],
    permissions: {
      read: true,
      write: false,
      net: true,
      env: true,
    },
  },
}
```

### 3. AI-Assisted Development Tools

```typescript
// .bun/ai-assistant.ts
import { Bun } from 'bun'

// Local LLM integration for code suggestions
export class AIAssistant {
  async generateTests(filePath: string) {
    const code = await Bun.file(filePath).text()
    // Use local LLM to generate test cases
    const prompt = `Generate comprehensive tests for: ${code}`
    // Integration with Ollama or similar
  }

  async optimizePerformance(filePath: string) {
    // Analyze code and suggest optimizations
  }

  async fixError(error: Error) {
    // Intelligent error resolution suggestions
  }
}
```

### 4. Security Hardening

```typescript
// bun-security.config.ts
export default {
  permissions: {
    read: ['./src', './dist'],
    write: ['./dist', '/tmp'],
    net: ['https://api.example.com'],
    env: ['NODE_ENV', 'API_KEY'],
    ffi: false,
    run: false,
  },
  sandbox: {
    enabled: true,
    memory: '512MB',
    timeout: 30000,
  },
  secrets: {
    provider: 'vault',
    autoRotate: true,
  },
}
```

### 5. Performance Monitoring

```typescript
// packages/[name]/bench.ts
import { bench, run } from 'mitata'

// Automatic performance benchmarking
bench('module loading', () => {
  import('./src/index.ts')
})

bench('function execution', () => {
  // Test critical paths
})

await run({
  percentiles: [0.5, 0.75, 0.9, 0.99],
  colors: true,
})
```

## External Test Package Structure

```typescript
// packages/test-external/package.json
{
  "name": "@studio/test-external",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "bun test",
    "test:integration": "bun test integration/**/*.test.ts",
    "test:e2e": "bun test e2e/**/*.test.ts",
    "test:performance": "bun run performance-suite.ts"
  },
  "devDependencies": {
    "@studio/logger": "workspace:*",
    "@studio/db": "workspace:*",
    "@studio/claude-hooks": "workspace:*",
    "bun-types": "latest"
  }
}
```

## Migration Strategy

### Phase 1: Core Infrastructure (Day 1)

1. Install Bun globally
2. Create bunfig.toml
3. Update root package.json scripts
4. Set up external test package

### Phase 2: Foundation Packages (Day 2)

1. Migrate @studio/schema
2. Migrate @studio/logger
3. Migrate @studio/shared
4. Remove ALL .js extensions

### Phase 3: Service Layer (Day 3)

1. Migrate @studio/db with Prisma
2. Migrate @studio/mocks
3. Update test configurations

### Phase 4: Application Layer (Day 4)

1. Migrate @studio/ui
2. Migrate @studio/claude-hooks
3. Compile native binaries

### Phase 5: Advanced Features (Day 5)

1. Implement edge compatibility
2. Set up AI tools
3. Configure security features
4. Performance optimization

## Success Criteria

- [ ] All packages build in < 1 second
- [ ] Zero .js extension issues
- [ ] Native binaries compile successfully
- [ ] External test package validates all integrations
- [ ] Edge deployment works on Cloudflare Workers
- [ ] Performance benchmarks show 10x improvement
- [ ] Security audit passes
- [ ] Developer satisfaction survey > 90%

## Rollback Plan

```bash
# Quick rollback if needed
git checkout main
pnpm install
pnpm build

# Gradual rollback (package by package)
git checkout main -- packages/[name]
cd packages/[name]
pnpm install
pnpm build
```

The beauty of Bun is that it outputs standard JavaScript, so rollback is trivial.
