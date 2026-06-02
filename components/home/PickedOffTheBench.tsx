import Link from 'next/link'
import { getFeaturedProducts } from '@/lib/shopify'
import Eyebrow from '@/components/shared/Eyebrow'
import ProductCard from '@/components/catalog/ProductCard'

export default async function PickedOffTheBench() {
  const featured = await getFeaturedProducts()
  return (
    <section className="bg-parchment-2 px-6 py-24 border-t border-ink-rule">
      <div className="max-w-[1280px] mx-auto">

        <div className="flex items-end justify-between mb-10">
          <div>
            <Eyebrow className="mb-3">Hand-selected</Eyebrow>
            <h2
              className="font-serif font-medium text-ink-charcoal leading-tight"
              style={{ fontSize: 'clamp(24px, 3vw, 42px)' }}
            >
              Picked off the bench this week.
            </h2>
          </div>
          <Link
            href="/catalog"
            className="hidden md:inline-block font-sans text-[14px] text-brass-deep hover:text-brass transition-colors border-b border-brass-deep/40 hover:border-brass pb-px whitespace-nowrap"
          >
            See all 50 →
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-3 sm:gap-x-5 gap-y-6 sm:gap-y-10 lg:gap-10 items-start">
          {featured.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              aspectRatio="4/5"
            />
          ))}
        </div>

        <div className="mt-8 md:hidden text-center">
          <Link
            href="/catalog"
            className="font-sans text-[14px] text-brass-deep border-b border-brass-deep/40 pb-px"
          >
            See all 50 →
          </Link>
        </div>
      </div>
    </section>
  )
}
