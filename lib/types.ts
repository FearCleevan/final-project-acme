export interface Product {
  id: string
  slug: string
  sku: string
  patent: string
  name: string
  shortDescription: string
  fullDescription: string
  price: number
  category: 'lighting' | 'glass-chimneys' | 'hardware' | 'signs'
  // Phase B: migrate to string[] to support multi-fit products (e.g. ['No. 2', 'No. 3'])
  burnerSize: 'No. 1' | 'No. 2' | 'No. 3' | 'Universal' | null
  material: string
  finish: string[]
  fits: string
  benchTesterName: string
  benchTestDate: string
  workshop: string
  edition: string
  netWeight: string
  images: string[]
  inStock: boolean
  featured: boolean
  collection: string
}

export interface CrateItem {
  product: Product
  quantity: number
  selectedFinish: string
  selectedBurnerSize: string
}

export interface FilterState {
  category: string
  burnerSize: string
  material: string
  sortBy: 'curator' | 'price-asc' | 'price-desc' | 'newest'
}
