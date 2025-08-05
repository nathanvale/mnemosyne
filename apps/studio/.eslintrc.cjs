// Use Next.js default ESLint config to avoid conflicts
module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Allow console methods for development
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
}
