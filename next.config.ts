import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/cart/:path*',
        destination: '/',
        permanent: false,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ebayimg.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
    ],
  },
};

export default nextConfig;
