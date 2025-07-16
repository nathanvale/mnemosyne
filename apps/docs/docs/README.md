---
id: README
title: Mnemosyne Documentation
---

# 📚 Mnemosyne Documentation

Welcome to the Mnemosyne documentation system. This uses a **Basecamp-style approach** to project management that emphasizes calm, async-friendly development without micromanaging tasks.

## 🧭 Navigation

### 🎯 Start Here

- [**Intent**](intent.md) - Project vision and multi-phase roadmap
- [**Planning Guide**](planning-guide.md) - How to use this documentation system

### 🏗️ Architecture

- [**System Overview**](architecture/system-overview.md) - High-level architecture
- [**Phase Plan**](architecture/phase-plan.md) - Detailed roadmap & sequencing
- [**Data Flow**](architecture/data-flow.md) - How data moves through the system
- [**Glossary**](architecture/glossary.md) - Shared terminology
- [**Monorepo**](architecture/monorepo.md) - Turborepo + workspace strategy
- [**Packages**](architecture/packages.md) - Package dependency graph

### 🎨 Features

- [**Message Import**](features/message-import/) - CSV import with deduplication
- [**Dual Logging**](features/dual-logging/) - Node.js + Browser logging system
- [**Message Deduplication**](features/message-deduplication/) - SHA-256 content hashing
- [**Component Library**](features/component-library/) - @studio/ui + Storybook

### 📦 Packages

- [**Database**](packages/db/) - Prisma schema and migrations
- [**Logger**](packages/logger/) - Dual logging architecture
- [**UI**](packages/ui/) - Component library and design system

### 🧠 Decisions

- [**ADR Index**](decisions/) - Architecture Decision Records

## 🛠️ Templates

Need to document a new feature? Use these templates:

```bash
# Copy templates for a new feature
cp -R docs/template docs/features/your-feature-name

# Available templates:
# - intent.md    (Why this feature exists)
# - design.md    (How it works technically)
# - pitch.md     (What to build in this cycle)
```

## 🎯 Current Phase

**Phase 3: Component Library** (In Progress)

- Building @studio/ui package with Storybook
- Establishing design system patterns
- Creating reusable component templates

## ✅ What We've Shipped

- ✅ **Phase 1**: Core monorepo setup with Turborepo
- ✅ **Phase 2**: Dual logging system (@studio/logger)
- ✅ **Message Import**: CSV processing with SHA-256 deduplication
- ✅ **Database**: Prisma schema with relationship management
- 🔄 **Component Library**: Storybook integration (current)

## 🔄 How We Work

This documentation follows **Basecamp principles**:

- We shape work, do it, and mark it done
- Focus on shipping phases, not tracking tasks
- Use appetite to define scope, not deadlines
- Celebrate completed work in "done lists"

---

> "We don't track tasks. We shape work, do it, and mark it done."
