# Inventory Write — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the silent `setInventoryQuantity` bug and wire the Inventory page "Adjust" button to persist stock changes to Shopify.

**Architecture:** Three sequential changes — (1) fix the broken mutation in `shopifyAdmin.ts`, (2) add a lightweight PATCH route that uses the fixed function, (3) update the inventory page to call the route and show feedback. Each task is independently committable and verifiable.

**Tech Stack:** Next.js 16 App Router, TypeScript, Shopify Admin GraphQL API 2026-04, iron-session, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-05-30-inventory-write-design.md`

> **Note:** This project has no automated test runner (no Jest/Vitest in package.json). Each task uses `npm run build` for type safety verification and manual browser steps for behaviour verification.

---

## Task 1: Fix `setInventoryQuantity` — remove `@idempotent` bug

**Files:**
- Modify: `lib/admin/shopifyAdmin.ts` — lines 408–428 (the `setInventoryQuantity` function body)

**Context:** The mutation currently uses `@idempotent(key: "...")` which is not a Shopify-supported GraphQL directive. It causes every inventory mutation to fail silently. Removing it makes the function work correctly. This fixes stock saving for product Create, Edit, and Inventory Adjust simultaneously.

---

- [ ] **Step 1: Open `lib/admin/shopifyAdmin.ts` and locate `setInventoryQuantity`**

Find this block (around line 408):

```ts
  const idempotencyKey = `inv-${inventoryItemId.split('/').pop()}-${Date.now()}`

  const data = await adminFetch<{
    inventorySetQuantities: { userErrors: { field: string; message: string }[] }
  }>(
    `mutation SetInventory($input: InventorySetQuantitiesInput!) {
      inventorySetQuantities(input: $input) @idempotent(key: "${idempotencyKey}") {
        userErrors { field message }
      }
    }`,
```

---

- [ ] **Step 2: Replace the idempotencyKey variable and mutation with the fixed version**

Remove the `idempotencyKey` line and the `@idempotent` directive. The replacement block is:

```ts
  const data = await adminFetch<{
    inventorySetQuantities: { userErrors: { field: string; message: string }[] }
  }>(
    `mutation SetInventory($input: InventorySetQuantitiesInput!) {
      inventorySetQuantities(input: $input) {
        userErrors { field message }
      }
    }`,
```

The rest of the function (the `input` variable passed as `variables`, and the error check after) stays exactly as-is.

---

- [ ] **Step 3: Add `getInventoryItemIdForProduct` helper directly after `setInventoryQuantity`**

This helper is needed by the new PATCH route in Task 2. Add it immediately after the closing brace of `setInventoryQuantity`:

```ts
/**
 * Returns the inventoryItem GID for a product's first variant.
 * Returns null if the product has no variant or no inventory item.
 */
export async function getInventoryItemIdForProduct(shopifyId: string): Promise<string | null> {
  const gid = shopifyId.startsWith('gid://') ? shopifyId : `gid://shopify/Product/${shopifyId}`
  const data = await adminFetch<{
    product: {
      variants: { edges: { node: { inventoryItem: { id: string } | null } }[] }
    } | null
  }>(
    `query GetInventoryItem($id: ID!) {
      product(id: $id) {
        variants(first: 1) {
          edges { node { inventoryItem { id } } }
        }
      }
    }`,
    { id: gid }
  )
  return data.product?.variants.edges[0]?.node?.inventoryItem?.id ?? null
}
```

---

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npm run build
```

Expected: build completes with no TypeScript errors. If there are type errors, fix them before continuing.

---

- [ ] **Step 5: Commit**

```bash
git add lib/admin/shopifyAdmin.ts
git commit -m "fix: remove @idempotent directive from inventorySetQuantities mutation"
```

---

## Task 2: Create `PATCH /api/admin/inventory/[id]` route

**Files:**
- Create: `app/api/admin/inventory/[id]/route.ts`

**Context:** A dedicated lightweight endpoint for stock-only updates. It authenticates the request, validates the quantity, fetches the product's `inventoryItem.id` using the helper added in Task 1, then calls `setInventoryQuantity`. It does not touch product fields, metafields, images, or collections.

---

- [ ] **Step 1: Create the directory and file**

Create the file at `app/api/admin/inventory/[id]/route.ts` with this content:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { getInventoryItemIdForProduct, setInventoryQuantity } from '@/lib/admin/shopifyAdmin'

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!await requireAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const body = await req.json().catch(() => ({}))
  const quantity = Number(body.quantity)

  if (!Number.isInteger(quantity) || quantity < 0) {
    return NextResponse.json(
      { error: 'quantity must be a non-negative integer' },
      { status: 400 }
    )
  }

  try {
    const inventoryItemId = await getInventoryItemIdForProduct(id)
    if (!inventoryItemId) {
      return NextResponse.json(
        { error: 'Product not found or has no inventory item' },
        { status: 404 }
      )
    }

    await setInventoryQuantity(inventoryItemId, quantity)
    return NextResponse.json({ ok: true, stock: quantity })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

---

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run build
```

Expected: build completes with no errors. The new route should appear in the build output under `app/api/admin/inventory/[id]`.

---

- [ ] **Step 3: Smoke-test the route manually**

Start the dev server: `npm run dev`

Open the admin dashboard, open browser DevTools → Console, and run:

```js
// Replace 'YOUR_PRODUCT_ID' with any real product ID from /admin/products
// (the numeric ID shown in the URL: /admin/products/12345678)
fetch('/api/admin/inventory/YOUR_PRODUCT_ID', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ quantity: 7 })
}).then(r => r.json()).then(console.log)
```

Expected response: `{ ok: true, stock: 7 }`

Then open Shopify Admin → Products → that product → Inventory — confirm it shows 7.

If it shows an error instead, check the terminal running `npm run dev` for the error message from `setInventoryQuantity`.

---

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/inventory/[id]/route.ts
git commit -m "feat: add PATCH /api/admin/inventory/[id] for stock-only updates"
```

---

## Task 3: Wire the Inventory page — async Adjust with feedback

**Files:**
- Modify: `app/admin/inventory/page.tsx`

**Context:** The "Adjust" flow currently only updates local React state. This task makes `commitEdit` async, calls the new PATCH route, shows a per-row spinner while saving, reverts on error, and shows a toast notification.

---

- [ ] **Step 1: Add new imports to `app/admin/inventory/page.tsx`**

At the top of the file, add these two imports alongside the existing ones:

```ts
import Toast, { ToastType } from '@/components/admin/shared/Toast'
import { BiLoader } from 'react-icons/bi'
```

The `Toast` component and `ToastType` are already used on the Products page — same pattern here.

---

- [ ] **Step 2: Add `savingId` and `toast` state**

In the component body, alongside the existing `useState` declarations, add:

```ts
const [savingId, setSavingId] = useState<string | null>(null)
const [toast,    setToast]    = useState<{ message: string; type: ToastType } | null>(null)
```

---

- [ ] **Step 3: Replace `commitEdit` with the async version**

Find the existing `commitEdit` function:

```ts
function commitEdit(id: string) {
  const n = parseInt(editVal, 10)
  if (!isNaN(n) && n >= 0) setStocks(s => ({ ...s, [id]: n }))
  setEditing(null)
}
```

Replace it entirely with:

```ts
async function commitEdit(id: string) {
  const n = parseInt(editVal, 10)
  if (isNaN(n) || n < 0) { setEditing(null); return }
  const prev = stocks[id] ?? 0
  setEditing(null)
  setSavingId(id)
  try {
    const res = await fetch(`/api/admin/inventory/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ quantity: n }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'Failed to update stock')
    setStocks(s => ({ ...s, [id]: n }))
    setToast({ message: 'Stock updated in Shopify.', type: 'success' })
  } catch (err) {
    setStocks(s => ({ ...s, [id]: prev }))
    setToast({ message: err instanceof Error ? err.message : 'Failed to update stock', type: 'error' })
  } finally {
    setSavingId(null)
  }
}
```

---

- [ ] **Step 4: Add saving spinner to the desktop table's action cell**

In the desktop table (`<div className="hidden sm:block ..."`), find the last `<td>` of each row — the one that renders the "Adjust" button when `editing !== p.id`. Replace its content with:

```tsx
<td className="px-5 py-3 text-right">
  {savingId === p.id ? (
    <BiLoader size={14} className="animate-spin text-(--admin-text-muted) ml-auto" />
  ) : editing !== p.id && (
    <button
      onClick={() => startEdit(p.id, p.stock)}
      className="flex items-center gap-1 h-7 px-2.5 text-[11px] text-(--admin-text-muted) bg-(--admin-surface-2) border border-(--admin-border) rounded hover:bg-(--admin-border) hover:text-(--admin-text) transition-colors"
    >
      <BiEditAlt size={12} /> Adjust
    </button>
  )}
</td>
```

---

- [ ] **Step 5: Add saving spinner to the mobile card list**

In the mobile card list (`<div className="sm:hidden ..."`), find the area that renders the edit input or the Adjust button. The outer `<div className="flex items-center gap-2">` currently looks like:

```tsx
<div className="flex items-center gap-2">
  {editing === p.id ? (
    <div className="flex items-center gap-1.5">
      ...input + check + X buttons...
    </div>
  ) : (
    <>
      <span ...>{p.stock}</span>
      <button onClick={() => startEdit(p.id, p.stock)} ...>
        <BiEditAlt size={12} /> Adjust
      </button>
    </>
  )}
</div>
```

Replace the entire `<div className="flex items-center gap-2">` block with:

```tsx
<div className="flex items-center gap-2">
  {savingId === p.id ? (
    <BiLoader size={14} className="animate-spin text-(--admin-text-muted)" />
  ) : editing === p.id ? (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="number"
        min="0"
        value={editVal}
        onChange={e => setEditVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') commitEdit(p.id)
          if (e.key === 'Escape') cancelEdit()
        }}
        className="w-16 h-7 px-2 text-[13px] text-(--admin-text) bg-(--admin-surface-2) border border-(--admin-accent) rounded focus:outline-none"
      />
      <button onClick={() => commitEdit(p.id)} className="text-(--admin-accent)"><BiCheck size={16} /></button>
      <button onClick={cancelEdit} className="text-(--admin-text-muted)"><BiX size={16} /></button>
    </div>
  ) : (
    <>
      <span className={cn(
        'text-[13px] font-semibold',
        p.stock === 0 ? 'text-(--admin-red)' : p.stock <= LOW_STOCK_THRESHOLD ? 'text-(--admin-amber)' : 'text-(--admin-text)'
      )}>
        {p.stock}
      </span>
      <button
        onClick={() => startEdit(p.id, p.stock)}
        className="flex items-center gap-1 h-7 px-2.5 text-[11px] text-(--admin-text-muted) bg-(--admin-surface-2) border border-(--admin-border) rounded hover:bg-(--admin-border) transition-colors"
      >
        <BiEditAlt size={12} /> Adjust
      </button>
    </>
  )}
</div>
```

---

- [ ] **Step 6: Also add the spinner to the desktop table's inline edit cell**

In the desktop table, find the `<td>` that renders the inline stock input (the one before the Adjust button td). It currently starts with `{editing === p.id ? ...}`. Wrap it to also handle the saving state:

```tsx
<td className="px-5 py-3">
  {savingId === p.id ? (
    <span className={cn(
      'text-[13px] font-semibold text-(--admin-text-muted)'
    )}>
      {stocks[p.id] ?? p.stock}
    </span>
  ) : editing === p.id ? (
    <div className="flex items-center gap-1.5">
      <input
        ref={inputRef}
        type="number"
        min="0"
        value={editVal}
        onChange={e => setEditVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') commitEdit(p.id)
          if (e.key === 'Escape') cancelEdit()
        }}
        className="w-20 h-7 px-2 text-[13px] text-(--admin-text) bg-(--admin-surface-2) border border-(--admin-accent) rounded focus:outline-none"
      />
      <button onClick={() => commitEdit(p.id)} className="text-(--admin-accent) hover:opacity-70 transition-opacity"><BiCheck size={16} /></button>
      <button onClick={cancelEdit} className="text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"><BiX size={16} /></button>
    </div>
  ) : (
    <span className={cn(
      'text-[13px] font-semibold',
      p.stock === 0 ? 'text-(--admin-red)' : p.stock <= LOW_STOCK_THRESHOLD ? 'text-(--admin-amber)' : 'text-(--admin-text)'
    )}>
      {p.stock}
    </span>
  )}
</td>
```

---

- [ ] **Step 7: Add the Toast component at the bottom of the returned JSX**

At the very end of the `return (...)`, just before the closing `</div>`, add:

```tsx
{toast && (
  <Toast
    message={toast.message}
    type={toast.type}
    onClose={() => setToast(null)}
  />
)}
```

---

- [ ] **Step 8: Remove the stale footer note**

Find and delete this line from the page (it was accurate before but is now wrong):

```tsx
<p className="text-[11px] text-(--admin-text-muted)">
  Stock levels are pulled live from Shopify. Adjustments here are local — full inventory write API in next sprint.
</p>
```

Replace it with:

```tsx
<p className="text-[11px] text-(--admin-text-muted)">
  Stock levels are pulled live from Shopify. Adjustments are saved directly to Shopify inventory.
</p>
```

---

- [ ] **Step 9: Verify TypeScript compiles**

```bash
npm run build
```

Expected: build completes with no errors.

---

- [ ] **Step 10: Manual end-to-end verification**

Start the dev server: `npm run dev`

1. Go to `/admin/inventory`
2. Click "Adjust" on any product row
3. Enter a new stock number (e.g. `9`)
4. Press ✓ or Enter
5. **Expected:** spinner appears briefly on that row → "Stock updated in Shopify." toast appears at bottom → row displays new stock number
6. Go to Shopify Admin → Products → that product → Inventory
7. **Expected:** stock shows `9`
8. Reload `/admin/inventory` — stock should still show `9` (not reverted)

**Error path test:**
1. Stop the dev server temporarily (or disconnect from internet)
2. Try adjusting stock
3. **Expected:** spinner appears → error toast appears → stock number reverts to what it was before

---

- [ ] **Step 11: Commit**

```bash
git add app/admin/inventory/page.tsx
git commit -m "feat: wire inventory Adjust button to Shopify via PATCH /api/admin/inventory/[id]"
```

---

## Summary

| Task | Files | Commit message |
|---|---|---|
| 1 | `lib/admin/shopifyAdmin.ts` | `fix: remove @idempotent directive from inventorySetQuantities mutation` |
| 2 | `app/api/admin/inventory/[id]/route.ts` | `feat: add PATCH /api/admin/inventory/[id] for stock-only updates` |
| 3 | `app/admin/inventory/page.tsx` | `feat: wire inventory Adjust button to Shopify via PATCH /api/admin/inventory/[id]` |

After all three tasks: stock changes on the Inventory page persist to Shopify. The same fix also repairs stock saving when creating or editing a product.
