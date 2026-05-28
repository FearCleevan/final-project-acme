import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { resetTokens } from '../forgot/route'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json().catch(() => ({}))

  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const record = resetTokens.get(token)
  if (!record || Date.now() > record.expiry) {
    return NextResponse.json({ error: 'Reset link has expired or is invalid.' }, { status: 400 })
  }

  // Invalidate token immediately (single-use)
  resetTokens.delete(token)

  // Hash the new password
  const hash = await bcrypt.hash(password, 12)

  // In production: write hash to your secrets manager / env
  // For now: log it so the admin can paste it into ADMIN_PASSWORD_HASH
  console.log('NEW ADMIN_PASSWORD_HASH:', hash)
  console.log('Paste this into your .env.local and Vercel environment variables.')

  return NextResponse.json({ ok: true, hash })
}
