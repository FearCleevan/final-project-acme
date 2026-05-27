'use client'

import { useState } from 'react'
import { BiChevronUp, BiChevronDown } from 'react-icons/bi'
import { cn } from '@/lib/utils'
import EmptyState from './EmptyState'
import Spinner from './Spinner'

export interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  className?: string
  render?: (row: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyField: keyof T
  onRowClick?: (row: T) => void
  selectable?: boolean
  selectedIds?: Set<string>
  onSelectChange?: (ids: Set<string>) => void
  emptyMessage?: string
  emptyDescription?: string
  loading?: boolean
  className?: string
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  onRowClick,
  selectable,
  selectedIds = new Set(),
  onSelectChange,
  emptyMessage,
  emptyDescription,
  loading,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey]   = useState<string | null>(null)
  const [sortDir, setSortDir]   = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = a[sortKey as keyof T]
        const bv = b[sortKey as keyof T]
        if (av == null) return 1
        if (bv == null) return -1
        const cmp = av < bv ? -1 : av > bv ? 1 : 0
        return sortDir === 'asc' ? cmp : -cmp
      })
    : data

  const allIds    = data.map(r => String(r[keyField]))
  const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id))
  const someSelected = !allSelected && allIds.some(id => selectedIds.has(id))

  const toggleAll = () => {
    if (!onSelectChange) return
    if (allSelected) {
      onSelectChange(new Set())
    } else {
      onSelectChange(new Set(allIds))
    }
  }

  const toggleRow = (id: string) => {
    if (!onSelectChange) return
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectChange(next)
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-(--admin-border)">
            {selectable && (
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected }}
                  onChange={toggleAll}
                  className="w-3.5 h-3.5 rounded border-(--admin-border) accent-(--admin-accent) cursor-pointer"
                />
              </th>
            )}
            {columns.map(col => (
              <th
                key={String(col.key)}
                className={cn(
                  'px-4 py-3 text-[11px] uppercase tracking-wider text-(--admin-text-muted) whitespace-nowrap',
                  col.sortable && 'cursor-pointer select-none hover:text-(--admin-text-soft) transition-colors',
                  col.className
                )}
                onClick={col.sortable ? () => handleSort(String(col.key)) : undefined}
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && (
                    <span className="flex flex-col">
                      <BiChevronUp
                        size={10}
                        className={sortKey === col.key && sortDir === 'asc' ? 'text-(--admin-text)' : 'opacity-30'}
                      />
                      <BiChevronDown
                        size={10}
                        className={cn('-mt-1', sortKey === col.key && sortDir === 'desc' ? 'text-(--admin-text)' : 'opacity-30')}
                      />
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="py-16 text-center">
                <div className="flex justify-center"><Spinner className="w-5 h-5" /></div>
              </td>
            </tr>
          ) : sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)}>
                <EmptyState message={emptyMessage} description={emptyDescription} />
              </td>
            </tr>
          ) : (
            sorted.map(row => {
              const id       = String(row[keyField])
              const selected = selectedIds.has(id)
              return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-(--admin-border) transition-colors',
                    onRowClick && 'cursor-pointer',
                    selected
                      ? 'bg-(--admin-surface-2)'
                      : onRowClick && 'hover:bg-(--admin-surface-2)'
                  )}
                >
                  {selectable && (
                    <td className="w-10 px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleRow(id)}
                        className="w-3.5 h-3.5 rounded border-(--admin-border) accent-(--admin-accent) cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map(col => (
                    <td
                      key={String(col.key)}
                      className={cn(
                        'px-4 py-3 text-[13px] text-(--admin-text) whitespace-nowrap',
                        col.className
                      )}
                    >
                      {col.render
                        ? col.render(row)
                        : String(row[col.key as keyof T] ?? '—')
                      }
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
