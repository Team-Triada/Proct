import { NextResponse, type NextRequest } from 'next/server'
import { hit, clientIp, AUTH_RULES, ATTEMPT_RULE, type RateLimitRule } from '@/lib/rateLimit'

/**
 * Edge middleware applying per-IP rate limits to the endpoints worth abusing:
 * the credential handlers (password spray, account enumeration, signup floods)
 * and the in-quiz write paths (violation/save spam).
 *
 * This runs on the edge runtime, so it cannot touch Prisma. Per-account lockout
 * is enforced separately inside the credentials provider, where the database is
 * available. The two are complementary: this caps how fast one network source
 * can guess, lockout caps how many times one account can be guessed at.
 */

function ruleFor(pathname: string): { key: string; rule: RateLimitRule } | null {
    // NextAuth posts credentials to /api/auth/callback/credentials.
    if (pathname.startsWith('/api/auth/callback/')) {
        return { key: 'login', rule: AUTH_RULES.login }
    }
    if (pathname === '/api/auth/register') {
        return { key: 'register', rule: AUTH_RULES.register }
    }
    if (pathname === '/api/auth/forgot-password' || pathname === '/api/auth/reset-password') {
        return { key: 'passwordReset', rule: AUTH_RULES.passwordReset }
    }
    if (pathname.startsWith('/api/attempts/')) {
        return { key: 'attempt', rule: ATTEMPT_RULE }
    }
    return null
}

export function middleware(request: NextRequest) {
    // Only mutating requests are limited; GETs here are cheap and idempotent.
    if (request.method !== 'POST' && request.method !== 'PUT' && request.method !== 'PATCH') {
        return NextResponse.next()
    }

    const matched = ruleFor(request.nextUrl.pathname)
    if (!matched) return NextResponse.next()

    const ip = clientIp(request.headers)
    const result = hit(`${matched.key}:${ip}`, matched.rule)

    if (!result.allowed) {
        return NextResponse.json(
            { error: 'Too many requests. Please wait and try again.' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(result.retryAfterSeconds),
                    'X-RateLimit-Limit': String(matched.rule.limit),
                    'X-RateLimit-Remaining': '0',
                },
            }
        )
    }

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit', String(matched.rule.limit))
    response.headers.set('X-RateLimit-Remaining', String(result.remaining))
    return response
}

export const config = {
    matcher: ['/api/auth/:path*', '/api/attempts/:path*'],
}
