import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ebayimg.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },

  async headers() {
    // React dev mode (Turbopack) requires eval() — safe to allow in dev only
    const isDev = process.env.NODE_ENV === 'development'
    const scriptSrc = isDev
      ? "'self' 'unsafe-inline' 'unsafe-eval'"
      : "'self' 'unsafe-inline'"

    // Safe headers for storefront — no CSP (would break Shopify/Google Fonts CDN)
    const storefrontHeaders = [
      { key: 'Strict-Transport-Security',   value: 'max-age=31536000; includeSubDomains' },
      { key: 'X-Content-Type-Options',      value: 'nosniff' },
      { key: 'X-Frame-Options',             value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy',             value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy',          value: 'camera=(), microphone=(), geolocation=()' },
      // COOP: allow-popups so Shopify checkout window still opens
      { key: 'Cross-Origin-Opener-Policy',  value: 'same-origin-allow-popups' },
      // CORP: cross-origin so Shopify/CDN can load our assets
      { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
    ]

    // Strict headers for /admin/* — admin loads nothing external
    const adminHeaders = [
      { key: 'Strict-Transport-Security',          value: 'max-age=31536000; includeSubDomains' },
      { key: 'X-Content-Type-Options',             value: 'nosniff' },
      { key: 'X-Frame-Options',                    value: 'DENY' },
      { key: 'Referrer-Policy',                    value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy',                 value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'Content-Security-Policy',            value: `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'` },
      { key: 'Cache-Control',                      value: 'no-store, no-cache, must-revalidate' },
      { key: 'X-Permitted-Cross-Domain-Policies',  value: 'none' },
      { key: 'Cross-Origin-Opener-Policy',         value: 'same-origin' },
      { key: 'Cross-Origin-Resource-Policy',       value: 'same-origin' },
    ]

    return [
      {
        // All routes except /admin
        source:  '/((?!admin).*)',
        headers: storefrontHeaders,
      },
      {
        // Admin routes only
        source:  '/admin/:path*',
        headers: adminHeaders,
      },
    ]
  },
}

export default nextConfig
