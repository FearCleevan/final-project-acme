import type { Metadata } from 'next'
import { Playfair_Display, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import ShellClient from '@/components/shared/ShellClient'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-playfair',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://acmelamp.co'
const SITE_NAME = 'Acme Lamp & Sign Co.'
const DESCRIPTION =
  'Fifty crates of precision-reproduced antique oil lamp parts, hand-blown chimneys, and porcelain advertising signs. Sourced from a 125-year Pune workshop, distributed from Adelaide. No second batch.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    template: `%s | ${SITE_NAME}`,
    default: `${SITE_NAME} — Authentic Antique Oil Lamp Parts`,
  },
  description: DESCRIPTION,
  keywords: [
    'antique oil lamp parts',
    'oil lamp chimneys',
    'brass burners',
    'porcelain signs',
    'antique lighting',
    'oil lamp restoration',
    'vintage lamp parts',
    'hand-blown chimneys',
    'lamp burner sizes',
    'antique lamp hardware',
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Authentic Antique Oil Lamp Parts`,
    description: DESCRIPTION,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Authentic Antique Oil Lamp Parts`,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Authentic Antique Oil Lamp Parts`,
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
    addressLocality: 'Adelaide',
    addressRegion: 'SA',
    addressCountry: 'AU',
  },
  priceRange: '$$',
  currenciesAccepted: 'AUD',
  paymentAccepted: 'Credit Card',
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Antique Oil Lamp Parts — Spring Release',
    description: 'Fifty hand-numbered pieces. Precision-reproduced from original 19th-century dies.',
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
