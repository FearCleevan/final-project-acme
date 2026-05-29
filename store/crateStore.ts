import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
      items:  [],
      isOpen: false,
      cartId: null,

      openCrate:  () => set({ isOpen: true }),
      closeCrate: () => set({ isOpen: false }),

      addItem: (product, finish, burnerSize) => {
        const existing = get().items.find(i => i.product.id === product.id)

        if (existing) {
          // ── Item already in cart — increment quantity ──────────────────────
          const newQty = existing.quantity + 1
          set({
            items: get().items.map(i =>
              i.product.id === product.id ? { ...i, quantity: newQty } : i
            ),
          })
          // Background sync: update the Shopify line quantity
          const { cartId } = get()
          if (cartId && existing.cartLineId) {
            cartLinesUpdate(cartId, [{ id: existing.cartLineId, quantity: newQty }])
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
            // No cart yet — create one with ALL current items
            const allItems = get().items
            cartCreate(
              allItems.map(i => ({
                merchandiseId: i.product.variantId ?? '',
                quantity:      i.quantity,
              }))
            ).then(result => {
              if (!result) return
              set(state => ({
                cartId: result.cartId,
                items:  state.items.map(item => {
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
        const item   = get().items.find(i => i.product.id === productId)
        const cartId = get().cartId
        // Update Zustand immediately
        set({
          items: get().items.map(i =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        })
        // Background sync — only if line is already synced to Shopify
        if (cartId && item?.cartLineId) {
          cartLinesUpdate(cartId, [{ id: item.cartLineId, quantity }])
        }
      },

      clearCrate: () => set({ items: [], cartId: null }),
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
