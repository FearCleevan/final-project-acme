import { Product } from '@/lib/types'

function realProductId(product: Product): string {
  const match = product.id.match(/^sp-(\d+)/)
  return match ? match[1] : product.id.replace(/^sp-/, '')
}

function realVariantId(product: Product): string | null {
  return product.variantId ? product.variantId.split('/').pop()! : null
}

export function trackCartActivity(email: string | null, product: Product, quantity: number): void {
  fetch('/api/cart-activity', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerEmail: email, // may be null for guests — API falls back to the visitor-id cookie
      productId:     realProductId(product),
      productTitle:  product.name,
      variantId:     realVariantId(product),
      quantity,
    }),
  }).catch(err => console.warn('[cartActivityClient] track failed:', err))
}

export function untrackCartActivity(email: string | null, product: Product): void {
  fetch('/api/cart-activity', {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerEmail: email,
      productId:     realProductId(product),
    }),
  }).catch(err => console.warn('[cartActivityClient] untrack failed:', err))
}
