/**
 * Unit tests for /api/admin/settings (GET + PUT)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockUpsert = vi.fn()
const mockGetPlatformSettings = vi.fn()

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/db', () => ({ prisma: { platformSettings: { upsert: mockUpsert } } }))
vi.mock('@/lib/settings', () => ({ getPlatformSettings: mockGetPlatformSettings }))

import { getServerSession } from 'next-auth'
const mockSession = getServerSession as ReturnType<typeof vi.fn>

const { GET } = await import('@/app/api/admin/settings/route')
const { PUT } = await import('@/app/api/admin/settings/route')

const SETTINGS_ROW = {
    id: 1, allowedEmailDomains: '[]', studentIdLabel: 'Campus ID', studentIdFormat: 'ANY',
    studentIdMinLength: 1, studentIdMaxLength: 50, studentIdRequired: false,
    rollNumberLabel: 'Registration Number', rollNumberFormat: 'ANY', rollNumberMinLength: 1,
    rollNumberMaxLength: 50, rollNumberRequired: true, maxSemester: 8, availableBatches: '[]',
    maxBatchNumber: 13, enableYearTargeting: true, enableSemesterTargeting: true,
    enableBatchTargeting: true, updatedAt: new Date(),
}

const ADMIN = { user: { id: 'a1', role: 'ADMIN' } }

function putReq(body: object) {
    return new Request('http://localhost/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

describe('GET /api/admin/settings', () => {
    beforeEach(() => { vi.resetAllMocks(); mockGetPlatformSettings.mockResolvedValue(SETTINGS_ROW) })

    it('200 – admin receives settings', async () => {
        mockSession.mockResolvedValue(ADMIN)
        const res = await GET()
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.studentIdLabel).toBe('Campus ID')
    })

    it('401 – unauthenticated', async () => {
        mockSession.mockResolvedValue(null)
        expect((await GET()).status).toBe(401)
    })

    it('401 – faculty blocked', async () => {
        mockSession.mockResolvedValue({ user: { id: 'f1', role: 'FACULTY' } })
        expect((await GET()).status).toBe(401)
    })

    it('401 – student blocked', async () => {
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
        expect((await GET()).status).toBe(401)
    })
})

describe('PUT /api/admin/settings', () => {
    beforeEach(() => { vi.resetAllMocks(); mockUpsert.mockResolvedValue(SETTINGS_ROW) })

    it('200 – admin updates settings', async () => {
        mockSession.mockResolvedValue(ADMIN)
        const res = await PUT(putReq({ maxSemester: 6 }))
        expect(res.status).toBe(200)
        expect(mockUpsert).toHaveBeenCalledOnce()
    })

    it('401 – unauthenticated', async () => {
        mockSession.mockResolvedValue(null)
        expect((await PUT(putReq({}))).status).toBe(401)
    })

    it('401 – faculty blocked', async () => {
        mockSession.mockResolvedValue({ user: { id: 'f1', role: 'FACULTY' } })
        expect((await PUT(putReq({}))).status).toBe(401)
    })

    it('400 – invalid studentIdFormat', async () => {
        mockSession.mockResolvedValue(ADMIN)
        const res = await PUT(putReq({ studentIdFormat: 'INVALID' }))
        expect(res.status).toBe(400)
        expect((await res.json()).error).toMatch(/invalid/i)
    })

    it('400 – invalid rollNumberFormat', async () => {
        mockSession.mockResolvedValue(ADMIN)
        const res = await PUT(putReq({ rollNumberFormat: 'GARBAGE' }))
        expect(res.status).toBe(400)
    })

    it.each(['NUMERIC', 'ALPHA', 'ALPHANUMERIC', 'ANY'])('200 – format %s accepted', async (fmt) => {
        mockSession.mockResolvedValue(ADMIN)
        const res = await PUT(putReq({ studentIdFormat: fmt }))
        expect(res.status).toBe(200)
    })

    it('non-array allowedEmailDomains coerced to []', async () => {
        mockSession.mockResolvedValue(ADMIN)
        await PUT(putReq({ allowedEmailDomains: 'not-an-array' }))
        expect(mockUpsert.mock.calls[0][0].update.allowedEmailDomains).toBe('[]')
    })

    it('valid email domains array preserved', async () => {
        mockSession.mockResolvedValue(ADMIN)
        await PUT(putReq({ allowedEmailDomains: ['@yenepoya.edu.in'] }))
        expect(mockUpsert.mock.calls[0][0].update.allowedEmailDomains).toBe('["@yenepoya.edu.in"]')
    })

    it('non-array availableBatches coerced to []', async () => {
        mockSession.mockResolvedValue(ADMIN)
        await PUT(putReq({ availableBatches: null }))
        expect(mockUpsert.mock.calls[0][0].update.availableBatches).toBe('[]')
    })

    it('response JSON-parses domains and batches', async () => {
        mockSession.mockResolvedValue(ADMIN)
        mockUpsert.mockResolvedValue({ ...SETTINGS_ROW, allowedEmailDomains: '["@y.edu"]', availableBatches: '["2024-27"]' })
        const body = await (await PUT(putReq({}))).json()
        expect(body.allowedEmailDomains).toEqual(['@y.edu'])
        expect(body.availableBatches).toEqual(['2024-27'])
    })
})
