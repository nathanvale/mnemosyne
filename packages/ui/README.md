# @studio/ui

React component library with Storybook for the Mnemosyne monorepo.

## Features

- 🎨 **React Components**: Reusable UI components
- 📖 **Storybook Integration**: Interactive component development
- 🧪 **Comprehensive Testing**: Unit and visual tests
- 🎯 **TypeScript Support**: Full type safety
- ⚡ **Hot Reload**: Instant updates in development

## Installation

```bash
# Within the monorepo
pnpm add @studio/ui
```

## Usage

```typescript
import { Button, Counter, MemoryForm } from '@studio/ui'

function App() {
  return (
    <>
      <Button onClick={() => console.log('clicked')}>
        Click me
      </Button>
      <Counter initialValue={0} />
      <MemoryForm onSubmit={handleSubmit} />
    </>
  )
}
```

## Dual Consumption Support

This package supports **dual consumption** - use TypeScript source in development for instant hot reload, or compiled JavaScript in production.

### How It Works

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

### Benefits

- **Development**: Instant hot reload for React components
- **Production**: Optimized, tree-shaken bundles
- **External Use**: Full npm package compatibility

## Components

### Button

Basic button component with onClick handler.

### Counter

Interactive counter with increment/decrement.

### FetchUserButton

Async data fetching component with MSW mocking.

### LoggerDemo

Demonstrates integration with @studio/logger.

### MemoryForm

Form component for memory creation with validation.

## Development

### Storybook

```bash
# Start Storybook development server
pnpm --filter @studio/ui storybook

# Build Storybook for production
pnpm --filter @studio/ui build-storybook
```

### Testing

```bash
# Run component tests
pnpm --filter @studio/ui test

# Run Storybook tests
pnpm test:storybook
```

## Migration Notes

### Dual Consumption Migration

This package was migrated to dual consumption architecture on 2025-08-15. Changes:

- Direct source imports in development (no build needed)
- React component hot reload works seamlessly
- Full backward compatibility maintained

### From Legacy Components

```typescript
// Old (app-specific components)
import Button from '@/components/Button'

// New (shared UI library)
import { Button } from '@studio/ui'
```

## TypeScript

Full TypeScript support with exported types:

```typescript
import type { ButtonProps, CounterProps } from '@studio/ui'
```

## Contributing

This package is part of the Mnemosyne monorepo. See the main [README](../../README.md) for development setup.

### Adding New Components

1. Create component in `src/`
2. Export from `src/index.ts`
3. Add Storybook story in `src/__stories__/`
4. Add tests in `src/__tests__/`
5. Run `pnpm test` to verify
