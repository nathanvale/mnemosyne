# Scripts Directory

This directory contains utility scripts for the Mnemosyne monorepo.

## fix-esm-extensions.js

A post-processing script that automatically adds `.js` extensions to import statements in compiled JavaScript output, solving Node.js ES module compatibility issues.

### Problem It Solves

When using TypeScript with `"type": "module"` in package.json:

- TypeScript doesn't add `.js` extensions to imports when compiling
- Node.js requires explicit `.js` extensions for ES modules
- This creates a mismatch between TypeScript output and Node.js requirements

### How It Works

1. Scans all `.js` files in the specified directory
2. Uses regex patterns to find relative imports/exports
3. Adds `.js` extension where needed
4. Preserves existing extensions (.json, .mjs, .cjs)
5. Ignores package imports and node_modules

### Usage

#### In Individual Packages

Add to your package.json build script:

```json
{
  "scripts": {
    "build": "tsc && node ../../scripts/fix-esm-extensions.js dist"
  }
}
```

#### Command Line

```bash
# Fix extensions in a specific directory
node scripts/fix-esm-extensions.js dist

# Fix extensions in a custom directory
node scripts/fix-esm-extensions.js path/to/compiled/js
```

#### Programmatic API

```javascript
import { fixEsmExtensions } from './scripts/fix-esm-extensions.js'

const stats = await fixEsmExtensions('dist')
console.log(
  `Fixed ${stats.importsFixed} imports in ${stats.filesModified} files`,
)
```

### What It Handles

- ✅ Static imports: `import { x } from './module'`
- ✅ Default imports: `import x from './module'`
- ✅ Namespace imports: `import * as x from './module'`
- ✅ Side-effect imports: `import './module'`
- ✅ Dynamic imports: `await import('./module')`
- ✅ Re-exports: `export { x } from './module'`
- ✅ Export all: `export * from './module'`

### What It Ignores

- ❌ Package imports: `import x from 'package-name'`
- ❌ Node built-ins: `import fs from 'fs'`
- ❌ Already has extension: `import x from './file.js'`
- ❌ JSON imports: `import data from './config.json'`
- ❌ URL imports: `import x from 'https://...'`

## fix-all-extensions.js

A monorepo-wide wrapper that runs `fix-esm-extensions.js` on all packages.

### Usage

#### Via npm Script

```bash
# Run from monorepo root
pnpm build:fix-extensions
```

#### Direct Execution

```bash
node scripts/fix-all-extensions.js
```

### Features

- 📦 Automatically finds all packages in `packages/` directory
- ⏭️ Skips packages without TypeScript builds
- 📊 Provides detailed statistics for all packages
- ✅ Shows progress for each package
- 🔧 Summary report of total files processed and imports fixed

### Output Example

```
🔧 Fixing ESM extensions for all packages...

📦 Processing @studio/logger...
   ✅ Processed 10 files, modified 2, fixed 5 imports
📦 Processing @studio/db...
   ✓ No changes needed (3 files checked)
⏭️  Skipping @studio/eslint-config (no TypeScript build)

════════════════════════════════════════════════════════════
📊 Summary:
════════════════════════════════════════════════════════════
📦 Packages processed: 14
⏭️  Packages skipped: 3
📄 Total files processed: 326
📝 Total files modified: 12
🔧 Total imports fixed: 29
════════════════════════════════════════════════════════════

✅ Successfully fixed ESM extensions across all packages!
```

## Integration with Build Pipeline

### Turborepo Integration

The script is integrated into each package's build process:

1. TypeScript compiles the source code
2. fix-esm-extensions.js post-processes the output
3. Result is Node.js-compatible ES modules

### CI/CD Compatibility

The script:

- Returns exit code 0 on success
- Returns exit code 1 on errors
- Outputs to stderr (compatible with CI systems)
- Provides clear error messages

### Performance

- Fast: ~50-200ms per package
- Efficient: Only modifies files that need changes
- Safe: Doesn't modify source files, only compiled output

## Rollback Plan

If you need to remove this solution:

1. **Remove from package.json build scripts:**

   ```diff
   - "build": "tsc && node ../../scripts/fix-esm-extensions.js dist"
   + "build": "tsc"
   ```

2. **Remove the convenience script:**

   ```diff
   - "build:fix-extensions": "node scripts/fix-all-extensions.js"
   ```

3. **Delete the script files:**
   ```bash
   rm scripts/fix-esm-extensions.js
   rm scripts/fix-all-extensions.js
   ```

That's it! No other changes needed.

## Why This Approach?

### Advantages

- **Simple**: One script, one purpose
- **Transparent**: Easy to understand what it does
- **Maintainable**: No complex configuration
- **Compatible**: Works with existing TypeScript/Turbo setup
- **Reversible**: Easy to remove if needed
- **Fast**: Minimal build time impact

### Alternatives Considered

1. **Bundlers (tsup, esbuild, etc.)**
   - ❌ Adds complexity and new dependencies
   - ❌ Requires learning new tools
   - ❌ Can have compatibility issues

2. **TypeScript Plugins**
   - ❌ More complex to maintain
   - ❌ Tied to TypeScript version

3. **Manual `.js` extensions in source**
   - ❌ Pollutes TypeScript source code
   - ❌ Against TypeScript best practices

## Troubleshooting

### Script Not Finding Files

**Problem**: "No dist directory found"

**Solution**: Make sure to build TypeScript first:

```bash
pnpm build  # This runs tsc first, then the script
```

### Extensions Not Being Added

**Problem**: Imports still missing `.js` after running script

**Check**:

1. Is the import relative? (starts with `./` or `../`)
2. Does it already have an extension?
3. Is it in a `.js` file in the dist directory?

### Performance Issues

If processing is slow:

1. Check if `dist` directory has unexpected files
2. Ensure `node_modules` isn't in dist
3. Consider running on specific subdirectories

## Contributing

When modifying these scripts:

1. Test with a single package first
2. Run the monorepo-wide script to verify
3. Ensure all tests pass: `pnpm test`
4. Update this documentation if behavior changes

## License

Part of the Mnemosyne monorepo. See root LICENSE file.
