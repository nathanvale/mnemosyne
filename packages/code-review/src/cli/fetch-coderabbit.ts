#!/usr/bin/env tsx

/**
 * Fetches CodeRabbit comments from a GitHub PR and extracts structured data
 */

import { parseArgs } from 'node:util'

import { CodeRabbitDataFetcher } from './coderabbit-data-fetcher.js'

async function main() {
  const { values } = parseArgs({
    options: {
      'pr-number': { type: 'string' },
      pr: { type: 'string' }, // Alias for pr-number
      repo: { type: 'string' },
      repository: { type: 'string' }, // Alias for repo
      output: { type: 'string' },
      verbose: { type: 'boolean' },
      help: { type: 'boolean' },
    },
  })

  if (values.help) {
    // eslint-disable-next-line no-console
    console.log(`
Usage: npx tsx fetch-coderabbit.ts --pr-number <number> --repo <owner/repo> [--output <file>]

Fetches CodeRabbit comments from a GitHub PR and extracts structured data.

Options:
  --pr-number, --pr   PR number to fetch comments from
  --repo, --repository GitHub repository in format owner/repo
  --output            Output file (defaults to stdout)
  --verbose           Enable verbose output
  --help              Show this help message

Example:
  npx tsx fetch-coderabbit.ts --pr 139 --repo nathanvale/mnemosyne --output coderabbit.json
`)
    process.exit(0)
  }

  const prNumberStr = values['pr-number'] || values.pr
  const repo = values.repo || values.repository

  if (!prNumberStr || !repo) {
    console.error('Error: --pr-number and --repo are required')
    console.error('Run with --help for usage information')
    process.exit(1)
  }

  const prNumber = parseInt(prNumberStr as string, 10)

  try {
    const fetcher = new CodeRabbitDataFetcher({
      verbose: values.verbose || false,
      includeReviewComments: true,
    })

    const result = await fetcher.fetchCodeRabbitData(prNumber, repo as string)

    // Output results
    const jsonOutput = JSON.stringify(result, null, 2)
    if (values.output) {
      const fs = await import('node:fs')
      fs.writeFileSync(values.output, jsonOutput)
      console.error(`CodeRabbit data written to ${values.output}`)
      console.error(
        `Found ${result.findings.length} findings from ${result.issueComments.length} issue comments and ${result.reviewComments.length} review comments`,
      )
    } else {
      // eslint-disable-next-line no-console
      console.log(jsonOutput)
    }
  } catch (error) {
    console.error('Error fetching CodeRabbit data:', error)
    // Output empty result on error
    const emptyResult = {
      prNumber,
      repository: repo as string,
      fetchedAt: new Date().toISOString(),
      hasCodeRabbitReview: false,
      issueComments: [],
      reviewComments: [],
      findings: [],
    }
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(emptyResult, null, 2))
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
