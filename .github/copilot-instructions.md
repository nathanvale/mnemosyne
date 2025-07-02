# .github/copilot-instructions.yml

# 👋 Welcome to the GitHub Copilot custom instructions for this repo.

# These help Copilot understand the goals, stack, and conventions of your project.

name: Nathan's MVP – Relationship Memory Engine

description: >
This repo is a minimal Next.js 15 App Router MVP designed to import
timestamped text message history
(CSV between Nathan and Melanie), extract AI-inferred traits/events/observations, and use that
memory to power downstream GPT features like meme generation and journaling. The backend stack
includes Prism ORM, SQLite, and tRPC. Testing is fully driven by Vitest with MSW and Wallaby,
and component development happens in Storybook.

tags:

- nextjs
- vitest
- msw
- storybook
- prisma
- tailwindcss
- trpc
- sqlite
- openai
- memory-engine
- csv-import
- relationship-insights

context:

- This is an MVP project. Keep all implementations lean and test-driven.
- Use MSW to mock all network behavior. Only happy paths are registered globally. Edge cases are per test or story.
- Prisma is used for DB access: tables are `messages` (raw text) and `memory` (AI-inferred facts).
- Wallaby is used for fast feedback on Vitest tests.
- AI-generated memory objects are stored with fields like: `type`, `subject`, `summary`, `date?`, and `source_message_ids`.

code_style:

- TypeScript only
- App Router + Server Components where possible
- Tailwind CSS for styling
- Use `@/` alias for `src/`
- Shared mocks live in `@/mocks/handlers/*.ts` and are reused in both Vitest + Storybook

copilot:

- Favor test-first suggestions using Vitest + MSW
- Scaffold Storybook stories with `parameters.msw` and `play()` using `userEvent`
- Use AI model output to generate memory objects from messages
- Avoid overly complex Next.js configurations — keep routes and pages simple
- Encourage reusable TRPC routers, not giant monoliths

# ✅ This file should live at: .github/copilot-instructions.yml
