import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { setReviewApproved } from '@/lib/reviews'

async function requireAdmin(): Promise<boolean> {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  return !!session.isLoggedIn
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let action: 'approve' | 'reject'
  try {
    const body = await req.json()
    action = body.action
    if (action !== 'approve' && action !== 'reject') throw new Error()
  } catch {
    return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 })
  }

  await setReviewApproved(id, action === 'approve')
  return NextResponse.json({ ok: true })
}
