# Turborepo Monorepo Setup — Sequence Diagram and Summary

## Summary

A high-performance monorepo pipeline with Turborepo. It computes precise cache keys from inputs, env, and global deps; executes tasks in topological order; restores cached outputs on hits; and orchestrates build/test/lint/type-check with pnpm workspaces for fast local and CI cycles.

## Sequence diagram

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer/CI
  participant Turbo as Turborepo Runner
  participant Cache as Local Cache Store
  participant PkgA as Package A
  participant PkgB as Package B (depends on A)
  participant Lint as ESLint
  participant Type as TS Build
  participant Test as Vitest/Wallaby

  Dev->>Turbo: turbo run build,test,lint,typecheck --filter ...
  Turbo->>Turbo: Resolve pipeline (topological order, ^build)
  Turbo->>Turbo: Compute cache key (inputs, lockfile, env:74, global deps)
  Turbo->>Cache: Check cache for PkgA#build
  alt cache hit (PkgA)
    Cache-->>Turbo: Restore outputs (dist, tsbuildinfo)
  else miss (PkgA)
    Turbo->>PkgA: Run build script
    PkgA-->>Turbo: Build artifacts
    Turbo->>Cache: Save outputs + metadata
  end

  Turbo->>Cache: Check cache for PkgB#build (includes PkgA hash)
  alt cache hit (PkgB)
    Cache-->>Turbo: Restore outputs
  else miss (PkgB)
    Turbo->>PkgB: Run build script
    PkgB-->>Turbo: Build artifacts
    Turbo->>Cache: Save outputs
  end

  Turbo->>Lint: Run lint (cached, changed files only)
  Lint-->>Turbo: Results
  Turbo->>Type: Run type-check (uses tsbuildinfo caching)
  Type-->>Turbo: Results
  Turbo->>Test: Run tests (pass-through env: worker ids)
  Test-->>Turbo: Results + coverage
  Turbo-->>Dev: Summary (cache hits, tasks executed)
```

## Notes

- Inputs tracked: src/\*\*, config files, package.json, lockfile, tsconfig, env.
- Outputs tracked: dist/\*\*, .tsbuildinfo, generated clients, storybook builds.
- Filtering: --filter to target packages; topological order ensures correctness.
- Env handling: pass-through for tests and CI; global deps changes invalidate cache.
- Dev UX: persistent dev servers are non-cached; CI benefits most from cache hits.
