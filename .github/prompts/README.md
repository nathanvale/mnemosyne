# VS Code Agent Prompts Index

This folder contains reusable prompt templates aligned to this repo’s patterns (pure ESM, @studio/\* imports, Vitest + MSW, Prisma, Storybook). Use these with VS Code agent/chat tools.

## Categories

- AgentOS workflows
  - AgentOS-Create-Spec.prompt.md
  - AgentOS-Build-Feature-from-Spec.prompt.md
  - AgentOS-Execute-Spec-Tasks.prompt.md
  - AgentOS-Create-Tests.prompt.md
  - AgentOS-Fix-Test-Suite.prompt.md
- Utilities
  - Create TSDoc.prompt.md
  - Add new eslint plugin.prompt.md
  - One prompt to rule them all.prompt.md (legacy prompt creator)
- Porting
  - Claude-Command-Porter.prompt.md (convert ~/.claude/commands to VS Code prompts)

## Naming & conventions

- Use `AgentOS-*` prefix for prompts tied to `.agent-os/specs` workflows.
- Keep prompts concise; include Inputs, Rules, Actions, Deliverables blocks.
- Ground behavior in repo conventions (ESM, `@studio/*`, MSW, Prisma, `@studio/logger`).

## How to port Claude commands

1. Open Claude-Command-Porter.prompt.md
2. Paste the Claude command text and answer the follow-up inputs
3. It will generate a VS Code prompt file with proper structure and repo rules

## Suggested cleanup (non-breaking)

- Keep “One prompt to rule them all” for ad-hoc authoring; prefer AgentOS-\* for day‑to‑day work.
- If two prompts overlap, keep the task‑specific AgentOS prompt and reference utilities from there.
