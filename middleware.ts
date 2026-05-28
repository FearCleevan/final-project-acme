import { NextRequest, NextResponse } from 'next/server'
import { unsealData } from 'iron-session'
import { sessionOptions } from '@/lib/admin/session'
import type { AdminSession } from '@/lib/admin/auth'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const PUBLIC_ROUTES = ['/admin/login', '/admin/forgot-password', '/admin/reset-password']
  if (PUBLIC_ROUTES.includes(pathname)) return NextResponse.next()

  const cookieValue = req.cookies.get(sessionOptions.cookieName as string)?.value

  if (!cookieValue) {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  try {
    const session = await unsealData<AdminSession>(cookieValue, {
      password: sessionOptions.password as string,
    })
    if (!session.isLoggedIn) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  } catch {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
