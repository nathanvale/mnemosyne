# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-14-code-review-critical-fixes/spec.md

> Created: 2025-08-14
> Version: 1.0.0

## Test Coverage

### Unit Tests

**Security Validators**
- Environment variable validation with valid inputs
- Environment variable validation with invalid inputs
- Missing required environment variables handling
- Type conversion validation (parseInt, parseFloat)
- Zod schema validation for all input types

**Async Utilities**
- execFile wrapper with successful execution
- execFile wrapper with timeout handling
- execFile wrapper with error handling
- Progress indicator start/stop behavior
- Graceful shutdown signal handling

**Core Security Analysis**
- Pattern detection for hardcoded credentials
- Vulnerability scoring algorithm accuracy
- Confidence threshold calculations
- Security rule application logic
- Report generation formatting

**CodeRabbit Parser**
- Valid CodeRabbit response parsing
- Malformed response handling
- Missing fields graceful degradation
- Type conversion and validation
- Data transformation accuracy

### Integration Tests

**CLI Command Workflows**
- `analyze-pr` command with valid PR number
- `analyze-pr` command with invalid PR number
- `analyze-pr` command with network timeout
- `fetch-coderabbit` command end-to-end
- `agent-wrapper` command with Task mock
- Error propagation through command chain
- Signal handling (SIGINT, SIGTERM)

**Environment Configuration**
- Loading from .env file
- Environment variable precedence
- Validation on startup
- Clear error messages for missing config
- Default value application

**External API Integration**
- GitHub API authentication and requests
- CodeRabbit API integration with retries
- Rate limiting handling
- Network error recovery
- Response caching behavior

### Feature Tests

**Complete PR Analysis Flow**
- Small PR analysis (< 100 lines)
- Medium PR analysis (100-1000 lines)
- Large PR analysis (> 1000 lines)
- Multi-file PR analysis
- PR with security vulnerabilities
- PR with no issues found

**Report Generation**
- JSON report format validation
- Markdown report formatting
- Console output formatting
- File output writing
- Report data completeness

### Mocking Requirements

**GitHub API**
- Mock PR data responses using MSW
- Mock file content responses
- Mock rate limit responses
- Mock authentication failures

**CodeRabbit API**
- Mock analysis responses
- Mock authentication flow
- Mock timeout scenarios
- Mock malformed responses

**File System**
- Mock file read/write operations
- Mock directory operations
- Mock permission errors

**Child Process**
- Mock git command execution
- Mock external tool execution
- Mock process signals

## Test Organization

### Directory Structure
```
packages/code-review/src/__tests__/
├── unit/
│   ├── validators/
│   │   ├── env-validator.test.ts
│   │   └── input-validator.test.ts
│   ├── utils/
│   │   ├── async-exec.test.ts
│   │   └── progress.test.ts
│   ├── core/
│   │   ├── security-analyzer.test.ts
│   │   └── report-generator.test.ts
│   └── parsers/
│       └── coderabbit-parser.test.ts
├── integration/
│   ├── cli/
│   │   ├── analyze-pr.test.ts
│   │   ├── fetch-coderabbit.test.ts
│   │   └── agent-wrapper.test.ts
│   ├── config/
│   │   └── env-config.test.ts
│   └── api/
│       ├── github-api.test.ts
│       └── coderabbit-api.test.ts
├── e2e/
│   ├── pr-analysis-flow.test.ts
│   └── report-generation.test.ts
└── fixtures/
    ├── mock-pr-data.ts
    ├── mock-coderabbit-responses.ts
    └── test-security-patterns.ts
```

### Test Utilities

**Test Database Setup**
- Not required for this package (no database operations)

**Mock Factories**
- `createMockPR()` - Generate test PR data
- `createMockCodeRabbitResponse()` - Generate API responses
- `createMockEnv()` - Set up test environment variables

**Test Helpers**
- `withTimeout()` - Test async operations with timeout
- `captureConsoleOutput()` - Capture CLI output for assertions
- `mockFileSystem()` - Set up file system mocks
- `setupMSWServer()` - Configure MSW for API mocking

### Coverage Requirements

**Minimum Coverage Targets:**
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

**Critical Path Coverage:**
- Security analysis functions: 95%
- Environment validation: 100%
- Error handling paths: 90%
- CLI command handlers: 85%

### Test Execution

**Wallaby.js Configuration**
- Ensure all tests run in Wallaby.js
- Exclude performance-intensive tests if needed
- Configure proper environment detection

**CI/CD Integration**
- Run full test suite on PR
- Generate coverage reports
- Fail build if coverage drops below thresholds
- Run security scanning on test fixtures