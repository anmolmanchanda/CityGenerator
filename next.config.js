/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle three.js on client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
      };
    }
    return config;
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    CUSTOM_KEY: 'citygenerator',
  },
};

module.exports = nextConfig;