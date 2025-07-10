// Is this frontend or Node?
// This is Node.js - using the CLI logger

import { PrismaClient } from '@/generated/prisma'
import { createCliLogger } from '@/lib/logger'

const logger = createCliLogger('info')
const prisma = new PrismaClient()

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

async function main() {
  logger.info('Starting URL extraction from existing messages')

  try {
    // Get all messages that have text content
    const messages = await prisma.message.findMany({
      where: {
        message: {
          not: '',
        },
      },
      select: {
        id: true,
        message: true,
      },
    })

    logger.info(`Found ${messages.length} messages to process`)

    let processedCount = 0
    let totalLinksCreated = 0

    for (const message of messages) {
      if (!message.message) continue

      // Extract URLs from the message text
      const extractedUrls = extractUrls(message.message)

      if (extractedUrls.length > 0) {
        // Deduplicate URLs for this message
        const uniqueUrls = deduplicateUrls(extractedUrls)

        // Create links for this message
        const linkData = uniqueUrls.map((url) => ({
          url,
          messageId: message.id,
        }))

        // Insert links in batch
        for (const linkItem of linkData) {
          await prisma.link.create({
            data: linkItem,
          })
        }

        totalLinksCreated += linkData.length
        processedCount++

        if (processedCount % 100 === 0) {
          logger.info(`Processed ${processedCount} messages with URLs`)
        }
      }
    }

    logger.info(`URL extraction completed:`)
    logger.info(`- Processed ${processedCount} messages with URLs`)
    logger.info(`- Created ${totalLinksCreated} links`)
  } catch (error) {
    logger.error('Error during URL extraction:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  logger.error('Unhandled error:', error)
  process.exit(1)
})
