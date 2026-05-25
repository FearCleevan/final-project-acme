'use client'

import { useState } from 'react'
import PlateImage from '@/components/shared/PlateImage'
import { cn } from '@/lib/utils'

interface ProductGalleryProps {
  images: string[]
  productName: string
  sku: string
  dark?: boolean
}

export default function ProductGallery({ images, productName, sku, dark = false }: ProductGalleryProps) {
  const slots = images.slice(0, 4)
  const [active, setActive] = useState(0)

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div className="relative">
        <div className="absolute top-3 right-3 z-10 pointer-events-none">
          <span className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft bg-parchment/80 backdrop-blur-sm px-2 py-1 rounded-sm">
            Hover or tap to zoom
          </span>
        </div>

        <div className="overflow-hidden rounded-sm group/main cursor-zoom-in">
          <PlateImage
            src={slots[active] || undefined}
            alt={`${productName} — view ${active + 1}`}
            aspectRatio="4/5"
            dark={dark}
            label={`${sku} · View ${String(active + 1).padStart(2, '0')}`}
            priority
            className="transition-transform duration-500 ease-out group-hover/main:scale-[1.04]"
          />
          {/* Hover depth vignette */}
          <div className="absolute inset-0 opacity-0 group-hover/main:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(30,32,34,0.2) 100%)' }}
          />
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="grid grid-cols-4 gap-2" role="group" aria-label="Product image thumbnails">
        {slots.map((src, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={cn(
              'relative overflow-hidden rounded-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass',
              active === i
                ? 'ring-2 ring-brass-deep ring-offset-1'
                : 'opacity-60 hover:opacity-100'
            )}
            aria-label={`View image ${i + 1}`}
            aria-pressed={active === i}
          >
            <PlateImage
              src={src || undefined}
              alt={`${productName} thumbnail ${i + 1}`}
              aspectRatio="4/5"
              dark={dark}
              label={`0${i + 1}`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
