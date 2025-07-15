# 📦 Packages

Technical documentation for the `@studio/*` monorepo packages that power Mnemosyne.

## Core Packages

### [Logger Package](/packages/logger/architecture)

Comprehensive logging system supporting both Node.js and browser environments with structured output, performance optimization, and remote shipping capabilities.

## Package Architecture

All packages follow consistent patterns:

- **TypeScript** with strict configuration
- **Vitest** for unit testing
- **ESLint + Prettier** for code quality
- **Turborepo** for intelligent caching
- **Semantic versioning** for releases

## Development

Each package is independently buildable and testable:

```bash
# Build specific package
pnpm --filter @studio/logger build

# Test specific package
pnpm --filter @studio/logger test

# Build all packages
pnpm --filter "@studio/*" build
```

## Documentation Standards

Package documentation includes:

- **Architecture** - High-level design and patterns
- **API Reference** - Detailed function and class documentation
- **Integration Patterns** - Usage examples and best practices
- **Performance Considerations** - Optimization guidelines
