import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Redis } from '@upstash/redis'
import { resetTokens } from '../forgot/route'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json().catch(() => ({}))

  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const record = resetTokens.get(token)
  if (!record || Date.now() > record.expiry) {
    return NextResponse.json(
      { error: 'Reset link has expired or is invalid.' },
      { status: 400 }
    )
  }

  // Invalidate token immediately (single-use)
  resetTokens.delete(token)

  // Hash the new password and persist to Redis
  const hash = await bcrypt.hash(password, 12)

  try {
    const redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL  ?? '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
    })
    await redis.set('acme:admin:password_hash', hash)
  } catch {
    return NextResponse.json(
      { error: 'Could not save new password. Please request a new reset link.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
