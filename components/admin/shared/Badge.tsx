import { cn } from '@/lib/utils'

export type BadgeVariant = 'green' | 'amber' | 'red' | 'neutral' | 'blue'

interface BadgeProps {
  label: string
  variant: BadgeVariant
  className?: string
}

const styles: Record<BadgeVariant, string> = {
  green:   'bg-(--admin-green-bg) text-(--admin-green) border-(--admin-green)/20',
  amber:   'bg-(--admin-amber-bg) text-(--admin-amber) border-(--admin-amber)/20',
  red:     'bg-(--admin-red-bg) text-(--admin-red) border-(--admin-red)/20',
  neutral: 'bg-(--admin-surface-2) text-(--admin-text-soft) border-(--admin-border)',
  blue:    'bg-(--admin-surface-2) text-(--admin-text-soft) border-(--admin-border)',
}

export function orderStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'fulfilled':  return 'green'
    case 'unfulfilled':return 'amber'
    case 'cancelled':  return 'red'
    case 'refunded':   return 'neutral'
    default:           return 'neutral'
  }
}

export function paymentStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'paid':           return 'green'
    case 'pending':        return 'amber'
    case 'refunded':       return 'neutral'
    case 'partially_paid': return 'amber'
    default:               return 'neutral'
  }
}

export function productStatusVariant(status: string): BadgeVariant {
  return status === 'active' ? 'green' : 'neutral'
}

export default function Badge({ label, variant, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border capitalize',
        styles[variant],
        className
      )}
    >
      {label}
    </span>
  )
}
