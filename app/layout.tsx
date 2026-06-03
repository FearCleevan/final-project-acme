import type { Metadata } from 'next'
import { Playfair_Display, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import ShellClient from '@/components/shared/ShellClient'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

// TODO: once domain is registered, set NEXT_PUBLIC_SITE_URL=https://acmevintagesupply.ca in Vercel env vars
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://acmelampandsign.vercel.app'
const SITE_NAME = 'Acme Vintage Supply'
const DESCRIPTION =
  'Antique oil lamp chimneys, shades, pressure lamps, burners, wicks, and original Victorian enamel advertising signs. Individually sourced, bench-tested, and shipped across North America.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    template: `%s | ${SITE_NAME}`,
    default: `${SITE_NAME} — Antique Oil Lamps & Signs`,
  },
  description: DESCRIPTION,
  keywords: [
    'antique oil lamps',
    'oil lamp chimneys',
    'oil lamp shades',
    'pressure lamps',
    'Victorian oil lamps',
    'Edwardian oil lamps',
    'enamel advertising signs',
    'vintage advertising signs',
    'oil lamp restoration',
    'antique lamp parts',
    'oil lamp burners',
    'oil lamp wicks',
    'porcelain signs',
    'antique lighting Canada',
    'vintage lamp hardware',
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Antique Oil Lamps & Signs`,
    description: DESCRIPTION,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Antique Oil Lamps & Signs`,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Antique Oil Lamps & Signs`,
    description: DESCRIPTION,
    images: ['/opengraph-image'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  alternates: {
    canonical: SITE_URL,
  },

  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },

  category: 'shopping',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: SITE_NAME,
  description: DESCRIPTION,
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  image: `${SITE_URL}/opengraph-image`,
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'CA',
  },
  priceRange: '$$',
  currenciesAccepted: 'CAD',
  paymentAccepted: 'Credit Card',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Antique Oil Lamps & Advertising Signs',
    description: 'Individually sourced Victorian and Edwardian oil lamp parts and original enamel advertising signs. Each piece bench-inspected before dispatch.',
  },
  sameAs: [],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${playfair.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      style={
        {
          '--font-serif': 'var(--font-playfair), "Cormorant Garamond", Georgia, serif',
          '--font-sans':  'var(--font-inter), system-ui, -apple-system, Arial, sans-serif',
          '--font-mono':  'var(--font-jetbrains-mono), "IBM Plex Mono", ui-monospace, Menlo, monospace',
        } as React.CSSProperties
      }
    >
      <body className="bg-parchment text-ink-iron min-h-screen antialiased flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <ShellClient>{children}</ShellClient>
      </body>
    </html>
  )
}
