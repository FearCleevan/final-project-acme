import { mockTopProducts } from '@/lib/admin/mockData'
import { formatCurrency } from '@/lib/admin/utils'

export default function TopProductsTable() {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-(--admin-text-muted) mb-3">
        Top Products
      </p>
      <div className="space-y-0">
        {mockTopProducts.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center gap-3 py-2.5 border-b border-(--admin-border) last:border-0"
          >
            <span className="text-[11px] text-(--admin-text-muted) w-4 shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-(--admin-text) truncate">{p.title}</p>
              <p className="text-[10px] text-(--admin-text-muted) mt-0.5">{p.sku} · {p.collection}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[12px] font-semibold text-(--admin-text)">{formatCurrency(p.revenue)}</p>
              <p className="text-[10px] text-(--admin-text-muted) mt-0.5">{p.unitsSold} sold</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
