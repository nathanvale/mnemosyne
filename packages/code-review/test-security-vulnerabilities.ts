/**
 * Test file with intentional security vulnerabilities
 * This file is designed to test our security analysis integration
 * DO NOT USE THIS CODE IN PRODUCTION
 */

import { execSync } from 'child_process'
import crypto from 'crypto'

// 1. Command Injection Vulnerability (CWE-78)
export function executeUserCommand(userInput: string) {
  // VULNERABLE: Direct user input in shell command
  return execSync(`ls -la ${userInput}`).toString()
}

// 2. SQL Injection Vulnerability (CWE-89)
export function getUserById(userId: string) {
  // VULNERABLE: Direct string concatenation in SQL
  const query = `SELECT * FROM users WHERE id = '${userId}'`
  return query // In real code, this would be executed
}

// 3. XSS Vulnerability (CWE-79)
export function displayMessage(message: string) {
  // VULNERABLE: Unescaped user input in HTML
  document.getElementById('content')!.innerHTML = `<div>${message}</div>`
}

// 4. Hardcoded Secrets (CWE-798)
const API_KEY = 'sk-1234567890abcdef1234567890abcdef'
const DB_PASSWORD = 'admin123'
const JWT_SECRET = 'supersecretkey'

// Use the secrets to prevent unused variable errors
export function getApiKey() {
  return API_KEY
}

export function getJwtSecret() {
  return JWT_SECRET
}

// 5. Insecure Random Number Generation (CWE-330)
export function generateSessionId() {
  // VULNERABLE: Using Math.random() for security purposes
  return Math.random().toString(36).substring(7)
}

// 6. Path Traversal Vulnerability (CWE-22)
export async function readFile(filename: string) {
  // VULNERABLE: No path validation
  const fs = await import('fs')
  return fs.readFileSync(`./uploads/${filename}`, 'utf8')
}

// 7. Weak Cryptography (CWE-327)
export function hashPassword(password: string) {
  // VULNERABLE: Using MD5 for password hashing
  return crypto.createHash('md5').update(password).digest('hex')
}

// 8. Missing Authentication (CWE-306)
export function deleteUser(userId: string) {
  // VULNERABLE: No authentication check
  return `DELETE FROM users WHERE id = '${userId}'`
}

// 9. Information Disclosure (CWE-209)
export function login(username: string, password: string) {
  try {
    // Simulate login logic
    if (username === 'admin' && password === DB_PASSWORD) {
      return { success: true, token: generateSessionId() }
    }
    throw new Error(`Login failed for user: ${username}`)
  } catch (error) {
    // VULNERABLE: Exposing internal error details
    throw new Error(`Database connection failed: ${error}`)
  }
}

// 10. CSRF Vulnerability (CWE-352)
export function transferMoney(
  fromAccount: string,
  toAccount: string,
  amount: number,
) {
  // VULNERABLE: No CSRF token validation
  return `Transfer $${amount} from ${fromAccount} to ${toAccount}`
}

// 11. Deserialization Vulnerability (CWE-502)
export function processUserData(serializedData: string) {
  // VULNERABLE: Deserializing untrusted data
  return JSON.parse(serializedData)
}

// 12. Race Condition (CWE-362)
let userBalance = 1000

export function withdraw(amount: number) {
  // VULNERABLE: Race condition - check and use not atomic
  if (userBalance >= amount) {
    // Simulate some processing time
    setTimeout(() => {
      userBalance -= amount
    }, 100)
    return true
  }
  return false
}
