'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SECTIONS = [
  { label: 'Home Page',        href: '/admin/content/home'    },
  { label: 'Story & Heritage', href: '/admin/content/story'   },
  { label: 'Footer Pages',     href: '/admin/content/footer'  },
]

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div>
      <nav className="flex gap-1 mb-6 border-b border-(--admin-border) pb-0">
        {SECTIONS.map(({ label, href }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={[
                'px-4 py-2 text-[13px] font-medium rounded-t-md border-b-2 -mb-px transition-colors',
                active
                  ? 'border-(--admin-accent) text-(--admin-accent)'
                  : 'border-transparent text-(--admin-text-muted) hover:text-(--admin-text)',
              ].join(' ')}
            >
              {label}
            </Link>
          )
        })}
      </nav>
      {children}
    </div>
  )
}
