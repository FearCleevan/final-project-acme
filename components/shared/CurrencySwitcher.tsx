'use client'

import { useEffect, useRef, useState } from 'react'
import { BiChevronDown } from 'react-icons/bi'
import { useCurrencyStore } from '@/store/currencyStore'
import { useCrateStore } from '@/store/crateStore'
import { CURRENCIES, CurrencyCode } from '@/lib/currency'

const OPTIONS: CurrencyCode[] = ['CAD', 'USD', 'EUR', 'GBP']

export default function CurrencySwitcher() {
  const { currency, setCurrency, ensureRates, autoDetect } = useCurrencyStore()
  const updateCartCurrency = useCrateStore(s => s.updateCartCurrency)
  const [open, setOpen]     = useState(false)
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    ensureRates()
    autoDetect()
  }, [ensureRates, autoDetect])

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const handleSelect = async (code: CurrencyCode) => {
    setCurrency(code)
    setOpen(false)
    await updateCartCurrency(code)
  }

  if (!mounted) return null   // avoid hydration mismatch from persisted currency

  const current = CURRENCIES[currency]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Switch currency"
        aria-expanded={open}
        className="flex items-center gap-1 h-8 px-2 text-[12px] font-mono text-ink-iron hover:text-ink-charcoal hover:bg-parchment-2 rounded-md transition-colors"
      >
        <span aria-hidden="true">{current.flag}</span>
        <span>{current.label}</span>
        <BiChevronDown
          size={11}
          className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 bg-parchment border border-ink-rule rounded-sm shadow-[0_4px_20px_rgba(30,32,34,0.10)] py-1 z-50 min-w-[100px]">
          {OPTIONS.map(code => {
            const c = CURRENCIES[code]
            return (
              <button
                key={code}
                onClick={() => handleSelect(code)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-[12px] font-mono text-left transition-colors ${
                  currency === code
                    ? 'text-brass-deep bg-parchment-2 font-medium'
                    : 'text-ink-iron hover:text-ink-charcoal hover:bg-parchment-2'
                }`}
              >
                <span aria-hidden="true">{c.flag}</span>
                <span>{c.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
