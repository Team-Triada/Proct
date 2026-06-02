/**
 * Unit tests for quiz CRUD routes and question management.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockQuizFindUnique     = vi.fn()
const mockQuizUpdate         = vi.fn()
const mockQuizDelete         = vi.fn()
const mockQuestionFindUnique = vi.fn()
const mockQuestionCreate     = vi.fn()
const mockQuestionUpdate     = vi.fn()
const mockQuestionDelete     = vi.fn()
const mockQuestionCount      = vi.fn()
const mockQuestionAggregate  = vi.fn()
const mockUserFindUnique     = vi.fn()
const mockDeleteMany         = vi.fn()
const mockTransaction        = vi.fn()
const mockGetPlatformSettings = vi.fn()

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/db', () => ({
    prisma: {
        quiz:         { findUnique: mockQuizFindUnique, update: mockQuizUpdate, delete: mockQuizDelete },
        question:     { findUnique: mockQuestionFindUnique, create: mockQuestionCreate, update: mockQuestionUpdate, delete: mockQuestionDelete, count: mockQuestionCount, aggregate: mockQuestionAggregate, deleteMany: mockDeleteMany },
        user:         { findUnique: mockUserFindUnique },
        quizAttempt:  { deleteMany: mockDeleteMany, findMany: vi.fn().mockResolvedValue([]) },
        answer:       { deleteMany: mockDeleteMany },
        violationLog: { deleteMany: mockDeleteMany },
        $transaction: mockTransaction,
    },
}))
vi.mock('@/lib/settings', () => ({ getPlatformSettings: mockGetPlatformSettings }))
const mockMatchesTgt = vi.fn()
vi.mock('@/lib/quizFilters', () => ({ matchesQuizTargeting: mockMatchesTgt }))

import { getServerSession } from 'next-auth'
const mockSession = getServerSession as ReturnType<typeof vi.fn>

// Top-level route imports — naming disambiguated
const { GET: quizGet, PUT: quizPut, DELETE: quizDelete } = await import('@/app/api/quizzes/[id]/route')
const { POST: questionAdd, PUT: questionPut, DELETE: questionDel } = await import('@/app/api/quizzes/[id]/questions/[questionId]/route')

const FAC   = { user: { id: 'f1',     role: 'FACULTY'  } }
const ADMIN = { user: { id: 'admin1', role: 'ADMIN'    } }
const STU   = { user: { id: 's1',     role: 'STUDENT'  } }
const OTHER = { user: { id: 'other',  role: 'FACULTY'  } }

const BASE_QUIZ = {
    id: 'quiz1', title: 'Test Quiz', facultyId: 'f1', subjectId: 'sub1',
    isPublished: true, timingMode: 'PER_QUESTION', timePerQuestion: 30,
    totalQuestions: 2, enforcementMode: 'NORMAL', showScore: true, showAnswers: false,
    availableFrom: null, availableUntil: null, assignedBatches: null,
    targetSection: null, targetSemester: null,
    subject: { semester: 3 },
    questions: [
        { id: 'q1', text: 'Q1', type: 'MULTIPLE_CHOICE', options: '["A","B"]', correctIndex: 0, correctIndices: '[]', order: 1, points: 5 },
        { id: 'q2', text: 'Q2', type: 'CHECKBOX',        options: '["X","Y"]', correctIndex: 0, correctIndices: '[0,1]', order: 2, points: 3 },
    ],
    _count: { attempts: 2 },
}

function qp(id: string)                  { return { params: Promise.resolve({ id }) } as never }
function qqp(id: string, qid: string)    { return { params: Promise.resolve({ id, questionId: qid }) } as never }
function bodyReq(body: object, m = 'PUT') { return new Request('http://localhost', { method: m, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) }

// ── GET /api/quizzes/[id] ─────────────────────────────────────────────────────

describe('GET /api/quizzes/[id]', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mockQuizFindUnique.mockResolvedValue(BASE_QUIZ)
        mockGetPlatformSettings.mockResolvedValue({ enableYearTargeting: true, enableSemesterTargeting: true, enableBatchTargeting: true })
        mockMatchesTgt.mockReturnValue(true)
    })

    it('200 – faculty sees quiz with correct answers', async () => {
        mockSession.mockResolvedValue(FAC)
        const res = await quizGet(new Request('http://localhost'), qp('quiz1'))
        expect(res.status).toBe(200)
        expect((await res.json()).questions[0].correctIndex).toBe(0)
    })

    it('200 – student quiz strips correct answers', async () => {
        mockSession.mockResolvedValue(STU)
        mockUserFindUnique.mockResolvedValue({ semester: 3, batch: '2023-26', section: '1' })
        const body = await (await quizGet(new Request('http://localhost'), qp('quiz1'))).json()
        expect(body.status).not.toBe(401)
        body.questions.forEach((q: Record<string, unknown>) => expect(q).not.toHaveProperty('correctIndex'))
    })

    it('401 – unauthenticated', async () => {
        mockSession.mockResolvedValue(null)
        expect((await quizGet(new Request('http://localhost'), qp('quiz1'))).status).toBe(401)
    })

    it('404 – quiz not found', async () => {
        mockSession.mockResolvedValue(FAC)
        mockQuizFindUnique.mockResolvedValue(null)
        expect((await quizGet(new Request('http://localhost'), qp('missing'))).status).toBe(404)
    })

    it('403 – other faculty blocked from quiz', async () => {
        mockSession.mockResolvedValue(OTHER)
        expect((await quizGet(new Request('http://localhost'), qp('quiz1'))).status).toBe(403)
    })

    it('200 – admin can view any quiz', async () => {
        mockSession.mockResolvedValue(ADMIN)
        expect((await quizGet(new Request('http://localhost'), qp('quiz1'))).status).toBe(200)
    })
})

// ── PUT /api/quizzes/[id] ─────────────────────────────────────────────────────

describe('PUT /api/quizzes/[id]', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mockQuizFindUnique.mockResolvedValue(BASE_QUIZ)
        mockQuizUpdate.mockResolvedValue({ ...BASE_QUIZ, isPublished: true })
        mockQuestionFindUnique.mockResolvedValue(BASE_QUIZ.questions[0])
        mockQuestionUpdate.mockResolvedValue({})
        mockDeleteMany.mockResolvedValue({ count: 0 })
    })

    it('200 – faculty updates own quiz', async () => {
        mockSession.mockResolvedValue(FAC)
        expect((await quizPut(bodyReq({ isPublished: true }), qp('quiz1'))).status).toBe(200)
    })

    it('200 – admin updates any quiz', async () => {
        mockSession.mockResolvedValue(ADMIN)
        expect((await quizPut(bodyReq({ title: 'New' }), qp('quiz1'))).status).toBe(200)
    })

    it('401 – unauthenticated', async () => {
        mockSession.mockResolvedValue(null)
        expect((await quizPut(bodyReq({ title: 'X' }), qp('quiz1'))).status).toBe(401)
    })

    it('403 – other faculty blocked', async () => {
        mockSession.mockResolvedValue(OTHER)
        expect((await quizPut(bodyReq({ title: 'X' }), qp('quiz1'))).status).toBe(403)
    })

    it('403 – student blocked', async () => {
        mockSession.mockResolvedValue(STU)
        expect((await quizPut(bodyReq({ title: 'X' }), qp('quiz1'))).status).toBe(403)
    })

    it('404 – quiz not found', async () => {
        mockSession.mockResolvedValue(FAC)
        mockQuizFindUnique.mockResolvedValue(null)
        expect((await quizPut(bodyReq({ title: 'X' }), qp('missing'))).status).toBe(404)
    })
})

// ── DELETE /api/quizzes/[id] ──────────────────────────────────────────────────

describe('DELETE /api/quizzes/[id]', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mockQuizFindUnique.mockResolvedValue(BASE_QUIZ)
        mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn({
            violationLog: { deleteMany: vi.fn() }, answer: { deleteMany: vi.fn() },
            quizAttempt: { deleteMany: vi.fn() }, question: { deleteMany: vi.fn() },
            quiz: { delete: vi.fn().mockResolvedValue({ id: 'quiz1' }) },
        }))
    })

    it('200 – faculty deletes own quiz', async () => {
        mockSession.mockResolvedValue(FAC)
        expect((await quizDelete(new Request('http://localhost', { method: 'DELETE' }), qp('quiz1'))).status).toBe(200)
    })

    it('200 – admin deletes any quiz', async () => {
        mockSession.mockResolvedValue(ADMIN)
        expect((await quizDelete(new Request('http://localhost', { method: 'DELETE' }), qp('quiz1'))).status).toBe(200)
    })

    it('401 – unauthenticated', async () => {
        mockSession.mockResolvedValue(null)
        expect((await quizDelete(new Request('http://localhost', { method: 'DELETE' }), qp('quiz1'))).status).toBe(401)
    })

    it('403 – other faculty blocked', async () => {
        mockSession.mockResolvedValue(OTHER)
        expect((await quizDelete(new Request('http://localhost', { method: 'DELETE' }), qp('quiz1'))).status).toBe(403)
    })

    it('404 – quiz not found', async () => {
        mockSession.mockResolvedValue(FAC)
        mockQuizFindUnique.mockResolvedValue(null)
        expect((await quizDelete(new Request('http://localhost', { method: 'DELETE' }), qp('missing'))).status).toBe(404)
    })
})

// ── POST questions/:questionId – Add question ─────────────────────────────────

describe('POST /api/quizzes/:id/questions/:qid – Add question', () => {
    const QP = qqp('quiz1', 'new')

    beforeEach(() => {
        vi.resetAllMocks()
        mockQuizFindUnique.mockResolvedValue(BASE_QUIZ)
        mockQuestionAggregate.mockResolvedValue({ _max: { order: 2 } })
        mockQuestionCreate.mockResolvedValue({ id: 'q3', text: 'New Q', type: 'MULTIPLE_CHOICE', options: '["A","B"]', correctIndex: 0, points: 2, order: 3 })
        mockQuizUpdate.mockResolvedValue({})
    })

    it('200 – faculty adds question', async () => {
        mockSession.mockResolvedValue(FAC)
        const res = await questionAdd(bodyReq({ text: 'Q', type: 'MULTIPLE_CHOICE', options: ['A', 'B'], correctIndex: 0, points: 2 }, 'POST'), QP)
        expect(res.status).toBe(200)
    })

    it('options stored as JSON string', async () => {
        mockSession.mockResolvedValue(FAC)
        await questionAdd(bodyReq({ text: 'Q', type: 'MULTIPLE_CHOICE', options: ['A', 'B'], correctIndex: 0, points: 1 }, 'POST'), QP)
        expect(mockQuestionCreate.mock.calls[0][0].data.options).toBe('["A","B"]')
    })

    it('correctIndices stored as JSON string', async () => {
        mockSession.mockResolvedValue(FAC)
        await questionAdd(bodyReq({ text: 'Q', type: 'CHECKBOX', options: ['A', 'B'], correctIndices: [0, 1], points: 1 }, 'POST'), QP)
        expect(mockQuestionCreate.mock.calls[0][0].data.correctIndices).toBe('[0,1]')
    })

    it('order = max + 1', async () => {
        mockSession.mockResolvedValue(FAC)
        mockQuestionAggregate.mockResolvedValue({ _max: { order: 5 } })
        await questionAdd(bodyReq({ text: 'Q', options: [], correctIndex: 0, points: 1 }, 'POST'), QP)
        expect(mockQuestionCreate.mock.calls[0][0].data.order).toBe(6)
    })

    it('401 – unauthenticated', async () => {
        mockSession.mockResolvedValue(null)
        expect((await questionAdd(bodyReq({ text: 'Q', options: [], correctIndex: 0, points: 1 }, 'POST'), QP)).status).toBe(401)
    })

    it('403 – other faculty blocked', async () => {
        mockSession.mockResolvedValue(OTHER)
        expect((await questionAdd(bodyReq({ text: 'Q', options: [], correctIndex: 0, points: 1 }, 'POST'), QP)).status).toBe(403)
    })
})

// ── PUT questions/:questionId – Update question ───────────────────────────────

describe('PUT /api/quizzes/:id/questions/:qid – Update question', () => {
    const QP = qqp('quiz1', 'q1')

    beforeEach(() => {
        vi.resetAllMocks()
        mockQuizFindUnique.mockResolvedValue(BASE_QUIZ)
        mockQuestionFindUnique.mockResolvedValue({ id: 'q1', quizId: 'quiz1', options: '["A","B"]' })
        mockQuestionUpdate.mockResolvedValue({ id: 'q1', text: 'Updated', options: '["X","Y"]' })
    })

    it('200 – faculty updates question', async () => {
        mockSession.mockResolvedValue(FAC)
        expect((await questionPut(bodyReq({ text: 'Updated', options: ['X', 'Y'] }), QP)).status).toBe(200)
    })

    it('options stringified on update', async () => {
        mockSession.mockResolvedValue(FAC)
        await questionPut(bodyReq({ text: 'Q', options: ['X', 'Y'] }), QP)
        expect(mockQuestionUpdate.mock.calls[0][0].data.options).toBe('["X","Y"]')
    })

    it('404 – question belongs to different quiz', async () => {
        mockSession.mockResolvedValue(FAC)
        mockQuestionFindUnique.mockResolvedValue({ id: 'q1', quizId: 'OTHER_QUIZ' })
        expect((await questionPut(bodyReq({ text: 'X' }), QP)).status).toBe(404)
    })

    it('401 – unauthenticated', async () => {
        mockSession.mockResolvedValue(null)
        expect((await questionPut(bodyReq({ text: 'X' }), QP)).status).toBe(401)
    })
})

// ── DELETE questions/:questionId ──────────────────────────────────────────────

describe('DELETE /api/quizzes/:id/questions/:qid – Delete question', () => {
    const QP = qqp('quiz1', 'q1')

    beforeEach(() => {
        vi.resetAllMocks()
        mockQuizFindUnique.mockResolvedValue(BASE_QUIZ)
        mockQuestionFindUnique.mockResolvedValue({ id: 'q1', quizId: 'quiz1' })
        mockQuestionDelete.mockResolvedValue({})
        mockQuestionCount.mockResolvedValue(1)
        mockQuizUpdate.mockResolvedValue({})
    })

    it('200 – faculty deletes question', async () => {
        mockSession.mockResolvedValue(FAC)
        expect((await questionDel(new Request('http://localhost', { method: 'DELETE' }), QP)).status).toBe(200)
    })

    it('totalQuestions updated after deletion', async () => {
        mockSession.mockResolvedValue(FAC)
        mockQuestionCount.mockResolvedValue(3)
        await questionDel(new Request('http://localhost', { method: 'DELETE' }), QP)
        expect(mockQuizUpdate.mock.calls[0][0].data.totalQuestions).toBe(3)
    })

    it('404 – question not found', async () => {
        mockSession.mockResolvedValue(FAC)
        mockQuestionFindUnique.mockResolvedValue(null)
        expect((await questionDel(new Request('http://localhost', { method: 'DELETE' }), QP)).status).toBe(404)
    })

    it('401 – unauthenticated', async () => {
        mockSession.mockResolvedValue(null)
        expect((await questionDel(new Request('http://localhost', { method: 'DELETE' }), QP)).status).toBe(401)
    })
})
