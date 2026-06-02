/**
 * Unit tests for /api/profile (GET + PUT)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindUnique = vi.fn()
const mockUpdate     = vi.fn()

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/db', () => ({ prisma: { user: { findUnique: mockFindUnique, update: mockUpdate } } }))

import { getServerSession } from 'next-auth'
const mockSession = getServerSession as ReturnType<typeof vi.fn>

const { GET } = await import('@/app/api/profile/route')
const { PUT } = await import('@/app/api/profile/route')

const BASE_PROFILE = {
    id: 'u1', name: 'Dr. Smith', email: 'smith@y.edu',
    rollNumber: null, campusId: null, semester: 3, batch: '2023-26',
    section: '1', department: 'CS', image: null, role: 'FACULTY',
}

function putReq(body: object) {
    return new Request('http://localhost/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

describe('GET /api/profile', () => {
    beforeEach(() => { vi.resetAllMocks(); mockFindUnique.mockResolvedValue(BASE_PROFILE) })

    it('200 – returns own profile', async () => {
        mockSession.mockResolvedValue({ user: { id: 'u1', role: 'FACULTY' } })
        const res = await GET()
        expect(res.status).toBe(200)
        expect((await res.json()).email).toBe('smith@y.edu')
    })

    it('response never includes password', async () => {
        mockSession.mockResolvedValue({ user: { id: 'u1', role: 'FACULTY' } })
        const body = await (await GET()).json()
        expect(body).not.toHaveProperty('password')
    })

    it('401 – unauthenticated', async () => {
        mockSession.mockResolvedValue(null)
        expect((await GET()).status).toBe(401)
    })

    it('404 – user not in DB', async () => {
        mockSession.mockResolvedValue({ user: { id: 'ghost', role: 'STUDENT' } })
        mockFindUnique.mockResolvedValue(null)
        expect((await GET()).status).toBe(404)
    })

    it('student gets their own profile', async () => {
        mockSession.mockResolvedValue({ user: { id: 'u1', role: 'STUDENT' } })
        mockFindUnique.mockResolvedValue({ ...BASE_PROFILE, role: 'STUDENT' })
        const res = await GET()
        expect(res.status).toBe(200)
        expect((await res.json()).role).toBe('STUDENT')
    })
})

describe('PUT /api/profile', () => {
    beforeEach(() => { vi.resetAllMocks(); mockFindUnique.mockResolvedValue({ role: 'FACULTY' }); mockUpdate.mockResolvedValue({ ...BASE_PROFILE, name: 'Updated' }) })

    it('200 – faculty updates profile', async () => {
        mockSession.mockResolvedValue({ user: { id: 'u1', role: 'FACULTY' } })
        const res = await PUT(putReq({ name: 'Updated' }))
        expect(res.status).toBe(200)
        expect((await res.json()).name).toBe('Updated')
    })

    it('200 – admin updates profile', async () => {
        mockFindUnique.mockResolvedValue({ role: 'ADMIN' })
        mockSession.mockResolvedValue({ user: { id: 'a1', role: 'ADMIN' } })
        expect((await PUT(putReq({ name: 'Admin' }))).status).toBe(200)
    })

    it('401 – unauthenticated', async () => {
        mockSession.mockResolvedValue(null)
        expect((await PUT(putReq({ name: 'X' }))).status).toBe(401)
    })

    it('403 – student cannot edit own profile', async () => {
        mockFindUnique.mockResolvedValue({ role: 'STUDENT' })
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
        const res = await PUT(putReq({ name: 'Hacked' }))
        expect(res.status).toBe(403)
        expect((await res.json()).error).toMatch(/cannot edit/i)
    })

    it('400 – empty name rejected', async () => {
        mockSession.mockResolvedValue({ user: { id: 'u1', role: 'FACULTY' } })
        expect((await PUT(putReq({ name: '   ' }))).status).toBe(400)
    })

    it('400 – missing name rejected', async () => {
        mockSession.mockResolvedValue({ user: { id: 'u1', role: 'FACULTY' } })
        expect((await PUT(putReq({ department: 'CS' }))).status).toBe(400)
    })

    it('name trimmed on update', async () => {
        mockSession.mockResolvedValue({ user: { id: 'u1', role: 'FACULTY' } })
        await PUT(putReq({ name: '  Dr. Smith  ' }))
        expect(mockUpdate.mock.calls[0][0].data.name).toBe('Dr. Smith')
    })

    it('empty optional strings coerced to null', async () => {
        mockSession.mockResolvedValue({ user: { id: 'u1', role: 'FACULTY' } })
        await PUT(putReq({ name: 'X', rollNumber: '', campusId: '' }))
        const data = mockUpdate.mock.calls[0][0].data
        expect(data.rollNumber).toBeNull()
        expect(data.campusId).toBeNull()
    })

    it('semester string parsed to integer', async () => {
        mockSession.mockResolvedValue({ user: { id: 'u1', role: 'FACULTY' } })
        await PUT(putReq({ name: 'X', semester: '5' }))
        expect(mockUpdate.mock.calls[0][0].data.semester).toBe(5)
    })
})
