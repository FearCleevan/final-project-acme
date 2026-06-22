import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { setReviewStatus, deleteReview } from '@/lib/reviews'
import type { ReviewStatus } from '@/lib/reviews'
import { logAction } from '@/lib/admin/activityLog'

async function requireAdmin(): Promise<boolean> {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return !!session.isLoggedIn
}

const ACTION_MAP: Record<string, ReviewStatus> = {
  approve:    'approved',
  deactivate: 'deactivated',
  activate:   'approved',
  reject:     'pending',
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let action: string
  try {
    const body = await req.json()
    action = body.action
    if (!ACTION_MAP[action]) throw new Error()
  } catch {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  await setReviewStatus(id, ACTION_MAP[action])
  await logAction(`review.${action}`, 'review', id).catch(() => {})
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  await deleteReview(id)
  await logAction('review.delete', 'review', id).catch(() => {})
  return NextResponse.json({ ok: true })
}
