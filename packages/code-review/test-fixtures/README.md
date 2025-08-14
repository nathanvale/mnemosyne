# Test Fixtures

> ⚠️ **WARNING: FOR TESTING PURPOSES ONLY** ⚠️

This directory contains test fixtures and example code with **INTENTIONAL SECURITY VULNERABILITIES** for testing the code review analysis capabilities.

## Structure

- `security-examples/` - Contains example code with various security vulnerabilities
  - These files are used to test the security analysis features
  - They contain hardcoded credentials and vulnerable patterns BY DESIGN
  - Never use any code from this directory in production

## Important Notes

1. **All credentials in these files are fake/test examples**
2. **Files in this directory should NEVER be copied to production code**
3. **These examples exist solely to validate security scanning capabilities**
4. **All files are clearly marked with warnings about their test nature**

## Usage

These fixtures are used by the test suite to validate that the security analyzer can correctly identify various vulnerability patterns including:

- SQL Injection vulnerabilities
- Hardcoded credentials and secrets
- Cross-Site Scripting (XSS) vulnerabilities
- Command injection vulnerabilities
- Other common security anti-patterns

## Security Considerations

- All test credentials follow obvious test patterns (e.g., "TEST", "EXAMPLE", "424242")
- The `.gitignore` file ensures no real credentials are accidentally committed
- Pre-commit hooks validate that no real-looking credentials exist in these files
