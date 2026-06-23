import type { SessionOptions } from 'iron-session'

export interface CustomerSessionData {
  oauth?: {
    state: string
    codeVerifier: string
    redirectTo: string
  }
  accessToken?: string
  idToken?:     string
  email?:       string
  expiresAt?:   number
}

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET environment variable is not set. Sessions cannot be secured.')
}

export const customerSessionOptions: SessionOptions = {
  cookieName: 'acme_customer_session',
  password: process.env.SESSION_SECRET ?? 'dev-only-fallback-not-for-production',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  },
}
