import * as csv from 'fast-csv'
import fs from 'fs'
import linkify from 'linkify-it'
import { performance } from 'perf_hooks'
import readline from 'readline'

// Define the structure for a parsed message
interface Message {
  id: number
  timestamp: string
  sender: 'Nathan' | 'Melanie'
  message: string
  links: string
  assets: string
}

// Regular expressions for parsing
const headerRegex =
  /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) (from|to) (Melanie)$/
const assetRegex = /([A-Z]{3,}_\d{4,}\.(jpeg|jpg|png|mov|heic|gif))/gi
const delimiter = '----------------------------------------------------'

// Initialize linkify
const linkFinder = linkify()

// Function to parse CLI arguments
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

  const blockBuffer: { header: string; body: string[] }[] = []
  const BATCH_SIZE = 500

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
        const estimatedTotal = 45000 // rough estimate for ETA calculation, optionally make this configurable
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
