/* eslint-disable prefer-template */
/**
 * Example file with intentional security vulnerabilities for testing
 * DO NOT USE IN PRODUCTION - FOR TESTING PURPOSES ONLY
 */

// Mock Express types to avoid dependency
interface Request {
  params: Record<string, string>
  query: Record<string, string>
  body: Record<string, unknown>
}

interface Response {
  json: (data: unknown) => void
  send: (html: string) => void
}

// Vulnerability 1: SQL Injection
export function getUserData(req: Request, res: Response) {
  const userId = req.params.id

  // VULNERABLE: Direct string concatenation in SQL query
  const query = "SELECT * FROM users WHERE id = '" + userId + "'"

  // This allows SQL injection attacks like:
  // /users/1' OR '1'='1
  // /users/1'; DROP TABLE users; --

  // Execute query (vulnerable)
  // db.execute(query)

  res.json({ query })
}

// Vulnerability 2: Hardcoded Secrets
export const API_CONFIG = {
  // VULNERABLE: Hardcoded API key (test example)
  apiKey: 'sk_test_424242424242424242424242424242424242TEST',

  // VULNERABLE: Hardcoded database password
  dbPassword: 'SuperSecretPassword123!@#',

  // VULNERABLE: JWT secret key
  jwtSecret: 'my-super-secret-jwt-key-that-should-be-in-env',

  // VULNERABLE: AWS credentials (test examples)
  awsAccessKey: 'AKIA-TEST-EXAMPLE-CREDENTIALS',
  awsSecretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY-TEST',
}

// Vulnerability 3: Cross-Site Scripting (XSS)
export function renderUserProfile(req: Request, res: Response) {
  const username = req.query.name

  // VULNERABLE: Direct HTML rendering without sanitization
  const html = `
    <html>
      <body>
        <h1>Welcome ${username}!</h1>
        <div>${req.body.userBio}</div>
      </body>
    </html>
  `

  // This allows XSS attacks like:
  // ?name=<script>alert('XSS')</script>
  // userBio: <img src=x onerror="alert('XSS')">

  res.send(html)
}

// Additional vulnerability: Command Injection
export function processFile(req: Request, res: Response) {
  const filename = req.body.file

  // VULNERABLE: Direct command execution with user input
  const command = `cat /uploads/${filename}`

  // This allows command injection like:
  // file: "test.txt; rm -rf /"

  // Execute command (vulnerable)
  // exec(command)

  res.json({ command })
}
