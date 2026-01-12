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
  // Webpack config - puppeteer-core doesn't need to be excluded
  // (it doesn't include Chromium like regular puppeteer does)
  webpack: (config) => {
    return config
  },
}

export default nextConfig
