import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// 5 login attempts per IP per 15 minutes
export const loginRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: false,
  prefix: 'acme_admin_login',
})
