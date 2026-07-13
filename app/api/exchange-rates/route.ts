import { NextResponse } from 'next/server'
import type { ExchangeRates } from '@/lib/currency'

// Server-side proxy for Frankfurter's exchange-rate API. This must not be
// called directly from the browser — Frankfurter does not return an
// Access-Control-Allow-Origin header, so a client-side fetch is blocked by
// CORS. Server-to-server requests are never subject to CORS, so proxying
// through this route is the fix rather than a workaround.
export async function GET() {
  try {
    const res = await fetch(
      'https://api.frankfurter.app/latest?from=CAD&to=USD,EUR,GBP',
      { cache: 'no-store' }
    )
    if (!res.ok) throw new Error('Frankfurter request failed')
    const data = await res.json()
    const rates: ExchangeRates = { CAD: 1, ...data.rates }
    return NextResponse.json(rates)
  } catch {
    // Approximate fallback rates — only used if Frankfurter is down
    const rates: ExchangeRates = { CAD: 1, USD: 0.74, EUR: 0.68, GBP: 0.58 }
    return NextResponse.json(rates)
  }
}
