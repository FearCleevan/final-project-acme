/**
 * Zustand store for customer auth.
 * Auth state comes from the server-side iron-session (/api/auth/me).
 * Token is held in memory only — never persisted to localStorage.
 */

import { create } from 'zustand'
import {
  CustomerProfile,
  CustomerOrder,
  CustomerAddress,
  customerCreate,
} from '@/lib/shopifyCustomer'
import { getCustomerProfileCA } from '@/lib/shopifyCustomerCA'

interface CustomerStore {
  accessToken:  string | null
  expiresAt:    number | null
  isLoggedIn:   boolean
  profile:      CustomerProfile | null
  loading:      boolean
  error:        string | null

  // Called once on app mount to hydrate from server session
  hydrate:      () => Promise<void>
  // Register only — login is handled by OAuth redirect (/api/auth/authorize)
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

  register: async (firstName, lastName, email, password) => {
    set({ loading: true, error: null })
    const { token, errors } = await customerCreate({ firstName, lastName, email, password })
    set({ loading: false })
    if (errors.length || !token) {
      const msg = errors[0]?.message ?? 'Could not create account. Please try again.'
      set({ error: msg })
      return msg
    }
    // Account created — redirect to OAuth login so Shopify issues a CA API token
    window.location.href = '/api/auth/authorize?redirectTo=/account'
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
    const profile = await getCustomerProfileCA(accessToken)
    if (!profile) {
      set({ loading: false, isLoggedIn: false, accessToken: null, profile: null })
      return
    }
    set({ loading: false, profile })
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
