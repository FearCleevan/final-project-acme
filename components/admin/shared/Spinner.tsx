import { cn } from '@/lib/utils'

export default function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-4 h-4 rounded-full border-2 border-(--admin-border) border-t-(--admin-text-soft) animate-spin',
        className
      )}
      aria-label="Loading"
    />
  )
}
