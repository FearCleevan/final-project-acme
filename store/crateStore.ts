import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Debounce timers keyed by productId — module-level so they survive re-renders
const _syncTimers = new Map<string, ReturnType<typeof setTimeout>>()
import { CrateItem, Product } from '@/lib/types'
import {
  cartCreate,
  cartLinesAdd,
  cartLinesUpdate,
  cartLinesRemove,
  cartBuyerIdentityUpdate,
  fetchCart,
} from '@/lib/shopifyCart'

interface CrateStore {
  items:           CrateItem[]
  isOpen:          boolean
  cartId:          string | null
  checkoutUrl:     string | null
  _cartCreating:   boolean
  _customerToken:  string | null   // set by initCart so addItem can use it without circular imports
  openCrate:       () => void
  closeCrate:      () => void
  addItem:         (product: Product, finish: string, burnerSize: string) => void
  removeItem:      (productId: string) => void
  updateQuantity:  (productId: string, quantity: number) => void
  clearCrate:      () => void
  checkout:        () => void
  total:           () => number
  itemCount:       () => number
  initCart:        (customerAccessToken?: string | null) => Promise<void>
}

export const useCrateStore = create<CrateStore>()(
  persist(
    (set, get) => ({
      items:          [],
      isOpen:         false,
      cartId:         null,
      checkoutUrl:    null,
      _cartCreating:  false,
      _customerToken: null,

      openCrate:  () => set({ isOpen: true }),
      closeCrate: () => set({ isOpen: false }),

      addItem: (product, finish, burnerSize) => {
        const existing = get().items.find(i => i.product.id === product.id)

        if (existing) {
          // ── Item already in cart — increment quantity (capped at stock) ────
          const newQty = Math.min(existing.quantity + 1, existing.product.stockQuantity)
          if (newQty === existing.quantity) return // already at stock limit
          set({
            items: get().items.map(i =>
              i.product.id === product.id ? { ...i, quantity: newQty } : i
            ),
          })
          // Background sync: update the Shopify line quantity
          const { cartId } = get()
          if (cartId && existing.cartLineId) {
            const lineId = existing.cartLineId
            cartLinesUpdate(cartId, [{ id: lineId, quantity: newQty }]).then(result => {
              if (!result) {
                set(state => ({
                  items: state.items.map(i =>
                    i.product.id === product.id ? { ...i, cartLineId: null } : i
                  ),
                }))
                get().initCart()
              }
            })
          }
        } else {
          // ── New item — add to Zustand immediately ──────────────────────────
          set({
            items: [
              ...get().items,
              { product, quantity: 1, selectedFinish: finish, selectedBurnerSize: burnerSize, cartLineId: null },
            ],
          })

          const { cartId } = get()

          if (!cartId) {
            // Guard against concurrent cartCreate calls
            if (get()._cartCreating) return
            set({ _cartCreating: true })
            const allItems      = get().items
            const customerToken = get()._customerToken  // set by initCart — no circular import needed
            cartCreate(
              allItems
                .filter(i => i.product.variantId !== null)
                .map(i => ({
                  merchandiseId: i.product.variantId!,
                  quantity:      i.quantity,
                })),
              customerToken
            ).then(async result => {
              if (!result) {
                set({ _cartCreating: false })
                return
              }
              // Map the lines we know about
              set(state => ({
                _cartCreating: false,
                cartId:        result.cartId,
                checkoutUrl:   result.checkoutUrl,
                items:         state.items.map(item => {
                  const line = result.lines.find(l => l.merchandise.id === item.product.variantId)
                  return line ? { ...item, cartLineId: line.id } : item
                }),
              }))
              // Sync items that were added while _cartCreating was true (race condition)
              const unsynced = get().items.filter(i => !i.cartLineId && i.product.variantId)
              if (unsynced.length > 0) {
                const newLines = await cartLinesAdd(
                  result.cartId,
                  unsynced.map(i => ({ merchandiseId: i.product.variantId!, quantity: i.quantity }))
                )
                if (newLines) {
                  set(state => ({
                    items: state.items.map(item => {
                      if (item.cartLineId) return item
                      const line = newLines.find(l => l.merchandise.id === item.product.variantId)
                      return line ? { ...item, cartLineId: line.id } : item
                    }),
                  }))
                }
              }
            })
          } else {
            // Cart exists — add just this new line
            if (!product.variantId) {
              console.warn('[crateStore] Product has no variantId — not synced to Shopify cart:', product.name, product.id)
              return
            }
            cartLinesAdd(cartId, [{ merchandiseId: product.variantId, quantity: 1 }]).then(lines => {
              if (!lines) return
              const line = lines.find(l => l.merchandise.id === product.variantId)
              if (!line) return
              set(state => ({
                items: state.items.map(i =>
                  i.product.id === product.id ? { ...i, cartLineId: line.id } : i
                ),
              }))
            })
          }
        }
      },

      removeItem: (productId) => {
        const item   = get().items.find(i => i.product.id === productId)
        const cartId = get().cartId
        // Remove from Zustand immediately
        set({ items: get().items.filter(i => i.product.id !== productId) })
        // Background sync
        if (cartId && item?.cartLineId) {
          cartLinesRemove(cartId, [item.cartLineId])
        }
      },

      updateQuantity: (productId, quantity) => {
        const item = get().items.find(i => i.product.id === productId)
        if (!item) return
        const capped = Math.min(quantity, item.product.stockQuantity)
        // Update Zustand immediately for instant UI feedback
        set({
          items: get().items.map(i =>
            i.product.id === productId ? { ...i, quantity: capped } : i
          ),
        })
        // Debounce Shopify sync — rapid clicks collapse into one request
        const existing = _syncTimers.get(productId)
        if (existing) clearTimeout(existing)
        const timer = setTimeout(() => {
          _syncTimers.delete(productId)
          const { cartId, items } = get()
          const current = items.find(i => i.product.id === productId)
          if (!current || !cartId || !current.cartLineId) return
          cartLinesUpdate(cartId, [{ id: current.cartLineId, quantity: current.quantity }]).then(result => {
            if (!result) {
              set(state => ({
                items: state.items.map(i =>
                  i.product.id === productId ? { ...i, cartLineId: null } : i
                ),
              }))
              get().initCart()
            }
          })
        }, 400)
        _syncTimers.set(productId, timer)
      },

      clearCrate: () => set({ items: [], cartId: null, checkoutUrl: null, _customerToken: null }),

      // Capture URL, wipe the cart, then send user to Shopify checkout.
      // Cart is cleared immediately so returning users always see an empty state.
      // return_to param tells Shopify where to redirect after order is placed.
      checkout: () => {
        const url = get().checkoutUrl
        if (!url) return
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.acmevintagesupply.com'
        const returnTo = encodeURIComponent(siteUrl)
        const checkoutUrl = url.includes('?')
          ? `${url}&return_to=${returnTo}`
          : `${url}?return_to=${returnTo}`
        set({ items: [], cartId: null, checkoutUrl: null, _customerToken: null })
        window.location.href = checkoutUrl
      },

      total: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      initCart: async (customerAccessToken) => {
        // Store the token so addItem can use it when creating a new cart
        if (customerAccessToken !== undefined) {
          set({ _customerToken: customerAccessToken ?? null })
        }

        const { cartId } = get()
        if (!cartId) return

        const result = await fetchCart(cartId)

        if (!result) {
          // Cart expired or invalid — reset cartId, keep local items
          set({ cartId: null })
          return
        }

        // If a customer just logged in, link the cart to them so checkout uses their email
        let checkoutUrl = result.checkoutUrl
        if (customerAccessToken) {
          const updated = await cartBuyerIdentityUpdate(cartId, customerAccessToken)
          if (updated) checkoutUrl = updated
        }

        // Patch Shopify cartLineIds into existing Zustand items
        set(state => ({
          checkoutUrl,
          items: state.items.map(item => {
            const line = result.lines.find(l => l.merchandise.id === item.product.variantId)
            return { ...item, cartLineId: line?.id ?? null }
          }),
        }))
      },
    }),
    {
      name:    'acme-crate',
      partialize: (state) => ({
        items:       state.items,
        cartId:      state.cartId,
        checkoutUrl: state.checkoutUrl,
        // _customerToken is session-only — don't persist to localStorage
      }),
    }
  )
)
