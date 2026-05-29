# Collections Page — Full CRUD Wire Design Spec
## Acme Lamp & Sign Co. — Admin Dashboard

**Date:** 2026-05-30
**Scope:** Replace `mockCollections` with real Shopify data; wire Create, Edit, and Delete to Shopify Admin API
**Effort:** Small — 3 new route handlers, 3 new lib functions, 1 page update
**Shopify app changes required:** None — `write_products` scope already covers collection mutations

---

## Current State

| Layer | Current behaviour |
|---|---|
| `app/admin/collections/page.tsx` | Initialises from `mockCollections` (hardcoded). Create/Edit/Delete only update local React state — changes are lost on refresh. |
| `app/api/admin/collections/route.ts` | `GET` handler exists and returns real Shopify collections. No write handlers. |
| `lib/admin/shopifyAdmin.ts` | No collection mutation functions. |

---

## Shopify API Coverage

Collection CRUD is covered by `write_products` scope (already enabled):

| Operation | Shopify mutation |
|---|---|
| Create | `collectionCreate(input: CollectionInput!)` |
| Update | `collectionUpdate(input: CollectionInput!)` |
| Delete | `collectionDelete(input: CollectionDeleteInput!)` |

Collection IDs returned by the existing `GET` route are numeric strings (GID suffix stripped: `gid://shopify/Collection/12345` → `"12345"`). Write routes reconstruct the full GID before calling Shopify, matching the pattern used throughout `shopifyAdmin.ts` for products.

---

## Solution

### Part 1 — New lib functions (`lib/admin/shopifyAdmin.ts`)

Three new exported functions added at the end of the file, after the existing order functions.

All follow the same `adminFetch` pattern used throughout the file. GID normalisation matches the product helpers (`shopifyId.startsWith('gid://') ? shopifyId : \`gid://shopify/Collection/${shopifyId}\``).

#### `createAdminCollection`

```ts
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
```

#### `updateAdminCollection`

```ts
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
```

#### `deleteAdminCollection`

```ts
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

#### Internal helper types (added at top of file near other internal interfaces)

```ts
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
```

---

### Part 2 — API Routes

#### `POST /api/admin/collections` (add to existing `app/api/admin/collections/route.ts`)

```
POST /api/admin/collections
Body: { title: string, handle?: string, description?: string }
→ requireAuth()
→ createAdminCollection({ title, handle, descriptionHtml: description })
→ 201 { AdminCollection }
→ 500 { error } on failure
```

#### `app/api/admin/collections/[id]/route.ts` (new file)

Two handlers in one file:

```
PUT /api/admin/collections/[id]
Body: { title: string, handle?: string, description?: string }
→ requireAuth()
→ updateAdminCollection(id, { title, handle, descriptionHtml: description })
→ 200 { AdminCollection }
→ 500 { error } on failure

DELETE /api/admin/collections/[id]
→ requireAuth()
→ deleteAdminCollection(id)
→ 200 { ok: true }
→ 500 { error } on failure
```

---

### Part 3 — Collections page (`app/admin/collections/page.tsx`)

#### Change 1: Replace mock initialisation with real fetch

Remove:
```ts
import { mockCollections } from '@/lib/admin/mockData'
const [collections, setCollections] = useState<AdminCollection[]>(mockCollections)
```

Add:
```ts
const [collections, setCollections] = useState<AdminCollection[]>([])
const [loading,     setLoading]     = useState(true)
```

Add `useEffect` on mount:
```ts
useEffect(() => {
  fetch('/api/admin/collections')
    .then(r => r.ok ? r.json() : [])
    .then(setCollections)
    .finally(() => setLoading(false))
}, [])
```

#### Change 2: Add Toast state and import

```ts
import Toast, { ToastType } from '@/components/admin/shared/Toast'

const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)
```

Render at bottom of JSX return:
```tsx
{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
```

#### Change 3: Wire `handleSave`

Replace the current `setTimeout` fake-save with a real API call:

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
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      : await fetch('/api/admin/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
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

#### Change 4: Wire `handleDelete`

Replace the current local-state-only delete:

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

#### Change 5: Add loading skeleton

Show a simple loading state while the initial fetch completes (before the grid renders):

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
  /* existing empty state */
) : (
  /* existing grid */
)}
```

#### Change 6: Remove "Plan 2 note" from modal

Delete this block from the modal body:
```tsx
<div className="p-3 rounded-md bg-(--admin-surface-2) border border-(--admin-border)">
  <p className="text-[11px] text-(--admin-text-muted)">
    Product assignment, sort order, and image upload available in Plan 2.
  </p>
</div>
```

---

## Files Changed

| File | Action |
|---|---|
| `lib/admin/shopifyAdmin.ts` | Add `ShopifyCollectionNode`, `toAdminCollection`, `createAdminCollection`, `updateAdminCollection`, `deleteAdminCollection` |
| `app/api/admin/collections/route.ts` | Add `POST` handler alongside existing `GET` |
| `app/api/admin/collections/[id]/route.ts` | **New file** — `PUT` and `DELETE` handlers |
| `app/admin/collections/page.tsx` | Replace mock, add fetch + loading, wire save/delete, add Toast, remove Plan 2 note |

## What This Does NOT Change

- The `GET /api/admin/collections` handler — stays exactly as-is
- The modal UI (title, handle, description fields) — stays exactly as-is
- The grid card layout — stays exactly as-is
- The delete confirm modal — stays exactly as-is
- Product assignment, image upload — out of scope (no Shopify API surface for this without additional scopes)

---

## Verification Steps

1. Open `/admin/collections` — should show real Shopify collections, not mock data
2. Click "Add collection", fill in title, save — should appear in Shopify Admin → Collections
3. Click Edit on a collection, change title, save — should update in Shopify
4. Delete a collection — should be removed from Shopify
5. Reload page — all changes should persist (not local-only)
6. Error path: try creating a collection with a duplicate handle — error toast should appear

---

*Spec created: 2026-05-30 · Acme Lamp & Sign Co.*
