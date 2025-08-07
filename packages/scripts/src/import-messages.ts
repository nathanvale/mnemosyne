import { PrismaClient } from '@studio/db'
import { cli, debug } from '@studio/logger'
import { Command } from 'commander'
import { createHash } from 'crypto'
import { parse } from 'fast-csv'
import fs from 'fs'

export const prisma: PrismaClient = new PrismaClient()

/**
 * Creates a stable content-based hash for message deduplication.
 * Identical content produces identical hashes regardless of file position.
 */
function createContentHash(
  timestamp: string,
  sender: string,
  senderId: string,
  message: string,
  assets: string,
): string {
  // Simple, stable hash based on actual message content
  const content = [
    timestamp,
    sender || '',
    senderId || '',
    message || '',
    assets || '',
  ].join('|')

  return createHash('sha256').update(content).digest('hex')
}

// Global tracking for summary
interface ImportError {
  rowIndex: number
  error: Error
  rowData?: Partial<MessageRow>
}

let importErrors: Array<ImportError> = []
let processedCount = 0
let skippedCount = 0
let importedCount = 0
let duplicatesSkipped = 0
let isDebugMode = false
let logger: ReturnType<typeof cli>

// Track hashes within this import session to prevent duplicate imports
const importSessionHashes = new Set<string>()

/**
 * Main entry point for the import-messages script.
 *
 * Parses command-line arguments to determine the input CSV file
 * and preview mode. Streams CSV rows and imports messages into the
 * database using Prisma.
 *
 * @param customPrisma - Optional Prisma client to use instead of the default (for testing)
 * @returns A promise that resolves when the import is complete.
 */
export async function main(customPrisma?: PrismaClient) {
  const prismaClient = customPrisma || prisma
  const program = new Command()
  program
    .version('1.0.0')
    .description('Import messages from a CSV file into the database.')
    .option('--in <path>', 'Path to the input CSV file')
    .option('--preview', 'Log each parsed message without importing')
    .option('--debug', 'Enable debug mode with structured logging')
    .parse(process.argv)

  const options = program.opts()
  const inputFile = options.in
  const isPreview = !!options.preview
  isDebugMode = !!options.debug

  // Choose appropriate logger based on debug mode
  // Use new preset functions for cleaner API
  logger = isDebugMode
    ? debug() // Pretty print with callsite links for debugging
    : cli() // Pretty print without callsite for CLI feedback

  // Reset counters for this run
  importErrors = []
  processedCount = 0
  skippedCount = 0
  importedCount = 0
  duplicatesSkipped = 0
  importSessionHashes.clear()

  if (!inputFile) {
    logger.error("error: required option '--in <path>' not specified")
    process.exit(1)
  }

  const startTime = Date.now()
  logger.info('Starting CSV import', {
    inputFile,
    isPreview,
    isDebugMode,
    startTime: new Date(startTime).toISOString(),
  })

  return new Promise<void>((resolve, reject) => {
    const pendingImports: Array<Promise<void>> = []
    let rowIndex = 0

    const readStream = fs.createReadStream(inputFile)
    readStream.on('error', (error) => {
      logger.error('File read error', { error: error.message, inputFile })
      reject(error)
    })

    readStream
      .pipe(parse({ headers: true }))
      .on('error', (error) => {
        logger.error('CSV parsing error', { error: error.message, inputFile })
        reject(error)
      })
      .on('data', (row: MessageRow) => {
        rowIndex++
        processedCount++

        const currentRowIndex = rowIndex // Capture the current row index for the closure
        const p = importMessage(
          row,
          isPreview,
          currentRowIndex,
          prismaClient,
        ).catch((error) => {
          importErrors.push({
            rowIndex: currentRowIndex,
            error,
            rowData: {
              'Message Date': row['Message Date'],
              'Sender Name': row['Sender Name'],
              'Sender ID': row['Sender ID'],
              Text:
                row['Text']?.substring(0, 50) +
                (row['Text']?.length > 50 ? '...' : ''),
              Type: row['Type'],
            },
          })

          if (isDebugMode) {
            logger.error('Failed to import message', {
              rowIndex: currentRowIndex,
              error: error.message,
              rowData: {
                'Message Date': row['Message Date'],
                'Sender Name': row['Sender Name'],
                'Sender ID': row['Sender ID'],
                Text:
                  row['Text']?.substring(0, 100) +
                  (row['Text']?.length > 100 ? '...' : ''),
                Type: row['Type'],
              },
            })
          }
          // Suppress individual errors in non-debug mode for cleaner output
        })
        pendingImports.push(p)
      })
      .on('end', async (rowCount: number) => {
        await Promise.all(pendingImports)

        const endTime = Date.now()
        const duration = endTime - startTime

        // Print summary
        printImportSummary(rowCount, duration, inputFile, isPreview)

        await prismaClient.$disconnect()

        // Give logger time to flush before resolving
        setTimeout(() => {
          resolve()
        }, 100)
      })
  })
}

/**
 * Represents a single row of the input CSV with message data.
 * Maps to the new CSV format with columns like 'Chat Session', 'Message Date', etc.
 */
interface MessageRow {
  /** Chat session identifier. */
  'Chat Session': string
  /** ISO string of the message timestamp. */
  'Message Date': string
  /** ISO string of the delivered timestamp. */
  'Delivered Date': string
  /** ISO string of the read timestamp. */
  'Read Date': string
  /** ISO string of the edited timestamp. */
  'Edited Date': string
  /** Service type (SMS, iMessage, etc). */
  Service: string
  /** Message type/direction (Incoming, Outgoing). */
  Type: string
  /** Sender identifier. */
  'Sender ID': string
  /** Sender name. */
  'Sender Name': string
  /** Message status. */
  Status: string
  /** Message this is replying to. */
  'Replying to': string
  /** Message subject. */
  Subject: string
  /** Text content of the message. */
  Text: string
  /** Attachment filename or path. */
  Attachment: string
  /** Type of attachment. */
  'Attachment type': string
}

/**
 * Prints a comprehensive summary of the import operation.
 */
function printImportSummary(
  totalRows: number,
  duration: number,
  inputFile: string,
  isPreview: boolean,
) {
  const successRate =
    totalRows > 0
      ? (
          ((importedCount + skippedCount + duplicatesSkipped) / totalRows) *
          100
        ).toFixed(1)
      : '0'
  const rowsPerSecond =
    duration > 0 ? (totalRows / (duration / 1000)).toFixed(1) : '0'

  logger.info('Import Summary', {
    inputFile,
    totalRows,
    processedCount,
    importedCount,
    skippedCount,
    duplicatesSkipped,
    errorCount: importErrors.length,
    successRate: `${successRate}%`,
    duration: `${(duration / 1000).toFixed(2)}s`,
    rowsPerSecond: `${rowsPerSecond} rows/s`,
    isPreview,
  })

  // Print error details if any
  if (importErrors.length > 0) {
    // Group errors by type for cleaner summary
    const errorsByType = new Map<string, Array<ImportError>>()
    const duplicateErrors: Array<ImportError> = []
    const realErrors: Array<ImportError> = []

    importErrors.forEach((importError) => {
      const errorMessage = importError.error.message
      const isDuplicate =
        errorMessage.includes('duplicate') ||
        errorMessage.includes('constraint')

      if (isDuplicate) {
        duplicateErrors.push(importError)
      } else {
        realErrors.push(importError)
      }

      const errorType = errorMessage.includes('Missing required field')
        ? 'Missing Fields'
        : isDuplicate
          ? 'Duplicate'
          : importError.error.constructor.name

      if (!errorsByType.has(errorType)) {
        errorsByType.set(errorType, [])
      }
      errorsByType.get(errorType)!.push(importError)
    })

    // Check if all errors are duplicates
    const allErrorsAreDuplicates = realErrors.length === 0

    if (allErrorsAreDuplicates) {
      // If all errors are duplicates, show a friendly message instead of error logs
      const duplicateCount = duplicateErrors.length
      logger.info(
        `Import completed successfully. ${duplicateCount} duplicate${duplicateCount > 1 ? 's' : ''} were skipped (this is normal for data with repeated content).`,
      )
    } else {
      // Only show error logs if there are real (non-duplicate) errors
      logger.error(
        `Import completed with ${realErrors.length} error${realErrors.length > 1 ? 's' : ''}`,
      )

      // Print summary by error type (excluding duplicates from error count)
      errorsByType.forEach((errors, errorType) => {
        if (errorType !== 'Duplicate') {
          logger.error(
            `${errorType}: ${errors.length} occurrence${errors.length > 1 ? 's' : ''}`,
            {
              errorType,
              count: errors.length,
              examples: errors.slice(0, 3).map((e) => ({
                rowIndex: e.rowIndex,
                message: e.error.message,
                rowData: e.rowData,
              })),
            },
          )
        }
      })

      // In debug mode, show detailed structured logging for real errors
      if (isDebugMode && realErrors.length > 0) {
        logger.error('Detailed error analysis (real errors only)', {
          totalRealErrors: realErrors.length,
          totalDuplicates: duplicateErrors.length,
          realErrors: realErrors.map((e) => ({
            rowIndex: e.rowIndex,
            errorType: e.error.constructor.name,
            errorMessage: e.error.message,
            stackTrace: e.error.stack,
            rowData: e.rowData,
            timestamp: new Date().toISOString(),
          })),
        })
      } else if (realErrors.length > 20) {
        logger.warn(
          `${realErrors.length} real errors occurred. Use --debug flag for detailed error analysis.`,
        )
      }

      // Show duplicate summary if there were duplicates alongside real errors
      if (duplicateErrors.length > 0) {
        logger.info(
          `Additionally, ${duplicateErrors.length} duplicate${duplicateErrors.length > 1 ? 's' : ''} were skipped (this is normal).`,
        )
      }
    }
  } else if (duplicatesSkipped > 0 || skippedCount > 0) {
    const totalDuplicates = duplicatesSkipped + skippedCount
    logger.info(
      `Import completed successfully. ${totalDuplicates} duplicate${totalDuplicates > 1 ? 's' : ''} were skipped (this is normal for data with repeated content).`,
    )
  } else {
    logger.info('Import completed successfully with no errors or duplicates.')
  }
}

/**
 * Extract URLs from text content
 * Matches both http(s) and www. style URLs
 */
function extractUrls(text: string): Array<string> {
  const urlRegex = /(?:https?:\/\/|www\.)[^\s<>"']+/gi
  const matches = text.match(urlRegex) || []

  // Normalize URLs to start with https://
  return matches.map((url) => {
    if (url.startsWith('www.')) {
      return `https://${url}`
    }
    return url
  })
}

/**
 * Deduplicate URLs (case-insensitive)
 */
function deduplicateUrls(urls: Array<string>): Array<string> {
  const seen = new Set<string>()
  return urls.filter((url) => {
    const normalized = url.toLowerCase()
    if (seen.has(normalized)) {
      return false
    }
    seen.add(normalized)
    return true
  })
}

/**
 * Imports a single message row into the database or logs preview info.
 *
 * Validates essential fields, computes a SHA-256 hash, checks for
 * duplicates, and creates message, link, and asset records.
 *
 * @param row - The CSV-parsed message row to import.
 * @param isPreview - If true, logs parsed message without importing.
 * @param rowIndex - The row number for error reporting.
 * @param prismaClient - The Prisma client to use for database operations.
 * @throws Will throw an error if required fields are missing on the row.
 */
async function importMessage(
  row: MessageRow,
  isPreview: boolean,
  rowIndex: number,
  prismaClient: PrismaClient,
) {
  // Map new CSV format to expected fields
  const timestamp = row['Message Date']
  const rawSender = row['Sender Name']
  const senderId = row['Sender ID']
  const message = row['Text']
  const direction =
    row['Type']?.toLowerCase() === 'incoming' ? 'incoming' : 'outgoing'

  // For outgoing messages, if Sender Name is empty, infer it's from Nathan
  // For incoming messages, use the Sender Name field
  const sender = direction === 'outgoing' && !rawSender ? 'Nathan' : rawSender

  // For now, we'll treat attachments as assets (extensible for future use)
  const assets = row['Attachment'] || ''
  // Links are not in the new format yet, but keep the field for extensibility
  const links = '' as string

  // bail out on missing essential columns so the row is skipped
  if (!timestamp || !sender) {
    const missingFields = []
    if (!timestamp) missingFields.push('Message Date')
    if (!sender) missingFields.push('Sender Name')

    throw new Error(
      `Missing required field(s) [${missingFields.join(', ')}] in row ${rowIndex}: ${JSON.stringify(
        {
          'Message Date': timestamp || '[MISSING]',
          'Sender Name': rawSender || '[MISSING]',
          'Computed Sender': sender || '[MISSING]',
          'Sender ID': senderId || '[EMPTY]',
          Text: message || '[EMPTY]',
          Type: row['Type'] || '[MISSING]',
        },
      )}`,
    )
  }

  // Skip messages with no content (no text and no attachments)
  if (!message && !assets) {
    if (isDebugMode) {
      logger.debug('Skipping empty message', {
        rowIndex,
        sender,
        timestamp,
        reason: 'No text content or attachments',
      })
    }
    return
  }

  // Create stable hash based on actual message content
  const hash = createContentHash(
    timestamp,
    sender || '',
    senderId || '',
    message || '',
    assets || '',
  )

  // Check for in-memory duplicates (same hash within this import batch)
  if (importSessionHashes.has(hash)) {
    duplicatesSkipped++

    if (isDebugMode) {
      logger.debug('Skipping in-batch duplicate', {
        rowIndex,
        hash,
        sender,
        timestamp,
        messagePreview:
          (message || '[EMPTY]').substring(0, 50) +
          ((message || '').length > 50 ? '...' : ''),
        reason: 'Already processed in this import session',
      })
    }
    return
  }

  const existingMessage = await prismaClient.message.findUnique({
    where: { hash },
  })

  if (existingMessage) {
    skippedCount++

    if (isDebugMode) {
      logger.debug('Skipping duplicate message', {
        rowIndex,
        hash,
        sender,
        timestamp,
        messagePreview:
          (message || '[EMPTY]').substring(0, 50) +
          ((message || '').length > 50 ? '...' : ''),
        existingId: existingMessage.id,
      })
    } else if (isPreview) {
      // two-arg log for the preview test compatibility - only in debug for less noise
      if (isDebugMode) {
        logger.info('Skipping existing message with hash', { hash })
      }
    }
    // For normal import mode, don't log individual duplicates - summary will show total count
    return
  }

  // Extract URLs from message text
  const extractedUrls = extractUrls(message)

  // Combine URLs from CSV links field (if any) with extracted URLs
  const csvUrls = links
    ? links
        .split(',')
        .map((url: string) => url.trim())
        .filter(Boolean)
    : []
  const allUrls = [...csvUrls, ...extractedUrls]

  // Deduplicate URLs for this message
  const uniqueUrls = deduplicateUrls(allUrls)
  const linkData = uniqueUrls.map((url: string) => ({ url }))

  const assetData = assets
    ? assets.split(',').map((filename: string) => ({ filename }))
    : []

  if (isPreview) {
    const previewData = {
      rowIndex,
      timestamp,
      sender,
      senderId,
      message,
      hash,
      direction,
      links: linkData,
      assets: assetData,
    }

    if (isDebugMode) {
      logger.info('Parsed message (preview)', previewData)
    } else {
      logger.info('Parsed message (preview):', previewData)
    }
    return
  }

  // Mark this hash as processed in this session BEFORE attempting to create
  importSessionHashes.add(hash)

  await prismaClient.message.create({
    data: {
      timestamp: new Date(timestamp),
      sender,
      senderId,
      message: message || null, // Allow null for attachment-only messages
      hash,
      links: {
        create: linkData,
      },
      assets: {
        create: assetData,
      },
    },
  })

  importedCount++

  if (isDebugMode) {
    logger.debug('Successfully imported message', {
      rowIndex,
      hash,
      sender,
      timestamp,
      messagePreview:
        (message || '').substring(0, 50) +
        ((message || '').length > 50 ? '...' : ''),
      linksCount: linkData.length,
      assetsCount: assetData.length,
    })
  } else {
    logger.info(`Successfully imported message with hash: ${hash}`)
  }
}

const isMain = import.meta.url === `file://${process.argv[1]}`

if (isMain) {
  main().catch(async (e) => {
    // Use appropriate logger for errors
    const errorLogger = isDebugMode ? logger : cli({ level: 'error' })
    errorLogger.error('Script failed', {
      error: e.message,
      stack: isDebugMode ? e.stack : undefined,
    })
    await prisma.$disconnect()
    process.exit(1)
  })
}
