#!/usr/bin/env node

/**
 * Test OpenAI TTS integration with proper event format
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

console.log('🎵 Testing OpenAI TTS Integration...\n')

function testHook(hookPath, eventData, hookName) {
  return new Promise((resolve, reject) => {
    console.log(`\n🎤 Testing ${hookName}...`)
    console.log(`   Event type: ${eventData.hook_event_name || eventData.type}`)
    
    const child = spawn('npx', ['tsx', hookPath, '--speak', '--debug'], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
      process.stdout.write(data)
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
      process.stderr.write(data)
    })

    child.on('close', (code) => {
      console.log(`\n✅ ${hookName} completed (exit code: ${code})`)
      console.log('─'.repeat(50))
      resolve({ code, stdout, stderr })
    })

    child.on('error', (error) => {
      console.error(`❌ ${hookName} failed:`, error.message)
      reject(error)
    })

    // Send the event data
    child.stdin.write(JSON.stringify(eventData) + '\n')
    child.stdin.end()
  })
}

async function runTests() {
  try {
    console.log('📢 Testing with OpenAI TTS provider')
    console.log('   Voices: alloy (stop), nova (notification), echo (subagent)')
    console.log('─'.repeat(50))

    // Test Stop Hook - Claude Code format
    const stopEvent = {
      hook_event_name: 'Stop',
      type: 'stop',
      data: {
        success: true,
        task: 'OpenAI TTS integration complete',
        duration: 3000,
        executionTimeMs: 3000
      }
    }

    await testHook('src/stop/stop.ts', stopEvent, 'Stop Hook (OpenAI voice: alloy)')

    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test Notification Hook - Claude Code format
    const notificationEvent = {
      hook_event_name: 'Notification',
      type: 'notification',
      data: {
        message: 'Task requires your attention',
        priority: 'high'
      }
    }

    await testHook('src/notification/notification.ts', notificationEvent, 'Notification Hook (OpenAI voice: nova)')

    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Test Subagent Stop Hook - Claude Code format
    const subagentEvent = {
      hook_event_name: 'SubagentStop',
      type: 'subagent_stop',
      session_id: 'test-session-123',
      data: {
        subagentId: 'agent-456',
        subagentType: 'general-purpose',
        result: { 
          status: 'completed',
          message: 'Analysis complete'
        }
      }
    }

    await testHook('src/subagent-stop/subagent-stop.ts', subagentEvent, 'Subagent Stop Hook (OpenAI voice: echo)')

    console.log('\n🎉 OpenAI TTS integration test completed!')
    console.log('\n📝 Summary:')
    console.log('   - Stop Hook: Uses "alloy" voice (neutral)')
    console.log('   - Notification Hook: Uses "nova" voice (energetic)')
    console.log('   - Subagent Stop Hook: Uses "echo" voice (calm male)')
    console.log('\n💡 If you heard the voices, OpenAI TTS is working!')
    console.log('   If you heard system voices, it fell back to macOS TTS.')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.log('\n💡 Troubleshooting tips:')
    console.log('1. Check that your OpenAI API key is valid')
    console.log('2. Ensure you have TTS access on your OpenAI account')
    console.log('3. Check your internet connection')
    console.log('4. Look for specific error messages above')
  }
}

// Run the tests
runTests().catch(console.error)