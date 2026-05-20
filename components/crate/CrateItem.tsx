'use client'

import { useCrateStore } from '@/store/crateStore'
import { CrateItem as CrateItemType } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import PlateImage from '@/components/shared/PlateImage'

interface CrateItemProps {
  item: CrateItemType
}

export default function CrateItem({ item }: CrateItemProps) {
  const { removeItem, updateQuantity } = useCrateStore()
  const { product, quantity, selectedFinish } = item

  return (
    <div className="flex gap-3 py-4 border-b border-ink-rule">
      <div className="shrink-0 w-15">
        <PlateImage
          src={product.images[0]}
          alt={product.name}
          aspectRatio="4/5"
          label={undefined}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono uppercase tracking-eyebrow text-brass-deep mb-0.5">
          {product.sku}
        </p>
        <p className="font-serif text-[14px] font-medium text-ink-iron leading-snug line-clamp-2">
          {product.name}
        </p>
        {selectedFinish && (
          <p className="text-[11px] text-ink-soft mt-0.5">{selectedFinish}</p>
        )}

        <div className="flex items-center justify-between mt-2">
          <p className="font-serif text-[16px] text-brass-deep">
            {formatPrice(product.price)}
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (quantity <= 1) removeItem(product.id)
                else updateQuantity(product.id, quantity - 1)
              }}
              className="w-7 h-7 flex items-center justify-center border border-ink-rule rounded-sm text-ink-iron hover:border-ink-iron text-sm font-mono transition-colors"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="w-7 text-center text-[13px] font-mono text-ink-iron tabular-nums">
              {quantity}
            </span>
            <button
              onClick={() => updateQuantity(product.id, quantity + 1)}
              disabled={quantity >= product.stockQuantity}
              className="w-7 h-7 flex items-center justify-center border border-ink-rule rounded-sm text-ink-iron hover:border-ink-iron text-sm font-mono transition-colors disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        <button
          onClick={() => removeItem(product.id)}
          className="mt-1 text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft hover:text-error transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  )
}
