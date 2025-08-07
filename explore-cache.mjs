import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { AudioCache } from './packages/claude-hooks/src/speech/providers/audio-cache.js'

const cache = new AudioCache()
const cacheConfig = cache.getConfiguration()
console.log('🗂️  Cache Directory:', cacheConfig.cacheDir)
console.log('📊 Cache Configuration:', cacheConfig)
console.log('')

try {
  // Get cache stats
  const stats = await cache.getStats()
  console.log('📈 Cache Statistics:')
  console.log('   Entries:', stats.entryCount)
  console.log('   Total Size:', (stats.totalSize / 1024).toFixed(2), 'KB')
  console.log('   Hit Rate:', (stats.hitRate * 100).toFixed(1) + '%')
  console.log('   Oldest Entry:', new Date(stats.oldestEntry).toLocaleString())
  console.log('   Newest Entry:', new Date(stats.newestEntry).toLocaleString())
  console.log('')

  // List entries directory
  const entriesDir = join(cacheConfig.cacheDir, 'entries')
  const audioDir = join(cacheConfig.cacheDir, 'audio')

  console.log('📁 Cache Structure:')
  try {
    const entryFiles = await readdir(entriesDir)
    console.log('   Entries directory:', entryFiles.length, 'files')

    const audioFiles = await readdir(audioDir)
    console.log('   Audio directory:', audioFiles.length, 'files')
    console.log('')

    // Show details of first few entries
    console.log('🔍 Sample Cache Entries:')
    for (let i = 0; i < Math.min(5, entryFiles.length); i++) {
      const entryFile = entryFiles[i]
      if (!entryFile.endsWith('.json')) continue

      try {
        const entryPath = join(entriesDir, entryFile)
        const entryData = await readFile(entryPath, 'utf8')
        const entry = JSON.parse(entryData)

        const entryStat = await stat(entryPath)
        const key = entryFile.replace('.json', '')
        const audioPath = join(audioDir, entry.audioFile)
        const audioStat = await stat(audioPath)

        console.log(`   Entry ${i + 1}:`)
        console.log('     Key:', key.substring(0, 16) + '...')
        console.log('     Provider:', entry.metadata.provider)
        console.log('     Voice:', entry.metadata.voice)
        console.log('     Model:', entry.metadata.model || 'N/A')
        console.log('     Speed:', entry.metadata.speed || 'N/A')
        console.log('     Format:', entry.metadata.format || 'N/A')
        console.log('     Created:', new Date(entry.timestamp).toLocaleString())
        console.log('     Entry Size:', entryStat.size, 'bytes')
        console.log(
          '     Audio Size:',
          (audioStat.size / 1024).toFixed(2),
          'KB',
        )
        console.log('')
      } catch (err) {
        console.log(`     Entry ${i + 1}: [Error reading] ${err.message}`)
      }
    }
  } catch (err) {
    console.log('   Error listing cache contents:', err.message)
  }
} catch (error) {
  console.log('❌ Error:', error.message)
}
