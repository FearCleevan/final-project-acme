import { Product } from '@/lib/types'
import { getProductsByCategory } from '@/lib/shopify'
import Eyebrow from '@/components/shared/Eyebrow'
import ProductCard from '@/components/catalog/ProductCard'

interface RelatedProductsProps {
  product: Product
}

export default async function RelatedProducts({ product }: RelatedProductsProps) {
  const all = await getProductsByCategory(product.category)
  const related = all.filter(p => p.id !== product.id).slice(0, 5)

  if (related.length === 0) return null

  return (
    <section>
      <Eyebrow className="mb-3">From the same room</Eyebrow>
      <h2
        className="font-serif font-medium text-ink-charcoal leading-tight mb-8"
        style={{ fontSize: 'clamp(22px, 2.5vw, 36px)' }}
      >
        More from this collection.
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-3 sm:gap-x-5 gap-y-6 sm:gap-y-10 items-start">
        {related.map(p => (
          <ProductCard
            key={p.id}
            product={p}
            aspectRatio="4/5"
          />
        ))}
      </div>
    </section>
  )
}
