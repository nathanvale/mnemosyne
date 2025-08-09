# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-09-fix-flaky-calibration-test/spec.md

> Created: 2025-08-09
> Version: 1.0.0

## Test Coverage

### Unit Tests

**AlgorithmCalibrationManager**

- Verify constructor accepts optional randomSource parameter
- Verify default behavior uses Math.random when randomSource not provided
- Verify custom randomSource is used when provided
- Verify applyParameterAdjustments uses the configured randomSource

**Test Helper Functions**

- createDeterministicRandomSource returns values according to pattern
- Pattern cycles correctly when called more times than pattern length
- Returns appropriate values for success (> 0.1) and failure (<= 0.1)

### Integration Tests

**Calibration System with Deterministic Source**

- Test with 100% success pattern validates all adjustments succeed
- Test with 0% success pattern validates all adjustments fail
- Test with mixed pattern achieves expected success rate
- Original flaky test now passes consistently with 70% success pattern

### Regression Tests

**Existing Tests Compatibility**

- All existing calibration system tests continue to pass
- Tests not explicitly using randomSource continue using Math.random
- No changes required to existing test assertions
- Performance characteristics remain unchanged

## Test Scenarios

### Scenario 1: Deterministic 70% Success Rate

```typescript
// Exactly 14 successes out of 20 attempts
const pattern = [...Array(14).fill(true), ...Array(6).fill(false)]
const randomSource = createDeterministicRandomSource(pattern)
// Should consistently achieve 70% success rate
```

### Scenario 2: Alternating Success Pattern

```typescript
// Alternating success and failure
const pattern = [true, false, true, false]
const randomSource = createDeterministicRandomSource(pattern)
// Should achieve exactly 50% success rate
```

### Scenario 3: Default Random Behavior

```typescript
// No randomSource provided
const manager = new AlgorithmCalibrationManager()
// Should use Math.random as before
```

## Mocking Requirements

**Math.random Mocking**

- Not required with the dependency injection approach
- Existing tests using vi.spyOn(Math, 'random') continue to work
- New deterministic approach doesn't interfere with other mocks

**Random Source Verification**

- Use vi.fn() to verify randomSource is called correct number of times
- Verify randomSource is called once per applyParameterAdjustments call

## Test Execution Plan

1. **Run existing tests** - Verify all pass before changes
2. **Implement changes** - Add randomSource parameter
3. **Update flaky test** - Use deterministic source
4. **Run full test suite** - Ensure no regressions
5. **Run test multiple times** - Verify flaky test is now stable
6. **CI/CD validation** - Ensure tests pass in CI environment

## Success Criteria

- The flaky test passes 100% of the time (run 100+ times to verify)
- All other calibration tests continue to pass
- No performance degradation in test execution
- Code coverage remains at or above current levels
- CI/CD pipeline shows consistent green builds
