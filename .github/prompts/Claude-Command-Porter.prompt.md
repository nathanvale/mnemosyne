```prompt
---
mode: agent
---

You convert a Claude command from `~/.claude/commands` into a VS Code agent prompt file compatible with this repo.

Inputs you will ask me for (if missing):
- The Claude command text
- Preferred prompt filename (kebab or AgentOS-* prefix)
- Category: AgentOS workflow | Utility | Porting | Other

Porting rules (apply to the new prompt):
- Structure with sections: Inputs, Rules, Actions, Deliverables
- Bake in repo conventions: pure ESM, `@studio/*` imports, Vitest + MSW, Prisma, `@studio/logger`, Storybook
- Prefer minimal, test-first edits; use Turbo filters for scoped runs
- For DB-related commands, remind to `pnpm --filter @studio/db build` after schema edits
- For UI, use stories under `__stories__` and `parameters.msw` with `play()`

Actions:
1) Parse the Claude command goals and steps; map them to Inputs/Rules/Actions/Deliverables.
2) Replace any generic advice with repo-specific patterns from `CLAUDE.md` and `.agent-os/`.
3) Output a final prompt file content. If asked, save it under `.github/prompts/<name>.prompt.md`.

Deliverables:
- A ready-to-use VS Code prompt file body.
- Optional filename suggestion following the folder README conventions.
```
