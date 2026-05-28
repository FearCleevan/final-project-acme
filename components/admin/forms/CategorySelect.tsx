'use client'

import { useState, useEffect, useRef } from 'react'
import { BiX, BiSearch } from 'react-icons/bi'

interface TaxonomyCategory {
  id: string
  name: string
  fullName: string
  level: number
  isLeaf: boolean
}

interface Props {
  value: { id: string; name: string } | null
  onChange: (category: { id: string; name: string } | null) => void
}

const inputCls = 'w-full h-9 px-3 text-[13px] text-(--admin-text) bg-(--admin-surface-2) border border-(--admin-border) rounded-md focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/20 placeholder:text-(--admin-text-muted) transition-colors'

export default function CategorySelect({ value, onChange }: Props) {
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState<TaxonomyCategory[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true)
      fetch(`/api/admin/taxonomy?q=${encodeURIComponent(query)}`)
        .then(r => r.ok ? r.json() : [])
        .then((data: TaxonomyCategory[]) => { setResults(data); setLoading(false) })
        .catch(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  function select(cat: TaxonomyCategory) {
    onChange({ id: cat.id, name: cat.fullName })
    setOpen(false)
    setQuery('')
  }

  return (
    <div ref={ref} className="relative">
      {value ? (
        <div className="flex items-center gap-2 h-9 px-3 bg-(--admin-surface-2) border border-(--admin-border) rounded-md">
          <span className="flex-1 text-[13px] text-(--admin-text) truncate">{value.name}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
          >
            <BiX size={15} />
          </button>
        </div>
      ) : (
        <div className="relative">
          <BiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-(--admin-text-muted) pointer-events-none" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Search Shopify categories…"
            className={`${inputCls} pl-8`}
          />
        </div>
      )}

      {open && !value && (
        <div
          className="absolute z-20 left-0 right-0 mt-1 rounded-md border border-(--admin-border) shadow-lg max-h-56 overflow-y-auto"
          style={{ background: 'var(--admin-surface)' }}
        >
          {loading ? (
            <p className="px-3 py-2.5 text-[12px] text-(--admin-text-muted)">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2.5 text-[12px] text-(--admin-text-muted)">No categories found</p>
          ) : results.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => select(cat)}
              className="w-full text-left px-3 py-2 hover:bg-(--admin-surface-2) transition-colors"
            >
              <p className="text-[12px] text-(--admin-text) leading-snug">{cat.fullName}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
