# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mnemosyne is a Next.js 15 application built with TypeScript that provides message management and logging capabilities. It imports, stores, and analyzes messages with comprehensive logging infrastructure.

## Commands

### Development

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm type-check` - TypeScript type checking
- `pnpm lint` - ESLint with import sorting
- `pnpm format` - Prettier formatting

### Testing

- `pnpm test` - Run Vitest unit tests
- `pnpm test:storybook` - Run Storybook component tests
- Use Wallaby.js for live test feedback and debugging

### Single Test Running

- `pnpm test -- --run --reporter=verbose <test-file>` - Run specific test file
- Use Wallaby.js tools for individual test execution and runtime values

### Data Management

- `pnpm db:reset` - Reset Prisma database
- `pnpm import:messages` - Import messages from CSV files

### Storybook

- `pnpm storybook` - Start Storybook development server
- `pnpm build-storybook` - Build Storybook for production

## Architecture

### Core Technologies

- **Next.js 15** with App Router and React 19
- **Prisma ORM** with SQLite database (custom client in `src/generated/prisma/`)
- **TypeScript** with strict configuration
- **Tailwind CSS** for styling
- **pnpm** as package manager

### Key Directories

- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - React components with Storybook stories
- `src/lib/` - Core utilities including dual logging system
- `src/generated/prisma/` - Generated Prisma client (custom location)
- `scripts/` - CLI utilities and data processing scripts
- `prisma/` - Database schema and migrations
- `tests/` - Test configuration and setup files

### Database Schema

- **Messages** table with content hash for deduplication
- **Links** and **Assets** tables with foreign key relationships
- Uses SHA-256 content hashing to prevent duplicate message imports

### Logging Architecture

- **Dual logger system**: Node.js structured logging (Pino) and browser logging
- **Server-side**: Structured logging with callsite tracking and colored development output
- **Client-side**: Production-ready browser logger with batching, retry logic, and third-party integrations
- **Development**: Clickable traces and comprehensive debugging information
- **Production**: Sensitive data redaction and remote log shipping capabilities

### Testing Setup

- **Vitest** with jsdom environment for unit tests
- **React Testing Library** for component testing
- **Playwright** for browser testing in Storybook
- **MSW** for API mocking in development and tests
- **Wallaby.js** for live test feedback and debugging

### Message Processing

- CSV message import with comprehensive error handling
- Content-based deduplication using SHA-256 hashing
- URL extraction from message text with link relationship management
- Batch processing with progress tracking and error reporting

## Configuration Notes

### Prisma Client

- Custom output location: `src/generated/prisma/`
- Always run `pnpm prisma generate` after schema changes
- Database reset available via `pnpm db:reset`

### ESLint Configuration

- Next.js + Storybook configurations
- Perfectionist plugin for import sorting
- Custom rules for component organization

### TypeScript Configuration

- Strict mode enabled
- Path aliases: `@/*` points to `src/*`
- ES2017 target with modern module resolution

### CI/CD

- GitHub Actions with parallel jobs for lint, type-check, test, and build
- Prisma client generation required in each CI job
- Pre-commit hooks with Husky for staged file linting and formatting

## Development Patterns

### Component Development

- Storybook-driven development with comprehensive stories
- MSW for API mocking during development
- Accessibility testing with Storybook a11y addon

### Data Processing

- Use content hashing for deduplication logic
- Implement batch processing with error handling
- URL extraction patterns for message analysis

### Error Handling

- Comprehensive error reporting in data processing scripts
- Structured logging for debugging and monitoring
- Graceful handling of duplicate content during imports
