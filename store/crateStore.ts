import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CrateItem, Product } from '@/lib/types'

interface CrateStore {
  items: CrateItem[]
  isOpen: boolean
  openCrate: () => void
  closeCrate: () => void
  addItem: (product: Product, finish: string, burnerSize: string) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCrate: () => void
  total: () => number
  itemCount: () => number
}

export const useCrateStore = create<CrateStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCrate: () => set({ isOpen: true }),
      closeCrate: () => set({ isOpen: false }),
      addItem: (product, finish, burnerSize) => {
        const existing = get().items.find(i => i.product.id === product.id)
        if (existing) {
          set({
            items: get().items.map(i =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          })
        } else {
          set({
            items: [
              ...get().items,
              { product, quantity: 1, selectedFinish: finish, selectedBurnerSize: burnerSize },
            ],
          })
        }
      },
      removeItem: (productId) =>
        set({ items: get().items.filter(i => i.product.id !== productId) }),
      updateQuantity: (productId, quantity) =>
        set({
          items: get().items.map(i =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        }),
      clearCrate: () => set({ items: [] }),
      total: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'acme-crate' }
  )
)
