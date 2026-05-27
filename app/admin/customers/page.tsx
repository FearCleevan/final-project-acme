'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { mockCustomers } from '@/lib/admin/mockData'
import { AdminCustomer } from '@/lib/admin/types'
import { formatCurrency, formatDate } from '@/lib/admin/utils'
import PageHeader from '@/components/admin/shared/PageHeader'
import SectionCard from '@/components/admin/shared/SectionCard'
import SearchInput from '@/components/admin/shared/SearchInput'
import Pagination from '@/components/admin/shared/Pagination'
import { BiExport, BiUser } from 'react-icons/bi'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

const CSV_HEADERS = [
  'Name', 'Email', 'Phone', 'Address', 'City', 'Province', 'Country',
  'Orders', 'Total Spent', 'Joined',
]

function escapeCSV(val: unknown): string {
  const s = (val == null ? '' : String(val)).replace(/^[=+\-@\t\r]/, "'$&")
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"` : s
}

function exportCustomersCSV(customers: AdminCustomer[]) {
  const rows = customers.map(c => [
    c.name, c.email, c.phone,
    c.address, c.city, c.province, c.country,
    c.orders, c.totalSpent.toFixed(2), c.joined,
  ].map(escapeCSV).join(','))
  const csv  = [CSV_HEADERS.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement('a'), {
    href: url,
    download: `customers-${new Date().toISOString().slice(0, 10)}.csv`,
  })
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

export default function CustomersPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [page,   setPage]   = useState(1)

  const filtered = useMemo(() => {
    if (!search.trim()) return mockCustomers
    const q = search.toLowerCase()
    return mockCustomers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q)
    )
  }, [search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalRevenue = mockCustomers.reduce((s, c) => s + c.totalSpent, 0)

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${mockCustomers.length} customers`}
        actions={
          <button
            onClick={() => exportCustomersCSV(filtered)}
            className="flex items-center gap-1.5 h-8 px-3 text-[12px] text-(--admin-text-soft) bg-(--admin-surface-2) border border-(--admin-border) rounded-md hover:bg-(--admin-border) transition-colors"
          >
            <BiExport size={13} /> <span className="hidden sm:inline">Export CSV</span>
          </button>
        }
      />

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        {[
          { label: 'Total Customers', value: mockCustomers.length },
          { label: 'Lifetime Revenue', value: formatCurrency(totalRevenue) },
          { label: 'Avg. Order Value', value: formatCurrency(totalRevenue / mockCustomers.reduce((s, c) => s + c.orders, 0)) },
          { label: 'Repeat Customers', value: mockCustomers.filter(c => c.orders > 1).length },
        ].map(stat => (
          <SectionCard key={stat.label} className="py-3 px-4">
            <p className="text-[11px] font-medium uppercase tracking-wider text-(--admin-text-muted) mb-1">{stat.label}</p>
            <p className="text-[20px] font-semibold text-(--admin-text) leading-none">{stat.value}</p>
          </SectionCard>
        ))}
      </div>

      <SectionCard noPadding>
        {/* Search */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-(--admin-border)">
          <SearchInput
            value={search}
            onChange={v => { setSearch(v); setPage(1) }}
            placeholder="Search name, email or city…"
            className="w-full sm:w-72"
          />
          <p className="ml-auto text-[12px] text-(--admin-text-muted) shrink-0">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Mobile card list */}
        <div className="sm:hidden divide-y divide-(--admin-border)">
          {paginated.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <BiUser size={28} className="mx-auto text-(--admin-border) mb-2" />
              <p className="text-[13px] text-(--admin-text-soft)">No customers found</p>
              <p className="text-[11px] text-(--admin-text-muted) mt-1">Try adjusting your search.</p>
            </div>
          ) : paginated.map(c => (
            <div
              key={c.id}
              onClick={() => router.push(`/admin/customers/${c.id}`)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-(--admin-surface-2) cursor-pointer transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-(--admin-surface-2) border border-(--admin-border) flex items-center justify-center shrink-0">
                <span className="text-[12px] font-semibold text-(--admin-text-muted)">
                  {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-medium text-(--admin-text) truncate">{c.name}</p>
                  <span className={cn(
                    'text-[13px] font-semibold shrink-0',
                    c.totalSpent > 0 ? 'text-(--admin-text)' : 'text-(--admin-text-muted)'
                  )}>
                    {c.totalSpent > 0 ? formatCurrency(c.totalSpent) : '—'}
                  </span>
                </div>
                <p className="text-[11px] text-(--admin-text-muted) truncate">{c.email}</p>
                <p className="text-[11px] text-(--admin-text-muted) mt-0.5">
                  {c.city}, {c.province} · {c.orders} order{c.orders !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-(--admin-border)">
                {['Customer', 'Location', 'Orders', 'Total Spent', 'Joined'].map(h => (
                  <th key={h} className="px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-(--admin-text-muted) whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <BiUser size={28} className="mx-auto text-(--admin-border) mb-2" />
                    <p className="text-[13px] text-(--admin-text-soft)">No customers found</p>
                    <p className="text-[11px] text-(--admin-text-muted) mt-1">Try adjusting your search.</p>
                  </td>
                </tr>
              ) : paginated.map(c => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/admin/customers/${c.id}`)}
                  className="border-b border-(--admin-border) last:border-0 hover:bg-(--admin-surface-2) cursor-pointer transition-colors"
                >
                  {/* Customer */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-(--admin-surface-2) border border-(--admin-border) flex items-center justify-center shrink-0">
                        <span className="text-[12px] font-semibold text-(--admin-text-muted)">
                          {c.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-(--admin-text)">{c.name}</p>
                        <p className="text-[11px] text-(--admin-text-muted)">{c.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-5 py-3">
                    <p className="text-[13px] text-(--admin-text-soft)">{c.city}, {c.province}</p>
                    <p className="text-[11px] text-(--admin-text-muted)">{c.country}</p>
                  </td>

                  {/* Orders */}
                  <td className="px-5 py-3">
                    <span className={cn(
                      'text-[13px] font-semibold',
                      c.orders > 1 ? 'text-(--admin-text)' : 'text-(--admin-text-soft)'
                    )}>
                      {c.orders}
                    </span>
                  </td>

                  {/* Total Spent */}
                  <td className="px-5 py-3">
                    <span className={cn(
                      'text-[13px] font-semibold',
                      c.totalSpent > 0 ? 'text-(--admin-text)' : 'text-(--admin-text-muted)'
                    )}>
                      {c.totalSpent > 0 ? formatCurrency(c.totalSpent) : '—'}
                    </span>
                  </td>

                  {/* Joined */}
                  <td className="px-5 py-3">
                    <span className="text-[12px] text-(--admin-text-muted)">{formatDate(c.joined)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 pb-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      </SectionCard>
    </div>
  )
}
