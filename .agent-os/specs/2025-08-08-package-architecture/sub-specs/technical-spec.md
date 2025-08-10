# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-08-package-architecture/spec.md

> Created: 2025-08-08
> Version: 1.0.0

## Technical Requirements

**Monorepo Architecture**:

- pnpm workspace configuration with apps/_ and packages/_ structure
- Workspace protocol (workspace:\*) for internal package dependencies
- TypeScript project references for cross-package type checking
- ES modules throughout with "type": "module" in all package.json files

**Package Organization**:

- Apps directory containing Next.js studio and Docusaurus docs applications
- Packages directory with 15+ @studio/\* namespaced packages
- Consistent package naming with @studio/ prefix for all internal packages
- Standardized package.json structure with required scripts (build, test, lint, type-check, format:check)

**Configuration Management**:

- Centralized TypeScript configurations in @studio/typescript-config
- Shared ESLint rules in @studio/eslint-config with multiple exports
- Unified Prettier settings in @studio/prettier-config
- Test configuration sharing through @studio/test-config

**Development Workflow**:

- Direct source imports during development with TypeScript path mappings
- Hot module replacement across package boundaries
- Turborepo task orchestration for build, test, and lint operations
- Automatic dependency building with topological ordering

## Approach Options

**Package Manager Selection** (Selected)

- **pnpm with workspaces**
- Pros: Efficient disk usage, strict dependencies, fast installs, workspace protocol
- Cons: Less ecosystem support than npm, learning curve
- **Rationale**: Best performance and disk efficiency for monorepos

**Alternative: npm workspaces**

- Pros: Native support, wide ecosystem compatibility
- Cons: Slower installs, larger disk usage, less strict
- **Decision**: pnpm provides superior monorepo features

**Alternative: Yarn workspaces**

- Pros: Mature workspace support, good performance
- Cons: Fragmented versions (v1 vs v3), migration complexity
- **Decision**: pnpm offers better performance and stricter guarantees

**Module System** (Selected)

- **ES modules throughout ("type": "module")**
- Pros: Modern standard, better tree-shaking, static analysis
- Cons: Migration complexity, tool compatibility
- **Rationale**: Future-proof architecture with optimal bundling

**Configuration Strategy** (Selected)

- **Centralized configuration packages**
- Pros: Single source of truth, easy updates, consistency
- Cons: Additional packages, dependency management
- **Rationale**: Maintains consistency across growing monorepo

## External Dependencies

**pnpm** - Fast, disk space efficient package manager

- **Purpose**: Workspace management and dependency installation
- **Justification**: Optimal for monorepo with efficient linking and storage

**turbo** - Build system for monorepos

- **Purpose**: Task orchestration and caching across packages
- **Justification**: Intelligent dependency tracking and parallel execution

## Package Inventory

### Configuration Packages

- **@studio/typescript-config** - TypeScript configurations (base, library, nextjs)
- **@studio/eslint-config** - ESLint rules (base, library, next exports)
- **@studio/prettier-config** - Code formatting rules
- **@studio/test-config** - Shared Vitest configuration and utilities

### Core Infrastructure

- **@studio/db** - Prisma database client with SQLite
- **@studio/logger** - Dual logging system (Node.js with Pino, browser with batching)
- **@studio/shared** - Shared TypeScript configurations and utilities

### UI and Components

- **@studio/ui** - React component library with Storybook
- **@studio/mocks** - MSW handlers for API mocking

### Data Processing

- **@studio/scripts** - CLI utilities for data import and processing
- **@studio/schema** - Zod schemas for data validation
- **@studio/memory** - Memory extraction and mood analysis
- **@studio/validation** - Data validation and quality assessment

### Specialized Packages

- **@studio/mcp** - Model Context Protocol foundation
- **@studio/claude-hooks** - Claude integration hooks and utilities

## Package Dependencies

**Dependency Graph**:

```
Configuration Packages (Level 0)
├── @studio/typescript-config
├── @studio/eslint-config
└── @studio/prettier-config

Core Schema (Level 1)
└── @studio/schema

Infrastructure (Level 2)
├── @studio/db → @studio/schema
├── @studio/test-config → @studio/db
└── @studio/logger

Processing (Level 3-5)
├── @studio/memory → @studio/db, @studio/schema
├── @studio/validation → @studio/db, @studio/schema
├── @studio/mcp → @studio/db, @studio/memory
└── @studio/scripts → @studio/db

UI Layer (Level 4)
├── @studio/ui → @studio/logger
└── @studio/mocks

Applications (Level 6-7)
├── @studio/app → @studio/db, @studio/logger, @studio/ui, @studio/mocks
└── @studio/docs

Specialized (Level 5)
└── @studio/claude-hooks
```

## Build Configuration

**Package Scripts**:

- build: TypeScript compilation or framework build
- test: Vitest test execution
- lint: ESLint with max-warnings 0
- type-check: TypeScript type validation
- format:check: Prettier format verification

**Output Directories**:

- dist/ for compiled TypeScript packages
- .next/ for Next.js applications
- build/ for Docusaurus
- generated/ for Prisma client
