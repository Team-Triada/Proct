/**
 * Unit tests for NextAuth credentials authorize function.
 * Tests the logic that validates email+password and returns a user (or null).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockFindUnique = vi.fn()

vi.mock('@/lib/db', () => ({
    prisma: {
        user: { findUnique: mockFindUnique },
    },
}))

vi.mock('bcryptjs', () => ({
    default: { compare: vi.fn() },
    compare: vi.fn(),
}))

import bcrypt from 'bcryptjs'
const bcryptCompare = bcrypt.compare as ReturnType<typeof vi.fn>

// ── Helpers ────────────────────────────────────────────────────────────────────

const DB_USER = {
    id: 'u1',
    email: 'faculty@yenepoya.edu.in',
    password: '$2b$12$hashed',
    name: 'Dr. Smith',
    role: 'FACULTY',
    rollNumber: null,
}

async function callAuthorize(credentials: Record<string, string> | undefined) {
    // Re-import each time so mocks are fresh
    const { authOptions } = await import('@/lib/auth')
    const provider = authOptions.providers[0] as {
        options: {
            authorize: (c: typeof credentials) => Promise<unknown>
        }
    }
    return provider.options.authorize(credentials)
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('NextAuth credentials authorize', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
    })

    it('returns null when credentials are undefined', async () => {
        const result = await callAuthorize(undefined)
        expect(result).toBeNull()
    })

    it('returns null when email is missing', async () => {
        const result = await callAuthorize({ email: '', password: 'pass' })
        expect(result).toBeNull()
        expect(mockFindUnique).not.toHaveBeenCalled()
    })

    it('returns null when password is missing', async () => {
        const result = await callAuthorize({ email: 'a@b.com', password: '' })
        expect(result).toBeNull()
        expect(mockFindUnique).not.toHaveBeenCalled()
    })

    it('returns null when user not found in DB', async () => {
        mockFindUnique.mockResolvedValue(null)
        const result = await callAuthorize({ email: 'nobody@yenepoya.edu.in', password: 'pass' })
        expect(result).toBeNull()
    })

    it('returns null when password is wrong', async () => {
        mockFindUnique.mockResolvedValue(DB_USER)
        bcryptCompare.mockResolvedValue(false)
        const result = await callAuthorize({ email: DB_USER.email, password: 'wrongpass' })
        expect(result).toBeNull()
    })

    it('returns user object when credentials are correct', async () => {
        mockFindUnique.mockResolvedValue(DB_USER)
        bcryptCompare.mockResolvedValue(true)
        const result = await callAuthorize({ email: DB_USER.email, password: 'CorrectPass1!' }) as Record<string, unknown>
        expect(result).not.toBeNull()
        expect(result.id).toBe('u1')
        expect(result.email).toBe(DB_USER.email)
        expect(result.role).toBe('FACULTY')
    })

    it('never returns the hashed password in the user object', async () => {
        mockFindUnique.mockResolvedValue(DB_USER)
        bcryptCompare.mockResolvedValue(true)
        const result = await callAuthorize({ email: DB_USER.email, password: 'CorrectPass1!' }) as Record<string, unknown>
        expect(result).not.toHaveProperty('password')
    })

    it('includes rollNumber in returned user', async () => {
        mockFindUnique.mockResolvedValue({ ...DB_USER, role: 'STUDENT', rollNumber: '23BBCCED001' })
        bcryptCompare.mockResolvedValue(true)
        const result = await callAuthorize({ email: DB_USER.email, password: 'pass' }) as Record<string, unknown>
        expect(result.rollNumber).toBe('23BBCCED001')
    })

    it('queries DB by email (not by id)', async () => {
        mockFindUnique.mockResolvedValue(null)
        await callAuthorize({ email: 'test@yenepoya.edu.in', password: 'pass' })
        expect(mockFindUnique).toHaveBeenCalledWith({ where: { email: 'test@yenepoya.edu.in' } })
    })
})

// ── JWT + session callbacks ────────────────────────────────────────────────────

describe('NextAuth callbacks', () => {
    beforeEach(() => vi.resetModules())

    it('jwt callback copies role and rollNumber to token', async () => {
        const { authOptions } = await import('@/lib/auth')
        const jwt = authOptions.callbacks!.jwt!
        const token = await jwt({
            token: { sub: 'u1' },
            user: { id: 'u1', email: 'e@yenepoya.edu.in', name: 'X', role: 'STUDENT', rollNumber: '23ABC' },
            account: null, trigger: 'signIn',
        })
        expect(token.role).toBe('STUDENT')
        expect(token.rollNumber).toBe('23ABC')
        expect(token.id).toBe('u1')
    })

    it('jwt callback is no-op when user is absent (subsequent requests)', async () => {
        const { authOptions } = await import('@/lib/auth')
        const jwt = authOptions.callbacks!.jwt!
        const token = { sub: 'u1', role: 'ADMIN', id: 'u1' }
        const result = await jwt({ token, account: null, trigger: 'update' })
        expect(result.role).toBe('ADMIN')
    })

    it('session callback exposes id and role on session.user', async () => {
        const { authOptions } = await import('@/lib/auth')
        const sessionCb = authOptions.callbacks!.session!
        const session = {
            user: { name: 'X', email: 'e@b.com' },
            expires: '',
        }
        const result = await sessionCb({
            session,
            token: { id: 'u1', role: 'ADMIN', rollNumber: null, sub: 'u1' },
            newSession: undefined,
            trigger: 'update',
        })
        expect((result.user as Record<string, unknown>).id).toBe('u1')
        expect((result.user as Record<string, unknown>).role).toBe('ADMIN')
    })
})
