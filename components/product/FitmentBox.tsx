import { BiCheck } from 'react-icons/bi'
import { Product } from '@/lib/types'

interface FitmentBoxProps {
  product: Product
}

const rows = [
  { label: 'Burner Size', key: 'burnerSize' as const },
  { label: 'Material',    key: 'material'   as const },
  { label: 'Fits',        key: 'fits'        as const },
  { label: 'Tested',      key: 'benchTestDate' as const },
]

export default function FitmentBox({ product }: FitmentBoxProps) {
  return (
    <div className="border border-ink-rule rounded-sm p-4 bg-parchment-2">
      <div className="flex items-center gap-2 mb-3">
        <BiCheck size={18} className="text-green-brand flex-shrink-0" />
        <h3 className="font-serif text-[16px] font-medium text-ink-charcoal">
          Fitment &amp; compatibility
        </h3>
      </div>

      <div className="space-y-2">
        {rows.map(({ label, key }) => {
          const value = product[key]
          if (!value) return null
          return (
            <div key={key} className="flex gap-3 items-baseline">
              <span className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft w-[90px] flex-shrink-0">
                {label}:
              </span>
              <span className="text-[13px] font-sans text-ink-iron leading-snug">
                {String(value)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
