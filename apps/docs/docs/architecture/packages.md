# 📦 Package Dependency Graph

## 🎯 Package Overview

The monorepo consists of 7 core packages working together to create the relational memory system, each with specific responsibilities and interdependencies.

---

## 🏗️ Dependency Relationships

### Dependency Graph

```
@studio/shared
    ↓
@studio/db ← @studio/test-config
    ↓              ↓
@studio/logger ← @studio/scripts
    ↓              ↓
@studio/ui ← @studio/mocks
    ↓         ↓
apps/studio
```

### Build Order

1. **@studio/shared** - Base TypeScript configurations
2. **@studio/db** - Database client generation
3. **@studio/logger** - Logging infrastructure
4. **@studio/test-config** - Testing utilities
5. **@studio/scripts** - CLI tools (depends on db + logger)
6. **@studio/ui** - Components (depends on logger)
7. **@studio/mocks** - API mocking (depends on ui patterns)
8. **apps/studio** - Next.js application (consumes all packages)

---

## 📊 Package Details

### @studio/shared

**Purpose**: Common TypeScript configurations and build settings  
**Dependencies**: None (foundation package)  
**Exports**: Base tsconfig.json, ESLint configs, shared types  
**Used By**: All other packages

```json
{
  "exports": {
    "./tsconfig.json": "./tsconfig.json",
    "./eslint": "./eslint.config.js"
  }
}
```

### @studio/db

**Purpose**: Prisma database client and schema management  
**Dependencies**: @studio/shared  
**Exports**: PrismaClient, database types, schema utilities  
**Used By**: @studio/scripts, apps/studio

```json
{
  "dependencies": {
    "@studio/shared": "workspace:*",
    "@prisma/client": "^5.0.0",
    "prisma": "^5.0.0"
  },
  "exports": {
    ".": "./generated/index.js",
    "./client": "./generated/client.js"
  }
}
```

### @studio/logger

**Purpose**: Dual logging system (Node.js + browser)  
**Dependencies**: @studio/shared  
**Exports**: logger, createLogger, log utilities  
**Used By**: @studio/scripts, @studio/ui, apps/studio

```json
{
  "dependencies": {
    "@studio/shared": "workspace:*",
    "pino": "^8.0.0",
    "pino-pretty": "^10.0.0"
  },
  "exports": {
    ".": "./dist/index.js",
    "./browser": "./dist/browser.js",
    "./node": "./dist/node.js"
  }
}
```

### @studio/test-config

**Purpose**: Shared Vitest configuration and test utilities  
**Dependencies**: @studio/shared  
**Exports**: Vitest config, test helpers, mock utilities  
**Used By**: All packages for testing

```json
{
  "dependencies": {
    "@studio/shared": "workspace:*",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0"
  },
  "exports": {
    "./vitest": "./vitest.config.js",
    "./helpers": "./dist/helpers.js"
  }
}
```

### @studio/scripts

**Purpose**: CLI utilities for data processing and imports  
**Dependencies**: @studio/shared, @studio/db, @studio/logger  
**Exports**: CLI commands, processing utilities  
**Used By**: Root package.json scripts, manual execution

```json
{
  "dependencies": {
    "@studio/shared": "workspace:*",
    "@studio/db": "workspace:*",
    "@studio/logger": "workspace:*",
    "commander": "^11.0.0"
  },
  "bin": {
    "import-messages": "./dist/cli/import.js"
  }
}
```

### @studio/ui

**Purpose**: React component library with Storybook  
**Dependencies**: @studio/shared, @studio/logger  
**Exports**: React components, design system  
**Used By**: apps/studio, Storybook

```json
{
  "dependencies": {
    "@studio/shared": "workspace:*",
    "@studio/logger": "workspace:*",
    "react": "^19.0.0",
    "tailwindcss": "^3.0.0"
  },
  "exports": {
    ".": "./dist/index.js",
    "./components": "./dist/components/index.js"
  }
}
```

### @studio/mocks

**Purpose**: MSW API mocking for development and testing  
**Dependencies**: @studio/shared, @studio/ui (for patterns)  
**Exports**: MSW handlers, mock data generators  
**Used By**: apps/studio, package tests

```json
{
  "dependencies": {
    "@studio/shared": "workspace:*",
    "@studio/ui": "workspace:*",
    "msw": "^2.0.0"
  },
  "exports": {
    "./handlers": "./dist/handlers.js",
    "./server": "./dist/server.js",
    "./browser": "./dist/browser.js"
  }
}
```

---

## 🔄 Package Interactions

### Development Workflow

```
Developer Change → Package Build → Dependency Updates → Hot Reload
       ↓               ↓              ↓                 ↓
Edit Source → Turborepo → Consuming → Browser
File          Build      Packages     Update
```

### Testing Flow

```
Package Test → Dependency Mocks → Cross-Package → Integration
     ↓              ↓                Testing          Tests
Unit Tests → MSW Handlers → Component → Full System
                           Tests       Tests
```

### Production Build

```
Source Code → Package Build → Bundle Creation → Application
     ↓            ↓              ↓              Deploy
TypeScript → JavaScript → Optimized → Production
Compile      Output       Bundles     System
```

---

## 📈 Package Metrics

### Size and Complexity

| Package             | LOC   | Dependencies | Build Time | Bundle Size |
| ------------------- | ----- | ------------ | ---------- | ----------- |
| @studio/shared      | ~100  | 0            | &lt;1s     | 0KB         |
| @studio/db          | ~500  | 2            | ~5s        | 150KB       |
| @studio/logger      | ~800  | 3            | ~2s        | 45KB        |
| @studio/test-config | ~200  | 5            | ~1s        | 25KB        |
| @studio/scripts     | ~1200 | 10           | ~3s        | 200KB       |
| @studio/ui          | ~2000 | 8            | ~4s        | 180KB       |
| @studio/mocks       | ~600  | 4            | ~2s        | 80KB        |

### Performance Characteristics

- **Cold build**: ~20 seconds for all packages
- **Incremental build**: ~2-5 seconds for changed packages
- **Cache hit rate**: 90%+ during development
- **Hot reload time**: &lt;500ms across package boundaries

---

## 🎯 Future Package Evolution

### Phase 2 Additions (Memory Extraction)

- **@studio/memory** - GPT processing and memory extraction
- **@studio/validation** - Memory review and validation UI
- **@studio/relationships** - Person and relationship tracking

### Phase 3 Additions (Agent Serving)

- **@studio/mcp** - Model Context Protocol engine
- **@studio/agents** - Agent integration adapters
- **@studio/api** - Production API gateway
- **@studio/analytics** - Memory usage tracking

### Updated Dependency Graph (Future)

```
@studio/shared
    ↓
@studio/db → @studio/memory → @studio/mcp
    ↓           ↓               ↓
@studio/logger → @studio/validation → @studio/agents
    ↓              ↓                    ↓
@studio/ui → @studio/relationships → @studio/api
    ↓           ↓                     ↓
@studio/scripts → @studio/analytics
    ↓              ↓
@studio/mocks → apps/studio
```

---

## 🛠️ Package Development Guidelines

### Adding New Packages

1. **Follow naming convention**: `@studio/<purpose>`
2. **Extend shared configs**: Use @studio/shared as base
3. **Define clear exports**: Minimal, focused public API
4. **Add to workspace**: Update pnpm-workspace.yaml
5. **Configure Turborepo**: Add to pipeline configuration

### Managing Dependencies

- **Use workspace references**: `workspace:*` for internal packages
- **Minimize external deps**: Only add what's necessary
- **Version consistency**: Keep external versions aligned
- **Peer dependencies**: For packages expected to be provided by consumers

### Testing Strategy

- **Package isolation**: Each package has its own test suite
- **Cross-package integration**: Test package interactions
- **Mock external services**: Use @studio/mocks for consistency
- **CI optimization**: Parallel testing with Turborepo

### Documentation Requirements

- **README.md**: Package purpose and usage
- **API documentation**: TypeScript types serve as contracts
- **Examples**: Common usage patterns
- **Changelog**: Track breaking changes
