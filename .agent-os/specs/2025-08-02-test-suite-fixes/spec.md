# Spec Requirements Document

> Spec: Test Suite Fixes
> Created: 2025-08-02
> Status: Planning

## Overview

Fix critical test suite failures and re-enable skipped performance tests to achieve 95%+ test pass rate and <10% skipped tests. This comprehensive fix addresses foreign key constraint violations, mock strategy conflicts, module import errors, and test infrastructure improvements needed for Phase 2 mood scoring algorithm validation.

## User Stories

### Critical Test Reliability

As a developer working on the mood scoring algorithm, I want all tests to pass reliably, so that I can confidently validate mood analysis functionality and catch regressions.

**Workflow**: Developer runs wakkabyjs → sees 15 failing tests due to database setup issues → cannot validate mood analysis changes → blocked from Phase 2 development progress.

### Performance Test Enablement

As a team validating Phase 2 completion, I want performance tests enabled and passing, so that we can verify the <2 second response time requirement and 70%+ extraction success rate metrics.

**Workflow**: Team runs performance tests → 59 tests skipped due to infrastructure failures → cannot validate Phase 2 completion criteria → release milestone blocked.

### Test Health Monitoring

As a project maintainer, I want clear test health metrics and monitoring, so that test regressions are caught early and technical debt doesn't accumulate.

**Workflow**: CI pipeline runs → test failures masked by skipped tests → bugs slip into production → user experience degraded.

## Spec Scope

1. **Foreign Key Constraint Resolution** - Fix 7 failing tests with "Foreign key constraint violated" errors by implementing proper Memory record creation before dependent MoodScore records
2. **Mock Strategy Cleanup** - Resolve class name shadowing conflicts between real imports and test mocks in delta-history-tracking.test.ts
3. **Module Import/Export Fixes** - Correct CalibrationSystem vs AlgorithmCalibrationManager naming mismatches causing constructor errors
4. **Test Data Factory Implementation** - Create helper functions that respect database foreign key dependencies and proper setup order
5. **Performance Test Re-enablement** - Systematically fix and re-enable 59 skipped tests across 4 performance test suites

## Out of Scope

- Mood scoring algorithm precision fixes (will be addressed in separate spec)
- Database schema changes (schema is well-designed, issues are in test setup)
- Test framework replacement (Vitest configuration is correct)
- Performance optimization of actual application code

## Expected Deliverable

1. **95%+ test pass rate** - From current 81% (319/393) to target 95%+ with all critical business logic tests passing
2. **<10% skipped tests** - From current 15% (59/393) to <10% with systematic re-enablement of performance tests  
3. **Zero foreign key constraint violations** - All tests create proper database setup with Memory records before dependent records
4. **Clean test infrastructure** - Resolved mock conflicts, correct imports, proper test data factories with foreign key dependency management

## Spec Documentation

- Tasks: @.agent-os/specs/2025-08-02-test-suite-fixes/tasks.md
- Technical Specification: @.agent-os/specs/2025-08-02-test-suite-fixes/sub-specs/technical-spec.md
- Database Schema: @.agent-os/specs/2025-08-02-test-suite-fixes/sub-specs/database-schema.md
- Tests Specification: @.agent-os/specs/2025-08-02-test-suite-fixes/sub-specs/tests.md