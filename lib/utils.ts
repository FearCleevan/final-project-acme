import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const slugify = (str: string) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
