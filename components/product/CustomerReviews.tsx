import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import type { CustomerSessionData } from '@/lib/customerSession'
import { customerSessionOptions } from '@/lib/customerSession'
import { getApprovedReviews, getReviewSummary, hasCustomerReviewed } from '@/lib/reviews'
import type { Product } from '@/lib/types'
import Eyebrow from '@/components/shared/Eyebrow'
import ReviewsClient from './ReviewsClient'

interface CustomerReviewsProps {
  product: Product
}

export default async function CustomerReviews({ product }: CustomerReviewsProps) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), customerSessionOptions)
  const isLoggedIn = !!session.accessToken
  const email      = session.email ?? null

  const [reviews, summary, alreadyReviewed] = await Promise.all([
    getApprovedReviews(product.slug),
    getReviewSummary(product.slug),
    email ? hasCustomerReviewed(email, product.slug) : Promise.resolve(false),
  ])

  return (
    <section>
      <Eyebrow className="mb-3">Customer reviews</Eyebrow>
      <h2
        className="font-serif font-medium text-ink-charcoal leading-tight mb-10"
        style={{ fontSize: 'clamp(22px, 2.5vw, 36px)' }}
      >
        What buyers are saying.
      </h2>

      <ReviewsClient
        product={{ id: product.id, handle: product.slug, name: product.name }}
        reviews={reviews}
        summary={summary}
        isLoggedIn={isLoggedIn}
        alreadyReviewed={alreadyReviewed}
        defaultName=""
      />
    </section>
  )
}
