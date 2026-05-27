import type { IronSessionOptions } from 'iron-session'
import type { AdminSession } from './auth'

export const sessionOptions: IronSessionOptions = {
  cookieName: 'acme_admin_session',
  password: process.env.SESSION_SECRET ?? 'fallback-dev-secret-replace-in-production',
  cookieOptions: {
    // Plan 2: set secure: true once you're on HTTPS (Vercel / production)
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,     // JS in the browser cannot read this cookie
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8-hour session
  },
}

declare module 'iron-session' {
  interface IronSessionData extends AdminSession {}
}
