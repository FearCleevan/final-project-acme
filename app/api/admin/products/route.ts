import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import {
  getAdminProducts,
  createAdminProduct,
  collectionHandlesToGids,
  uploadProductImage,
} from '@/lib/admin/shopifyAdmin'

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return false
  return true
}

export async function GET() {
  if (!await requireAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const products = await getAdminProducts()
    return NextResponse.json(products)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  if (!await requireAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const body = await req.json()
    const {
      title, shortDescription, fullDescription, price, compareAtPrice,
      sku, stock, status, vendor, productType, tags, collections, category,
      material, colour, style, brand, vintage, burnerSize,
      fits, era, powerSource, condition, edition, workshop,
      benchTester, benchTestDate, patent, netWeight, sellWhenOutOfStock,
    } = body

    const collectionGids = await collectionHandlesToGids(
      Array.isArray(collections) ? collections : []
    )

    const product = await createAdminProduct({
      title,
      descriptionHtml: shortDescription,
      vendor,
      productType,
      status: status === 'active' ? 'ACTIVE' : 'DRAFT',
      tags: Array.isArray(tags) ? tags : [],
      collectionsToJoin: collectionGids,
      category: category?.id ?? null,
      stock: stock != null ? Number(stock) : undefined,
      variants: [
        {
          price: String(price ?? 0),
          compareAtPrice: compareAtPrice ? String(compareAtPrice) : undefined,
          inventoryPolicy: sellWhenOutOfStock ? 'CONTINUE' : 'DENY',
          // ⚠️ sku and inventoryManagement are NOT included here –
          // they are not accepted by ProductVariantsBulkInput.
        },
      ],
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

    const images: string[] = Array.isArray(body.images) ? body.images : []
    if (images.length) {
      await Promise.all(images.map(url => uploadProductImage(product.id, url)))
    }

    revalidateTag('products', 'layout')
    return NextResponse.json(product, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}