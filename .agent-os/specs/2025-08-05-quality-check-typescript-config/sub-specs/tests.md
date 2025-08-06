# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-05-quality-check-typescript-config/spec.md

> Created: 2025-08-05
> Version: 1.0.0

## Test Coverage

### Unit Tests

**TypeScriptConfigValidator**

- Should parse tsconfig.json exclude patterns correctly
- Should handle glob patterns like `**/*.test.ts` and `src/__tests__/**/*`
- Should validate file inclusion against exclude patterns
- Should cache parsed configurations for performance
- Should handle missing or malformed tsconfig.json gracefully
- Should resolve relative paths correctly in exclusion patterns

**TypeScript Checker**

- Should skip TypeScript checking for excluded test files
- Should log clear messages when files are skipped due to exclusions
- Should continue TypeScript checking for included files
- Should preserve existing TDD dummy file generation for included files
- Should handle edge cases like files in nested directories

### Integration Tests

**Quality Check Hook End-to-End**

- Should run quality checks on excluded test files without TypeScript errors
- Should continue to show ESLint errors for excluded test files when applicable
- Should maintain full functionality for included source files
- Should handle mixed scenarios with both included and excluded files

**Configuration Edge Cases**

- Should handle tsconfig.json with no exclude patterns
- Should handle multiple tsconfig.json files in monorepo setup
- Should handle symbolic links and unusual file paths
- Should work correctly when tsconfig.json changes during hook execution

### Mocking Requirements

**File System Operations**

- Mock `fs.readFile` for tsconfig.json reading in unit tests
- Mock `fs.existsSync` for file existence checks
- Create temporary test files for integration testing

**TypeScript Module**

- Mock TypeScript compilation APIs to isolate configuration validation logic
- Test configuration parsing without full TypeScript compilation overhead

## Performance Testing

- Verify configuration caching reduces file system reads
- Ensure exclusion pattern matching performs well with large file lists
- Test memory usage with multiple cached configurations

## Error Scenario Testing

- Malformed tsconfig.json files
- Missing tsconfig.json files
- Invalid glob patterns in exclude arrays
- Permission errors reading configuration files
- Circular references in TypeScript project references
