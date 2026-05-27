'use client'

import { useRef } from 'react'
import { BiSearch, BiX } from 'react-icons/bi'
import { cn } from '@/lib/utils'

interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export default function SearchInput({ value, onChange, placeholder = 'Search…', className }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className={cn('relative', className)}>
      <BiSearch
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-(--admin-text-muted) pointer-events-none"
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 pl-8 pr-7 bg-(--admin-surface-2) border border-(--admin-border) rounded-md text-[12px] text-(--admin-text) placeholder:text-(--admin-text-muted) focus:outline-none focus:border-(--admin-accent) focus:ring-1 focus:ring-(--admin-accent)/20 transition-colors w-full"
      />
      {value && (
        <button
          onClick={() => { onChange(''); inputRef.current?.focus() }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
          aria-label="Clear search"
        >
          <BiX size={14} />
        </button>
      )}
    </div>
  )
}
