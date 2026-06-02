/**
 * Unit tests for /api/settings/public, /api/subjects/my (GET + POST)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetPlatformSettings = vi.fn()
const mockFindUnique = vi.fn()
const mockCreate     = vi.fn()
const mockUpdate     = vi.fn()

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/db', () => ({
    prisma: {
        subject: { findUnique: mockFindUnique, create: mockCreate, update: mockUpdate },
        user: { findUnique: mockFindUnique, update: mockUpdate },
    },
}))
vi.mock('@/lib/settings', () => ({ getPlatformSettings: mockGetPlatformSettings }))

import { getServerSession } from 'next-auth'
const mockSession = getServerSession as ReturnType<typeof vi.fn>

const { GET: publicGet }     = await import('@/app/api/settings/public/route')
const { GET: subjectsGet }   = await import('@/app/api/subjects/my/route')
const { POST: subjectsPost } = await import('@/app/api/subjects/my/route')

const DEFAULT_SETTINGS = {
    allowedEmailDomains: [], studentIdLabel: 'Campus ID', studentIdFormat: 'ANY',
    studentIdMinLength: 1, studentIdMaxLength: 50, studentIdRequired: false,
    rollNumberLabel: 'Registration Number', rollNumberFormat: 'ANY',
    rollNumberMinLength: 1, rollNumberMaxLength: 50, rollNumberRequired: true,
    maxSemester: 8, availableBatches: [], maxBatchNumber: 13,
    enableYearTargeting: true, enableSemesterTargeting: true, enableBatchTargeting: true,
}

function subjectReq(body: object) {
    return new Request('http://localhost/api/subjects/my', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

// ── GET /api/settings/public ──────────────────────────────────────────────────

describe('GET /api/settings/public', () => {
    beforeEach(() => { vi.resetAllMocks(); mockGetPlatformSettings.mockResolvedValue(DEFAULT_SETTINGS) })

    it('200 – returns settings without auth', async () => {
        const res = await publicGet()
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.maxSemester).toBe(8)
        expect(body.rollNumberRequired).toBe(true)
    })

    it('returns custom field labels', async () => {
        mockGetPlatformSettings.mockResolvedValue({ ...DEFAULT_SETTINGS, studentIdLabel: 'Library Card', rollNumberLabel: 'USN' })
        const body = await (await publicGet()).json()
        expect(body.studentIdLabel).toBe('Library Card')
        expect(body.rollNumberLabel).toBe('USN')
    })

    it('returns allowed email domains', async () => {
        mockGetPlatformSettings.mockResolvedValue({ ...DEFAULT_SETTINGS, allowedEmailDomains: ['@y.edu.in'] })
        const body = await (await publicGet()).json()
        expect(body.allowedEmailDomains).toContain('@y.edu.in')
    })

    it('response includes all targeting flags', async () => {
        const body = await (await publicGet()).json()
        expect(body).toHaveProperty('enableYearTargeting')
        expect(body).toHaveProperty('enableSemesterTargeting')
        expect(body).toHaveProperty('enableBatchTargeting')
    })
})

// ── GET /api/subjects/my ─────────────────────────────────────────────────────

describe('GET /api/subjects/my', () => {
    const SUBJECTS = [{ id: 's1', code: 'CS201', name: 'Data Structures', semester: 3, department: 'CS', isApproved: true }]

    beforeEach(() => { vi.resetAllMocks(); mockFindUnique.mockResolvedValue({ subjects: SUBJECTS }) })

    it('200 – faculty gets subjects', async () => {
        mockSession.mockResolvedValue({ user: { id: 'f1', role: 'FACULTY' } })
        const res = await subjectsGet()
        expect(res.status).toBe(200)
        expect((await res.json())).toHaveLength(1)
    })

    it('401 – unauthenticated', async () => {
        mockSession.mockResolvedValue(null)
        expect((await subjectsGet()).status).toBe(401)
    })

    it('403 – student blocked', async () => {
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
        expect((await subjectsGet()).status).toBe(403)
    })

    it('returns empty array when faculty has no subjects', async () => {
        mockSession.mockResolvedValue({ user: { id: 'f1', role: 'FACULTY' } })
        mockFindUnique.mockResolvedValue(null)
        const body = await (await subjectsGet()).json()
        expect(body).toEqual([])
    })
})

// ── POST /api/subjects/my ─────────────────────────────────────────────────────

describe('POST /api/subjects/my', () => {
    const EXISTING = { id: 's1', code: 'CS201', name: 'Data Structures', semester: 3 }

    beforeEach(() => { vi.resetAllMocks() })

    it('200 – connects faculty to existing subject', async () => {
        mockSession.mockResolvedValue({ user: { id: 'f1', role: 'FACULTY' } })
        mockFindUnique.mockResolvedValue(EXISTING)
        mockUpdate.mockResolvedValue({})
        const res = await subjectsPost(subjectReq({ code: 'CS201' }))
        expect(res.status).toBe(200)
    })

    it('201 – creates new subject when code not found', async () => {
        mockSession.mockResolvedValue({ user: { id: 'f1', role: 'FACULTY' } })
        mockFindUnique.mockResolvedValue(null)
        mockCreate.mockResolvedValue({ id: 'snew', code: 'CS999', name: 'New', semester: 1 })
        mockUpdate.mockResolvedValue({})
        const res = await subjectsPost(subjectReq({ code: 'CS999', name: 'New', semester: 1 }))
        expect(res.status).toBe(201)
    })

    it('400 – missing code', async () => {
        mockSession.mockResolvedValue({ user: { id: 'f1', role: 'FACULTY' } })
        expect((await subjectsPost(subjectReq({ name: 'Subject' }))).status).toBe(400)
    })

    it('400 – new subject missing name and semester', async () => {
        mockSession.mockResolvedValue({ user: { id: 'f1', role: 'FACULTY' } })
        mockFindUnique.mockResolvedValue(null)
        const res = await subjectsPost(subjectReq({ code: 'CS999' }))
        expect(res.status).toBe(400)
        expect((await res.json()).error).toMatch(/name and semester/i)
    })

    it('401 – unauthenticated', async () => {
        mockSession.mockResolvedValue(null)
        expect((await subjectsPost(subjectReq({ code: 'CS201' }))).status).toBe(401)
    })

    it('403 – student blocked', async () => {
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
        expect((await subjectsPost(subjectReq({ code: 'CS201', name: 'X', semester: 1 }))).status).toBe(403)
    })

    it('new subjects start with isApproved: false', async () => {
        mockSession.mockResolvedValue({ user: { id: 'f1', role: 'FACULTY' } })
        mockFindUnique.mockResolvedValue(null)
        mockCreate.mockResolvedValue({ id: 'snew', code: 'NEW', isApproved: false })
        mockUpdate.mockResolvedValue({})
        await subjectsPost(subjectReq({ code: 'NEW', name: 'New', semester: 2 }))
        expect(mockCreate.mock.calls[0][0].data.isApproved).toBe(false)
    })
})
