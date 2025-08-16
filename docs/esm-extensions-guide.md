# ES Module Extensions Guide

> **Quick Reference**: Solving TypeScript ES module import issues in Node.js
> Last Updated: 2025-08-15

## The Problem

When using TypeScript with ES modules (`"type": "module"` in package.json), you'll encounter this error:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module './logger' imported from dist/index.js
Did you mean to import './logger.js'?
```

**Why this happens:**

- TypeScript doesn't add `.js` extensions when compiling
- Node.js ES modules require explicit `.js` extensions
- This creates a mismatch between TypeScript output and Node.js requirements

## The Solution

We use a simple post-processing script that automatically adds `.js` extensions to imports after TypeScript compilation.

### Quick Setup

1. **For individual packages**, update your `package.json`:

```json
{
  "scripts": {
    "build": "tsc && node ../../scripts/fix-esm-extensions.js dist"
  }
}
```

2. **For the entire monorepo**, run:

```bash
pnpm build:fix-extensions
```

That's it! Your compiled JavaScript will now have proper `.js` extensions.

## How It Works

```mermaid
graph LR
    A[TypeScript Source] -->|tsc| B[JS without extensions]
    B -->|fix-esm-extensions| C[JS with .js extensions]
    C --> D[Node.js Compatible]
```

The script:

1. Runs after TypeScript compilation
2. Scans all `.js` files in the output directory
3. Adds `.js` to relative imports that need it
4. Preserves existing extensions (.json, .mjs, etc.)
5. Ignores package imports and node_modules

## Examples

### Before (TypeScript output)

```javascript
import { logger } from './logger'
import { config } from './config'
export { utils } from './utils'
```

### After (Script processed)

```javascript
import { logger } from './logger.js'
import { config } from './config.js'
export { utils } from './utils.js'
```

## Common Use Cases

### Adding to a New Package

When creating a new package in the monorepo:

```json
{
  "name": "@studio/new-package",
  "type": "module",
  "scripts": {
    "build": "tsc && node ../../scripts/fix-esm-extensions.js dist"
  }
}
```

### Running on CI/CD

The script is already integrated into the build pipeline:

```bash
# This automatically runs the fix for all packages
pnpm build
```

### Debugging Import Issues

If you're seeing import errors:

```bash
# Check a specific package
node scripts/fix-esm-extensions.js packages/logger/dist

# Check all packages
pnpm build:fix-extensions
```

## Benefits

✅ **No source code changes** - Keep TypeScript files clean  
✅ **Simple solution** - One script, no complex configuration  
✅ **Fast** - Adds < 200ms to build time  
✅ **Reversible** - Easy to remove if needed  
✅ **Compatible** - Works with existing Turborepo setup

## Alternatives We Avoided

❌ **Adding `.js` to TypeScript source** - Pollutes source code  
❌ **Using bundlers (tsup, esbuild)** - Adds complexity  
❌ **TypeScript plugins** - Version dependent, harder to maintain

## Troubleshooting

### Import still failing?

Check if the import:

- Is relative (starts with `./` or `../`)
- Is in a `.js` file in the dist directory
- Doesn't already have an extension

### Script not running?

Ensure:

- TypeScript compiles first (`tsc`)
- The `dist` directory exists
- You're using `"type": "module"` in package.json

## Learn More

For detailed documentation, implementation details, and advanced usage:

📖 **[Complete Scripts Documentation](../scripts/README.md)**

This includes:

- Programmatic API usage
- Performance optimization
- Rollback procedures
- Contributing guidelines
- Technical implementation details

## Quick Reference

| Command                                   | Purpose                        |
| ----------------------------------------- | ------------------------------ |
| `pnpm build`                              | Build all packages with fixes  |
| `pnpm build:fix-extensions`               | Fix extensions in all packages |
| `node scripts/fix-esm-extensions.js dist` | Fix single directory           |

## Need Help?

1. Check the [Scripts README](../scripts/README.md) for detailed documentation
2. Review the [implementation spec](./../.agent-os/specs/2025-08-15-post-processing-esm-fix/spec.md)
3. Look at working examples in any `@studio/*` package

---

_This guide is part of the Mnemosyne monorepo documentation. The ES module extension fix is a pragmatic solution that keeps our codebase clean while ensuring Node.js compatibility._
