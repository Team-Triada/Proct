/**
 * Unit tests for Quiz Grading Flow
 * Covers:
 * - POST /api/attempts/grade (Faculty grades subjective answers)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

const mockAttemptFindUnique = vi.fn()
const mockAttemptUpdate = vi.fn()
const mockAnswerUpdate = vi.fn()
const mockAnswerFindMany = vi.fn()
const mockTransaction = vi.fn()

vi.mock('@/lib/db', () => ({
    prisma: {
        quizAttempt: {
            findUnique: mockAttemptFindUnique,
            update: mockAttemptUpdate,
        },
        answer: {
            update: mockAnswerUpdate,
            findMany: mockAnswerFindMany,
        },
        $transaction: mockTransaction,
    },
}))

// ── Sessions & Base Data ──────────────────────────────────────────────────────

const FACULTY_SESSION = { user: { id: 'f1', role: 'FACULTY', email: 'f@y.edu.in' } }
const OTHER_FACULTY_SESSION = { user: { id: 'f2', role: 'FACULTY', email: 'other@y.edu.in' } }

const BASE_ATTEMPT = {
    id: 'a1',
    quiz: { facultyId: 'f1' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildRequest(body: any) {
    return {
        json: async () => body,
    }
}

// ── Import Handlers ───────────────────────────────────────────────────────────

const { POST: gradeAttempt } = await import('@/app/api/attempts/grade/route')

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Quiz Grading Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getServerSession).mockResolvedValue(FACULTY_SESSION)
        mockAttemptFindUnique.mockResolvedValue(BASE_ATTEMPT)
        
        // Mock $transaction to execute the callback
        mockTransaction.mockImplementation(async (callback) => {
            return await callback({
                answer: { update: mockAnswerUpdate, findMany: mockAnswerFindMany },
                quizAttempt: { update: mockAttemptUpdate },
            })
        })
    })

    it('200 – faculty grades attempt successfully', async () => {
        const payload = {
            attemptId: 'a1',
            grades: [
                { questionId: 'q1_id', points: 5, feedback: 'Good job' }
            ]
        }
        
        mockAnswerFindMany.mockResolvedValue([{ pointsAwarded: 5 }, { pointsAwarded: 10 }])
        
        const res = await gradeAttempt(buildRequest(payload) as never)
        expect(res.status).toBe(200)
        
        expect(mockAnswerUpdate).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({ attemptId_questionId: { attemptId: 'a1', questionId: 'q1_id' } }),
            data: expect.objectContaining({ pointsAwarded: 5, feedback: 'Good job' })
        }))
        
        expect(mockAttemptUpdate).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 'a1' },
            data: { score: 15 } // 5 + 10
        }))
    })

    it('401 – no session', async () => {
        vi.mocked(getServerSession).mockResolvedValue(null)
        const res = await gradeAttempt(buildRequest({}) as never)
        expect(res.status).toBe(401)
    })

    it('403 – unauthorized faculty (doesn\'t own the quiz)', async () => {
        vi.mocked(getServerSession).mockResolvedValue(OTHER_FACULTY_SESSION)
        const res = await gradeAttempt(buildRequest({ attemptId: 'a1', grades: [] }) as never)
        expect(res.status).toBe(403)
        expect((await res.json()).error).toMatch(/unauthorized/i)
    })

    it('404 – attempt not found', async () => {
        mockAttemptFindUnique.mockResolvedValue(null)
        const res = await gradeAttempt(buildRequest({ attemptId: 'not_found', grades: [] }) as never)
        expect(res.status).toBe(404)
    })

    it('400 – invalid payload', async () => {
        const res = await gradeAttempt(buildRequest({ attemptId: 'a1' }) as never) // missing grades
        expect(res.status).toBe(400)
    })
})
