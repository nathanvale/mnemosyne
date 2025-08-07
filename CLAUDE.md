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
- `pnpm check` - Comprehensive quality check (format, lint, type-check, test) across all packages

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

### ES Modules Architecture

**This is a pure ES modules monorepo** - all packages use `"type": "module"` with modern import/export syntax.

#### ES Modules Configuration

- **Root package.json**: `"type": "module"` enforces ES modules throughout the monorepo
- **All packages**: Every package.json contains `"type": "module"`
- **TypeScript target**: ES2022 with ESNext modules for optimal tree-shaking
- **Module resolution**: `"moduleResolution": "bundler"` strategy for compatibility
- **Import syntax**: Only `import`/`export` statements - no `require()` or `module.exports`
- **File extensions**: `.mjs` for config files, `.ts`/`.tsx` for source code
- **Exports field**: All packages use modern `"exports"` field instead of legacy `"main"`

#### Benefits of ES Modules

- **Tree-shaking**: Better dead code elimination and smaller bundles
- **Static analysis**: Tools can analyze dependencies at build time
- **Future-proof**: Aligns with modern JavaScript standards
- **Performance**: Faster loading with native browser support
- **Tooling**: Better IDE support and type checking

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
- **Schema configuration**: Uses `env("DATABASE_URL")` for flexibility
- **Development setup**: Requires `.env` file with `DATABASE_URL="file:./prisma/dev.db"`
- Always run `pnpm --filter @studio/db build` after schema changes
- Database reset available via `pnpm db:reset`

### TypeScript Configuration

- **Centralized configs**: Configurations managed in `@studio/typescript-config` package
  - `base.json` - Common settings for all packages (ES2022, bundler resolution, strict mode)
  - `library.json` - Library packages with declaration generation and source maps
  - `nextjs.json` - Next.js applications with framework-specific settings
- **Transit node architecture**: Root tsconfig.json organizes packages by dependency levels for parallel type checking
  - Level 0: Configuration packages (no internal deps)
  - Level 1: Core schema (no internal deps)
  - Level 2-7: Packages organized by dependency hierarchy for optimal parallelization
- **Project references**: All packages migrated from shared config to centralized TypeScript configurations
- **Module resolution**: Uses `"bundler"` strategy for optimal compatibility
- **Path mapping**: `@studio/*` imports for all packages configured in root tsconfig.json
- **Strict mode**: Enabled across all packages with comprehensive type checking
- **Modern target**: ES2022 with ESNext modules for optimal tree-shaking
- **Mixed export strategy**: Packages export TypeScript source for internal use, compiled JS for external consumption

### ESLint Configuration

- **Centralized configs**: Managed in `@studio/eslint-config` package with three exports:
  - `base` - Core ESLint rules for all packages with TypeScript and Perfectionist plugins
  - `library` - Library-specific rules extending base configuration
  - `next` - Next.js applications with framework-specific rules and plugins
- **Framework-specific handling**:
  - Next.js apps use legacy `.eslintrc.cjs` with `next lint` for optimal compatibility
  - Library packages use flat config with centralized `@studio/eslint-config`
- **Import sorting**: Perfectionist plugin for consistent import organization
- **Zero warnings policy**: All packages enforce `--max-warnings 0` for strict quality
- **Plugin management**: Centralized plugin definitions prevent redefinition conflicts

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

## Turborepo Best Practices and Package Setup

### Overview

This section documents best practices, common gotchas, and standardized approaches for maintaining packages in our Turborepo monorepo, based on comprehensive audits and real-world learnings.

### Turborepo Best Practices

#### Centralized Configuration Packages

We use dedicated configuration packages to ensure consistency:

- **@studio/typescript-config** - TypeScript configurations (base, library, nextjs)
- **@studio/prettier-config** - Centralized Prettier settings
- **@studio/eslint-config** - ESLint configurations (base, library, next)

**Benefits**:

- Single source of truth for configuration
- Easy updates across all packages
- Proper dependency management
- Version control for configuration changes

#### Script Standardization

**Every package MUST have these 5 scripts**:

```json
{
  "scripts": {
    "build": "tsc",
    "lint": "eslint src --max-warnings 0",
    "type-check": "tsc --noEmit",
    "format:check": "prettier --check src",
    "test": "vitest"
  }
}
```

**For config packages, use appropriate no-ops**:

```json
{
  "scripts": {
    "build": "echo 'Config package - no build needed'",
    "lint": "echo 'Config package - no linting needed'",
    "type-check": "echo 'Config package - no TypeScript to check'",
    "format:check": "prettier --check *.js",
    "test": "echo 'Config package - no tests needed'"
  }
}
```

This ensures `pnpm check` works across all packages.

#### Proper Dependency Management

In `turbo.json`, ensure proper task dependencies:

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"]
    },
    "lint": {
      "dependsOn": ["^lint", "@studio/eslint-config#build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

### Common Gotchas and Solutions

#### 1. ESLint Flat Config vs Framework Compatibility

**Problem**: ESLint flat config conflicts with Next.js built-in ESLint
**Solution**: Use framework-specific approaches:

- **Next.js apps**: Use legacy `.eslintrc.cjs` with `next lint`
- **Packages**: Use centralized `@studio/eslint-config`

#### 2. Plugin Redefinition Errors

**Problem**: `Cannot redefine plugin @typescript-eslint`
**Cause**: Multiple ESLint configs trying to define the same plugin
**Solution**: Centralize plugin definitions in `@studio/eslint-config`

#### 3. Type-Only Import Issues

**Problem**: `'StorybookConfig' is defined but never used`
**Cause**: Shared ESLint config not handling type imports properly
**Solution**: Use framework-specific ESLint configs that understand type imports

#### 4. Module Resolution Conflicts

**Problem**: `Relative import paths need explicit file extensions`
**Cause**: Wrong module resolution strategy
**Solution**: Use `"moduleResolution": "bundler"` instead of `"NodeNext"`

#### 5. Missing Scripts Breaking Pipelines

**Problem**: `turbo format:check` fails because packages lack the script
**Solution**: Ensure ALL packages have the required 5 scripts (even if no-ops)

#### 6. ES Modules Import/Export Issues

**File Extensions in Imports**:

- **Problem**: TypeScript imports failing in compiled output
- **Solution**: Use `.js` extensions in import statements for compiled output

  ```typescript
  // ✅ Correct - .js extension for compiled output
  import { utils } from './utils.js'

  // ❌ Wrong - will fail at runtime
  import { utils } from './utils.ts'
  ```

**JSON Imports**:

- **Problem**: Cannot import JSON files with standard syntax
- **Solution**: Use import assertions

  ```typescript
  // ✅ ES Modules JSON import
  import data from './config.json' assert { type: 'json' }

  // ❌ Old CommonJS style
  const data = require('./config.json')
  ```

**Dynamic Imports**:

- **Problem**: Need conditional module loading
- **Solution**: Use `await import()` for dynamic imports

  ```typescript
  // ✅ ES Modules dynamic import
  const module = await import('./feature.js')

  // ❌ CommonJS style
  const module = require('./feature.js')
  ```

**Node.js Globals**:

- **Problem**: `__dirname` and `__filename` not available in ES modules
- **Solution**: Use `import.meta.url` with path utilities

  ```typescript
  // ✅ ES Modules approach
  import { fileURLToPath } from 'node:url'
  import { dirname } from 'node:path'

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)

  // ❌ CommonJS globals (not available)
  console.log(__dirname, __filename)
  ```

**Configuration Files**:

- **ESLint**: Use `.mjs` extension for config files (`eslint.config.mjs`)
- **Vitest**: Works with ES modules out of the box
- **Package.json scripts**: Work normally with ES modules

### New Package Setup Template

Use this template when creating new packages:

#### 1. Directory Structure

```
packages/your-package/
├── src/
│   ├── index.ts          # Main export
│   └── __tests__/        # Tests
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript config
└── vitest.config.ts      # Test config (if needed)
```

#### 2. package.json Template

```json
{
  "name": "@studio/your-package",
  "version": "0.1.0",
  "private": true,
  "type": "module", // ← CRITICAL: Required for ES modules
  "exports": {
    // ← Use exports field, not main
    ".": "./src/index.ts"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "lint": "eslint src --max-warnings 0",
    "format:check": "prettier --check src",
    "clean": "rm -rf dist *.tsbuildinfo"
  },
  "dependencies": {
    "zod": "^3.25.74"
  },
  "devDependencies": {
    "@studio/eslint-config": "workspace:*",
    "@studio/typescript-config": "workspace:*",
    "typescript": "^5.8.3",
    "vitest": "^3.2.4"
  }
}
```

#### 3. tsconfig.json Template

```json
{
  "extends": "@studio/typescript-config/library.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules", "**/*.test.ts"]
}
```

#### 4. ESLint Configuration

Create `eslint.config.mjs`:

```javascript
import { library } from '@studio/eslint-config'

export default [...library]
```

### Configuration Package Management

#### When to Update Configurations

**Base TypeScript Config**: Update when changing compiler options that affect all packages
**ESLint Rules**: Update when adding/removing rules that should apply universally  
**Prettier Settings**: Update when changing formatting standards

#### How to Update

1. **Make changes** in the config package (e.g., `@studio/typescript-config`)
2. **Build the config package**: `pnpm --filter @studio/typescript-config build`
3. **Test changes**: `pnpm check` to ensure all packages still work
4. **Commit changes** with clear description of what changed and why

#### Dependency Relationships

```
@studio/eslint-config (no deps)
├── @studio/typescript-config (no deps)
├── @studio/prettier-config (no deps)
└── All other packages depend on these
```

### Script Standardization Requirements

#### The 5 Required Scripts

1. **build** - Compile/prepare package for consumption
2. **lint** - ESLint checking with zero warnings
3. **type-check** - TypeScript validation without emitting
4. **format:check** - Prettier formatting verification
5. **test** - Unit tests (Vitest)

#### Quality Assurance Command

Run this regularly to ensure everything works:

```bash
pnpm check  # Runs: turbo format:check lint type-check && turbo test --run
```

This command:

- ✅ Validates formatting across all packages
- ✅ Runs linting with zero warnings allowed
- ✅ Performs TypeScript checking
- ✅ Executes all tests
- ✅ Utilizes Turbo's intelligent caching
- ✅ Runs tasks in proper dependency order

### Troubleshooting Guide

#### Pipeline Failures

**"Task not found"**: Package missing required script - add it to package.json
**"Build failed"**: Check dependency order in turbo.json
**"No cache hit"**: Inputs changed or cache invalidated - this is normal

#### Cache Issues

**Stale cache**: `pnpm turbo clean` to clear cache
**Cache misses**: Check if file patterns in turbo.json match your changes
**Slow builds**: Ensure proper task dependencies to maximize parallelization

#### Package Dependency Problems

**Import errors**: Ensure workspace dependencies use `workspace:*`
**Type errors**: Check if packages are built in correct order
**Missing types**: Run `pnpm --filter package-name build` manually

#### Common Error Patterns

**"Cannot find module"**:

- Check if dependency package is built
- Verify export paths in package.json
- Ensure proper import paths

**"Duplicate plugin"**:

- Check for conflicting ESLint configurations
- Use centralized config packages
- Avoid redefining plugins

**"File not under rootDir"**:

- Don't import test utilities across packages
- Keep test helpers within package boundaries
- Use proper package imports instead of relative paths

**"Cannot use import statement outside a module"**:

- Ensure package.json has `"type": "module"`
- Check file extensions are correct (`.mjs` for config files)
- Verify TypeScript compilation target supports ES modules

**"\_\_dirname is not defined"**:

- Replace with `import.meta.url` and path utilities
- Use `fileURLToPath(import.meta.url)` pattern for file paths
- Cannot use CommonJS globals in ES modules

**"require() of ES modules is not supported"**:

- All packages use `"type": "module"` - cannot mix CommonJS
- Convert `require()` calls to `import` statements
- Use dynamic imports for conditional loading: `await import()`

**"SyntaxError: Named export not found"**:

- Check export names match import names exactly
- Verify package is built and exports are available
- Use `import * as name` for namespace imports if needed

## Development Patterns

### Import Patterns

Use the modern ES modules import patterns throughout this monorepo:

```typescript
// ✅ ES Modules (used throughout this repo)
import { PrismaClient } from '@studio/db'
import { logger, createLogger } from '@studio/logger'
import { Button, LoggerDemo } from '@studio/ui'
import { importMessages } from '@studio/scripts'
import { server } from '@studio/mocks/server'

// ✅ Default imports
import defaultExport from '@studio/schema'

// ✅ Type-only imports (for TypeScript)
import type { User, Message } from '@studio/db'

// ✅ Dynamic imports (when needed)
const dynamicModule = await import('@studio/feature')

// ❌ CommonJS (DO NOT USE - will fail at runtime)
const { PrismaClient } = require('@studio/db')
const logger = require('@studio/logger')
```

**ES Modules Best Practices:**

- Always use `import`/`export` syntax
- Use `type` modifier for TypeScript type imports
- Prefer named imports over default imports for better tree-shaking
- Use dynamic imports (`await import()`) for code splitting
- Never mix ES modules with CommonJS `require()`

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
- **Package test config**: Packages may need their own `vitest.config.ts` for specific requirements
- **Test isolation**: Each test gets its own database instance using worker IDs

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

### Package-Specific Test Database Setup

When packages have their own database tests (like `@studio/db`), they need special setup:

#### 1. Test Database Setup Class

Packages should create their own `TestDatabaseSetup` class that:

- Creates isolated databases using worker IDs (Vitest/Wallaby)
- Uses `prisma db push` for schema creation (faster than migrations)
- Applies database triggers manually since `db push` doesn't run migrations
- Handles proper cleanup of test databases

Example structure:

```typescript
// packages/db/src/__tests__/test-database-setup.ts
export class TestDatabaseSetup {
  static async createTestDatabase(): Promise<PrismaClient> {
    // 1. Get worker ID for isolation
    // 2. Create unique database path
    // 3. Run prisma db push with DATABASE_URL
    // 4. Create Prisma client
    // 5. Apply database triggers
    // 6. Return configured client
  }
}
```

#### 2. Environment Variable Handling

- Test setup must properly set and restore `DATABASE_URL`
- Use `execSync` with explicit environment variables
- Restore original DATABASE_URL after schema creation

#### 3. Database Triggers in Tests

When migrations include database triggers:

- Create a method to apply triggers after `db push`
- Use `prisma.$executeRaw` to create triggers
- Include all trigger logic from migrations

#### 4. Common Issues and Solutions

**"Table does not exist" errors**:

- Ensure `db push` completes before creating Prisma client
- Check that schema path is correct relative to package
- Verify DATABASE_URL is properly set during `db push`

**TypeScript import errors**:

- Avoid importing test utilities from other packages
- Create self-contained test setup within each package
- Respect TypeScript `rootDir` boundaries

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

#### Issue 4: Performance tests failing in Wallaby/CI

**Cause**: Performance benchmarks exceed thresholds in resource-constrained environments
**Solution**: Skip intensive tests in Wallaby and CI environments:

```typescript
describe('Performance Benchmarks', () => {
  // Skip performance benchmarks in Wallaby.js and CI - they can cause timeouts
  if (process.env.WALLABY_WORKER || process.env.CI) {
    it.skip('skipped in Wallaby.js and CI environments', () => {})
    return
  }
  // ... rest of the tests
})
```

#### Issue 5: Incomplete schema refresh in Wallaby

**Cause**: Wallaby.js in-memory databases retain partial schema state between test runs
**Problem**: Only dropping Memory table leaves other tables with stale schema
**Solution**: Implement comprehensive schema refresh that drops ALL tables:

```typescript
private static async dropAllTablesForWallaby(prisma: PrismaClient): Promise<void> {
  try {
    // Drop tables in reverse dependency order to avoid foreign key constraint violations
    // Analysis and quality tables (depend on Memory)
    await prisma.$executeRaw`DROP TABLE IF EXISTS "AnalysisMetadata"`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "ValidationStatus"`
    // ... drop all tables in dependency order
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Memory"`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Message"`
  } catch (error) {
    console.warn('Warning: Error dropping tables for Wallaby schema refresh:', error)
  }
}
```

**Key Points**:

- Must drop ALL tables, not just Memory table
- Drop in reverse dependency order (child tables before parent tables)
- Handle errors gracefully to allow table recreation to proceed

#### Issue 6: Duplicate column name errors after schema refresh

**Cause**: ALTER TABLE statements try to add columns that already exist in CREATE TABLE
**Error**: `duplicate column name: clusteringMetadata`
**Solution**: Remove redundant ALTER TABLE statements when using comprehensive table drops:

```typescript
// ❌ WRONG: This causes errors after dropAllTablesForWallaby
await prisma.$executeRaw`CREATE TABLE "Memory" (..., "clusteringMetadata" TEXT, ...)`
await prisma.$executeRaw`ALTER TABLE "Memory" ADD COLUMN "clusteringMetadata" TEXT` // Duplicate!

// ✅ CORRECT: Include all columns in CREATE TABLE, no ALTER needed
await prisma.$executeRaw`CREATE TABLE "Memory" (..., "clusteringMetadata" TEXT, ...)`
```

**Root Cause**: Comprehensive schema refresh means tables are created fresh, making column additions redundant.

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

4. **Environment-aware testing**:
   - Skip intensive tests in Wallaby/CI: `if (process.env.WALLABY_WORKER || process.env.CI)`
   - Use comprehensive schema refresh for Wallaby in-memory databases
   - Maintain index consistency across test and production environments
   - Performance tests should run locally but skip in constrained environments

### Debugging Checklist

When tests fail with database errors:

1. Check if new fields were added to Prisma schema
2. Verify test database creation includes all fields
3. Ensure operation wrappers set proper defaults
4. Check if tests are using validation wrappers
5. Look for unique constraint violations
6. Consider Wallaby-specific environment differences
7. **NEW**: Check for duplicate column name errors after schema changes
8. **NEW**: Verify comprehensive table dropping in Wallaby environments
9. **NEW**: Remove redundant ALTER TABLE statements when using complete schema refresh

### Common Debugging Patterns

#### Database Migration Issues

**Problem**: Database triggers or complex migrations not applied in tests
**Solution**:

- For package tests, manually apply triggers after `db push`
- For cross-package tests, ensure migrations are run properly
- Check that trigger SQL is compatible with SQLite syntax

#### Schema Refresh Issues

**Problem**: Incomplete schema refresh in Wallaby causing table inconsistencies
**Solution**:

- Implement comprehensive table dropping in correct dependency order
- Drop ALL tables, not just primary tables
- Handle foreign key constraints by dropping child tables first

**Pattern**:

```typescript
// Drop in reverse dependency order
await prisma.$executeRaw`DROP TABLE IF EXISTS "ChildTable"`
await prisma.$executeRaw`DROP TABLE IF EXISTS "ParentTable"`
```

#### Duplicate Column Errors

**Problem**: `duplicate column name: columnName` after schema changes
**Root Cause**: ALTER TABLE statements conflicting with CREATE TABLE statements
**Solution**:

- When using comprehensive table drops, columns should only be defined in CREATE TABLE
- Remove redundant ALTER TABLE ADD COLUMN statements
- Ensure CREATE TABLE includes all current schema columns

#### Index Consistency Issues

**Problem**: Test environments have different indexes than production
**Solution**:

- Remove redundant indexes identified in production schema
- Update test database creation to match production index structure
- Example: Remove redundant `contentHash` index when unique constraint exists

#### Build and TypeScript Errors

**Problem**: "File is not under 'rootDir'" or "not listed within the file list"
**Solution**:

- Don't import test utilities across package boundaries
- Create self-contained test utilities within each package
- Use proper package imports (`@studio/db`) instead of relative paths

#### Test Isolation Failures

**Problem**: Tests pass individually but fail when run together
**Solution**:

- Ensure unique content hashes: `\`test-\${Date.now()}-\${Math.random()}\``
- Clean up test data properly between tests
- Use worker-specific database instances

#### Generated Files in Git

**Problem**: TypeScript generates .d.ts, .js files that shouldn't be committed
**Solution**:

- Add `*.d.ts`, `*.d.ts.map` to .gitignore in test directories
- Never commit generated files from test directories
- Run `git clean -fd` to remove untracked generated files

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
