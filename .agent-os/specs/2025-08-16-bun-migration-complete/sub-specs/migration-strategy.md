# Migration Strategy

This document outlines the detailed migration strategy for moving from Node.js/TypeScript to Bun.

> Created: 2025-08-16
> Version: 1.0.0

## Migration Principles

1. **Zero Downtime** - Migration happens gradually without breaking existing functionality
2. **Incremental Adoption** - Package-by-package migration with validation at each step
3. **Escape Hatches** - Always maintain ability to rollback
4. **Test-Driven** - Every migration step validated by comprehensive tests
5. **Performance Tracking** - Measure improvements at each stage

## Pre-Migration Checklist

### Environment Setup

- [ ] Install Bun v1.1.38 or later on all development machines
- [ ] Verify Bun installation: `bun --version`
- [ ] Install Bun VS Code extension for debugging
- [ ] Set up Bun in CI/CD pipeline
- [ ] Create performance baseline measurements

### Codebase Preparation

- [ ] Audit all `.js` extensions in imports
- [ ] Document current build times
- [ ] Identify Node.js-specific code
- [ ] Review external dependencies for Bun compatibility
- [ ] Create migration branch: `feature/bun-migration`

## Migration Phases

### Phase 1: Infrastructure Setup (4 hours)

#### 1.1 Root Configuration

```bash
# Create bunfig.toml
touch bunfig.toml

# Update .gitignore
echo ".bun/" >> .gitignore
echo "bun.lockb" >> .gitignore

# Initialize Bun workspace
bun init
```

#### 1.2 Update Root Scripts

```json
// package.json
{
  "scripts": {
    "dev": "bun run turbo dev",
    "build": "bun run turbo build",
    "test": "bun test",
    "bench": "bun run scripts/benchmark.ts",
    "clean": "turbo clean && rm -rf .bun",
    "postinstall": "bun install --frozen-lockfile"
  }
}
```

#### 1.3 Create Migration Utilities

```typescript
// scripts/migrate-package.ts
import { $ } from 'bun'

export async function migratePackage(packageName: string) {
  console.log(`🔄 Migrating ${packageName}...`)

  // Backup existing package.json
  await $`cp packages/${packageName}/package.json packages/${packageName}/package.json.backup`

  // Update package.json for Bun
  const pkg = await Bun.file(`packages/${packageName}/package.json`).json()

  // Update scripts
  pkg.scripts = {
    ...pkg.scripts,
    dev: 'bun run --watch src/index.ts',
    build: 'bun run build.ts',
    test: 'bun test',
    clean: 'rm -rf dist coverage',
  }

  // Add Bun-specific exports
  pkg.exports = {
    '.': {
      bun: './src/index.ts',
      development: './src/index.ts',
      default: './dist/index.js',
    },
  }

  await Bun.write(
    `packages/${packageName}/package.json`,
    JSON.stringify(pkg, null, 2),
  )

  console.log(`✅ ${packageName} migrated successfully`)
}
```

### Phase 2: Foundation Packages (4 hours)

#### 2.1 @studio/schema Migration

```bash
cd packages/schema

# Remove TypeScript config (Bun uses defaults)
rm tsconfig.json

# Create build script
cat > build.ts << 'EOF'
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'node',
  format: 'esm',
});
EOF

# Test the migration
bun test
bun build
```

#### 2.2 @studio/logger Migration

```bash
cd packages/logger

# Remove ALL .js extensions from imports
find src -name "*.ts" -exec sed -i '' 's/from "\.\/\(.*\)\.js"/from ".\/\1"/g' {} \;
find src -name "*.ts" -exec sed -i '' 's/from '\''\.\/\(.*\)\.js'\''/from '\''\.\/\1'\''/g' {} \;

# Update build configuration
bun run ../schema/build.ts
```

#### 2.3 Extension Cleanup Script

```typescript
// scripts/remove-js-extensions.ts
import { glob } from 'glob'
import { readFile, writeFile } from 'fs/promises'

const files = await glob('packages/*/src/**/*.{ts,tsx}')

for (const file of files) {
  let content = await readFile(file, 'utf8')

  // Remove .js extensions from relative imports
  content = content.replace(/from\s+['"](\.\.[\/\\].*?)\.js['"]/g, "from '$1'")
  content = content.replace(/from\s+['"](\.[\/\\].*?)\.js['"]/g, "from '$1'")

  await writeFile(file, content)
}

console.log(`✅ Removed .js extensions from ${files.length} files`)
```

### Phase 3: Service Layer (4 hours)

#### 3.1 @studio/db with Prisma

```typescript
// packages/db/build.ts
import { $ } from 'bun'

// Generate Prisma client first
await $`prisma generate`

// Build the package
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'node',
  format: 'esm',
  external: ['.prisma', '@prisma/client'],
})

// Copy Prisma client to dist
await $`cp -r node_modules/.prisma dist/`
```

#### 3.2 @studio/mocks Migration

```typescript
// Special handling for MSW
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'node',
  format: 'esm',
  external: ['msw', 'msw/node'],
  define: {
    'process.env.NODE_ENV': '"test"',
  },
})
```

### Phase 4: Application Layer (4 hours)

#### 4.1 @studio/ui Components

```typescript
// packages/ui/build.ts
await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'browser',
  format: 'esm',
  jsx: 'automatic',
  external: ['react', 'react-dom'],
  loader: {
    '.css': 'css',
    '.svg': 'dataurl',
  },
})
```

#### 4.2 CLI Tools with Binary Compilation

```bash
# Build and compile claude-hooks
cd packages/claude-hooks

# Build JavaScript first
bun run build.ts

# Compile to native binaries
bun build --compile ./src/bin/claude-hooks-stop.ts \
  --outfile ./dist/bin/claude-hooks-stop \
  --target bun-linux-x64

# Test the binary
./dist/bin/claude-hooks-stop --help
```

### Phase 5: External Test Package (4 hours)

#### 5.1 Create Test Package

```bash
mkdir -p packages/test-external
cd packages/test-external
bun init -y
```

#### 5.2 Integration Tests

```typescript
// packages/test-external/tests/integration.test.ts
import { expect, test, describe } from 'bun:test'
import { logger } from '@studio/logger'
import { db } from '@studio/db'
import { Button } from '@studio/ui'

describe('Cross-Package Integration', () => {
  test('logger works with Bun', () => {
    const spy = spyOn(console, 'log')
    logger.info('test')
    expect(spy).toHaveBeenCalledWith('test')
  })

  test('database queries work', async () => {
    const result = await db.message.findMany()
    expect(result).toBeArray()
  })

  test('UI components render', () => {
    const button = Button({ children: 'Test' })
    expect(button).toBeDefined()
  })

  test('No .js extensions in imports', async () => {
    const files = await glob('../*/dist/**/*.js')
    for (const file of files) {
      const content = await Bun.file(file).text()
      expect(content).not.toMatch(/from ['"]\..*\.js['"]/)
    }
  })
})
```

#### 5.3 Performance Tests

```typescript
// packages/test-external/tests/performance.test.ts
import { bench, run } from 'mitata'

bench('Package load time', async () => {
  await import('@studio/logger')
})

bench('Build time', async () => {
  await $`cd ../logger && bun run build`
})

bench('Test execution', async () => {
  await $`cd ../logger && bun test`
})

await run()
```

### Phase 6: Advanced Features (8 hours)

#### 6.1 Edge Deployment Setup

```typescript
// packages/[name]/edge-build.ts
// Cloudflare Workers build
await Bun.build({
  entrypoints: ['./src/worker.ts'],
  outdir: './dist/worker',
  target: 'webworker',
  format: 'esm',
  conditions: ['worker'],
})

// Deno Deploy build
await Bun.build({
  entrypoints: ['./src/deno.ts'],
  outdir: './dist/deno',
  target: 'browser',
  format: 'esm',
})
```

#### 6.2 AI Development Tools

```typescript
// .bun/ai/test-generator.ts
import { Bun } from 'bun'
import ollama from 'ollama'

export async function generateTests(filePath: string) {
  const code = await Bun.file(filePath).text()

  const response = await ollama.chat({
    model: 'codellama',
    messages: [
      {
        role: 'user',
        content: `Generate Bun tests for this code:\n${code}`,
      },
    ],
  })

  const testFile = filePath.replace('.ts', '.test.ts')
  await Bun.write(testFile, response.message.content)
}
```

## Validation Steps

### After Each Package Migration

1. **Build Validation**

   ```bash
   bun run build
   # Verify dist/ output exists
   ls -la dist/
   ```

2. **Test Validation**

   ```bash
   bun test
   # All tests should pass
   ```

3. **Import Validation**

   ```bash
   # Check for .js extensions
   grep -r "\.js['\"]" src/ || echo "✅ No .js extensions found"
   ```

4. **Performance Validation**

   ```bash
   # Measure build time
   time bun run build
   # Should be < 1 second
   ```

5. **Integration Validation**
   ```bash
   cd packages/test-external
   bun test
   ```

## Rollback Procedures

### Package-Level Rollback

```bash
# Restore package.json
cp package.json.backup package.json

# Restore TypeScript config
git checkout -- tsconfig.json

# Rebuild with Node.js
npm run build
```

### Full Rollback

```bash
# Return to main branch
git checkout main

# Clean Bun artifacts
rm -rf .bun bun.lockb */*/dist

# Reinstall with pnpm
pnpm install
pnpm build
```

## Migration Metrics

Track these metrics for each package:

| Metric       | Before (Node.js) | After (Bun)  | Improvement |
| ------------ | ---------------- | ------------ | ----------- |
| Build Time   | 3-5 seconds      | <1 second    | 80%+        |
| Test Time    | 2-3 seconds      | <0.5 seconds | 85%+        |
| HMR Time     | 1-2 seconds      | <100ms       | 95%+        |
| Bundle Size  | 100KB            | 50KB         | 50%+        |
| Memory Usage | 150MB            | 75MB         | 50%+        |
| Cold Start   | 500ms            | 100ms        | 80%+        |

## Common Issues and Solutions

### Issue: Module not found errors

**Solution**: Ensure package.json exports field includes "bun" condition

### Issue: Prisma client errors

**Solution**: Run `prisma generate` before building

### Issue: React components not building

**Solution**: Set jsx: 'automatic' in build config

### Issue: Binary compilation fails

**Solution**: Ensure all dependencies are bundled or marked as external

### Issue: Tests failing with Bun

**Solution**: Update test imports to use "bun:test" instead of vitest

## Success Indicators

- ✅ All packages migrated to Bun
- ✅ Zero .js extension issues
- ✅ Build times < 1 second per package
- ✅ External test package passing
- ✅ Native binaries compiled
- ✅ Performance improvements documented
- ✅ Team trained on Bun workflows
- ✅ CI/CD pipeline updated
