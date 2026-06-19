import { NextRequest, NextResponse } from 'next/server'
import { markHelpful } from '@/lib/reviews'

export async function POST(req: NextRequest) {
  let reviewId: string
  let voterToken: string

  try {
    const body = await req.json()
    reviewId   = body.reviewId
    voterToken = body.voterToken
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  if (!reviewId || !voterToken) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const result = await markHelpful(reviewId, voterToken)
  return NextResponse.json(result)
}
