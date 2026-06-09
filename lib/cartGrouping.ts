// lib/cartGrouping.ts
import { CrateItem } from '@/lib/types'

export const COLOUR_HEX: Record<string, string> = {
  'Red':           '#D50000',
  'Orange':        '#FF6D00',
  'Yellow':        '#FFD600',
  'Green':         '#00C853',
  'Blue':          '#2962FF',
  'Powder Blue':   '#8AB4C6',
  'Pink':          '#F48FB1',
  'Peach':         '#FFAB91',
  'Magenta':       '#CC00CC',
  'Brown':         '#795548',
  'Gold':          '#FFC107',
  'Silver':        '#9E9E9E',
  'Amber':         '#FF8F00',
  'Clear':         '#E8E8E8',
  'White':         '#FFFFFF',
  'Black':         '#1A1A1A',
  'Emerald':       '#2D7A47',
  'Emerald Green': '#2D7A47',
  'Ruby':          '#8B1A1A',
  'Ruby Red':      '#8B1A1A',
}

export type CartEntry =
  | { isGroup: false; item: CrateItem }
  | { isGroup: true;  name: string; image: string; items: CrateItem[] }

/**
 * Splits a flat cart item list into display entries.
 * Items with a variantId are collapsed into named groups (one group per product name).
 * Items without a variantId appear as flat entries, preserving add order.
 */
export function groupCartItems(items: CrateItem[]): CartEntry[] {
  const result: CartEntry[] = []
  const groupIndex = new Map<string, number>() // product name → index in result

  for (const item of items) {
    if (item.product.variantId) {
      const key = item.product.name
      const idx = groupIndex.get(key)
      if (idx !== undefined) {
        ;(result[idx] as Extract<CartEntry, { isGroup: true }>).items.push(item)
      } else {
        groupIndex.set(key, result.length)
        result.push({
          isGroup: true,
          name:    item.product.name,
          image:   item.product.images[0] ?? '',
          items:   [item],
        })
      }
    } else {
      result.push({ isGroup: false, item })
    }
  }

  return result
}

export function getColourHex(colour: string): string {
  if (COLOUR_HEX[colour]) return COLOUR_HEX[colour]
  const lower = colour.toLowerCase()
  for (const [key, hex] of Object.entries(COLOUR_HEX)) {
    if (key.toLowerCase() === lower) return hex
  }
  return '#ccc'
}
