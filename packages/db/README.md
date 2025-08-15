# @studio/db

Prisma database client and schema management for the Mnemosyne monorepo.

## Features

- 🗄️ **Prisma ORM**: Type-safe database access
- 📊 **SQLite Database**: Lightweight, file-based storage
- 🔒 **Content Deduplication**: SHA-256 based message deduplication
- 🎯 **Memory Management**: Advanced clustering and mood scoring
- ⚡ **Optimized Queries**: Indexed fields for performance

## Installation

```bash
# Within the monorepo
pnpm add @studio/db
```

## Usage

```typescript
import { PrismaClient } from '@studio/db'
import { createMemory, findDuplicateMemories } from '@studio/db'

// Use Prisma client directly
const prisma = new PrismaClient()
const users = await prisma.user.findMany()

// Use helper operations
const memory = await createMemory(prisma, {
  content: 'Memory content',
  authorId: 'user-123',
})
```

## Dual Consumption Support

This package supports **dual consumption** - use TypeScript source in development for instant hot reload, or compiled JavaScript in production.

### How It Works

```json
{
  "exports": {
    ".": {
      "development": "./src/index.ts",
      "types": "./generated/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  }
}
```

### Important Notes

- Prisma client is always imported from `./generated/`
- Helper functions support dual consumption
- Run `pnpm --filter @studio/db build` after schema changes

## Schema

### Core Tables

- **Message**: Original messages with content hashing
- **Memory**: Processed memories with clustering support
- **ValidationStatus**: Memory validation tracking
- **DeltaHistory**: Mood score change tracking
- **AnalysisMetadata**: LLM analysis results

### Key Features

- Content-based deduplication using SHA-256
- Clustering fields for memory organization
- Mood scoring with confidence metrics
- Relationship and participant tracking

## Commands

```bash
# Generate Prisma client (after schema changes)
pnpm --filter @studio/db build

# Reset database (WARNING: destroys data)
pnpm db:reset

# Open Prisma Studio
pnpm --filter @studio/db studio
```

## Operations

### Memory Operations

```typescript
import { createMemory, updateMemory, findDuplicateMemories } from '@studio/db'

// Create with automatic clustering field initialization
const memory = await createMemory(prisma, {
  content: 'Memory content',
  authorId: 'user-123',
})

// Find duplicates by content hash
const duplicates = await findDuplicateMemories(prisma, contentHash)
```

### Clustering Operations

```typescript
import { updateClusterMetadata } from '@studio/db'

// Update clustering information
await updateClusterMetadata(prisma, memoryId, {
  clusterId: 'cluster-123',
  clusterLabel: 'Happy Memories',
})
```

## Migration Notes

### Dual Consumption Migration

This package was migrated to dual consumption architecture on 2025-08-15. Key changes:

- Prisma client remains in `./generated/` (not affected)
- Helper functions now support dual consumption
- Build command required after schema changes

### Database Location

- Development: `prisma/dev.db`
- Test: In-memory SQLite (`:memory:`)
- Production: Configured via DATABASE_URL

### Schema Updates

When updating the Prisma schema:

1. Edit `prisma/schema.prisma`
2. Run `pnpm --filter @studio/db build`
3. Create migration if needed
4. Update TypeScript code for new fields

## Testing

The package includes comprehensive tests:

```bash
# Run database tests
pnpm --filter @studio/db test

# Tests use in-memory SQLite for isolation
```

## Troubleshooting

### "Column does not exist" Error

Run `pnpm --filter @studio/db build` to regenerate Prisma client.

### Import Errors

Ensure you're importing from the correct path:

```typescript
// ✅ Correct
import { PrismaClient } from '@studio/db'

// ❌ Wrong
import { PrismaClient } from '@studio/db/generated'
```

## Contributing

This package is part of the Mnemosyne monorepo. See the main [README](../../README.md) for development setup.
