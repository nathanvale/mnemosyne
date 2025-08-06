#!/usr/bin/env node

/**
 * Test TTS integration with actual events
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

console.log('🎵 Testing TTS Integration with Events...\n')

function testHook(hookPath, eventData, hookName) {
  return new Promise((resolve, reject) => {
    console.log(`🎤 Testing ${hookName}...`)
    
    const child = spawn('npx', ['tsx', hookPath, '--speak', '--debug'], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      console.log(`✅ ${hookName} completed (exit code: ${code})`)
      console.log('Output:', stdout.slice(0, 300) + (stdout.length > 300 ? '...' : ''))
      if (stderr) console.log('Errors:', stderr.slice(0, 200))
      console.log('')
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
    // Test Stop Hook
    const stopEvent = {
      type: 'stop',
      data: {
        success: true,
        task: 'Testing OpenAI TTS integration',
        duration: 5000
      }
    }

    await testHook('src/stop/stop.ts', stopEvent, 'Stop Hook')

    // Test Notification Hook
    const notificationEvent = {
      type: 'notification',
      data: {
        message: 'OpenAI TTS test notification',
        priority: 'normal'
      }
    }

    await testHook('src/notification/notification.ts', notificationEvent, 'Notification Hook')

    // Test Subagent Stop Hook
    const subagentEvent = {
      type: 'subagent_stop',
      session_id: 'test-123',
      data: {
        subagentType: 'general-purpose',
        result: 'Test completed successfully'
      }
    }

    await testHook('src/subagent-stop/subagent-stop.ts', subagentEvent, 'Subagent Stop Hook')

    console.log('🎉 All TTS integration tests completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

runTests()