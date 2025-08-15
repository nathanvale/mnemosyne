import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // In development, transpile only used workspace packages for source file access
  // In production, use pre-built packages for optimal performance
  transpilePackages:
    process.env.NODE_ENV === 'development'
      ? ['@studio/db', '@studio/logger', '@studio/ui', '@studio/mocks']
      : [], // Use pre-built packages in production

  experimental: {
    // Optimize package imports for better tree-shaking
    optimizePackageImports: [
      '@studio/db',
      '@studio/logger',
      '@studio/ui',
      '@studio/mocks',
    ],
  },
}

export default nextConfig
