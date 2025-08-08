# NPM Package Distribution — Sequence Diagram and Summary

## Summary

Package @studio/claude-hooks for npm with bin commands that work in monorepo (TS via tsx) and as compiled JS for external users. Build to dist/, map bins, fix shebangs, and maintain config resolution.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Maintainer
  participant Build as Build Pipeline (esbuild)
  participant Pkg as package.json
  participant NPM as npm pack/install
  participant CLI as Bin Entrypoints
  participant User as Consumer (monorepo/external)

  Dev->>Build: pnpm build (@studio/claude-hooks)
  Build->>Pkg: read exports/bin
  Build-->>Dev: dist/* (compiled JS)
  Dev->>NPM: npm pack / publish (later)
  par Monorepo usage
    User->>CLI: claude-hooks-stop (TS via tsx)
    CLI-->>User: executes hooks
  and External usage
    User->>NPM: npm i -g / npx @studio/claude-hooks
    User->>CLI: claude-hooks-stop (dist JS)
    CLI-->>User: executes hooks
  end
```

## Notes

- Shebang fix for cross-platform execution.
- Dual mode: dev TS and prod JS.
- Keep upward config discovery logic intact.
