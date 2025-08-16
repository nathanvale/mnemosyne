#!/usr/bin/env tsx

import chalk from 'chalk'
import { program } from 'commander'

import { SimpleWallabyStatus } from '../wallaby-manager/simple-wallaby-status'

program
  .name('wallaby-status')
  .description('Check the status of Wallaby.js')
  .version('0.1.0')
  .parse(process.argv)

async function main() {
  try {
    const status = await SimpleWallabyStatus.checkStatus()
    SimpleWallabyStatus.displayStatus(status)
    process.exit(status.running ? 0 : 1)
  } catch (error) {
    console.error(
      chalk.red('Error checking Wallaby status:'),
      error instanceof Error ? error.message : String(error),
    )
    process.exit(1)
  }
}

main()
