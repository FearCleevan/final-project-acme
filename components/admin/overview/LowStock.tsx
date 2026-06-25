import Link from 'next/link'
import SectionCard from '@/components/admin/shared/SectionCard'
import { getAdminProducts } from '@/lib/admin/shopifyAdmin'

export default async function LowStock() {
  const products = await getAdminProducts()
  const lowStockItems = products
    .filter(p => p.stock <= 3)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6)

  return (
    <SectionCard noPadding>
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-(--admin-border)">
        <p className="text-[13px] font-semibold text-(--admin-text)">Low Stock</p>
        <Link
          href="/admin/inventory"
          className="text-[11px] text-(--admin-text-muted) hover:text-(--admin-text) transition-colors"
        >
          Manage
        </Link>
      </div>
      {lowStockItems.length === 0 ? (
        <p className="px-4 py-4 text-[12px] text-(--admin-text-soft)">All items in stock.</p>
      ) : (
        <div className="divide-y divide-(--admin-border)">
          {lowStockItems.map(p => (
            <Link
              key={p.id}
              href={`/admin/products/${p.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-(--admin-surface-2) transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[12px] text-(--admin-text) truncate">{p.title}</p>
                <p className="text-[10px] text-(--admin-text-muted) mt-0.5">{p.sku}</p>
              </div>
              <span className={`ml-3 shrink-0 text-[11px] font-semibold ${p.stock === 0 ? 'text-(--admin-red)' : 'text-(--admin-amber)'}`}>
                {p.stock === 0 ? 'Out' : `${p.stock} left`}
              </span>
            </Link>
          ))}
        </div>
      )}
    </SectionCard>
  )
}
