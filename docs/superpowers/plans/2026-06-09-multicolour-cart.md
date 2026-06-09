# Multi-Colour Selection + Grouped Cart — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let customers select multiple colour variants with individual quantities on the product page, and display those variant line items grouped under their parent product in the cart drawer and crate page.

**Architecture:** A new shared utility (`lib/cartGrouping.ts`) provides the grouping function and colour-hex lookup. The product page gains an opt-in multi-select mode that replaces the swatch+stepper block with a per-colour table. The cart store gets a `quantity` param so multi-adds work in one call per colour. Cart rendering in both the drawer and the full crate page uses the new grouping utility to visually distinguish variant groups from flat items.

**Tech Stack:** Next.js 16 App Router, Zustand (persist), TypeScript, Tailwind v4, Shopify Storefront Cart API

---

## File Map

| File | Status | What changes |
|---|---|---|
| `lib/cartGrouping.ts` | **CREATE** | `groupCartItems()`, `CartEntry` type, `COLOUR_HEX` map |
| `store/crateStore.ts` | **MODIFY** | `addItem` gains optional `quantity` param |
| `components/product/ProductInfo.tsx` | **MODIFY** | Multi-select mode + per-colour qty table |
| `components/crate/CrateDrawer.tsx` | **MODIFY** | Grouped rendering via `groupCartItems()` |
| `app/crate/page.tsx` | **MODIFY** | Grouped rendering via `groupCartItems()` |

---

## Task 1 — Shared grouping utility + colour map

**Files:**
- Create: `lib/cartGrouping.ts`

- [ ] **Step 1: Create the file**

```typescript
// lib/cartGrouping.ts
import { CrateItem } from '@/lib/types'

export const COLOUR_HEX: Record<string, string> = {
  'Red':           '#D50000',
  'Orange':        '#FF6D00',
  'Yellow':        '#FFD600',
  'Green':         '#00C853',
  'Blue':          '#2962FF',
  'Powder Blue':   '#8AB4C6',
  'Pink':          '#F48FB1',
  'Peach':         '#FFAB91',
  'Magenta':       '#CC00CC',
  'Brown':         '#795548',
  'Gold':          '#FFC107',
  'Silver':        '#9E9E9E',
  'Amber':         '#FF8F00',
  'Clear':         '#E8E8E8',
  'White':         '#FFFFFF',
  'Black':         '#1A1A1A',
  'Emerald':       '#2D7A47',
  'Emerald Green': '#2D7A47',
  'Ruby':          '#8B1A1A',
  'Ruby Red':      '#8B1A1A',
}

export type CartEntry =
  | { isGroup: false; item: CrateItem }
  | { isGroup: true;  name: string; image: string; items: CrateItem[] }

/**
 * Splits a flat cart item list into display entries.
 * Items with a variantId are collapsed into named groups (one group per product name).
 * Items without a variantId appear as flat entries, preserving add order.
 */
export function groupCartItems(items: CrateItem[]): CartEntry[] {
  const result: CartEntry[] = []
  const groupIndex = new Map<string, number>() // product name → index in result

  for (const item of items) {
    if (item.product.variantId) {
      const key = item.product.name
      const idx = groupIndex.get(key)
      if (idx !== undefined) {
        ;(result[idx] as Extract<CartEntry, { isGroup: true }>).items.push(item)
      } else {
        groupIndex.set(key, result.length)
        result.push({
          isGroup: true,
          name:    item.product.name,
          image:   item.product.images[0] ?? '',
          items:   [item],
        })
      }
    } else {
      result.push({ isGroup: false, item })
    }
  }

  return result
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "C:\Users\PPlazan\Desktop\Claude Design\final-lamp-sign\acme-lamp-sign" && npx tsc --noEmit
```

Expected: no errors mentioning `cartGrouping.ts`.

---

## Task 2 — Add `quantity` param to `crateStore.addItem`

**Files:**
- Modify: `store/crateStore.ts`

- [ ] **Step 1: Update the interface**

In the `CrateStore` interface (line 25), change:

```typescript
// Before
addItem: (product: Product, finish: string, burnerSize: string, selectedColour?: string) => void
// After
addItem: (product: Product, finish: string, burnerSize: string, selectedColour?: string, quantity?: number) => void
```

- [ ] **Step 2: Update the implementation signature**

Line 48 — change the function signature:

```typescript
// Before
addItem: (product, finish, burnerSize, selectedColour = '') => {
// After
addItem: (product, finish, burnerSize, selectedColour = '', quantity = 1) => {
```

- [ ] **Step 3: Use `quantity` in the existing-item branch**

Lines 53–54 currently read:

```typescript
const newQty = Math.min(existing.quantity + 1, existing.product.stockQuantity)
```

Change to:

```typescript
const newQty = Math.min(existing.quantity + quantity, existing.product.stockQuantity)
```

- [ ] **Step 4: Use `quantity` for the new-item local state**

Line 80 currently reads:

```typescript
{ product, quantity: 1, selectedFinish: finish, selectedBurnerSize: burnerSize, selectedColour, cartLineId: null },
```

Change to:

```typescript
{ product, quantity, selectedFinish: finish, selectedBurnerSize: burnerSize, selectedColour, cartLineId: null },
```

- [ ] **Step 5: Use `quantity` in the `cartLinesAdd` call (cart-exists path)**

Line 139 currently reads:

```typescript
cartLinesAdd(cartId, [{ merchandiseId: product.variantId, quantity: 1 }]).then(lines => {
```

Change to:

```typescript
cartLinesAdd(cartId, [{ merchandiseId: product.variantId, quantity }]).then(lines => {
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no new errors.

---

## Task 3 — Multi-select mode on the product page

**Files:**
- Modify: `components/product/ProductInfo.tsx`

This task replaces the swatch + single-qty block for variant products with a two-mode UI. Non-variant products are untouched.

- [ ] **Step 1: Add the imports and colour map at the top of the file**

After the existing imports add:

```typescript
import { COLOUR_HEX } from '@/lib/cartGrouping'
```

- [ ] **Step 2: Add multi-mode state after existing state declarations**

After line 43 (`const [added, setAdded] = useState(false)`), add:

```typescript
const [multiMode,  setMultiMode]  = useState(false)
const [multiQtys,  setMultiQtys]  = useState<Map<string, number>>(new Map())

function setMultiQty(variantId: string, qty: number) {
  setMultiQtys(prev => {
    const next = new Map(prev)
    if (qty === 0) next.delete(variantId)
    else next.set(variantId, qty)
    return next
  })
}

const multiCount = Array.from(multiQtys.values()).reduce((s, q) => s + q, 0)
const multiTotal = product.colorVariants.reduce((s, cv) => {
  return s + (multiQtys.get(cv.id) ?? 0) * cv.price
}, 0)
```

- [ ] **Step 3: Update `handleAdd` to support multi mode**

Replace the entire `handleAdd` function (lines 59–81) with:

```typescript
function handleAdd() {
  if (hasColourVariants && multiMode) {
    if (multiCount === 0) return
    for (const cv of product.colorVariants) {
      const q = multiQtys.get(cv.id) ?? 0
      if (q === 0) continue
      const cartProduct = {
        ...product,
        id:            `${product.id}-${cv.id}`,
        variantId:     cv.id,
        price:         cv.price,
        stockQuantity: cv.stock,
      }
      addItem(cartProduct, selectedFinish, selectedBurner, cv.colour, q)
    }
    setMultiQtys(new Map())
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
    return
  }

  // Single-select guard
  if (hasColourVariants && !selectedVariant) {
    setVariantError(true)
    return
  }

  const cartProduct = hasColourVariants && selectedVariant
    ? { ...product, id: cartKey, variantId: selectedVariant.id, price: selectedVariant.price, stockQuantity: selectedVariant.stock }
    : product

  if (existingQty > 0) {
    updateQuantity(cartKey, qty)
  } else {
    addItem(cartProduct, selectedFinish, selectedBurner, selectedVariant?.colour ?? '', qty)
  }
  setAdded(true)
  setTimeout(() => setAdded(false), 2000)
}
```

> Note: The old `for (let i = 0; i < qty; i++) { addItem(...) }` loop is gone — replaced by a single `addItem(..., qty)` call using the new quantity param from Task 2.

- [ ] **Step 4: Replace the colour-swatch block with the two-mode UI**

Find the block that starts with `{/* Colour variant swatches */}` (around line 174) and replace it entirely with:

```tsx
{/* Colour variant swatches — single-select mode */}
{hasColourVariants && !multiMode && (
  <div>
    <p className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft mb-2">
      Colour{selectedVariant ? ` — ${selectedVariant.colour}` : ' — Select one'}
    </p>
    <div className="flex flex-wrap gap-2 mb-2">
      {product.colorVariants.map((cv) => (
        <button
          key={cv.id}
          type="button"
          onClick={() => { setSelectedVariant(cv); setVariantError(false) }}
          className={`px-3 py-1.5 text-[13px] font-sans rounded-sm border transition-colors ${
            selectedVariant?.id === cv.id
              ? 'border-brass-deep bg-brass/10 text-brass-deep font-medium'
              : 'border-ink-rule text-ink-iron hover:border-brass hover:bg-brass/5'
          } ${cv.stock === 0 ? 'opacity-40 pointer-events-none' : ''}`}
        >
          {cv.colour}{cv.stock === 0 && ' (sold out)'}
        </button>
      ))}
    </div>
    <button
      type="button"
      onClick={() => {
        setMultiMode(true)
        if (selectedVariant) setMultiQty(selectedVariant.id, 1)
      }}
      className="text-[11px] font-mono text-brass-deep hover:text-brass transition-colors"
    >
      + Buying multiple colours?
    </button>
  </div>
)}

{/* Colour variant table — multi-select mode */}
{hasColourVariants && multiMode && (
  <div>
    <div className="flex items-center justify-between mb-3">
      <p className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft">
        Colour &amp; Quantity
      </p>
      <button
        type="button"
        onClick={() => { setMultiMode(false); setMultiQtys(new Map()) }}
        className="text-[11px] font-mono text-ink-soft hover:text-ink-iron transition-colors"
      >
        Single colour ✕
      </button>
    </div>
    <div className="border border-ink-rule rounded-sm overflow-hidden">
      {product.colorVariants.map((cv, idx) => {
        const q   = multiQtys.get(cv.id) ?? 0
        const hex = COLOUR_HEX[cv.colour] ?? '#ccc'
        return (
          <div
            key={cv.id}
            className={`flex items-center gap-3 px-3 py-2.5 ${idx > 0 ? 'border-t border-ink-rule' : ''} ${cv.stock === 0 ? 'opacity-40' : ''}`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
              style={{ background: hex }}
            />
            <span className="text-[13px] font-sans text-ink-iron flex-1">{cv.colour}</span>
            {cv.stock === 0 ? (
              <span className="text-[11px] font-mono text-ink-soft">Sold out</span>
            ) : (
              <>
                <div className="flex items-center gap-0 border border-ink-rule rounded-sm">
                  <button
                    type="button"
                    onClick={() => setMultiQty(cv.id, Math.max(0, q - 1))}
                    className="w-8 h-8 flex items-center justify-center text-ink-iron hover:bg-parchment-2 text-[15px] font-mono border-r border-ink-rule transition-colors"
                    aria-label={`Decrease ${cv.colour} quantity`}
                  >−</button>
                  <span className="w-9 text-center text-[13px] font-mono text-ink-iron tabular-nums">{q}</span>
                  <button
                    type="button"
                    onClick={() => setMultiQty(cv.id, Math.min(cv.stock, q + 1))}
                    disabled={q >= cv.stock}
                    className="w-8 h-8 flex items-center justify-center text-ink-iron hover:bg-parchment-2 text-[15px] font-mono border-l border-ink-rule transition-colors disabled:opacity-30 disabled:pointer-events-none"
                    aria-label={`Increase ${cv.colour} quantity`}
                  >+</button>
                </div>
                {q > 0 && (
                  <span className="text-[12px] font-mono text-ink-soft w-14 text-right tabular-nums">
                    {formatPrice(cv.price * q)}
                  </span>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  </div>
)}
```

- [ ] **Step 5: Hide the single quantity stepper in multi mode**

Find `{/* Quantity stepper */}` (around line 262). Wrap the entire stepper `<div>` so it only renders when not in multi mode:

```tsx
{/* Quantity stepper — hidden in multi-colour mode */}
{(!hasColourVariants || !multiMode) && (
  <div>
    <div className="flex items-center justify-between mb-2">
      <p className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft">
        Quantity
      </p>
      {activeInStock && activeStock <= 10 && (
        <p className="text-[11px] font-mono text-brass-deep">
          {activeStock} in stock
        </p>
      )}
    </div>
    <div className="flex items-center gap-0 border border-ink-rule rounded-sm w-fit">
      <button
        onClick={() => setQty((q) => Math.max(1, q - 1))}
        className="w-11 h-11 flex items-center justify-center text-ink-iron hover:bg-parchment-2 transition-colors text-[18px] font-mono border-r border-ink-rule"
        aria-label="Decrease quantity"
      >−</button>
      <span
        className="w-12 text-center text-[15px] font-mono text-ink-iron tabular-nums"
        aria-live="polite"
      >{qty}</span>
      <button
        onClick={() => setQty((q) => Math.min(activeStock, q + 1))}
        disabled={qty >= activeStock}
        className="w-11 h-11 flex items-center justify-center text-ink-iron hover:bg-parchment-2 transition-colors text-[18px] font-mono border-l border-ink-rule disabled:opacity-30 disabled:pointer-events-none"
        aria-label="Increase quantity"
      >+</button>
    </div>
  </div>
)}
```

- [ ] **Step 6: Update the Add to Crate button**

Find the `{/* Add to crate CTA */}` button (around line 307). Replace only the `disabled` prop and the button label expression:

```tsx
<button
  onClick={handleAdd}
  disabled={hasColourVariants && multiMode ? multiCount === 0 : !activeInStock}
  className="w-full min-h-15 flex items-center justify-center gap-2 bg-green-brand text-[#F5F1E6] rounded-btn font-sans text-[17px] font-semibold hover:bg-green-deep hover:shadow-cta-hover hover:-translate-y-px active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
>
  {added
    ? '✓ Added to your crate'
    : hasColourVariants && multiMode
      ? multiCount > 0
        ? `Add ${multiCount} item${multiCount !== 1 ? 's' : ''} to crate — ${formatPrice(multiTotal)}`
        : 'Select quantities above'
      : `Add to crate — ${formatPrice(lineTotal)}`}
</button>
```

- [ ] **Step 7: Hide the variant error message in multi mode**

Find `{/* Cart guard */}` (line ~299). Wrap it:

```tsx
{variantError && !multiMode && (
  <p className="text-[13px] font-sans text-amber-700 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2">
    Please select a colour before adding to your crate.
  </p>
)}
```

- [ ] **Step 8: Verify TypeScript compiles and test manually**

```bash
npx tsc --noEmit
```

Then open the dev server, navigate to a product with colour variants (e.g. Hurricane Glass), and verify:
1. Default state shows swatches + `"+ Buying multiple colours?"` link
2. Clicking the link replaces the block with the per-colour table
3. Incrementing qtys updates the CTA label: `"Add N items to crate — $X.XX"`
4. Clicking `"Single colour ✕"` reverts to swatches, qtys reset
5. Selecting a colour in single mode then clicking the multi link pre-populates that colour with qty=1
6. Clicking Add in multi mode adds items and resets qtys to 0 (CTA reads `"Select quantities above"`)
7. A non-variant product page is completely unchanged

---

## Task 4 — Grouped rendering in the crate drawer

**Files:**
- Modify: `components/crate/CrateDrawer.tsx`

- [ ] **Step 1: Add imports**

At the top of `CrateDrawer.tsx`, add:

```typescript
import { groupCartItems, COLOUR_HEX } from '@/lib/cartGrouping'
import { formatPrice } from '@/lib/utils'
import PlateImage from '@/components/shared/PlateImage'
import { CrateItem as CrateItemType } from '@/lib/types'
import { useCrateStore as useCrateStoreType } from '@/store/crateStore'
```

> `PlateImage` and `formatPrice` may already be imported indirectly — add only what's missing.

- [ ] **Step 2: Add the `itemCount` selector**

In the component body, alongside the existing destructure:

```typescript
const { isOpen, closeCrate, items } = useCrateStore()
const itemCount = useCrateStore(s => s.itemCount())
const { removeItem, updateQuantity } = useCrateStore()
```

- [ ] **Step 3: Update the header piece count**

Find:
```tsx
{items.length} {items.length === 1 ? 'piece' : 'pieces'} selected
```
Replace with:
```tsx
{itemCount} {itemCount === 1 ? 'piece' : 'pieces'} selected
```

- [ ] **Step 4: Add the inline `DrawerVariantGroup` component at the bottom of the file (before the closing brace)**

```tsx
function DrawerVariantGroup({ name, image, items }: { name: string; image: string; items: CrateItemType[] }) {
  const { removeItem, updateQuantity } = useCrateStore()
  const groupQty   = items.reduce((s, i) => s + i.quantity, 0)
  const groupTotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0)

  return (
    <div className="py-4 border-b border-ink-rule">
      {/* Group header */}
      <div className="flex gap-3 mb-3">
        <div className="shrink-0 w-15">
          <PlateImage src={image} alt={name} aspectRatio="4/5" label={undefined} />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <p className="font-serif text-[14px] font-medium text-ink-iron leading-snug line-clamp-2">{name}</p>
          <p className="text-[11px] font-mono text-brass-deep">
            {groupQty} {groupQty === 1 ? 'item' : 'items'} · {formatPrice(groupTotal)}
          </p>
        </div>
      </div>

      {/* Per-colour rows */}
      {items.map(item => {
        const hex = COLOUR_HEX[item.selectedColour] ?? '#ccc'
        return (
          <div key={item.product.id} className="flex items-center gap-2 pl-[72px] py-1.5 border-t border-ink-rule/50">
            <span
              className="w-2 h-2 rounded-full shrink-0 border border-black/10"
              style={{ background: hex }}
            />
            <span className="text-[12px] font-sans text-ink-iron flex-1 truncate">{item.selectedColour}</span>
            <div className="flex items-center gap-0 border border-ink-rule rounded-sm">
              <button
                onClick={() => {
                  if (item.quantity <= 1) removeItem(item.product.id)
                  else updateQuantity(item.product.id, item.quantity - 1)
                }}
                className="w-6 h-6 flex items-center justify-center text-ink-iron hover:bg-parchment-2 text-[12px] font-mono border-r border-ink-rule transition-colors"
                aria-label={`Decrease ${item.selectedColour} quantity`}
              >−</button>
              <span className="w-6 text-center text-[11px] font-mono text-ink-iron tabular-nums">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                disabled={item.quantity >= item.product.stockQuantity}
                className="w-6 h-6 flex items-center justify-center text-ink-iron hover:bg-parchment-2 text-[12px] font-mono border-l border-ink-rule transition-colors disabled:opacity-30 disabled:pointer-events-none"
                aria-label={`Increase ${item.selectedColour} quantity`}
              >+</button>
            </div>
            <button
              onClick={() => removeItem(item.product.id)}
              className="text-[11px] font-mono text-ink-soft hover:text-error transition-colors ml-1"
              aria-label={`Remove ${item.selectedColour}`}
            >×</button>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 5: Replace the items list in the drawer**

Find:
```tsx
<div className="flex-1 overflow-y-auto px-6">
  {items.map(item => (
    <CrateItem key={item.product.id} item={item} />
  ))}
</div>
```

Replace with:
```tsx
<div className="flex-1 overflow-y-auto px-6">
  {groupCartItems(items).map((entry, idx) =>
    entry.isGroup
      ? <DrawerVariantGroup key={entry.name} name={entry.name} image={entry.image} items={entry.items} />
      : <CrateItem key={entry.item.product.id} item={entry.item} />
  )}
</div>
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors. Then test the drawer manually: add 2 colours of a variant product → open the crate drawer → confirm the grouped block appears with per-colour rows and individual qty steppers.

---

## Task 5 — Grouped rendering on the full crate page

**Files:**
- Modify: `app/crate/page.tsx`

- [ ] **Step 1: Add imports**

```typescript
import { groupCartItems, COLOUR_HEX } from '@/lib/cartGrouping'
import { CrateItem as CrateItemType } from '@/lib/types'
```

- [ ] **Step 2: Update `itemCount` usage**

The page already computes `itemCount` correctly:
```typescript
const itemCount = items.reduce((s, i) => s + i.quantity, 0)
```
No change needed here.

- [ ] **Step 3: Replace the item list**

Find the `<div className="border-t border-ink-rule">` block that maps items (around line 85). Replace the entire `{items.map(item => (...))}` expression with:

```tsx
{groupCartItems(items).map((entry, entryIdx) => {
  if (!entry.isGroup) {
    const item = entry.item
    return (
      <div key={item.product.id} className="py-6 border-b border-ink-rule grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] gap-5 sm:gap-7">
        <Link href={`/catalog/${item.product.slug}`} className="shrink-0">
          <PlateImage
            src={item.product.images[0]}
            alt={item.product.name}
            aspectRatio="4/5"
            dark={(item.product.category as string) === 'signs'}
            className="rounded-sm hover:opacity-90 transition-opacity"
          />
        </Link>
        <div className="flex flex-col gap-2 min-w-0">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-eyebrow text-brass-deep mb-1">
              {item.product.sku} · {item.product.patent}
            </p>
            <Link href={`/catalog/${item.product.slug}`}>
              <h2 className="font-serif text-[18px] sm:text-[20px] font-medium text-ink-charcoal leading-snug hover:text-brass-deep transition-colors">
                {item.product.name}
              </h2>
            </Link>
            {item.selectedFinish && (
              <p className="text-[12px] font-sans text-ink-soft mt-1">Finish: {item.selectedFinish}</p>
            )}
            {item.selectedBurnerSize && (
              <p className="text-[12px] font-sans text-ink-soft">Burner: {item.selectedBurnerSize}</p>
            )}
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4 mt-auto">
            <div className="flex items-center gap-0 border border-ink-rule rounded-sm w-fit">
              <CrateItemStepper item={item} />
            </div>
            <div className="text-right">
              <p className="font-serif text-[22px] text-brass-deep leading-none">
                {formatPrice(item.product.price * item.quantity)}
              </p>
              {item.quantity > 1 && (
                <p className="text-[11px] font-mono text-ink-soft mt-0.5">{formatPrice(item.product.price)} each</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Variant group
  const group = entry
  const groupQty   = group.items.reduce((s, i) => s + i.quantity, 0)
  const groupTotal = group.items.reduce((s, i) => s + i.product.price * i.quantity, 0)
  return (
    <div key={group.name} className="py-6 border-b border-ink-rule">
      {/* Group header */}
      <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[100px_1fr] gap-5 sm:gap-7 mb-4">
        <Link href={`/catalog/${group.items[0].product.slug}`} className="shrink-0">
          <PlateImage
            src={group.image}
            alt={group.name}
            aspectRatio="4/5"
            dark={(group.items[0].product.category as string) === 'signs'}
            className="rounded-sm hover:opacity-90 transition-opacity"
          />
        </Link>
        <div className="flex flex-col justify-center gap-1 min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-eyebrow text-brass-deep">
            {group.items[0].product.sku}
          </p>
          <Link href={`/catalog/${group.items[0].product.slug}`}>
            <h2 className="font-serif text-[18px] sm:text-[20px] font-medium text-ink-charcoal leading-snug hover:text-brass-deep transition-colors">
              {group.name}
            </h2>
          </Link>
          <p className="text-[12px] font-mono text-brass-deep">
            {groupQty} {groupQty === 1 ? 'item' : 'items'} · {formatPrice(groupTotal)}
          </p>
        </div>
      </div>

      {/* Per-colour rows */}
      <div className="border border-ink-rule rounded-sm overflow-hidden ml-[calc(80px+20px)] sm:ml-[calc(100px+28px)]">
        {group.items.map((item, rowIdx) => {
          const hex = COLOUR_HEX[item.selectedColour] ?? '#ccc'
          return (
            <div
              key={item.product.id}
              className={`flex items-center gap-4 px-4 py-3 ${rowIdx > 0 ? 'border-t border-ink-rule' : ''}`}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                style={{ background: hex }}
              />
              <span className="text-[13px] font-sans text-ink-iron flex-1">{item.selectedColour}</span>
              <div className="flex items-center gap-0 border border-ink-rule rounded-sm w-fit">
                <CrateItemStepper item={item} />
              </div>
              <p className="font-serif text-[18px] text-brass-deep leading-none w-24 text-right tabular-nums">
                {formatPrice(item.product.price * item.quantity)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
})}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: End-to-end manual test**

1. Open a product with colour variants. Click `"+ Buying multiple colours?"`.
2. Set Red × 2 and Clear × 1. Click `"Add 3 items to crate — $XXX"`.
3. Open the crate drawer — confirm grouped block: "Hurricane Glass / 3 items · $XX / ● Red [− 2 +] / ● Clear [− 1 +]".
4. Navigate to `/crate` — confirm grouped block with image, name, colour rows with steppers.
5. Adjust a colour qty in the drawer — confirm total updates.
6. Remove one colour (×) — confirm it disappears; if last colour, group disappears.
7. Open a non-variant product (e.g. Aladdin Sol Shade) — confirm single qty stepper, flat row in cart, no `"+ Buying multiple colours?"` link.
8. Checkout with mixed cart (variant group + flat item) — Shopify checkout shows separate line items per colour + the flat item.
