import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Crumb {
  label: string
  href?: string
}

interface BreadcrumbProps {
  crumbs: Crumb[]
  className?: string
}

export default function Breadcrumb({ crumbs, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-0', className)}>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={i} className="flex items-center">
            {i > 0 && (
              <span
                className="mx-2 text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft select-none"
                aria-hidden="true"
              >
                /
              </span>
            )}
            {crumb.href && !isLast ? (
              <Link
                href={crumb.href}
                className="text-[10px] font-mono uppercase tracking-eyebrow text-ink-soft hover:text-ink-iron transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'text-[10px] font-mono uppercase tracking-eyebrow',
                  isLast ? 'text-ink-iron' : 'text-ink-soft'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {crumb.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
