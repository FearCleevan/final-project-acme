import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CurrencyCode, ExchangeRates, fetchExchangeRates } from '@/lib/currency'

interface CurrencyStore {
  currency:       CurrencyCode
  rates:          ExchangeRates
  ratesFetchedAt: number
  setCurrency:    (currency: CurrencyCode) => void
  ensureRates:    () => Promise<void>
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set, get) => ({
      currency:       'CAD',
      rates:          { CAD: 1 },
      ratesFetchedAt: 0,

      setCurrency: (currency) => set({ currency }),

      ensureRates: async () => {
        const now = Date.now()
        const stale = now - get().ratesFetchedAt > 3_600_000  // 1 hour
        if (!stale && get().rates.USD) return
        const rates = await fetchExchangeRates()
        set({ rates, ratesFetchedAt: now })
      },
    }),
    {
      name:        'acme-currency',
      partialize:  (s) => ({ currency: s.currency }),  // persist currency only, refetch rates on load
    }
  )
)
