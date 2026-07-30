/**
 * Edge-case tests — boundary conditions and unexpected inputs.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindUnique  = vi.fn()
const mockCreate      = vi.fn()
const mockUpdate      = vi.fn()
const mockTransaction = vi.fn()
const mockDeleteMany  = vi.fn()
const mockUpsert      = vi.fn()

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/db', () => ({
    prisma: {
        user:             { findUnique: mockFindUnique, create: mockCreate, update: mockUpdate },
        quiz:             { findUnique: mockFindUnique, update: mockUpdate },
        question:         { findUnique: mockFindUnique, create: mockCreate },
        quizAttempt:      { findUnique: mockFindUnique, create: mockCreate, update: mockUpdate },
        answer:           { update: mockUpdate },
        violationLog:     { create: mockCreate },
        platformSettings: { upsert: mockUpsert },
        $transaction:     mockTransaction,
    },
}))

const mockGetPlatformSettings  = vi.fn()
const mockValidateFieldFormat   = vi.fn()
const mockMatchesQuizTargeting  = vi.fn()

vi.mock('@/lib/settings', () => ({
    getPlatformSettings: mockGetPlatformSettings,
    validateFieldFormat: mockValidateFieldFormat,
}))
vi.mock('@/lib/quizFilters', () => ({ matchesQuizTargeting: mockMatchesQuizTargeting }))
vi.mock('bcryptjs', () => ({
    default: { hash: vi.fn(() => 'hashed'), compare: vi.fn().mockResolvedValue(true) },
    hash: vi.fn(() => 'hashed'), compare: vi.fn().mockResolvedValue(true),
}))

import { getServerSession } from 'next-auth'
const mockSession = getServerSession as ReturnType<typeof vi.fn>

const DEFAULT_SETTINGS = {
    allowedEmailDomains: [], studentIdLabel: 'Campus ID', studentIdFormat: 'ANY',
    studentIdMinLength: 1, studentIdMaxLength: 50, studentIdRequired: false,
    rollNumberLabel: 'Roll', rollNumberFormat: 'ANY', rollNumberMinLength: 1, rollNumberMaxLength: 50, rollNumberRequired: true,
    maxSemester: 8, availableBatches: [], maxBatchNumber: 13,
    enableYearTargeting: true, enableSemesterTargeting: true, enableBatchTargeting: true,
}

const SETTINGS_ROW = {
    id: 1, allowedEmailDomains: '[]', availableBatches: '[]',
    studentIdLabel: 'Campus ID', studentIdFormat: 'ANY', studentIdMinLength: 1, studentIdMaxLength: 50, studentIdRequired: false,
    rollNumberLabel: 'Roll', rollNumberFormat: 'ANY', rollNumberMinLength: 1, rollNumberMaxLength: 50, rollNumberRequired: true,
    maxSemester: 8, maxBatchNumber: 13, enableYearTargeting: true, enableSemesterTargeting: true, enableBatchTargeting: true, updatedAt: new Date(),
}

const { POST: register }     = await import('@/app/api/auth/register/route')
const { POST: startQuiz }    = await import('@/app/api/quizzes/[id]/start/route')
const { POST: logViolation } = await import('@/app/api/attempts/[id]/violation/route')
const { POST: logReload }    = await import('@/app/api/attempts/[id]/reload/route')
const { POST: submitAnswer } = await import('@/app/api/attempts/[id]/route')
const { PUT: settingsPut }   = await import('@/app/api/admin/settings/route')

function req(body: object, method = 'POST') {
    return new Request('http://localhost', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}
function params(obj: Record<string, string>) { return { params: Promise.resolve(obj) } as never }

// ── Register edge cases ───────────────────────────────────────────────────────

describe('Register – edge cases', () => {
    const VALID = { name: 'Alice', email: 'alice@y.edu', password: 'Abc@1234', rollNumber: 'R001', batch: '2023-26', semester: '3', section: '1' }

    beforeEach(() => {
        vi.resetAllMocks()
        mockGetPlatformSettings.mockResolvedValue(DEFAULT_SETTINGS)
        mockValidateFieldFormat.mockReturnValue(true)
        mockFindUnique.mockResolvedValue(null)
        mockCreate.mockResolvedValue({ id: 'u1', name: 'Alice', email: 'alice@y.edu', rollNumber: 'R001' })
    })

    it('duplicate email returns 409 before requiring all fields', async () => {
        mockFindUnique.mockResolvedValueOnce({ id: 'existing' })
        const res = await register(req({ name: 'X', email: 'alice@y.edu', password: 'Abc@1234' }))
        expect(res.status).toBe(409)
        expect((await res.json()).error).toMatch(/already registered/i)
    })

    it('semester 0 rejected', async () => {
        expect((await register(req({ ...VALID, semester: '0' }))).status).toBe(400)
    })

    it('semester 9 rejected (max 8)', async () => {
        expect((await register(req({ ...VALID, semester: '9' }))).status).toBe(400)
    })

    it('semester 8 accepted (at boundary)', async () => {
        expect((await register(req({ ...VALID, semester: '8' }))).status).toBe(201)
    })

    it('exactly 8-char password with all requirements accepted', async () => {
        expect((await register(req({ ...VALID, password: 'Ab1!abcd' }))).status).toBe(201)
    })

    it('7-char password rejected', async () => {
        expect((await register(req({ ...VALID, password: 'Ab1!abc' }))).status).toBe(400)
    })

    it('semester string parsed to integer', async () => {
        await register(req(VALID))
        expect(mockCreate.mock.calls[0]?.[0]?.data?.semester).toBe(3)
    })

    it('missing name → 400', async () => {
        expect((await register(req({ email: 'x@y.edu', password: 'Abc@1234', rollNumber: 'R1', batch: '2023-26', semester: '3', section: '1' }))).status).toBe(400)
    })

    it('missing batch/semester/section → 400', async () => {
        expect((await register(req({ name: 'X', email: 'x@y.edu', password: 'Abc@1234', rollNumber: 'R1' }))).status).toBe(400)
    })
})

// ── Quiz start edge cases ─────────────────────────────────────────────────────

describe('Quiz start – edge cases', () => {
    const QUIZ = {
        id: 'quiz1', isPublished: true, availableFrom: null, availableUntil: null,
        timingMode: 'PER_QUESTION', timePerQuestion: 60, totalQuestions: 1,
        assignedBatches: null, targetSection: null, targetSemester: null,
        subject: { semester: 3 }, questions: [{ id: 'q1' }],
    }
    const STUDENT = { semester: 3, batch: '2023-26', section: '1' }

    beforeEach(() => {
        vi.resetAllMocks()
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
        mockGetPlatformSettings.mockResolvedValue(DEFAULT_SETTINGS)
        mockMatchesQuizTargeting.mockReturnValue(true)
        mockCreate.mockResolvedValue({ id: 'a1', questionOrder: '["q1"]', currentIndex: 0, timeSpent: 0 })
    })

    it('403 – unpublished quiz', async () => {
        mockFindUnique.mockResolvedValue({ ...QUIZ, isPublished: false })
        const res = await startQuiz(req({}), params({ id: 'quiz1' }))
        expect(res.status).toBe(403)
        expect((await res.json()).error).toMatch(/not available/i)
    })

    it('403 – future availableFrom', async () => {
        mockFindUnique.mockResolvedValue({ ...QUIZ, availableFrom: new Date(Date.now() + 86400000) })
        expect((await startQuiz(req({}), params({ id: 'quiz1' }))).status).toBe(403)
    })

    it('403 – past availableUntil', async () => {
        mockFindUnique.mockResolvedValue({ ...QUIZ, availableUntil: new Date(Date.now() - 86400000) })
        expect((await startQuiz(req({}), params({ id: 'quiz1' }))).status).toBe(403)
    })

    it('403 – semester mismatch', async () => {
        mockFindUnique
            .mockResolvedValueOnce(QUIZ)
            .mockResolvedValueOnce({ semester: 5, batch: '2023-26', section: '1' })
            .mockResolvedValueOnce(null)
        expect((await startQuiz(req({}), params({ id: 'quiz1' }))).status).toBe(403)
    })

    it('400 – already completed', async () => {
        mockFindUnique
            .mockResolvedValueOnce(QUIZ)
            .mockResolvedValueOnce(STUDENT)
            .mockResolvedValueOnce({ id: 'a1', status: 'COMPLETED', answers: [] })
        const res = await startQuiz(req({}), params({ id: 'quiz1' }))
        expect(res.status).toBe(400)
        expect((await res.json()).error).toMatch(/already completed/i)
    })

    it('resumes IN_PROGRESS attempt', async () => {
        const existing = { id: 'a1', status: 'IN_PROGRESS', currentIndex: 0, questionOrder: '["q1"]', timeSpent: 30, quiz: { timingMode: 'PER_QUESTION', timePerQuestion: 60, totalQuestions: 1 }, answers: [] }
        mockFindUnique
            .mockResolvedValueOnce(QUIZ)
            .mockResolvedValueOnce(STUDENT)
            .mockResolvedValueOnce(existing)
        const res = await startQuiz(req({}), params({ id: 'quiz1' }))
        expect(res.status).toBe(200)
        expect((await res.json()).resume).toBe(true)
        expect(mockCreate).not.toHaveBeenCalled()
    })

    it('404 – quiz not found', async () => {
        mockFindUnique.mockResolvedValue(null)
        expect((await startQuiz(req({}), params({ id: 'ghost' }))).status).toBe(404)
    })
})

// ── Violation edge cases ──────────────────────────────────────────────────────

describe('Violation logging – edge cases', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
        mockCreate.mockResolvedValue({})
        mockUpdate.mockResolvedValue({ violationCount: 1 })
    })

    it('400 – completed attempt', async () => {
        mockFindUnique.mockResolvedValue({ id: 'a1', studentId: 's1', status: 'COMPLETED' })
        const res = await logViolation(req({ type: 'TAB_SWITCH' }), params({ id: 'a1' }))
        expect(res.status).toBe(400)
        expect((await res.json()).error).toMatch(/already submitted/i)
    })

    it('404 – wrong user', async () => {
        mockFindUnique.mockResolvedValue({ id: 'a1', studentId: 'OTHER', status: 'IN_PROGRESS' })
        expect((await logViolation(req({ type: 'TAB_SWITCH' }), params({ id: 'a1' }))).status).toBe(404)
    })

    it('404 – not found', async () => {
        mockFindUnique.mockResolvedValue(null)
        expect((await logViolation(req({ type: 'TAB_SWITCH' }), params({ id: 'x' }))).status).toBe(404)
    })

    it('violationCount incremented atomically', async () => {
        mockFindUnique.mockResolvedValue({ id: 'a1', studentId: 's1', status: 'IN_PROGRESS' })
        mockUpdate.mockResolvedValue({ violationCount: 5 })
        const body = await (await logViolation(req({ type: 'DEVTOOLS_OPENED' }), params({ id: 'a1' }))).json()
        expect(body.violationCount).toBe(5)
        expect(mockUpdate.mock.calls[0][0].data.violationCount).toEqual({ increment: 1 })
    })
})

// ── Reload edge cases ─────────────────────────────────────────────────────────

describe('Reload logging – edge cases', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
        mockCreate.mockResolvedValue({})
        mockTransaction.mockImplementation(async (ops: unknown[]) => Promise.all(ops))
    })

    it('400 – completed attempt', async () => {
        mockFindUnique.mockResolvedValue({ id: 'a1', studentId: 's1', status: 'COMPLETED' })
        expect((await logReload(req({}), params({ id: 'a1' }))).status).toBe(400)
    })

    it('third reload logs violation', async () => {
        mockFindUnique.mockResolvedValue({ id: 'a1', studentId: 's1', status: 'IN_PROGRESS' })
        mockUpdate.mockResolvedValue({ reloadCount: 3 })
        const body = await (await logReload(req({}), params({ id: 'a1' }))).json()
        expect(body.violationLogged).toBe(true)
    })

    it('second reload warns, no violation', async () => {
        mockFindUnique.mockResolvedValue({ id: 'a1', studentId: 's1', status: 'IN_PROGRESS' })
        mockUpdate.mockResolvedValue({ reloadCount: 2 })
        const body = await (await logReload(req({}), params({ id: 'a1' }))).json()
        expect(body.violationLogged).toBe(false)
        expect(body.message).toMatch(/next reload/i)
    })

    it('first reload — no violation', async () => {
        mockFindUnique.mockResolvedValue({ id: 'a1', studentId: 's1', status: 'IN_PROGRESS' })
        mockUpdate.mockResolvedValue({ reloadCount: 1 })
        expect((await (await logReload(req({}), params({ id: 'a1' }))).json()).violationLogged).toBe(false)
    })
})

// ── Answer submission edge cases ──────────────────────────────────────────────

describe('Answer submission – edge cases', () => {
    const MCQ = { id: 'q1', type: 'MULTIPLE_CHOICE', options: '["A","B","C"]', correctIndex: 1, correctIndices: '[]', points: 5, quizId: 'quiz1' }
    const ATTEMPT = { id: 'a1', studentId: 's1', status: 'IN_PROGRESS', currentIndex: 0, questionOrder: '["q1"]', quiz: { id: 'quiz1', timingMode: 'NO_TIME_LIMIT', timePerQuestion: 60, availableUntil: null, showScore: true, showAnswers: false } }

    beforeEach(() => {
        vi.resetAllMocks()
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
        mockFindUnique.mockResolvedValueOnce(ATTEMPT).mockResolvedValueOnce(MCQ)
        mockUpdate.mockResolvedValue({ id: 'a1', score: 5, status: 'COMPLETED' })
        mockCreate.mockResolvedValue({})
    })

    it('400 – completed attempt', async () => {
        mockFindUnique.mockReset()
        mockFindUnique.mockResolvedValueOnce({ ...ATTEMPT, status: 'COMPLETED' })
        expect((await submitAnswer(req({ selectedIndex: 1, questionIndex: 0 }), params({ id: 'a1' }))).status).toBe(400)
    })

    it('404 – another user\'s attempt (info-safe 404, not 403)', async () => {
        mockFindUnique.mockReset()
        // Route returns 404 for both "not found" and "wrong user" to prevent leaking existence
        mockFindUnique.mockResolvedValueOnce({ ...ATTEMPT, studentId: 'OTHER_STUDENT' })
        expect((await submitAnswer(req({ selectedIndex: 1 }), params({ id: 'a1' }))).status).toBe(404)
    })

    it('401 – unauthenticated', async () => {
        mockSession.mockResolvedValue(null)
        expect((await submitAnswer(req({ selectedIndex: 1 }), params({ id: 'a1' }))).status).toBe(401)
    })
})

// ── Admin settings format validation ─────────────────────────────────────────

describe('Admin settings – format validation', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mockSession.mockResolvedValue({ user: { id: 'admin1', role: 'ADMIN' } })
        mockUpsert.mockResolvedValue(SETTINGS_ROW)
    })

    it.each(['NUMERIC', 'ALPHA', 'ALPHANUMERIC', 'ANY'])('format %s accepted', async (fmt) => {
        const res = await settingsPut(new Request('http://localhost', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentIdFormat: fmt }) }))
        expect(res.status).toBe(200)
    })

    it('lowercase format rejected', async () => {
        const res = await settingsPut(new Request('http://localhost', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentIdFormat: 'numeric' }) }))
        expect(res.status).toBe(400)
    })

    it('empty arrays accepted', async () => {
        const res = await settingsPut(new Request('http://localhost', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ allowedEmailDomains: [], availableBatches: [] }) }))
        expect(res.status).toBe(200)
    })
})
