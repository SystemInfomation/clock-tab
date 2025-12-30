/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: process.env.NODE_ENV === 'production', // Disable in development to prevent double renders
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.discordapp.com',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
