# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-08-09-emotional-significance-weighting/spec.md

> Created: 2025-08-09
> Version: 1.0.0
> Status: Test Strategy Defined

## Test Coverage Strategy

### Unit Tests

**EmotionalSignificanceWeighter Class**

- Calculate significance with all 5 factors present
- Calculate significance with missing emotional context
- Calculate significance with missing relationship dynamics
- Handle invalid memory data gracefully
- Verify weighted score calculation accuracy
- Test narrative generation for different significance levels
- Validate error handling returns default low significance

**PriorityManager Class**

- Create prioritized list from multiple memories
- Sort memories by significance correctly
- Generate appropriate review context for high significance
- Generate appropriate review context for low significance
- Calculate significance distribution accurately
- Handle empty memory list
- Handle single memory list

**Significance Factor Calculators**

- Test emotional intensity with various emotion counts
- Test relationship impact with different interaction qualities
- Test life event detection with multiple keywords
- Test participant vulnerability with various roles
- Test temporal importance with recent and old memories
- Verify all factors return values between 0 and 1

### Integration Tests

**Memory Prioritization Workflow**

- Process batch of 100+ memories
- Verify correct priority ordering
- Ensure all memories receive significance scores
- Test error resilience with some invalid memories
- Verify logging output for debugging

**Queue Optimization Workflow**

- Test high-significance-focus strategy selection
- Test balanced-sampling strategy with time constraints
- Test significance-weighted default strategy
- Verify time estimation for different expertise levels
- Calculate coverage metrics correctly
- Handle empty queue gracefully

### Performance Tests

**Batch Processing Performance**

- Process 1000 memories in reasonable time
- Memory usage remains stable during large batches
- No memory leaks in repeated calculations
- Optimization strategies scale linearly

### Edge Cases

**Boundary Conditions**

- Significance score exactly at threshold boundaries
- All memories with identical significance
- Extreme significance values (0.0 and 1.0)
- Empty or null emotional context
- Missing participant information
- Invalid timestamp formats

**Error Scenarios**

- Memory with corrupted data
- Circular references in memory relationships
- Extremely long content strings
- Invalid UTF-8 characters in content
- Missing required memory fields

## Test Implementation Guidelines

### Test Data Preparation

Create fixtures for:

- High emotional intensity memories
- Relationship-defining moments
- Major life events
- Vulnerable participant scenarios
- Recent vs old memories
- Memories with various significance levels

### Assertion Strategies

**Significance Scores**

- Assert overall score is weighted average of factors
- Verify each factor contributes correctly to overall
- Check score boundaries (0.0 to 1.0)

**Priority Ordering**

- Assert higher significance memories rank higher
- Verify priority ranks are sequential
- Check distribution counts match actual categories

**Review Context**

- Assert focus areas match high factor scores
- Verify validation hints are relevant
- Check review reasons are human-readable

### Mocking Requirements

**External Dependencies**

- Mock @studio/logger for test output control
- Mock date/time for temporal importance tests
- Use test memories with known characteristics

**No Mocking Needed**

- Significance calculations (pure functions)
- Priority sorting (deterministic)
- Strategy selection (rule-based)

## Test Execution Patterns

### Unit Test Pattern

```typescript
describe('EmotionalSignificanceWeighter', () => {
  let weighter: EmotionalSignificanceWeighter

  beforeEach(() => {
    weighter = createSignificanceWeighter()
  })

  it('calculates high significance for emotional intensity', () => {
    const memory = createTestMemory({
      emotionalContext: {
        intensity: 0.9,
        primaryEmotion: 'grief',
        secondaryEmotions: ['sadness', 'loneliness', 'despair'],
        themes: ['loss', 'mourning'],
      },
    })

    const score = weighter.calculateSignificance(memory)

    expect(score.factors.emotionalIntensity).toBeGreaterThan(0.8)
    expect(score.overall).toBeGreaterThan(0.7)
    expect(score.narrative).toContain('highly significant')
  })
})
```

### Integration Test Pattern

```typescript
describe('Queue Optimization', () => {
  it('optimizes queue based on time constraints', () => {
    const memories = generateTestMemories(100)
    const queue: ValidationQueue = {
      id: 'test-queue',
      pendingMemories: memories,
      resourceAllocation: {
        availableTime: 30, // 30 minutes
        validatorExpertise: 'intermediate',
      },
    }

    const weighter = createSignificanceWeighter()
    const optimized = weighter.optimizeReviewQueue(queue)

    // Should select ~6 memories (5 min each for intermediate)
    expect(optimized.optimizedOrder).toHaveLength(6)
    expect(optimized.strategy.name).toBe('balanced-sampling')
  })
})
```

## Expected Test Results

### Coverage Targets

- Line coverage: >90%
- Branch coverage: >85%
- Function coverage: 100%
- Statement coverage: >90%

### Performance Benchmarks

- Single significance calculation: <10ms
- Batch of 100 memories: <500ms
- Batch of 1000 memories: <5 seconds
- Queue optimization: <100ms

### Quality Metrics

- All significance scores between 0.0 and 1.0
- Priority ordering 100% consistent with significance
- Review context generation 100% success rate
- Error handling covers all edge cases
