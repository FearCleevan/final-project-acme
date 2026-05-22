import Image from 'next/image'
import { cn } from '@/lib/utils'

type AspectRatio = '4/5' | '5/4' | '3/5' | '1/1'

interface PlateImageProps {
  src?: string
  alt: string
  aspectRatio?: AspectRatio
  dark?: boolean
  label?: string
  className?: string
  priority?: boolean
  objectFit?: 'contain' | 'cover'
}

const aspectClasses: Record<AspectRatio, string> = {
  '4/5': 'aspect-[4/5]',
  '5/4': 'aspect-[5/4]',
  '3/5': 'aspect-[3/5]',
  '1/1': 'aspect-square',
}

export default function PlateImage({
  src,
  alt,
  aspectRatio = '4/5',
  dark = false,
  label,
  className,
  priority = false,
  objectFit = 'contain',
}: PlateImageProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden',
        aspectClasses[aspectRatio],
        !src && (dark ? 'plate--dark' : 'plate'),
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className={objectFit === 'cover' ? 'object-cover' : 'object-contain p-3'}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          style={{ willChange: 'transform' }}
        />
      ) : (
        /* Decorative cross-hatch already applied via .plate class */
        <div className="absolute inset-0" aria-hidden="true" />
      )}

      {label && (
        <div className="absolute bottom-0 left-0 px-2 py-1 bg-parchment/80 backdrop-blur-sm">
          <span className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft whitespace-nowrap">
            {label}
          </span>
        </div>
      )}
    </div>
  )
}
