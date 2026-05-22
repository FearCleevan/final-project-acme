export interface Review {
  id: string
  productId: string
  author: string
  location: string
  rating: number
  title: string
  body: string
  date: string
  verified: boolean
}

const lightingReviews: Review[] = [
  {
    id: 'r-l-001', productId: 'eb-013',
    author: 'Margaret H.',
    location: 'Charleston, SC',
    rating: 5,
    title: 'Exactly as described — arrived in perfect condition.',
    body: "The flame spread is remarkable. I've been chasing an original for two years; this bench-tested example saved me from another bad auction lot. The finish is exactly what the photos show.",
    date: '2024-11-14',
    verified: true,
  },
  {
    id: 'r-l-002', productId: 'eb-013',
    author: 'Thomas W.',
    location: 'Portland, OR',
    rating: 5,
    title: 'Fit my No. 2 burner on the first try.',
    body: "Ordered on a Tuesday, arrived Thursday. No rattles, no cracks. The fitment note on the listing was accurate — I didn't need to shim anything. Real craftsman-grade work.",
    date: '2024-10-03',
    verified: true,
  },
  {
    id: 'r-l-003', productId: 'eb-013',
    author: 'Diane F.',
    location: 'Savannah, GA',
    rating: 4,
    title: 'Beautiful piece, slight patina variance from photo.',
    body: 'The lamp itself is spectacular — everything I hoped for. The patina is slightly warmer in person than on screen, which I actually prefer. Losing one star only because the packing was a bit light for something this fragile, but it survived intact.',
    date: '2024-09-18',
    verified: true,
  },
]

const glassReviews: Review[] = [
  {
    id: 'r-g-001', productId: 'eb-001',
    author: 'Harold B.',
    location: 'New Orleans, LA',
    rating: 5,
    title: 'No chips, no cloudiness — dealer-quality condition.',
    body: 'Bought two of these and both are flawless. The etching is crisp and the glass walls are even throughout. My restoration clients will be very happy.',
    date: '2025-01-07',
    verified: true,
  },
  {
    id: 'r-g-002', productId: 'eb-001',
    author: 'Clara M.',
    location: 'Burlington, VT',
    rating: 5,
    title: 'Third purchase — zero complaints.',
    body: 'I keep coming back because the quality is consistent. Found one similar at an estate sale last summer in worse condition for twice the price. This is the right way to source period glass.',
    date: '2024-12-29',
    verified: true,
  },
]

const hardwareReviews: Review[] = [
  {
    id: 'r-h-001', productId: 'eb-003',
    author: 'Raymond S.',
    location: 'Cincinnati, OH',
    rating: 5,
    title: 'Threads are clean and the collar sits flush.',
    body: "Not always the case with old hardware. This one is genuinely ready to use — no chasing the threads, no fighting the collar. Exactly what the bench test date on the tag suggests.",
    date: '2024-08-21',
    verified: true,
  },
  {
    id: 'r-h-002', productId: 'eb-003',
    author: 'Louise P.',
    location: 'Richmond, VA',
    rating: 4,
    title: 'Good piece, slight discolouration on the interior.',
    body: "Functionally perfect. There's a light mineral stain on the interior that wasn't called out in the listing — not structural, easily cleaned, but worth mentioning. Would still buy again.",
    date: '2024-07-15',
    verified: true,
  },
]

const signReviews: Review[] = [
  {
    id: 'r-s-001', productId: 's-001',
    author: 'Arthur K.',
    location: 'Philadelphia, PA',
    rating: 5,
    title: "The lettering is sharper than anything I've seen at auction.",
    body: 'I collect trade signs professionally. This is the real article — original iron, original paint, no repro touches. The hand-numbered tag and plain-paper receipt are a nice old-fashioned touch that matches the goods.',
    date: '2025-02-03',
    verified: true,
  },
  {
    id: 'r-s-002', productId: 's-001',
    author: 'Evelyn C.',
    location: 'Austin, TX',
    rating: 5,
    title: 'Incredible presence on the wall.',
    body: 'Photos do not do it justice. The weight and texture read as completely authentic. Shipped carefully — arrived without a scratch.',
    date: '2025-01-22',
    verified: true,
  },
]

export const mockReviews: Review[] = [
  ...lightingReviews,
  ...glassReviews,
  ...hardwareReviews,
  ...signReviews,
]

const fallbackReviews: Review[] = [
  {
    id: 'r-fallback-1', productId: '',
    author: 'James O.',
    location: 'Nashville, TN',
    rating: 5,
    title: "As close to mint as you'll find outside a museum.",
    body: "I've been buying antique lighting components for fifteen years. This arrived exactly as described — no surprises, no euphemistic condition language. The bench test note sealed it for me.",
    date: '2024-10-11',
    verified: true,
  },
  {
    id: 'r-fallback-2', productId: '',
    author: 'Eleanor T.',
    location: 'Asheville, NC',
    rating: 5,
    title: 'The plain-paper receipt was a charming touch.',
    body: 'Everything about this purchase felt intentional and honest — the listing copy, the packing, even the receipt. The piece itself is excellent. Will be back for more.',
    date: '2024-09-05',
    verified: true,
  },
  {
    id: 'r-fallback-3', productId: '',
    author: 'Samuel G.',
    location: 'Memphis, TN',
    rating: 4,
    title: 'Solid piece — minor surface oxidation not in photos.',
    body: "Very happy with the purchase overall. There's a small patch of surface oxidation on the back face that wasn't visible in the listing images. Not a deal-breaker at all, but I'd appreciate a note. Everything else is exactly right.",
    date: '2024-08-30',
    verified: false,
  },
]

export function getReviewsForProduct(productId: string, category: string): Review[] {
  const specific = mockReviews.filter(r => r.productId === productId)
  if (specific.length > 0) return specific

  const categoryFirstId = { lighting: 'eb-013', 'glass-chimneys': 'eb-001', hardware: 'eb-003', signs: '' }[category]
  if (categoryFirstId) {
    const categoryReviews = mockReviews.filter(r => r.productId === categoryFirstId)
    if (categoryReviews.length > 0) return categoryReviews
  }

  return fallbackReviews
}

export function getAggregateRating(reviews: Review[]): { average: number; count: number } {
  if (reviews.length === 0) return { average: 0, count: 0 }
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  return { average: Math.round(avg * 10) / 10, count: reviews.length }
}
