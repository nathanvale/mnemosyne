# Implementation Guide

This guide provides step-by-step instructions for implementing the post-processing script solution.

> Created: 2025-08-15
> Version: 1.0.0

## Quick Start

### What We're Doing

Adding a simple script that runs after TypeScript compilation to add `.js` extensions to imports in the compiled output. This allows us to:

- Keep TypeScript source clean (no `.js` extensions)
- Produce Node.js-compatible ES modules
- Avoid complex bundler configurations

## Implementation Steps

### Step 1: Create the Post-Processing Script

Create `scripts/fix-esm-extensions.js` in the project root:

```javascript
#!/usr/bin/env node

import { promises as fs } from 'fs'
import { glob } from 'glob'

async function fixEsmExtensions(distDir) {
  const files = await glob(`${distDir}/**/*.js`)
  let totalFixed = 0

  for (const file of files) {
    const content = await fs.readFile(file, 'utf8')

    // Add .js to relative imports that don't already have it
    const fixed = content
      // Fix: import { x } from './module' → './module.js'
      .replace(
        /from\s+['"](\.[^'"]+?)(?<!\.js)(?<!\.json)['"]/g,
        "from '$1.js'",
      )
      // Fix: import('./module') → import('./module.js')
      .replace(
        /import\(['"](\.[^'"]+?)(?<!\.js)(?<!\.json)['"]\)/g,
        "import('$1.js')",
      )
      // Fix: export { x } from './module' → './module.js'
      .replace(
        /from\s+['"](\.[^'"]+?)(?<!\.js)(?<!\.json)['"]/g,
        "from '$1.js'",
      )

    if (fixed !== content) {
      await fs.writeFile(file, fixed, 'utf8')
      totalFixed++
    }
  }

  console.log(`✅ Fixed ${totalFixed} files`)
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const distDir = process.argv[2] || 'dist'
  fixEsmExtensions(distDir).catch(console.error)
}

export { fixEsmExtensions }
```

### Step 2: Update Package.json Scripts

For each package that needs fixing, update the build script:

#### Before:

```json
{
  "scripts": {
    "build": "tsc"
  }
}
```

#### After:

```json
{
  "scripts": {
    "build": "tsc && node ../../scripts/fix-esm-extensions.js dist"
  }
}
```

### Step 3: Test with a Single Package

Start with one package to validate the approach:

```bash
# Choose @studio/logger as test package
cd packages/logger

# Build with the new script
pnpm build

# Check the output
cat dist/index.js | grep "from"

# Test that it runs
node dist/index.js
```

### Step 4: Roll Out to All Packages

Once validated, update all packages:

```bash
# List of packages that need updating
packages=(
  "logger"
  "db"
  "schema"
  "shared"
  "validation"
  "ui"
  "memory"
  "scripts"
  "mcp"
  "dev-tools"
  "code-review"
  "claude-hooks"
  "mocks"
)

# Update each package.json
for pkg in "${packages[@]}"; do
  # Update the build script
  # (Manual edit or use jq/sed)
done
```

### Step 5: Create Helper Scripts (Optional)

Add convenience scripts to the root package.json:

```json
{
  "scripts": {
    "fix:all-extensions": "node scripts/fix-all-extensions.js",
    "postbuild": "pnpm fix:all-extensions"
  }
}
```

Create `scripts/fix-all-extensions.js`:

```javascript
#!/usr/bin/env node

import { fixEsmExtensions } from './fix-esm-extensions.js'
import { glob } from 'glob'
import path from 'path'

async function fixAllPackages() {
  const packages = await glob('packages/*/dist', { onlyDirectories: true })

  for (const distPath of packages) {
    const pkgName = path.basename(path.dirname(distPath))
    console.log(`📦 Fixing ${pkgName}...`)
    await fixEsmExtensions(distPath)
  }
}

fixAllPackages().catch(console.error)
```

## Validation Checklist

After implementing, verify:

- [ ] Script runs without errors
- [ ] Imports in dist/ have `.js` extensions
- [ ] Source files remain unchanged (no `.js` in src/)
- [ ] CLI binaries execute correctly
- [ ] Tests still pass
- [ ] Hot reload still works in development

## Quick Test

```bash
# Build everything
pnpm build

# Test a CLI tool
./packages/claude-hooks/dist/bin/claude-hooks-stop.js

# Test an import
node -e "import('@studio/logger').then(m => console.log('Success!'))"
```

## Troubleshooting

### Issue: Script not found

```bash
# Make sure the script is executable
chmod +x scripts/fix-esm-extensions.js
```

### Issue: Glob not installed

```bash
# Add glob as a dev dependency
pnpm add -D glob
```

### Issue: Some imports not fixed

Check the regex patterns - they might need adjustment for your specific code patterns.

### Issue: Build takes longer

The script adds < 1 second to build time. If it's slower, consider:

- Running in parallel with Promise.all
- Only processing changed files
- Using Turbo caching

## Rollback

If you need to rollback:

1. Remove the script call from package.json files
2. Delete the script files
3. That's it! No other changes needed

## Next Steps

Once working:

1. Document the approach in README
2. Add tests for the script
3. Consider optimizations if needed
4. Monitor for edge cases

## Why This Approach?

- **Simple**: One small script, easy to understand
- **Safe**: Doesn't change how TypeScript compiles
- **Reversible**: Easy to remove if needed
- **Maintainable**: No complex configuration
- **Compatible**: Works with existing tooling
