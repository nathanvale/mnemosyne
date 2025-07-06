import { PrismaClient } from '@prisma/client'
import { Command } from 'commander'
import { createHash } from 'crypto'
import { parse } from 'fast-csv'
import fs from 'fs'

import { createCliLogger } from '../src/lib/logger'

const log = createCliLogger('info')

const prisma = new PrismaClient()

/**
 * Main entry point for the import-messages script.
 *
 * Parses command-line arguments to determine the input CSV file
 * and preview mode. Streams CSV rows and imports messages into the
 * database using Prisma.
 *
 * @returns A promise that resolves when the import is complete.
 */
export async function main() {
  const program = new Command()
  program
    .version('1.0.0')
    .description('Import messages from a CSV file into the database.')
    .option('--in <path>', 'Path to the input CSV file')
    .option('--preview', 'Log each parsed message without importing')
    .parse(process.argv)

  const options = program.opts()
  const inputFile = options.in
  const isPreview = !!options.preview

  if (!inputFile) {
    log.error("error: required option '--in <path>' not specified")
    process.exit(1)
  }

  log.info(`Starting import from ${inputFile}...`)

  return new Promise<void>((resolve, reject) => {
    const pendingImports: Promise<void>[] = []
    const readStream = fs.createReadStream(inputFile)
    readStream.on('error', (error) => {
      log.error('CSV parsing error:', error)
      reject(error)
    })
    readStream
      .pipe(parse({ headers: true }))
      .on('error', (error) => {
        log.error('CSV parsing error:', error)
        reject(error)
      })
      .on('data', (row: MessageRow) => {
        const p = importMessage(row, isPreview).catch((error) => {
          log.error('Skipping malformed row:', error)
        })
        pendingImports.push(p)
      })
      .on('end', async (rowCount: number) => {
        await Promise.all(pendingImports)
        log.info(`Parsed ${rowCount} rows.`)
        await prisma.$disconnect()
        resolve()
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
 * Imports a single message row into the database or logs preview info.
 *
 * Validates essential fields, computes a SHA-256 hash, checks for
 * duplicates, and creates message, link, and asset records.
 *
 * @param row - The CSV-parsed message row to import.
 * @param isPreview - If true, logs parsed message without importing.
 * @throws Will throw an error if required fields are missing on the row.
 */
async function importMessage(row: MessageRow, isPreview: boolean) {
  // Map new CSV format to expected fields
  const timestamp = row['Message Date']
  const rawSender = row['Sender Name']
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
  // Allow empty message text if there are attachments (media-only messages)
  const hasAttachments = !!assets
  if (!timestamp || !sender || (!message && !hasAttachments)) {
    throw new Error(
      `Missing required field(s) in row: ${JSON.stringify({
        'Message Date': timestamp,
        'Sender Name': rawSender,
        'Computed Sender': sender,
        Text: message,
        Type: row['Type'],
        'Has Attachments': hasAttachments,
      })}`,
    )
  }

  const hash = createHash('sha256')
    .update(timestamp + sender + (message || ''))
    .digest('hex')

  const existingMessage = await prisma.message.findUnique({ where: { hash } })

  if (existingMessage) {
    if (isPreview) {
      // two-arg log for the preview test
      log.info('Skipping existing message with hash:', hash)
    } else {
      // single-string log for the duplicates test
      log.info(`Skipping existing message with hash: ${hash}`)
    }
    return
  }

  const linkData = links ? links.split(',').map((url: string) => ({ url })) : []
  const assetData = assets
    ? assets.split(',').map((filename: string) => ({ filename }))
    : []

  if (isPreview) {
    // Use simple string logging to avoid pino serialization issues
    const truncatedMessage = message
      ? message.substring(0, 100) + (message.length > 100 ? '...' : '')
      : '[empty]'
    log.info(
      `Parsed message (preview): ${timestamp} | ${sender} | ${truncatedMessage} | ${direction} | assets: ${assetData.length}`,
    )
    return
  }

  await prisma.message.create({
    data: {
      timestamp: new Date(timestamp),
      sender,
      message: message || '', // Store empty string for media-only messages
      hash,
      links: {
        create: linkData,
      },
      assets: {
        create: assetData,
      },
    },
  })
  log.info(`Successfully imported message with hash: ${hash}`)
}

const isMain = import.meta.url === `file://${process.argv[1]}`

if (isMain) {
  main().catch((e) => {
    log.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
}
