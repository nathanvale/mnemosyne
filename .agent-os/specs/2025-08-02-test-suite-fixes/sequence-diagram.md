# Test Suite Fixes — Sequence Diagram and Summary

## Summary

Comprehensive stabilization of the test infrastructure to reach ≥95% pass rate and <10% skipped. Fixes foreign key violations by enforcing parent-first data setup, cleans mock strategy and module import mismatches, introduces centralized test data factories with transactions and cleanup, and re-enables 59 performance tests. No schema changes; systemic test setup overhaul.

## Mermaid Sequence Diagram

```mermaid
sequenceDiagram
  autonumber
  participant Dev as Developer/CI
  participant Runner as Vitest/Wallaby
  participant Factory as TestDataFactory
  participant Prisma as Prisma (@studio/db)
  participant Modules as ModuleResolver
  participant Mocks as MockManager
  participant Perf as PerformanceHarness
  participant Reporter as CI/Test Reporter

  Dev->>Runner: run tests
  Runner->>Factory: request test fixtures (Memory → MoodScore → Factors → Deltas)
  Factory->>Prisma: $transaction(create Memory)
  Prisma-->>Factory: Memory{id}
  Factory->>Prisma: create MoodScore(memoryId)
  Prisma-->>Factory: MoodScore{id}
  Factory->>Prisma: create dependent records (factors, deltas)
  Prisma-->>Factory: ack
  Runner->>Modules: resolve imports
  Modules-->>Runner: ensure correct exports (AlgorithmCalibrationManager)
  Runner->>Mocks: register isolated mocks (no shadowing)
  Mocks-->>Runner: mock bindings ready
  par Performance suites
    Runner->>Perf: initialize performance test environment
    Perf->>Prisma: seed controlled datasets
    Perf-->>Runner: ready (timeouts, baselines configured)
  end
  Runner-->>Dev: results (pass %, skipped %, failures)
  Runner->>Reporter: publish metrics to CI
  Reporter-->>Dev: health summary and thresholds
```

## Notes

- Enforce creation order: Memory → MoodScore → MoodFactor → Deltas; use $transaction.
- Rename local mocks to avoid shadowing real imports; DI-friendly interfaces.
- Fix import name mismatches (CalibrationSystem → AlgorithmCalibrationManager).
- Re-enable 4 perf suites with deterministic data and time control.
- CI thresholds: ≥95% pass, <10% skipped; report and fail on regressions.
