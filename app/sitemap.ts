import type { MetadataRoute } from 'next'
import { getAllProducts } from '@/lib/shopify'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://acmevintagesupply.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL,                          lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${SITE_URL}/catalog`,             lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/signs`,               lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${SITE_URL}/our-story`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/heritage`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/contact`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/faq`,                 lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/shipping`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/returns`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/track-order`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/legal/privacy-policy`,lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${SITE_URL}/legal/terms`,         lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
  ]

  let productPages: MetadataRoute.Sitemap = []
  try {
    const products = await getAllProducts()
    productPages = products.map(p => ({
      url:              `${SITE_URL}/catalog/${p.slug}`,
      lastModified:     new Date(),
      changeFrequency:  'weekly' as const,
      priority:         0.8,
    }))
  } catch {
    // Shopify unavailable at build time — product pages omitted
  }

  return [...staticPages, ...productPages]
}
