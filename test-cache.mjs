import { AudioCache } from './packages/claude-hooks/src/speech/providers/audio-cache.js'

const cache = new AudioCache()
console.log('Default cache dir:', cache.getConfiguration().cacheDir)

try {
  const stats = await cache.getStats()
  console.log('Cache stats:', stats)

  // Test setting and getting a cache entry
  const testKey = await cache.generateKey('Hello world', 'tts-1', 'alloy', 1.0)
  console.log('Generated test key:', testKey)

  // Try to get a non-existent entry
  const entry = await cache.get(testKey)
  console.log('Cache entry for test key:', entry)

  // Set a test entry
  const testBuffer = Buffer.from('fake audio data')
  await cache.set(testKey, testBuffer, {
    provider: 'openai',
    voice: 'alloy',
    model: 'tts-1',
    speed: 1.0,
    format: 'mp3',
  })
  console.log('Set test cache entry')

  // Get the stats again
  const statsAfter = await cache.getStats()
  console.log('Cache stats after setting entry:', statsAfter)

  // Try to get the entry back
  const retrievedEntry = await cache.get(testKey)
  console.log('Retrieved entry exists:', !!retrievedEntry)
  console.log('Retrieved entry data length:', retrievedEntry?.data.length)
} catch (error) {
  console.log('Error:', error.message)
}
