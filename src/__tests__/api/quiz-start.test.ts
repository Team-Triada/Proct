/**
 * Unit tests for POST /api/quizzes/[id]/start
 * Covers batch/section access control, new attempt creation, and resume logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

const mockQuizFindUnique = vi.fn()
const mockUserFindUnique = vi.fn()
const mockAttemptFindUnique = vi.fn()
const mockAttemptCreate = vi.fn()
const mockAttemptUpdate = vi.fn()

vi.mock('@/lib/db', () => ({
    prisma: {
        quiz: { findUnique: mockQuizFindUnique },
        user: { findUnique: mockUserFindUnique },
        quizAttempt: {
            findUnique: mockAttemptFindUnique,
            create: mockAttemptCreate,
            update: mockAttemptUpdate,
        },
    },
}))

vi.mock('@/lib/utils', () => ({
    normalizeBatch: (b: string) => (b ? b.toUpperCase().trim() : ''),
    normalizeBatches: (bs: string[]) => bs.map((b: string) => b.toUpperCase().trim()),
}))

vi.mock('@/lib/settings', () => ({
    getPlatformSettings: vi.fn().mockResolvedValue({
        enableYearTargeting: true,
        enableSemesterTargeting: true,
        enableBatchTargeting: true,
    }),
}))

// ── Sessions & base data ───────────────────────────────────────────────────────

const STUDENT_SESSION = { user: { id: 's1', role: 'STUDENT', email: 's@y.edu.in' } }
const FACULTY_SESSION = { user: { id: 'f1', role: 'FACULTY', email: 'f@y.edu.in' } }

const BASE_QUIZ = {
    id: 'q1',
    title: 'DS Quiz',
    isPublished: true,
    availableFrom: null,
    availableUntil: null,
    assignedBatches: ['2023-26'],
    targetSection: null,
    timePerQuestion: 30,
    totalQuestions: 2,
    timingMode: 'PER_QUESTION',
    totalDuration: null,
    enforcementMode: 'NORMAL',
    questions: [
        { id: 'q1a', type: 'MULTIPLE_CHOICE', points: 1 },
        { id: 'q1b', type: 'MULTIPLE_CHOICE', points: 1 },
    ],
    subject: { semester: 3 },
}

const BASE_STUDENT = { semester: 3, batch: '2023-26', section: '1' }

function buildRequest(quizId: string, body = {}) {
    return {
        params: Promise.resolve({ id: quizId }),
    }
}

const { POST } = await import('@/app/api/quizzes/[id]/start/route')

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/quizzes/[id]/start', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getServerSession).mockResolvedValue(STUDENT_SESSION)
        mockQuizFindUnique.mockResolvedValue(BASE_QUIZ)
        mockUserFindUnique.mockResolvedValue(BASE_STUDENT)
        mockAttemptFindUnique.mockResolvedValue(null)
        mockAttemptCreate.mockResolvedValue({
            id: 'a1',
            questionOrder: JSON.stringify(['q1a', 'q1b']),
            totalPoints: 2,
            status: 'IN_PROGRESS',
        })
        mockAttemptUpdate.mockResolvedValue({})
    })

    // ── Auth checks ───────────────────────────────────────────────────────────

    it('401 – no session', async () => {
        vi.mocked(getServerSession).mockResolvedValue(null)
        const res = await POST(new Request('http://localhost'), buildRequest('q1') as never)
        expect(res.status).toBe(401)
    })

    it('401 – faculty cannot start a quiz', async () => {
        vi.mocked(getServerSession).mockResolvedValue(FACULTY_SESSION)
        const res = await POST(new Request('http://localhost'), buildRequest('q1') as never)
        expect(res.status).toBe(401)
    })

    // ── Quiz availability ─────────────────────────────────────────────────────

    it('404 – quiz not found', async () => {
        mockQuizFindUnique.mockResolvedValue(null)
        const res = await POST(new Request('http://localhost'), buildRequest('nope') as never)
        expect(res.status).toBe(404)
    })

    it('403 – quiz not published', async () => {
        mockQuizFindUnique.mockResolvedValue({ ...BASE_QUIZ, isPublished: false })
        const res = await POST(new Request('http://localhost'), buildRequest('q1') as never)
        expect(res.status).toBe(403)
        expect((await res.json()).error).toMatch(/not available/i)
    })

    it('403 – before availableFrom', async () => {
        const future = new Date(Date.now() + 60_000)
        mockQuizFindUnique.mockResolvedValue({ ...BASE_QUIZ, availableFrom: future })
        const res = await POST(new Request('http://localhost'), buildRequest('q1') as never)
        expect(res.status).toBe(403)
        expect((await res.json()).error).toMatch(/not yet available/i)
    })

    it('403 – after availableUntil', async () => {
        const past = new Date(Date.now() - 60_000)
        mockQuizFindUnique.mockResolvedValue({ ...BASE_QUIZ, availableUntil: past })
        const res = await POST(new Request('http://localhost'), buildRequest('q1') as never)
        expect(res.status).toBe(403)
        expect((await res.json()).error).toMatch(/no longer available/i)
    })

    // ── Batch/section access control ──────────────────────────────────────────

    it('403 – student batch does not match assignedBatches', async () => {
        mockUserFindUnique.mockResolvedValue({ ...BASE_STUDENT, batch: '2024-27' }) // wrong year
        const res = await POST(new Request('http://localhost'), buildRequest('q1') as never)
        expect(res.status).toBe(403)
        expect((await res.json()).error).toMatch(/not eligible/i)
    })

    it('403 – student has no batch assigned', async () => {
        mockUserFindUnique.mockResolvedValue({ ...BASE_STUDENT, batch: null })
        const res = await POST(new Request('http://localhost'), buildRequest('q1') as never)
        expect(res.status).toBe(403)
    })

    it('200 – student batch matches (case-insensitive)', async () => {
        mockUserFindUnique.mockResolvedValue({ ...BASE_STUDENT, batch: '2023-26' })
        const res = await POST(new Request('http://localhost'), buildRequest('q1') as never)
        expect(res.status).toBe(200)
    })

    it('200 – quiz has no batch restriction, all students allowed', async () => {
        mockQuizFindUnique.mockResolvedValue({ ...BASE_QUIZ, assignedBatches: [] }) // no restriction
        mockUserFindUnique.mockResolvedValue({ ...BASE_STUDENT, batch: '2024-27' })
        const res = await POST(new Request('http://localhost'), buildRequest('q1') as never)
        expect(res.status).toBe(200)
    })

    it('403 – student section does not match targetSection', async () => {
        mockQuizFindUnique.mockResolvedValue({ ...BASE_QUIZ, targetSection: '3' })
        mockUserFindUnique.mockResolvedValue({ ...BASE_STUDENT, section: '1' }) // wrong batch
        const res = await POST(new Request('http://localhost'), buildRequest('q1') as never)
        expect(res.status).toBe(403)
        expect((await res.json()).error).toMatch(/not eligible/i)
    })

    it('200 – student section matches targetSection', async () => {
        mockQuizFindUnique.mockResolvedValue({ ...BASE_QUIZ, targetSection: '2' })
        mockUserFindUnique.mockResolvedValue({ ...BASE_STUDENT, section: '2' })
        const res = await POST(new Request('http://localhost'), buildRequest('q1') as never)
        expect(res.status).toBe(200)
    })

    it('200 – no targetSection means all batches allowed', async () => {
        mockQuizFindUnique.mockResolvedValue({ ...BASE_QUIZ, targetSection: null })
        mockUserFindUnique.mockResolvedValue({ ...BASE_STUDENT, section: '7' })
        const res = await POST(new Request('http://localhost'), buildRequest('q1') as never)
        expect(res.status).toBe(200)
    })

    // ── New attempt ───────────────────────────────────────────────────────────

    it('creates new attempt and returns questionOrder + timeRemaining', async () => {
        const res = await POST(new Request('http://localhost'), buildRequest('q1') as never)
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.attemptId).toBe('a1')
        expect(body.resume).toBe(false)
        expect(body.currentIndex).toBe(0)
        expect(typeof body.timeRemaining).toBe('number')
    })

    it('timeRemaining = timePerQuestion for PER_QUESTION mode', async () => {
        const res = await POST(new Request('http://localhost'), buildRequest('q1') as never)
        const body = await res.json()
        expect(body.timeRemaining).toBe(BASE_QUIZ.timePerQuestion)
    })

    it('timeRemaining = totalDuration * 60 for TOTAL_DURATION mode', async () => {
        mockQuizFindUnique.mockResolvedValue({
            ...BASE_QUIZ, timingMode: 'TOTAL_DURATION', totalDuration: 10,
        })
        const res = await POST(new Request('http://localhost'), buildRequest('q1') as never)
        const body = await res.json()
        expect(body.timeRemaining).toBe(600) // 10 * 60
    })

    it('timeRemaining = 999999 for NO_TIME_LIMIT without availableUntil', async () => {
        mockQuizFindUnique.mockResolvedValue({ ...BASE_QUIZ, timingMode: 'NO_TIME_LIMIT' })
        const res = await POST(new Request('http://localhost'), buildRequest('q1') as never)
        const body = await res.json()
        expect(body.timeRemaining).toBe(999999)
    })

    // ── Resume existing attempt ───────────────────────────────────────────────

    it('resumes IN_PROGRESS attempt without creating a new one', async () => {
        const existingAttempt = {
            id: 'a_existing',
            status: 'IN_PROGRESS',
            currentIndex: 1,
            questionOrder: JSON.stringify(['q1a', 'q1b']),
            timeSpent: 10,
            answers: [{ questionId: 'q1a', selectedIndex: 0 }],
        }
        mockAttemptFindUnique.mockResolvedValue(existingAttempt)
        const res = await POST(new Request('http://localhost'), buildRequest('q1') as never)
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.resume).toBe(true)
        expect(body.attemptId).toBe('a_existing')
        expect(body.currentIndex).toBe(1)
        expect(mockAttemptCreate).not.toHaveBeenCalled()
    })

    it('resume: remaining time = timePerQuestion - timeSpent for PER_QUESTION', async () => {
        mockAttemptFindUnique.mockResolvedValue({
            id: 'a_existing', status: 'IN_PROGRESS', currentIndex: 0,
            questionOrder: JSON.stringify(['q1a', 'q1b']),
            timeSpent: 10, answers: [],
        })
        const res = await POST(new Request('http://localhost'), buildRequest('q1') as never)
        const body = await res.json()
        expect(body.timeRemaining).toBe(20) // 30 - 10 = 20
    })

    it('400 – cannot start an already COMPLETED quiz', async () => {
        mockAttemptFindUnique.mockResolvedValue({
            id: 'a_done', status: 'COMPLETED', currentIndex: 2,
            questionOrder: JSON.stringify(['q1a', 'q1b']),
            timeSpent: 60, answers: [],
        })
        const res = await POST(new Request('http://localhost'), buildRequest('q1') as never)
        expect(res.status).toBe(400)
        expect((await res.json()).error).toMatch(/already completed/i)
    })
})
