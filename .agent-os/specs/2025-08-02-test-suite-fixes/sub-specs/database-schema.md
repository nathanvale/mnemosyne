# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-08-02-test-suite-fixes/spec.md

> Created: 2025-08-02
> Version: 1.0.0

## Schema Analysis

### Current Schema State

The database schema in `packages/db/prisma/schema.prisma` is well-designed with proper relationships:

```prisma
model Memory {
  id                String             @id @default(cuid())
  moodScores       MoodScore[]
  moodDeltas       MoodDelta[]
  // ... other fields
}

model MoodScore {
  id              String        @id @default(cuid())
  memoryId        String
  memory          Memory        @relation(fields: [memoryId], references: [id], onDelete: Cascade)
  // ... other fields
}
```

### Foreign Key Relationships

- **Memory → MoodScore**: One-to-many with cascade delete
- **MoodScore → MoodFactor**: One-to-many with cascade delete
- **Memory → MoodDelta**: One-to-many with cascade delete
- **Memory → DeltaPattern**: One-to-many with cascade delete

## Required Changes

### Test Data Creation Order

**Problem**: Tests create child records before parent records exist

**Solution**: Implement proper creation sequence in test utilities:

```typescript
// Test data factory pattern
async function createTestMemory(prisma: PrismaClient): Promise<Memory> {
  return await prisma.memory.create({
    data: {
      sourceMessageIds: JSON.stringify(['msg-1', 'msg-2']),
      participants: JSON.stringify(['user1', 'user2']),
      summary: 'Test memory summary',
      confidence: 8,
      contentHash: 'test-hash-' + Date.now(),
    },
  })
}

async function createTestMoodScore(
  prisma: PrismaClient,
  memoryId: string,
): Promise<MoodScore> {
  return await prisma.moodScore.create({
    data: {
      memoryId, // Must reference existing Memory
      score: 7.5,
      confidence: 0.85,
      descriptors: JSON.stringify(['positive', 'hopeful']),
      algorithmVersion: '1.0.0',
      processingTimeMs: 150,
    },
  })
}
```

### Transaction-Based Test Setup

**Problem**: Partial record creation leads to orphaned data

**Solution**: Use transactions for atomic test data creation:

```typescript
async function createCompleteTestData(prisma: PrismaClient) {
  return await prisma.$transaction(async (tx) => {
    const memory = await createTestMemory(tx)
    const moodScore = await createTestMoodScore(tx, memory.id)
    const moodFactors = await createTestMoodFactors(tx, moodScore.id)

    return { memory, moodScore, moodFactors }
  })
}
```

### Cleanup Order

**Problem**: Deleting parent records before children causes constraint violations

**Solution**: Respect cascade deletion order or use transactions:

```typescript
async function cleanupTestData(prisma: PrismaClient) {
  // Cascade deletes will handle child records automatically
  await prisma.memory.deleteMany({
    where: { contentHash: { startsWith: 'test-hash-' } },
  })
}
```

## Migration Requirements

**No database migrations needed** - Schema is correctly defined. Issues are in test implementation only.

## Performance Considerations

- Existing indexes are appropriate for test performance
- Transaction overhead in tests is acceptable for data integrity
- Cleanup operations should use batch deletes where possible

## Validation Rules

- Every MoodScore must reference an existing Memory
- Every MoodFactor must reference an existing MoodScore
- Every MoodDelta must reference an existing Memory
- Test utilities must validate these constraints before record creation
