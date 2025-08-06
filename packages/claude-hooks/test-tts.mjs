#!/usr/bin/env node

/**
 * Quick test script for TTS integration
 */

import { execSync } from 'child_process'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

console.log('🎵 Testing TTS Integration...\n')

try {
  // Test stop hook with speech
  console.log('Testing Stop Hook TTS...')
  const stopResult = execSync(
    `cd "${__dirname}" && npx tsx src/stop/stop.ts --speak --debug`,
    { encoding: 'utf8', timeout: 10000 },
  )
  console.log('✅ Stop Hook TTS:', `${stopResult.slice(0, 200)}...\n`)

  // Test notification hook
  console.log('Testing Notification Hook TTS...')
  const notificationResult = execSync(
    `cd "${__dirname}" && npx tsx src/notification/notification.ts --speak --debug`,
    { encoding: 'utf8', timeout: 10000 },
  )
  console.log(
    '✅ Notification Hook TTS:',
    `${notificationResult.slice(0, 200)}...\n`,
  )

  console.log('🎉 TTS integration tests completed!')
} catch (error) {
  console.error('❌ TTS test failed:', error.message)
  console.log('\n💡 Make sure to:')
  console.log(
    '1. Replace REPLACE_WITH_YOUR_OPENAI_API_KEY with your actual API key',
  )
  console.log('2. Ensure you have an active OpenAI account with TTS access')
  console.log('3. Check your internet connection')
  console.log('\n📝 Config files to update:')
  console.log('- .claude/hooks/notification.config.json')
  console.log('- .claude/hooks/stop.config.json')
  console.log('- .claude/hooks/subagent-stop.config.json')
}
