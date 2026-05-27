import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Login page is always public
  if (pathname === '/admin/login') return NextResponse.next()

  const res = NextResponse.next()
  const session = await getIronSession<AdminSession>(req, res, sessionOptions)

  if (!session.isLoggedIn) {
    const loginUrl = new URL('/admin/login', req.url)
    return NextResponse.redirect(loginUrl)
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*'],
}
