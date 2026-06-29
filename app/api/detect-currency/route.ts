import { NextRequest, NextResponse } from 'next/server'
import { CurrencyCode } from '@/lib/currency'

// Eurozone country codes (ISO 3166-1 alpha-2)
const EUROZONE = new Set([
  'AT','BE','CY','EE','FI','FR','DE','GR','IE','IT',
  'LV','LT','LU','MT','NL','PT','SK','SI','ES',
])

function countryToCurrency(country: string | null): CurrencyCode {
  if (!country) return 'CAD'
  if (country === 'US')           return 'USD'
  if (country === 'GB')           return 'GBP'
  if (EUROZONE.has(country))      return 'EUR'
  return 'CAD'
}

export async function GET(req: NextRequest) {
  const country  = req.headers.get('x-vercel-ip-country')
  const currency = countryToCurrency(country)
  return NextResponse.json({ currency, country })
}
