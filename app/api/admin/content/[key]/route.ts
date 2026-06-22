import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'
import { getContent, setContent } from '@/lib/content'
import type { ContentKey } from '@/lib/types/content'
import { logAction } from '@/lib/admin/activityLog'

const VALID_KEYS: ContentKey[] = [
  'hero', 'bench', 'testimonials', 'story', 'heritage', 'faq', 'shipping', 'returns',
]

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key } = await params
  if (!VALID_KEYS.includes(key as ContentKey)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  const data = await getContent(key as ContentKey)
  return NextResponse.json({ data })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const session = await getIronSession<AdminSession>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key } = await params
  if (!VALID_KEYS.includes(key as ContentKey)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  await setContent(key as ContentKey, body)
  await logAction('content.save', 'content', undefined, key).catch(() => {})
  return NextResponse.json({ ok: true })
}
