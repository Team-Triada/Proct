/**
 * Unit tests for faculty routes: dashboard, students list, student update
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindUnique = vi.fn()
const mockFindMany   = vi.fn()
const mockUpdate     = vi.fn()

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/db', () => ({ prisma: { user: { findUnique: mockFindUnique, findMany: mockFindMany, update: mockUpdate } } }))

import { getServerSession } from 'next-auth'
const mockSession = getServerSession as ReturnType<typeof vi.fn>

const { GET: dashGet }  = await import('@/app/api/faculty/dashboard/route')
const { GET: stuGet }   = await import('@/app/api/faculty/students/route')
const { PUT: stuPut }   = await import('@/app/api/faculty/students/[id]/route')

const FAC   = { user: { id: 'f1', role: 'FACULTY' } }
const ADMIN = { user: { id: 'a1', role: 'ADMIN'   } }
const STU   = { user: { id: 's1', role: 'STUDENT' } }

function putReq(body: object) {
    return new Request('http://localhost', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}
function idP(id = 's1') { return { params: Promise.resolve({ id }) } as never }

// ── GET /api/faculty/dashboard ────────────────────────────────────────────────

describe('GET /api/faculty/dashboard', () => {
    const DASH = { subjects: [{ id: 'sub1', code: 'CS201', name: 'DSA', semester: 3, quizzes: [{ id: 'q1', title: 'Midterm', _count: { attempts: 5, questions: 10 } }], _count: { quizzes: 1 } }] }

    beforeEach(() => { vi.resetAllMocks(); mockFindUnique.mockResolvedValue(DASH) })

    it('200 – faculty gets dashboard', async () => {
        mockSession.mockResolvedValue(FAC)
        const body = await (await dashGet()).json()
        expect(body.subjects[0].quizzes[0].title).toBe('Midterm')
    })

    it('401 – unauthenticated', async () => {
        mockSession.mockResolvedValue(null)
        expect((await dashGet()).status).toBe(401)
    })

    it('403 – student blocked', async () => {
        mockSession.mockResolvedValue(STU)
        expect((await dashGet()).status).toBe(403)
    })

    it('403 – admin blocked (faculty-only route)', async () => {
        mockSession.mockResolvedValue(ADMIN)
        expect((await dashGet()).status).toBe(403)
    })

    it('returns empty subjects when faculty has none', async () => {
        mockSession.mockResolvedValue(FAC)
        mockFindUnique.mockResolvedValue(null)
        expect((await (await dashGet()).json()).subjects).toEqual([])
    })

    it('quiz counts included', async () => {
        mockSession.mockResolvedValue(FAC)
        const body = await (await dashGet()).json()
        const quiz = body.subjects[0].quizzes[0]
        expect(quiz._count.attempts).toBe(5)
        expect(quiz._count.questions).toBe(10)
    })
})

// ── GET /api/faculty/students ─────────────────────────────────────────────────

describe('GET /api/faculty/students', () => {
    const STUDENTS = [
        { id: 's1', name: 'Alice', email: 'a@y.edu', role: 'STUDENT', semester: 3, batch: '2023-26', section: '1', rollNumber: 'R1', campusId: null, department: 'CS', image: null },
        { id: 's2', name: 'Bob',   email: 'b@y.edu', role: 'STUDENT', semester: 3, batch: '2023-26', section: '2', rollNumber: 'R2', campusId: null, department: 'CS', image: null },
    ]

    beforeEach(() => {
        vi.resetAllMocks()
        mockFindMany.mockResolvedValue(STUDENTS)
        mockFindUnique.mockResolvedValue({ subjects: [{ semester: 3 }] })
    })

    it('200 – admin gets all students', async () => {
        mockSession.mockResolvedValue(ADMIN)
        const res = await stuGet()
        expect(res.status).toBe(200)
        expect((await res.json())).toHaveLength(2)
    })

    it('200 – faculty gets students', async () => {
        mockSession.mockResolvedValue(FAC)
        expect((await stuGet()).status).toBe(200)
    })

    it('401 – unauthenticated', async () => {
        mockSession.mockResolvedValue(null)
        expect((await stuGet()).status).toBe(401)
    })

    it('401 – student cannot list students', async () => {
        mockSession.mockResolvedValue(STU)
        expect((await stuGet()).status).toBe(401)
    })

    it('student objects exclude password', async () => {
        mockSession.mockResolvedValue(ADMIN)
        const body = await (await stuGet()).json()
        body.forEach((s: Record<string, unknown>) => expect(s).not.toHaveProperty('password'))
    })
})

// ── PUT /api/faculty/students/[id] ────────────────────────────────────────────

describe('PUT /api/faculty/students/[id]', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        // First call = get student, second call = get faculty with subjects
        mockFindUnique
            .mockResolvedValueOnce({ id: 's1', role: 'STUDENT', semester: 3 })   // student lookup
            .mockResolvedValueOnce({ id: 'f1', role: 'FACULTY', subjects: [{ semester: 3 }] }) // faculty lookup
        mockUpdate.mockResolvedValue({ id: 's1', name: 'Alice Updated', role: 'STUDENT' })
    })

    it('200 – faculty updates student in their semester', async () => {
        mockSession.mockResolvedValue(FAC)
        const res = await stuPut(putReq({ name: 'Alice Updated', semester: 3 }), idP())
        expect(res.status).toBe(200)
    })

    it('200 – admin updates any student', async () => {
        mockSession.mockResolvedValue(ADMIN)
        // Admin path only calls findUnique once (student)
        const res = await stuPut(putReq({ name: 'Alice Updated' }), idP())
        expect(res.status).toBe(200)
    })

    it('401 – unauthenticated', async () => {
        mockSession.mockResolvedValue(null)
        expect((await stuPut(putReq({ name: 'X' }), idP())).status).toBe(401)
    })

    it('401 – student cannot update students (returns 401 not 403)', async () => {
        mockSession.mockResolvedValue(STU)
        expect((await stuPut(putReq({ name: 'X' }), idP())).status).toBe(401)
    })
})
