/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.rbxcdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'tr.rbxcdn.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;


