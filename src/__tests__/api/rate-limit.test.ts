/**
 * Unit tests for rate limiting and per-account login throttling.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { hit, clientIp, resetRateLimits, AUTH_RULES } from '@/lib/rateLimit'
import { isLocked, MAX_FAILED_ATTEMPTS } from '@/lib/loginThrottle'

describe('rate limiting', () => {
    beforeEach(() => {
        resetRateLimits()
    })

    const rule = { limit: 3, windowMs: 60_000 }

    it('allows requests up to the limit and blocks the next one', () => {
        expect(hit('k', rule).allowed).toBe(true)
        expect(hit('k', rule).allowed).toBe(true)
        expect(hit('k', rule).allowed).toBe(true)
        expect(hit('k', rule).allowed).toBe(false)
    })

    it('reports remaining budget', () => {
        expect(hit('k', rule).remaining).toBe(2)
        expect(hit('k', rule).remaining).toBe(1)
        expect(hit('k', rule).remaining).toBe(0)
    })

    it('tracks keys independently', () => {
        hit('a', rule)
        hit('a', rule)
        hit('a', rule)
        expect(hit('a', rule).allowed).toBe(false)
        expect(hit('b', rule).allowed).toBe(true)
    })

    it('resets once the window elapses', () => {
        const start = 1_000_000
        hit('k', rule, start)
        hit('k', rule, start)
        hit('k', rule, start)
        expect(hit('k', rule, start).allowed).toBe(false)
        expect(hit('k', rule, start + rule.windowMs + 1).allowed).toBe(true)
    })

    it('reports a retry-after within the window', () => {
        const start = 1_000_000
        for (let i = 0; i < rule.limit; i++) hit('k', rule, start)
        const blocked = hit('k', rule, start + 10_000)
        expect(blocked.allowed).toBe(false)
        expect(blocked.retryAfterSeconds).toBe(50)
    })

    it('caps login attempts more tightly than quiz traffic', () => {
        expect(AUTH_RULES.login.limit).toBeLessThan(20)
        expect(AUTH_RULES.register.limit).toBeLessThan(20)
    })
})

describe('clientIp', () => {
    it('takes the first x-forwarded-for entry', () => {
        const headers = new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' })
        expect(clientIp(headers)).toBe('203.0.113.7')
    })

    it('falls back to x-real-ip', () => {
        expect(clientIp(new Headers({ 'x-real-ip': '198.51.100.4' }))).toBe('198.51.100.4')
    })

    it('returns a stable placeholder when no header is present', () => {
        expect(clientIp(new Headers())).toBe('unknown')
    })
})

describe('account lockout', () => {
    it('treats a future lockedUntil as locked', () => {
        expect(isLocked({ lockedUntil: new Date(Date.now() + 60_000) })).toBe(true)
    })

    it('treats an elapsed lockedUntil as unlocked', () => {
        expect(isLocked({ lockedUntil: new Date(Date.now() - 60_000) })).toBe(false)
    })

    it('treats a null lockedUntil as unlocked', () => {
        expect(isLocked({ lockedUntil: null })).toBe(false)
    })

    it('locks before an attacker can walk a large password list', () => {
        expect(MAX_FAILED_ATTEMPTS).toBeLessThanOrEqual(10)
    })
})
