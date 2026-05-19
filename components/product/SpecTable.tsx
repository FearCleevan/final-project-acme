import { Product } from '@/lib/types'
import Eyebrow from '@/components/shared/Eyebrow'

interface SpecTableProps {
  product: Product
}

export default function SpecTable({ product }: SpecTableProps) {
  const rows: { label: string; value: string | number | null | undefined }[] = [
    { label: 'Catalog Number',       value: product.sku },
    { label: 'Burner Size',          value: product.burnerSize },
    { label: 'Workshop',             value: product.workshop },
    { label: "Bench Tester's Name",  value: product.benchTesterName },
    { label: 'Pattern of Origin',    value: product.patent },
    { label: 'Primary Material',     value: product.material },
    { label: 'Net Weight',           value: product.netWeight },
    { label: 'Edition',              value: product.edition },
  ].filter(r => r.value !== undefined && r.value !== null && r.value !== '')

  return (
    <section>
      <Eyebrow className="mb-3">Full specification</Eyebrow>
      <h2
        className="font-serif font-medium text-ink-charcoal leading-tight mb-8"
        style={{ fontSize: 'clamp(22px, 2.5vw, 36px)' }}
      >
        The numbered details.
      </h2>

      <div className="border-t border-ink-rule">
        {rows.map(({ label, value }) => (
          <div
            key={label}
            className="grid grid-cols-[180px_1fr] gap-6 py-3.5 border-b border-ink-rule items-baseline"
          >
            <span className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft">
              {label}
            </span>
            <span className="text-[14px] font-sans text-ink-iron leading-snug">
              {String(value)}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
