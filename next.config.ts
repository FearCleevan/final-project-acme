import type { NextConfig } from "next";

const SHOPIFY_DOMAIN = 'w061f6-k8.myshopify.com'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ebayimg.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
    ],
  },
  async redirects() {
    return [
      // Shopify checkout URLs sometimes use our custom domain as the base.
      // Since our domain is served by Vercel (not Shopify), these paths 404.
      // Redirect them to the Shopify domain so checkout loads correctly.
      {
        source: '/cart/:path*',
        destination: `https://${SHOPIFY_DOMAIN}/cart/:path*`,
        permanent: false,
      },
      {
        source: '/checkouts/:path*',
        destination: `https://${SHOPIFY_DOMAIN}/checkouts/:path*`,
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
