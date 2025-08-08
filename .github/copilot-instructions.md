## GitHub Copilot: Working in this repo

Monorepo: Next.js 15 (App Router) + TypeScript (pure ESM), Turborepo, Prisma/SQLite, Vitest + MSW + Wallaby, Storybook. Start with `README.md` for commands and `CLAUDE.md` for deep architecture. Product/spec context lives in `.agent-os/`.

### Architecture & imports

- Packages import via workspace alias: `import { PrismaClient } from '@studio/db'`, `import { logger } from '@studio/logger'`, `import { Button } from '@studio/ui'`.
- Pure ES Modules ("type": "module" across the monorepo). Use `import`/`export` only; no `require()`/`__dirname`. For paths, use `import.meta.url` patterns.
- Central configs (TS/ESLint/Prettier) live in dedicated packages. Next.js app: `apps/studio`. Docs: `apps/docs`.

### Core workflows

- Dev/build: `pnpm dev`, `pnpm build`, `pnpm clean`. Scope with Turbo filters, e.g. `pnpm --filter "@studio/*" build`.
- Tests: `pnpm test` (Vitest), `pnpm test:ci`, Storybook tests `pnpm test:storybook`.
  _Prefer WallabyJS MCP server for live TDD._
- Docs/Storybook: `pnpm docs:dev` (3001), `pnpm storybook` / `pnpm build-storybook`.
- DB: `pnpm db:reset`. CSV import: `pnpm import:messages --in path/to/messages.csv [--preview]`.

### Testing patterns

- MSW handlers in `packages/mocks`; reuse in Vitest and Storybook. Register only happy paths globally; put edge cases in individual tests/stories.
- Use jsdom for component tests; prefer `screen.findBy*` for async; reset `vi` mocks in `beforeEach`.
- Database tests isolate per worker. Use shared helpers from `packages/test-config` (see details in `CLAUDE.md`) rather than ad‑hoc Prisma clients.

### Database & memory model

- Prisma schema: `packages/db/prisma`; generated client: `packages/db/generated`. After schema edits, run `pnpm --filter @studio/db build`.
- Message import uses SHA‑256 content hashing for deduplication and URL extraction. See `packages/scripts`.
- Memory operations must initialize clustering fields: set `clusteringMetadata: null` and `clusterParticipationCount: 0` on create (tests rely on this).

### Logging

- Use `@studio/logger` (Node + browser) for structured logs instead of `console.*`. In tests/stories, stub or spy logger methods as needed.

### Conventions

- TypeScript strict; path imports `@studio/*`. Formatting via Prettier (single quotes, no semicolons, trailing commas). Lint uses centralized config with import sorting.
- Next.js App Router: API routes export named functions from `route.ts`. Components in `packages/ui` with stories under `__stories__`.

### Standards

- Also follow external engineering standards on your machine:
  - `~/.agent-os/standards/code-style.md`
  - `~/.agent-os/standards/best-practices.md`
    These set the baseline; repo-specific overrides are defined in centralized `@studio/*` configs and the sections above.

### What to read first

- High‑level: `README.md`, `CLAUDE.md`. Product/specs: `.agent-os/` (e.g., mood scoring, memory processing, CSV import).
- DB: `packages/db/prisma/schema` and generated client. Scripts: `packages/scripts/src`. UI: `packages/ui/src` and stories.

### Tips for AI changes

- Lead with a minimal Vitest or Storybook test; mock network via MSW. Prefer operation wrappers over raw Prisma in tests.
- Scope Turbo tasks; keep ESM‑compatible imports; avoid cross‑package test utility imports—rely on `@studio/*` packages.

### VS Code prompts

- Reusable AgentOS prompts live at `.github/prompts/` (e.g., `AgentOS-Create-Spec`, `AgentOS-Build-Feature-from-Spec`, `AgentOS-Execute-Spec-Tasks`).

Reference: Detailed architecture, DB test isolation, and Turborepo practices are in `CLAUDE.md`. Product behavior, tasks, and timelines live in `.agent-os/`.
