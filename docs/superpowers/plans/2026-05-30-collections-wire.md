# Collections Page — Full CRUD Wire Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `mockCollections` with real Shopify data and wire Create, Edit, and Delete to the Shopify Admin API.

**Architecture:** Three sequential layers — (1) lib functions for Shopify collection mutations, (2) API route handlers that call them, (3) the Collections page updated to fetch real data and call the new routes. Each task is independently committable.

**Tech Stack:** Next.js 16 App Router, TypeScript, Shopify Admin GraphQL API 2026-04, iron-session, Tailwind CSS 4

**Spec:** `docs/superpowers/specs/2026-05-30-collections-wire-design.md`

> **Note:** No automated test runner exists in this project. `npm run build` is used for type-safety verification. Manual browser steps verify behaviour.

---

## Task 1: Add collection lib functions to `shopifyAdmin.ts`

**Files:**
- Modify: `lib/admin/shopifyAdmin.ts` — append to end of file

**Context:** `lib/admin/shopifyAdmin.ts` contains all Shopify Admin API functions. New collection functions follow the same `adminFetch` pattern used for products and orders. The `ShopifyCollectionNode` interface and `toAdminCollection` adapter are scoped to this task — they live just before the new exported functions at the end of the file.

---

- [ ] **Step 1: Read the end of `lib/admin/shopifyAdmin.ts`**

Run:
```bash
tail -20 lib/admin/shopifyAdmin.ts
```

Confirm where to append. The file should end with `getAdminOrderById`. New code goes after that closing brace.

---

- [ ] **Step 2: Append the collection types and functions**

Add the following block at the very end of `lib/admin/shopifyAdmin.ts`:

```ts
// ─── Collections ──────────────────────────────────────────────────────────────

import type { AdminCollection } from './types'

interface ShopifyCollectionNode {
  id: string
  title: string
  handle: string
  description: string
  productsCount: { count: number } | null
}

function toAdminCollection(c: ShopifyCollectionNode): AdminCollection {
  return {
    id:           c.id.replace('gid://shopify/Collection/', ''),
    title:        c.title,
    handle:       c.handle,
    description:  c.description ?? '',
    productCount: c.productsCount?.count ?? 0,
  }
}

export async function createAdminCollection(input: {
  title: string
  handle?: string
  descriptionHtml?: string
}): Promise<AdminCollection> {
  const data = await adminFetch<{
    collectionCreate: {
      collection: ShopifyCollectionNode | null
      userErrors: { field: string; message: string }[]
    }
  }>(
    `mutation CreateCollection($input: CollectionInput!) {
      collectionCreate(input: $input) {
        collection { id title handle description productsCount { count } }
        userErrors { field message }
      }
    }`,
    { input }
  )
  if (data.collectionCreate.userErrors.length) {
    throw new Error(data.collectionCreate.userErrors[0].message)
  }
  return toAdminCollection(data.collectionCreate.collection!)
}

export async function updateAdminCollection(
  shopifyId: string,
  input: { title: string; handle?: string; descriptionHtml?: string }
): Promise<AdminCollection> {
  const gid = shopifyId.startsWith('gid://') ? shopifyId : `gid://shopify/Collection/${shopifyId}`
  const data = await adminFetch<{
    collectionUpdate: {
      collection: ShopifyCollectionNode | null
      userErrors: { field: string; message: string }[]
    }
  }>(
    `mutation UpdateCollection($input: CollectionInput!) {
      collectionUpdate(input: $input) {
        collection { id title handle description productsCount { count } }
        userErrors { field message }
      }
    }`,
    { input: { id: gid, ...input } }
  )
  if (data.collectionUpdate.userErrors.length) {
    throw new Error(data.collectionUpdate.userErrors[0].message)
  }
  return toAdminCollection(data.collectionUpdate.collection!)
}

export async function deleteAdminCollection(shopifyId: string): Promise<void> {
  const gid = shopifyId.startsWith('gid://') ? shopifyId : `gid://shopify/Collection/${shopifyId}`
  const data = await adminFetch<{
    collectionDelete: { userErrors: { field: string; message: string }[] }
  }>(
    `mutation DeleteCollection($id: ID!) {
      collectionDelete(input: { id: $id }) {
        deletedCollectionId
        userErrors { field message }
      }
    }`,
    { id: gid }
  )
  if (data.collectionDelete.userErrors.length) {
    throw new Error(data.collectionDelete.userErrors[0].message)
  }
}
```

> **Note:** `AdminCollection` is already imported at the top of `shopifyAdmin.ts` via `import type { AdminOrder, ... } from './types'`. If it is not yet included in that import, add it. Do not add a second import statement — merge it into the existing one.

---

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run build
```

Expected: build completes. Pre-existing errors in `mockData.ts` and `sync-publish/route.ts` are known and unrelated — ignore them. No new errors should appear.

---

- [ ] **Step 4: Commit**

```bash
git add lib/admin/shopifyAdmin.ts
git commit -m "feat: add createAdminCollection, updateAdminCollection, deleteAdminCollection"
```

---

## Task 2: Add POST route + create `[id]` route for collections

**Files:**
- Modify: `app/api/admin/collections/route.ts` — add `POST` handler
- Create: `app/api/admin/collections/[id]/route.ts` — `PUT` and `DELETE` handlers

**Context:** The existing `GET` handler in `collections/route.ts` calls Shopify directly with an inline fetch (it predates the `adminFetch` helper). The new `POST` handler and `[id]` routes use `adminFetch` via the lib functions added in Task 1 — consistent with every other write route in the codebase.

---

- [ ] **Step 1: Read the current `app/api/admin/collections/route.ts`**

Read the file to see the existing `GET` handler so you know exactly what to append below it.

---

- [ ] **Step 2: Add `POST` handler to `app/api/admin/collections/route.ts`**

Add these imports at the top of the file (alongside the existing ones):

```ts
import { NextRequest } from 'next/server'
import { createAdminCollection } from '@/lib/admin/shopifyAdmin'
```

Then append the `POST` handler after the closing brace of `GET`:

```ts
export async function POST(req: NextRequest) {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { title, handle, description } = body as {
      title: string
      handle?: string
      description?: string
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const collection = await createAdminCollection({
      title: title.trim(),
      handle: handle?.trim() || undefined,
      descriptionHtml: description?.trim() || undefined,
    })

    return NextResponse.json(collection, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

---

- [ ] **Step 3: Create `app/api/admin/collections/[id]/route.ts`**

Create a new file at that path with this exact content:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { updateAdminCollection, deleteAdminCollection } from '@/lib/admin/shopifyAdmin'

type Params = { params: Promise<{ id: string }> }

async function requireAuth() {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return session.isLoggedIn
}

export async function PUT(req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const body = await req.json()
    const { title, handle, description } = body as {
      title: string
      handle?: string
      description?: string
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const collection = await updateAdminCollection(id, {
      title: title.trim(),
      handle: handle?.trim() || undefined,
      descriptionHtml: description?.trim() || undefined,
    })

    return NextResponse.json(collection)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!await requireAuth()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await deleteAdminCollection(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

---

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npm run build
```

Expected: build completes with no new errors. The new route files should appear in the build output under `app/api/admin/collections`.

---

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/collections/route.ts app/api/admin/collections/[id]/route.ts
git commit -m "feat: add POST, PUT, DELETE routes for admin collections"
```

---

## Task 3: Update the Collections page

**Files:**
- Modify: `app/admin/collections/page.tsx`

**Context:** The page currently initialises from `mockCollections` and uses a fake `setTimeout` save. This task wires all four interactions to the real API: initial load, create, edit, delete. The modal UI, grid layout, and delete confirm modal are not changed.

---

- [ ] **Step 1: Read the full `app/admin/collections/page.tsx`**

Read it in full so you can see the exact current state of all imports, state declarations, `handleSave`, and `handleDelete`.

---

- [ ] **Step 2: Replace the mock import and add new imports**

Find and remove:
```ts
import { mockCollections } from '@/lib/admin/mockData'
```

Add in its place (keep all other existing imports):
```ts
import Toast, { ToastType } from '@/components/admin/shared/Toast'
```

---

- [ ] **Step 3: Replace collections state initialisation and add new state**

Find:
```ts
const [collections, setCollections]     = useState<AdminCollection[]>(mockCollections)
```

Replace with:
```ts
const [collections, setCollections] = useState<AdminCollection[]>([])
const [loading,     setLoading]     = useState(true)
const [toast,       setToast]       = useState<{ message: string; type: ToastType } | null>(null)
```

---

- [ ] **Step 4: Add `useEffect` for initial fetch**

Add this block immediately after the state declarations (before `openCreate`):

```ts
useEffect(() => {
  fetch('/api/admin/collections')
    .then(r => r.ok ? r.json() : [])
    .then(setCollections)
    .finally(() => setLoading(false))
}, [])
```

---

- [ ] **Step 5: Replace `handleSave` with the async version**

Find the entire `function handleSave()` block and replace it with:

```ts
async function handleSave() {
  if (!validate()) return
  setSaving(true)
  try {
    const body = {
      title:       draft.title.trim(),
      handle:      draft.handle.trim() || slugify(draft.title),
      description: draft.description.trim(),
    }
    const res = editingId
      ? await fetch(`/api/admin/collections/${editingId}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        })
      : await fetch('/api/admin/collections', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
        })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Failed to save collection')
    }
    const saved: AdminCollection = await res.json()
    setCollections(cs =>
      editingId
        ? cs.map(c => c.id === editingId ? saved : c)
        : [...cs, saved]
    )
    setSuccess(true)
    setToast({ message: editingId ? 'Collection updated.' : 'Collection created.', type: 'success' })
    setTimeout(() => {
      setSuccess(false)
      setModalOpen(false)
      setDraft(EMPTY_DRAFT)
      setEditingId(null)
    }, 1200)
  } catch (err) {
    setToast({ message: err instanceof Error ? err.message : 'Failed to save collection', type: 'error' })
  } finally {
    setSaving(false)
  }
}
```

---

- [ ] **Step 6: Replace `handleDelete` with the async version**

Find:
```ts
function handleDelete(col: AdminCollection) {
  setCollections(cs => cs.filter(c => c.id !== col.id))
  setDeleteTarget(null)
}
```

Replace with:
```ts
async function handleDelete(col: AdminCollection) {
  try {
    const res = await fetch(`/api/admin/collections/${col.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Failed to delete collection')
    }
    setCollections(cs => cs.filter(c => c.id !== col.id))
    setDeleteTarget(null)
    setToast({ message: 'Collection deleted.', type: 'success' })
  } catch (err) {
    setDeleteTarget(null)
    setToast({ message: err instanceof Error ? err.message : 'Failed to delete collection', type: 'error' })
  }
}
```

---

- [ ] **Step 7: Add loading skeleton and wrap the existing grid**

Find the JSX that starts the grid/empty state section. Currently it looks like:

```tsx
{collections.length === 0 ? (
  <SectionCard>
    ...empty state...
  </SectionCard>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    ...collection cards...
  </div>
)}
```

Replace with:

```tsx
{loading ? (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <SectionCard key={i}>
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-32 bg-(--admin-border) rounded" />
          <div className="h-3 w-48 bg-(--admin-border) rounded" />
          <div className="h-3 w-24 bg-(--admin-border) rounded" />
        </div>
      </SectionCard>
    ))}
  </div>
) : collections.length === 0 ? (
  <SectionCard>
    <div className="py-16 text-center">
      <BiCollection size={32} className="mx-auto text-(--admin-border) mb-3" />
      <p className="text-[14px] text-(--admin-text-soft)">No collections yet</p>
      <p className="text-[12px] text-(--admin-text-muted) mt-1">Create your first collection to organise products.</p>
      <button
        onClick={openCreate}
        className="mt-4 flex items-center gap-1.5 mx-auto h-8 px-4 text-[12px] font-medium bg-(--admin-accent) text-(--admin-accent-text) rounded-md hover:opacity-90 transition-opacity"
      >
        <BiPlus size={14} /> Add collection
      </button>
    </div>
  </SectionCard>
) : (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {collections.map(col => (
      /* existing collection card JSX — do not change */
    ))}
  </div>
)}
```

> Keep the existing collection card JSX inside the grid exactly as it is. Only add the loading branch above.

---

- [ ] **Step 8: Remove the "Plan 2 note" from the modal**

Inside the modal body, find and delete this block entirely:

```tsx
{/* Plan 2 note */}
<div className="p-3 rounded-md bg-(--admin-surface-2) border border-(--admin-border)">
  <p className="text-[11px] text-(--admin-text-muted)">
    Product assignment, sort order, and image upload available in Plan 2.
  </p>
</div>
```

---

- [ ] **Step 9: Add Toast render at the bottom of the JSX return**

Find the very last `</div>` that closes the top-level return div. Just before it, add:

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

- [ ] **Step 10: Verify TypeScript compiles**

```bash
npm run build
```

Expected: no new errors.

---

- [ ] **Step 11: Manual end-to-end verification**

Start dev server: `npm run dev`

1. Go to `/admin/collections`
2. **Expected:** loading skeleton flashes briefly → real Shopify collections appear (not mock data)
3. Click "Add collection" → enter a title → click "Create collection"
4. **Expected:** spinner → "Collection created." toast → new card appears in grid
5. Open Shopify Admin → Collections → confirm it exists
6. Click Edit → change the title → click "Save changes"
7. **Expected:** toast → card updates → change visible in Shopify
8. Delete a collection → confirm → toast → card removed → gone in Shopify
9. Reload the page — all changes should persist

---

- [ ] **Step 12: Commit**

```bash
git add app/admin/collections/page.tsx
git commit -m "feat: wire Collections page to Shopify — real fetch, create, edit, delete"
```

---

## Summary

| Task | Files | Commit |
|---|---|---|
| 1 | `lib/admin/shopifyAdmin.ts` | `feat: add createAdminCollection, updateAdminCollection, deleteAdminCollection` |
| 2 | `app/api/admin/collections/route.ts`, `app/api/admin/collections/[id]/route.ts` | `feat: add POST, PUT, DELETE routes for admin collections` |
| 3 | `app/admin/collections/page.tsx` | `feat: wire Collections page to Shopify — real fetch, create, edit, delete` |

After all three tasks: the Collections page reads from and writes to real Shopify. No mock data remains.
