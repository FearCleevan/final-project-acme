import { Product } from '@/lib/types'

function realProductId(product: Product): string {
  return product.id.replace(/^sp-/, '')
}

function realVariantId(product: Product): string | null {
  return product.variantId ? product.variantId.split('/').pop()! : null
}

export function trackCartActivity(email: string, product: Product, quantity: number): void {
  fetch('/api/cart-activity', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerEmail: email,
      productId:     realProductId(product),
      productTitle:  product.name,
      variantId:     realVariantId(product),
      quantity,
    }),
  }).catch(err => console.warn('[cartActivityClient] track failed:', err))
}

export function untrackCartActivity(email: string, product: Product): void {
  fetch('/api/cart-activity', {
    method:  'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerEmail: email,
      productId:     realProductId(product),
    }),
  }).catch(err => console.warn('[cartActivityClient] untrack failed:', err))
}
