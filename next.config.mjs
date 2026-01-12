/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Turbopack config (Next.js 16+)
  turbopack: {},
  // Webpack config for Puppeteer (fallback)
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude puppeteer from client bundle
      config.externals = [...(config.externals || []), 'puppeteer']
    }
    return config
  },
}

export default nextConfig
