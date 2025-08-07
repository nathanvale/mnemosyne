# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-01-08-typescript-config-improvements/spec.md

> Created: 2025-01-08
> Version: 1.0.0

## Technical Requirements

### Core Configuration Requirements

- TypeScript 5.8.3 or higher compatibility
- Full ES modules support with `"type": "module"` in all packages
- Bundler module resolution strategy for optimal compatibility
- Composite project support for incremental builds
- Strict type checking enabled across all packages
- Source map generation for debugging

### Performance Requirements

- Type checking must complete in parallel across packages
- Incremental compilation with `.tsbuildinfo` caching
- Zero compilation time for library packages (Just-in-Time pattern)
- Maximum cache reuse through proper input/output configuration
- Transit nodes for dependency graph optimization

### Developer Experience Requirements

- Single source of truth for TypeScript configuration
- Consistent type checking behavior across all packages
- IDE support with proper path mappings and intellisense
- Clear error messages with source map support
- Seamless imports between packages

### Build Pipeline Requirements

- Compatible with existing Turborepo pipeline
- Support for both development and production builds
- Proper task dependencies for type checking
- Watch mode support for development

## Approach Options

### Option A: Incremental Migration with Backward Compatibility

- Pros: Lower risk, can be rolled back easily, gradual adoption
- Cons: Longer implementation time, temporary inconsistency, more complex testing

### Option B: Complete Cutover with Just-in-Time Pattern (Selected)

- Pros: Clean implementation, immediate benefits, simpler long-term maintenance
- Cons: Higher initial risk, requires coordinated changes, potential for breaking changes

**Rationale:** Option B selected because the monorepo structure supports atomic changes across all packages, and the Just-in-Time pattern significantly simplifies the build pipeline while improving performance. The risk is mitigated by comprehensive testing and the ability to revert via git if issues arise.

## Implementation Details

### Configuration Structure

```
packages/typescript-config/
├── base.json       # Shared base configuration
├── library.json    # Library package configuration (Just-in-Time)
├── nextjs.json     # Next.js application configuration
├── test.json       # Test file configuration (NEW)
└── package.json    # Package metadata
```

### Base Configuration Updates

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "composite": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

### Library Configuration (Just-in-Time)

```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "noEmit": true,
    "declaration": false,
    "declarationMap": false,
    "sourceMap": true,
    "allowImportingTsExtensions": true
  }
}
```

### Transit Node Implementation

Transit nodes create parallelization points in the dependency graph:

```json
// Root tsconfig.json
{
  "references": [
    // Level 0: Core configs
    { "path": "./packages/typescript-config" },
    // Level 1: Base packages (transit nodes)
    { "path": "./packages/schema" },
    { "path": "./packages/validation" },
    // Level 2: Dependent packages
    { "path": "./packages/db" },
    { "path": "./packages/logger" },
    // Level 3: UI and apps
    { "path": "./packages/ui" },
    { "path": "./apps/studio" }
  ]
}
```

### Package Export Pattern

```json
// package.json for Just-in-Time libraries
{
  "exports": {
    ".": "./src/index.ts",
    "./*": "./src/*.ts"
  },
  "scripts": {
    "type-check": "tsc --noEmit",
    "build": "echo 'Just-in-Time package - no build needed'"
  }
}
```

## External Dependencies

No new external dependencies required. This implementation uses only the existing TypeScript compiler and Turborepo infrastructure already present in the monorepo.

## Migration Strategy

### Phase 1: Configuration Enhancement

1. Add test.json to typescript-config package
2. Update base.json and library.json
3. Verify backward compatibility

### Phase 2: Package Migration

1. Start with leaf packages (no dependents)
2. Progress to core packages
3. Finish with application packages

### Phase 3: Optimization

1. Implement transit nodes
2. Configure parallel type checking
3. Optimize turbo.json tasks

### Rollback Plan

If issues arise:

1. Git revert to previous commit
2. Packages using workspace references will automatically resolve
3. No database or runtime changes to reverse
