import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

// Get the list of staged files
const stagedFilesOutput: string = execSync(
  'git diff --cached --name-only --diff-filter=ACM',
  { encoding: 'utf8' },
)

const fileExtensions: Array<string> = [
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.css',
  '.scss',
  '.md',
]

const stagedFiles: Array<string> = stagedFilesOutput
  .split('\n')
  .filter(
    (file: string): file is string =>
      !!file && fileExtensions.some((ext) => file.endsWith(ext)),
  )

if (stagedFiles.length > 0) {
  try {
    // Run prettier on the staged files
    console.log('💅 Formatting staged files:', stagedFiles)
    const prettierPath: string = resolve(
      process.cwd(),
      'node_modules/.bin/prettier',
    )

    // Escape file paths for shell command
    const filesToProcess: string = stagedFiles
      .map((file) => `"${file}"`)
      .join(' ')

    const command = `"${prettierPath}" --write ${filesToProcess}`
    execSync(command, {
      stdio: 'inherit',
    })
    console.log('✅ Prettier check passed.')

    // Stage the fixed files
    const stageCommand = `git add ${filesToProcess}`
    execSync(stageCommand, {
      stdio: 'inherit',
    })
    console.log('📝 Fixed files staged.')
  } catch (error) {
    console.error('❌ Prettier check failed:', error)
    process.exit(1)
  }
} else {
  console.log('🤷 No staged files to format.')
}
