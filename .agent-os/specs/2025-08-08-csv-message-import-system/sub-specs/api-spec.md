# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-08-08-csv-message-import-system/spec.md

> Created: 2025-08-08
> Version: 1.0.0

## CLI Interface

### Command Structure

```bash
npx tsx packages/scripts/src/import-messages.ts [options] <file-path>
```

**Parameters:**

- `<file-path>` - Path to CSV file containing message data (required)

**Options:**

- `--debug` - Enable debug mode with verbose logging and detailed error reporting
- `--help` - Display help information and usage examples

### CLI Examples

```bash
# Basic import
npx tsx packages/scripts/src/import-messages.ts ./data/messages.csv

# Debug mode for troubleshooting
npx tsx packages/scripts/src/import-messages.ts --debug ./data/messages.csv

# Help and usage information
npx tsx packages/scripts/src/import-messages.ts --help
```

## CSV Schema

### Required Columns

**Message Data Fields:**

- `timestamp` - ISO 8601 timestamp or parseable date string
- `sender` - Display name or identifier of message sender
- `senderId` - Unique identifier for sender (optional)
- `message` - Message content text (optional for non-text messages)
- `assets` - Asset information or file attachments (optional)

### CSV Format Example

```csv
timestamp,sender,senderId,message,assets
2024-01-15T10:30:00.000Z,John Doe,john_doe_123,Hello everyone!,
2024-01-15T10:31:15.000Z,Jane Smith,jane_smith_456,How is everyone doing?,image.jpg
2024-01-15T10:32:30.000Z,Bob Johnson,bob_johnson_789,Great to see you all here,
```

## Content Hashing Algorithm

### Hash Generation Function

```typescript
function createContentHash(
  timestamp: string,
  sender: string,
  senderId: string,
  message: string,
  assets: string,
): string {
  const content = [
    timestamp,
    sender || '',
    senderId || '',
    message || '',
    assets || '',
  ].join('|')

  return createHash('sha256').update(content).digest('hex')
}
```

**Hash Components:**

- Deterministic field ordering for consistent hash generation
- Empty string fallbacks for optional fields to maintain hash stability
- Pipe separator (`|`) for field delimitation
- SHA-256 cryptographic hashing for collision resistance

## Progress Tracking Interface

### Real-Time Statistics

**Progress Counters:**

- `processedCount` - Total number of CSV rows processed
- `importedCount` - Number of messages successfully imported
- `skippedCount` - Number of messages skipped due to validation or processing issues
- `duplicatesSkipped` - Number of duplicate messages detected and skipped
- `errorCount` - Number of processing errors encountered

### Progress Display Format

```
Processing: 1,250 rows processed, 847 imported, 403 duplicates skipped, 0 errors
Import complete: 1,250 processed | 847 imported | 403 duplicates (32.2%) | 0 errors
Deduplication effectiveness: 403/1,250 = 32.2% duplicates eliminated
Processing time: 2.3 seconds (543 rows/second)
```

## Error Handling Interface

### Error Classification

**Error Types:**

- `ValidationError` - Missing required fields or invalid data formats
- `DatabaseError` - Database constraint violations or connection issues
- `ProcessingError` - General processing failures or unexpected exceptions

### Error Reporting Structure

```typescript
interface ImportError {
  rowIndex: number // CSV row number (1-based)
  error: Error // Original error object
  rowData?: Partial<MessageRow> // Partial row data for context
}
```

### Error Summary Format

```
Import Summary:
✅ Successfully imported: 847 messages
⚠️  Duplicates skipped: 403 messages (32.2%)
❌ Errors encountered: 3 messages

Error Details:
Row 156: ValidationError: Missing required field 'timestamp'
Row 423: DatabaseError: Constraint violation on sender field
Row 891: ProcessingError: Invalid date format in timestamp field
```

## Database Integration

### Message Table Schema

**Database Operations:**

- `INSERT` - Create new message records with generated hash
- `SELECT` - Check for existing messages by content hash
- `CONSTRAINT` - Unique constraint on hash field prevents duplicates

### Transaction Management

**Transaction Handling:**

- Individual row processing with error isolation
- Automatic rollback on constraint violations
- Graceful error recovery with continued processing
- Final transaction commit with batch optimization

### Relationship Management

**Related Table Population:**

- Link extraction and Link table population from message content
- Asset metadata parsing and Asset table population
- Foreign key relationship maintenance with Message table references
