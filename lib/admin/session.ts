import type { SessionOptions } from 'iron-session'

export const sessionOptions: SessionOptions = {
  cookieName: 'acme_admin_session',
  password: process.env.SESSION_SECRET ?? 'fallback-dev-secret-replace-in-production',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
  },
}
