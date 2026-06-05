import { create } from 'zustand'
import {
  CustomerProfile,
  CustomerOrder,
  CustomerAddress,
} from '@/lib/shopifyCustomer'
import { useCrateStore } from '@/store/crateStore'

interface CustomerStore {
  accessToken:  string | null
  expiresAt:    number | null
  isLoggedIn:   boolean
  profile:      CustomerProfile | null
  loading:      boolean
  error:        string | null

  hydrate:      () => Promise<void>
  login:        (redirectTo?: string) => void
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
        useCrateStore.getState().initCart()
        return
      }
      const { accessToken, expiresAt } = await res.json()
      set({ isLoggedIn: true, accessToken, expiresAt })
      useCrateStore.getState().initCart(accessToken)
      get().fetchProfile()
    } catch {
      set({ isLoggedIn: false, accessToken: null })
      useCrateStore.getState().initCart()
    }
  },

  // OAuth flow — redirects browser to Shopify-hosted auth page
  login: (redirectTo = '/account') => {
    window.location.href = `/api/auth/authorize?redirectTo=${encodeURIComponent(redirectTo)}`
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    useCrateStore.getState().clearCrate()
    set({
      accessToken: null,
      expiresAt:   null,
      isLoggedIn:  false,
      profile:     null,
      error:       null,
    })
  },

  fetchProfile: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/auth/profile')
      if (!res.ok) { set({ loading: false, profile: null }); return }
      const { profile } = await res.json()
      set({ loading: false, profile: profile ?? null })
    } catch {
      set({ loading: false, profile: null })
    }
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
