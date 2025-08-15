#!/usr/bin/env tsx

import { readFileSync } from 'fs'
import { join } from 'path'

interface TurboConfig {
  tasks: {
    [key: string]: {
      dependsOn?: string[]
      cache?: boolean
      persistent?: boolean
      env?: string[]
      passThroughEnv?: string[]
      outputs?: string[]
      inputs?: string[]
    }
  }
}

const turboConfigPath = join(process.cwd(), 'turbo.json')
const turboConfig: TurboConfig = JSON.parse(
  readFileSync(turboConfigPath, 'utf-8'),
)

let testsPassed = 0
let testsFailed = 0

function test(name: string, assertion: boolean) {
  if (assertion) {
    console.log(`✅ ${name}`)
    testsPassed++
  } else {
    console.error(`❌ ${name}`)
    testsFailed++
  }
}

console.log('🧪 Testing Turbo.json Configuration for Dual Consumption\n')

// Test 1: Dev task should not depend on build
test(
  'Dev task should not have build dependencies (uses source files)',
  !turboConfig.tasks.dev?.dependsOn?.includes('^build'),
)

// Test 2: Dev task should have cache disabled
test(
  'Dev task should have cache disabled',
  turboConfig.tasks.dev?.cache === false,
)

// Test 3: Dev task should be persistent
test(
  'Dev task should be persistent',
  turboConfig.tasks.dev?.persistent === true,
)

// Test 4: Build task should depend on upstream builds
test(
  'Build task should depend on upstream builds',
  turboConfig.tasks.build?.dependsOn?.includes('^build') === true,
)

// Test 5: Test task should not depend on build (uses development condition)
test(
  'Test task should not depend on build (uses source files in development)',
  !turboConfig.tasks.test?.dependsOn?.includes('^build'),
)

// Test 6: Test task should include NODE_ENV
test(
  'Test task should include NODE_ENV in environment',
  turboConfig.tasks.test?.env?.includes('NODE_ENV') === true,
)

// Test 7: Deploy task should exist and depend on builds
const deployTask = turboConfig.tasks.deploy
test(
  'Deploy task should exist for production deployment',
  deployTask !== undefined,
)

if (deployTask) {
  test(
    'Deploy task should depend on both upstream and local builds',
    deployTask.dependsOn?.includes('^build') === true &&
      deployTask.dependsOn?.includes('build') === true,
  )
}

// Test 8: Type-check should not depend on build (works with source)
test(
  'Type-check task should not depend on build (analyzes source files)',
  !turboConfig.tasks['type-check']?.dependsOn?.includes('^build'),
)

// Test 9: Lint task should not depend on build
test(
  'Lint task should not depend on build (lints source files)',
  !turboConfig.tasks.lint?.dependsOn?.includes('^build'),
)

console.log('\n📊 Test Results:')
console.log(`   Passed: ${testsPassed}`)
console.log(`   Failed: ${testsFailed}`)

if (testsFailed > 0) {
  console.error(
    '\n❌ Some tests failed. Turbo.json needs updates for dual consumption.',
  )
  process.exit(1)
} else {
  console.log(
    '\n✅ All tests passed! Turbo.json is configured for dual consumption.',
  )
}
