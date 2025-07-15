# 🏗️ System Overview

## 🎯 High-Level Architecture

Mnemosyne is a **Next.js 15 Turborepo monorepo** designed to transform message history into structured emotional memory for AI agents.

## 🛠️ Core Technologies

### Foundation Stack

- **Turborepo** - Monorepo build system with intelligent caching
- **Next.js 15** with App Router and React 19
- **TypeScript** with strict configuration and project references
- **pnpm** workspaces for package management

### Data Layer

- **Prisma ORM** with SQLite database for message storage
- **SHA-256 content hashing** for deduplication
- **Relational schema** with Messages, Links, and Assets tables

### Development Tools

- **Vitest** with jsdom for unit testing
- **Storybook** for component development
- **MSW** for API mocking
- **Tailwind CSS** for styling
- **Wallaby.js** for live test feedback

### Logging Architecture

- **Dual logging system** spanning Node.js (Pino) and browser environments
- **Unified API** across server and client contexts
- **Development traces** with clickable callsite information
- **Production redaction** of sensitive data

## 🏛️ Component Interactions

### Current Phase (Message Import)

```
CSV Files → @studio/scripts → Prisma DB → @studio/logger
     ↓              ↓              ↓             ↓
Content Hash → Deduplication → Storage → Structured Logs
```

### Future Phase (Memory Extraction)

```
Raw Messages → GPT Processing → Memory Entries → Validation Queue
     ↓              ↓               ↓              ↓
Context Tags → Emotional Metadata → Relationships → Review System
```

### Future Phase (Agent Serving)

```
Agent Query → MCP Engine → Memory Retrieval → Context Injection
     ↓           ↓             ↓               ↓
Relationship → Relevant → Emotional → Enhanced
  Scope      Memories    Context    Response
```

## 📦 Package Ecosystem

### Application Layer

- **@studio/app** - Next.js 15 application (future)
- **apps/studio** - Current Next.js application

### Data Layer

- **@studio/db** - Prisma schema and generated client
- **@studio/scripts** - CLI utilities for data processing

### Platform Layer

- **@studio/logger** - Dual logging system
- **@studio/ui** - React component library
- **@studio/mocks** - MSW API handlers

### Infrastructure Layer

- **@studio/test-config** - Shared Vitest configuration
- **@studio/shared** - Common TypeScript configurations

## 🔄 Data Flow Philosophy

### Input Processing

1. **Normalize** - Convert diverse formats to consistent structure
2. **Deduplicate** - Use content hashing to prevent duplicates
3. **Extract** - Pull out links, assets, and metadata
4. **Store** - Persist in relational format

### Memory Generation (Future)

1. **Analyze** - GPT processes message content for emotional context
2. **Tag** - Apply relationship and emotional metadata
3. **Validate** - Human review queue for memory accuracy
4. **Index** - Optimize for agent retrieval patterns

### Agent Serving (Future)

1. **Scope** - Filter memories by relationship context
2. **Rank** - Order by relevance to current conversation
3. **Inject** - Provide as context to agent systems
4. **Track** - Log which memories influenced responses

## 🎯 Design Principles

### Relationship-Aware

- Memory system understands interpersonal context
- Not a generic chat memory API
- Optimized for emotional continuity

### Monorepo Benefits

- **Shared types** across all packages
- **Unified tooling** via Turborepo
- **Hot reload** across package boundaries
- **Intelligent caching** for fast builds

### Development Experience

- **Live feedback** via Wallaby.js
- **Component isolation** via Storybook
- **API mocking** via MSW
- **Type safety** across all boundaries
