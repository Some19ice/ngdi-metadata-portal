/**
 * Rate Limiter Implementation for NGDI Metadata Portal
 * Task 49.4: API Rate Limiting for Security and Performance
 */

import { NextRequest } from "next/server"
import type { Redis } from "@upstash/redis"

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

// Default configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  // General API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 300 // more generous general API bucket
  },
  // Search endpoints (more lenient for authenticated users)
  search: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 90 // allow fast typing/autocomplete
  },
  // Authentication-related endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10 // 10 auth attempts per 15 minutes (stricter)
  },
  // File upload endpoints
  upload: {
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 5 // 5 uploads per minute
  },
  // Public endpoints (more strict)
  public: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 120 // relaxed for general browsing when used
  }
} as const

// In-memory store for rate limiting (in production, consider Redis)
interface RateLimitRecord {
  count: number
  resetTime: number
}

interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<RateLimitRecord>
}

class InMemoryStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  get(key: string): { count: number; resetTime: number } | undefined {
    const entry = this.store.get(key)
    if (entry && Date.now() > entry.resetTime) {
      this.store.delete(key)
      return undefined
    }
    return entry
  }

  set(key: string, value: { count: number; resetTime: number }): void {
    this.store.set(key, value)
  }

  async increment(key: string, windowMs: number): Promise<RateLimitRecord> {
    const now = Date.now()
    const resetTime = now + windowMs
    const existing = this.get(key)

    if (existing) {
      existing.count++
      this.set(key, existing)
      return existing
    } else {
      const newEntry = { count: 1, resetTime }
      this.set(key, newEntry)
      return newEntry
    }
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

// Optional Redis-backed store (Upstash Redis REST)
class RedisStore implements RateLimitStore {
  constructor(private redis: Redis) {}

  async increment(key: string, windowMs: number): Promise<RateLimitRecord> {
    // INCR and set TTL on first increment
    const count = await this.redis.incr(key)
    if (count === 1) {
      // set TTL in ms
      // @ts-ignore - upstash redis supports pexpire
      await this.redis.pexpire(key, windowMs)
    }
    // @ts-ignore - upstash redis supports pttl
    const ttlMs = await this.redis.pttl(key)
    const resetTime = Date.now() + (ttlMs > 0 ? ttlMs : windowMs)
    return { count, resetTime }
  }
}

let store: RateLimitStore & { cleanup?: () => void }

// Initialize store: prefer Redis if configured, else in-memory
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN
if (upstashUrl && upstashToken) {
  // Lazy import to avoid bundling when not configured
  const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis")
  const redis = new Redis({ url: upstashUrl, token: upstashToken })
  store = new RedisStore(redis)
} else {
  store = new InMemoryStore()
}

// Cleanup expired entries every 5 minutes
// Cleanup only for in-memory implementation
if (typeof (store as any).cleanup === "function") {
  setInterval(() => (store as any).cleanup(), 5 * 60 * 1000)
}

/**
 * Default key generator - creates a unique key based on IP address and user ID
 */
function defaultKeyGenerator(req: NextRequest): string {
  // Get IP address from headers
  const forwarded = req.headers.get("x-forwarded-for")
  const realIp = req.headers.get("x-real-ip")
  const ip = forwarded?.split(",")[0] || realIp || "unknown"

  // Get user ID from headers if available (middleware can set this)
  const userId = req.headers.get("x-user-id") || "anonymous"
  // Include pathname to scope per-endpoint budgets by default
  const pathname = req.nextUrl?.pathname || "unknown"

  return `rate_limit:${ip}:${userId}:${pathname}`
}

/**
 * Rate limiter function that can be used in API routes or middleware
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}> {
  const keyGenerator = config.keyGenerator || defaultKeyGenerator
  const key = keyGenerator(req)

  const { count, resetTime } = await store.increment(key, config.windowMs)

  const isAllowed = count <= config.maxRequests
  const remaining = Math.max(0, config.maxRequests - count)
  const retryAfter = isAllowed
    ? undefined
    : Math.ceil((resetTime - Date.now()) / 1000)

  return {
    success: isAllowed,
    limit: config.maxRequests,
    remaining,
    reset: Math.ceil(resetTime / 1000),
    retryAfter
  }
}

/**
 * Create a rate limiter for specific endpoint types
 */
export function createRateLimiter(configName: keyof typeof RATE_LIMIT_CONFIGS) {
  const config = RATE_LIMIT_CONFIGS[configName]

  return async (req: NextRequest) => {
    return rateLimit(req, config)
  }
}

/**
 * Middleware helper to apply rate limiting with proper response headers
 */
export async function applyRateLimit(
  req: NextRequest,
  config: RateLimitConfig,
  customHeaders?: Record<string, string>
): Promise<Response | null> {
  const result = await rateLimit(req, config)

  // Prepare rate limit headers
  const headers = new Headers(customHeaders)
  headers.set("X-RateLimit-Limit", result.limit.toString())
  headers.set("X-RateLimit-Remaining", result.remaining.toString())
  headers.set("X-RateLimit-Reset", result.reset.toString())

  if (!result.success) {
    if (result.retryAfter) {
      headers.set("Retry-After", result.retryAfter.toString())
    }

    return new Response(
      JSON.stringify({
        error: "Too Many Requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: result.retryAfter
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...Object.fromEntries(headers.entries())
        }
      }
    )
  }

  return null // No rate limit exceeded, continue with request
}

/**
 * Detailed variant that always returns headers so callers can attach them
 * to successful responses as well. Backwards-compatible with applyRateLimit.
 */
export async function applyRateLimitDetailed(
  req: NextRequest,
  config: RateLimitConfig,
  customHeaders?: Record<string, string>
): Promise<{
  limitedResponse: Response | null
  headers: Record<string, string>
}> {
  const result = await rateLimit(req, config)

  const headers = new Headers(customHeaders)
  headers.set("X-RateLimit-Limit", result.limit.toString())
  headers.set("X-RateLimit-Remaining", result.remaining.toString())
  headers.set("X-RateLimit-Reset", result.reset.toString())

  if (!result.success) {
    if (result.retryAfter) {
      headers.set("Retry-After", result.retryAfter.toString())
    }

    return {
      limitedResponse: new Response(
        JSON.stringify({
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: result.retryAfter
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...Object.fromEntries(headers.entries())
          }
        }
      ),
      headers: Object.fromEntries(headers.entries())
    }
  }

  return {
    limitedResponse: null,
    headers: Object.fromEntries(headers.entries())
  }
}

/**
 * Specialized rate limiters for different use cases
 */

// API endpoint rate limiter
export const apiRateLimit = createRateLimiter("api")

// Search endpoint rate limiter
export const searchRateLimit = createRateLimiter("search")

// Auth endpoint rate limiter
export const authRateLimit = createRateLimiter("auth")

// Upload endpoint rate limiter
export const uploadRateLimit = createRateLimiter("upload")

// Public endpoint rate limiter
export const publicRateLimit = createRateLimiter("public")

/**
 * IP-based rate limiter for extra security
 */
export function createIPRateLimit(windowMs: number, maxRequests: number) {
  return async (req: NextRequest) => {
    const config: RateLimitConfig = {
      windowMs,
      maxRequests,
      keyGenerator: req => {
        const forwarded = req.headers.get("x-forwarded-for")
        const realIp = req.headers.get("x-real-ip")
        const ip = forwarded?.split(",")[0] || realIp || "unknown"
        return `ip_rate_limit:${ip}`
      }
    }

    return rateLimit(req, config)
  }
}
