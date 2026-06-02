/**
 * Unit tests for /api/admin/users (POST) and /api/admin/users/[id] (PUT, DELETE)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindUnique  = vi.fn()
const mockCreate      = vi.fn()
const mockUpdate      = vi.fn()
const mockTransaction = vi.fn()

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/db', () => ({
    prisma: {
        user: { findUnique: mockFindUnique, create: mockCreate, update: mockUpdate },
        $transaction: mockTransaction,
    },
}))
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn(() => 'hashed_pw') }, hash: vi.fn(() => 'hashed_pw') }))

import { getServerSession } from 'next-auth'
const mockSession = getServerSession as ReturnType<typeof vi.fn>

const { POST }   = await import('@/app/api/admin/users/route')
const { PUT }    = await import('@/app/api/admin/users/[id]/route')
const { DELETE } = await import('@/app/api/admin/users/[id]/route')

const ADMIN = { user: { id: 'admin1', role: 'ADMIN' } }
const CREATED = { id: 'u1', email: 'new@c.edu', name: 'New', role: 'STUDENT', password: 'hashed_pw', rollNumber: null, campusId: null, semester: null, batch: null, section: null, department: null, image: null }

function postReq(body: object) {
    return new Request('http://localhost', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}
function idParams(id = 'u1') { return { params: Promise.resolve({ id }) } as never }
function idReq(body: object, method = 'PUT') {
    return new Request('http://localhost', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}

// ── POST /api/admin/users ─────────────────────────────────────────────────────

describe('POST /api/admin/users', () => {
    beforeEach(() => { vi.resetAllMocks(); mockFindUnique.mockResolvedValue(null); mockCreate.mockResolvedValue(CREATED) })

    it('201 – admin creates user', async () => {
        mockSession.mockResolvedValue(ADMIN)
        expect((await POST(postReq({ email: 'new@c.edu', password: 'pw', name: 'New', role: 'STUDENT' }))).status).toBe(201)
    })

    it('response never includes password', async () => {
        mockSession.mockResolvedValue(ADMIN)
        const body = await (await POST(postReq({ email: 'x@y.com', password: 'pw', name: 'X', role: 'STUDENT' }))).json()
        expect(body).not.toHaveProperty('password')
    })

    it('401 – unauthenticated', async () => {
        mockSession.mockResolvedValue(null)
        expect((await POST(postReq({ email: 'x', password: 'pw', name: 'X', role: 'STUDENT' }))).status).toBe(401)
    })

    it('401 – faculty blocked', async () => {
        mockSession.mockResolvedValue({ user: { id: 'f1', role: 'FACULTY' } })
        expect((await POST(postReq({ email: 'x', password: 'pw', name: 'X', role: 'STUDENT' }))).status).toBe(401)
    })

    it('400 – missing required fields', async () => {
        mockSession.mockResolvedValue(ADMIN)
        const res = await POST(postReq({ email: 'x@y.com' }))
        expect(res.status).toBe(400)
        expect((await res.json()).error).toMatch(/missing/i)
    })

    it('400 – duplicate email', async () => {
        mockSession.mockResolvedValue(ADMIN)
        mockFindUnique.mockResolvedValue({ id: 'existing' })
        const res = await POST(postReq({ email: 'dup@c.edu', password: 'pw', name: 'X', role: 'STUDENT' }))
        expect(res.status).toBe(400)
        expect((await res.json()).error).toMatch(/already exists/i)
    })

    it.each(['FACULTY', 'ADMIN', 'STUDENT'])('admin can create %s role', async (role) => {
        mockSession.mockResolvedValue(ADMIN)
        mockCreate.mockResolvedValue({ ...CREATED, role })
        const res = await POST(postReq({ email: `${role}@c.edu`, password: 'pw', name: role, role }))
        expect(res.status).toBe(201)
        expect((await res.json()).role).toBe(role)
    })
})

// ── PUT /api/admin/users/[id] ─────────────────────────────────────────────────

describe('PUT /api/admin/users/[id]', () => {
    beforeEach(() => { vi.resetAllMocks(); mockUpdate.mockResolvedValue({ ...CREATED, name: 'Updated' }) })

    it('200 – admin updates user', async () => {
        mockSession.mockResolvedValue(ADMIN)
        const res = await PUT(idReq({ name: 'Updated' }), idParams())
        expect(res.status).toBe(200)
        expect((await res.json()).name).toBe('Updated')
    })

    it('401 – student blocked', async () => {
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
        expect((await PUT(idReq({ name: 'X' }), idParams())).status).toBe(401)
    })

    it('password hashed when provided', async () => {
        mockSession.mockResolvedValue(ADMIN)
        await PUT(idReq({ name: 'X', password: 'NewPass' }), idParams())
        expect(mockUpdate.mock.calls[0][0].data.password).toBe('hashed_pw')
    })

    it('password field absent when not provided', async () => {
        mockSession.mockResolvedValue(ADMIN)
        await PUT(idReq({ name: 'X' }), idParams())
        expect(mockUpdate.mock.calls[0][0].data.password).toBeUndefined()
    })
})

// ── DELETE /api/admin/users/[id] ──────────────────────────────────────────────

describe('DELETE /api/admin/users/[id]', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        // Return user WITH quizzes array (required by the DELETE route)
        mockFindUnique.mockResolvedValue({ id: 'u1', role: 'STUDENT', quizzes: [] })
        mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn({
            quizAttempt: { deleteMany: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
            violationLog: { deleteMany: vi.fn() },
            answer: { deleteMany: vi.fn() },
            question: { deleteMany: vi.fn() },
            quiz: { deleteMany: vi.fn() },
            user: { delete: vi.fn().mockResolvedValue({ id: 'u1' }) },
        }))
    })

    it('200 – admin deletes student', async () => {
        mockSession.mockResolvedValue(ADMIN)
        expect((await DELETE(new Request('http://localhost'), idParams())).status).toBe(200)
    })

    it('200 – admin deletes faculty (with quiz cleanup)', async () => {
        mockSession.mockResolvedValue(ADMIN)
        mockFindUnique.mockResolvedValue({ id: 'f1', role: 'FACULTY', quizzes: [{ id: 'q1' }] })
        expect((await DELETE(new Request('http://localhost'), idParams('f1'))).status).toBe(200)
    })

    it('401 – non-admin blocked', async () => {
        mockSession.mockResolvedValue({ user: { id: 'f1', role: 'FACULTY' } })
        expect((await DELETE(new Request('http://localhost'), idParams())).status).toBe(401)
    })

    it('404 – user not found', async () => {
        mockSession.mockResolvedValue(ADMIN)
        mockFindUnique.mockResolvedValue(null)
        expect((await DELETE(new Request('http://localhost'), idParams())).status).toBe(404)
    })
})
