---
id: system-overview
title: System Overview
---

# 🏗️ System Overview

## 🎯 High-Level Architecture

Mnemosyne is a **Next.js 15 Turborepo monorepo** designed to transform message history into structured emotional memory for AI agents.

> **📋 Post-MVP Development**: For production-ready improvements and scaling roadmap, see [Post-MVP Architecture Roadmap](./post-mvp-roadmap.md).

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

### MVP Phase 2 (Memory Extraction)

```
Raw Messages → Claude Processing → Memory Entries → Simple Validation
     ↓              ↓                ↓              ↓
Message Batches → Emotional → TypeScript → Human Review
(100-500)        Analysis    Schema     (70% target)
```

### MVP Phase 3 (Claude Integration)

```
User Message → Memory Query → Context Selection → Claude + Context → Enhanced Response
     ↓             ↓              ↓                    ↓               ↓
Input Text → Relevant → Top 3-5 → Claude API → Response with
             Memories   Memories   + Memory     Emotional Context
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

### Memory Generation (MVP Phase 2)

1. **Process** - Claude analyzes message batches for emotional context
2. **Structure** - Apply TypeScript schema for emotional metadata
3. **Validate** - Simple human review for 70% accuracy target
4. **Store** - Generate 50-100 high-quality emotional memories

### Claude Integration (MVP Phase 3)

1. **Query** - Retrieve relevant memories based on conversation context
2. **Select** - Choose top 3-5 memories by relevance scoring
3. **Inject** - Provide as context to Claude API calls
4. **Respond** - Demonstrate Claude "knows you" through memory context

## 🎯 Design Principles

### MVP-First Approach

- **Quality over scale** - 50-100 meaningful memories vs thousands
- **Proof of concept** - Demonstrate Claude "knows you" through memory
- **Single integration** - Claude only, extensible later
- **Realistic targets** - 70% validation rate, 6-8 week phases

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

## 📊 MVP Timeline & Success

### Timeline (4-5 months total)

- **Phase 1**: Message Import ✅ (6 weeks - Complete)
- **Phase 2**: Memory Extraction MVP (6-8 weeks)
- **Phase 3**: Claude Integration MVP (6-8 weeks)

### Success Criteria

**Phase 2 MVP:**

- Extract 50-100 high-quality emotional memories
- Achieve 70% human validation rate
- Define concrete TypeScript memory schema
- Stay within Claude Pro account limits

**Phase 3 MVP:**

- Memory query response < 2 seconds
- 3-5 relevant memories per conversation
- Claude responses feel personal and contextual
- **Ultimate goal**: One "wow, it knows me" moment
