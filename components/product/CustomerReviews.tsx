import { getReviewsForProduct, getAggregateRating } from '@/lib/mockReviews'
import { Product } from '@/lib/types'
import Eyebrow from '@/components/shared/Eyebrow'
import { BiCheck } from 'react-icons/bi'

interface CustomerReviewsProps {
  product: Product
}

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="flex items-center gap-[2px]" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => (
        <svg
          key={n}
          width={size}
          height={size}
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7 1l1.545 3.13L12 4.635l-2.5 2.435.59 3.44L7 8.885l-3.09 1.625L4.5 7.07 2 4.635l3.455-.505L7 1z"
            fill={n <= rating ? '#C29B47' : 'none'}
            stroke={n <= rating ? '#C29B47' : '#B8AD9A'}
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  )
}

function RatingBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-mono text-ink-soft w-8 text-right">{label}</span>
      <div className="flex-1 h-[3px] bg-ink-rule rounded-full overflow-hidden">
        <div
          className="h-full bg-brass rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-mono text-ink-soft w-5">{count}</span>
    </div>
  )
}

export default function CustomerReviews({ product }: CustomerReviewsProps) {
  const reviews = getReviewsForProduct(product.id, product.category)
  const { average, count } = getAggregateRating(reviews)

  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }))

  return (
    <section>
      <Eyebrow className="mb-3">Customer reviews</Eyebrow>
      <h2
        className="font-serif font-medium text-ink-charcoal leading-tight mb-10"
        style={{ fontSize: 'clamp(22px, 2.5vw, 36px)' }}
      >
        What buyers are saying.
      </h2>

      {/* Aggregate panel */}
      <div className="flex flex-col sm:flex-row gap-8 sm:gap-14 mb-12 pb-10 border-b border-ink-rule">
        {/* Big score */}
        <div className="flex flex-col items-start gap-2 shrink-0">
          <span className="font-serif text-[64px] leading-none text-ink-charcoal tabular-nums">
            {average.toFixed(1)}
          </span>
          <StarRow rating={Math.round(average)} size={16} />
          <span className="text-[11px] font-mono uppercase tracking-eyebrow text-ink-soft mt-1">
            {count} {count === 1 ? 'review' : 'reviews'}
          </span>
        </div>

        {/* Distribution bars */}
        <div className="flex flex-col justify-center gap-2 flex-1 max-w-xs">
          {dist.map(({ star, count: c }) => (
            <RatingBar key={star} label={`${star}★`} count={c} total={count} />
          ))}
        </div>
      </div>

      {/* Review list */}
      <div className="space-y-8">
        {reviews.map(review => (
          <article key={review.id} className="border-b border-ink-rule pb-8 last:border-none last:pb-0">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <StarRow rating={review.rating} />
                <h3 className="font-serif text-[17px] text-ink-charcoal mt-2 leading-snug">
                  {review.title}
                </h3>
              </div>
              <time
                dateTime={review.date}
                className="text-[11px] font-mono text-ink-soft shrink-0 pt-1"
              >
                {new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </time>
            </div>

            <p className="font-sans text-[15px] text-ink-soft leading-relaxed mb-3">
              {review.body}
            </p>

            <div className="flex items-center gap-4">
              <span className="text-[12px] font-mono text-ink-iron">
                {review.author}
                {review.location && (
                  <span className="text-ink-soft"> · {review.location}</span>
                )}
              </span>
              {review.verified && (
                <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-eyebrow text-green-brand">
                  <BiCheck size={13} aria-hidden="true" />
                  Verified purchase
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
