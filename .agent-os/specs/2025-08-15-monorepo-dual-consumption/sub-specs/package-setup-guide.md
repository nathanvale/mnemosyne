# Package Setup Guide

This guide explains how to create new packages with dual consumption support in the monorepo.

> Created: 2025-08-15
> Version: 1.0.0

## Quick Start Template

### 1. Create Package Structure

```bash
# Create new package directory
mkdir -p packages/your-package/src

# Navigate to package
cd packages/your-package

# Initialize package.json
pnpm init
```

### 2. Standard Package.json Template

```json
{
  "name": "@studio/your-package",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": {
      "development": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "lint": "eslint src --max-warnings 0",
    "format:check": "prettier --check src",
    "clean": "rm -rf dist *.tsbuildinfo"
  },
  "dependencies": {
    "zod": "^3.25.74"
  },
  "devDependencies": {
    "@studio/eslint-config": "workspace:*",
    "@studio/typescript-config": "workspace:*",
    "typescript": "^5.8.3",
    "vitest": "^3.2.4"
  }
}
```

### 3. TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "extends": "@studio/typescript-config/library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "**/*.test.ts", "**/*.spec.ts"]
}
```

### 4. ESLint Configuration

Create `eslint.config.mjs`:

```javascript
import { library } from '@studio/eslint-config'

export default [...library]
```

### 5. Entry Point

Create `src/index.ts`:

```typescript
// Main exports for your package
export { myFunction } from './my-function.js'
export type { MyType } from './types.js'
```

## Advanced Patterns

### Multiple Entry Points

For packages with multiple entry points:

```json
{
  "exports": {
    ".": {
      "development": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./utils": {
      "development": "./src/utils/index.ts",
      "types": "./dist/utils/index.d.ts",
      "import": "./dist/utils/index.js",
      "default": "./dist/utils/index.js"
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

### React Component Package

Additional configuration for React packages:

```json
{
  "peerDependencies": {
    "react": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.1.8",
    "@vitejs/plugin-react": "^4.6.0",
    "@testing-library/react": "^16.3.0"
  }
}
```

### CLI Package with Binaries

For packages that provide CLI tools:

```json
{
  "bin": {
    "my-cli": "./dist/bin/my-cli.js"
  },
  "files": ["dist/**/*", "README.md"],
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

Add shebang to CLI entry point (`src/bin/my-cli.ts`):

```typescript
#!/usr/bin/env node
import { main } from '../cli.js'

main().catch(console.error)
```

## Testing Configuration

### Vitest Setup

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node', // or 'jsdom' for UI packages
    globals: true,
    includeSource: ['src/**/*.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.test.ts', '**/*.spec.ts'],
    },
  },
})
```

### Example Test

Create `src/__tests__/my-function.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { myFunction } from '../my-function.js'

describe('myFunction', () => {
  it('should work correctly', () => {
    expect(myFunction('input')).toBe('expected output')
  })
})
```

## Build Optimization

### Tree-Shaking Support

Ensure your package supports tree-shaking:

```json
{
  "sideEffects": false
}
```

Or specify files with side effects:

```json
{
  "sideEffects": ["./src/polyfills.js", "*.css"]
}
```

### Build Output Structure

After running `pnpm build`, your package should have:

```
packages/your-package/
├── src/              # Source files (development)
│   ├── index.ts
│   └── utils.ts
├── dist/             # Built files (production)
│   ├── index.js
│   ├── index.d.ts
│   ├── index.js.map
│   ├── utils.js
│   ├── utils.d.ts
│   └── utils.js.map
└── package.json
```

## Integration with Monorepo

### Adding to Workspace

The package is automatically part of the workspace if it's in the `packages/` directory.

### Using in Other Packages

In another package's `package.json`:

```json
{
  "dependencies": {
    "@studio/your-package": "workspace:*"
  }
}
```

Then import normally:

```typescript
// In development: resolves to packages/your-package/src/index.ts
// In production: resolves to packages/your-package/dist/index.js
import { myFunction } from '@studio/your-package'
```

## Common Patterns

### Shared Types Package

```json
{
  "name": "@studio/types",
  "exports": {
    ".": {
      "development": "./src/index.ts",
      "types": "./dist/index.d.ts"
    }
  }
}
```

### Configuration Package

```json
{
  "name": "@studio/config",
  "exports": {
    ".": {
      "development": "./src/index.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./package.json": "./package.json"
  }
}
```

### Utility Library

```json
{
  "name": "@studio/utils",
  "exports": {
    "./strings": {
      "development": "./src/strings/index.ts",
      "types": "./dist/strings/index.d.ts",
      "import": "./dist/strings/index.js",
      "default": "./dist/strings/index.js"
    },
    "./dates": {
      "development": "./src/dates/index.ts",
      "types": "./dist/dates/index.d.ts",
      "import": "./dist/dates/index.js",
      "default": "./dist/dates/index.js"
    }
  }
}
```

## Checklist for New Packages

- [ ] Package.json with conditional exports
- [ ] TypeScript configuration extending base
- [ ] ESLint configuration
- [ ] Build script (`tsc`)
- [ ] Test setup with Vitest
- [ ] Entry point file (`src/index.ts`)
- [ ] README.md with usage examples
- [ ] Add to root package.json scripts if needed
- [ ] Verify hot reload works in development
- [ ] Test production build (`pnpm build`)
- [ ] Verify external consumption via npm link
