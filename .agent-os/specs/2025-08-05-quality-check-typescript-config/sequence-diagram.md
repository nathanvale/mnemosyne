# Quality Check TypeScript Config Fix — Sequence Diagram and Summary

## Summary

Quality check hook respects tsconfig include/exclude patterns. Before type-checking a file, it validates inclusion via cached config parsing; excluded files skip TS check but still run ESLint, with clear logs.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer/Hook Runner
  participant QC as QualityCheck Hook
  participant Cfg as TS Config Validator (cached)
  participant TS as TypeScript Checker
  participant ESL as ESLint
  participant Log as Logger

  Dev->>QC: run on changed file path
  QC->>Cfg: isIncluded(file)? (loads tsconfig if needed)
  alt Included
    Cfg-->>QC: yes
    QC->>TS: typeCheck(file)
    TS-->>QC: diagnostics
  else Excluded
    Cfg-->>QC: no
    QC->>Log: info("TS skipped due to exclude")
  end
  QC->>ESL: lint(file)
  ESL-->>QC: results
  QC-->>Dev: combined report
```

## Notes

- Cache tsconfig parsing for performance.
- Preserve TDD dummy file generation for included files only.
- Clear, non-noisy logs for skipped TS checks.
