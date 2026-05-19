'use client'

import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Product } from '@/lib/types'
import ProductCard from './ProductCard'

interface ProductGridProps {
  products: Product[]
}

/* Varied, non-repeating-block sequence — 12-beat cycle that avoids any run of 3 identical ratios */
const ASPECT_SEQ: Array<'4/5' | '5/4' | '3/5' | '1/1'> = [
  '3/5', '4/5', '5/4',
  '4/5', '3/5', '4/5',
  '5/4', '3/5', '4/5',
  '3/5', '5/4', '4/5',
]

/* Every 5th card gets the large treatment (slightly bigger title) */
function isLarge(i: number) { return i % 5 === 4 }

const ProductGrid = memo(function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-24 text-center px-6">
        <p className="font-serif italic text-[22px] text-ink-soft max-w-[44ch] mx-auto leading-relaxed">
          Nothing in the catalog matches those filters. Try broadening your search.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10 items-start">
      <AnimatePresence mode="popLayout">
        {products.map((product, i) => (
          <motion.div
            key={product.id}
            layout="position"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.22, delay: Math.min(i * 0.025, 0.18) }}
          >
            <ProductCard
              product={product}
              aspectRatio={ASPECT_SEQ[i % ASPECT_SEQ.length]}
              large={isLarge(i)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
})

export default ProductGrid
