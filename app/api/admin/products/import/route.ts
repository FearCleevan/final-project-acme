// app/api/admin/products/import/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import {
  createAdminProduct,
  collectionHandlesToGids,
  getProductByTitle,
} from '@/lib/admin/shopifyAdmin'

export interface ImportRow {
  title:            string
  shortDescription: string
  sku:              string
  price:            number
  compareAtPrice:   number | null
  stock:            number
  status:           'active' | 'draft'
  collections:      string[]
  tags:             string[]
  vendor:           string
  material:         string
  colour:           string
  style:            string
  brand:            string
  vintage:          string
  burnerSize:       string
  fits:             string
  powerSource:      string
  era:              string
  productType:      string
  condition:        string
  edition:          string
  workshop:         string
  benchTester:      string
  benchTestDate:    string
  netWeight:        string
}

export type ImportResultStatus = 'created' | 'duplicate' | 'error'

export interface ImportResult {
  title:      string
  status:     ImportResultStatus
  message:    string
  productId?: string
}

async function requireAuth(): Promise<boolean> {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function POST(req: NextRequest) {
  if (!await requireAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let rows: ImportRow[]
  try {
    const body = await req.json()
    rows = body.rows
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'rows must be a non-empty array' }, { status: 400 })
    }
    if (rows.length > 500) {
      return NextResponse.json({ error: 'Maximum 500 rows per import' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const results: ImportResult[] = []

  for (const row of rows) {
    if (!row.title?.trim()) {
      results.push({ title: row.title ?? '(blank)', status: 'error', message: 'Title is required' })
      continue
    }

    try {
      // Duplicate guard — same logic as single-product POST
      const existing = await getProductByTitle(row.title)
      if (existing) {
        results.push({
          title:     row.title,
          status:    'duplicate',
          message:   `Already exists (ID: ${existing.id})`,
          productId: existing.id,
        })
        await sleep(300)
        continue
      }

      await sleep(300)  // gap after getProductByTitle
      const collectionGids = await collectionHandlesToGids(row.collections)

      await sleep(300)  // gap after collectionHandlesToGids
      const product = await createAdminProduct({
        title:           row.title,
        descriptionHtml: row.shortDescription,
        vendor:          row.vendor,
        productType:     row.productType,
        status:          row.status === 'active' ? 'ACTIVE' : 'DRAFT',
        tags:            row.tags,
        collectionsToJoin: collectionGids,
        stock:           row.stock,
        variants: [{
          price:           String(row.price ?? 0),
          compareAtPrice:  row.compareAtPrice != null ? String(row.compareAtPrice) : undefined,
          inventoryPolicy: 'DENY',
        }],
        metafields: [
          { namespace: 'acme', key: 'material',        value: row.material,      type: 'single_line_text_field' },
          { namespace: 'acme', key: 'colour',          value: row.colour,        type: 'single_line_text_field' },
          { namespace: 'acme', key: 'style',           value: row.style,         type: 'single_line_text_field' },
          { namespace: 'acme', key: 'brand',           value: row.brand,         type: 'single_line_text_field' },
          { namespace: 'acme', key: 'vintage',         value: row.vintage,       type: 'single_line_text_field' },
          { namespace: 'acme', key: 'burner_size',     value: row.burnerSize,    type: 'single_line_text_field' },
          { namespace: 'acme', key: 'fits',            value: row.fits,          type: 'single_line_text_field' },
          { namespace: 'acme', key: 'era',             value: row.era,           type: 'single_line_text_field' },
          { namespace: 'acme', key: 'power_source',    value: row.powerSource,   type: 'single_line_text_field' },
          { namespace: 'acme', key: 'condition',       value: row.condition,     type: 'single_line_text_field' },
          { namespace: 'acme', key: 'edition',         value: row.edition,       type: 'single_line_text_field' },
          { namespace: 'acme', key: 'workshop',        value: row.workshop,      type: 'single_line_text_field' },
          { namespace: 'acme', key: 'bench_tester',    value: row.benchTester,   type: 'single_line_text_field' },
          { namespace: 'acme', key: 'bench_test_date', value: row.benchTestDate, type: 'single_line_text_field' },
          { namespace: 'acme', key: 'net_weight',      value: row.netWeight,     type: 'single_line_text_field' },
        ].filter(m => m.value != null && m.value !== ''),
      })

      results.push({ title: row.title, status: 'created', message: '', productId: product.id })
    } catch (err) {
      results.push({ title: row.title, status: 'error', message: String(err) })
    }

    // 300 ms gap between Shopify calls — avoids rate limit 429s
    await sleep(300)
  }

  return NextResponse.json(results, { status: 200 })
}
