#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * TTS Cache Statistics CLI
 * Shows performance metrics and statistics for the TTS audio cache
 */

import { AudioCache } from '../speech/providers/audio-cache.js'

/**
 * Format bytes as human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`
}

/**
 * Format timestamp as relative time
 */
function formatRelativeTime(timestamp: number): string {
  if (timestamp === 0) return 'never'

  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  if (seconds > 0) return `${seconds} second${seconds > 1 ? 's' : ''} ago`
  return 'just now'
}

/**
 * Main function to display cache statistics
 */
async function main() {
  // Support --json flag for machine-readable output
  const jsonOutput = process.argv.includes('--json')

  // Initialize cache with default configuration
  const cache = new AudioCache()
  const config = cache.getConfiguration()
  const stats = await cache.getStats()

  if (jsonOutput) {
    // Output raw stats as JSON
    console.log(
      JSON.stringify(
        {
          stats,
          config: {
            cacheDir: config.cacheDir,
            maxSizeBytes: config.maxSizeBytes,
            maxAgeMs: config.maxAgeMs,
            maxEntries: config.maxEntries,
            enabled: config.enabled,
            normalization: config.normalization,
          },
        },
        null,
        2,
      ),
    )
    return
  }

  // Pretty console output
  console.log('\n🎯 TTS Cache Statistics')
  console.log('━'.repeat(40))

  // Performance metrics
  console.log('\n📊 Performance')
  const hitRate = (stats.hitRate * 100).toFixed(1)
  const maxSizeBytes = config.maxSizeBytes ?? 100 * 1024 * 1024 // 100MB default
  const maxEntries = config.maxEntries ?? 1000
  const utilization = ((stats.totalSize / maxSizeBytes) * 100).toFixed(1)

  console.log(`  • Hit Rate: ${hitRate}%`)
  console.log(
    `  • Cache Size: ${formatBytes(stats.totalSize)} / ${formatBytes(maxSizeBytes)} (${utilization}%)`,
  )
  console.log(`  • Total Entries: ${stats.entryCount} / ${maxEntries}`)

  // Cache location
  console.log('\n📁 Cache Location')
  console.log(`  ${config.cacheDir}`)

  // Entry ages
  console.log('\n⏰ Entry Ages')
  if (stats.entryCount > 0) {
    console.log(`  • Oldest: ${formatRelativeTime(stats.oldestEntry)}`)
    console.log(`  • Newest: ${formatRelativeTime(stats.newestEntry)}`)
  } else {
    console.log('  • No entries in cache')
  }

  // Configuration
  console.log('\n⚙️ Configuration')
  console.log(`  • Enabled: ${config.enabled ? 'yes' : 'no'}`)
  console.log(`  • Max Size: ${formatBytes(maxSizeBytes)}`)
  const maxAgeMs = config.maxAgeMs ?? 7 * 24 * 60 * 60 * 1000 // 7 days default
  console.log(
    `  • Max Age: ${Math.floor(maxAgeMs / (24 * 60 * 60 * 1000))} days`,
  )
  console.log(`  • Max Entries: ${maxEntries}`)

  if (config.normalization) {
    const normFeatures = []
    if (!config.normalization.caseSensitive)
      normFeatures.push('case-insensitive')
    if (config.normalization.stripPriorityPrefixes)
      normFeatures.push('strip priority')
    if (config.normalization.normalizeWhitespace)
      normFeatures.push('normalize spaces')

    if (normFeatures.length > 0) {
      console.log(`  • Normalization: ${normFeatures.join(', ')}`)
    }
  }

  // Tips
  if (stats.entryCount === 0) {
    console.log(
      '\n💡 Tip: Cache is empty. TTS audio will be cached after first use.',
    )
  } else if (stats.hitRate < 0.5) {
    console.log(
      '\n💡 Tip: Low hit rate. Consider increasing cache size or TTL.',
    )
  } else if (Number(utilization) > 80) {
    console.log(
      '\n⚠️ Warning: Cache is nearly full. Consider cleanup or increasing max size.',
    )
  }

  console.log()
}

// Run the CLI
main().catch((error) => {
  console.error('❌ Error reading cache statistics:', error.message)
  process.exit(1)
})
