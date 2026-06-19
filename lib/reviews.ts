import supabaseAdmin from './supabase'

export type ReviewStatus = 'pending' | 'approved' | 'deactivated'

export interface Review {
  id: string
  productHandle: string
  productId: string
  customerEmail: string
  customerName: string
  rating: number
  title: string
  body: string
  verifiedPurchase: boolean
  approved: boolean
  status: ReviewStatus
  helpfulCount: number
  createdAt: string
}

export interface ReviewSummary {
  average: number
  count: number
  distribution: { 1: number; 2: number; 3: number; 4: number; 5: number }
}

export interface SubmitReviewInput {
  productHandle: string
  productId: string
  customerEmail: string
  customerName: string
  rating: number
  title: string
  body: string
  verifiedPurchase: boolean
}

function toReview(row: Record<string, unknown>): Review {
  return {
    id:               row.id as string,
    productHandle:    row.product_handle as string,
    productId:        row.product_id as string,
    customerEmail:    row.customer_email as string,
    customerName:     row.customer_name as string,
    rating:           row.rating as number,
    title:            row.title as string,
    body:             row.body as string,
    verifiedPurchase: row.verified_purchase as boolean,
    approved:         row.approved as boolean,
    status:           (row.status as ReviewStatus) ?? (row.approved ? 'approved' : 'pending'),
    helpfulCount:     row.helpful_count as number,
    createdAt:        row.created_at as string,
  }
}

export async function getApprovedReviews(productHandle: string): Promise<Review[]> {
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('product_handle', productHandle)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map(toReview)
}

export async function getReviewSummary(productHandle: string): Promise<ReviewSummary> {
  const reviews = await getApprovedReviews(productHandle)

  if (reviews.length === 0) {
    return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
  }

  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as ReviewSummary['distribution']
  let total = 0
  for (const r of reviews) {
    dist[r.rating as keyof typeof dist]++
    total += r.rating
  }

  return {
    average:      Math.round((total / reviews.length) * 10) / 10,
    count:        reviews.length,
    distribution: dist,
  }
}

export async function hasCustomerReviewed(email: string, productHandle: string): Promise<boolean> {
  const { count, error } = await supabaseAdmin
    .from('reviews')
    .select('id', { count: 'exact', head: true })
    .eq('customer_email', email)
    .eq('product_handle', productHandle)

  if (error) return false
  return (count ?? 0) > 0
}

export async function submitReviewToDb(input: SubmitReviewInput): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin.from('reviews').insert({
    product_handle:    input.productHandle,
    product_id:        input.productId,
    customer_email:    input.customerEmail,
    customer_name:     input.customerName,
    rating:            input.rating,
    title:             input.title,
    body:              input.body,
    verified_purchase: input.verifiedPurchase,
    approved:          false,
  })

  if (error) {
    if (error.code === '23505') return { error: 'already_reviewed' }
    return { error: error.message }
  }
  return {}
}

export async function markHelpful(
  reviewId: string,
  voterToken: string
): Promise<{ alreadyVoted: boolean }> {
  const { error: voteError } = await supabaseAdmin
    .from('review_helpful_votes')
    .insert({ review_id: reviewId, voter_token: voterToken })

  if (voteError) {
    if (voteError.code === '23505') return { alreadyVoted: true }
    throw new Error(voteError.message)
  }

  await supabaseAdmin.rpc('increment_helpful', { row_id: reviewId })
  return { alreadyVoted: false }
}

export async function getAllReviewsAdmin(
  filter: 'all' | 'pending' | 'approved' | 'deactivated'
): Promise<Review[]> {
  let query = supabaseAdmin
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: false })

  if (filter !== 'all') query = query.eq('status', filter)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map(toReview)
}

export async function setReviewStatus(id: string, status: ReviewStatus): Promise<void> {
  const { error } = await supabaseAdmin
    .from('reviews')
    .update({ status, approved: status === 'approved' })
    .eq('id', id)

  if (error) throw new Error(error.message)
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('reviews')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
