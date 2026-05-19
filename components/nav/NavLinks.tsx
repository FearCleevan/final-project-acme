'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const links = [
  { label: 'Storefront', href: '/' },
  { label: 'The Catalog', href: '/catalog' },
  { label: 'Our Story', href: '/our-story' },
  { label: 'Heritage', href: '/heritage' },
  { label: 'Contact', href: '/contact' },
]

interface NavLinksProps {
  onNavigate?: () => void
}

export default function NavLinks({ onNavigate }: NavLinksProps) {
  const pathname = usePathname()

  return (
    <>
      {links.map(({ label, href }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              'relative font-sans text-[15px] font-medium text-ink-iron transition-colors hover:text-brass-deep',
              'after:absolute after:bottom-[-3px] after:left-0 after:h-[2px] after:bg-brass after:transition-transform after:duration-200 after:origin-left',
              active
                ? 'text-brass-deep after:w-full after:scale-x-100'
                : 'after:w-full after:scale-x-0 hover:after:scale-x-100'
            )}
          >
            {label}
          </Link>
        )
      })}
    </>
  )
}
