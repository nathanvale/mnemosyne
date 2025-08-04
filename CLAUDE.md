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

### Documentation

- `pnpm --filter @studio/docs dev` - Start Docusaurus documentation site (port 3001)
- `pnpm --filter @studio/docs build` - Build documentation site for production
- `pnpm --filter @studio/docs deploy` - Deploy to GitHub Pages

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
│   ├── studio/                    # Next.js 15 application
│   └── docs/                      # Docusaurus documentation site
├── packages/
│   ├── db/                        # Prisma database client and schema
│   ├── logger/                    # Dual logging system (Node.js + browser)
│   ├── ui/                        # React components with Storybook
│   ├── scripts/                   # CLI utilities and data processing
│   ├── mocks/                     # MSW API mocking
│   ├── test-config/               # Shared testing configuration
│   └── shared/                    # Shared TypeScript configurations
├── docs/                          # Source documentation (markdown files)
│   ├── architecture/              # System design documentation
│   ├── features/                  # Feature documentation (Basecamp-style)
│   ├── guides/                    # Development guides and methodology
│   └── packages/                  # Package-specific documentation
├── turbo.json                     # Turborepo pipeline configuration
└── pnpm-workspace.yaml            # Workspace definitions
```

### Package Architecture

- **@studio/docs** - Docusaurus documentation site with enhanced Turborepo integration
- **@studio/db** - Database package with Prisma client and schema
- **@studio/logger** - Comprehensive logging system for Node.js and browser
- **@studio/ui** - React component library with Storybook stories
- **@studio/scripts** - CLI utilities for data processing and imports
- **@studio/mocks** - MSW handlers for API mocking in development/tests
- **@studio/test-config** - Shared Vitest configuration and test utilities
- **@studio/shared** - Shared TypeScript configurations for all packages

### Key Directories

- `apps/studio/` - Next.js application with App Router
- `apps/docs/` - Docusaurus documentation site
- `docs/` - Source documentation files (markdown)
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

### Documentation Architecture

- **Source content**: Markdown files in `docs/` directory (architecture, features, guides, packages)
- **Docusaurus site**: Built in `apps/docs/` with enhanced Turborepo integration
- **Live site**: https://nathanvale.github.io/mnemosyne/ (auto-deploys from main branch)
- **Local development**: `pnpm --filter @studio/docs dev` (runs on port 3001)
- **Mermaid support**: Architecture diagrams with visual data flow representations
- **Enhanced caching**: Sub-5-second incremental builds with 90%+ cache hit rates

### CI/CD

- GitHub Actions with parallel jobs for lint, type-check, test, and build
- Documentation auto-deployment to GitHub Pages on main branch changes
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

## Test Database Architecture and Debugging Guide

### Overview

The mnemosyne project uses a sophisticated test database architecture to ensure test isolation and proper schema management across different testing environments. This guide documents the key components and common debugging scenarios.

### Key Components

#### 1. Worker Database Factory (`packages/memory/src/persistence/__tests__/worker-database-factory.ts`)

- Creates isolated SQLite databases for each test worker
- Uses in-memory databases for Wallaby.js (`sqlite://:memory:?cache=shared`)
- Uses file-based databases for regular test runners
- Implements schema versioning to force recreation when schema changes
- Includes clustering fields support for Memory table

#### 2. Test Database Creation (`packages/test-config/src/database-testing.ts`)

- Provides `createTestDatabase()` function used by all tests
- Creates temporary SQLite databases in system temp directory
- Applies full schema including all tables, indexes, and clustering fields
- Handles proper cleanup after tests complete

#### 3. Memory Operations (`packages/db/src/memory-operations.ts`)

- Provides database operations with validation
- **Critical**: Must initialize clustering fields when creating memories:
  - `clusteringMetadata: null`
  - `lastClusteredAt: null`
  - `clusterParticipationCount: 0`

### Common Issues and Solutions

#### Issue 1: "The column `clusterParticipationCount` does not exist"

**Cause**: Test database schema is out of sync with Prisma schema
**Solutions**:

1. Update `worker-database-factory.ts` Memory table creation to include clustering fields
2. Update `database-testing.ts` schema statements to match current migrations
3. Add schema version tracking to force recreation:
   ```typescript
   private static readonly SCHEMA_VERSION = '2024-08-04-clustering'
   ```

#### Issue 2: Validation constraints not enforced

**Cause**: Tests using raw Prisma client instead of operations wrappers
**Solution**: Use operation wrappers that include validation:

- Use `clusteringOps.createCluster()` instead of `prisma.memoryCluster.create()`
- Use `clusteringOps.addMemoryToCluster()` instead of `prisma.clusterMembership.create()`

#### Issue 3: Memory deduplication tests returning 0 counts

**Cause**: Memory creation not setting required clustering field defaults
**Solution**: Update `createMemory()` in `memory-operations.ts` to include clustering fields

#### Issue 4: Performance tests failing in Wallaby

**Cause**: Wallaby.js environment has higher performance variance
**Solution**: Add environment-specific thresholds:

```typescript
const threshold = process.env.WALLABY_WORKER === 'true' ? 150 : 50
```

### Testing Best Practices

1. **Always use test utilities**:
   - Use `createTestDatabase()` from `@studio/test-config`
   - Use operation wrappers from `@studio/db` for validation

2. **Schema synchronization**:
   - When adding new Prisma migrations, update:
     - `worker-database-factory.ts` table creation statements
     - `database-testing.ts` schema statements
   - Include all new fields with proper defaults

3. **Test isolation**:
   - Each test gets its own database instance
   - Databases are cleaned up after tests
   - Use unique content hashes to avoid constraint violations:
     ```typescript
     contentHash: `test-hash-${Date.now()}-${Math.random()}`
     ```

4. **Wallaby.js considerations**:
   - Uses in-memory databases for speed
   - May have different performance characteristics
   - Use `process.env.WALLABY_WORKER` to detect Wallaby environment
   - Make performance thresholds more lenient for Wallaby

### Debugging Checklist

When tests fail with database errors:

1. Check if new fields were added to Prisma schema
2. Verify test database creation includes all fields
3. Ensure operation wrappers set proper defaults
4. Check if tests are using validation wrappers
5. Look for unique constraint violations
6. Consider Wallaby-specific environment differences

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
