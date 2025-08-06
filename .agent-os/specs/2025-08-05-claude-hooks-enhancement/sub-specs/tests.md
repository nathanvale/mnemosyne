# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-05-claude-hooks-enhancement/spec.md

> Created: 2025-08-05
> Version: 1.0.0

## Test Coverage

### Unit Tests

**Platform Detection Tests**

- Correctly identifies macOS/Windows/Linux platforms
- Handles unknown platforms gracefully
- Respects platform override from environment variable

**Audio System Tests**

- macOS: Validates afplay command construction
- Windows: Validates PowerShell command construction
- Linux: Tests fallback chain (aplay → paplay → play)
- Handles missing sound files appropriately
- Validates custom sound file paths

**Event Processing Tests**

- Parses valid JSON input from stdin
- Handles malformed JSON gracefully
- Validates event type discrimination
- Processes optional event data correctly
- Handles missing or invalid transcript paths

**Configuration Loading Tests**

- Loads configuration from JSON files
- Merges environment variables correctly
- Applies default values appropriately
- Validates configuration schema
- Handles missing configuration files

**Logging System Tests**

- Creates log files in correct directories
- Appends to existing log files
- Handles file system errors gracefully
- Formats log entries correctly
- Implements log rotation when size exceeded

### Integration Tests

**Notification Hook Integration**

- Plays correct sound on each platform
- Respects quiet hours configuration
- Applies cooldown period between sounds
- Falls back to speech on macOS with --speak flag
- Logs events to correct file

**Stop Hook Integration**

- Plays completion sound after task
- Processes chat transcripts when available
- Handles missing transcript files
- Respects --chat flag for transcript processing
- Creates separate chat log file

**SubagentStop Hook Integration**

- Plays completion sound for subagent
- Logs subagent details correctly
- Handles missing subagent data
- Works with different subagent types

**Cross-Platform Integration**

- Hooks work on macOS with system sounds
- Hooks work on Windows with WAV files
- Hooks work on Linux with available player
- Graceful degradation when audio unavailable

### Feature Tests

**End-to-End Hook Execution**

- Claude Code triggers notification → user hears sound
- Claude completes task → completion sound plays
- Subagent finishes → appropriate notification
- Multiple hooks can run concurrently
- Hooks don't block Claude Code execution

**Configuration Management**

- Changes to hook-config.json take effect immediately
- Environment variables override JSON config
- Global vs local configuration precedence
- Speech mode works on macOS only

**Error Scenarios**

- Audio system unavailable → silent failure with logs
- Sound files missing → fallback or silent failure
- Invalid configuration → use defaults
- Malformed input → exit gracefully
- File system errors → continue without logging

### Mocking Requirements

**File System Mocks**

- Mock fs.readFileSync for configuration loading
- Mock fs.writeFileSync for logging
- Mock fs.existsSync for sound file checks
- Mock fs.mkdirSync for log directory creation

**Child Process Mocks**

- Mock execSync for audio commands
- Simulate successful audio playback
- Simulate audio command failures
- Mock different platform behaviors

**Platform Mocks**

- Mock os.platform() for cross-platform testing
- Mock process.env for environment variables
- Mock Date.now() for cooldown testing
- Mock setTimeout for delay testing

**Input/Output Mocks**

- Mock process.stdin for event input
- Mock console methods for logging
- Mock process.exit for exit codes
- Mock JSON.parse for input processing

## Test Implementation Strategy

### Test Framework

- Use Vitest (already configured in package)
- Leverage existing test utilities from @studio/test-config
- Follow monorepo testing patterns

### Test Structure

```
packages/claude-hooks/src/__tests__/
├── hooks/
│   ├── notification.test.ts
│   ├── stop.test.ts
│   └── subagent-stop.test.ts
├── utils/
│   ├── audio.test.ts
│   ├── config.test.ts
│   ├── logger.test.ts
│   └── platform.test.ts
└── integration/
    ├── cross-platform.test.ts
    └── end-to-end.test.ts
```

### Coverage Goals

- Unit test coverage: 90%+
- Integration test coverage: 80%+
- Critical paths: 100% coverage
- Error handling: Comprehensive coverage

### Performance Considerations

- Audio commands should complete within 500ms
- Configuration loading < 50ms
- Event processing < 10ms
- No blocking operations in main thread
