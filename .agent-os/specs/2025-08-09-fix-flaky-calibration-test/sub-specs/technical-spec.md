# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-09-fix-flaky-calibration-test/spec.md

> Created: 2025-08-09
> Version: 1.0.0

## Technical Requirements

### Core Issue

- Test relies on `Math.random() > 0.1` to simulate 90% success rate
- Over 20 iterations, expected to achieve ≥70% success (14/20 successes)
- Due to randomness, sometimes only achieves 65% (13/20 successes)
- Located in `packages/memory/src/mood-scoring/__tests__/calibration-system.test.ts` line 448

### Solution Requirements

- Make test behavior deterministic while preserving production randomness
- Allow tests to control the success/failure pattern
- Ensure backward compatibility with existing tests
- Minimal changes to production code

## Approach Options

### Option A: Mock Math.random in Tests

- Use vi.spyOn to mock Math.random with predetermined values
- Pros: No production code changes, simple implementation
- Cons: Affects all code using Math.random in the test

### Option B: Dependency Injection (Selected)

- Add optional parameter to control randomness in test mode
- Pros: Precise control, doesn't affect other code, clear intent
- Cons: Minimal production code modification needed

### Option C: Environment Variable Flag

- Use environment variable to switch between random and deterministic
- Pros: No API changes
- Cons: Less explicit, harder to control per-test

**Rationale:** Option B provides the best balance of control, clarity, and minimal impact. It allows tests to be explicit about their requirements while keeping production code essentially unchanged.

## Implementation Details

### 1. Modify AlgorithmCalibrationManager

Add an optional `randomSource` parameter to the class that defaults to Math.random:

```typescript
class AlgorithmCalibrationManager {
  private randomSource: () => number

  constructor(
    config?: Partial<CalibrationConfig>,
    baselineMetrics?: ValidationMetrics,
    randomSource?: () => number, // Optional for testing
  ) {
    this.randomSource = randomSource || (() => Math.random())
    // ... existing constructor code
  }

  private async applyParameterAdjustments(
    adjustment: CalibrationAdjustment,
  ): Promise<boolean> {
    // Use this.randomSource instead of Math.random
    return this.randomSource() > 0.1 // 90% success rate
  }
}
```

### 2. Create Test Helper

Create a deterministic random source generator for tests:

```typescript
function createDeterministicRandomSource(pattern: boolean[]): () => number {
  let index = 0
  return () => {
    const shouldSucceed = pattern[index % pattern.length]
    index++
    return shouldSucceed ? 0.11 : 0.09 // > 0.1 succeeds, <= 0.1 fails
  }
}
```

### 3. Update Flaky Test

Use the deterministic source to ensure exactly 70% success rate:

```typescript
it('should simulate parameter adjustment with high success rate', async () => {
  // Create pattern with exactly 14 successes and 6 failures (70% success rate)
  const pattern = [
    ...Array(14).fill(true), // 14 successes
    ...Array(6).fill(false), // 6 failures
  ]

  const randomSource = createDeterministicRandomSource(pattern)
  const manager = new AlgorithmCalibrationManager({}, undefined, randomSource)

  // ... rest of test remains the same
})
```

## External Dependencies

No new external dependencies required. The solution uses existing testing framework (Vitest) capabilities.

## Performance Considerations

- No performance impact on production code
- Deterministic tests may run slightly faster due to predictable behavior
- No additional memory overhead in production

## Backward Compatibility

- All existing tests continue to work without modification
- Production code behavior unchanged when randomSource not provided
- Optional parameter maintains API compatibility
