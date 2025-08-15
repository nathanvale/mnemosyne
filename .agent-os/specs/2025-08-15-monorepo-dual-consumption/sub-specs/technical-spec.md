# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-15-monorepo-dual-consumption/spec.md

> Created: 2025-08-15
> Version: 1.0.0

## Technical Requirements

### Prerequisites - Test Failures to Fix

Before proceeding with the dual consumption migration, the following test failures must be resolved:

**Wallaby.js Test Status**: ✅ RESOLVED - 3 failing tests fixed

1. **Subagent Integration Tests (3 failures)** - `@studio/claude-hooks` ✅ FIXED
   - Root cause: `tsx` cannot resolve `@studio/logger` when running scripts directly from temp directories
   - **Initial incorrect assumption**: We thought the "development" condition would be automatically used
   - **Actual issue**: The "development" condition in package.json exports is NOT automatically activated
   - **Solution implemented**: Use tsx with root tsconfig.json for path mappings
     ```typescript
     // Instead of trying to use --conditions=development (which tsx doesn't support properly)
     const rootDir = join(__dirname, '../../../../../')
     const command = `echo '${input}' | cd ${rootDir} && npx tsx --tsconfig ${rootDir}/tsconfig.json ${hookPath}`
     ```
   - **Key learning**: The dual consumption "development" condition is for imports WITHIN the monorepo during bundling, not for external CLI execution
2. **Quality Check Tests (2 failures)** - `@studio/claude-hooks` ✅ ALREADY PASSING
   - Usage metrics escalation rate: Test was already passing, no fix needed
   - Print summary escalation: Test was already passing, no fix needed

**Important Discovery About Dual Consumption**:

- The "development" condition in conditional exports is meant for bundlers and build tools
- When executing TypeScript files directly with tsx, you need to provide path mappings via tsconfig
- The dual consumption architecture still allows development without building, but CLI execution needs special handling

### Conditional Exports Configuration

Each package must implement Node.js conditional exports that resolve differently based on the environment:

```json
{
  "exports": {
    ".": {
      "development": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
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

**Resolution Order**:

1. `development` - Used when NODE_ENV=development (source files)
2. `types` - TypeScript always resolves to built declarations
3. `import` - ES modules production build
4. `default` - Fallback for any other condition

### TypeScript Configuration

Packages need TypeScript configured for dual output:

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

### Turborepo Task Configuration

Update `turbo.json` for environment-aware task dependencies:

```json
{
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
      // No dependsOn - uses source files directly
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "*.tsbuildinfo"]
    },
    "test": {
      // No dependsOn for build - tests use source via development condition
      "env": ["NODE_ENV"]
    },
    "deploy": {
      "dependsOn": ["^build", "build"]
      // Production deployment requires all artifacts built
    }
  }
}
```

### Next.js Configuration

For the Next.js app to consume source files in development:

```javascript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: process.env.NODE_ENV === 'development'
    ? ['@studio/*'] // Transpile all workspace packages in dev
    : [], // Use pre-built packages in production

  experimental: {
    // Optimize package imports
    optimizePackageImports: ['@studio/*']
  }
}

export default nextConfig
```

### Environment Variable Setup

```bash
# Development (uses source files)
NODE_ENV=development pnpm dev

# Production build (uses compiled artifacts)
NODE_ENV=production pnpm build

# Testing (uses source files)
NODE_ENV=test pnpm test
```

## Approach Options

### Option A: Immediate Full Migration

- **Pros**: Consistent experience across all packages, clean architecture
- **Cons**: Large upfront effort, potential for breaking changes
- **Timeline**: 2-3 days for all packages

### Option B: Incremental Package Migration (Selected)

- **Pros**: Lower risk, can validate approach with core packages first, gradual adoption
- **Cons**: Temporary inconsistency, requires tracking migration status
- **Timeline**: 1 day for core packages, then 1-2 packages per day
- **Rationale**: Allows testing and refinement of the pattern before full rollout, minimizes disruption

### Option C: Dual Mode with Feature Flag

- **Pros**: Can switch between modes easily, good for A/B testing
- **Cons**: Additional complexity, more configuration to maintain
- **Timeline**: 3-4 days including flag system

## External Dependencies

### Build Tools

- **TypeScript 5.8+** - Already in use, no changes needed
- **Justification**: Required for modern module resolution and conditional exports support

### Development Tools

- **Vite 5.x** - For external test repository
- **Justification**: Most popular modern bundler for testing ES modules consumption

### Testing Tools

- **npm link** - Built into npm, for local package testing
- **Justification**: Standard tool for testing local packages before publishing

## Implementation Examples

### Example 1: Simple Package (@studio/logger)

```json
{
  "name": "@studio/logger",
  "type": "module",
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
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  }
}
```

### Example 2: React Component Package (@studio/ui)

```json
{
  "name": "@studio/ui",
  "type": "module",
  "exports": {
    ".": {
      "development": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./components/*": {
      "development": "./src/components/*.tsx",
      "types": "./dist/components/*.d.ts",
      "import": "./dist/components/*.js",
      "default": "./dist/components/*.js"
    }
  }
}
```

### Example 3: External Test Repository

```javascript
// vite.config.js in external test repo
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Ensure linked packages are processed
    include: ['@studio/ui', '@studio/logger'],
  },
  resolve: {
    // Preserve symlinks for npm link
    preserveSymlinks: true,
  },
})
```

## Performance Considerations

### Development Mode

- **Zero build time**: Direct source file imports
- **Instant HMR**: Changes reflected immediately
- **Memory usage**: Slightly higher due to JIT compilation
- **First load**: Marginally slower due to transpilation

### Production Mode

- **Optimized bundles**: Tree-shaking and minification applied
- **Faster runtime**: No transpilation needed
- **Smaller memory footprint**: Only compiled code loaded
- **CDN-ready**: Static assets can be cached

## Migration Path

### Phase 1: Core Infrastructure (Day 1)

1. Update turbo.json with new task configurations
2. Create external test repository
3. Document patterns and guidelines

### Phase 2: Foundation Packages (Day 1-2)

1. Migrate config packages (typescript, eslint, prettier)
2. Migrate schema and validation packages
3. Test with external repository

### Phase 3: Service Packages (Day 2-3)

1. Migrate logger, db, mocks
2. Update dependent packages
3. Verify hot reload works

### Phase 4: Feature Packages (Day 3-4)

1. Migrate ui, memory, scripts
2. Test in Next.js app
3. Verify production builds

### Phase 5: Validation (Day 4-5)

1. Run full test suite
2. Test external consumption
3. Document any issues found
