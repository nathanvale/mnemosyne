# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-01-09-automatic-env-loading/spec.md

> Created: 2025-01-09
> Version: 1.0.0

## Test Coverage

### Unit Tests

**env-loader.ts**

- Loads .env file from monorepo root when not in test mode
- Loads .env.example when in test mode (NODE_ENV=test)
- Loads .env.example when VITEST environment variable is set
- Falls back gracefully when files don't exist
- Handles malformed .env files without crashing
- Respects existing environment variables (no override by default)

**auto-config.ts (environment substitution)**

- Substitutes ${VAR_NAME} with environment variable value
- Preserves ${VAR_NAME} when variable not found (with warning)
- Handles nested object substitution
- Handles array substitution
- Leaves non-string values unchanged

### Integration Tests

**CLI Entry Points**

- Stop hook loads ELEVENLABS_API_KEY from .env
- Notification hook loads configuration with env vars
- Quality hook loads linting tools configuration
- Cache tools load environment configuration
- All hooks work without manual environment exports

**Vitest Environment Loading**

- Tests use .env.example values, not .env
- Test environment variables are isolated from real environment
- Mocked API calls use example keys, never real keys
- Tests pass without .env file present

### Feature Tests

**End-to-End Environment Loading**

- Running `claude-hooks-stop --speak` loads ElevenLabs API key
- JSON configs with ${ELEVENLABS_API_KEY} get substituted value
- Multiple environment variables substitute correctly
- Nested configuration objects handle substitution
- Works from any directory in monorepo

**Developer Experience**

- New developer can copy .env.example to .env and run immediately
- Missing environment variables produce helpful warnings
- Debug mode shows which env file was loaded
- Clear error messages when API keys are missing

## Mocking Requirements

- **File System**: Mock fs.existsSync for testing file detection logic
- **Process Environment**: Mock process.env for isolation
- **dotenv.config**: Mock to test loading behavior without actual files
- **Console Methods**: Mock console.warn for testing warning messages

## Test Scenarios

### Positive Cases

1. Standard development setup with .env file
2. Test environment with .env.example
3. CI environment with environment variables set
4. Multiple environment variables in JSON config
5. Deeply nested configuration objects

### Negative Cases

1. Missing .env and .env.example files
2. Malformed .env file syntax
3. Missing required environment variables
4. Invalid JSON configuration files
5. Circular environment variable references

### Edge Cases

1. Empty .env file
2. .env with only comments
3. Environment variables with special characters
4. Very long environment variable values
5. Unicode in environment variable values

## Assertions

### Environment Loading

- `expect(process.env.ELEVENLABS_API_KEY).toBeDefined()`
- `expect(process.env.OPENAI_API_KEY).toBeDefined()`
- `expect(loadedPath).toBe(expectedPath)`

### Substitution

- `expect(config.apiKey).toBe(process.env.ELEVENLABS_API_KEY)`
- `expect(config.nested.value).toBe(process.env.SOME_VAR)`
- `expect(console.warn).toHaveBeenCalledWith('Warning: Environment variable...')`

### Test Isolation

- `expect(process.env.ELEVENLABS_API_KEY).toBe('test-key-example')`
- `expect(process.env.ELEVENLABS_API_KEY).not.toBe('sk_real_key')`

## Performance Tests

- Environment loading completes in < 10ms
- Substitution of 100 variables completes in < 50ms
- No memory leaks from repeated loading
- Synchronous loading doesn't block event loop
