# 🧠 Mnemosyne

A Next.js 15 monorepo built with TypeScript that provides message management and logging capabilities. Organized as a Turborepo with multiple packages for scalable development.

## 🏗️ Architecture

This is a **Turborepo monorepo** containing:

### 📱 Applications

- **`apps/studio`** - Next.js 15 application with React 19
- **`apps/docs`** - Docusaurus documentation site

### 📦 Packages

- **`@studio/db`** - Prisma database client and schema
- **`@studio/logger`** - Dual logging system (Node.js + browser)
- **`@studio/ui`** - React components with Storybook
- **`@studio/scripts`** - CLI utilities and data processing
- **`@studio/mocks`** - MSW API mocking for development/testing
- **`@studio/test-config`** - Shared testing configuration
- **`@studio/shared`** - Shared TypeScript configurations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Clone and install dependencies
git clone <repository>
cd mnemosyne
pnpm install

# Claude hooks will be automatically set up during install
```

### Development

```bash
# Start development server (Next.js app)
pnpm dev

# Development server will be available at http://localhost:3000

# Start documentation site
pnpm docs:dev

# Documentation site will be available at http://localhost:3001
```

## 🛠️ Development Commands

### 🏗️ Build & Development

```bash
# Build all packages and applications
pnpm build

# Start development server
pnpm dev

# Start production server
pnpm start

# Clean all build artifacts
pnpm clean
```

### 🧪 Testing

```bash
# Run all tests across the monorepo
pnpm test

# Run tests in CI mode (no watch)
pnpm test:ci

# Run Storybook component tests
pnpm test:storybook
```

### 🔍 Code Quality

```bash
# Type check all packages
pnpm type-check

# Lint all packages
pnpm lint

# Format code with Prettier
pnpm format

# Check formatting without fixing
pnpm format:check
```

### 🗄️ Database Operations

```bash
# Reset database (careful: destroys data!)
pnpm db:reset

# Import messages from CSV
pnpm import:messages --in path/to/messages.csv

# Preview import without saving
pnpm import:messages --in path/to/messages.csv --preview
```

### 📚 Documentation & Storybook

```bash
# Start documentation site development server
pnpm docs:dev

# Build documentation site
pnpm --filter @studio/docs build

# Start Storybook development server
pnpm storybook

# Build Storybook for production
pnpm build-storybook
```

## 🤖 Claude Code Integration

This repository includes automated quality checks and notifications for Claude Code:

### Automatic Setup

Claude hooks are automatically set up when you run `pnpm install`. The hooks provide:

- **Quality Check Hook**: Runs TypeScript, ESLint, and Prettier checks on code changes
- **Sound Notification Hook**: Plays notification sounds when tasks complete
- **TDD Support**: Automatically creates dummy implementations for missing imports in test files

### Manual Setup (if needed)

```bash
# Set up Claude hooks manually
pnpm setup:hooks

# Or rebuild and set up from scratch
pnpm --filter @studio/claude-hooks setup
```

### Hook Features

- 🎯 **Smart Import Resolution**: Creates dummy implementations during TDD workflow
- 🔧 **Auto-fixing**: Can automatically fix ESLint and Prettier issues
- 🔊 **Sound Notifications**: Customizable sounds for success/warning/error
- 📝 **TypeScript Cache**: Intelligent tsconfig resolution for monorepo

## 🎯 Turborepo Features

### ⚡ Intelligent Caching

Turborepo automatically caches build outputs and only rebuilds what changed:

```bash
# First build - all packages built
pnpm build
# > Tasks: 8 successful, 8 total
# > Time: 7.9s

# Second build - everything cached
pnpm build
# > Tasks: 8 successful, 8 total
# > Cached: 8 cached, 8 total
# > Time: 81ms >>> FULL TURBO
```

### 🎯 Selective Filtering

Run commands on specific packages:

```bash
# Run commands on all @studio packages
pnpm turbo build --filter="@studio/*"

# Run command on specific package
pnpm turbo test --filter="@studio/logger"

# Run command on app and its dependencies
pnpm turbo build --filter="@studio/app..."
```

### 🔗 Dependency-Aware Execution

Tasks automatically run in correct order based on dependencies:

```bash
# Database builds first, then packages that depend on it, then app
pnpm **build**
# 1. @studio/db (generates Prisma client)
# 2. @studio/logger, @studio/scripts (depend on db)
# 3. @studio/app (depends on all packages)
```

## 📦 Package Management

### 🔄 Workspace Commands

```bash
# Install dependency to specific package
pnpm add --filter @studio/ui react-icons

# Install dev dependency to root
pnpm add -D -w eslint-plugin-custom

# Install dependency to all packages
pnpm add --filter "@studio/*" lodash

# List all workspace packages
pnpm workspace:info

# Check for outdated dependencies
pnpm workspace:outdated
```

### 🏷️ Package Scripts

Each package has standardized scripts:

```bash
# In any package directory
pnpm build          # Build the package
pnpm dev            # Development mode
pnpm test           # Run tests
pnpm type-check     # TypeScript checking
pnpm clean          # Clean build artifacts
```

## 🗂️ Project Structure

```
mnemosyne/
├── apps/
│   ├── studio/              # Next.js application
│   │   ├── src/app/         # App Router pages
│   │   ├── public/          # Static assets
│   │   └── package.json     # App dependencies
│   └── docs/                # Docusaurus documentation site
│       ├── docs/            # MDX documentation files
│       ├── src/             # Custom React components
│       ├── static/          # Static assets
│       └── docusaurus.config.ts  # Site configuration
├── packages/
│   ├── db/                  # Database package
│   │   ├── prisma/          # Schema and migrations
│   │   ├── generated/       # Prisma client
│   │   └── src/index.ts     # Package exports
│   ├── logger/              # Logging system
│   │   └── src/lib/         # Logger implementations
│   ├── ui/                  # Component library
│   │   ├── src/             # Components
│   │   └── __stories__/     # Storybook stories
│   ├── scripts/             # CLI utilities
│   │   └── src/             # Import scripts
│   ├── mocks/               # API mocking
│   ├── test-config/         # Test setup
│   └── shared/              # Shared configs
├── docs/                    # Source documentation (markdown)
│   ├── architecture/        # System design docs
│   ├── features/            # Feature documentation
│   ├── guides/              # Development guides
│   └── packages/            # Package documentation
├── turbo.json               # Turborepo configuration
├── package.json             # Root dependencies
└── pnpm-workspace.yaml      # Workspace definition
```

## 🔧 Configuration Files

### Core Configuration

- **`turbo.json`** - Turborepo task pipeline and caching
- **`pnpm-workspace.yaml`** - Workspace package definitions
- **`package.json`** - Root scripts and dependencies

### TypeScript

- **`packages/shared/tsconfig.json`** - Base TypeScript config
- **`packages/shared/tsconfig.app.json`** - App-specific config
- **`packages/shared/tsconfig.package.json`** - Package-specific config

### Quality Tools

- **`eslint.config.mjs`** - ESLint configuration
- **`.prettierrc`** - Prettier formatting rules
- **`vitest.config.ts`** - Test configuration

## 🎨 Development Patterns

### 📂 Import Paths

The monorepo supports both legacy and new import patterns:

```typescript
// Legacy imports (no longer supported)
// import { logger } from '@/lib/logger'

// New monorepo imports (recommended)
import { PrismaClient } from '@studio/db'
import { logger } from '@studio/logger'
import { Button } from '@studio/ui'
```

### 🧪 Testing Strategy

- **Unit Tests**: Vitest with jsdom for component testing
- **Component Tests**: Storybook with Playwright browser testing
- **API Mocking**: MSW for realistic API simulation
- **Database Tests**: In-memory SQLite for fast test execution

### 📦 Package Dependencies

Packages can depend on each other using workspace references:

```json
{
  "dependencies": {
    "@studio/db": "workspace:*",
    "@studio/logger": "workspace:*"
  }
}
```

## 🚀 Performance Optimizations

### ⚡ Turbo Caching

- **Build artifacts** cached based on source file changes
- **Test results** cached when no code changes
- **Type checking** skipped when no TypeScript changes
- **Linting** cached when no source or config changes

### 🔄 Incremental Builds

- Only changed packages are rebuilt
- Dependent packages automatically rebuild when dependencies change
- Remote caching available with Vercel/Turborepo Cloud

### 📊 Performance Monitoring

```bash
# Generate build performance profile
pnpm turbo build --profile=profile.json

# View detailed task execution graph
pnpm turbo build --graph

# Show summary of task execution
pnpm turbo build --summarize
```

## 🐛 Debugging & Troubleshooting

### 🔍 Common Issues

**Cache Issues:**

```bash
# Clear Turbo cache
pnpm turbo clean

# Force rebuild without cache
pnpm turbo build --force
```

**Dependency Issues:**

```bash
# Reinstall all dependencies
pnpm clean:all && pnpm install

# Check workspace dependencies
pnpm list --recursive
```

**Database Issues:**

```bash
# Regenerate Prisma client
pnpm --filter @studio/db build

# Reset database schema
pnpm db:reset
```

### 📋 Health Check

Run this comprehensive health check:

```bash
# Verify all systems working
pnpm clean && pnpm build && pnpm test -- --run && pnpm type-check && pnpm lint
```

## 🌟 Key Features

### 🔐 Type Safety

- **Strict TypeScript** configuration across all packages
- **Shared configs** ensure consistency
- **Path mapping** for clean imports
- **Project references** for optimal IDE experience

### 🧪 Comprehensive Testing

- **78 tests** across all packages
- **Component testing** with Storybook + Playwright
- **API mocking** with MSW
- **Browser and Node.js** environments

### 📊 Advanced Logging

- **Dual logging system** for browser and Node.js
- **Structured logging** with Pino
- **Debug callsites** for development
- **Remote logging** capabilities

### 🗄️ Database Management

- **Prisma ORM** with SQLite
- **Message deduplication** using SHA-256 hashing
- **CSV import utilities** with error handling
- **Database migrations** and seeding

## 🤝 Contributing

### 🔄 Workflow

1. **Install dependencies**: `pnpm install`
2. **Create feature branch**: `git checkout -b feature/your-feature`
3. **Make changes** in appropriate packages
4. **Run quality checks**: `pnpm check`
5. **Run tests**: `pnpm test -- --run`
6. **Commit changes**: Follow conventional commit format
7. **Create PR**: All checks must pass in CI

### 📝 Adding New Packages

1. Create directory in `packages/`
2. Add `package.json` with `@studio/` namespace
3. Update workspace filtering in scripts if needed
4. Add appropriate build/test scripts
5. Update this README

## 📚 Documentation

### 🌐 Live Documentation Site

The complete project documentation is available at:

- **Production**: https://nathanvale.github.io/mnemosyne/
- **Local Development**: http://localhost:3001 (run `pnpm docs:dev`)

### 📖 Documentation Structure

- **Architecture**: High-level system design and technical foundations
- **Features**: Detailed documentation for each feature (Basecamp-style planning)
- **Guides**: Development methodology and team collaboration guides
- **Packages**: Technical documentation for @studio/\* monorepo packages

### 🏗️ Contributing to Documentation

Documentation source files are in the `docs/` directory:

```bash
# Edit documentation files in docs/
vi docs/architecture/system-overview.md

# Preview changes locally
pnpm docs:dev

# Documentation auto-deploys when merged to main
```

## 📚 Learn More

### 🔗 Technology Stack

- **[Turborepo](https://turbo.build/repo)** - Build system and monorepo tooling
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[Prisma](https://prisma.io/)** - Database ORM and client
- **[Vitest](https://vitest.dev/)** - Unit testing framework
- **[Storybook](https://storybook.js.org/)** - Component development and testing
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[pnpm](https://pnpm.io/)** - Fast, disk space efficient package manager

### 📖 Documentation

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

---

**Built with ❤️ using Turborepo**
