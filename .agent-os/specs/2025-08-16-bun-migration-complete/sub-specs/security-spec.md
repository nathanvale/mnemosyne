# Security Specification

This document outlines the security enhancements and hardening measures for the Bun migration.

> Created: 2025-08-16
> Version: 1.0.0

## Security Architecture

### Runtime Permission System

Bun provides granular permission controls similar to Deno, allowing us to restrict what code can access.

```typescript
// bun-security.config.ts
export default {
  permissions: {
    // File system access
    read: [
      './src', // Source code
      './dist', // Built artifacts
      './node_modules', // Dependencies
      '/tmp', // Temporary files
    ],
    write: [
      './dist', // Build output
      '/tmp', // Temporary files
      './logs', // Application logs
    ],

    // Network access
    net: [
      'https://api.openai.com', // OpenAI API
      'https://api.elevenlabs.io', // ElevenLabs API
      'https://registry.npmjs.org', // NPM registry
      'localhost:*', // Local development
    ],

    // Environment variables
    env: [
      'NODE_ENV',
      'DATABASE_URL',
      'OPENAI_API_KEY',
      'ELEVENLABS_API_KEY',
      // Explicitly list allowed env vars
    ],

    // System access
    run: false, // Disable subprocess execution by default
    ffi: false, // Disable foreign function interface
    hrtime: true, // Allow high-resolution time
  },
}
```

### Sandboxed Execution

```typescript
// packages/[name]/sandbox.config.ts
export const sandboxConfig = {
  // Memory limits
  memory: {
    max: '512MB',
    heap: '256MB',
    stack: '8MB',
  },

  // CPU limits
  cpu: {
    cores: 2,
    priority: 'normal',
  },

  // Time limits
  timeout: {
    execution: 30000, // 30 seconds max execution
    idle: 5000, // 5 seconds idle timeout
  },

  // Isolation
  isolation: {
    network: 'restricted', // Limited network access
    filesystem: 'readonly', // Read-only by default
    process: 'isolated', // Process isolation
  },
}
```

## Security Features

### 1. Secure Secrets Management

```typescript
// packages/security/src/secrets.ts
import { $ } from 'bun'
import { encrypt, decrypt } from 'bun:crypto'

export class SecureSecrets {
  private static vault = new Map<string, ArrayBuffer>()
  private static key: CryptoKey

  static async initialize() {
    // Generate or load encryption key
    this.key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    )
  }

  static async store(name: string, value: string) {
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.key,
      new TextEncoder().encode(value),
    )

    // Store encrypted value in memory
    this.vault.set(name, encrypted)

    // Never log or expose the raw value
    console.log(`Secret '${name}' stored securely`)
  }

  static async retrieve(name: string): Promise<string> {
    const encrypted = this.vault.get(name)
    if (!encrypted) throw new Error(`Secret '${name}' not found`)

    const iv = crypto.getRandomValues(new Uint8Array(12))
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      this.key,
      encrypted,
    )

    return new TextDecoder().decode(decrypted)
  }

  static async rotate() {
    // Rotate encryption keys periodically
    const newKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    )

    // Re-encrypt all secrets with new key
    for (const [name, encrypted] of this.vault) {
      const value = await this.retrieve(name)
      this.key = newKey
      await this.store(name, value)
    }
  }
}
```

### 2. Dependency Vulnerability Scanning

```typescript
// scripts/security-audit.ts
import { $ } from 'bun'

export async function auditDependencies() {
  console.log('🔍 Scanning dependencies for vulnerabilities...')

  // Check for known vulnerabilities
  const { stdout: auditResult } = await $`bun audit`.quiet()

  // Parse audit results
  const vulnerabilities = JSON.parse(auditResult.toString())

  if (vulnerabilities.critical > 0) {
    console.error('❌ Critical vulnerabilities found!')
    process.exit(1)
  }

  if (vulnerabilities.high > 0) {
    console.warn('⚠️ High severity vulnerabilities found')
  }

  // Check for outdated packages
  const { stdout: outdated } = await $`bun outdated`.quiet()
  console.log('📦 Outdated packages:', outdated.toString())

  // License compliance check
  await checkLicenses()

  console.log('✅ Security audit complete')
}

async function checkLicenses() {
  const allowedLicenses = [
    'MIT',
    'Apache-2.0',
    'BSD-3-Clause',
    'BSD-2-Clause',
    'ISC',
  ]

  // Scan all package licenses
  const packages = await Bun.file('bun.lockb').json()

  for (const [name, info] of Object.entries(packages)) {
    if (!allowedLicenses.includes(info.license)) {
      console.warn(`⚠️ Package ${name} has license: ${info.license}`)
    }
  }
}
```

### 3. Runtime Security Monitoring

```typescript
// packages/security/src/monitor.ts
export class SecurityMonitor {
  private static events: SecurityEvent[] = []

  static initialize() {
    // Monitor file system access
    this.monitorFileSystem()

    // Monitor network requests
    this.monitorNetwork()

    // Monitor process execution
    this.monitorProcesses()

    // Monitor memory usage
    this.monitorMemory()
  }

  private static monitorFileSystem() {
    const originalReadFile = Bun.file
    Bun.file = (path: string) => {
      // Log file access
      this.logEvent({
        type: 'file_read',
        path,
        timestamp: Date.now(),
        stack: new Error().stack,
      })

      // Check against whitelist
      if (!this.isAllowedPath(path)) {
        throw new SecurityError(`Unauthorized file access: ${path}`)
      }

      return originalReadFile(path)
    }
  }

  private static monitorNetwork() {
    const originalFetch = globalThis.fetch
    globalThis.fetch = async (url: RequestInfo, init?: RequestInit) => {
      const urlString = url.toString()

      // Log network request
      this.logEvent({
        type: 'network_request',
        url: urlString,
        method: init?.method || 'GET',
        timestamp: Date.now(),
      })

      // Check against whitelist
      if (!this.isAllowedUrl(urlString)) {
        throw new SecurityError(`Unauthorized network access: ${urlString}`)
      }

      // Strip sensitive headers
      const sanitizedHeaders = this.sanitizeHeaders(init?.headers)

      return originalFetch(url, { ...init, headers: sanitizedHeaders })
    }
  }

  private static isAllowedPath(path: string): boolean {
    const allowed = [
      /^\/Users\/.*\/code\/mnemosyne/, // Project directory
      /^\/tmp/, // Temp files
      /^node_modules/, // Dependencies
    ]

    return allowed.some((pattern) => pattern.test(path))
  }

  private static isAllowedUrl(url: string): boolean {
    const allowed = [
      'https://api.openai.com',
      'https://api.elevenlabs.io',
      'https://registry.npmjs.org',
      'http://localhost',
      'http://127.0.0.1',
    ]

    return allowed.some((prefix) => url.startsWith(prefix))
  }

  private static sanitizeHeaders(headers?: HeadersInit): HeadersInit {
    if (!headers) return {}

    const sensitive = ['authorization', 'cookie', 'x-api-key']
    const sanitized = new Headers(headers)

    // Mask sensitive headers in logs
    for (const key of sensitive) {
      if (sanitized.has(key)) {
        const value = sanitized.get(key)!
        const masked = value.substring(0, 4) + '****'
        console.log(`Header ${key}: ${masked}`)
      }
    }

    return sanitized
  }
}
```

### 4. Input Validation & Sanitization

```typescript
// packages/security/src/validation.ts
import { z } from 'zod'

export class InputValidator {
  // SQL Injection Prevention
  static sanitizeSql(input: string): string {
    // Remove dangerous SQL keywords
    const dangerous = /(DROP|DELETE|UPDATE|INSERT|EXEC)/gi
    if (dangerous.test(input)) {
      throw new SecurityError('Potential SQL injection detected')
    }

    // Escape special characters
    return input.replace(/['"\;]/g, '')
  }

  // XSS Prevention
  static sanitizeHtml(input: string): string {
    const htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
    }

    return input.replace(/[&<>"'\/]/g, (s) => htmlEntities[s])
  }

  // Path Traversal Prevention
  static sanitizePath(input: string): string {
    // Prevent directory traversal
    if (input.includes('..') || input.includes('~')) {
      throw new SecurityError('Path traversal attempt detected')
    }

    // Normalize path
    return path.normalize(input).replace(/^\.+/, '')
  }

  // Command Injection Prevention
  static sanitizeCommand(input: string): string {
    // Whitelist allowed characters
    const safe = /^[a-zA-Z0-9_\-\.]+$/
    if (!safe.test(input)) {
      throw new SecurityError('Unsafe command characters detected')
    }

    return input
  }
}
```

### 5. Secure Binary Compilation

```typescript
// scripts/secure-compile.ts
import { $ } from 'bun'
import { createHash } from 'bun:crypto'

export async function secureCompile(entrypoint: string, output: string) {
  // Compile with security flags
  await $`bun build --compile ${entrypoint} \
    --outfile ${output} \
    --minify \
    --no-source-map \
    --target bun-linux-x64`

  // Strip debug symbols
  await $`strip ${output}`

  // Set restrictive permissions
  await $`chmod 755 ${output}`

  // Generate checksum
  const binary = await Bun.file(output).arrayBuffer()
  const hash = createHash('sha256')
  hash.update(binary)
  const checksum = hash.digest('hex')

  // Save checksum for verification
  await Bun.write(`${output}.sha256`, checksum)

  console.log(`✅ Securely compiled: ${output}`)
  console.log(`🔐 SHA256: ${checksum}`)
}
```

### 6. Content Security Policy

```typescript
// packages/security/src/csp.ts
export const contentSecurityPolicy = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'"], // Tighten in production
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'font-src': ["'self'"],
  'connect-src': [
    "'self'",
    'https://api.openai.com',
    'https://api.elevenlabs.io',
  ],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': [],
}

// Generate CSP header
export function generateCSP(): string {
  return Object.entries(contentSecurityPolicy)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ')
}
```

## Security Testing

### Penetration Testing Suite

```typescript
// packages/test-external/tests/security/penetration.test.ts
import { describe, test, expect } from 'bun:test'

describe('Security Penetration Tests', () => {
  test('SQL injection prevention', async () => {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "1' OR '1'='1",
      "admin'--",
      "' OR 1=1--",
    ]

    for (const input of maliciousInputs) {
      expect(() => InputValidator.sanitizeSql(input)).toThrow(SecurityError)
    }
  })

  test('XSS prevention', () => {
    const xssPayloads = [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')",
    ]

    for (const payload of xssPayloads) {
      const sanitized = InputValidator.sanitizeHtml(payload)
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('javascript:')
    }
  })

  test('Path traversal prevention', () => {
    const traversalAttempts = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32',
      '~/../../etc/shadow',
    ]

    for (const attempt of traversalAttempts) {
      expect(() => InputValidator.sanitizePath(attempt)).toThrow(SecurityError)
    }
  })

  test('Command injection prevention', () => {
    const injectionAttempts = [
      'ls; rm -rf /',
      "echo 'test' && cat /etc/passwd",
      'test`whoami`',
      'test$(whoami)',
    ]

    for (const attempt of injectionAttempts) {
      expect(() => InputValidator.sanitizeCommand(attempt)).toThrow(
        SecurityError,
      )
    }
  })
})
```

### Security Audit Automation

```bash
#!/bin/bash
# scripts/security-audit.sh

echo "🔐 Running comprehensive security audit..."

# Dependency vulnerabilities
echo "🔍 Checking dependencies..."
bun audit

# Check for exposed secrets
echo "🕵️ Scanning for exposed secrets..."
if grep -r "sk-[a-zA-Z0-9]" packages/*/src; then
  echo "❌ Found potential exposed API keys!"
  exit 1
fi

# Check file permissions
echo "📁 Checking file permissions..."
find . -type f -perm 0777 -exec ls -la {} \;

# Static analysis
echo "🔬 Running static analysis..."
bun run eslint --plugin security

# OWASP dependency check
echo "🔒 OWASP dependency check..."
dependency-check --project mnemosyne --scan .

echo "✅ Security audit complete"
```

## Security Configuration

### Production Hardening

```typescript
// bunfig.production.toml
[security]
# Disable development features
debug = false
verbose = false

# Enable security features
strictMode = true
checkPermissions = true
sandbox = true

# Resource limits
maxMemory = "1GB"
maxCpu = 4
maxFileSize = "100MB"
maxRequestSize = "10MB"

# Network restrictions
allowedHosts = [
  "api.openai.com",
  "api.elevenlabs.io",
]

# Timeout settings
requestTimeout = 30000
idleTimeout = 300000

[build]
# Security compilation flags
minify = true
obfuscate = true
stripDebugInfo = true
compressOutput = true
```

### Environment Variable Security

```typescript
// packages/security/src/env-security.ts
export class SecureEnv {
  private static validated = false

  static validate() {
    if (this.validated) return

    // Required security environment variables
    const required = ['NODE_ENV', 'ENCRYPTION_KEY', 'JWT_SECRET']

    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing required env var: ${key}`)
      }
    }

    // Validate format
    if (process.env.NODE_ENV === 'production') {
      // Ensure secrets are strong
      if (process.env.JWT_SECRET!.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters')
      }

      // Ensure no debug flags in production
      if (process.env.DEBUG) {
        throw new Error('DEBUG must not be set in production')
      }
    }

    this.validated = true
  }

  static get(key: string): string {
    this.validate()

    // Log access (but not the value)
    console.log(`Env access: ${key}`)

    return process.env[key] || ''
  }
}
```

## Compliance & Standards

### OWASP Top 10 Mitigation

1. **Injection** - Input validation, parameterized queries
2. **Broken Authentication** - Secure session management
3. **Sensitive Data Exposure** - Encryption at rest and in transit
4. **XML External Entities** - Disable XXE processing
5. **Broken Access Control** - Permission system
6. **Security Misconfiguration** - Secure defaults
7. **Cross-Site Scripting** - Content Security Policy
8. **Insecure Deserialization** - Input validation
9. **Using Components with Known Vulnerabilities** - Dependency scanning
10. **Insufficient Logging** - Comprehensive security monitoring

### Security Checklist

- [ ] All dependencies scanned for vulnerabilities
- [ ] No hardcoded secrets in code
- [ ] Input validation on all user inputs
- [ ] Secure headers configured
- [ ] Content Security Policy implemented
- [ ] Rate limiting enabled
- [ ] Encryption for sensitive data
- [ ] Audit logging enabled
- [ ] Security monitoring active
- [ ] Regular security updates scheduled
- [ ] Incident response plan documented
- [ ] Security training completed

## Incident Response

### Security Incident Workflow

1. **Detection** - Monitor alerts, automated scanning
2. **Containment** - Isolate affected systems
3. **Investigation** - Analyze logs, identify root cause
4. **Remediation** - Patch vulnerability, update systems
5. **Recovery** - Restore normal operations
6. **Post-Mortem** - Document lessons learned

### Emergency Contacts

- Security Team: security@example.com
- On-Call Engineer: +1-xxx-xxx-xxxx
- Incident Hotline: +1-xxx-xxx-xxxx

## Success Metrics

- Zero critical vulnerabilities
- < 5 high severity issues
- 100% secrets encrypted
- All inputs validated
- Security audit passing
- Compliance requirements met
- < 1 hour incident response time
