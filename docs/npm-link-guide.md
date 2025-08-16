# NPM/PNPM Link Guide for Mnemosyne Packages

> **Quick Start**: Use Mnemosyne packages in external projects without publishing to npm
> Last Updated: 2025-08-16

## Overview

This guide explains how to use `npm link` or `pnpm link` to consume Mnemosyne packages in other projects without publishing them to npm. This is perfect for:

- Testing packages before publishing
- Using internal packages across projects
- Rapid development with live updates
- Sharing code between repositories

## Prerequisites

- Node.js 18+ installed
- pnpm or npm package manager
- Built packages in the Mnemosyne monorepo

## Step 1: Build the Packages

Before linking, ensure packages are built with proper ES module extensions:

```bash
# Build all packages
pnpm build

# Or build specific packages
pnpm --filter @studio/logger build
pnpm --filter @studio/claude-hooks build
```

## Step 2: Create Global Links

### Using pnpm (Recommended)

```bash
# Navigate to the package you want to link
cd packages/claude-hooks

# Create a global link
pnpm link --global

# Link additional packages
cd ../logger
pnpm link --global

cd ../ui
pnpm link --global
```

### Using npm

```bash
# Navigate to the package
cd packages/claude-hooks

# Create a global link
npm link

# Link additional packages
cd ../logger
npm link
```

## Step 3: Use in External Projects

### Link the Packages

In your external project:

```bash
# Using pnpm
pnpm link --global @studio/claude-hooks
pnpm link --global @studio/logger
pnpm link --global @studio/ui

# Using npm
npm link @studio/claude-hooks
npm link @studio/logger
npm link @studio/ui
```

### Alternative: Direct File Reference

In your project's `package.json`:

```json
{
  "dependencies": {
    "@studio/claude-hooks": "file:../path/to/mnemosyne/packages/claude-hooks",
    "@studio/logger": "file:../path/to/mnemosyne/packages/logger"
  }
}
```

## Available Packages

### Core Packages

| Package                | Description                                   | CLI Tools        |
| ---------------------- | --------------------------------------------- | ---------------- |
| `@studio/claude-hooks` | Claude Code hooks with TTS and quality checks | ✅ Yes (7 tools) |
| `@studio/logger`       | Dual-environment logging (Node.js + browser)  | ❌ No            |
| `@studio/db`           | Prisma database client with SQLite            | ❌ No            |
| `@studio/ui`           | React component library                       | ❌ No            |
| `@studio/schema`       | Shared Zod schemas                            | ❌ No            |

### CLI Tools (from @studio/claude-hooks)

Once linked, these commands are available globally:

- `claude-hooks-stop` - Task completion notifications
- `claude-hooks-quality` - Code quality checks
- `claude-hooks-notification` - System notifications
- `claude-hooks-cache-stats` - TTS cache statistics
- `claude-hooks-cache-explorer` - Browse TTS cache
- `claude-hooks-list-voices` - List available voices
- `claude-hooks-subagent` - Sub-agent notifications

### Utility Packages

| Package              | Description                | Use Case                   |
| -------------------- | -------------------------- | -------------------------- |
| `@studio/memory`     | Memory management with LLM | AI-powered data processing |
| `@studio/validation` | Data validation utilities  | Input validation           |
| `@studio/shared`     | Shared utilities           | Common functions           |
| `@studio/mocks`      | MSW mock server            | Testing                    |
| `@studio/scripts`    | CLI scripts                | Data import/export         |

## Usage Examples

### ES Modules (Recommended)

Your project needs `"type": "module"` in package.json:

```javascript
// Import packages
import { logger, createLogger } from '@studio/logger'
import { createTTSProvider } from '@studio/claude-hooks/speech'
import { Button } from '@studio/ui'
import { messageSchema } from '@studio/schema'

// Use the logger
const log = createLogger('my-app')
log.info('Application started')

// Create a TTS provider
const tts = await createTTSProvider({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
})

// Validate data
const message = messageSchema.parse(data)
```

### CommonJS (Legacy)

If your project uses CommonJS:

```javascript
// Dynamic imports required for ES modules
async function main() {
  const { logger } = await import('@studio/logger')
  const { createTTSProvider } = await import('@studio/claude-hooks/speech')

  logger.info('Application started')
}

main()
```

### TypeScript

TypeScript automatically picks up type definitions:

```typescript
import type { Message, User } from '@studio/db'
import { logger } from '@studio/logger'
import { runQualityChecks } from '@studio/claude-hooks/quality-check'

async function checkCode(files: string[]): Promise<void> {
  logger.info('Running quality checks...')
  const results = await runQualityChecks({ files })
  console.log(results)
}
```

### React Components

```jsx
import { Button, Card, Input } from '@studio/ui'

export function MyApp() {
  return (
    <Card>
      <Input placeholder="Enter text..." />
      <Button onClick={() => console.log('Clicked!')}>Click Me</Button>
    </Card>
  )
}
```

## Verifying Links

### Check Global Links

```bash
# List all globally linked packages (pnpm)
pnpm list --global --depth=0

# Should show:
# + @studio/claude-hooks 0.1.0 <- /path/to/mnemosyne/packages/claude-hooks
# + @studio/logger 0.1.0 <- /path/to/mnemosyne/packages/logger
```

### Check Project Links

In your external project:

```bash
# List linked packages
npm ls --link --depth=0

# Or with pnpm
pnpm list --depth=0 | grep "link:"
```

## Live Development

Changes to linked packages are reflected immediately:

1. **Make changes** in Mnemosyne package source
2. **Rebuild** the package: `pnpm build`
3. **Changes appear** instantly in linked projects

No need to re-link or restart your application!

## Package Features

### ES Modules Support

All packages use ES modules with proper `.js` extensions:

- ✅ Works with Node.js native ES modules
- ✅ Compatible with modern bundlers (Vite, esbuild)
- ✅ Tree-shaking enabled
- ✅ Source maps included

### Dual Consumption

Packages support both development and production modes:

- **Development**: Uses TypeScript source directly
- **Production**: Uses optimized JavaScript

### TypeScript Definitions

All packages include `.d.ts` files for full TypeScript support.

## Troubleshooting

### Issue: "Cannot find module"

**Solution**: Ensure the package is built:

```bash
cd packages/[package-name]
pnpm build
```

### Issue: "ERR_MODULE_NOT_FOUND"

**Solution**: Check that your project uses ES modules:

```json
{
  "type": "module"
}
```

### Issue: Peer dependency warnings

**Solution**: Install peer dependencies in your project:

```bash
pnpm add -D eslint prettier typescript
```

### Issue: Changes not reflecting

**Solution**: Rebuild the package after changes:

```bash
pnpm --filter @studio/package-name build
```

## Removing Links

### Unlink from External Project

```bash
# Using pnpm
pnpm unlink @studio/claude-hooks

# Using npm
npm unlink @studio/claude-hooks
```

### Remove Global Link

```bash
# In the package directory
cd packages/claude-hooks

# Remove global link (pnpm)
pnpm unlink --global

# Remove global link (npm)
npm unlink
```

## Best Practices

1. **Always build before linking** - Ensures dist files are up to date
2. **Use pnpm for consistency** - Matches the monorepo's package manager
3. **Link only what you need** - Reduces complexity in external projects
4. **Document linked packages** - Track what's linked in your project's README
5. **Test before publishing** - Use links to validate packages work correctly

## Publishing to NPM

Once tested via linking, publish packages:

```bash
# Build all packages
pnpm build

# Publish a specific package
cd packages/claude-hooks
npm publish --access public
```

## Example Project Setup

Here's a complete example of using linked packages:

```json
// package.json
{
  "name": "my-external-app",
  "type": "module",
  "dependencies": {
    "@studio/claude-hooks": "link:@studio/claude-hooks",
    "@studio/logger": "link:@studio/logger"
  },
  "scripts": {
    "dev": "node index.js",
    "quality": "claude-hooks-quality"
  }
}
```

```javascript
// index.js
import { logger } from '@studio/logger'
import { createTTSProvider } from '@studio/claude-hooks/speech'

const log = logger.child({ module: 'app' })

async function main() {
  log.info('Starting application...')

  // Use TTS
  const tts = await createTTSProvider({ provider: 'macos' })
  await tts.speak('Application started')

  log.success('Ready!')
}

main().catch(console.error)
```

## Summary

NPM/PNPM linking provides a powerful way to:

- ✅ Use packages without publishing
- ✅ Test integration before release
- ✅ Share code between projects
- ✅ Develop with live updates
- ✅ Maintain type safety

The ES module extension fix ensures all packages work correctly when linked, providing a seamless development experience across projects.

## Related Documentation

- [ES Modules Guide](./esm-extensions-guide.md)
- [Development Guide](./development-guide.md)
- [Turborepo Guide](./turborepo-guide.md)
- [Package README files](../packages/*/README.md)

---

_This guide is part of the Mnemosyne monorepo documentation. All packages are ES module compatible and ready for linking._
