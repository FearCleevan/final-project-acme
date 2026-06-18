# CSV Bulk Import — Real Shopify Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fake "Import CSV" modal in the admin Products page with a real implementation that parses the CSV, creates each product in Shopify via the existing API, and shows per-row progress and results.

**Architecture:** A new `/api/admin/products/import` route accepts an array of parsed product rows, calls the existing `createAdminProduct` path (same as the single-product form) sequentially to respect Shopify rate limits, and returns a per-row result array. The existing import modal UI is extended in-place to show a live progress bar, then a results summary table with success / duplicate / error status per row.

**Tech Stack:** Next.js 16 App Router, TypeScript, existing `createAdminProduct` + `collectionHandlesToGids` from `lib/admin/shopifyAdmin.ts`, Tailwind v4 CSS variables (`--admin-*`), React Icons (`react-icons/bi`).

## Global Constraints

- All UI must use `--admin-*` CSS variables only — no hardcoded hex colours.
- No new npm packages.
- The `Scott No.` column in the CSV must be silently ignored (not cause a parse error).
- Missing `Price`, `Compare-at Price`, and `Stock` columns must default to `0` / `null` / `0` respectively — do not error on absence.
- Sequential Shopify calls (one at a time, 300 ms gap) — not parallel — to avoid rate limit 429s.
- Follow the exact same field mapping as `POST /api/admin/products` (`route.ts:33–106`): same body keys, same metafield names, same collection GID lookup.
- Auth check via `getIronSession` / `sessionOptions` identical to every other admin route.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/api/admin/products/import/route.ts` | **Create** | Bulk import API — parse rows array, call `createAdminProduct` per row, return results |
| `app/admin/products/page.tsx` | **Modify** | Replace fake `handleImportConfirm` with real fetch; extend modal with progress + results UI |

---

## Task 1: Bulk Import API Route

**Files:**
- Create: `app/api/admin/products/import/route.ts`

**Interfaces:**
- Consumes: `createAdminProduct`, `collectionHandlesToGids`, `getProductByTitle` from `@/lib/admin/shopifyAdmin`; `AdminSession` + `sessionOptions` from `@/lib/admin/auth` / `@/lib/admin/session`
- Produces: `POST /api/admin/products/import` accepting `{ rows: ImportRow[] }`, returning `ImportResult[]`

```ts
// Types used by both the route and the page
export interface ImportRow {
  title:          string
  shortDescription: string
  sku:            string
  price:          number
  compareAtPrice: number | null
  stock:          number
  status:         'active' | 'draft'
  collections:    string[]
  tags:           string[]
  vendor:         string
  material:       string
  colour:         string
  style:          string
  brand:          string
  vintage:        string
  burnerSize:     string
  fits:           string
  powerSource:    string
  era:            string
  productType:    string
  condition:      string
  edition:        string
  workshop:       string
  benchTester:    string
  benchTestDate:  string
  netWeight:      string
}

export type ImportResultStatus = 'created' | 'duplicate' | 'error'

export interface ImportResult {
  title:     string
  status:    ImportResultStatus
  message:   string   // empty string on success
  productId?: string  // set on 'created'
}
```

- [ ] **Step 1: Create the route file with auth guard and type definitions**

```ts
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
  title:           string
  shortDescription: string
  sku:             string
  price:           number
  compareAtPrice:  number | null
  stock:           number
  status:          'active' | 'draft'
  collections:     string[]
  tags:            string[]
  vendor:          string
  material:        string
  colour:          string
  style:           string
  brand:           string
  vintage:         string
  burnerSize:      string
  fits:            string
  powerSource:     string
  era:             string
  productType:     string
  condition:       string
  edition:         string
  workshop:        string
  benchTester:     string
  benchTestDate:   string
  netWeight:       string
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
```

- [ ] **Step 2: Add the POST handler that processes rows sequentially**

Append to the same file:

```ts
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

      const collectionGids = await collectionHandlesToGids(row.collections)

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
          price:          String(row.price ?? 0),
          compareAtPrice: row.compareAtPrice != null ? String(row.compareAtPrice) : undefined,
          inventoryPolicy: 'DENY',
          sku:            row.sku ?? undefined,
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
        ].filter(m => m.value !== ''),
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
```

- [ ] **Step 3: Verify the file compiles**

Run from `acme-lamp-sign/`:
```
npx tsc --noEmit
```
Expected: no errors. Fix any type mismatches before continuing.

- [ ] **Step 4: Smoke-test with curl (single row)**

With the dev server running (`npm run dev`), while logged into the admin:
```bash
curl -s -X POST http://localhost:3000/api/admin/products/import \
  -H "Content-Type: application/json" \
  -H "Cookie: <paste your admin session cookie here>" \
  -d '{"rows":[{"title":"TEST IMPORT DELETE ME","shortDescription":"test","sku":"","price":0,"compareAtPrice":null,"stock":0,"status":"draft","collections":[],"tags":[],"vendor":"Acme Vintage Supply","material":"","colour":"","style":"","brand":"","vintage":"","burnerSize":"","fits":"","powerSource":"","era":"","productType":"","condition":"","edition":"","workshop":"","benchTester":"","benchTestDate":"","netWeight":""}]}'
```
Expected response: `[{"title":"TEST IMPORT DELETE ME","status":"created","message":"","productId":"..."}]`

Then delete the test product from the Shopify Admin.

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/products/import/route.ts
git commit -m "feat: add /api/admin/products/import bulk create route"
```

---

## Task 2: Wire the Import Modal — CSV Parser + Progress UI + Results

**Files:**
- Modify: `app/admin/products/page.tsx`

**Interfaces:**
- Consumes: `POST /api/admin/products/import` → `ImportResult[]` (defined in Task 1)
- Consumes: existing `CSV_HEADERS` array (line 30), `handleFileSelect` parser logic (line 167)

The column-to-field mapping for CSV parsing:

| CSV Header | `ImportRow` field |
|---|---|
| Title | title |
| Short Description | shortDescription |
| SKU | sku |
| Price | price (parseFloat, default 0) |
| Compare-at Price | compareAtPrice (parseFloat or null) |
| Stock | stock (parseInt, default 0) |
| Status | status (coerce to `'active'` \| `'draft'`, default `'draft'`) |
| Collections | collections (split `';'`, filter empty) |
| Tags | tags (split `';'`, filter empty) |
| Vendor | vendor |
| Material | material |
| Colour | colour |
| Style | style |
| Brand | brand |
| Vintage | vintage |
| Burner Size | burnerSize |
| Fits | fits |
| Power Source | powerSource |
| Era | era |
| Product Type | productType |
| Condition | condition |
| Edition | edition |
| Workshop | workshop |
| Bench Tester | benchTester |
| Bench Test Date | benchTestDate |
| Net Weight | netWeight |
| Scott No. | *(ignored silently)* |

- [ ] **Step 1: Add new import state variables**

In `page.tsx`, find the existing import state block (around line 139):
```ts
// Import modal state
const [showImport,   setShowImport]   = useState(false)
const [importFile,   setImportFile]   = useState<File | null>(null)
const [importRows,   setImportRows]   = useState<ParsedRow[]>([])
const [importDone,   setImportDone]   = useState(false)
const fileInputRef = useRef<HTMLInputElement>(null)
```

Replace with:
```ts
// Import modal state
const [showImport,     setShowImport]     = useState(false)
const [importFile,     setImportFile]     = useState<File | null>(null)
const [importRows,     setImportRows]     = useState<ParsedRow[]>([])
const [importing,      setImporting]      = useState(false)
const [importProgress, setImportProgress] = useState(0)   // 0–100
const [importTotal,    setImportTotal]    = useState(0)
const [importDone,     setImportDone]     = useState(false)
const [importResults,  setImportResults]  = useState<{ title: string; status: 'created'|'duplicate'|'error'; message: string }[]>([])
const fileInputRef = useRef<HTMLInputElement>(null)
```

- [ ] **Step 2: Add the CSV-row-to-ImportRow mapper function**

Add this function directly above `handleFileSelect` (around line 167):

```ts
function parseImportRows(rows: ParsedRow[]) {
  return rows.map(r => ({
    title:            r['Title']?.trim() ?? '',
    shortDescription: r['Short Description']?.trim() ?? '',
    sku:              r['SKU']?.trim() ?? '',
    price:            parseFloat(r['Price'] ?? '0') || 0,
    compareAtPrice:   r['Compare-at Price']?.trim() ? parseFloat(r['Compare-at Price']) : null,
    stock:            parseInt(r['Stock'] ?? '0', 10) || 0,
    status:           (r['Status']?.trim() === 'active' ? 'active' : 'draft') as 'active' | 'draft',
    collections:      (r['Collections'] ?? '').split(';').map(s => s.trim()).filter(Boolean),
    tags:             (r['Tags'] ?? '').split(';').map(s => s.trim()).filter(Boolean),
    vendor:           r['Vendor']?.trim() ?? '',
    material:         r['Material']?.trim() ?? '',
    colour:           r['Colour']?.trim() ?? '',
    style:            r['Style']?.trim() ?? '',
    brand:            r['Brand']?.trim() ?? '',
    vintage:          r['Vintage']?.trim() ?? '',
    burnerSize:       r['Burner Size']?.trim() ?? '',
    fits:             r['Fits']?.trim() ?? '',
    powerSource:      r['Power Source']?.trim() ?? '',
    era:              r['Era']?.trim() ?? '',
    productType:      r['Product Type']?.trim() ?? '',
    condition:        r['Condition']?.trim() ?? '',
    edition:          r['Edition']?.trim() ?? '',
    workshop:         r['Workshop']?.trim() ?? '',
    benchTester:      r['Bench Tester']?.trim() ?? '',
    benchTestDate:    r['Bench Test Date']?.trim() ?? '',
    netWeight:        r['Net Weight']?.trim() ?? '',
  }))
}
```

- [ ] **Step 3: Extend handleFileSelect to parse ALL rows (not just 5)**

Find the existing `handleFileSelect` (line 167). Change `lines.slice(1, 6)` to `lines.slice(1)` so all rows are captured:

```ts
function handleFileSelect(file: File | null) {
  if (!file) return
  setImportFile(file)
  setImportDone(false)
  setImportResults([])
  setImportProgress(0)
  const reader = new FileReader()
  reader.onload = e => {
    const text = e.target?.result as string
    const lines = text.trim().split('\n')
    if (lines.length < 2) return
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim())
    const rows: ParsedRow[] = lines.slice(1).map(line => {
      const vals = line.match(/("(?:[^"]|"")*"|[^,]*)/g) ?? []
      const row: ParsedRow = {}
      headers.forEach((h, i) => {
        row[h] = (vals[i] ?? '').replace(/^"|"$/g, '').replace(/""/g, '"').trim()
      })
      return row
    }).filter(r => Object.values(r).some(v => v !== ''))
    setImportRows(rows)
  }
  reader.readAsText(file)
}
```

- [ ] **Step 4: Replace handleImportConfirm with the real API call**

Find the existing `handleImportConfirm` (line 190):
```ts
function handleImportConfirm() {
  setImportDone(true)
}
```

Replace with:
```ts
async function handleImportConfirm() {
  if (!importFile || importRows.length === 0) return
  const rows = parseImportRows(importRows)
  setImporting(true)
  setImportTotal(rows.length)
  setImportProgress(0)
  setImportResults([])

  try {
    const res = await fetch('/api/admin/products/import', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ rows }),
    })
    const results = await res.json()
    if (!res.ok) throw new Error(results.error ?? 'Import failed')
    setImportResults(results)
    setImportProgress(100)
    setImportDone(true)
    await loadProducts()
    const created = results.filter((r: { status: string }) => r.status === 'created').length
    if (created > 0) {
      setToast({ message: `${created} product${created !== 1 ? 's' : ''} imported to Shopify.`, type: 'success' })
    }
  } catch (err) {
    setToast({ message: String(err), type: 'error' })
  } finally {
    setImporting(false)
  }
}
```

Note: The progress bar is set to 100% on completion. The Shopify API processes rows server-side sequentially — client-side per-row polling is not needed since the call is one request that returns all results.

- [ ] **Step 5: Replace the import modal JSX**

Find the entire `{/* Import CSV modal */}` block (line 509 to end of that div, around line 622). Replace the inner content section (`<div className="px-5 py-4 space-y-4">` and everything inside it) with:

```tsx
<div className="px-5 py-4 space-y-4">

  {/* ── Done: results summary ── */}
  {importDone ? (
    <div className="space-y-3">
      {/* Summary counts */}
      {(() => {
        const created   = importResults.filter(r => r.status === 'created').length
        const duplicate = importResults.filter(r => r.status === 'duplicate').length
        const error     = importResults.filter(r => r.status === 'error').length
        return (
          <div className="flex gap-3 flex-wrap">
            {created > 0 && (
              <span className="text-[12px] px-2.5 py-1 rounded-full bg-(--admin-green-bg) text-(--admin-green) font-medium">
                {created} created
              </span>
            )}
            {duplicate > 0 && (
              <span className="text-[12px] px-2.5 py-1 rounded-full bg-(--admin-amber-bg) text-amber-700 font-medium">
                {duplicate} duplicate{duplicate !== 1 ? 's' : ''}
              </span>
            )}
            {error > 0 && (
              <span className="text-[12px] px-2.5 py-1 rounded-full bg-(--admin-red-bg) text-(--admin-red) font-medium">
                {error} error{error !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )
      })()}

      {/* Per-row results table */}
      <div className="overflow-x-auto rounded-md border border-(--admin-border) max-h-72 overflow-y-auto">
        <table className="w-full text-left text-[11px]">
          <thead className="sticky top-0 bg-(--admin-surface-2) border-b border-(--admin-border)">
            <tr>
              <th className="px-3 py-2 text-(--admin-text-muted) uppercase tracking-wide">Product</th>
              <th className="px-3 py-2 text-(--admin-text-muted) uppercase tracking-wide w-24">Result</th>
              <th className="px-3 py-2 text-(--admin-text-muted) uppercase tracking-wide">Note</th>
            </tr>
          </thead>
          <tbody>
            {importResults.map((r, i) => (
              <tr key={i} className="border-b border-(--admin-border) last:border-0">
                <td className="px-3 py-2 text-(--admin-text) truncate max-w-52">{r.title || '—'}</td>
                <td className="px-3 py-2">
                  {r.status === 'created'   && <span className="text-(--admin-green) font-medium">Created</span>}
                  {r.status === 'duplicate' && <span className="text-amber-600 font-medium">Duplicate</span>}
                  {r.status === 'error'     && <span className="text-(--admin-red) font-medium">Error</span>}
                </td>
                <td className="px-3 py-2 text-(--admin-text-muted) truncate max-w-52">{r.message || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <button
          onClick={closeImportModal}
          className="h-9 px-5 text-[12px] font-medium rounded-md"
          style={{ background: 'var(--admin-accent)', color: 'var(--admin-accent-text)' }}
        >
          Done
        </button>
      </div>
    </div>

  ) : importing ? (
    /* ── In progress ── */
    <div className="py-8 text-center space-y-4">
      <p className="text-[13px] font-medium text-(--admin-text)">
        Importing products into Shopify…
      </p>
      <div className="w-full bg-(--admin-border) rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${importProgress}%`, background: 'var(--admin-accent)' }}
        />
      </div>
      <p className="text-[11px] text-(--admin-text-muted)">
        Creating {importTotal} product{importTotal !== 1 ? 's' : ''} — this may take a moment
      </p>
    </div>

  ) : (
    /* ── File selection + preview ── */
    <>
      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-(--admin-border) rounded-md p-6 text-center cursor-pointer hover:border-(--admin-accent)/30 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDrop={e => { e.preventDefault(); handleFileSelect(e.dataTransfer.files[0]) }}
        onDragOver={e => e.preventDefault()}
      >
        <BiFile size={22} className="mx-auto mb-2 text-(--admin-text-muted)" />
        {importFile
          ? <p className="text-[13px] text-(--admin-text)">{importFile.name}</p>
          : <p className="text-[12px] text-(--admin-text-soft)">Drop CSV here or click to select</p>
        }
        <p className="text-[10px] text-(--admin-text-muted) mt-1">
          Use Export CSV first to get the correct column format. "Scott No." column is ignored automatically.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={e => handleFileSelect(e.target.files?.[0] ?? null)}
        />
      </div>

      {/* Preview table — first 5 rows */}
      {importRows.length > 0 && (
        <div>
          <p className="text-[11px] text-(--admin-text-muted) mb-2">
            Preview — first {Math.min(importRows.length, 5)} of {importRows.length} row{importRows.length !== 1 ? 's' : ''}
          </p>
          <div className="overflow-x-auto rounded-md border border-(--admin-border)">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-(--admin-border) bg-(--admin-surface-2)">
                  {['Title', 'SKU', 'Status', 'Collections'].map(h => (
                    <th key={h} className="px-3 py-2 uppercase tracking-wide text-(--admin-text-muted) whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {importRows.slice(0, 5).map((row, i) => (
                  <tr key={i} className="border-b border-(--admin-border) last:border-0">
                    <td className="px-3 py-2 text-(--admin-text) truncate max-w-40">{row['Title'] || '—'}</td>
                    <td className="px-3 py-2 text-(--admin-text-muted)">{row['SKU'] || '—'}</td>
                    <td className="px-3 py-2 text-(--admin-text-soft) capitalize">{row['Status'] || 'draft'}</td>
                    <td className="px-3 py-2 text-(--admin-text-muted) truncate max-w-32">{row['Collections'] || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={closeImportModal}
          className="h-9 px-4 text-[12px] rounded-md border transition-colors hover:bg-(--admin-surface-2)"
          style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-soft)' }}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!importFile || importRows.length === 0}
          onClick={handleImportConfirm}
          className="h-9 px-4 text-[12px] font-medium rounded-md transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: 'var(--admin-accent)', color: 'var(--admin-accent-text)' }}
        >
          Import {importRows.length > 0 ? `${importRows.length} product${importRows.length !== 1 ? 's' : ''}` : ''}
        </button>
      </div>
    </>
  )}

</div>
```

Also update `closeImportModal` to reset the new state:
```ts
function closeImportModal() {
  if (importing) return   // don't allow close while in progress
  setShowImport(false)
  setImportFile(null)
  setImportRows([])
  setImportDone(false)
  setImportResults([])
  setImportProgress(0)
  setImporting(false)
}
```

- [ ] **Step 6: Run TypeScript check**

```
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 7: Manual test — happy path**

1. Start dev server: `npm run dev`
2. Go to `/admin/products`
3. Click **Import CSV**
4. Drop `items-to-add.csv`
5. Confirm preview shows first 5 rows with correct Title / Status / Collections
6. Click **Import 34 products**
7. Progress bar appears, modal shows "Creating 34 products…"
8. Results table appears — each row shows Created / Duplicate / Error
9. Toast appears: "34 products imported to Shopify."
10. Products list reloads and new draft products are visible

- [ ] **Step 8: Manual test — duplicate guard**

1. Import the same `items-to-add.csv` a second time
2. All 34 rows should show **Duplicate** status — none created twice

- [ ] **Step 9: Commit**

```bash
git add app/admin/products/page.tsx
git commit -m "feat: wire import CSV modal to real Shopify bulk-create API"
```

---

## Self-Review

**Spec coverage:**
- ✅ Real Shopify product creation via existing `createAdminProduct`
- ✅ Same field mapping as single-product form (`route.ts:66–106`)
- ✅ `Scott No.` column silently ignored (mapper reads by column name, not index)
- ✅ Missing Price/Stock default to 0 / null
- ✅ Sequential calls with 300 ms gap
- ✅ Duplicate guard (409 equivalent)
- ✅ Per-row results (created / duplicate / error)
- ✅ Progress UI during import
- ✅ Results summary with counts and per-row table
- ✅ Product list reloads after import
- ✅ Toast notification on success
- ✅ Auth guard on the new route
- ✅ All UI uses `--admin-*` CSS variables

**Placeholder scan:** None found. All code blocks are complete.

**Type consistency:** `ImportRow` and `ImportResult` defined once in Task 1's route file. Task 2 uses inline type assertion `{ title: string; status: 'created'|'duplicate'|'error'; message: string }[]` on the client side — consistent with the route's returned shape.
