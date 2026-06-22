import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { getActivityLog } from '@/lib/admin/activityLog'
import type { ActivityEntityType } from '@/lib/admin/activityLog'

const VALID_ENTITY_TYPES: ActivityEntityType[] = ['review', 'product', 'content', 'order']

export async function GET(req: NextRequest) {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params     = req.nextUrl.searchParams
  const limit      = Math.min(Number(params.get('limit')  ?? 30), 100)
  const offset     = Math.max(Number(params.get('offset') ?? 0),  0)
  const entityType = params.get('entityType') as ActivityEntityType | null

  if (entityType && !VALID_ENTITY_TYPES.includes(entityType)) {
    return NextResponse.json({ error: 'Invalid entityType' }, { status: 400 })
  }

  const entries = await getActivityLog(limit, offset, entityType ?? undefined)
  return NextResponse.json(entries)
}
