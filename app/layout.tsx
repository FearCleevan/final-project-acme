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

export const metadata: Metadata = {
  title: 'Acme Lamp & Sign Co. — Authentic Antique Oil Lamp Parts',
  description:
    'Fifty crates of precision-reproduced antique oil lamp parts, hand-blown chimneys, and porcelain advertising signs. Sourced from a 125-year Pune workshop, distributed from Adelaide.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
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
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <ShellClient>{children}</ShellClient>
      </body>
    </html>
  )
}
