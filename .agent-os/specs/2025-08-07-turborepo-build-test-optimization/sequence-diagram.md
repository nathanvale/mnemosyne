# Turborepo Build/Test Optimization — Sequence Diagram and Summary

## Summary

Integrate build tests into Turborepo, deduplicate scripts, and clean package configs. Separate unit tests (src) from build tests (dist) with caching-aware pipeline.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer/CI
  participant Turbo as Turborepo
  participant Unit as test (src)
  participant Build as build (esbuild)
  participant TestBuild as test:build (dist)

  Dev->>Turbo: run pipeline
  Turbo->>Unit: run tests (cacheable)
  Unit-->>Turbo: results
  Turbo->>Build: compile to dist/ (cacheable)
  Build-->>Turbo: dist artifacts
  Turbo->>TestBuild: run tests against dist/
  TestBuild-->>Turbo: results
  Turbo-->>Dev: summary (cached where possible)
```

## Notes

- Remove redundant steps from scripts; rely on pipeline deps.
- Keep configs aligned with monorepo standards.
