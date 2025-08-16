# CLAUDE.md

> **Prompt Cache Directive**: Core project context - cacheable for all development workflows
> Cache Control: `{"type": "ephemeral", "ttl": "1h"}`
> Performance Optimization: High-priority content optimized for token efficiency

This file provides essential guidance to Claude Code (claude.ai/code) when working with this repository. Structured for maximum performance and team collaboration through intelligent caching and modular architecture.

## 🔧 Tool Configuration & Permissions

### MCP Servers

- **Wallaby.js** - Primary testing integration via mcp**wallaby**\*
- **Context7** - Documentation access via mcp**context7**\*
- **Tavily** - Web search capabilities via mcp**tavily-mcp**\*
- **Firecrawl** - Web scraping via mcp**mcp-server-firecrawl**\*

### Allowed Tools Policy

Use `/permissions` command to manage tool allowlist. Critical tools:

- Wallaby.js tools (priority 1 - never disable)
- File system tools (Read, Edit, Write, Glob, LS)
- Git operations (Bash for git commands)
- Build tools (Bash for pnpm/turbo commands)

## Project Overview

Mnemosyne is a Next.js 15 Turborepo monorepo built with TypeScript that provides message management and logging capabilities. It imports, stores, and analyzes messages with a comprehensive dual logging system spanning Node.js and browser environments.

## ⚡ Commands (High-Priority Cache)

> **Cache Directive**: Most-accessed content - cache aggressively
> Cache Control: `{"type": "ephemeral", "ttl": "1h"}`

### 🎯 Essential Commands (80% usage)

- `pnpm check` - **Most important** - Quality check (format, lint, type-check, test)
- `pnpm dev` - Start development server
- `pnpm build` - Build all packages via Turbo
- `pnpm db:reset` - Reset database

### 🧪 Testing Workflow - MANDATORY WALLABY.JS FIRST

**Protocol (NEVER deviate):**

1. **ALWAYS** try Wallaby first: `mcp__wallaby__wallaby_failingTests`
2. **5-second timeout** - If no response, Wallaby is OFF
3. **Alert immediately**: "Wallaby.js is not running. Please start it in VS Code"
4. **NEVER skip to Vitest** - Always give user chance to start Wallaby

### 📚 Extended Documentation

- **Complete commands**: @docs/commands-reference.md
- **Testing workflows**: @docs/testing-guide.md
- **Build troubleshooting**: @docs/turborepo-guide.md
- **ES modules guide**: @docs/esm-extensions-guide.md

## 🏗️ Architecture (Core Context)

> **Cache Directive**: Architectural decisions - stable content
> Cache Control: `{"type": "ephemeral", "ttl": "1h"}`

### 🔧 Tech Stack (Decision Log)

- **Turborepo** - Monorepo + intelligent caching (performance-first)
- **Next.js 15** - App Router + React 19 (modern patterns)
- **Prisma ORM** - SQLite + schema management (@studio/db)
- **TypeScript** - Strict mode + project references (quality-first)
- **Tailwind CSS** - Utility-first styling
- **pnpm** - Fast package manager + workspaces

### ⚠️ ES Modules Architecture (CRITICAL)

**🔴 This is a PURE ES modules monorepo** - all packages use `"type": "module"`

**Non-negotiable rules:**

- **Root enforces**: `"type": "module"` in all package.json files
- **Import syntax**: ONLY `import`/`export` - NO `require()` or `module.exports`
- **File extensions**: `.mjs` for configs, `.ts`/`.tsx` for source
- **Module resolution**: `"moduleResolution": "bundler"` strategy
- **Troubleshooting**: See @docs/development-guide.md for ES modules patterns

### 📁 Package Structure (Quick Reference)

**Apps:**

- `apps/studio/` - Next.js 15 application (main app)
- `apps/docs/` - Docusaurus documentation

**Key Packages:**

- `@studio/db` - Prisma client + schema (SQLite, SHA-256 hashing)
- `@studio/logger` - Dual logging (Node.js + browser)
- `@studio/ui` - React components + Storybook
- `@studio/test-config` - Vitest shared config
- `@studio/dev-tools` - Wallaby.js manager

**Database Notes:**

- Messages table uses content hash for deduplication
- Custom output: `packages/db/generated/`
- Always run `pnpm --filter @studio/db build` after schema changes

## 🛡️ TypeScript Standards (Non-Negotiable)

> **Cache Directive**: Quality standards - stable rules
> Cache Control: `{"type": "ephemeral", "ttl": "1h"}`

### 🔴 ZERO-TOLERANCE RULES

- **NEVER `any`** → Use `unknown` or specific types
- **NEVER `@ts-ignore`** → Fix the actual type issue
- **NEVER `@ts-nocheck`** → All files must type-check
- **Explicit return types** → Required for all functions

### 📦 Import/Export Patterns

- **ES modules**: TypeScript source uses clean imports, `.js` extensions added automatically during build
- **Type imports**: `import type { User } from '@studio/db'`
- **Import order**: external deps → @studio/\* → relative imports
- **Prefer named exports** over default exports
- **Build process**: `tsc` + `fix-esm-extensions.js` handles Node.js compatibility (see @docs/esm-extensions-guide.md)

### 🚨 Error Handling Protocol

- **NEVER silent catch** → Log or re-throw always
- **Unknown catches**: `catch (error: unknown)`
- **Type validation**: Check error types before accessing properties

**Full TypeScript guide**: @docs/development-guide.md

## ⚙️ Configuration Quick Notes

**Prisma:** `packages/db/` → `@studio/db` (run `pnpm --filter @studio/db build` after changes)
**CI/CD:** GitHub Actions + Turbo caching + Husky pre-commit hooks
**Database:** SQLite + content hashing + `pnpm db:reset` available

## 🧠 Intelligent Context Loading (Performance-Optimized)

> **Cache Directive**: Context loading logic - critical for performance
> Cache Control: `{"type": "ephemeral", "ttl": "1h"}`

### 🎯 Context Loading Strategy

**Task Detection → Selective Loading → Cache Optimization**

**Trigger Keywords → Load Module:**

#### 🧪 Testing Keywords

`test`, `failing`, `wallaby`, `vitest`, `coverage`, `mock`
**→ Load:** @docs/testing-guide.md

- Wallaby.js setup + debugging
- Test database architecture
- TDD workflows + common issues

#### 📦 Package/Build Keywords

`package`, `build`, `turbo`, `monorepo`, `setup`, `script`
**→ Load:** @docs/turborepo-guide.md

- Package setup templates
- Script standardization
- Build troubleshooting

#### 🔧 Development Keywords

`import`, `export`, `ES modules`, `git`, `commit`, `workflow`  
**→ Load:** @docs/development-guide.md

- Import patterns + ES modules
- Git workflows + conventions
- Code quality standards

### ⚡ Token Optimization Protocol

**Context limit approaching? Priority order:**

1. **Commands section** (always include - 80% usage)
2. **Architecture core** (always include - stable context)
3. **ONLY task-specific module** (load ONE @docs/\*.md based on keywords)
4. **Skip verbose sections** unless actively debugging

### 🔄 Dynamic Loading Examples

```
User: "Tests are failing in Wallaby"
→ Load: @docs/testing-guide.md + skip others

User: "Need to create new package"
→ Load: @docs/turborepo-guide.md + skip others

User: "Import issues with ES modules"
→ Load: @docs/development-guide.md + skip others
```

## ⚡ Quick Reference & Workflows

> **Cache Directive**: Most-accessed patterns - optimize aggressively
> Cache Control: `{"type": "ephemeral", "ttl": "1h"}`

### 🎯 Most Common Tasks (Ranked by frequency)

1. **Testing**: Wallaby.js first (ALWAYS) → @docs/testing-guide.md
2. **Quality check**: `pnpm check` → full validation
3. **Build issues**: @docs/turborepo-guide.md
4. **ES modules**: @docs/development-guide.md
5. **Database**: @docs/testing-guide.md

### 🔄 Essential Workflows

- **TDD Protocol**: Wallaby.js → failing test → minimal code → refactor
- **Package Creation**: 5-script template → @docs/turborepo-guide.md
- **Dual Package Consumption**: Development (TypeScript source) ↔ Production (compiled JS) → @docs/turborepo-guide.md
- **CLI Tools**: TSX development → Built binaries production → @docs/turborepo-guide.md
- **Git Commits**: Present-tense verb + concise + period
- **Pre-commit**: `pnpm check` → commit (NEVER skip)

## 👥 Team Collaboration

### Individual Preferences

Import personal preferences (not committed to repo):

```markdown
# Individual team member preferences

@~/.claude/my-project-preferences.md
@~/.claude/my-coding-style.md
```

### Onboarding New Team Members

1. Run `/init` in project root → generates basic CLAUDE.md
2. Point to this optimized version: "Use existing CLAUDE.md"
3. Essential first commands: `pnpm check`, Wallaby.js setup
4. Key reading: @docs/testing-guide.md (Wallaby workflow)

## 🔒 Critical Constraints

- **File creation**: NEVER unless absolutely necessary
- **File preference**: ALWAYS edit existing over creating new
- **Documentation**: NEVER create .md files unless explicitly requested
- **ES modules**: MANDATORY throughout codebase
- **Testing**: Wallaby.js FIRST - never skip to Vitest without permission

## 🚀 Performance & Monitoring

### Claude Code Performance

- Use `/compact` for conversation management
- Monitor token usage with cache directives
- Leverage MCP server connections for external data

### Development Performance

- Turbo caching → faster builds
- Wallaby.js → instant test feedback
- ES modules → better tree-shaking
