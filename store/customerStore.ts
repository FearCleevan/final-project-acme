/**
 * Zustand store for Shopify customer auth.
 * Replaces the mock authStore — token is persisted in localStorage.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  CustomerProfile,
  CustomerOrder,
  CustomerAddress,
  customerLogin,
  customerCreate,
  customerLogout,
  getCustomerProfile,
} from '@/lib/shopifyCustomer'

interface CustomerStore {
  // Auth state
  accessToken:  string | null
  expiresAt:    string | null
  isLoggedIn:   boolean

  // Profile cache
  profile:      CustomerProfile | null
  loading:      boolean
  error:        string | null

  // Actions
  login:        (email: string, password: string) => Promise<string | null>
  register:     (firstName: string, lastName: string, email: string, password: string) => Promise<string | null>
  logout:       () => Promise<void>
  fetchProfile: () => Promise<void>
  clearError:   () => void
}

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      accessToken: null,
      expiresAt:   null,
      isLoggedIn:  false,
      profile:     null,
      loading:     false,
      error:       null,

      login: async (email, password) => {
        set({ loading: true, error: null })
        const { token, errors } = await customerLogin({ email, password })
        if (!token || errors.length) {
          const msg = errors[0]?.message ?? 'Invalid email or password.'
          set({ loading: false, error: msg })
          return msg
        }
        set({
          loading:     false,
          accessToken: token.accessToken,
          expiresAt:   token.expiresAt,
          isLoggedIn:  true,
          error:       null,
        })
        // Fetch profile in background
        get().fetchProfile()
        return null
      },

      register: async (firstName, lastName, email, password) => {
        set({ loading: true, error: null })
        const { token, errors } = await customerCreate({ firstName, lastName, email, password })
        if (!token || errors.length) {
          const msg = errors[0]?.message ?? 'Could not create account. Please try again.'
          set({ loading: false, error: msg })
          return msg
        }
        set({
          loading:     false,
          accessToken: token.accessToken,
          expiresAt:   token.expiresAt,
          isLoggedIn:  true,
          error:       null,
        })
        get().fetchProfile()
        return null
      },

      logout: async () => {
        const { accessToken } = get()
        if (accessToken) await customerLogout(accessToken)
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
        if (!profile) {
          // Token likely expired — clear session
          set({
            loading:     false,
            accessToken: null,
            expiresAt:   null,
            isLoggedIn:  false,
            profile:     null,
          })
          return
        }
        set({ loading: false, profile })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'acme-customer',
      partialize: (s) => ({
        accessToken: s.accessToken,
        expiresAt:   s.expiresAt,
        isLoggedIn:  s.isLoggedIn,
      }),
    }
  )
)

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
    FULFILLED:          'Delivered',
    UNFULFILLED:        'Processing',
    PARTIALLY_FULFILLED:'Partially Shipped',
    IN_PROGRESS:        'Processing',
    ON_HOLD:            'On Hold',
    SCHEDULED:          'Scheduled',
    OPEN:               'Processing',
  }
  return map[fulfillmentStatus] ?? fulfillmentStatus
}
