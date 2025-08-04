# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-03-test-suite-transaction-isolation/spec.md

> Created: 2025-08-03
> Version: 1.0.0

## Storage Service API Enhancements

### MoodScoreStorageService

#### Enhanced storeMoodScore Method

**Purpose:** Store mood analysis with optional transaction context
**Current Signature:** `storeMoodScore(memoryId: string, moodAnalysis: MoodAnalysisResult, processingMetrics: object): Promise<StoredMoodScore>`
**Enhanced Signature:** `storeMoodScore(memoryId: string, moodAnalysis: MoodAnalysisResult, processingMetrics: object, tx?: PrismaTransaction): Promise<StoredMoodScore>`

**Parameters:**
- `memoryId`: string - ID of the Memory record
- `moodAnalysis`: MoodAnalysisResult - Analysis results to store
- `processingMetrics`: object - Processing duration and algorithm version
- `tx`: PrismaTransaction (optional) - Transaction context for isolation

**Response:** StoredMoodScore object with nested factors
**Errors:** ValidationError if Memory doesn't exist in transaction context

#### Enhanced storeMoodDelta Method

**Current Signature:** `storeMoodDelta(memoryId: string, delta: MoodDelta): Promise<StoredMoodDelta>`
**Enhanced Signature:** `storeMoodDelta(memoryId: string, delta: MoodDelta, tx?: PrismaTransaction): Promise<StoredMoodDelta>`

**Parameters:**
- `memoryId`: string - ID of the Memory record
- `delta`: MoodDelta - Delta analysis results
- `tx`: PrismaTransaction (optional) - Transaction context for isolation

### ValidationResultStorageService

#### Enhanced storeValidationResult Method

**Current Signature:** `storeValidationResult(memoryId: string, result: ValidationResult): Promise<StoredValidationResult>`
**Enhanced Signature:** `storeValidationResult(memoryId: string, result: ValidationResult, tx?: PrismaTransaction): Promise<StoredValidationResult>`

**Parameters:**
- `memoryId`: string - ID of the Memory record
- `result`: ValidationResult - Validation analysis results
- `tx`: PrismaTransaction (optional) - Transaction context for isolation

### DeltaHistoryStorageService

#### Enhanced storeDeltaHistory Method

**Current Signature:** `storeDeltaHistory(memoryId: string, history: DeltaHistoryEntry): Promise<StoredDeltaHistoryEntry>`
**Enhanced Signature:** `storeDeltaHistory(memoryId: string, history: DeltaHistoryEntry, tx?: PrismaTransaction): Promise<StoredDeltaHistoryEntry>`

**Parameters:**
- `memoryId`: string - ID of the Memory record
- `history`: DeltaHistoryEntry - Delta history data
- `tx`: PrismaTransaction (optional) - Transaction context for isolation

## TestDataFactory API Enhancements

### Enhanced createMemory Method

**Current Signature:** `createMemory(options?: object): Promise<string>`
**Enhanced Signature:** `createMemory(options?: object, tx?: PrismaTransaction): Promise<string>`

**Parameters:**
- `options`: object (optional) - Memory creation options
- `tx`: PrismaTransaction (optional) - Transaction context for creation

**Response:** Memory ID string
**Errors:** DatabaseError for creation failures, never returns null

### Enhanced createMoodScore Method

**Current Signature:** `createMoodScore(options?: object): Promise<string>`
**Enhanced Signature:** `createMoodScore(options?: object, tx?: PrismaTransaction): Promise<string>`

**Parameters:**
- `options`: object (optional) - MoodScore creation options
- `tx`: PrismaTransaction (optional) - Transaction context

**Response:** MoodScore ID string with guaranteed Memory existence
**Errors:** ValidationError if Memory doesn't exist in context

## Transaction Context Type

### PrismaTransaction Interface

```typescript
type PrismaTransaction = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]
```

**Purpose:** Type-safe transaction context parameter
**Usage:** Pass to storage methods for transaction isolation
**Backward Compatibility:** All transaction parameters are optional

## Error Handling

### ValidationError Scenarios

- **Memory Not Found:** When memoryId doesn't exist in transaction context
- **Invalid Data:** When required fields are missing or malformed
- **Constraint Violations:** When foreign key constraints fail

### DatabaseError Scenarios

- **Connection Issues:** When database is unavailable
- **Transaction Conflicts:** When concurrent modifications occur
- **Timeout Errors:** When operations exceed time limits

## Backward Compatibility

### Method Overloads

All enhanced methods maintain backward compatibility through optional transaction parameters:

```typescript
// Existing usage continues to work
await storageService.storeMoodScore(memoryId, analysis, metrics)

// New transaction-aware usage
await storageService.storeMoodScore(memoryId, analysis, metrics, tx)
```

### Migration Strategy

1. **Phase 1:** Add optional transaction parameters to all methods
2. **Phase 2:** Update TestDataFactory to use transaction context
3. **Phase 3:** Update tests to pass transaction context when needed
4. **Phase 4:** Validate backward compatibility with existing code