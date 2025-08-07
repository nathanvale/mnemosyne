# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-01-08-typescript-config-improvements/spec.md

> Created: 2025-01-08
> Version: 1.0.0

## Package Export Changes

### Library Package Exports (Just-in-Time Pattern)

All library packages will transition from compiled JavaScript exports to TypeScript source exports. This change affects how packages are consumed but maintains the same API surface.

#### Before (Compiled Exports)

```json
{
  "name": "@studio/logger",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "default": "./dist/index.js"
    }
  }
}
```

#### After (Just-in-Time Exports)

```json
{
  "name": "@studio/logger",
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*.ts"
  }
}
```

### Affected Packages

The following packages will have their export patterns updated:

1. **@studio/db**
   - Main export: `./src/index.ts`
   - Sub-exports: `./src/*.ts`

2. **@studio/logger**
   - Main export: `./src/index.ts`
   - Browser export: `./src/browser.ts`
   - Server export: `./src/server.ts`

3. **@studio/ui**
   - Main export: `./src/index.ts`
   - Component exports: `./src/components/*.tsx`

4. **@studio/mocks**
   - Main export: `./src/index.ts`
   - Handler exports: `./src/handlers/*.ts`

5. **@studio/schema**
   - Main export: `./src/index.ts`
   - Schema exports: `./src/schemas/*.ts`

6. **@studio/scripts**
   - Main export: `./src/index.ts`
   - CLI exports: `./src/cli/*.ts`

7. **@studio/test-config**
   - Main export: `./src/index.ts`
   - Setup exports: `./src/setup/*.ts`

8. **@studio/mcp**
   - Main export: `./src/index.ts`

9. **@studio/validation**
   - Main export: `./src/index.ts`
   - Validator exports: `./src/validators/*.ts`

10. **@studio/memory**
    - Main export: `./src/index.ts`

11. **@studio/claude-hooks**
    - Main export: `./src/index.ts`
    - Hook exports: `./src/hooks/*.ts`

### TypeScript Configuration API

#### New Configuration Export

```json
// packages/typescript-config/package.json
{
  "exports": {
    "./base.json": "./base.json",
    "./library.json": "./library.json",
    "./nextjs.json": "./nextjs.json",
    "./test.json": "./test.json", // NEW
    "./package.json": "./package.json"
  }
}
```

### Import Pattern Changes

#### Consumer Import (No Change Required)

```typescript
// Applications can continue using the same import syntax
import { logger } from '@studio/logger'
import { Button } from '@studio/ui'
```

#### TypeScript Resolution

- TypeScript will now resolve directly to `.ts` files
- IDE intellisense will work with source files
- Type checking will use source TypeScript, not declaration files

### Build Script Changes

#### Library Packages

```json
{
  "scripts": {
    "build": "echo 'Just-in-Time package - no build needed'",
    "type-check": "tsc --noEmit",
    "dev": "tsc --noEmit --watch",
    "clean": "rm -rf *.tsbuildinfo"
  }
}
```

#### Application Packages (No Change)

```json
{
  "scripts": {
    "build": "next build",
    "dev": "next dev",
    "type-check": "tsc --noEmit"
  }
}
```

### Breaking Changes

None. The Just-in-Time pattern is transparent to consumers when using modern bundlers that support TypeScript (Next.js, Vite, etc.).

### Compatibility

#### Supported Environments

- Next.js 13+ (via transpilePackages)
- Vite 4+ (native TypeScript support)
- Turbopack (native TypeScript support)
- Any bundler with TypeScript loader

#### Migration Notes

- No code changes required in consuming applications
- Next.js apps already configured with proper settings
- Type checking remains unchanged
- Runtime behavior identical

### Performance Impact

#### Build Time

- Library packages: 100% reduction (no build step)
- Applications: ~10% increase (compiling dependencies)
- Overall: 40-60% faster due to eliminated redundancy

#### Type Checking

- 50% faster with parallel execution
- Better caching with composite projects
- Incremental checking with .tsbuildinfo files
