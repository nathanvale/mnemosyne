#!/usr/bin/env node
/* eslint-disable no-console */

import { readFileSync, writeFileSync, chmodSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const binDir = join(__dirname, '..', 'dist', 'src', 'bin')
const scripts = ['wallaby-status.js']

scripts.forEach((script) => {
  const scriptPath = join(binDir, script)

  try {
    // Read the file
    let content = readFileSync(scriptPath, 'utf-8')

    // Fix the shebang if needed
    if (!content.startsWith('#!/usr/bin/env node')) {
      // Remove any existing shebang
      content = content.replace(/^#!.*\n/, '')
      // Add the correct shebang
      content = `#!/usr/bin/env node\n${content}`
      writeFileSync(scriptPath, content, 'utf-8')
      console.log(`Fixed shebang in ${script}`)
    }

    // Make the file executable
    chmodSync(scriptPath, 0o755)
    console.log(`Made ${script} executable`)
  } catch (error) {
    console.error(`Error processing ${script}:`, error.message)
  }
})

console.log('Shebang fix complete')
