/**
 * DELIBERATELY VULNERABLE CODE FOR TESTING SECURITY ANALYSIS
 * This file contains intentional security vulnerabilities for testing purposes
 * DO NOT USE IN PRODUCTION
 */

import { exec } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'

// 1. SQL Injection Vulnerability
export function getUserData(userId: string) {
  // VULNERABLE: Direct string interpolation in SQL query
  const query = `SELECT * FROM users WHERE id = '${userId}'`
  // This allows SQL injection attacks like: '; DROP TABLE users; --
  return executeQuery(query)
}

// 2. Hardcoded Secrets and API Keys
export const DATABASE_PASSWORD = 'super-secret-password-123'
export const API_KEY = 'sk-1234567890abcdef'
export const JWT_SECRET = 'my-jwt-secret-key'
export const GITHUB_TOKEN = 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
export const AWS_ACCESS_KEY = 'AKIAIOSFODNN7EXAMPLE'
export const STRIPE_SECRET = 'sk_test_51234567890abcdef'

// 3. Unsafe File Operations
export function readUserFile(filename: string) {
  // VULNERABLE: No path validation - allows path traversal
  const content = readFileSync(`/uploads/${filename}`, 'utf8')
  return content
}

// 4. XSS Vulnerability in Output
export function renderUserComment(comment: string) {
  // VULNERABLE: No HTML escaping
  return `<div class="comment">${comment}</div>`
}

// 5. Insecure Random Number Generation
export function generateSessionToken() {
  // VULNERABLE: Math.random() is not cryptographically secure
  return Math.random().toString(36).substring(2, 15)
}

// 6. Unsafe eval() Usage
export function processUserExpression(expression: string) {
  // VULNERABLE: eval() allows arbitrary code execution
  return eval(expression)
}

// 7. Path Traversal Vulnerability
export function serveStaticFile(filepath: string) {
  // VULNERABLE: No path sanitization
  const fullPath = `/var/www/static/${filepath}`
  return readFileSync(fullPath)
}

// 8. Weak Cryptographic Algorithm
export function hashPassword(password: string) {
  // VULNERABLE: MD5 is cryptographically broken
  return createHash('md5').update(password).digest('hex')
}

// 9. Prototype Pollution
export function mergeObjects(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
) {
  // VULNERABLE: No protection against __proto__ pollution
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
      target[key] = target[key] || {}
      mergeObjects(
        target[key] as Record<string, unknown>,
        source[key] as Record<string, unknown>,
      )
    } else {
      target[key] = source[key]
    }
  }
  return target
}

// 10. Command Injection Vulnerability
export function processFile(filename: string) {
  // VULNERABLE: Direct command execution with user input
  exec(`convert ${filename} output.jpg`, (error) => {
    if (error) {
      console.error('Error:', error)
    }
  })
}

// 11. Insecure HTTP Usage
export function fetchUserData(userId: string) {
  // VULNERABLE: Using HTTP instead of HTTPS for sensitive data
  const url = `http://api.example.com/users/${userId}`
  return fetch(url)
}

// 12. LDAP Injection Vulnerability
export function authenticateUser(username: string, password: string) {
  // VULNERABLE: Direct LDAP query construction
  const filter = `(&(uid=${username})(userPassword=${password}))`
  return searchLDAP(filter)
}

// 13. Information Disclosure
export function handleError(
  error: Error,
  res: { status: (code: number) => { json: (data: unknown) => void } },
) {
  // VULNERABLE: Exposing sensitive error information
  res.status(500).json({
    error: error.message,
    stack: error.stack,
    env: process.env,
  })
}

// 14. Unsafe Deserialization
export function loadUserPreferences(data: string) {
  // VULNERABLE: Deserializing untrusted data
  return JSON.parse(data)
}

// 15. Race Condition in File Operations
let counter = 0
export function incrementCounter() {
  // VULNERABLE: Race condition - not atomic
  const current = counter
  setTimeout(() => {
    counter = current + 1
    writeFileSync('/tmp/counter.txt', counter.toString())
  }, 10)
}

// Helper functions (mock implementations)
function executeQuery(query: string) {
  console.warn('Executing query:', query)
  return []
}

function searchLDAP(filter: string) {
  console.warn('LDAP search:', filter)
  return { authenticated: true }
}
