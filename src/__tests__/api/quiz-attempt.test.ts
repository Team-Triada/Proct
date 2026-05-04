/**
 * Unit tests for Quiz Attempt Flow
 * Covers:
 * - GET /api/attempts/[id] (Fetch current question)
 * - POST /api/attempts/[id]/save (Save answer / Advance)
 * - POST /api/attempts/[id]/submit (Final submission)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

const mockAttemptFindUnique = vi.fn()
const mockAttemptUpdate = vi.fn()
const mockQuestionFindUnique = vi.fn()
const mockAnswerUpsert = vi.fn()
const mockAnswerFindMany = vi.fn()

vi.mock('@/lib/db', () => ({
    prisma: {
        quizAttempt: {
            findUnique: mockAttemptFindUnique,
            update: mockAttemptUpdate,
        },
        question: {
            findUnique: mockQuestionFindUnique,
        },
        answer: {
            upsert: mockAnswerUpsert,
            findMany: mockAnswerFindMany,
        },
    },
}))

// ── Sessions & Base Data ──────────────────────────────────────────────────────

const STUDENT_SESSION = { user: { id: 's1', role: 'STUDENT', email: 's@y.edu.in' } }

const BASE_QUIZ = {
    id: 'q1',
    timePerQuestion: 30,
    totalQuestions: 2,
    timingMode: 'PER_QUESTION',
    availableUntil: null,
}

const BASE_ATTEMPT = {
    id: 'a1',
    studentId: 's1',
    status: 'IN_PROGRESS',
    currentIndex: 0,
    currentQuestionStartTime: new Date(Date.now() - 5000).toISOString(), // 5s ago
    startedAt: new Date(Date.now() - 10000).toISOString(),
    timeSpent: 5,
    questionOrder: JSON.stringify(['q1_id', 'q2_id']),
    quiz: BASE_QUIZ,
}

const BASE_QUESTION = {
    id: 'q1_id',
    text: 'What is 2+2?',
    type: 'MULTIPLE_CHOICE',
    options: JSON.stringify(['3', '4', '5']),
    correctIndex: 1,
    points: 1,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildParams(id: string) {
    return {
        params: Promise.resolve({ id }),
    }
}

function buildPOSTRequest(url: string, body: any) {
    return new Request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

// ── Import Handlers ───────────────────────────────────────────────────────────

const { GET: getQuestion } = await import('@/app/api/attempts/[id]/route')
const { POST: saveAnswer } = await import('@/app/api/attempts/[id]/save/route')
const { POST: submitQuiz } = await import('@/app/api/attempts/[id]/submit/route')

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Quiz Attempt Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getServerSession).mockResolvedValue(STUDENT_SESSION)
        mockAttemptFindUnique.mockResolvedValue(BASE_ATTEMPT)
        mockQuestionFindUnique.mockResolvedValue(BASE_QUESTION)
    })

    describe('GET /api/attempts/[id] – Fetch current question', () => {
        it('returns shuffled options and mapping', async () => {
            const res = await getQuestion(new Request('http://localhost'), buildParams('a1') as never)
            expect(res.status).toBe(200)
            const body = await res.json()
            expect(body.questionId).toBe('q1_id')
            expect(body.options).toHaveLength(3)
            expect(body.shuffleMapping).toHaveLength(3)
        })

        it('404 – attempt not found', async () => {
            mockAttemptFindUnique.mockResolvedValue(null)
            const res = await getQuestion(new Request('http://localhost'), buildParams('a1') as never)
            expect(res.status).toBe(404)
        })

        it('400 – attempt completed', async () => {
            mockAttemptFindUnique.mockResolvedValue({ ...BASE_ATTEMPT, status: 'COMPLETED' })
            const res = await getQuestion(new Request('http://localhost'), buildParams('a1') as never)
            expect(res.status).toBe(400)
        })
    })

    describe('POST /api/attempts/[id]/save – Save Answer', () => {
        const SAVE_PAYLOAD = {
            questionId: 'q1_id',
            selectedIndex: 1, // '4'
            currentQuestionIndex: 0,
            shuffleMapping: [2, 1, 0],
        }

        it('saves correct answer and awards points', async () => {
            const req = buildPOSTRequest('http://localhost', SAVE_PAYLOAD)
            const res = await saveAnswer(req, buildParams('a1') as never)
            expect(res.status).toBe(200)
            expect(mockAnswerUpsert).toHaveBeenCalledWith(expect.objectContaining({
                update: expect.objectContaining({ isCorrect: true, pointsAwarded: 1 })
            }))
        })

        it('saves incorrect answer and awards 0 points', async () => {
            const req = buildPOSTRequest('http://localhost', { ...SAVE_PAYLOAD, selectedIndex: 0 })
            const res = await saveAnswer(req, buildParams('a1') as never)
            expect(res.status).toBe(200)
            expect(mockAnswerUpsert).toHaveBeenCalledWith(expect.objectContaining({
                update: expect.objectContaining({ isCorrect: false, pointsAwarded: 0 })
            }))
        })

        it('updates attempt progress (advances index)', async () => {
            const payload = { ...SAVE_PAYLOAD, currentQuestionIndex: 1 }
            const req = buildPOSTRequest('http://localhost', payload)
            await saveAnswer(req, buildParams('a1') as never)
            expect(mockAttemptUpdate).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'a1' },
                data: expect.objectContaining({ currentIndex: 1 })
            }))
        })

        it('403 – time limit exceeded (PER_QUESTION)', async () => {
            // Mock attempt started 70s ago (limit is 30s, grace is 30s)
            mockAttemptFindUnique.mockResolvedValue({
                ...BASE_ATTEMPT,
                currentQuestionStartTime: new Date(Date.now() - 70000).toISOString()
            })
            const req = buildPOSTRequest('http://localhost', SAVE_PAYLOAD)
            const res = await saveAnswer(req, buildParams('a1') as never)
            expect(res.status).toBe(403)
            expect((await res.json()).error).toMatch(/time limit exceeded/i)
        })

        it('partial scoring for CHECKBOX questions', async () => {
            mockQuestionFindUnique.mockResolvedValue({
                ...BASE_QUESTION,
                type: 'CHECKBOX',
                correctIndices: JSON.stringify([0, 1]), // 2 correct
                points: 10
            })
            // shuffleMapping [2,1,0]: display index 1 → original 1 (correct), 0 wrong → (1-0)/2 * 10 = 5
            const payload = { ...SAVE_PAYLOAD, selectedIndices: [1] }
            const req = buildPOSTRequest('http://localhost', payload)
            await saveAnswer(req, buildParams('a1') as never)
            expect(mockAnswerUpsert).toHaveBeenCalledWith(expect.objectContaining({
                update: expect.objectContaining({ pointsAwarded: 5 })
            }))
        })

        it('manual grading for SUBJECTIVE questions', async () => {
            mockQuestionFindUnique.mockResolvedValue({
                ...BASE_QUESTION,
                type: 'SHORT_ANSWER',
                points: 10
            })
            const payload = { ...SAVE_PAYLOAD, textAnswer: 'Some answer' }
            const req = buildPOSTRequest('http://localhost', payload)
            await saveAnswer(req, buildParams('a1') as never)
            expect(mockAnswerUpsert).toHaveBeenCalledWith(expect.objectContaining({
                update: expect.objectContaining({ pointsAwarded: null, isCorrect: false })
            }))
        })
    })

    describe('POST /api/attempts/[id]/submit – Final Submission', () => {
        beforeEach(() => {
            mockAnswerFindMany.mockResolvedValue([
                { pointsAwarded: 1 },
                { pointsAwarded: 0 }
            ])
        })

        it('completes attempt and calculates final score', async () => {
            const res = await submitQuiz(new Request('http://localhost', { method: 'POST' }), buildParams('a1') as never)
            expect(res.status).toBe(200)
            const body = await res.json()
            expect(body.completed).toBe(true)
            expect(body.score).toBe(1)
            expect(mockAttemptUpdate).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ status: 'COMPLETED', score: 1 })
            }))
        })

        it('404 – attempt not found or wrong user', async () => {
            mockAttemptFindUnique.mockResolvedValue(null)
            const res = await submitQuiz(new Request('http://localhost', { method: 'POST' }), buildParams('a1') as never)
            expect(res.status).toBe(404)
        })
    })
})
