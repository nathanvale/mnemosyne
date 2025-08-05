#!/usr/bin/env node

import { build } from 'esbuild'
import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

async function buildHooks() {
  console.log('Building Claude hooks...')

  // Ensure hooks directory exists
  const hooksDir = path.join(rootDir, 'hooks')
  await fs.mkdir(hooksDir, { recursive: true })

  // Build configurations for each hook
  const hooks = [
    {
      name: 'sound-notification',
      entry: path.join(rootDir, 'dist/src/sound-notification/index.js'),
      output: path.join(hooksDir, 'sound-notification.cjs'),
    },
    {
      name: 'quality-check',
      entry: path.join(rootDir, 'dist/src/quality-check/index.js'),
      output: path.join(hooksDir, 'quality-check.cjs'),
    },
  ]

  for (const hook of hooks) {
    console.log(`Building ${hook.name}...`)

    await build({
      entryPoints: [hook.entry],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile: hook.output,
      banner: {
        js: '#!/usr/bin/env node',
      },
      external: ['typescript', 'eslint', 'prettier'],
      minify: false,
      sourcemap: true,
    })

    // Make the file executable
    await fs.chmod(hook.output, 0o755)
    console.log(
      `✓ Built ${hook.name} -> ${path.relative(rootDir, hook.output)}`,
    )
  }

  console.log('✅ All hooks built successfully!')
}

buildHooks().catch((error) => {
  console.error('Build failed:', error)
  process.exit(1)
})
