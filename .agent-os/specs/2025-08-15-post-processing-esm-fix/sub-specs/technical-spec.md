# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-15-post-processing-esm-fix/spec.md

> Created: 2025-08-15
> Version: 1.0.0

## Technical Requirements

### Core Requirements

- Create a post-processing script that adds `.js` extensions to imports in compiled JavaScript
- Integrate seamlessly with existing TypeScript build process
- Handle all import patterns (relative, dynamic, re-exports)
- Preserve source maps and declaration files
- Work with existing Turborepo caching
- Zero runtime dependencies
- Minimal build time overhead (< 1 second per package)

### Import Patterns to Handle

1. **Standard imports**: `import { x } from './module'`
2. **Default imports**: `import x from './module'`
3. **Namespace imports**: `import * as x from './module'`
4. **Side-effect imports**: `import './module'`
5. **Dynamic imports**: `await import('./module')`
6. **Re-exports**: `export { x } from './module'`
7. **Export all**: `export * from './module'`

## Approach Options

### Option A: Complex Bundler (tsup/tsdown/Vite)

**Description**: Introduce a bundling tool to handle module resolution

**Pros:**

- Handles many edge cases automatically
- Provides additional optimizations
- Well-tested solutions

**Cons:**

- Adds significant complexity
- New tool to learn and maintain
- Risk of breaking changes
- Configuration overhead
- Potential compatibility issues

### Option B: Post-Processing Script (Selected)

**Description**: Simple Node.js script that fixes extensions after TypeScript compilation

**Pros:**

- Minimal complexity
- Easy to understand and debug
- No new dependencies
- Works with existing build system
- Easy to rollback
- Full control over the process

**Cons:**

- Need to handle edge cases ourselves
- Slightly slower than integrated solution
- Additional build step

**Rationale**: The post-processing approach provides the simplest solution with the least risk. It solves the specific problem without introducing unnecessary complexity.

## Script Implementation

### Core Script: fix-esm-extensions.js

```javascript
#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { glob } from 'glob'

/**
 * Fixes ES module imports by adding .js extensions where needed
 */
async function fixEsmExtensions(distDir) {
  // Find all JavaScript files in the dist directory
  const files = await glob(`${distDir}/**/*.js`)

  let filesProcessed = 0
  let importsFixed = 0

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8')
    let modified = content
    let fileImportsFixed = 0

    // Fix static imports/exports
    modified = modified.replace(
      /(\bimport\s+(?:.*?\s+from\s+)?['"])(\.[^'"]+?)(?<!\.js)(?<!\.json)(['"])/g,
      (match, prefix, importPath, suffix) => {
        // Skip if already has extension or is a directory index
        if (importPath.endsWith('/')) {
          return match
        }
        fileImportsFixed++
        return `${prefix}${importPath}.js${suffix}`
      },
    )

    // Fix dynamic imports
    modified = modified.replace(
      /(\bimport\s*\(\s*['"])(\.[^'"]+?)(?<!\.js)(?<!\.json)(['"]\s*\))/g,
      (match, prefix, importPath, suffix) => {
        if (importPath.endsWith('/')) {
          return match
        }
        fileImportsFixed++
        return `${prefix}${importPath}.js${suffix}`
      },
    )

    // Fix export from statements
    modified = modified.replace(
      /(\bexport\s+(?:.*?\s+)?from\s+['"])(\.[^'"]+?)(?<!\.js)(?<!\.json)(['"])/g,
      (match, prefix, importPath, suffix) => {
        if (importPath.endsWith('/')) {
          return match
        }
        fileImportsFixed++
        return `${prefix}${importPath}.js${suffix}`
      },
    )

    // Only write if changes were made
    if (modified !== content) {
      await fs.writeFile(file, modified, 'utf8')
      filesProcessed++
      importsFixed += fileImportsFixed
    }
  }

  console.log(`✅ Processed ${files.length} files`)
  console.log(`📝 Modified ${filesProcessed} files`)
  console.log(`🔧 Fixed ${importsFixed} imports`)
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const distDir = process.argv[2] || 'dist'

  fixEsmExtensions(distDir)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Error fixing extensions:', error)
      process.exit(1)
    })
}

export { fixEsmExtensions }
```

### Integration Script: packages/dev-tools/src/fix-esm-extensions.js

```javascript
/**
 * Reusable module for fixing ESM extensions
 * Can be imported by other packages or used via CLI
 */
export async function fixPackageExtensions(packagePath) {
  const distPath = path.join(packagePath, 'dist')

  if (
    !(await fs
      .access(distPath)
      .then(() => true)
      .catch(() => false))
  ) {
    console.warn(`⚠️ No dist directory found at ${distPath}`)
    return
  }

  await fixEsmExtensions(distPath)
}

// Support for monorepo-wide fixing
export async function fixAllPackages() {
  const packages = await glob('packages/*/package.json')

  for (const pkgFile of packages) {
    const pkgDir = path.dirname(pkgFile)
    const pkgJson = JSON.parse(await fs.readFile(pkgFile, 'utf8'))

    // Skip packages without build output
    if (
      !pkgJson.scripts?.build ||
      pkgJson.scripts.build === 'echo "No build needed"'
    ) {
      continue
    }

    console.log(`\n📦 Processing ${pkgJson.name}...`)
    await fixPackageExtensions(pkgDir)
  }
}
```

## Package.json Integration

### Individual Package Setup

```json
{
  "scripts": {
    "build": "tsc && node ../../scripts/fix-esm-extensions.js dist",
    "dev": "tsc --watch"
  }
}
```

### Alternative: Using npm-run-all

```json
{
  "scripts": {
    "build:tsc": "tsc",
    "build:fix": "fix-esm-extensions dist",
    "build": "run-s build:tsc build:fix",
    "dev": "tsc --watch"
  }
}
```

### Monorepo-wide Script

```json
{
  "scripts": {
    "fix:extensions": "node scripts/fix-esm-extensions.js",
    "build": "turbo build && pnpm fix:extensions"
  }
}
```

## Edge Cases and Solutions

### 1. Node Built-in Modules

```javascript
// These should NOT get .js extension
import fs from 'fs'
import { readFile } from 'node:fs'

// Solution: Pattern excludes non-relative imports
```

### 2. Package Imports

```javascript
// These should NOT get .js extension
import { logger } from '@studio/logger'
import React from 'react'

// Solution: Only process imports starting with './'
```

### 3. JSON Imports

```javascript
// These should keep their extension
import config from './config.json'

// Solution: Pattern excludes paths already ending in .json
```

### 4. Directory Imports

```javascript
// These might need special handling
import utils from './utils/' // Should become './utils/index.js'

// Solution: Check if path ends with '/' and handle appropriately
```

### 5. Source Maps

```javascript
// Preserve source map comments
//# sourceMappingURL=index.js.map

// Solution: Don't modify comment lines
```

## Testing Strategy

### Unit Tests for Script

```javascript
describe('fix-esm-extensions', () => {
  it('should add .js to relative imports', () => {
    const input = "import { x } from './module'"
    const expected = "import { x } from './module.js'"
    expect(processImport(input)).toBe(expected)
  })

  it('should not modify package imports', () => {
    const input = "import { x } from '@studio/logger'"
    expect(processImport(input)).toBe(input)
  })

  it('should handle dynamic imports', () => {
    const input = "await import('./lazy')"
    const expected = "await import('./lazy.js')"
    expect(processImport(input)).toBe(expected)
  })

  it('should preserve existing extensions', () => {
    const input = "import data from './config.json'"
    expect(processImport(input)).toBe(input)
  })
})
```

### Integration Tests

```javascript
describe('build integration', () => {
  it('should produce working Node.js modules', async () => {
    // Build a test package
    await exec('pnpm --filter test-package build')

    // Try to run the output
    const { stdout, stderr } = await exec(
      'node packages/test-package/dist/index.js',
    )

    expect(stderr).toBe('')
    expect(stdout).toContain('Success')
  })
})
```

## Performance Considerations

### Expected Performance

- **Script execution time**: 50-200ms per package
- **Regex processing**: ~1ms per file
- **File I/O**: Main bottleneck, but still fast
- **Total overhead**: < 1 second for entire monorepo

### Optimization Options

1. **Parallel processing**: Process multiple files concurrently
2. **Streaming**: Use streams for large files
3. **Caching**: Skip unchanged files based on mtime
4. **Turbo integration**: Let Turbo cache the results

## Rollback Plan

If the script causes issues:

1. **Immediate fix**: Remove script from build commands
2. **Temporary workaround**: Add `.js` extensions manually where needed
3. **Full rollback**: `git revert` the implementation commit

The beauty of this approach is its simplicity - easy to add, easy to remove.

## Alternative Implementations

### Babel Plugin (not selected)

```javascript
// Could use @babel/plugin-transform-modules-commonjs
// But adds Babel as dependency
```

### TypeScript Transform Plugin (not selected)

```javascript
// Could write custom TypeScript transformer
// But more complex and harder to maintain
```

### Regex in Build Script (not selected)

```bash
# Could use sed/awk in build script
# But less portable and harder to test
```

## Success Criteria

- [ ] All packages build without errors
- [ ] CLI tools execute correctly
- [ ] No runtime import errors in Node.js
- [ ] Source maps still work
- [ ] Build time increase < 1 second
- [ ] Script handles all import patterns correctly
- [ ] Easy to debug when issues arise
