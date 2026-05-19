import { cn } from '@/lib/utils'

interface EyebrowProps {
  children: React.ReactNode
  light?: boolean
  className?: string
}

export default function Eyebrow({ children, light = false, className }: EyebrowProps) {
  return (
    <p
      className={cn(
        'eyebrow',
        light ? 'text-brass' : 'text-brass-deep',
        className
      )}
    >
      {children}
    </p>
  )
}
