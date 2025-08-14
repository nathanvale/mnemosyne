# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-08-14-code-review-critical-fixes/spec.md

> Created: 2025-08-14
> Status: Ready for Implementation

## Tasks

- [x] 1. Security Remediation and Test Fixtures
  - [x] 1.1 Write tests for security file detection and validation
  - [x] 1.2 Remove or relocate `examples/vulnerable-code.ts` file
  - [x] 1.3 Create `test-fixtures/security-examples/` directory structure
  - [x] 1.4 Move security test examples to fixtures with clear warnings
  - [x] 1.5 Add `.gitignore` entries for any sensitive test data
  - [x] 1.6 Document test fixture usage in README
  - [x] 1.7 Verify all tests pass with new structure

- [x] 2. Environment Validation System
  - [x] 2.1 Write tests for environment validation logic
  - [x] 2.2 Create Zod schemas for all environment variables
  - [x] 2.3 Implement startup validation function
  - [x] 2.4 Add runtime validation for parseInt and type conversions
  - [x] 2.5 Create `.env.example` with all required variables
  - [x] 2.6 Add clear error messages for validation failures
  - [x] 2.7 Update CLI commands to use validation
  - [x] 2.8 Verify all tests pass with validation

- [x] 3. Async Architecture Refactoring
  - [x] 3.1 Write tests for async execution wrappers
  - [x] 3.2 Create async wrapper for execFile with timeout support
  - [x] 3.3 Replace execFileSync in `analyze-pr.ts` with async version
  - [x] 3.4 Replace execFileSync in `fetch-coderabbit.ts` with async version
  - [x] 3.5 Add progress indicators for long-running operations
  - [x] 3.6 Implement proper error boundaries and handling
  - [x] 3.7 Add graceful shutdown handling
  - [x] 3.8 Verify all async operations work correctly

- [ ] 4. Comprehensive Test Suite Implementation
  - [x] 4.1 Set up test structure and utilities
  - [x] 4.2 Write unit tests for security analysis functions
  - [x] 4.3 Write unit tests for CodeRabbit parser
  - [x] 4.4 Write unit tests for report generation
  - [x] 4.5 Write integration tests for CLI commands
  - [x] 4.6 Write integration tests for API interactions
  - [x] 4.7 Set up MSW for API mocking
  - [ ] 4.8 Achieve >80% code coverage (currently at 70.72% per Wallaby.js)
  - [x] 4.9 Ensure all tests pass in Wallaby.js and Vitest

- [x] 5. Architecture and Dependencies Cleanup
  - [x] 5.1 Write tests for refactored Task functionality
  - [x] 5.2 Fix mock Task anti-pattern in `security-data-integrator.ts`
  - [x] 5.3 Implement proper dependency injection
  - [x] 5.4 Add missing runtime dependencies to package.json
  - [x] 5.5 Fix TypeScript composite configuration
  - [x] 5.6 Update build scripts for new structure
  - [x] 5.7 Verify package builds and runs correctly
  - [x] 5.8 Run full quality check (`pnpm check`)
