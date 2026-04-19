import { NextRequest } from 'next/server'

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

// In-memory store: "endpoint:ip" → array of request timestamps
const store = new Map<string, number[]>()

// Purge stale entries hourly so the map doesn't grow unbounded
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000
  Array.from(store.entries()).forEach(([key, timestamps]) => {
    const fresh = timestamps.filter((t) => t > cutoff)
    if (fresh.length === 0) store.delete(key)
    else store.set(key, fresh)
  })
}, 60 * 60 * 1000)

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number }

export function checkRateLimit(
  ip: string,
  endpoint: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${endpoint}:${ip}`
  const now = Date.now()
  const windowStart = now - config.windowMs
  const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart)

  if (timestamps.length >= config.maxRequests) {
    const retryAfterSeconds = Math.ceil((timestamps[0] + config.windowMs - now) / 1000)
    return { allowed: false, retryAfterSeconds }
  }

  timestamps.push(now)
  store.set(key, timestamps)
  return { allowed: true }
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

export function rateLimitResponse(retryAfterSeconds: number): Response {
  return new Response(
    JSON.stringify({ error: `Rate limit exceeded. Try again in ${retryAfterSeconds}s.` }),
    {
      status: 429,
      headers: { 'Content-Type': 'application/json', 'Retry-After': String(retryAfterSeconds) },
    }
  )
}

// Per-endpoint configs
export const LIMITS = {
  generate:      { maxRequests: 10, windowMs: 5  * 60 * 1000 }, // 10 / 5 min
  validate:      { maxRequests: 20, windowMs: 5  * 60 * 1000 }, // 20 / 5 min
  mcp:           { maxRequests: 3,  windowMs: 15 * 60 * 1000 }, // 3  / 15 min
  lighthouse:    { maxRequests: 5,  windowMs: 15 * 60 * 1000 }, // 5  / 15 min
  testRun:       { maxRequests: 5,  windowMs: 15 * 60 * 1000 }, // 5  / 15 min
  runGenerated:  { maxRequests: 5,  windowMs: 15 * 60 * 1000 }, // 5  / 15 min
  pipeline:      { maxRequests: 3,  windowMs: 15 * 60 * 1000 }, // 3  / 15 min
} satisfies Record<string, RateLimitConfig>
