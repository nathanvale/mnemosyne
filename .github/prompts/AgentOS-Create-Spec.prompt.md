```prompt
---
mode: agent
---

You are an expert product engineer working in a Next.js 15 + TypeScript (pure ESM) Turborepo.
Create a new Agent OS feature spec in `.agent-os/specs/YYYY-MM-DD-<kebab-slug>/` based on my idea.

Inputs you will ask me for (if missing):
- Feature title (short)
- One‑paragraph intent/value
- Desired scope (MVP)

Actions:
1) Propose a slug and date folder (use today), then create:
   - `spec.md` (Overview, Goals, Non‑Goals, Data model impacts, API/UX, Risks, Acceptance Criteria)
   - `tasks.md` with a measurable checklist (10–30 items) tied to acceptance criteria
   - `sub-specs/` (empty placeholder for future refinements)
2) Ground spec in this repo’s conventions:
   - Packages import via `@studio/*`; pure ESM; pnpm + Turbo; Vitest + MSW; Wallaby optional
   - DB: Prisma in `packages/db` (schema in `prisma/`, client in `generated/`)
   - Logging via `@studio/logger`; UI in `packages/ui` with stories under `__stories__`
3) Add explicit test strategy (unit/integration, MSW setup, jsdom where relevant) and DB isolation notes from `CLAUDE.md`.

Deliverables:
- New `.agent-os/specs/.../spec.md` + `tasks.md` + `sub-specs/`
- A short “How we’ll validate” section listing observable signals
- A PR‑ready summary block with scope, risks, and success metrics

Constraints:
- Keep focused and implementable (Phase‑sized). Avoid aspirational vagueness.
- Write in concise, actionable language.
```
