import { createHash } from 'crypto'
import { parse } from 'fast-csv'
import fs from 'fs'

// Use the same MessageRow interface as the import script
interface MessageRow {
  'Chat Session': string
  'Message Date': string
  'Delivered Date': string
  'Read Date': string
  'Edited Date': string
  Service: string
  Type: string
  'Sender ID': string
  'Sender Name': string
  Status: string
  'Replying to': string
  Subject: string
  Text: string
  Attachment: string
  'Attachment type': string
}

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

async function analyzeDuplicates() {
  const hashMap = new Map<string, Array<{ row: number; data: MessageRow }>>()
  let rowIndex = 0

  return new Promise<void>((resolve, reject) => {
    const readStream = fs.createReadStream('scripts/data/messages.csv')

    readStream
      .pipe(parse({ headers: true }))
      .on('error', reject)
      .on('data', (row: MessageRow) => {
        rowIndex++

        const timestamp = row['Message Date']
        const rawSender = row['Sender Name']
        const senderId = row['Sender ID']
        const message = row['Text']
        const direction =
          row['Type']?.toLowerCase() === 'incoming' ? 'incoming' : 'outgoing'
        const sender =
          direction === 'outgoing' && !rawSender ? 'Nathan' : rawSender
        const assets = row['Attachment'] || ''

        // Skip empty messages (same logic as import script)
        if (!timestamp || !sender || (!message && !assets)) {
          return
        }

        const hash = createContentHash(
          timestamp,
          sender || '',
          senderId || '',
          message || '',
          assets || '',
        )

        if (!hashMap.has(hash)) {
          hashMap.set(hash, [])
        }

        hashMap.get(hash)!.push({ row: rowIndex, data: row })
      })
      .on('end', () => {
        console.log('\n=== DUPLICATE ANALYSIS ===\n')

        const duplicates = Array.from(hashMap.entries()).filter(
          ([, instances]) => instances.length > 1,
        )

        console.log(`Total unique hashes: ${hashMap.size}`)
        console.log(`Hashes with duplicates: ${duplicates.length}`)
        console.log(
          `Total duplicate instances: ${duplicates.reduce((sum, [, instances]) => sum + instances.length - 1, 0)}`,
        )

        console.log('\n=== DUPLICATE EXAMPLES ===\n')

        duplicates.slice(0, 10).forEach(([hash, instances], index) => {
          console.log(
            `\n--- Duplicate Group ${index + 1} (${instances.length} instances) ---`,
          )
          console.log(`Hash: ${hash.substring(0, 16)}...`)

          instances.forEach(({ row, data }, i) => {
            console.log(`  Row ${row}:`)
            console.log(`    Timestamp: "${data['Message Date']}"`)
            console.log(`    Sender: "${data['Sender Name']}"`)
            console.log(`    SenderId: "${data['Sender ID']}"`)
            console.log(
              `    Text: "${(data['Text'] || '').substring(0, 60)}${data['Text']?.length > 60 ? '...' : ''}"`,
            )
            console.log(`    Type: "${data['Type']}"`)
            console.log(`    Attachment: "${data['Attachment']}"`)
            if (i < instances.length - 1) console.log('    ---')
          })
        })

        // Look for patterns
        console.log('\n=== PATTERN ANALYSIS ===\n')

        const patterns = new Map<string, number>()

        duplicates.forEach(([, instances]) => {
          const firstInstance = instances[0].data
          const messageType = firstInstance['Text'] || '[EMPTY]'
          const key = `${firstInstance['Type']}|${messageType.substring(0, 30)}`
          patterns.set(key, (patterns.get(key) || 0) + 1)
        })

        console.log('Most common duplicate patterns:')
        Array.from(patterns.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 15)
          .forEach(([pattern, count]) => {
            const [type, text] = pattern.split('|')
            console.log(
              `  ${count}x - ${type}: "${text}${text.length >= 30 ? '...' : ''}"`,
            )
          })

        resolve()
      })
  })
}

analyzeDuplicates().catch(console.error)
