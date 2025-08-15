# Internal Consumption Guide

This guide explains how to consume packages internally within the monorepo using the dual consumption architecture.

> Created: 2025-08-15
> Version: 1.0.0

## How It Works

The dual consumption architecture uses Node.js conditional exports to serve different files based on the environment:

- **Development** (`NODE_ENV=development`): Imports resolve to TypeScript source files
- **Production** (`NODE_ENV=production`): Imports resolve to compiled JavaScript
- **Testing** (`NODE_ENV=test`): Imports resolve to TypeScript source files

## Development Mode

### Starting Development

```bash
# Automatically uses source files
pnpm dev

# Or explicitly set NODE_ENV
NODE_ENV=development pnpm dev
```

### What Happens

1. Next.js/Vite detects `NODE_ENV=development`
2. Package imports resolve to `./src/index.ts` (source files)
3. Bundler transpiles TypeScript on-the-fly
4. Hot Module Replacement works across package boundaries
5. Source maps point to original TypeScript files

### Example Import Flow

```typescript
// In apps/studio/src/components/MyComponent.tsx
import { logger } from '@studio/logger'

// Resolves to:
// Development: packages/logger/src/index.ts (source)
// Production: packages/logger/dist/index.js (compiled)
```

### Benefits

- ✅ No build step required
- ✅ Instant hot reload
- ✅ Direct debugging with source maps
- ✅ Changes reflect immediately

## Production Mode

### Building for Production

```bash
# Build all packages first
pnpm build

# Then build the app
NODE_ENV=production pnpm build
```

### What Happens

1. Each package compiles TypeScript to JavaScript
2. Type declarations are generated
3. Source maps are created
4. App build uses compiled artifacts
5. Tree-shaking and optimization applied

### Deployment

```bash
# For deployment
NODE_ENV=production pnpm start
```

## Testing Mode

### Running Tests

```bash
# Tests use source files directly
pnpm test

# Or explicitly
NODE_ENV=test pnpm test
```

### Benefits for Testing

- No build required before testing
- Tests run against actual source code
- Faster test iteration
- Better error messages with TypeScript

## Common Patterns

### Importing Specific Exports

```typescript
// Main export
import { myFunction } from '@studio/utils'

// Subpath export
import { testHelper } from '@studio/utils/testing'

// Type imports (always from .d.ts files)
import type { MyType } from '@studio/types'
```

### Workspace Dependencies

In your `package.json`:

```json
{
  "dependencies": {
    "@studio/logger": "workspace:*",
    "@studio/ui": "workspace:*"
  }
}
```

The `workspace:*` protocol ensures:

- Local packages are linked
- No npm registry lookup
- Changes are reflected immediately

### Cross-Package Development

When working on multiple packages:

```bash
# Terminal 1: Watch package builds (optional)
pnpm --filter @studio/logger dev

# Terminal 2: Run the app
pnpm --filter @studio/app dev
```

## Next.js Specific Configuration

### Transpile Packages in Development

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  transpilePackages:
    process.env.NODE_ENV === 'development'
      ? ['@studio/*'] // Transpile all in dev
      : [], // Use built packages in prod
}
```

### Optimize Package Imports

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['@studio/*'],
  },
}
```

## Vite Specific Configuration

For packages using Vite:

```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    // Exclude workspace packages from pre-bundling
    exclude: ['@studio/*'],
  },
  resolve: {
    // Preserve symlinks for workspace packages
    preserveSymlinks: true,
  },
})
```

## Troubleshooting

### Issue: Changes Not Reflecting

**Solution 1**: Clear Next.js cache

```bash
rm -rf .next
pnpm dev
```

**Solution 2**: Clear node_modules/.vite

```bash
rm -rf node_modules/.vite
pnpm dev
```

### Issue: TypeScript Errors in Development

**Solution**: Ensure tsconfig paths are set

```json
{
  "compilerOptions": {
    "paths": {
      "@studio/*": ["./packages/*/src"]
    }
  }
}
```

### Issue: Build Fails

**Solution**: Build dependencies first

```bash
# Build all packages
pnpm turbo build

# Then build app
pnpm --filter @studio/app build
```

### Issue: Import Not Found

**Solution**: Check package.json exports

```json
{
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

## Performance Tips

### Development

1. **Selective Watching**: Only watch packages you're actively developing
2. **Lazy Loading**: Use dynamic imports for large packages
3. **Cache Optimization**: Keep node_modules/.cache clean

### Production

1. **Parallel Builds**: Turborepo builds packages in parallel
2. **Incremental Builds**: Only changed packages rebuild
3. **CDN Ready**: Built artifacts can be served from CDN

## Environment Variables

### Setting NODE_ENV

```bash
# .env.development
NODE_ENV=development

# .env.production
NODE_ENV=production

# .env.test
NODE_ENV=test
```

### Package-Specific Environment

```bash
# Build specific package for production
NODE_ENV=production pnpm --filter @studio/logger build

# Test specific package
NODE_ENV=test pnpm --filter @studio/logger test
```

## Best Practices

### 1. Consistent Exports Structure

Always follow the same pattern for exports:

```json
{
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

### 2. Type-Only Imports

Use type imports for better tree-shaking:

```typescript
import type { Config } from '@studio/config'
import { loadConfig } from '@studio/config'
```

### 3. Avoid Circular Dependencies

Structure packages to avoid circular imports:

- Core packages (no dependencies)
- Service packages (depend on core)
- Feature packages (depend on service + core)
- App (depends on all)

### 4. Clean Builds

Regularly clean and rebuild:

```bash
# Clean all build artifacts
pnpm clean

# Fresh build
pnpm build
```

## Migration from Old Structure

If migrating from direct source imports:

1. No changes needed to import statements
2. Add conditional exports to package.json
3. Ensure TypeScript builds work
4. Test in both dev and production modes

## Summary

The dual consumption architecture provides:

- **Development**: Fast iteration with source files
- **Production**: Optimized builds with artifacts
- **Testing**: Direct source testing
- **External**: Standard npm package consumption

No changes to your import statements are needed - the system automatically serves the right files based on the environment.
