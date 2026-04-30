import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Keep @react-pdf/renderer in Node.js runtime (not bundled by webpack)
  serverExternalPackages: ['@react-pdf/renderer'],
}

export default nextConfig
