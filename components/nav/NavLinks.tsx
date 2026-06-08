'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const CATALOG_DROPS = [
  { label: 'Oil Lamp Chimneys',    href: '/catalog?category=oil-lamp-chimneys' },
  { label: 'Oil Lamp Shades',      href: '/catalog?category=oil-lamp-shades' },
  { label: 'Pressure Lamps',       href: '/catalog?category=oil-lamp-pressure-lamps' },
  { label: 'Spreaders & Hardware', href: '/catalog?category=oil-lamp-spreaders' },
  { label: 'Wicks',                href: '/catalog?category=oil-lamp-wicks' },
  { label: 'Books & Guides',       href: '/catalog?category=oil-lamp-books' },
  { label: 'Signs',                href: '/catalog?category=signs' },
]

const WORKSHOP_DROPS = [
  { label: 'Our Story',         href: '/our-story' },
  { label: 'Heritage Timeline', href: '/heritage' },
  { label: 'Bench Notes',       href: '/journal' },
]

const baseLinkClass =
  'relative font-sans text-[15px] font-medium text-ink-iron transition-colors hover:text-brass-deep ' +
  'after:absolute after:bottom-[-3px] after:left-0 after:h-[2px] after:bg-brass ' +
  'after:transition-transform after:duration-200 after:origin-left after:w-full'

const dropItemClass =
  'block w-full text-left px-4 py-2 text-[14px] font-sans text-ink-soft ' +
  'hover:text-ink-charcoal hover:bg-parchment-2 transition-colors'

const dropPanelClass =
  'absolute top-full left-0 pt-2 hidden group-hover:block group-focus-within:block z-50'

const dropBoxClass =
  'bg-parchment border border-ink-rule shadow-[0_4px_20px_rgba(30,32,34,0.10)] rounded-sm py-1.5 min-w-[210px]'

interface NavLinksProps {
  onNavigate?: () => void
}

export default function NavLinks({ onNavigate }: NavLinksProps) {
  const pathname = usePathname()
  const active = (href: string) =>
    href === '/' ? pathname === href : pathname.startsWith(href.split('?')[0])

  return (
    <>
      {/* Storefront */}
      <Link
        href="/"
        onClick={onNavigate}
        className={cn(baseLinkClass, active('/') ? 'text-brass-deep after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100')}
      >
        Storefront
      </Link>

      {/* Catalog dropdown */}
      <div className="relative group">
        <Link
          href="/catalog"
          onClick={onNavigate}
          className={cn(
            baseLinkClass,
            'inline-flex items-center gap-1',
            active('/catalog') ? 'text-brass-deep after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'
          )}
        >
          Catalog
          <span className="text-[9px] leading-none group-hover:translate-y-px transition-transform">▾</span>
        </Link>
        <div className={dropPanelClass}>
          <div className={dropBoxClass}>
            {CATALOG_DROPS.map(l => (
              <Link key={l.href} href={l.href} onClick={onNavigate} className={dropItemClass}>
                {l.label}
              </Link>
            ))}
            <div className="border-t border-ink-rule my-1" />
            <Link
              href="/catalog"
              onClick={onNavigate}
              className="block px-4 py-2 text-[13px] font-sans font-semibold text-brass-deep hover:text-brass transition-colors"
            >
              View Full Catalog →
            </Link>
          </div>
        </div>
      </div>

      {/* Signs — direct link */}
      <Link
        href="/signs"
        onClick={onNavigate}
        className={cn(baseLinkClass, active('/signs') ? 'text-brass-deep after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100')}
      >
        Signs
      </Link>

      {/* The Workshop dropdown */}
      <div className="relative group">
        <button
          className={cn(
            baseLinkClass,
            'inline-flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0',
            (active('/our-story') || active('/heritage') || active('/journal'))
              ? 'text-brass-deep after:scale-x-100'
              : 'after:scale-x-0 hover:after:scale-x-100'
          )}
        >
          The Workshop
          <span className="text-[9px] leading-none group-hover:translate-y-px transition-transform">▾</span>
        </button>
        <div className={dropPanelClass}>
          <div className={dropBoxClass}>
            {WORKSHOP_DROPS.map(l => (
              <Link key={l.href} href={l.href} onClick={onNavigate} className={dropItemClass}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Contact */}
      <Link
        href="/contact"
        onClick={onNavigate}
        className={cn(baseLinkClass, active('/contact') ? 'text-brass-deep after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100')}
      >
        Contact
      </Link>
    </>
  )
}
