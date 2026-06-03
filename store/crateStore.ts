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
  fetchCart,
} from '@/lib/shopifyCart'

interface CrateStore {
  items:          CrateItem[]
  isOpen:         boolean
  cartId:         string | null
  checkoutUrl:    string | null
  _cartCreating:  boolean
  openCrate:      () => void
  closeCrate:     () => void
  addItem:        (product: Product, finish: string, burnerSize: string) => void
  removeItem:     (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCrate:     () => void
  total:          () => number
  itemCount:      () => number
  initCart:       () => Promise<void>
}

export const useCrateStore = create<CrateStore>()(
  persist(
    (set, get) => ({
      items:         [],
      isOpen:        false,
      cartId:        null,
      checkoutUrl:   null,
      _cartCreating: false,

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
            const allItems = get().items
            cartCreate(
              allItems
                .filter(i => i.product.variantId !== null)
                .map(i => ({
                  merchandiseId: i.product.variantId!,
                  quantity:      i.quantity,
                }))
            ).then(result => {
              if (!result) {
                set({ _cartCreating: false })
                return
              }
              set(state => ({
                _cartCreating: false,
                cartId:        result.cartId,
                checkoutUrl:   result.checkoutUrl,
                items:         state.items.map(item => {
                  const line = result.lines.find(l => l.merchandise.id === item.product.variantId)
                  return line ? { ...item, cartLineId: line.id } : item
                }),
              }))
            })
          } else {
            // Cart exists — add just this new line
            if (!product.variantId) return
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

      clearCrate: () => set({ items: [], cartId: null, checkoutUrl: null }),
      // No Shopify call on clear — cart expires naturally after 10 days.

      total: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),

      initCart: async () => {
        const { cartId } = get()
        if (!cartId) return

        const result = await fetchCart(cartId)

        if (!result) {
          // Cart expired or invalid — reset cartId, keep local items
          set({ cartId: null })
          return
        }

        // Patch Shopify cartLineIds into existing Zustand items
        set(state => ({
          checkoutUrl: result.checkoutUrl,
          items: state.items.map(item => {
            const line = result.lines.find(l => l.merchandise.id === item.product.variantId)
            return { ...item, cartLineId: line?.id ?? null }
          }),
        }))
      },
    }),
    { name: 'acme-crate' }
  )
)
