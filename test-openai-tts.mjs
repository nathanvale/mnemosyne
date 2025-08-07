#!/usr/bin/env node

/**
 * Test script to verify OpenAI TTS is working with Claude hooks
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Create a test event that mimics what Claude Code sends
const testEvent = {
  id: 'test-task-completed',
  type: 'Stop',
  timestamp: new Date().toISOString(),
  data: {
    success: true,
    task: 'Testing OpenAI text to speech',
    duration: 3000,
  },
}

console.log('🧪 Testing OpenAI TTS with Claude hooks...\n')
console.log('📦 Sending test event:', JSON.stringify(testEvent, null, 2), '\n')

// Run the universal stop hook with the test event
const hookPath = join(__dirname, '.claude', 'hooks', 'universal-stop-hook.sh')
const hookProcess = spawn('bash', [hookPath], {
  env: {
    ...process.env,
    CLAUDE_HOOKS_DEBUG: 'true',
  },
})

// Send the event to stdin
hookProcess.stdin.write(JSON.stringify(testEvent))
hookProcess.stdin.end()

// Handle output
hookProcess.stdout.on('data', (data) => {
  process.stdout.write(data)
})

hookProcess.stderr.on('data', (data) => {
  process.stderr.write(data)
})

hookProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Test completed successfully!')
    console.log(
      '🔊 You should have heard: "Task completed: Testing OpenAI text to speech in 3 seconds"',
    )
    console.log('\n📝 If you heard macOS say instead of OpenAI voice, check:')
    console.log('   1. OPENAI_API_KEY environment variable is set')
    console.log('   2. The API key has access to TTS API')
    console.log('   3. Network connection is working')
  } else {
    console.log(`\n❌ Test failed with code ${code}`)
  }
  process.exit(code)
})

hookProcess.on('error', (err) => {
  console.error('❌ Failed to run hook:', err)
  process.exit(1)
})
