# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-05-quality-check-typescript-config/spec.md

> Created: 2025-08-05
> Version: 1.0.0

## Technical Requirements

- Parse tsconfig.json exclusion patterns including `exclude` array and glob patterns
- Implement file path matching against exclusion patterns using minimatch or similar
- Cache parsed TypeScript configuration to avoid repeated file system reads
- Maintain existing TDD dummy file generation for files included in TypeScript project
- Preserve all existing ESLint and other checker functionality unchanged
- Add comprehensive logging for debugging file inclusion/exclusion decisions

## Approach Options

**Option A:** Modify existing TypeScript checker with inline exclusion logic

- Pros: Minimal code changes, keeps logic centralized
- Cons: Makes the TypeScript checker more complex, harder to test exclusion logic separately

**Option B:** Create separate configuration validation utility (Selected)

- Pros: Separates concerns, easier to test, reusable for other checkers if needed
- Cons: Slight increase in code complexity with additional utility

**Option C:** Skip TypeScript checking entirely for test files

- Pros: Simple implementation
- Cons: Too broad, would skip checking for test files that should be included

**Rationale:** Option B provides the best balance of maintainability and functionality. It allows for proper separation of concerns between TypeScript checking logic and project configuration validation, making both easier to test and maintain.

## External Dependencies

No new external dependencies required. The implementation will use:

- Existing `typescript` module for reading tsconfig.json
- Node.js built-in `path` and `fs` modules for file operations
- Existing minimatch patterns already used in the codebase

## Implementation Details

### Configuration Validation Utility

- Create `packages/claude-hooks/src/quality-check/typescript-config-validator.ts`
- Export functions for parsing exclusion patterns and validating file inclusion
- Cache parsed configurations by tsconfig.json file path

### TypeScript Checker Updates

- Modify `packages/claude-hooks/src/quality-check/checkers/typescript.ts`
- Add exclusion validation before creating TypeScript program
- Skip TypeScript checking with clear logging for excluded files
- Preserve all existing TDD and import error handling logic

### Error Handling

- Graceful fallback if tsconfig.json parsing fails (default to checking all files)
- Clear error messages for configuration issues
- Debug logging for troubleshooting file inclusion decisions
