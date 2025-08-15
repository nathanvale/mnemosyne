# Dual Consumption Troubleshooting Guide

## Overview

This guide helps resolve common issues with the dual consumption architecture in the Mnemosyne monorepo.

## Quick Diagnosis

### Is Dual Consumption Working?

```bash
# Check if packages have proper exports
pnpm --filter @studio/logger exec cat package.json | grep -A 10 '"exports"'

# Test development mode import
NODE_ENV=development node -e "import('@studio/logger').then(m => console.log('✅ Dev import works'))"

# Test production mode import (requires build)
pnpm build
NODE_ENV=production node -e "import('@studio/logger').then(m => console.log('✅ Prod import works'))"
```

## Common Issues and Solutions

### 1. Module Not Found in Development

**Symptom:**

```
Error: Cannot find module '@studio/package-name'
```

**Solution:**
Check the package.json exports field has a "development" condition:

```json
{
  "exports": {
    ".": {
      "development": "./src/index.ts", // ← Must exist
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  }
}
```

### 2. TypeScript Cannot Find Types

**Symptom:**

```
Cannot find module '@studio/package-name' or its corresponding type declarations
```

**Solutions:**

1. Ensure "types" field in exports:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts", // ← Must be first or second
      "development": "./src/index.ts",
      "import": "./dist/index.js"
    }
  }
}
```

2. Build the package to generate .d.ts files:

```bash
pnpm --filter @studio/package-name build
```

3. Check TypeScript moduleResolution:

```json
// tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "bundler" // ← Required for exports field
  }
}
```

### 3. CLI Binaries Not Working

**Symptom:**

```
command not found: claude-hooks-stop
```

**Solutions:**

1. Build the package first:

```bash
pnpm --filter @studio/claude-hooks build
```

2. Check bin paths point to dist:

```json
{
  "bin": {
    "tool-name": "./dist/bin/tool-name.js" // ← Not ./src/
  }
}
```

3. Fix shebangs after build:

```javascript
// scripts/fix-shebangs.js
#!/usr/bin/env node
```

### 4. Hot Reload Not Working

**Symptom:**
Changes to packages don't reflect immediately in development

**Solutions:**

1. Ensure NODE_ENV is set to development:

```bash
NODE_ENV=development pnpm dev
```

2. Check Next.js transpilePackages:

```javascript
// next.config.js
const nextConfig = {
  transpilePackages:
    process.env.NODE_ENV === 'development'
      ? ['@studio/*'] // ← Transpile in dev
      : [],
}
```

3. Verify package has development export:

```json
{
  "exports": {
    ".": {
      "development": "./src/index.ts" // ← Required for hot reload
    }
  }
}
```

### 5. External Project Cannot Import

**Symptom:**

```
Error when importing @studio packages in external project
```

**Solutions:**

1. Build all packages first:

```bash
pnpm build
```

2. Use npm link correctly:

```bash
# In mnemosyne package
cd packages/logger
npm link

# In external project
npm link @studio/logger
```

3. Ensure package.json has proper exports:

```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js", // ← For ES modules
      "require": "./dist/index.cjs", // ← Optional for CommonJS
      "default": "./dist/index.js"
    }
  }
}
```

### 6. Subpath Imports Not Working

**Symptom:**

```
Cannot import '@studio/package/subpath'
```

**Solution:**
Add subpath to exports:

```json
{
  "exports": {
    ".": {
      "development": "./src/index.ts",
      "import": "./dist/index.js"
    },
    "./subpath": {
      "development": "./src/subpath.ts",
      "types": "./dist/subpath.d.ts",
      "import": "./dist/subpath.js",
      "default": "./dist/subpath.js"
    }
  }
}
```

### 7. Build Errors After Migration

**Symptom:**

```
Error: Cannot find module './dist/index.js'
```

**Solutions:**

1. Update TypeScript config:

```json
{
  "compilerOptions": {
    "rootDir": "./src", // ← Source directory
    "outDir": "./dist" // ← Output directory
  }
}
```

2. Exclude test files from build:

```json
{
  "exclude": ["**/*.test.ts", "**/*.spec.ts", "src/__tests__/**"]
}
```

### 8. Vitest Cannot Find Modules

**Symptom:**

```
Error in test: Cannot resolve '@studio/package'
```

**Solution:**
Configure Vitest resolver:

```typescript
// vitest.config.ts
export default defineConfig({
  resolve: {
    conditions: ['development', 'default'], // ← Use dev exports in tests
  },
})
```

### 9. Performance Issues

**Symptom:**
Slow imports or build times

**Solutions:**

1. Check Turbo cache:

```bash
# Clear and rebuild
pnpm turbo clean
pnpm build
```

2. Verify development mode:

```bash
# Should skip build in dev
NODE_ENV=development pnpm dev
```

3. Check for circular dependencies:

```bash
pnpm turbo build --graph
```

## Migration Checklist

When migrating a package to dual consumption:

- [ ] Update package.json exports field
- [ ] Set proper rootDir and outDir in tsconfig.json
- [ ] Add development condition first
- [ ] Include types field for TypeScript
- [ ] Test both development and production imports
- [ ] Update bin paths if package has CLI tools
- [ ] Run build to verify output structure
- [ ] Test in external project via npm link
- [ ] Add dual consumption test

## Environment Variables

Key environment variables that affect dual consumption:

```bash
# Development mode (use source files)
NODE_ENV=development

# Production mode (use built files)
NODE_ENV=production

# Test mode (typically uses development)
NODE_ENV=test
```

## Testing Dual Consumption

Each package should have a test verifying dual consumption:

```typescript
// src/__tests__/dual-consumption.test.ts
import { describe, it, expect } from 'vitest'

describe('Dual Consumption', () => {
  it('should support development imports', async () => {
    process.env.NODE_ENV = 'development'
    const module = await import('../index')
    expect(module).toBeDefined()
  })

  it('should support production imports', async () => {
    process.env.NODE_ENV = 'production'
    const module = await import('../../dist/index.js')
    expect(module).toBeDefined()
  })
})
```

## Debug Commands

Useful commands for debugging:

```bash
# Check package exports
pnpm --filter <package> exec cat package.json | jq '.exports'

# Test import resolution
node --input-type=module -e "import('<package>').then(console.log)"

# Check built output
ls -la packages/<name>/dist/

# Verify TypeScript declarations
find packages/<name>/dist -name "*.d.ts"

# Test external consumption
mkdir /tmp/test-import && cd /tmp/test-import
npm init -y && npm link <path-to-package>
node -e "import('<package>').then(m => console.log('Success!'))"
```

## Getting Help

If you encounter issues not covered here:

1. Check package-specific README files
2. Review the dual consumption spec: `.agent-os/specs/2025-08-15-monorepo-dual-consumption/`
3. Run validation script: `pnpm validate:dual-consumption`
4. Check GitHub issues for similar problems
