import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN

// 5 login attempts per IP per 15 minutes
export const loginRatelimit = hasUpstash
  ? new Ratelimit({
      redis:     Redis.fromEnv(),
      limiter:   Ratelimit.slidingWindow(5, '15 m'),
      analytics: false,
      prefix:    'acme_admin_login',
    })
  : null

// 5 OTP verification attempts per IP per 10 minutes
export const otpVerifyRatelimit = hasUpstash
  ? new Ratelimit({
      redis:     Redis.fromEnv(),
      limiter:   Ratelimit.slidingWindow(5, '10 m'),
      analytics: false,
      prefix:    'acme_admin_otp_verify',
    })
  : null

// 3 OTP resend requests per IP per 10 minutes
export const otpResendRatelimit = hasUpstash
  ? new Ratelimit({
      redis:     Redis.fromEnv(),
      limiter:   Ratelimit.slidingWindow(3, '10 m'),
      analytics: false,
      prefix:    'acme_admin_otp_resend',
    })
  : null

// 10 unsubscribe requests per IP per minute
export const unsubscribeRatelimit = hasUpstash
  ? new Ratelimit({
      redis:     Redis.fromEnv(),
      limiter:   Ratelimit.slidingWindow(10, '1 m'),
      analytics: false,
      prefix:    'acme_newsletter_unsubscribe',
    })
  : null
