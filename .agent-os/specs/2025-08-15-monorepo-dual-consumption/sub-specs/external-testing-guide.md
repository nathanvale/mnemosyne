# External Testing Guide

This guide explains how to test packages as if they were consumed externally, using npm link and a separate test repository.

> Created: 2025-08-15
> Version: 1.0.0

## Overview

External testing validates that packages work correctly when consumed outside the monorepo, ensuring:

- ES modules compatibility with Vite
- TypeScript types resolve correctly
- Built artifacts work as expected
- No monorepo-specific dependencies leak

## Setting Up Test Repository

### Step 1: Create Test Repository Structure

```bash
# Navigate to parent directory (sibling to monorepo)
cd ../
mkdir mnemosyne-consumer-test
cd mnemosyne-consumer-test

# Initialize package.json
pnpm init

# Install Vite and React (for testing UI components)
pnpm add -D vite @vitejs/plugin-react
pnpm add react react-dom
```

### Step 2: Configure Package.json

```json
{
  "name": "mnemosyne-consumer-test",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:packages": "node tests/verify-packages.js"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.6.0",
    "vite": "^5.4.0",
    "vitest": "^3.2.4"
  }
}
```

### Step 3: Create Vite Configuration

Create `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // Include linked packages for pre-bundling
    include: ['@studio/ui', '@studio/logger', '@studio/utils'],
  },
  resolve: {
    // Preserve symlinks for npm-linked packages
    preserveSymlinks: true,
    // Ensure ES modules are handled correctly
    conditions: ['import', 'module', 'browser', 'default'],
  },
  build: {
    // Ensure ES modules output
    target: 'es2022',
    minify: 'esbuild',
  },
})
```

### Step 4: Create Test Entry Point

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mnemosyne Package Test</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

Create `src/main.jsx`:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

## Linking Packages

### Step 1: Build Packages in Monorepo

```bash
# In monorepo directory
cd ../mnemosyne

# Build all packages
pnpm build

# Or build specific packages
pnpm --filter @studio/ui build
pnpm --filter @studio/logger build
```

### Step 2: Create npm Links

```bash
# Link packages globally
cd packages/ui
npm link

cd ../logger
npm link

cd ../utils
npm link
```

### Step 3: Link in Test Repository

```bash
# In test repository
cd ../mnemosyne-consumer-test

# Link packages
npm link @studio/ui
npm link @studio/logger
npm link @studio/utils
```

### Step 4: Verify Links

```bash
# Check linked packages
ls -la node_modules/@studio/

# Should show symlinks:
# ui -> ../../../../mnemosyne/packages/ui
# logger -> ../../../../mnemosyne/packages/logger
```

## Testing Scenarios

### Scenario 1: ES Module Imports

Create `src/test-imports.js`:

```javascript
// Test default exports
import logger from '@studio/logger'

// Test named exports
import { createLogger, LogLevel } from '@studio/logger'

// Test subpath exports
import { testHelper } from '@studio/logger/testing'

// Test type imports (TypeScript)
import type { LoggerConfig } from '@studio/logger'

console.log('✅ All imports successful')
```

### Scenario 2: React Components

Create `src/App.jsx`:

```jsx
import { Button, Card, Input } from '@studio/ui'
import { logger } from '@studio/logger'

export function App() {
  const handleClick = () => {
    logger.info('Button clicked')
  }

  return (
    <Card>
      <h1>External Package Test</h1>
      <Input placeholder="Test input" />
      <Button onClick={handleClick}>Test Button</Button>
    </Card>
  )
}
```

### Scenario 3: Utilities and Functions

Create `src/test-utils.js`:

```javascript
import { formatDate, parseJSON, debounce } from '@studio/utils'

// Test utility functions
const date = formatDate(new Date())
const data = parseJSON('{"test": true}')
const debouncedFn = debounce(() => console.log('Called'), 100)

console.log('Date:', date)
console.log('Data:', data)
debouncedFn()
```

### Scenario 4: TypeScript Types

Create `src/test-types.ts`:

```typescript
import type { User, Config, Logger } from '@studio/types'
import { createUser, validateConfig } from '@studio/validation'

const user: User = createUser({
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
})

const config: Config = {
  debug: true,
  logLevel: 'info',
}

const isValid = validateConfig(config)
console.log('Config valid:', isValid)
```

## Automated Tests

### Create Test Suite

Create `tests/verify-packages.test.js`:

```javascript
import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import { resolve } from 'path'

describe('External Package Consumption', () => {
  it('should resolve @studio/ui package', async () => {
    const pkg = await import('@studio/ui')
    expect(pkg).toBeDefined()
    expect(pkg.Button).toBeDefined()
  })

  it('should resolve @studio/logger package', async () => {
    const pkg = await import('@studio/logger')
    expect(pkg).toBeDefined()
    expect(pkg.logger).toBeDefined()
  })

  it('should have TypeScript types', () => {
    const uiTypes = resolve('node_modules/@studio/ui/dist/index.d.ts')
    expect(existsSync(uiTypes)).toBe(true)
  })

  it('should load ES modules correctly', async () => {
    const module = await import('@studio/utils')
    expect(module.default).toBeDefined()
  })

  it('should support subpath exports', async () => {
    const testing = await import('@studio/logger/testing')
    expect(testing).toBeDefined()
  })
})
```

### Create Build Test

Create `tests/build-test.js`:

```javascript
import { build } from 'vite'
import { resolve } from 'path'

async function testBuild() {
  try {
    const result = await build({
      root: resolve(__dirname, '..'),
      build: {
        outDir: 'dist-test',
        rollupOptions: {
          input: resolve(__dirname, '../src/main.jsx'),
        },
      },
    })

    console.log('✅ Build successful')
    console.log('Output:', result)
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

testBuild()
```

## CLI Execution and Integration Testing

### Important Note: Development Condition vs CLI Execution

When writing integration tests that execute TypeScript files directly (e.g., testing CLI tools), the "development" condition in package.json exports does NOT automatically apply. This is a common misconception about dual consumption.

#### The Problem

```typescript
// This will fail - tsx can't resolve @studio/logger
const command = `tsx script.ts`

// This also fails - tsx doesn't properly support --conditions flag
const command = `tsx --conditions=development script.ts`
```

#### The Solution

Use tsx with the root tsconfig.json to leverage path mappings:

```typescript
// In your integration tests
const rootDir = join(__dirname, '../../../../../') // Navigate to monorepo root
const scriptPath = join(__dirname, '../../src/cli-script.ts')
const command = `cd ${rootDir} && npx tsx --tsconfig ${rootDir}/tsconfig.json ${scriptPath}`

execSync(command, {
  cwd: tempDir, // Can still execute from temp directory
  env: {
    ...process.env,
    // Your environment variables
  },
})
```

#### Why This Works

1. The root `tsconfig.json` contains path mappings for all workspace packages
2. tsx respects these path mappings when provided with --tsconfig
3. This allows TypeScript files to import workspace packages without building

#### Key Learnings

- **Development condition**: Used by bundlers (Vite, Webpack, Next.js) during module resolution
- **CLI execution**: Requires explicit path mapping configuration
- **Integration tests**: Should test the actual CLI experience using the approach above
- **External consumers**: Will use built artifacts (the "import" condition)

## Validation Checklist

### Basic Checks

- [ ] Packages link successfully
- [ ] Vite dev server starts without errors
- [ ] Imports resolve correctly
- [ ] Hot reload works
- [ ] Production build succeeds

### ES Modules Compatibility

- [ ] Dynamic imports work: `await import('@studio/package')`
- [ ] Static imports work: `import { thing } from '@studio/package'`
- [ ] Default exports work: `import pkg from '@studio/package'`
- [ ] Named exports work: `import { named } from '@studio/package'`
- [ ] Subpath exports work: `import { sub } from '@studio/package/sub'`

### TypeScript Support

- [ ] Type declarations are found
- [ ] Types resolve correctly in IDE
- [ ] Type checking passes
- [ ] Autocomplete works

### Build Output

- [ ] Tree-shaking works (unused code eliminated)
- [ ] Minification works
- [ ] Source maps are generated
- [ ] Assets are bundled correctly

## Troubleshooting

### Issue: Module not found

```bash
# Verify link exists
ls -la node_modules/@studio/

# Re-link if needed
npm unlink @studio/package
npm link @studio/package
```

### Issue: Vite fails to resolve

Add to `vite.config.js`:

```javascript
{
  resolve: {
    alias: {
      '@studio/ui': resolve('../mnemosyne/packages/ui/dist/index.js')
    }
  }
}
```

### Issue: Types not found

Ensure package was built:

```bash
cd ../mnemosyne
pnpm --filter @studio/package build
```

### Issue: ES Module errors

Ensure package.json has:

```json
{
  "type": "module"
}
```

## CI/CD Integration

### GitHub Action Example

```yaml
name: External Package Test

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test-external:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 22

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Build packages
        run: |
          pnpm install
          pnpm build

      - name: Create test repo
        run: |
          cd ..
          mkdir test-consumer
          cd test-consumer
          pnpm init -y

      - name: Link packages
        run: |
          cd packages/ui && npm link
          cd ../logger && npm link
          cd ../../../test-consumer
          npm link @studio/ui @studio/logger

      - name: Test imports
        run: |
          cd ../test-consumer
          node -e "import('@studio/ui').then(m => console.log('✅ UI imported'))"
          node -e "import('@studio/logger').then(m => console.log('✅ Logger imported'))"
```

## Summary

External testing ensures packages work correctly outside the monorepo:

1. **Setup**: Create separate test repository with Vite
2. **Link**: Use npm link to connect built packages
3. **Test**: Verify imports, types, and builds work
4. **Validate**: Run automated tests and build checks
5. **Iterate**: Fix issues and re-test until all checks pass

This process validates that your packages are truly consumable as standard ES modules by external projects using modern tooling like Vite.
