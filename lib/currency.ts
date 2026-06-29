export type CurrencyCode = 'CAD' | 'USD' | 'EUR' | 'GBP'

export interface CurrencyConfig {
  code:    CurrencyCode
  country: string   // ISO 3166-1 alpha-2 — used for Shopify buyerIdentity.countryCode
  symbol:  string
  label:   string
  flag:    string
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  CAD: { code: 'CAD', country: 'CA', symbol: 'CA$', label: 'CAD', flag: '🇨🇦' },
  USD: { code: 'USD', country: 'US', symbol: 'US$', label: 'USD', flag: '🇺🇸' },
  EUR: { code: 'EUR', country: 'DE', symbol: '€',   label: 'EUR', flag: '🇪🇺' },
  GBP: { code: 'GBP', country: 'GB', symbol: '£',   label: 'GBP', flag: '🇬🇧' },
}

export type ExchangeRates = { CAD: 1 } & Partial<Record<CurrencyCode, number>>

export function formatCurrencyPrice(
  amountCAD: number,
  currency: CurrencyCode,
  rates: ExchangeRates
): string {
  const rate      = (rates[currency] as number | undefined) ?? 1
  const converted = amountCAD * rate
  return new Intl.NumberFormat('en-CA', {
    style:                 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted)
}

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  try {
    const res = await fetch(
      'https://api.frankfurter.app/latest?from=CAD&to=USD,EUR,GBP',
      { cache: 'no-store' }
    )
    if (!res.ok) throw new Error('fetch failed')
    const data = await res.json()
    return { CAD: 1, ...data.rates } as ExchangeRates
  } catch {
    // Approximate fallback rates — only used if frankfurter is down
    return { CAD: 1, USD: 0.74, EUR: 0.68, GBP: 0.58 }
  }
}
