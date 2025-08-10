# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-08-09-emotional-significance-weighting/spec.md

> Created: 2025-08-09
> Version: 1.0.0
> Status: Completed - All features implemented

## Technical Requirements

- Multi-factor emotional significance scoring with 5 weighted factors
- Priority-based memory queue ordering with review context generation
- Resource-optimized queue management with 3+ optimization strategies
- Batch processing capability with error resilience
- Integration with @studio/validation package for seamless workflow
- Comprehensive coverage metrics (emotional range, temporal span, participant diversity)
- Support for validator expertise levels (beginner, intermediate, expert)
- Human-readable narrative generation for significance explanations

## Approach Options

**Option A:** Simple Priority Scoring

- Pros: Simple implementation, fast calculation, easy to understand
- Cons: Limited factors, no optimization strategies, basic prioritization

**Option B:** Multi-Factor Significance Weighting with Optimization (Selected)

- Pros: Comprehensive factor analysis, multiple optimization strategies, resource awareness, detailed review context
- Cons: More complex implementation, requires tuning of weights

**Rationale:** Option B provides comprehensive emotional intelligence with resource optimization, enabling better validation focus on truly significant memories.

## External Dependencies

- **@studio/schema** - Memory and emotional context data structures
- **Justification:** Required for accessing memory emotional context and relationship dynamics
- **@studio/logger** - Structured logging system
- **Justification:** Needed for debugging and monitoring significance calculations

## Architecture Components

### EmotionalSignificanceWeighter

**Implementation**: `packages/validation/src/significance/weighter.ts`

Primary significance calculation engine:

- **calculateSignificance method**: `weighter.ts:44-74` - Main entry point calculating overall significance with 5 factors
- **Emotional intensity calculation**: `weighter.ts:155-190` - Evaluates emotional intensity (30% weight) using intensity value, secondary emotions count, and significant themes
- **Relationship impact assessment**: `weighter.ts:195-233` - Analyzes relationship dynamics (25% weight) through interaction quality and communication patterns
- **Life event significance**: `weighter.ts:238-291` - Detects major life events (20% weight) via tags and content keywords
- **Participant vulnerability**: `weighter.ts:296-352` - Assesses vulnerable participants (15% weight) by role and relationship type
- **Temporal importance**: `weighter.ts:357-403` - Calculates time-based significance (10% weight) with recency and special dates
- **Overall score calculation**: `weighter.ts:408-430` - Weighted average combination of all factors
- **Narrative generation**: `weighter.ts:435-480` - Creates human-readable significance explanations

### PriorityManager

**Implementation**: `packages/validation/src/significance/priority-manager.ts`

Queue management and optimization system:

- **createPrioritizedList**: `priority-manager.ts:20-48` - Creates sorted priority list with significance distribution
- **Review context generation**: `priority-manager.ts:109-154` - Generates focus areas and validation hints based on factor scores
- **Review reason generation**: `priority-manager.ts:159-178` - Creates human-readable review reasons
- **optimizeQueue method**: `priority-manager.ts:53-88` - Optimizes validation queue based on resource constraints
- **Strategy selection**: `priority-manager.ts:226-264` - Chooses optimization strategy based on queue characteristics
- **Strategy application**: `priority-manager.ts:269-315` - Applies selected strategy (high-significance-focus, balanced-sampling, significance-weighted)
- **Time estimation**: `priority-manager.ts:209-221` - Estimates validation time based on validator expertise
- **Coverage metrics**: `priority-manager.ts:320-404` - Calculates emotional range, temporal span, and participant diversity

### Significance Scoring Factors

**Implementation Details**:

#### Emotional Intensity (30% weight)

- **Location**: `weighter.ts:155-190`
- **Factors considered**:
  - Base intensity value from emotional context
  - Number of secondary emotions (complexity indicator)
  - Presence of significant themes (loss, love, achievement, trauma, joy)
- **Score range**: 0.3 (base) to 1.0 (maximum intensity)

#### Relationship Impact (25% weight)

- **Location**: `weighter.ts:195-233`
- **Factors considered**:
  - Interaction quality (transformative, defining, significant, meaningful)
  - Communication patterns (conflict, breakthrough, reconciliation, confession)
  - Number of participants (group dynamics complexity)
- **Score range**: 0.3 (base) to 1.0 (maximum impact)

#### Life Event Significance (20% weight)

- **Location**: `weighter.ts:238-291`
- **Detection methods**:
  - Tag matching against 14 life event categories
  - Content keyword matching (12 significant phrases)
  - Multiple keyword matches increase score
- **Score range**: 0.4 (base) to 1.0 (major life event)

#### Participant Vulnerability (15% weight)

- **Location**: `weighter.ts:296-352`
- **Assessment criteria**:
  - Vulnerable roles (child, patient, elderly, dependent)
  - Vulnerable relationships (parent, grandparent, caregiver)
  - Vulnerable emotional themes (grief, trauma, illness, loss, abuse)
- **Score range**: 0.3 (base) to 1.0 (highly vulnerable)

#### Temporal Importance (10% weight)

- **Location**: `weighter.ts:357-403`
- **Time-based factors**:
  - Recency (last 30 days: +0.2, last 90 days: +0.1)
  - Special dates (holidays, celebrations)
  - Weekend memories (family time indicator)
- **Score range**: 0.5 (base) to 1.0 (maximum temporal significance)

### Optimization Strategies

**Implementation**: `priority-manager.ts:226-315`

Three adaptive strategies based on queue characteristics:

1. **High-Significance Focus** (`priority-manager.ts:275-280`)
   - Triggered when >30% of memories have high significance
   - Filters memories with significance ≥0.7
   - Parameters: minSignificance: 0.7, diversityWeight: 0.3

2. **Balanced Sampling** (`priority-manager.ts:282-308`)
   - Used when time is limited (<60 minutes available)
   - Allocates: 40% high, 40% medium, 20% low significance
   - Ensures diverse coverage across significance levels

3. **Significance-Weighted** (`priority-manager.ts:310-313`)
   - Default strategy for general cases
   - Simple top-N selection by significance score
   - Parameters: significanceWeight: 0.7, diversityWeight: 0.3

### Performance Characteristics

**Batch Processing**: `weighter.ts:79-123`

- Handles errors gracefully with default low significance assignment
- Logs errors without failing entire batch
- Optimized for processing large memory sets

**Time Complexity**:

- Single memory significance: O(1) - all calculations are linear
- Batch prioritization: O(n log n) - dominated by sorting
- Queue optimization: O(n) - linear strategy application

**Memory Usage**:

- Minimal memory overhead per significance calculation
- Priority lists maintain references, not copies
- Optimization metrics calculated on-demand

## Configuration Management

**Significance Weights Configuration**:

```typescript
// weighter.ts:412-418
const weights = {
  emotionalIntensity: 0.3,
  relationshipImpact: 0.25,
  lifeEventSignificance: 0.2,
  participantVulnerability: 0.15,
  temporalImportance: 0.1,
}
```

**Expertise-Based Time Estimates**:

```typescript
// priority-manager.ts:213-220
expert: 3 minutes per memory
intermediate: 5 minutes per memory
beginner: 8 minutes per memory
```

**Significance Thresholds**:

```typescript
// priority-manager.ts:194-200
high: ≥0.7
medium: ≥0.4 and <0.7
low: <0.4
```

## API Integration

**Public Interface**: `packages/validation/src/index.ts`

```typescript
// Factory function export
export { createSignificanceWeighter } from './significance/weighter'

// Type exports
export type {
  EmotionalSignificanceWeighter,
  EmotionalSignificanceScore,
  PrioritizedMemory,
  PrioritizedMemoryList,
  ValidationQueue,
  OptimizedQueue,
} from './types'
```

**Usage Example**:

```typescript
import { createSignificanceWeighter } from '@studio/validation'

const weighter = createSignificanceWeighter()
const score = weighter.calculateSignificance(memory)
const prioritizedList = weighter.prioritizeMemories(memories)
const optimizedQueue = weighter.optimizeReviewQueue(queue)
```

## Integration Points

### With Auto-Confirmation (Issue #88)

- Significance scores can adjust confidence thresholds
- High-significance memories require higher confidence for auto-approval
- Priority queues feed into review workflow for manual validation

### With Validation Package

- Seamless integration via factory function
- Shared TypeScript interfaces
- Common logging infrastructure

## Success Metrics Implementation

**Human Agreement Target**: 85%+ correlation

- Achieved through 5-factor comprehensive analysis
- Narrative explanations improve human understanding

**Resource Optimization Target**: 80%+ time on significant memories

- Optimization strategies ensure focus on high-significance items
- Time allocation based on significance distribution

**Queue Effectiveness Target**: 60%+ reduction in critical memory review time

- Priority ordering ensures critical memories reviewed first
- Review context speeds up validation decisions
