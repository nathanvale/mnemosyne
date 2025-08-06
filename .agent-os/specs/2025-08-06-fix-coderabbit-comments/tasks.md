# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-08-06-fix-coderabbit-comments/spec.md

> Created: 2025-08-06
> Status: Ready for Implementation

## Tasks

- [x] 1. Fix filename consistency in API documentation
  - [x] 1.1 Write tests to verify filename convention consistency
  - [x] 1.2 Update API spec to use `subagent-stop.ts` instead of `subagent_stop.ts`
  - [x] 1.3 Update CLI examples in documentation
  - [x] 1.4 Verify all filename references are consistent
  - [x] 1.5 Verify all tests pass

- [x] 2. Enhance verification script robustness
  - [x] 2.1 Write tests for verification script edge cases
  - [x] 2.2 Add Node.js availability check to `.claude/verify-hooks.sh`
  - [x] 2.3 Implement graceful fallback when Node.js not available
  - [x] 2.4 Add appropriate warning messages for missing dependencies
  - [x] 2.5 Verify all tests pass

- [x] 3. Align JSON schema with TypeScript implementation
  - [x] 3.1 Write tests to validate configuration schema accuracy
  - [x] 3.2 Analyze actual TypeScript config interfaces
  - [x] 3.3 Update CONFIGURATION.md to match implementation
  - [x] 3.4 Fix property name mismatches in examples
  - [x] 3.5 Remove unsupported properties from documentation
  - [x] 3.6 Add missing supported properties to examples
  - [x] 3.7 Verify all tests pass

- [x] 4. Validate Code Rabbit comment resolution
  - [x] 4.1 Write integration tests for all fixes
  - [x] 4.2 Verify filename consistency fix resolves comments
  - [x] 4.3 Verify script robustness fix resolves comments
  - [x] 4.4 Verify JSON schema alignment resolves comments
  - [x] 4.5 Verify all tests pass
