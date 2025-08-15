import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // In development, transpile all workspace packages to use source files directly
  // In production, use pre-built packages for optimal performance
  transpilePackages:
    process.env.NODE_ENV === 'development'
      ? [
          '@studio/db',
          '@studio/logger',
          '@studio/ui',
          '@studio/mocks',
          '@studio/schema',
          '@studio/shared',
          '@studio/validation',
          '@studio/test-config',
          '@studio/memory',
          '@studio/scripts',
          '@studio/mcp',
          '@studio/dev-tools',
          '@studio/code-review',
          '@studio/claude-hooks',
        ]
      : [], // Use pre-built packages in production

  experimental: {
    // Optimize package imports for better tree-shaking
    optimizePackageImports: [
      '@studio/db',
      '@studio/logger',
      '@studio/ui',
      '@studio/mocks',
      '@studio/schema',
      '@studio/shared',
      '@studio/validation',
      '@studio/memory',
      '@studio/mcp',
    ],
  },
}

export default nextConfig
