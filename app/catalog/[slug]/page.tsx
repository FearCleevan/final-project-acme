import { mockProducts } from '@/lib/mockData'
import { notFound } from 'next/navigation'
import Breadcrumb from '@/components/shared/Breadcrumb'
import ProductGallery from '@/components/product/ProductGallery'
import ProductInfo from '@/components/product/ProductInfo'
import SpecTable from '@/components/product/SpecTable'
import RelatedProducts from '@/components/product/RelatedProducts'
import CustomerReviews from '@/components/product/CustomerReviews'
import Eyebrow from '@/components/shared/Eyebrow'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return mockProducts.map(p => ({ slug: p.slug }))
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = mockProducts.find(p => p.slug === slug)
  if (!product) notFound()

  const isDark = product.category === 'signs'

  return (
    <div className="bg-parchment min-h-screen">
      <div className="max-w-[1280px] mx-auto px-6 py-10">
        <Breadcrumb
          crumbs={[
            { label: 'Storefront', href: '/' },
            { label: 'Catalog', href: '/catalog' },
            { label: product.name },
          ]}
          className="mb-10"
        />

        {/* Two-column: gallery left, info right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-12 xl:gap-20 items-start mb-20">
          <ProductGallery
            images={product.images}
            productName={product.name}
            sku={product.sku}
            dark={isDark}
          />
          <div className="lg:sticky lg:top-24">
            <ProductInfo product={product} />
          </div>
        </div>

        {/* Notes From The Bench */}
        {product.fullDescription && (
          <section className="border-t border-ink-rule pt-16 mb-16">
            <div className="max-w-180">
              <Eyebrow className="mb-3">Notes from the bench</Eyebrow>
              <h2
                className="font-serif font-medium text-ink-charcoal leading-tight mb-6"
                style={{ fontSize: 'clamp(22px, 2.5vw, 36px)' }}
              >
                Why this piece made the cut.
              </h2>
              <div className="space-y-4">
                {product.fullDescription.split('\n\n').map((para, i) => (
                  <p key={i} className="font-sans text-[16px] text-ink-soft leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Customer reviews */}
        <section id="reviews" className="border-t border-ink-rule pt-16 mb-16">
          <CustomerReviews product={product} />
        </section>

        {/* Spec table */}
        <section className="border-t border-ink-rule pt-16 mb-16">
          <SpecTable product={product} />
        </section>

        {/* Related products */}
        <section className="border-t border-ink-rule pt-16 pb-20">
          <RelatedProducts product={product} />
        </section>
      </div>
    </div>
  )
}
