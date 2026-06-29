import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CurrencyCode, ExchangeRates, fetchExchangeRates } from '@/lib/currency'

interface CurrencyStore {
  currency:            CurrencyCode
  rates:               ExchangeRates
  ratesFetchedAt:      number
  hasManuallySelected: boolean
  setCurrency:         (currency: CurrencyCode) => void
  ensureRates:         () => Promise<void>
  autoDetect:          () => Promise<void>
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currency:            'CAD',
      rates:               { CAD: 1 },
      ratesFetchedAt:      0,
      hasManuallySelected: false,

      setCurrency: (currency) => set({ currency, hasManuallySelected: true }),

      ensureRates: async () => {
        const now   = Date.now()
        const stale = now - get().ratesFetchedAt > 3_600_000  // 1 hour
        if (!stale && get().rates.USD) return
        const rates = await fetchExchangeRates()
        set({ rates, ratesFetchedAt: now })
      },

      // Called on first page load — only switches currency if user hasn't manually chosen one
      autoDetect: async () => {
        if (get().hasManuallySelected) return
        try {
          const res  = await fetch('/api/detect-currency')
          const data = await res.json()
          if (data.currency && data.currency !== get().currency) {
            set({ currency: data.currency as CurrencyCode })
          }
        } catch {
          // silently fall back to CAD default
        }
      },
    }),
    {
      name:       'acme-currency',
      partialize: (s) => ({
        currency:            s.currency,
        hasManuallySelected: s.hasManuallySelected,
      }),
    }
  )
)
