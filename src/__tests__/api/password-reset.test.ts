/**
 * Unit tests for password policy, reset-token handling and CSV export helpers.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted so these exist by the time the hoisted vi.mock factory runs —
// static imports below would otherwise pull in the real db module first.
const {
    mockTokenFindUnique,
    mockTokenCreate,
    mockTokenDeleteMany,
    mockTransaction,
} = vi.hoisted(() => ({
    mockTokenFindUnique: vi.fn(),
    mockTokenCreate: vi.fn(),
    mockTokenDeleteMany: vi.fn(),
    mockTransaction: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
    prisma: {
        passwordResetToken: {
            findUnique: mockTokenFindUnique,
            create: mockTokenCreate,
            deleteMany: mockTokenDeleteMany,
        },
        $transaction: mockTransaction,
    },
}))

import { validatePassword, PASSWORD_MIN_LENGTH } from '@/lib/passwordPolicy'
import {
    generateResetToken,
    hashResetToken,
    digestsMatch,
    resolveResetToken,
    issueResetToken,
} from '@/lib/passwordReset'
import { buildCsv, csvRow, safeFilename } from '@/lib/csv'

describe('password policy', () => {
    it('accepts a password meeting every rule', () => {
        expect(validatePassword('Str0ng!Pass')).toBeNull()
    })

    it('rejects a password that is too short', () => {
        expect(validatePassword('Ab1!')).toMatch(new RegExp(`${PASSWORD_MIN_LENGTH} characters`))
    })

    it('rejects a password with no uppercase letter', () => {
        expect(validatePassword('str0ng!pass')).toMatch(/uppercase/)
    })

    it('rejects a password with no lowercase letter', () => {
        expect(validatePassword('STR0NG!PASS')).toMatch(/lowercase/)
    })

    it('rejects a password with no digit', () => {
        expect(validatePassword('Strong!Pass')).toMatch(/number/)
    })

    it('rejects a password with no special character', () => {
        expect(validatePassword('Str0ngPass')).toMatch(/special/)
    })

    it('rejects non-strings and empty values', () => {
        expect(validatePassword(undefined)).toMatch(/required/)
        expect(validatePassword('')).toMatch(/required/)
        expect(validatePassword(12345678)).toMatch(/required/)
    })

    it('rejects an absurdly long password', () => {
        expect(validatePassword(`Aa1!${'x'.repeat(500)}`)).toMatch(/at most/)
    })
})

describe('reset tokens', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockTransaction.mockResolvedValue([])
    })

    it('generates a 64-character hex token', () => {
        expect(generateResetToken()).toMatch(/^[a-f0-9]{64}$/)
    })

    it('generates a different token each time', () => {
        expect(generateResetToken()).not.toBe(generateResetToken())
    })

    it('hashes deterministically and never returns the plaintext', () => {
        const token = generateResetToken()
        const hash = hashResetToken(token)
        expect(hash).toBe(hashResetToken(token))
        expect(hash).not.toBe(token)
    })

    it('compares equal digests as matching', () => {
        const hash = hashResetToken('abc')
        expect(digestsMatch(hash, hash)).toBe(true)
    })

    it('compares different digests as non-matching', () => {
        expect(digestsMatch(hashResetToken('abc'), hashResetToken('abd'))).toBe(false)
    })

    it('treats empty digests as non-matching', () => {
        expect(digestsMatch('', '')).toBe(false)
    })

    it('stores only the hash when issuing a token', async () => {
        const { token } = await issueResetToken('u1')
        const createCall = mockTokenCreate.mock.calls[0][0]
        expect(createCall.data.tokenHash).toBe(hashResetToken(token))
        expect(JSON.stringify(createCall)).not.toContain(token)
    })

    it('invalidates outstanding tokens when issuing a new one', async () => {
        await issueResetToken('u1')
        expect(mockTokenDeleteMany).toHaveBeenCalledWith({ where: { userId: 'u1', usedAt: null } })
    })

    it('rejects a malformed token without touching the database', async () => {
        expect(await resolveResetToken('not-a-token')).toBeNull()
        expect(await resolveResetToken(null)).toBeNull()
        expect(await resolveResetToken(12345)).toBeNull()
        expect(mockTokenFindUnique).not.toHaveBeenCalled()
    })

    it('resolves a valid, unused, unexpired token', async () => {
        mockTokenFindUnique.mockResolvedValue({
            id: 't1',
            userId: 'u1',
            expiresAt: new Date(Date.now() + 60_000),
            usedAt: null,
        })
        expect(await resolveResetToken(generateResetToken())).toEqual({ id: 't1', userId: 'u1' })
    })

    it('rejects an expired token', async () => {
        mockTokenFindUnique.mockResolvedValue({
            id: 't1',
            userId: 'u1',
            expiresAt: new Date(Date.now() - 60_000),
            usedAt: null,
        })
        expect(await resolveResetToken(generateResetToken())).toBeNull()
    })

    it('rejects an already-used token', async () => {
        mockTokenFindUnique.mockResolvedValue({
            id: 't1',
            userId: 'u1',
            expiresAt: new Date(Date.now() + 60_000),
            usedAt: new Date(),
        })
        expect(await resolveResetToken(generateResetToken())).toBeNull()
    })

    it('rejects an unknown token', async () => {
        mockTokenFindUnique.mockResolvedValue(null)
        expect(await resolveResetToken(generateResetToken())).toBeNull()
    })
})

describe('CSV export helpers', () => {
    it('quotes every field', () => {
        expect(csvRow(['a', 'b'])).toBe('"a","b"')
    })

    it('escapes embedded quotes by doubling them', () => {
        expect(csvRow(['say "hi"'])).toBe('"say ""hi"""')
    })

    it('keeps commas and newlines inside a single field', () => {
        expect(csvRow(['a,b'])).toBe('"a,b"')
        expect(csvRow(['line1\nline2'])).toBe('"line1\nline2"')
    })

    it('renders null and undefined as empty fields', () => {
        expect(csvRow([null, undefined])).toBe('"",""')
    })

    it('neutralises spreadsheet formula injection', () => {
        expect(csvRow(['=HYPERLINK("http://evil","x")'])).toContain(`"'=HYPERLINK`)
        expect(csvRow(['+1'])).toBe(`"'+1"`)
        expect(csvRow(['-1'])).toBe(`"'-1"`)
        expect(csvRow(['@SUM(A1)'])).toBe(`"'@SUM(A1)"`)
    })

    it('builds a document with a BOM, header and CRLF endings', () => {
        const csv = buildCsv(['Name'], [['Ada'], ['Alan']])
        expect(csv.startsWith('﻿')).toBe(true)
        expect(csv).toContain('"Name"\r\n"Ada"\r\n"Alan"')
    })

    it('sanitises filenames and falls back when nothing survives', () => {
        expect(safeFilename('Mid Term / Unit 1')).toBe('Mid-Term-Unit-1')
        expect(safeFilename('///', 'quiz')).toBe('quiz')
    })
})
