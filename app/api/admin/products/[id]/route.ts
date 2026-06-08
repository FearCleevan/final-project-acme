import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import {
  getAdminProductById,
  updateAdminProduct,
  deleteAdminProduct,
  uploadProductImage,
  getProductMediaWithIds,
  deleteProductMedia,
  reorderProductMedia,
  collectionHandlesToGids,
  getProductCollectionGids,
} from '@/lib/admin/shopifyAdmin'

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
      sku, stock, status, vendor, productType, tags, collections, category,
      material, colour, style, brand, vintage, burnerSize,
      fits, era, powerSource, condition, edition, workshop,
      benchTester, benchTestDate, patent, netWeight, sellWhenOutOfStock,
      hasVariants, variants: bodyVariants,
    } = body

    const isColourVariant = hasVariants && Array.isArray(bodyVariants) && bodyVariants.length >= 1

    const [existingMedia, currentCollectionGids, newCollectionGids] = await Promise.all([
      getProductMediaWithIds(id),
      getProductCollectionGids(id),
      collectionHandlesToGids(Array.isArray(collections) ? collections : []),
    ])
    const existingImageUrls = new Set(existingMedia.map(m => m.url))

    const newSet     = new Set(newCollectionGids)
    const currentSet = new Set(currentCollectionGids)
    const collectionsToJoin  = newCollectionGids.filter(g => !currentSet.has(g))
    const collectionsToLeave = currentCollectionGids.filter(g => !newSet.has(g))

    const product = await updateAdminProduct(id, {
      title,
      descriptionHtml: shortDescription,
      vendor,
      productType,
      status: status === 'active' ? 'ACTIVE' : 'DRAFT',
      tags: Array.isArray(tags) ? tags : [],
      collectionsToJoin,
      collectionsToLeave,
      category: category?.id ?? null,
      // For colour-variant products, stock and variants are handled per-variant
      ...(!isColourVariant && {
        stock: stock != null ? Number(stock) : undefined,
        variants: [{
          price:           String(price ?? 0),
          compareAtPrice:  compareAtPrice ? String(compareAtPrice) : undefined,
          inventoryPolicy: sellWhenOutOfStock ? 'CONTINUE' : 'DENY',
        }],
      }),
      ...(isColourVariant && { colourVariants: bodyVariants }),
      metafields: [
        { namespace: 'acme', key: 'full_description', value: fullDescription ?? '', type: 'multi_line_text_field' },
        { namespace: 'acme', key: 'patent',            value: patent ?? '',          type: 'single_line_text_field' },
        { namespace: 'acme', key: 'net_weight',        value: netWeight ?? '',       type: 'single_line_text_field' },
        { namespace: 'acme', key: 'material',          value: material ?? '',        type: 'single_line_text_field' },
        ...(!isColourVariant ? [{ namespace: 'acme', key: 'colour', value: colour ?? '', type: 'single_line_text_field' }] : []),
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

    // Strip query-params (Shopify CDN ?v= version tokens) before comparing so
    // product.images URLs and product.media URLs always match.
    const stripQ = (url: string) => url.split('?')[0]

    const existingByBase = new Map(existingMedia.map(m => [stripQ(m.url), m]))

    const toDelete = existingMedia.filter(m => !incomingImages.some(u => stripQ(u) === stripQ(m.url)))
    if (toDelete.length) await deleteProductMedia(id, toDelete.map(m => m.id))

    // Upload genuinely new images; collect their GIDs immediately so we don't
    // need a second round-trip to get them for the reorder step.
    const uploadedById = new Map<string, string>() // baseUrl → mediaGid
    const trulyNew = incomingImages.filter(url => !existingByBase.has(stripQ(url)))
    await Promise.all(
      trulyNew.map(async url => {
        const { id: mediaGid, url: cdnUrl } = await uploadProductImage(id, url)
        if (mediaGid) uploadedById.set(stripQ(url), mediaGid)
        // If CDN URL differs from original source URL, map that too
        if (cdnUrl && stripQ(cdnUrl) !== stripQ(url)) uploadedById.set(stripQ(cdnUrl), mediaGid)
      })
    )

    // Reorder: build GID list in the user's intended sequence using the
    // already-fetched existingMedia + the just-uploaded GIDs — no extra fetch.
    if (incomingImages.length > 1) {
      const orderedGids = incomingImages
        .map(url => {
          const base = stripQ(url)
          return existingByBase.get(base)?.id ?? uploadedById.get(base)
        })
        .filter((gid): gid is string => Boolean(gid))
      if (orderedGids.length > 1) await reorderProductMedia(id, orderedGids)
    }

    revalidateTag('products', 'layout')
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
    revalidateTag('products', 'layout')
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}