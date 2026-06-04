import type { SessionOptions } from 'iron-session'

export interface CustomerSessionData {
  oauth?: {
    state: string
    codeVerifier: string
    redirectTo: string
  }
  accessToken?: string
  expiresAt?: number
}

export const customerSessionOptions: SessionOptions = {
  cookieName: 'acme_customer_session',
  password: process.env.SESSION_SECRET ?? 'fallback-dev-secret-replace-in-production',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  },
}
