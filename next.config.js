/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  skipTrailingSlashRedirect: true,
  experimental: {},
  images: {
    formats: ['image/avif', 'image/webp'],
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
      {
        source: '/scripts',
        destination: '/games',
        permanent: true,
      },
      {
        source: '/scripts/:slug',
        destination: '/games/:slug',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;


