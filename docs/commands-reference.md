# Commands Reference

> **Prompt Cache Directive**: This content is cacheable for command workflows
> Cache Control: `{"type": "ephemeral"}`

Complete command reference for the Mnemosyne monorepo. Referenced from main CLAUDE.md.

## Development Commands

### Core Development

- `pnpm dev` - Start development server (Next.js app)
- `pnpm build` - Build all packages and applications via Turbo
- `pnpm type-check` - TypeScript type checking across all packages
- `pnpm lint` - ESLint with import sorting across all packages
- `pnpm format` - Prettier formatting across all packages
- `pnpm check` - Comprehensive quality check (format, lint, type-check, test) across all packages

## Testing Commands

### 🔴 CRITICAL: ALWAYS USE WALLABY.JS FIRST - NO EXCEPTIONS 🔴

**Quick Testing Rules:**

1. **ALWAYS try Wallaby first** - Use `mcp__wallaby__wallaby_failingTests`
2. **5-second rule** - If no response, Wallaby is OFF
3. **Alert user immediately** - "Wallaby.js is not running. Please start it in VS Code"
4. **NEVER skip to Vitest** - Always give user chance to start Wallaby first

**For comprehensive testing guidance**: @docs/testing-guide.md

### Fallback Commands (Vitest)

- `pnpm test` - Run Vitest unit tests (fallback only)
- `pnpm test:ci` - Run tests in CI mode (fallback only)
- `pnpm test:storybook` - Run Storybook component tests

### Wallaby.js Management

- `pnpm wallaby:start` - Start Wallaby.js server (detached process)
- `pnpm wallaby:stop` - Stop running Wallaby.js server
- `pnpm wallaby:status` - Check Wallaby.js server status
- `pnpm wallaby:status --logs` - View recent logs (last 50 lines)
- `pnpm wallaby:status --clear-logs` - Clear Wallaby logs

## Package-Specific Commands

### Individual Package Operations

- `pnpm --filter @studio/logger test` - Run tests for specific package
- `pnpm --filter @studio/ui build` - Build specific package
- `pnpm --filter "@studio/*" build` - Build all @studio packages
- `pnpm --filter @studio/db build` - Build database package (required after schema changes)

### Examples by Package

**Database (@studio/db):**

- `pnpm --filter @studio/db build` - Generate Prisma client
- `pnpm --filter @studio/db test` - Run database tests

**UI Components (@studio/ui):**

- `pnpm --filter @studio/ui build` - Build component library
- `pnpm --filter @studio/ui storybook` - Start Storybook for this package
- `pnpm --filter @studio/ui test` - Run component tests

**Scripts (@studio/scripts):**

- `pnpm --filter @studio/scripts build` - Build CLI utilities
- `pnpm --filter @studio/scripts test` - Run script tests

## Data Management Commands

### Database Operations

- `pnpm db:reset` - Reset Prisma database via @studio/db package
- `pnpm import:messages` - Import messages from CSV files via @studio/scripts

### Prisma Operations

- `pnpm --filter @studio/db build` - Regenerate Prisma client after schema changes
- `pnpm --filter @studio/db migrate` - Run database migrations
- `pnpm --filter @studio/db studio` - Open Prisma Studio (if configured)

## Documentation Commands

### Docusaurus Site

- `pnpm --filter @studio/docs dev` - Start Docusaurus documentation site (port 3001)
- `pnpm --filter @studio/docs build` - Build documentation site for production
- `pnpm --filter @studio/docs deploy` - Deploy to GitHub Pages

### Documentation Development

- `pnpm --filter @studio/docs start` - Alternative to dev command
- `pnpm --filter @studio/docs serve` - Serve built documentation locally
- `pnpm --filter @studio/docs clear` - Clear Docusaurus cache

## Storybook Commands

### Development

- `pnpm storybook` - Start Storybook development server
- `pnpm build-storybook` - Build Storybook for production

### Package-Specific Storybook

- `pnpm --filter @studio/ui storybook` - Start Storybook for UI package
- `pnpm --filter @studio/ui build-storybook` - Build Storybook for UI package

## Turborepo Commands

### Build Operations

- `pnpm turbo build` - Build all packages using Turbo
- `pnpm turbo build --filter="@studio/app..."` - Build app and dependencies
- `pnpm turbo test --filter="@studio/*"` - Run tests on all studio packages

### Cache Management

- `pnpm clean` - Clean all build artifacts via Turbo
- `pnpm turbo clean` - Clear Turborepo cache
- `pnpm turbo build --force` - Force rebuild ignoring cache

### Development Workflows

- `pnpm turbo dev` - Start development servers for all applications
- `pnpm turbo type-check` - Type check all packages
- `pnpm turbo lint` - Lint all packages
- `pnpm turbo format:check` - Check formatting across all packages

## Quality Assurance Commands

### Comprehensive Checks

- `pnpm check` - Run format:check, lint, type-check, and test across all packages
- `pnpm turbo check` - Alternative comprehensive quality check

### Individual Quality Checks

- `pnpm turbo format:check` - Check Prettier formatting
- `pnpm turbo lint` - Run ESLint across all packages
- `pnpm turbo type-check` - TypeScript validation
- `pnpm turbo test --run` - Run all tests once (CI mode)

## Filtering Patterns

### Filter Examples

- `--filter "@studio/*"` - All packages in studio scope
- `--filter "@studio/app..."` - App and all its dependencies
- `--filter "...@studio/db"` - Database package and all packages that depend on it
- `--filter "{@studio/ui,@studio/logger}"` - Multiple specific packages

### Advanced Filtering

- `--filter "!@studio/docs"` - Exclude documentation package
- `--filter "@studio/* --filter !@studio/test-*"` - Studio packages except test utilities
- `--filter "[main]"` - Only packages changed since main branch

## Package Management Commands

### Installation

- `pnpm install` - Install all dependencies
- `pnpm add <package>` - Add dependency to root
- `pnpm --filter @studio/ui add <package>` - Add dependency to specific package

### Development Dependencies

- `pnpm add -D <package>` - Add dev dependency to root
- `pnpm --filter @studio/ui add -D <package>` - Add dev dependency to specific package

### Workspace Management

- `pnpm list --depth=0` - List all workspace packages
- `pnpm why <package>` - Show why a package is installed
- `pnpm outdated` - Check for outdated packages across workspace

## CI/CD Commands

### GitHub Actions

These commands run in CI but can be used locally:

- `pnpm turbo format:check lint type-check` - Quality checks pipeline
- `pnpm turbo test --run` - Test pipeline
- `pnpm turbo build` - Build pipeline

### Pre-commit Hooks

Managed by Husky, but can run manually:

- `pnpm lint-staged` - Run linting on staged files
- `pnpm format` - Format all files
- `pnpm type-check` - Type check before commit

## Troubleshooting Commands

### Cache Issues

- `pnpm turbo clean` - Clear Turborepo cache
- `rm -rf node_modules && pnpm install` - Clean install
- `pnpm --filter <package> clean` - Clean specific package

### Build Issues

- `pnpm --filter <package> build --force` - Force rebuild specific package
- `pnpm turbo build --force` - Force rebuild all packages
- `pnpm type-check` - Check for type errors

### Testing Issues

- `pnpm wallaby:status` - Check Wallaby.js status
- `pnpm test -- --run --reporter=verbose <test-file>` - Run specific test with verbose output
- `pnpm --filter <package> test --run` - Run tests for specific package
