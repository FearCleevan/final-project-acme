import { Redis } from '@upstash/redis'
import type { ContentKey } from '@/lib/types/content'

const redis = Redis.fromEnv()

export async function getContent<T>(key: ContentKey): Promise<T | null> {
  try {
    return await redis.get<T>(`content:${key}`)
  } catch {
    return null
  }
}

export async function setContent(key: ContentKey, value: unknown): Promise<void> {
  await redis.set(`content:${key}`, value)
}
