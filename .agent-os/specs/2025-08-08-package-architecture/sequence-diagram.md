# Package Architecture — Sequence Diagram and Summary

## Summary

Monorepo with @studio/\* packages, shared configs, and Turbo orchestration enabling modular development and builds.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer/CI
  participant Turbo as Turborepo
  participant Pkgs as @studio/* packages
  participant Apps as apps/*

  Dev->>Turbo: run build/test
  Turbo->>Pkgs: build in dep order (workspace:)
  Pkgs-->>Turbo: artifacts/types
  Turbo->>Apps: build using packages
  Apps-->>Dev: app artifacts
```

## Notes

- Centralized TS/ESLint/Prettier; path aliases; ESM across repo.
