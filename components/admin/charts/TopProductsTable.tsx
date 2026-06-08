import { formatCurrency } from '@/lib/admin/utils'

interface TopProduct {
  title: string
  revenue: number
  unitsSold: number
}

export default function TopProductsTable({ products }: { products: TopProduct[] }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-(--admin-text-muted) mb-3">
        Top Products
      </p>
      {products.length === 0 ? (
        <p className="text-[12px] text-(--admin-text-soft)">No sales data yet.</p>
      ) : (
        <div className="space-y-0">
          {products.map((p, i) => (
            <div
              key={p.title}
              className="flex items-center gap-3 py-2.5 border-b border-(--admin-border) last:border-0"
            >
              <span className="text-[11px] text-(--admin-text-muted) w-4 shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-(--admin-text) truncate">{p.title}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[12px] font-semibold text-(--admin-text)">{formatCurrency(p.revenue)}</p>
                <p className="text-[10px] text-(--admin-text-muted) mt-0.5">{p.unitsSold} sold</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
