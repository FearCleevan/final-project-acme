import { getAllProducts, getProductByHandle } from '@/lib/shopify'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Breadcrumb from '@/components/shared/Breadcrumb'
import ProductGallery from '@/components/product/ProductGallery'
import ProductInfo from '@/components/product/ProductInfo'
import SpecTable from '@/components/product/SpecTable'
import RelatedProducts from '@/components/product/RelatedProducts'
import CustomerReviews from '@/components/product/CustomerReviews'
import Eyebrow from '@/components/shared/Eyebrow'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://acmevintagesupply.com'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductByHandle(slug)
  if (!product) return {}

  const title = `${product.name} — Buy Online`
  const description = product.shortDescription
    || `Shop ${product.name} at Acme Vintage Supply. Antique oil lamp parts and enamel signs shipped across Canada and North America. SKU: ${product.sku}.`
  const image = product.images[0] ?? `${SITE_URL}/opengraph-image`
  const url = `${SITE_URL}/catalog/${slug}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      images: [{ url: image, width: 800, height: 800, alt: product.name }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
    other: {
      'product:price:amount':   String(product.price),
      'product:price:currency': 'CAD',
      'product:availability':   product.inStock ? 'in stock' : 'out of stock',
    },
  }
}

export async function generateStaticParams() {
  try {
    const products = await getAllProducts()
    return products.map(p => ({ slug: p.slug }))
  } catch {
    return []
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductByHandle(slug)
  if (!product) notFound()

  const isDark = (product.category as string) === 'signs'

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription || product.name,
    sku: product.sku,
    image: product.images,
    brand: { '@type': 'Brand', name: 'Acme Vintage Supply' },
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/catalog/${slug}`,
      priceCurrency: 'CAD',
      price: product.price,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Acme Vintage Supply' },
    },
  }

  return (
    <div className="bg-parchment min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
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

        {/* Spec table */}
        <section className="border-t border-ink-rule pt-16 mb-16">
          <SpecTable product={product} />
        </section>

        {/* Customer reviews */}
        <section id="reviews" className="border-t border-ink-rule pt-16 mb-16">
          <CustomerReviews product={product} />
        </section>

        {/* Related products */}
        <section className="border-t border-ink-rule pt-16 pb-20">
          <RelatedProducts product={product} />
        </section>
      </div>
    </div>
  )
}
