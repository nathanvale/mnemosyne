# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-06-fix-coderabbit-comments/spec.md

> Created: 2025-08-06
> Version: 1.0.0

## Technical Requirements

### 1. Filename Convention Fixes

- Replace all instances of `subagent_stop.ts` with `subagent-stop.ts` in documentation
- Update CLI examples to use hyphen-based naming
- Ensure consistency across all API documentation

### 2. JSON Schema Alignment

- Update CONFIGURATION.md examples to match actual TypeScript interfaces
- Fix property name mismatches:
  - `soundEnabled` → `notify` (or match `SoundNotificationConfig`)
  - `speechEnabled` → `speak` (or match `SpeechConfig.enabled`)
  - `cooldownMs` → `cooldownPeriod` (or match implementation)
  - Quiet hours structure → `ranges: QuietHoursRange[]` array format
  - Logging properties → match `EventLoggerConfig` interface
  - Speech properties → match `SpeechConfig` interface

### 3. Script Robustness Improvements

- Add Node.js availability check in `.claude/verify-hooks.sh`
- Provide graceful fallback when Node.js is not available
- Display appropriate warning messages

### 4. Configuration Documentation Accuracy

- Align all documented properties with actual implementation
- Remove unsupported properties from examples
- Add missing supported properties to documentation

## Approach Options

**Option A:** Update Documentation to Match Implementation (Selected)

- Pros: Maintains API stability, no breaking changes, faster implementation
- Cons: May require users to update their understanding

**Option B:** Update Implementation to Match Documentation

- Pros: Maintains documented API contract
- Cons: Breaking changes, more complex, affects working systems

**Rationale:** Option A selected because the implementation is already working and deployed. Documentation should reflect reality rather than forcing implementation changes that could break existing users.

## External Dependencies

No new external dependencies required. All fixes involve updating existing documentation and script files.
