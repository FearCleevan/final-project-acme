'use client'

import { useCurrencyStore } from '@/store/currencyStore'
import { formatCurrencyPrice } from '@/lib/currency'

interface CurrencyPriceProps {
  amount:    number
  className?: string
}

export default function CurrencyPrice({ amount, className }: CurrencyPriceProps) {
  const { currency, rates } = useCurrencyStore()
  const formatted = formatCurrencyPrice(amount, currency, rates)
  return <span className={className}>{formatted}</span>
}
