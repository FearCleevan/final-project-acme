import { create } from 'zustand'
import {
  CustomerProfile,
  CustomerOrder,
  CustomerAddress,
  customerCreate,
  getCustomerProfile,
} from '@/lib/shopifyCustomer'

interface CustomerStore {
  accessToken:  string | null
  expiresAt:    number | null
  isLoggedIn:   boolean
  profile:      CustomerProfile | null
  loading:      boolean
  error:        string | null

  hydrate:      () => Promise<void>
  login:        (email: string, password: string) => Promise<string | null>
  register:     (firstName: string, lastName: string, email: string, password: string) => Promise<string | null>
  logout:       () => Promise<void>
  fetchProfile: () => Promise<void>
  clearError:   () => void
}

export const useCustomerStore = create<CustomerStore>()((set, get) => ({
  accessToken: null,
  expiresAt:   null,
  isLoggedIn:  false,
  profile:     null,
  loading:     false,
  error:       null,

  hydrate: async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (!res.ok) {
        set({ isLoggedIn: false, accessToken: null })
        return
      }
      const { accessToken, expiresAt } = await res.json()
      set({ isLoggedIn: true, accessToken, expiresAt })
      get().fetchProfile()
    } catch {
      set({ isLoggedIn: false, accessToken: null })
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const res = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.error ?? 'Sign-in failed. Please try again.'
        set({ loading: false, error: msg })
        return msg
      }
      // Re-hydrate to pick up the new session token
      await get().hydrate()
      set({ loading: false })
      return null
    } catch {
      const msg = 'Network error. Please try again.'
      set({ loading: false, error: msg })
      return msg
    }
  },

  register: async (firstName, lastName, email, password) => {
    set({ loading: true, error: null })
    const { token, errors } = await customerCreate({ firstName, lastName, email, password })
    if (errors.length || !token) {
      const msg = errors[0]?.message ?? 'Could not create account. Please try again.'
      set({ loading: false, error: msg })
      return msg
    }
    // customerCreate auto-logs in — now save that token to the server session
    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    })
    if (res.ok) {
      await get().hydrate()
    }
    set({ loading: false })
    return null
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    set({
      accessToken: null,
      expiresAt:   null,
      isLoggedIn:  false,
      profile:     null,
      error:       null,
    })
  },

  fetchProfile: async () => {
    const { accessToken } = get()
    if (!accessToken) return
    set({ loading: true })
    const profile = await getCustomerProfile(accessToken)
    set({ loading: false, profile: profile ?? null })
  },

  clearError: () => set({ error: null }),
}))

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getCustomerOrders(profile: CustomerProfile | null): CustomerOrder[] {
  return profile?.orders.edges.map(e => e.node) ?? []
}

export function getCustomerAddresses(profile: CustomerProfile | null): CustomerAddress[] {
  return profile?.addresses.edges.map(e => e.node) ?? []
}

export function getRefundedOrders(profile: CustomerProfile | null): CustomerOrder[] {
  return getCustomerOrders(profile).filter(o =>
    o.financialStatus === 'REFUNDED' || o.financialStatus === 'PARTIALLY_REFUNDED'
  )
}

export function formatOrderStatus(fulfillmentStatus: string): string {
  const map: Record<string, string> = {
    FULFILLED:           'Delivered',
    UNFULFILLED:         'Processing',
    PARTIALLY_FULFILLED: 'Partially Shipped',
    IN_PROGRESS:         'Processing',
    ON_HOLD:             'On Hold',
    SCHEDULED:           'Scheduled',
    OPEN:                'Processing',
  }
  return map[fulfillmentStatus] ?? fulfillmentStatus
}
