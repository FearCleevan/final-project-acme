import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SavedAddress {
  fullName: string
  email: string
  phone: string
  street: string
  apt: string
  city: string
  state: string
  zip: string
  country: string
}

export interface OrderItem {
  name: string
  sku: string
  price: number
  qty: number
}

export type OrderStatus = 'Processing' | 'Shipped' | 'Delivered' | 'Return Requested' | 'Returned'

export interface Order {
  id: string
  date: string
  status: OrderStatus
  items: OrderItem[]
  total: number
  returnReason?: string
  trackingRef?: string
}

interface AuthStore {
  isAuthenticated: boolean
  userName: string
  userEmail: string
  savedAddress: SavedAddress | null
  orders: Order[]
  signIn: (email: string, name?: string) => void
  signOut: () => void
  setSavedAddress: (addr: SavedAddress) => void
}

const DEMO_ORDERS: Order[] = [
  {
    id: 'ACME-2614-SP',
    date: '2026-02-14',
    status: 'Delivered',
    trackingRef: 'ACME-2614-SP',
    items: [
      { name: 'Cattaraugus Brass Center-Draft Lamp', sku: 'L-1873-CB', price: 248, qty: 1 },
      { name: 'Clear Beaded Chimney, 7-inch', sku: 'G-0042-CB', price: 38, qty: 1 },
    ],
    total: 286,
  },
  {
    id: 'ACME-2591-SP',
    date: '2025-11-30',
    status: 'Shipped',
    trackingRef: 'ACME-2591-SP',
    items: [
      { name: 'Coleman Lantern Co. Porcelain Sign', sku: 'S-0014-PO', price: 195, qty: 1 },
    ],
    total: 195,
  },
  {
    id: 'ACME-2540-SP',
    date: '2025-09-08',
    status: 'Return Requested',
    trackingRef: 'ACME-2540-SP',
    returnReason: 'Chimney arrived with a hairline crack along the collar.',
    items: [
      { name: 'No. 2 Cold-Blast Lantern Burner', sku: 'H-0031-NI', price: 64, qty: 1 },
      { name: 'Milk-White Cased Shade, 10-inch', sku: 'G-0018-MW', price: 74, qty: 2 },
    ],
    total: 212,
  },
  {
    id: 'ACME-2488-SP',
    date: '2025-06-22',
    status: 'Processing',
    items: [
      { name: 'Pittsburgh Railroad Caboose Lamp', sku: 'L-1880-RR', price: 312, qty: 1 },
    ],
    total: 330,
  },
]

const DEMO_ADDRESS: SavedAddress = {
  fullName: 'Scott Demo',
  email: 'demo@acmelamp.co',
  phone: '+1 (902) 555-1873',
  street: '14 Harbour Drive',
  apt: '',
  city: 'Halifax',
  state: 'NS',
  zip: 'B3J 1A1',
  country: 'Canada',
}

const DEMO_EMAIL = 'demo@acmelamp.co'
const DEMO_PASSWORD = 'demo1234'

export { DEMO_EMAIL, DEMO_PASSWORD }

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userName: '',
      userEmail: '',
      savedAddress: null,
      orders: [],
      signIn: (email, name) => {
        const isDemo = email.toLowerCase() === DEMO_EMAIL
        set({
          isAuthenticated: true,
          userEmail: email,
          userName: name ?? (isDemo ? 'Adelaide Demo' : email.split('@')[0]),
          savedAddress: isDemo ? DEMO_ADDRESS : null,
          orders: isDemo ? DEMO_ORDERS : [],
        })
      },
      signOut: () => set({
        isAuthenticated: false,
        userName: '',
        userEmail: '',
        savedAddress: null,
        orders: [],
      }),
      setSavedAddress: (addr) => set({ savedAddress: addr }),
    }),
    { name: 'acme-auth' }
  )
)
