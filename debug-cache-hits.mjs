import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { AudioCache } from './packages/claude-hooks/src/speech/providers/audio-cache.js'

const cache = new AudioCache()
const cacheConfig = cache.getConfiguration()

console.log('🔍 Debugging Cache Hit Rate...\n')

try {
  // Get current stats
  const stats = await cache.getStats()
  console.log('📊 Current Cache Stats:')
  console.log(
    '   Request Count:',
    stats.hitRate === 0
      ? 'Unknown (hitRate = 0)'
      : Math.round(cache.hitCount / stats.hitRate),
  )
  console.log('   Hit Count:', 'Unknown (private property)')
  console.log('   Hit Rate:', (stats.hitRate * 100).toFixed(1) + '%')
  console.log('')

  // Let's look at the actual cached content to see if "task repeated" is there
  const entriesDir = join(cacheConfig.cacheDir, 'entries')
  const entryFiles = await readdir(entriesDir)

  console.log('📝 Analyzing Cache Content for "task repeated":')

  // Test generating keys for common phrases
  console.log('\n🔑 Generating test keys for common phrases:')
  const testPhrases = [
    'task repeated',
    'Task repeated',
    'high priority: task repeated',
    'medium priority: task repeated',
    'Task completed',
    'Claude needs your attention',
  ]

  for (const phrase of testPhrases) {
    try {
      const testKey = await cache.generateKey(phrase, 'tts-1', 'nova', 1.0)
      console.log(`   "${phrase}" -> ${testKey.substring(0, 16)}...`)

      // Check if this key exists in cache
      const exists = entryFiles.some((f) =>
        f.startsWith(testKey.substring(0, 16)),
      )
      if (exists) {
        console.log(`     ✅ FOUND IN CACHE!`)
      }
    } catch (err) {
      console.log(`     ❌ Error: ${err.message}`)
    }
  }

  console.log('\n📋 First 5 Cache Entry Details:')
  for (let i = 0; i < Math.min(5, entryFiles.length); i++) {
    const entryFile = entryFiles[i]
    if (!entryFile.endsWith('.json')) continue

    try {
      const entryPath = join(entriesDir, entryFile)
      const entryData = await readFile(entryPath, 'utf8')
      const entry = JSON.parse(entryData)
      const key = entryFile.replace('.json', '')

      console.log(`   Entry ${i + 1}:`)
      console.log('     Full Key:', key)
      console.log('     Voice:', entry.metadata.voice)
      console.log('     Model:', entry.metadata.model)
      console.log('     Speed:', entry.metadata.speed)
      console.log('')

      // Let's try to reverse engineer what text might create this key
      console.log('     🤔 Testing if this could be "task repeated":')
      const testKey = await cache.generateKey(
        'task repeated',
        entry.metadata.model || 'tts-1',
        entry.metadata.voice,
        entry.metadata.speed || 1.0,
      )
      if (testKey === key) {
        console.log('     🎉 THIS IS "task repeated"!')
      } else {
        console.log('     ❌ Not "task repeated"')
      }
      console.log('')
    } catch (err) {
      console.log(`     Error reading entry ${i + 1}: ${err.message}`)
    }
  }

  // Test the cache hit mechanism directly
  console.log('🧪 Testing Cache Hit Mechanism:')
  const testText = 'task repeated'
  const testKey = await cache.generateKey(testText, 'tts-1', 'nova', 1.0)
  console.log(
    '   Generated key for "task repeated":',
    testKey.substring(0, 16) + '...',
  )

  const cachedEntry = await cache.get(testKey)
  if (cachedEntry) {
    console.log('   ✅ Cache HIT! Entry found for "task repeated"')
  } else {
    console.log('   ❌ Cache MISS - "task repeated" not in cache')
  }
} catch (error) {
  console.log('❌ Error:', error.message)
}
