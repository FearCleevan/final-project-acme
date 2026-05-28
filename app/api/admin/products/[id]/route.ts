import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { getAdminProductById, updateAdminProduct, deleteAdminProduct, uploadProductImage, getProductMediaWithIds, deleteProductMedia } from '@/lib/admin/shopifyAdmin'

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const product = await getAdminProductById(id)
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(product)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const body = await req.json()
    const {
      title, shortDescription, fullDescription, price, compareAtPrice,
      sku, status, vendor, productType, tags,
      material, colour, style, brand, vintage, burnerSize,
      fits, era, powerSource, condition, edition, workshop,
      benchTester, benchTestDate, patent, netWeight, sellWhenOutOfStock,
    } = body

    // Fetch existing media with IDs before update (needed for deletion)
    const existingMedia = await getProductMediaWithIds(id)
    const existingImageUrls = new Set(existingMedia.map(m => m.url))

    const product = await updateAdminProduct(id, {
      title,
      descriptionHtml: shortDescription,
      vendor,
      productType,
      status: status === 'active' ? 'ACTIVE' : 'DRAFT',
      tags: Array.isArray(tags) ? tags : [],
      variants: [{
        price:               String(price ?? 0),
        compareAtPrice:      compareAtPrice ? String(compareAtPrice) : undefined,
        sku,
        inventoryManagement: 'SHOPIFY',
        inventoryPolicy:     sellWhenOutOfStock ? 'CONTINUE' : 'DENY',
      }],
      metafields: [
        { namespace: 'acme', key: 'full_description', value: fullDescription ?? '', type: 'multi_line_text_field' },
        { namespace: 'acme', key: 'patent',            value: patent ?? '',          type: 'single_line_text_field' },
        { namespace: 'acme', key: 'net_weight',        value: netWeight ?? '',       type: 'single_line_text_field' },
        { namespace: 'acme', key: 'material',          value: material ?? '',        type: 'single_line_text_field' },
        { namespace: 'acme', key: 'colour',            value: colour ?? '',          type: 'single_line_text_field' },
        { namespace: 'acme', key: 'style',             value: style ?? '',           type: 'single_line_text_field' },
        { namespace: 'acme', key: 'brand',             value: brand ?? '',           type: 'single_line_text_field' },
        { namespace: 'acme', key: 'vintage',           value: vintage ?? '',         type: 'single_line_text_field' },
        { namespace: 'acme', key: 'burner_size',       value: burnerSize ?? '',      type: 'single_line_text_field' },
        { namespace: 'acme', key: 'fits',              value: fits ?? '',            type: 'single_line_text_field' },
        { namespace: 'acme', key: 'era',               value: era ?? '',             type: 'single_line_text_field' },
        { namespace: 'acme', key: 'power_source',      value: powerSource ?? '',     type: 'single_line_text_field' },
        { namespace: 'acme', key: 'condition',         value: condition ?? '',       type: 'single_line_text_field' },
        { namespace: 'acme', key: 'edition',           value: edition ?? '',         type: 'single_line_text_field' },
        { namespace: 'acme', key: 'workshop',          value: workshop ?? '',        type: 'single_line_text_field' },
        { namespace: 'acme', key: 'bench_tester',      value: benchTester ?? '',     type: 'single_line_text_field' },
        { namespace: 'acme', key: 'bench_test_date',   value: benchTestDate ?? '',   type: 'single_line_text_field' },
      ].filter(m => m.value !== ''),
    })

    const incomingImages: string[] = Array.isArray(body.images) ? body.images : []
    const incomingSet = new Set(incomingImages)

    // Delete images that were removed in the form
    const toDelete = existingMedia.filter(m => !incomingSet.has(m.url))
    if (toDelete.length) await deleteProductMedia(id, toDelete.map(m => m.id))

    // Attach new images that aren't already on the product
    const newImages = incomingImages.filter(url => !existingImageUrls.has(url))
    await Promise.all(newImages.map(url => uploadProductImage(id, url)))

    revalidateTag('products')
    return NextResponse.json(product)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    await deleteAdminProduct(id)
    revalidateTag('products')
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
