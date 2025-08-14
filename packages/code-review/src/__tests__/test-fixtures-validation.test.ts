import { existsSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('Test Fixtures Validation', () => {
  const testFixturesPath = resolve(__dirname, '../../test-fixtures')
  const securityExamplesPath = resolve(testFixturesPath, 'security-examples')

  it('should have test-fixtures directory with proper structure', () => {
    expect(existsSync(testFixturesPath)).toBe(true)
    expect(existsSync(securityExamplesPath)).toBe(true)
  })

  it('should have README.md with clear warnings in test-fixtures', () => {
    const readmePath = resolve(testFixturesPath, 'README.md')
    expect(existsSync(readmePath)).toBe(true)

    const content = readFileSync(readmePath, 'utf-8')
    expect(content).toContain('WARNING: FOR TESTING PURPOSES ONLY')
    expect(content).toContain('INTENTIONAL SECURITY VULNERABILITIES')
    expect(content).toContain(
      'Never use any code from this directory in production',
    )
  })

  it('should have .gitignore to prevent sensitive data commits', () => {
    const gitignorePath = resolve(testFixturesPath, '.gitignore')
    expect(existsSync(gitignorePath)).toBe(true)

    const content = readFileSync(gitignorePath, 'utf-8')
    expect(content).toContain('*.env')
    expect(content).toContain('*.pem')
    expect(content).toContain('*production*')
  })

  it('should have example vulnerable code with proper warnings', () => {
    const vulnerableCodePath = resolve(
      securityExamplesPath,
      'example-vulnerable-code.ts',
    )
    expect(existsSync(vulnerableCodePath)).toBe(true)

    const content = readFileSync(vulnerableCodePath, 'utf-8')
    expect(content).toContain('TEST FIXTURE - INTENTIONAL VULNERABILITIES')
    expect(content).toContain(
      'DO NOT USE ANY CODE FROM THIS FILE IN PRODUCTION',
    )
    expect(content).toContain('ALL CREDENTIALS ARE FAKE/TEST EXAMPLES')
  })

  it('should ensure test credentials follow obvious test patterns', () => {
    const vulnerableCodePath = resolve(
      securityExamplesPath,
      'example-vulnerable-code.ts',
    )
    const content = readFileSync(vulnerableCodePath, 'utf-8')

    // All test credentials should have TEST or EXAMPLE in them
    const credentialPatterns = [
      'sk_test_424242',
      'TEST',
      'EXAMPLE',
      'AKIA-TEST-EXAMPLE',
    ]

    credentialPatterns.forEach((pattern) => {
      expect(content).toContain(pattern)
    })

    // Should NOT contain anything that looks like real credentials
    const realCredentialPatterns = [
      /sk_live_[a-zA-Z0-9]{32,}/,
      /AKIA[A-Z0-9]{16}(?![A-Z0-9]*TEST)/,
      /aws_secret_access_key\s*=\s*['"][a-zA-Z0-9/+=]{40}['"]/,
    ]

    realCredentialPatterns.forEach((pattern) => {
      expect(content).not.toMatch(pattern)
    })
  })

  it('should not have vulnerable code in src/examples directory', () => {
    const oldExamplesPath = resolve(__dirname, '../examples')
    expect(existsSync(oldExamplesPath)).toBe(false)
  })
})
