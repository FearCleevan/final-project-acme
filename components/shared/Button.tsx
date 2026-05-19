'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ButtonProps {
  variant?: 'primary' | 'ghost' | 'brass'
  size?: 'default' | 'block' | 'small'
  children: React.ReactNode
  onClick?: () => void
  href?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

const base =
  'inline-flex items-center justify-center rounded-btn font-sans font-semibold tracking-[0.02em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer'

const variants = {
  primary:
    'bg-green-brand text-[#F5F1E6] hover:bg-green-deep hover:shadow-cta-hover hover:-translate-y-px active:translate-y-0',
  ghost:
    'bg-transparent border border-ink-iron text-ink-iron hover:bg-ink-iron hover:text-parchment',
  brass:
    'bg-transparent border border-brass-deep text-brass-deep hover:bg-brass hover:text-ink-iron',
}

const sizes = {
  default: 'min-h-[52px] px-[26px] text-[16px]',
  block:   'w-full min-h-[60px] px-[26px] text-[17px]',
  small:   'min-h-[44px] px-[18px] text-[14px]',
}

export default function Button({
  variant = 'primary',
  size = 'default',
  children,
  onClick,
  href,
  type = 'button',
  disabled,
  className,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className)

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel} onClick={onClick}>
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}
