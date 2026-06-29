import type { Metadata } from 'next'
import { Playfair_Display, Inter, JetBrains_Mono, Geist } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import ShellClient from '@/components/shared/ShellClient'
import { cn } from "@/lib/utils";
import { Analytics } from '@vercel/analytics/react'
import PageViewTracker from '@/components/analytics/PageViewTracker'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://acmevintagesupply.com'
const SITE_NAME = 'Acme Vintage Supply'
const DESCRIPTION =
  'Buy oil lamp chimneys, shades, pressure lamp glass, wicks, and original Victorian enamel advertising signs. Bench-tested antique lamp parts shipped across Canada and North America from Dartmouth, Nova Scotia.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    template: `%s | ${SITE_NAME}`,
    default: `${SITE_NAME} — Oil Lamp Chimneys, Shades & Enamel Signs`,
  },
  description: DESCRIPTION,
  keywords: [
    // Core product keywords
    'oil lamp chimneys',
    'oil lamp shades',
    'oil lamp supply',
    'buy oil lamp chimneys',
    'antique oil lamp parts',
    'oil lamp replacement parts',
    'oil lamp parts Canada',
    // Chimney types
    'duplex chimney',
    'Kosmos chimney',
    'Miller chimney',
    'crimp chimney',
    'frosted chimney',
    'crystal cut chimney',
    'comet chimney',
    'flair top chimney',
    'hurricane lamp glass',
    'pressure lamp glass',
    'Coleman pressure lamp glass',
    'Aladdin pressure lamp glass',
    // Shades
    'oil lamp shades for sale',
    'Victorian oil lamp shades',
    'tulip shade oil lamp',
    'beehive shade oil lamp',
    'antique lamp shades',
    // Signs
    'enamel advertising signs',
    'antique enamel signs',
    'vintage enamel signs',
    'porcelain advertising signs',
    'vintage signs Canada',
    'enamel signs for sale',
    // General
    'antique oil lamps',
    'Victorian oil lamps',
    'Edwardian oil lamps',
    'oil lamp restoration',
    'oil lamp wicks',
    'oil lamp burners',
    'antique lighting Canada',
    'vintage lamp hardware',
    'oil lamp supply Canada',
    'oil lamp supply Nova Scotia',
    'buy oil lamp parts online',
    'vintage oil lamp shop',
    'oil kerosene lamp parts',
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Oil Lamp Chimneys, Shades & Enamel Signs`,
    description: DESCRIPTION,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — Oil Lamp Chimneys, Shades & Enamel Signs`,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Oil Lamp Chimneys, Shades & Enamel Signs`,
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
  telephone: '+1-902-481-1007',
  email: 'acmesign01@gmail.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Dartmouth',
    addressRegion: 'Nova Scotia',
    addressCountry: 'CA',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '44.6658',
    longitude: '-63.5669',
  },
  priceRange: '$$',
  currenciesAccepted: 'CAD',
  paymentAccepted: 'Credit Card, PayPal',
  areaServed: ['CA', 'US'],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Oil Lamp Parts & Enamel Advertising Signs',
    description: 'Oil lamp chimneys, shades, pressure lamp glass, wicks, burners, and original Victorian enamel advertising signs. Each piece bench-inspected before dispatch.',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Oil Lamp Chimneys' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Oil Lamp Shades' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Pressure Lamp Glass' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Enamel Advertising Signs' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Oil Lamp Wicks' } },
    ],
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
      className={cn(playfair.variable, inter.variable, jetbrainsMono.variable, "font-sans", geist.variable)}
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
        <Analytics />
        <PageViewTracker />
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
