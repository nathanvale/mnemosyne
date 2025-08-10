# CLAUDE.md

> **Prompt Cache Directive**: Core project context - cacheable for all development workflows
> Cache Control: `{"type": "ephemeral"}`

This file provides essential guidance to Claude Code (claude.ai/code) when working with this repository. For detailed workflows, see the specialized instruction modules.

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

**🔴 CRITICAL: ALWAYS USE WALLABY.JS FIRST - NO EXCEPTIONS 🔴**

**Quick Testing Rules:**

1. **ALWAYS try Wallaby first** - Use `mcp__wallaby__wallaby_failingTests`
2. **5-second rule** - If no response, Wallaby is OFF
3. **Alert user immediately** - "Wallaby.js is not running. Please start it in VS Code"
4. **NEVER skip to Vitest** - Always give user chance to start Wallaby first

**For comprehensive testing guidance**: @CLAUDE_TESTING.md

**Fallback Commands:**

- `pnpm test` - Run Vitest unit tests (fallback only)
- `pnpm test:ci` - Run tests in CI mode (fallback only)

### Package-Specific Commands

- `pnpm --filter @studio/logger test` - Run tests for specific package
- `pnpm --filter @studio/ui build` - Build specific package
- `pnpm --filter "@studio/*" build` - Build all @studio packages

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

**Key Points:**

- **Root package.json**: `"type": "module"` enforces ES modules throughout
- **All packages**: Every package.json contains `"type": "module"`
- **Import syntax**: Only `import`/`export` statements - no `require()` or `module.exports`
- **File extensions**: `.mjs` for config files, `.ts`/`.tsx` for source code
- **Module resolution**: `"moduleResolution": "bundler"` strategy

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
│   ├── dev-tools/                 # Development tools including Wallaby.js manager
│   └── shared/                    # Shared TypeScript configurations
├── docs/                          # Source documentation (markdown files)
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
- **@studio/dev-tools** - Development tools including Wallaby.js manager

### Database Schema

- **Messages** table with content hash for deduplication
- **Links** and **Assets** tables with foreign key relationships
- Uses SHA-256 content hashing to prevent duplicate message imports
- Located in `packages/db/` with custom output to `packages/db/generated/`

## Configuration Notes

### Prisma Client

- **Package location**: `packages/db/`
- **Output location**: `packages/db/generated/`
- **Import path**: `@studio/db`
- Always run `pnpm --filter @studio/db build` after schema changes
- Database reset available via `pnpm db:reset`

### CI/CD

- GitHub Actions with parallel jobs for lint, type-check, test, and build
- Documentation auto-deployment to GitHub Pages on main branch changes
- Turbo-powered builds with intelligent caching
- Pre-commit hooks with Husky for staged file linting and formatting

## Context Loading Rules

Based on your current task, load additional specialized instruction modules:

### **For Testing Work**

Load @CLAUDE_TESTING.md - Contains:

- Detailed Wallaby.js setup and configuration
- Test database architecture and debugging
- TDD workflow and best practices
- Common testing issues and solutions

### **For Package Setup or Monorepo Issues**

Load @CLAUDE_TURBOREPO.md - Contains:

- Turborepo best practices and package setup
- Script standardization requirements
- Common gotchas and troubleshooting guide
- Configuration package management

### **For Development Patterns**

Load @CLAUDE_DEVELOPMENT.md - Contains:

- Import patterns and ES modules best practices
- Development workflow guidelines
- Code quality standards and conventions
- Git workflow and commit message guidelines

## Token Limit Handling

If approaching context limits, prioritize sections in this order:

1. **Commands** (always include)
2. **Architecture overview** (always include)
3. **Current task-specific module only** (load relevant @CLAUDE\_\*.md)
4. Skip verbose troubleshooting unless actively debugging

## Quick Reference

### Most Common Tasks

- **Testing**: Always use Wallaby.js first - see @CLAUDE_TESTING.md
- **Building**: `pnpm check` for full validation
- **New packages**: Follow template in @CLAUDE_TURBOREPO.md
- **Import issues**: ES modules patterns in @CLAUDE_DEVELOPMENT.md
- **Database issues**: Test database guide in @CLAUDE_TESTING.md

### Essential Workflows

- **TDD**: Wallaby.js → write failing test → minimal code → refactor
- **Package creation**: Use 5 required scripts template
- **Git commits**: Present-tense verb, concise, end with period
- **Quality check**: Always run `pnpm check` before committing

## Important Reminders

- **NEVER create files** unless absolutely necessary for the goal
- **ALWAYS prefer editing** existing files to creating new ones
- **NEVER proactively create documentation files** unless explicitly requested
- **Follow ES modules patterns** throughout the codebase
- **Use Wallaby.js for all testing** - never skip to Vitest without permission
