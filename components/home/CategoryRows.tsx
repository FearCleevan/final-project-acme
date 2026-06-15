import Link from 'next/link'
import { getProductsByCategory } from '@/lib/shopify'
import type { Product } from '@/lib/types'
import Eyebrow from '@/components/shared/Eyebrow'
import ProductCard from '@/components/catalog/ProductCard'

const ROWS: { label: string; handle: Product['category']; href: string }[] = [
  { label: 'Oil Lamp Shades',  handle: 'oil-lamp-shades',   href: '/catalog?category=oil-lamp-shades' },
  { label: 'Glass & Chimneys', handle: 'oil-lamp-chimneys', href: '/catalog?category=oil-lamp-chimneys' },
  { label: 'Burners & Wicks',  handle: 'oil-lamp-wicks',    href: '/catalog?category=oil-lamp-wicks' },
]

export default async function CategoryRows() {
  const results = await Promise.all(
    ROWS.map(row => getProductsByCategory(row.handle).catch(() => []))
  )

  const rows = ROWS.map((row, i) => ({ ...row, products: results[i].slice(0, 5) }))
    .filter(row => row.products.length > 0)

  if (rows.length === 0) return null

  return (
    <section className="bg-parchment border-t border-ink-rule px-6 py-20">
      <div className="max-w-[1280px] mx-auto">

        <div className="mb-12">
          <Eyebrow className="mb-3">Shop by type</Eyebrow>
          <h2
            className="font-serif font-medium text-ink-charcoal leading-tight"
            style={{ fontSize: 'clamp(24px, 3vw, 40px)' }}
          >
            Everything in stock,<br />by collection.
          </h2>
        </div>

        <div className="flex flex-col gap-16">
          {rows.map(row => (
            <div key={row.handle}>
              {/* Row header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-ink-rule">
                <h3 className="font-serif text-[22px] font-medium text-ink-charcoal">
                  {row.label}
                </h3>
                <Link
                  href={row.href}
                  className="font-sans text-[12px] font-semibold uppercase tracking-widest text-brass-deep hover:text-brass transition-colors border-b border-brass-deep/40 hover:border-brass pb-px"
                >
                  View all →
                </Link>
              </div>

              {/* Product cards — horizontal scroll on mobile */}
              <div className="overflow-x-auto pb-2 -mx-1 px-1">
                <div className="grid grid-cols-5 gap-x-3 sm:gap-x-5 gap-y-6 items-start min-w-225">
                  {row.products.map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      aspectRatio="4/5"
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
