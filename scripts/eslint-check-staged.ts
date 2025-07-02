import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

// Get the list of staged files
const stagedFilesOutput: string = execSync(
  'git diff --cached --name-only --diff-filter=ACM',
  { encoding: 'utf8' },
)

const stagedFiles: Array<string> = stagedFilesOutput
  .split('\n')
  .filter(
    (file: string): file is string =>
      !!file &&
      (file.endsWith('.js') ||
        file.endsWith('.jsx') ||
        file.endsWith('.ts') ||
        file.endsWith('.tsx')),
  )

if (stagedFiles.length > 0) {
  try {
    // Run eslint on the staged files
    console.log('🔍 Staged files to lint:', stagedFiles)
    const eslintPath: string = resolve(
      process.cwd(),
      'node_modules/.bin/eslint',
    )

    // Escape file paths for shell command
    const filesToProcess: string = stagedFiles
      .map((file) => `"${file}"`)
      .join(' ')

    const command = `"${eslintPath}" --fix --quiet ${filesToProcess}`
    execSync(command, {
      stdio: 'inherit',
    })
    console.log('✅ Lint check passed.')

    // Stage the fixed files
    const stageCommand = `git add ${filesToProcess}`
    execSync(stageCommand, {
      stdio: 'inherit',
    })
    console.log('📝 Fixed files staged.')
  } catch (error) {
    console.error('❌ Lint check failed.', error)
    process.exit(1)
  }
} else {
  console.log('🤷 No staged files to lint.')
}
