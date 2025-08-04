# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-08-02-test-suite-fixes/spec.md

> Created: 2025-08-02
> Status: Ready for Implementation

## Tasks

- [ ] 1. Fix Foreign Key Constraint Violations
  - [ ] 1.1 Write tests for Memory creation utility functions
  - [ ] 1.2 Create test data factory that creates Memory records before dependent MoodScore records
  - [ ] 1.3 Update mood-score-storage tests to use proper Memory setup
  - [ ] 1.4 Fix 7 failing tests with "Foreign key constraint violated" errors
  - [ ] 1.5 Verify all MoodScore creation tests pass with proper Memory parent records

- [ ] 2. Resolve Mock Strategy Conflicts  
  - [ ] 2.1 Write tests for mock isolation patterns
  - [ ] 2.2 Rename MockDeltaHistoryStorageService to avoid shadowing real import in delta-history-tracking.test.ts
  - [ ] 2.3 Implement proper TypeScript namespacing for test mocks
  - [ ] 2.4 Ensure clear separation between production imports and test doubles
  - [ ] 2.5 Verify no mock class name conflicts across test suite

- [ ] 3. Fix Module Import/Export Mismatches
  - [ ] 3.1 Write tests for module resolution validation
  - [ ] 3.2 Correct CalibrationSystem import to use actual AlgorithmCalibrationManager export
  - [ ] 3.3 Fix constructor instantiation error in performance-analysis.test.ts
  - [ ] 3.4 Add TypeScript strict checking for import consistency
  - [ ] 3.5 Verify all module imports match actual exports across test files

- [ ] 4. Implement Test Data Factory Infrastructure
  - [ ] 4.1 Write tests for test data factory functions
  - [ ] 4.2 Create centralized factory functions that respect foreign key dependencies
  - [ ] 4.3 Implement transaction-based test setup utilities
  - [ ] 4.4 Add proper cleanup utilities with cascade deletion handling
  - [ ] 4.5 Verify test data factories work across all test suites

- [ ] 5. Re-enable Performance Test Suites
  - [ ] 5.1 Write tests for performance test infrastructure
  - [ ] 5.2 Fix setup failures in query-performance-simple.test.ts (9 skipped tests)
  - [ ] 5.3 Fix setup failures in query-performance.test.ts (20 skipped tests)  
  - [ ] 5.4 Fix setup failures in performance-analysis.test.ts (13 skipped tests)
  - [ ] 5.5 Fix setup failures in schema-optimization.test.ts (17 skipped tests)
  - [ ] 5.6 Verify all 59 performance tests are enabled and can execute

- [ ] 6. Fix Critical Business Logic Test Failures
  - [ ] 6.1 Write tests for significance calculation precision
  - [ ] 6.2 Fix position-based significance weighting calculation precision error
  - [ ] 6.3 Fix delta pattern storage and retrieval count mismatches
  - [ ] 6.4 Fix turning point storage and retrieval count mismatches
  - [ ] 6.5 Verify all 3 critical business logic tests pass with correct calculations

- [ ] 7. Establish Test Health Monitoring
  - [ ] 7.1 Write tests for test health metric collection
  - [ ] 7.2 Implement test health targets validation in CI pipeline
  - [ ] 7.3 Add test pass rate monitoring (target 95%+)
  - [ ] 7.4 Add skipped test percentage monitoring (target <10%)
  - [ ] 7.5 Verify all test health metrics are tracked and reported