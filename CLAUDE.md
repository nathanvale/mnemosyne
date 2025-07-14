# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mnemosyne is a Next.js 15 Turborepo monorepo built with TypeScript that provides message management and logging capabilities. It imports, stores, and analyzes messages with a comprehensive dual logging system spanning Node.js and browser environments.

## Commands

### Development

- `pnpm dev` - Start development server (Next.js app)
- `pnpm build` - Build all packages and applications via Turbo
- `pnpm type-check` - TypeScript type checking across all packages
- `pnpm lint` - ESLint with import sorting across all packages
- `pnpm format` - Prettier formatting across all packages

### Testing

- `pnpm test` - Run Vitest unit tests across all packages
- `pnpm test:ci` - Run tests in CI mode (no watch)
- `pnpm test:storybook` - Run Storybook component tests
- Use Wallaby.js for live test feedback and debugging

### Package-Specific Commands

- `pnpm --filter @studio/logger test` - Run tests for specific package
- `pnpm --filter @studio/ui build` - Build specific package
- `pnpm --filter "@studio/*" build` - Build all @studio packages

### Single Test Running

- `pnpm test -- --run --reporter=verbose <test-file>` - Run specific test file
- Use Wallaby.js tools for individual test execution and runtime values

### Data Management

- `pnpm db:reset` - Reset Prisma database via @studio/db package
- `pnpm import:messages` - Import messages from CSV files via @studio/scripts

### Storybook

- `pnpm storybook` - Start Storybook development server
- `pnpm build-storybook` - Build Storybook for production

### Turborepo Features

- `pnpm turbo build --filter="@studio/app..."` - Build app and dependencies
- `pnpm turbo test --filter="@studio/*"` - Run tests on all studio packages
- `pnpm clean` - Clean all build artifacts via Turbo

## Architecture

### Core Technologies

- **Turborepo** - Monorepo build system with intelligent caching
- **Next.js 15** with App Router and React 19
- **Prisma ORM** with SQLite database (in @studio/db package)
- **TypeScript** with strict configuration and project references
- **Tailwind CSS** for styling
- **pnpm** as package manager with workspaces

### Monorepo Structure

```
mnemosyne/
├── apps/
│   └── studio/                    # Next.js 15 application
├── packages/
│   ├── db/                        # Prisma database client and schema
│   ├── logger/                    # Dual logging system (Node.js + browser)
│   ├── ui/                        # React components with Storybook
│   ├── scripts/                   # CLI utilities and data processing
│   ├── mocks/                     # MSW API mocking
│   ├── test-config/               # Shared testing configuration
│   └── shared/                    # Shared TypeScript configurations
├── turbo.json                     # Turborepo pipeline configuration
└── pnpm-workspace.yaml            # Workspace definitions
```

### Package Architecture

- **@studio/db** - Database package with Prisma client and schema
- **@studio/logger** - Comprehensive logging system for Node.js and browser
- **@studio/ui** - React component library with Storybook stories
- **@studio/scripts** - CLI utilities for data processing and imports
- **@studio/mocks** - MSW handlers for API mocking in development/tests
- **@studio/test-config** - Shared Vitest configuration and test utilities
- **@studio/shared** - Shared TypeScript configurations for all packages

### Key Directories

- `apps/studio/` - Next.js application with App Router
- `packages/db/prisma/` - Database schema and migrations
- `packages/db/generated/` - Generated Prisma client
- `packages/logger/src/lib/` - Dual logging system implementation
- `packages/ui/src/` - React components
- `packages/ui/src/__stories__/` - Storybook stories
- `packages/scripts/src/` - CLI utilities and data processing scripts
- `tests/` - Root-level test configuration and setup files

### Database Schema

- **Messages** table with content hash for deduplication
- **Links** and **Assets** tables with foreign key relationships
- Uses SHA-256 content hashing to prevent duplicate message imports
- Located in `packages/db/` with custom output to `packages/db/generated/`

### Logging Architecture

- **Dual logger system**: Node.js structured logging (Pino) and browser logging
- **Server-side**: Structured logging with callsite tracking and colored development output
- **Client-side**: Production-ready browser logger with batching, retry logic, and third-party integrations
- **Development**: Clickable traces and comprehensive debugging information
- **Production**: Sensitive data redaction and remote log shipping capabilities
- **Package location**: `packages/logger/` with browser compatibility

### Testing Setup

- **Vitest** with jsdom environment for unit tests
- **React Testing Library** for component testing
- **Playwright** for browser testing in Storybook
- **MSW** for API mocking in development and tests (via @studio/mocks)
- **Wallaby.js** for live test feedback and debugging
- **Distributed testing**: Each package has its own test suite

### Message Processing

- CSV message import with comprehensive error handling
- Content-based deduplication using SHA-256 hashing
- URL extraction from message text with link relationship management
- Batch processing with progress tracking and error reporting
- Located in `packages/scripts/` with CLI interface

## Configuration Notes

### Turborepo Configuration

- **Intelligent caching**: Build outputs cached based on inputs
- **Dependency-aware**: Tasks run in correct order based on package dependencies
- **Parallel execution**: Independent tasks run concurrently
- **Cache performance**: Achieves 100% cache hits on unchanged code

### Prisma Client

- **Package location**: `packages/db/`
- **Output location**: `packages/db/generated/`
- **Import path**: `@studio/db`
- Always run `pnpm --filter @studio/db build` after schema changes
- Database reset available via `pnpm db:reset`

### TypeScript Configuration

- **Project references**: Optimized builds with package dependencies
- **Shared configs**: Base configurations in `packages/shared/`
- **Path mapping**: `@studio/*` imports for all packages
- **Strict mode** enabled across all packages
- **ES2017 target** with modern module resolution

### ESLint Configuration

- Next.js + Storybook configurations
- Perfectionist plugin for import sorting
- Custom rules for component organization
- Consistent across all packages

### CI/CD

- GitHub Actions with parallel jobs for lint, type-check, test, and build
- Turbo-powered builds with intelligent caching
- Prisma client generation handled by @studio/db package
- Pre-commit hooks with Husky for staged file linting and formatting

## Development Patterns

### Import Patterns

Use the new monorepo import patterns:

```typescript
// Database operations
import { PrismaClient } from '@studio/db'

// Logging
import { logger, createLogger } from '@studio/logger'

// Components
import { Button, LoggerDemo } from '@studio/ui'

// Scripts and utilities
import { importMessages } from '@studio/scripts'

// Mocking for tests
import { server } from '@studio/mocks/server'
```

### Component Development

- Storybook-driven development with comprehensive stories
- MSW for API mocking during development (via @studio/mocks)
- Accessibility testing with Storybook a11y addon
- Components located in `packages/ui/`

### Package Dependencies

- Packages can depend on each other using `workspace:*` references
- Turbo automatically builds dependencies in correct order
- Hot reload works across package boundaries in development

### Data Processing

- Use content hashing for deduplication logic
- Implement batch processing with error handling
- URL extraction patterns for message analysis
- All utilities in `packages/scripts/`

### Error Handling

- Comprehensive error reporting in data processing scripts
- Structured logging for debugging and monitoring via @studio/logger
- Graceful handling of duplicate content during imports

### Testing Strategy

- **Unit tests**: Each package has its own test suite
- **Component tests**: UI package with Storybook + Playwright
- **Integration tests**: Cross-package functionality
- **Mocking**: Centralized in @studio/mocks package

## Performance Optimizations

### Turborepo Caching

- **Build artifacts** cached based on source file changes
- **Test results** cached when no code changes
- **Type checking** skipped when no TypeScript changes
- **Incremental builds**: Only changed packages rebuild

### Development Workflow

- Hot reload across package boundaries
- Intelligent task scheduling via Turbo
- Parallel builds and tests
- Optimized development server startup

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
