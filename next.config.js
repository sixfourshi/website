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
  async redirects() {
    return [
      {
        source: '/executors',
        destination: '/suggestion',
        permanent: true,
      },
      {
        source: '/suggestions',
        destination: '/suggestion',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/games',
        destination: '/scripts',
      },
      {
        source: '/games/:slug',
        destination: '/scripts/:slug',
      },
    ];
  },
};

module.exports = nextConfig;


