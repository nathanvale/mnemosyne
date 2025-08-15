# Migration Checklist

Step-by-step guide for migrating existing packages to dual consumption architecture.

> Created: 2025-08-15
> Version: 1.0.0

## Pre-Migration Check

Before starting migration, verify:

- [ ] Package builds successfully with `pnpm build`
- [ ] All tests pass with `pnpm test`
- [ ] No uncommitted changes in git
- [ ] Dependencies are up to date

## Migration Steps

### Step 1: Update Package.json Exports

#### Current Structure (Source-only)

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./testing": "./src/testing.ts"
  }
}
```

#### New Structure (Dual Consumption)

```json
{
  "exports": {
    ".": {
      "development": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./testing": {
      "development": "./src/testing.ts",
      "types": "./dist/testing.d.ts",
      "import": "./dist/testing.js",
      "default": "./dist/testing.js"
    }
  }
}
```

### Step 2: Verify TypeScript Configuration

Ensure `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "module": "ESNext",
    "target": "ES2022",
    "moduleResolution": "bundler"
  }
}
```

### Step 3: Update Build Scripts

Ensure package.json has:

```json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist *.tsbuildinfo"
  }
}
```

### Step 4: Test Build Output

```bash
# Clean previous builds
pnpm clean

# Build the package
pnpm build

# Verify dist folder structure
ls -la dist/
```

Expected output:

```
dist/
├── index.js
├── index.d.ts
├── index.js.map
└── [other files...]
```

### Step 5: Update Import Statements

Ensure all internal imports use `.js` extension:

```typescript
// ❌ Old (might work in dev but fails in build)
import { helper } from './helper'
import { util } from './utils/util'

// ✅ New (works everywhere)
import { helper } from './helper.js'
import { util } from './utils/util.js'
```

### Step 6: Test in Development Mode

```bash
# Run in development (should use source files)
NODE_ENV=development pnpm dev

# Verify hot reload works
# Make a change in the package and see if app reflects it
```

### Step 7: Test in Production Mode

```bash
# Build everything
pnpm build

# Run in production (should use built files)
NODE_ENV=production pnpm start

# Verify it uses dist/ files, not src/
```

### Step 8: Update Documentation

Add to package README.md:

```markdown
## Dual Consumption

This package supports dual consumption:

- **Development**: Uses TypeScript source files for fast iteration
- **Production**: Uses compiled JavaScript for optimal performance

The package.json exports field automatically serves the right files based on NODE_ENV.
```

## Package-Specific Considerations

### For UI Component Packages

Additional checks:

- [ ] CSS/styles are properly bundled
- [ ] Asset imports work correctly
- [ ] React peer dependency is set

### For CLI Packages

Additional steps:

- [ ] Update bin field to point to dist
- [ ] Add shebang to CLI entry files
- [ ] Test CLI commands after build

### For Configuration Packages

Considerations:

- [ ] JSON files are copied to dist if needed
- [ ] Environment variables are handled correctly

## Testing Checklist

After migration, verify:

- [ ] `pnpm build` creates dist folder
- [ ] `pnpm dev` watches for changes
- [ ] `pnpm test` passes all tests
- [ ] Hot reload works in development
- [ ] Production build uses compiled files
- [ ] Type checking still works
- [ ] External consumption via npm link works

## Rollback Plan

If issues arise, rollback by:

1. Revert package.json exports to original format
2. Delete dist folder
3. Run `pnpm install` to refresh links
4. Restart development server

Keep the old exports structure backed up:

```json
{
  "exports.backup": {
    ".": "./src/index.ts"
  }
}
```

## Common Issues and Solutions

### Issue: Module not found after migration

**Solution**: Rebuild the package

```bash
pnpm --filter @studio/package-name build
```

### Issue: TypeScript types not found

**Solution**: Ensure declaration is enabled

```json
{
  "compilerOptions": {
    "declaration": true
  }
}
```

### Issue: Import extensions causing errors

**Solution**: Update all imports to use .js extension

```typescript
// Even though files are .ts, use .js for imports
import { thing } from './thing.js'
```

### Issue: Tests failing after migration

**Solution**: Ensure test environment uses development condition

```bash
NODE_ENV=test pnpm test
```

### Issue: Integration tests can't execute TypeScript CLI scripts

**Problem**: Tests that execute TypeScript files directly fail with module resolution errors

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@studio/logger'
```

**Solution**: Use tsx with root tsconfig for path mappings

```typescript
// ❌ Wrong - tsx can't resolve workspace packages
const command = `tsx script.ts`
const command = `tsx --conditions=development script.ts` // Still won't work

// ✅ Correct - use root tsconfig with path mappings
const rootDir = join(__dirname, '../../../../../')
const command = `cd ${rootDir} && npx tsx --tsconfig ${rootDir}/tsconfig.json ${scriptPath}`
```

**Why**: The "development" condition is for bundlers, not CLI execution. tsx needs explicit path mappings.

## Migration Order

Recommended order for migrating packages:

### Phase 1: Configuration Packages (No dependencies)

1. @studio/typescript-config
2. @studio/eslint-config
3. @studio/prettier-config

### Phase 2: Core Packages (Minimal dependencies)

1. @studio/schema
2. @studio/shared
3. @studio/validation

### Phase 3: Service Packages

1. @studio/logger
2. @studio/db
3. @studio/mocks
4. @studio/test-config

### Phase 4: Feature Packages

1. @studio/ui
2. @studio/memory
3. @studio/scripts
4. @studio/mcp

### Phase 5: Tool Packages

1. @studio/dev-tools
2. @studio/code-review

### Phase 6: Published Package

1. @studio/claude-hooks (already has dual exports - verify and optimize)

## Validation Script

Create a validation script to check migration:

```bash
#!/bin/bash
# validate-migration.sh

PACKAGE=$1

echo "Validating $PACKAGE migration..."

# Check exports field
if ! grep -q '"development":' "packages/$PACKAGE/package.json"; then
  echo "❌ Missing development export"
  exit 1
fi

# Check dist folder after build
pnpm --filter "@studio/$PACKAGE" build
if [ ! -d "packages/$PACKAGE/dist" ]; then
  echo "❌ No dist folder created"
  exit 1
fi

# Check types
if [ ! -f "packages/$PACKAGE/dist/index.d.ts" ]; then
  echo "❌ No type declarations generated"
  exit 1
fi

echo "✅ Migration validated successfully"
```

## Success Criteria

Migration is complete when:

- ✅ All exports use conditional format
- ✅ Development mode uses source files
- ✅ Production builds use compiled files
- ✅ Tests pass in all environments
- ✅ Hot reload works across packages
- ✅ External consumption works via npm link
- ✅ No regression in functionality
- ✅ Documentation is updated
