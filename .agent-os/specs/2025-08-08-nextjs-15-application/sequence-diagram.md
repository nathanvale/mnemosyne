# Next.js 15 Application — Sequence Diagram and Summary

## Summary

Next.js 15 App Router app with TS, Tailwind, Storybook, and Vitest/MSW. Server components, API routes, and optimized builds.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant User as Browser
  participant Next as Next.js App Router
  participant API as Route Handlers (app/api/*)
  participant UI as Components (@studio/ui)

  User->>Next: navigate /page
  Next-->>User: SSR/CSR HTML + assets
  User->>Next: fetch /api/endpoint
  Next->>API: handler(req)
  API-->>Next: JSON
  Next-->>User: data
```

## Notes

- Storybook for component docs; Vitest for tests; MSW for mocks.
