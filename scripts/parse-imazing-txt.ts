/**
 * @file
 * This script parses a text message history file exported from iMazing into a
 * structured CSV file. It's designed to handle large files efficiently by
 * reading the input line-by-line and processing messages in batches.
 *
 * @module iMazing-Parser
 *
 * @see {@link https://www.npmjs.com/package/fast-csv | fast-csv} for the library used to generate the CSV output.
 * @link See the project's documentation issue for more context on this script's development.
 *
 * @section Input File Format
 * The script expects a `.txt` file with a specific format:
 * - Messages are separated by a line of dashes: `----------------------------------------------------`
 * - Each message block starts with a header line: `YYYY-MM-DD HH:MM:SS from/to [Contact Name]`
 * - The lines following the header form the message body, which can include text, URLs, and asset filenames.
 *
 * @section Output CSV Format
 * The output is a CSV file without headers, containing the following columns:
 * 1. `id`: A unique, auto-incrementing integer for each message.
 * 2. `timestamp`: The message timestamp in ISO 8601 format (UTC).
 * 3. `sender`: The name of the message sender ('Nathan' or the contact name).
 * 4. `message`: The full, raw text content of the message.
 * 5. `links`: A comma-separated list of any URLs found in the message.
 * 6. `assets`: A comma-separated list of any asset filenames (e.g., `IMG_1234.jpeg`) found.
 *
 * @example
 * To run this script from the command line:
 * ```bash
 * pnpm tsx scripts/parse-imazing-txt.ts --in ./path/to/input.txt --out ./path/to/output.csv
 * ```
 */
import * as csv from 'fast-csv'
import fs from 'fs'
import linkify from 'linkify-it'
import { performance } from 'perf_hooks'
import readline from 'readline'

// TODO creating documentation for this script
/**
 * Defines the structure for a single parsed message object.
 */
interface Message {
  /** A unique, auto-incrementing ID for the message. */
  id: number
  /** The timestamp of the message in ISO 8601 format (UTC). */
  timestamp: string
  /** The sender of the message. */
  sender: 'Nathan' | 'Melanie'
  /** The raw text content of the message. */
  message: string
  /** A comma-separated string of all URLs found in the message. */
  links: string
  /** A comma-separated string of all asset filenames found in the message. */
  assets: string
}

// Regular expressions for parsing
/** Matches the header line of a message block to extract timestamp, direction, and sender. */
const headerRegex =
  /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) (from|to) (Melanie)$/
/** Matches common iOS asset filenames (images and videos) within a message body. */
const assetRegex = /([A-Z]{3,}_\d{4,}\.(jpeg|jpg|png|mov|heic|gif))/gi
/** The delimiter used to separate message blocks in the input file. */
const delimiter = '----------------------------------------------------'

// Initialize linkify
/** An instance of linkify-it used to find URLs in message text. */
const linkFinder = linkify()

/** A default estimate for the total number of messages, used for calculating ETA. */
const DEFAULT_ESTIMATED_TOTAL = 45000

/**
 * Parses command-line arguments to get the input and output file paths.
 * This function is designed for the script's CLI usage and will exit the process
 * if the required arguments (`--in`, `--out`) are not provided.
 *
 * @returns An object containing the input file path, output file path, and an optional preview flag.
 * @throws Will call `process.exit(1)` if required arguments are missing.
 */
function parseArgs(): { inFile: string; outFile: string; preview?: boolean } {
  const args = process.argv.slice(2)
  const inFlagIndex = args.indexOf('--in')
  const outFlagIndex = args.indexOf('--out')

  if (inFlagIndex === -1 || outFlagIndex === -1) {
    console.error(
      'Usage: tsx scripts/parse-imazing-txt.ts --in <input.txt> --out <output.csv>',
    )
    process.exit(1)
  }

  const inFile = args[inFlagIndex + 1]
  const outFile = args[outFlagIndex + 1]
  const preview = args.includes('--preview')

  if (!inFile || !outFile) {
    console.error('Missing input or output file path.')
    process.exit(1)
  }

  return { inFile, outFile, preview }
}

/**
 * Parses the entire input file, processing messages in batches and writing them to a CSV file.
 * This is the core function of the script, orchestrating the file reading, parsing, and writing.
 * It logs progress and performance metrics to the console.
 *
 * @param inFile - The path to the input text file.
 * @param outFile - The path where the output CSV file will be saved.
 * @param preview - If true, logs a preview of each parsed message to the console.
 * @returns A promise that resolves with the total number of messages parsed.
 */
async function parseFile(
  inFile: string,
  outFile: string,
  preview?: boolean,
): Promise<number> {
  const startTime = performance.now()
  let parsedCount = 0
  const inputStream = fs.createReadStream(inFile, { encoding: 'utf-8' })
  const outputStream = csv.format({ headers: false }) // No header as per requirement
  const rl = readline.createInterface({
    input: inputStream,
    crlfDelay: Infinity,
  })

  const csvStream = fs.createWriteStream(outFile)
  outputStream.pipe(csvStream)

  let messageId = 1
  let currentBlock: { header: string | null; body: string[] } = {
    header: null,
    body: [],
  }

  /**
   * A buffer to hold message blocks before they are processed.
   * This is a key part of the batching mechanism to avoid processing messages one-by-one,
   * which would be inefficient.
   */
  const blockBuffer: { header: string; body: string[] }[] = []
  /** The number of message blocks to process in a single batch. */
  const BATCH_SIZE = 500

  /**
   * Parses a single message block into a structured `Message` object.
   * It handles header validation, body trimming, and extraction of links and assets.
   *
   * @param block - An object containing the header line and an array of body lines for a single message.
   * @returns A promise that resolves with a `Message` object, or `null` if the block is invalid or empty.
   */
  async function parseBlock(block: {
    header: string
    body: string[]
  }): Promise<Message | null> {
    const bodyJoined = block.body.join('\n')
    const messageBody = bodyJoined.trim()
    if (!messageBody) {
      console.warn('Skipping block with empty message body.')
      return null
    }

    const headerMatch = block.header.match(headerRegex)
    if (!headerMatch) {
      console.warn('Skipping block with invalid header:', block.header)
      return null
    }
    const [, timestampStr, direction] = headerMatch

    let links = ''
    let assets = ''

    if (messageBody.includes('http')) {
      const matches = linkFinder.match(messageBody)
      links = matches ? matches.map((l) => l.url).join(',') : ''
    }

    if (/IMG_\d{4}/.test(messageBody)) {
      const matchedAssets = messageBody.match(assetRegex)
      assets = matchedAssets ? matchedAssets.join(',') : ''
    }

    const message: Message = {
      id: messageId++,
      // ensure we treat the input as UTC (avoid local-time shifts)
      timestamp: new Date(timestampStr.replace(' ', 'T') + 'Z').toISOString(),
      sender: direction === 'to' ? 'Nathan' : 'Melanie',
      message: messageBody,
      links,
      assets,
    }
    return message
  }

  /**
   * Processes an array of message blocks in parallel.
   * This function is central to the script's performance. It takes a batch of blocks,
   * calls `parseBlock` for each, filters out any invalid results, and writes the
   * valid messages to the CSV output stream. It also handles progress logging.
   *
   * @param blocks - An array of message blocks to be processed.
   */
  async function processBatch(blocks: { header: string; body: string[] }[]) {
    const messages = (
      await Promise.all(blocks.map((block) => parseBlock(block)))
    ).filter((m): m is Message => !!m)
    for (const message of messages) {
      outputStream.write(Object.values(message))
      parsedCount++
      if (parsedCount % 1000 === 0) {
        const elapsed = (performance.now() - startTime) / 1000
        const rate = parsedCount / elapsed
        const estimatedTotal = DEFAULT_ESTIMATED_TOTAL // rough estimate for ETA calculation, optionally make this configurable
        const eta = ((estimatedTotal - parsedCount) / rate).toFixed(0)
        console.log(
          `...processed ${parsedCount} messages (${rate.toFixed(1)} msg/sec), ETA ~${eta}s`,
        )
      }
      if (preview) {
        console.log('✓ Parsed message:', {
          id: message.id,
          timestamp: message.timestamp,
          sender: message.sender,
          preview: message.message.substring(0, 40) + '...',
        })
      }
    }
  }

  // This loop reads the input file line-by-line to avoid loading the entire file into memory.
  for await (const line of rl) {
    const cleanLine = line.charCodeAt(0) === 0xfeff ? line.slice(1) : line
    if (cleanLine.startsWith(delimiter)) {
      if (currentBlock.header !== null) {
        blockBuffer.push({
          header: currentBlock.header,
          body: currentBlock.body,
        })
        if (blockBuffer.length >= BATCH_SIZE) {
          await processBatch(blockBuffer)
          blockBuffer.length = 0
        }
      }
      currentBlock = { header: null, body: [] }
    } else if (currentBlock.header === null) {
      currentBlock.header = cleanLine
    } else {
      currentBlock.body.push(cleanLine)
    }
  }

  // Process the last block if the file doesn't end with a delimiter
  if (currentBlock.header !== null) {
    blockBuffer.push({ header: currentBlock.header, body: currentBlock.body })
  }
  if (blockBuffer.length > 0) {
    await processBatch(blockBuffer)
    blockBuffer.length = 0
  }

  outputStream.end()

  console.log(`📦 Parsed ${parsedCount} messages.`)

  csvStream.on('finish', () => {
    console.log(`\n🎉 Successfully parsed messages to ${outFile}`)
  })

  return parsedCount
}

/**
 * The main entry point for the script when run from the command line.
 * It orchestrates the argument parsing, file parsing, and final performance logging.
 */
async function main() {
  const { inFile, outFile, preview } = parseArgs()
  console.log(`Starting parsing from ${inFile} to ${outFile}...`)
  console.time('⏱ Total parse time')
  const startTime = performance.now()
  const parsedCount = await parseFile(inFile, outFile, preview)
  console.timeEnd('⏱ Total parse time')
  const duration = (performance.now() - startTime) / 1000
  console.log(`🚀 Approx. ${(parsedCount / duration).toFixed(0)} msgs/sec`)
}

// Only invoke main when CLI flags are provided (skip on import for tests)
if (process.argv.includes('--in') && process.argv.includes('--out')) {
  main().catch((error) => {
    console.error('An unexpected error occurred:', error)
    process.exit(1)
  })
}

export { parseFile, main }
