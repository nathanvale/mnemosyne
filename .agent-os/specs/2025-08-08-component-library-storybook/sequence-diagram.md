# Component Library + Storybook — Sequence Diagram and Summary

## Summary

UI component library with schema-driven validation, Storybook docs/tests, and a11y checks. Components are TS-first, Tailwind-styled, tested with Vitest/Testing Library, and documented via interactive stories.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer
  participant UI as @studio/ui Components
  participant Schema as @studio/schema
  participant SB as Storybook
  participant Test as Vitest + @storybook/addon-vitest
  participant A11y as addon-a11y

  Dev->>UI: implement component (TS + Tailwind)
  UI->>Schema: validate props/data (zod)
  Dev->>SB: write stories (args/controls)
  SB-->>Dev: interactive docs + autodocs
  Test->>SB: run story tests (interactions)
  Test-->>Dev: assertions pass/fail
  A11y->>SB: run accessibility checks
  A11y-->>Dev: report issues
```

## Notes

- Story-driven development with live playground.
- Testing covers unit, interaction, and a11y.
