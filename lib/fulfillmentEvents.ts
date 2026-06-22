import { Redis } from '@upstash/redis'
import type { FulfillmentEvent } from './admin/types'

const redis = Redis.fromEnv()

function key(orderId: string): string {
  return `fulfillment:events:${orderId.replace(/[^a-zA-Z0-9_-]/g, '_')}`
}

export async function getCustomFulfillmentEvents(orderId: string): Promise<FulfillmentEvent[]> {
  try {
    const data = await redis.get<FulfillmentEvent[]>(key(orderId))
    return data ?? []
  } catch {
    return []
  }
}

export async function addCustomFulfillmentEvent(orderId: string, event: FulfillmentEvent): Promise<void> {
  const existing = await getCustomFulfillmentEvents(orderId)
  // Replace any existing entry with the same status so re-adding a stage is idempotent
  const updated = [...existing.filter(e => e.status !== event.status), event]
  await redis.set(key(orderId), updated)
}
