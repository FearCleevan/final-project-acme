import { cn } from '@/lib/utils'

interface SectionCardProps {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}

export default function SectionCard({ children, className, noPadding }: SectionCardProps) {
  return (
    <div
      className={cn(
        'bg-(--admin-surface) border border-(--admin-border) rounded-lg',
        !noPadding && 'p-5',
        className
      )}
    >
      {children}
    </div>
  )
}
