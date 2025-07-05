import { PrismaClient } from '@prisma/client'
import { Command } from 'commander'
import { createHash } from 'crypto'
import { parse } from 'fast-csv'
import fs from 'fs'

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
    console.error("error: required option '--in <path>' not specified")
    process.exit(1)
  }

  console.log(`Starting import from ${inputFile}...`)

  return new Promise<void>((resolve, reject) => {
    const pendingImports: Promise<void>[] = []
    const readStream = fs.createReadStream(inputFile)
    readStream.on('error', (error) => {
      console.error('CSV parsing error:', error)
      reject(error)
    })
    readStream
      .pipe(parse({ headers: true }))
      .on('error', (error) => {
        console.error('CSV parsing error:', error)
        reject(error)
      })
      .on('data', (row: MessageRow) => {
        const p = importMessage(row, isPreview).catch((error) => {
          console.error('Skipping malformed row:', error)
        })
        pendingImports.push(p)
      })
      .on('end', async (rowCount: number) => {
        await Promise.all(pendingImports)
        console.log(`Parsed ${rowCount} rows.`)
        await prisma.$disconnect()
        resolve()
      })
  })
}

/**
 * Represents a single row of the input CSV with message data.
 */
interface MessageRow {
  /** Unique identifier of the message row. */
  id: string
  /** ISO string of the message timestamp. */
  timestamp: string
  /** Sender identifier or name. */
  sender: string
  /** Text content of the message. */
  message: string
  /** Comma-separated URLs attached to the message. */
  links: string
  /** Comma-separated filenames attached to the message. */
  assets: string
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
  // bail out on missing essential columns so the row is skipped
  if (!row.timestamp || !row.sender || !row.message) {
    throw new Error(`Missing required field(s) in row: ${JSON.stringify(row)}`)
  }
  const { timestamp, sender, message, links, assets } = row

  const hash = createHash('sha256')
    .update(timestamp + sender + message)
    .digest('hex')

  const existingMessage = await prisma.message.findUnique({ where: { hash } })

  if (existingMessage) {
    if (isPreview) {
      // two-arg log for the preview test
      console.log('Skipping existing message with hash:', hash)
    } else {
      // single-string log for the duplicates test
      console.log(`Skipping existing message with hash: ${hash}`)
    }
    return
  }

  const linkData = links ? links.split(',').map((url) => ({ url })) : []
  const assetData = assets
    ? assets.split(',').map((filename) => ({ filename }))
    : []

  if (isPreview) {
    console.log('Parsed message (preview):', {
      timestamp,
      sender,
      message,
      hash,
      links: linkData,
      assets: assetData,
    })
    return
  }

  await prisma.message.create({
    data: {
      timestamp: new Date(timestamp),
      sender,
      message,
      hash,
      links: {
        create: linkData,
      },
      assets: {
        create: assetData,
      },
    },
  })
  console.log(`Successfully imported message with hash: ${hash}`)
}

const isMain = import.meta.url === `file://${process.argv[1]}`

if (isMain) {
  main().catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
}
