/**
 * Fixed-window rate limiting.
 *
 * IMPORTANT DEPLOYMENT CAVEAT: the counters live in the memory of a single
 * process. On a single long-running server (`next start`, a container, a VM)
 * that is genuine protection. On serverless or multi-instance hosting each
 * instance keeps its own counters, so the effective limit is multiplied by the
 * instance count and resets on cold start. That still blunts a naive password
 * spray, but it is not a substitute for a shared store. To harden, swap
 * `hit()`'s body for a Redis `INCR`/`EXPIRE` against Upstash or similar — the
 * call sites do not need to change.
 */

export interface RateLimitRule {
    /** Maximum number of requests allowed inside the window. */
    limit: number
    /** Window length in milliseconds. */
    windowMs: number
}

export interface RateLimitResult {
    allowed: boolean
    remaining: number
    /** Seconds until the window resets — suitable for a Retry-After header. */
    retryAfterSeconds: number
}

interface Bucket {
    count: number
    resetAt: number
}

const buckets = new Map<string, Bucket>()

/**
 * Reap expired buckets so a stream of unique keys (rotating IPs) cannot grow
 * the map without bound. Called opportunistically rather than on a timer,
 * because timers do not survive serverless freezing.
 */
function sweep(now: number) {
    if (buckets.size < 5000) return
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key)
    }
}

/** Records a request against `key` and reports whether it may proceed. */
export function hit(key: string, rule: RateLimitRule, now: number = Date.now()): RateLimitResult {
    sweep(now)

    const existing = buckets.get(key)

    if (!existing || existing.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + rule.windowMs })
        return { allowed: true, remaining: rule.limit - 1, retryAfterSeconds: 0 }
    }

    existing.count++
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))

    if (existing.count > rule.limit) {
        return { allowed: false, remaining: 0, retryAfterSeconds }
    }

    return { allowed: true, remaining: rule.limit - existing.count, retryAfterSeconds }
}

/** Clears all counters. Test-only. */
export function resetRateLimits() {
    buckets.clear()
}

/**
 * Best-effort client IP.
 *
 * `x-forwarded-for` is client-controlled unless a trusted proxy overwrites it,
 * which Vercel, Cloudflare and a correctly configured nginx all do. If you
 * deploy behind something that does not, this value is spoofable and the limits
 * become advisory.
 */
export function clientIp(headers: Headers): string {
    const forwarded = headers.get('x-forwarded-for')
    if (forwarded) {
        const first = forwarded.split(',')[0]?.trim()
        if (first) return first
    }
    return headers.get('x-real-ip')?.trim() || 'unknown'
}

/** Limits applied to the unauthenticated, credential-handling endpoints. */
export const AUTH_RULES: Record<string, RateLimitRule> = {
    login: { limit: 10, windowMs: 10 * 60 * 1000 },
    register: { limit: 5, windowMs: 60 * 60 * 1000 },
    passwordReset: { limit: 5, windowMs: 60 * 60 * 1000 },
}

/** Limit applied to the high-frequency in-quiz endpoints. */
export const ATTEMPT_RULE: RateLimitRule = { limit: 300, windowMs: 60 * 1000 }
