# Monorepo Dual Consumption Architecture Guide

> **Research Date**: August 2025  
> **Sources**: Turborepo Documentation, Industry Research, Modern Monorepo Practices

A comprehensive guide to implementing dual consumption patterns in monorepos, based on expert research and modern best practices.

## Table of Contents

- [Executive Summary](#executive-summary)
- [Research Findings](#research-findings)
- [The Conditional Exports Solution](#the-conditional-exports-solution)
- [Implementation Strategy](#implementation-strategy)
- [Architecture Benefits](#architecture-benefits)
- [Real-World Examples](#real-world-examples)
- [Migration Path](#migration-path)

## Executive Summary

Modern monorepos face a fundamental challenge: how to optimize for both **fast development** (consuming source files) and **reliable production** (consuming built artifacts). The solution is **Conditional Exports** - a Node.js native feature that enables environment-aware package consumption.

**Key Insight**: You don't need to choose between source OR built files. Modern tooling enables **conditional consumption** based on environment and use case.

## Research Findings

### Industry Consensus (2024-2025)

From research across Turborepo documentation, enterprise monorepos, and industry best practices:

1. **Development Speed**: Source file consumption eliminates build steps
2. **Production Reliability**: Built files ensure consistent deployment artifacts
3. **Debugging Experience**: Source maps and original TypeScript files
4. **Tool Compatibility**: Works with modern bundlers and frameworks

### Turborepo's Official Patterns

Turborepo defines two primary approaches:

#### 1. Just-in-Time Packages

```json
{
  "name": "@repo/ui",
  "exports": {
    "./button": "./src/button.tsx",
    "./card": "./src/card.tsx"
  }
}
```

- **Pros**: Fastest development, no build steps
- **Cons**: Runtime dependency on bundler transpilation

#### 2. Compiled Packages

```json
{
  "name": "@repo/ui",
  "exports": {
    "./button": {
      "types": "./src/button.tsx",
      "default": "./dist/button.js"
    }
  }
}
```

- **Pros**: Reliable runtime, optimized artifacts
- **Cons**: Requires build steps, slower development

### The Expert Solution: Conditional Exports

The research reveals a **third pattern** that combines the best of both:

```json
{
  "name": "@repo/ui",
  "exports": {
    ".": {
      "development": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  }
}
```

## The Conditional Exports Solution

### How It Works

Node.js conditional exports enable different resolution based on:

- **Environment**: `development` vs `production`
- **Module Type**: `import` vs `require`
- **Usage Context**: `types` for TypeScript

### Environment-Aware Consumption

```javascript
// In development (NODE_ENV=development)
import { Button } from '@studio/ui' // → resolves to ./src/index.ts

// In production builds
import { Button } from '@studio/ui' // → resolves to ./dist/index.js

// TypeScript always gets proper types
// → resolves to ./dist/index.d.ts
```

### Framework Integration

#### Next.js 13+ Pattern

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@studio/ui', '@studio/utils'],
}
```

#### Vite Configuration

```javascript
export default defineConfig({
  optimizeDeps: {
    include: ['@studio/ui'],
  },
})
```

## Implementation Strategy

### Phase 1: Package.json Updates

Transform each package to use conditional exports:

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

### Phase 2: Turbo.json Configuration

Update build dependencies to be context-aware:

```json
{
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
      // No dependsOn - uses source files
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      // No dependsOn - TypeScript environment uses source
      "env": ["NODE_ENV"]
    },
    "deploy": {
      "dependsOn": ["^build", "build"]
      // Production requires built artifacts
    }
  }
}
```

### Phase 3: Environment Configuration

Set up environment variables for different contexts:

```bash
# Development
NODE_ENV=development

# Production builds
NODE_ENV=production

# Testing (uses TypeScript environment)
NODE_ENV=test
```

### Phase 4: Integration Tests Fix

Replace external process execution with direct imports:

```typescript
// ❌ Old approach - external process
const command = `echo '${input}' | tsx ${hookPath}`
execSync(command)

// ✅ New approach - direct import
import { main } from '../subagent-stop/subagent-stop.js'
await main(input)
```

## Architecture Benefits

### Development Experience

✅ **Instant Hot Reload**: Source file changes propagate immediately  
✅ **No Build Steps**: Start coding without waiting for compilation  
✅ **Better Debugging**: Original source maps and line numbers  
✅ **IDE Integration**: Jump to source, not compiled output

### Production Reliability

✅ **Consistent Artifacts**: Same built files in all environments  
✅ **Optimized Performance**: Bundler optimizations applied  
✅ **Dependency Isolation**: No runtime TypeScript dependencies  
✅ **Cache Efficiency**: Turborepo caches built outputs

### Team Productivity

✅ **Flexible Consumption**: Teams choose pattern per use case  
✅ **Standard Compliance**: Works with all Node.js tools  
✅ **Future-Proof**: Aligns with ecosystem direction  
✅ **Gradual Migration**: Can be adopted incrementally

## Real-World Examples

### Meta's Approach

From research: Meta uses monorepo with direct mainline commits, automatic dependency updates, and environment-aware consumption patterns.

### Turborepo Examples

Official Turborepo examples show conditional exports in production monorepos:

```json
{
  "exports": {
    "./add": {
      "types": "./src/add.ts",
      "default": "./dist/add.js"
    }
  }
}
```

### Enterprise Pattern

Large organizations use:

- Development: Source consumption for speed
- CI/CD: Built consumption for reliability
- Testing: TypeScript environment with source files

## Migration Path

### Step 1: Audit Current State

- Identify packages using source exports
- Identify packages using built exports
- Document current pain points

### Step 2: Implement Conditional Exports

- Start with leaf packages (no internal dependencies)
- Update package.json exports
- Test in development and production

### Step 3: Update Tooling

- Configure bundlers for source consumption
- Update turbo.json dependencies
- Fix integration tests

### Step 4: Validate & Iterate

- Verify development speed improvements
- Confirm production reliability
- Gather team feedback

## Conclusion

The Conditional Exports pattern represents the modern solution to monorepo dual consumption. It leverages Node.js native features to provide:

- **Fast development** through source consumption
- **Reliable production** through built artifacts
- **Flexible tooling** that adapts to context
- **Future-proof architecture** aligned with ecosystem trends

This approach eliminates the false choice between development speed and production reliability, enabling teams to optimize for both simultaneously.

## Additional Resources

- [Turborepo Internal Packages Documentation](https://turborepo.com/docs/core-concepts/internal-packages)
- [Node.js Package Exports](https://nodejs.org/api/packages.html#exports)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Modern Monorepo Patterns (2024)](https://monorepo.tools/)
