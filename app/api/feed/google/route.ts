import { NextResponse } from 'next/server'
import { getAllProducts } from '@/lib/shopify'

const SITE_URL = 'https://www.acmevintagesupply.com'

const GOOGLE_CATEGORY: Record<string, string> = {
  'lighting':                'Home &amp; Garden &gt; Lighting &gt; Light Fixtures',
  'oil-lamp-shades':         'Home &amp; Garden &gt; Lighting &gt; Lamp Shades',
  'oil-lamp-chimneys':       'Home &amp; Garden &gt; Lighting &gt; Light Accessories',
  'oil-lamp-pressure-lamps': 'Home &amp; Garden &gt; Lighting &gt; Light Fixtures',
  'oil-lamp-wicks':          'Home &amp; Garden &gt; Lighting &gt; Light Accessories',
  'oil-lamp-spreaders':      'Home &amp; Garden &gt; Lighting &gt; Light Accessories',
  'oil-lamp-books':          'Media &gt; Books',
  'signs':                   'Home &amp; Garden &gt; Decor &gt; Wall Decorations',
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function GET() {
  const products = await getAllProducts()

  const items = products
    .filter(p => p.price > 0 && p.images.length > 0)
    .map(p => {
      const desc     = esc(p.fullDescription || p.shortDescription || p.name)
      const brand    = esc(p.brand || 'Acme Vintage Supply')
      const category = GOOGLE_CATEGORY[p.category] ?? 'Home &amp; Garden &gt; Lighting'

      return `    <item>
      <g:id>${esc(p.slug)}</g:id>
      <g:title>${esc(p.name)}</g:title>
      <g:description>${desc}</g:description>
      <g:link>${SITE_URL}/catalog/${esc(p.slug)}</g:link>
      <g:image_link>${esc(p.images[0])}</g:image_link>
      <g:availability>${p.inStock ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${p.price.toFixed(2)} CAD</g:price>
      <g:brand>${brand}</g:brand>
      <g:condition>used</g:condition>
      <g:google_product_category>${category}</g:google_product_category>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Acme Vintage Supply</title>
    <link>${SITE_URL}</link>
    <description>Vintage oil lamps, glass shades, chimneys, burners and reproduction signs</description>
${items}
  </channel>
</rss>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type':  'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
