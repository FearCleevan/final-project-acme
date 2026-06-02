import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'The Full Catalog',
  description:
    'Browse all 50 hand-numbered antique oil lamp parts — lighting fixtures, hand-blown glass chimneys, brass burners, and porcelain signs. Filter by burner size, material, or collection.',
  openGraph: {
    title: 'The Full Catalog | Acme Vintage Supply',
    description:
      'Fifty pieces. Filter by burner size, material, or collection. Every piece hand-numbered, bench-tested, and packed in straw — there is no second batch.',
  },
  alternates: {
    canonical: '/catalog',
  },
}

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
