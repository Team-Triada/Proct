/**
 * Integration tests for quiz eligibility — covering:
 *   1. The hard subject-semester check (immutable, not flag-controlled)
 *   2. matchesQuizTargeting() applied by the quiz start API
 *   3. matchesQuizTargeting() applied by the quiz GET API
 *   4. All combinations students encounter when quiz lists are filtered
 *
 * These tests use real matchesQuizTargeting() (not mocked) to verify
 * the full eligibility pipeline.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockFindUnique = vi.fn()
const mockCreate     = vi.fn()
const mockUpdate     = vi.fn()
const mockGetSettings = vi.fn()

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/db', () => ({
    prisma: {
        quiz:        { findUnique: mockFindUnique },
        user:        { findUnique: mockFindUnique },
        quizAttempt: { findUnique: mockFindUnique, create: mockCreate, update: mockUpdate },
        question:    { findUnique: mockFindUnique },
    },
}))
vi.mock('@/lib/settings', () => ({
    getPlatformSettings: mockGetSettings,
    validateFieldFormat: vi.fn().mockReturnValue(true),
}))
// Use REAL matchesQuizTargeting — this is what we're testing end-to-end
vi.mock('@/lib/quizFilters', async (importOriginal) => {
    const real = await importOriginal<typeof import('@/lib/quizFilters')>()
    return { matchesQuizTargeting: real.matchesQuizTargeting }
})

import { getServerSession } from 'next-auth'
const mockSession = getServerSession as ReturnType<typeof vi.fn>

const { POST: startQuiz } = await import('@/app/api/quizzes/[id]/start/route')
const { GET: getQuiz }    = await import('@/app/api/quizzes/[id]/route')

// ── Shared fixtures ───────────────────────────────────────────────────────────

const ALL_FLAGS = {
    allowedEmailDomains: [], studentIdLabel: 'Campus ID', studentIdFormat: 'ANY',
    studentIdMinLength: 1, studentIdMaxLength: 50, studentIdRequired: false,
    rollNumberLabel: 'Roll', rollNumberFormat: 'ANY', rollNumberMinLength: 1,
    rollNumberMaxLength: 50, rollNumberRequired: true, maxSemester: 8, availableBatches: [],
    maxBatchNumber: 13,
    enableYearTargeting: true, enableSemesterTargeting: true, enableBatchTargeting: true,
}
const NO_TARGETING = { ...ALL_FLAGS, enableYearTargeting: false, enableSemesterTargeting: false, enableBatchTargeting: false }

function baseQuiz(overrides: Record<string, unknown> = {}) {
    return {
        id: 'q1', title: 'Test', facultyId: 'f1', subjectId: 'sub1',
        isPublished: true, availableFrom: null, availableUntil: null,
        timingMode: 'PER_QUESTION', timePerQuestion: 60, totalQuestions: 1,
        assignedBatches: null, targetSection: null, targetSemester: null,
        subject: { semester: 3 },
        questions: [{ id: 'qs1' }],
        ...overrides,
    }
}

function params(id = 'q1') { return { params: Promise.resolve({ id }) } as never }
function req(body = {}) { return new Request('http://localhost', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) }

// ── PART 1: Hard subject-semester check (immutable) ──────────────────────────

describe('Hard subject-semester check (not flag-controlled)', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mockGetSettings.mockResolvedValue(ALL_FLAGS)
        mockCreate.mockResolvedValue({ id: 'a1', questionOrder: '["qs1"]', currentIndex: 0, timeSpent: 0 })
    })

    it('student semester MATCHES subject semester → passes hard check', async () => {
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
        mockFindUnique
            .mockResolvedValueOnce(baseQuiz()) // quiz (subject.semester = 3)
            .mockResolvedValueOnce({ semester: 3, batch: '2023-26', section: '1' }) // student
            .mockResolvedValueOnce(null) // no existing attempt
        const res = await startQuiz(req(), params())
        expect(res.status).toBe(200)
    })

    it('student semester MISMATCHES subject semester → 403 regardless of flags', async () => {
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
        // Subject is semester 3, student is semester 5
        mockFindUnique
            .mockResolvedValueOnce(baseQuiz()) // subject.semester=3
            .mockResolvedValueOnce({ semester: 5, batch: '2023-26', section: '1' }) // student sem 5
            .mockResolvedValueOnce(null)
        const res = await startQuiz(req(), params())
        expect(res.status).toBe(403)
        expect((await res.json()).error).toMatch(/not eligible/i)
    })

    it('hard check blocks even when all targeting flags are disabled', async () => {
        mockGetSettings.mockResolvedValue(NO_TARGETING)
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
        mockFindUnique
            .mockResolvedValueOnce(baseQuiz({ subject: { semester: 1 } })) // semester 1 subject
            .mockResolvedValueOnce({ semester: 3, batch: '2023-26', section: '1' }) // student sem 3
            .mockResolvedValueOnce(null)
        const res = await startQuiz(req(), params())
        expect(res.status).toBe(403)
    })

    it('student with null semester passes hard check (null !== semester treated as pass)', async () => {
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
        mockFindUnique
            .mockResolvedValueOnce(baseQuiz())
            .mockResolvedValueOnce({ semester: null, batch: '2023-26', section: '1' }) // null semester
            .mockResolvedValueOnce(null)
        const res = await startQuiz(req(), params())
        // null !== 3 is true BUT the check is `student.semester !== null && quiz.subject.semester !== student.semester`
        // student.semester IS null → condition short-circuits → passes
        expect(res.status).toBe(200)
    })

    it('quiz start is only available to STUDENT role', async () => {
        mockSession.mockResolvedValue({ user: { id: 'f1', role: 'FACULTY' } })
        mockFindUnique.mockResolvedValueOnce(baseQuiz())
        const res = await startQuiz(req(), params())
        expect(res.status).toBe(401)
    })
})

// ── PART 2: Year (batch) targeting via API ────────────────────────────────────

describe('Year targeting — quiz start API', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mockGetSettings.mockResolvedValue(ALL_FLAGS)
        mockCreate.mockResolvedValue({ id: 'a1', questionOrder: '["qs1"]', currentIndex: 0, timeSpent: 0 })
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
    })

    it('student in assigned batch → eligible', async () => {
        mockFindUnique
            .mockResolvedValueOnce(baseQuiz({ assignedBatches: ['2023-26'] }))
            .mockResolvedValueOnce({ semester: 3, batch: '2023-26', section: '1' })
            .mockResolvedValueOnce(null)
        expect((await startQuiz(req(), params())).status).toBe(200)
    })

    it('student NOT in assigned batch → 403', async () => {
        mockFindUnique
            .mockResolvedValueOnce(baseQuiz({ assignedBatches: ['2023-26'] }))
            .mockResolvedValueOnce({ semester: 3, batch: '2024-27', section: '1' })
            .mockResolvedValueOnce(null)
        const res = await startQuiz(req(), params())
        expect(res.status).toBe(403)
        expect((await res.json()).error).toMatch(/not eligible/i)
    })

    it('student in one of multiple assigned batches → eligible', async () => {
        mockFindUnique
            .mockResolvedValueOnce(baseQuiz({ assignedBatches: ['2022-25', '2023-26', '2024-27'] }))
            .mockResolvedValueOnce({ semester: 3, batch: '2023-26', section: '1' })
            .mockResolvedValueOnce(null)
        expect((await startQuiz(req(), params())).status).toBe(200)
    })

    it('year targeting disabled → batch mismatch still starts quiz', async () => {
        mockGetSettings.mockResolvedValue({ ...ALL_FLAGS, enableYearTargeting: false })
        mockFindUnique
            .mockResolvedValueOnce(baseQuiz({ assignedBatches: ['2023-26'] }))
            .mockResolvedValueOnce({ semester: 3, batch: '2099-99', section: '1' }) // wrong batch
            .mockResolvedValueOnce(null)
        expect((await startQuiz(req(), params())).status).toBe(200)
    })
})

// ── PART 3: Section targeting via API ─────────────────────────────────────────

describe('Section targeting — quiz start API', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mockGetSettings.mockResolvedValue(ALL_FLAGS)
        mockCreate.mockResolvedValue({ id: 'a1', questionOrder: '["qs1"]', currentIndex: 0, timeSpent: 0 })
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
    })

    it('student section matches targetSection → eligible', async () => {
        mockFindUnique
            .mockResolvedValueOnce(baseQuiz({ targetSection: '1' }))
            .mockResolvedValueOnce({ semester: 3, batch: '2023-26', section: '1' })
            .mockResolvedValueOnce(null)
        expect((await startQuiz(req(), params())).status).toBe(200)
    })

    it('student section mismatches targetSection → 403', async () => {
        mockFindUnique
            .mockResolvedValueOnce(baseQuiz({ targetSection: '1' }))
            .mockResolvedValueOnce({ semester: 3, batch: '2023-26', section: '2' })
            .mockResolvedValueOnce(null)
        const res = await startQuiz(req(), params())
        expect(res.status).toBe(403)
    })

    it('batch targeting disabled → section mismatch still allowed', async () => {
        mockGetSettings.mockResolvedValue({ ...ALL_FLAGS, enableBatchTargeting: false })
        mockFindUnique
            .mockResolvedValueOnce(baseQuiz({ targetSection: '1' }))
            .mockResolvedValueOnce({ semester: 3, batch: '2023-26', section: '9' })
            .mockResolvedValueOnce(null)
        expect((await startQuiz(req(), params())).status).toBe(200)
    })
})

// ── PART 4: Quiz-level semester targeting via API ─────────────────────────────

describe('Quiz-level semester targeting — quiz start API', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mockGetSettings.mockResolvedValue(ALL_FLAGS)
        mockCreate.mockResolvedValue({ id: 'a1', questionOrder: '["qs1"]', currentIndex: 0, timeSpent: 0 })
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
    })

    it('student semester matches quiz targetSemester → eligible', async () => {
        mockFindUnique
            .mockResolvedValueOnce(baseQuiz({ targetSemester: 3 }))
            .mockResolvedValueOnce({ semester: 3, batch: '2023-26', section: '1' })
            .mockResolvedValueOnce(null)
        expect((await startQuiz(req(), params())).status).toBe(200)
    })

    it('student semester mismatches quiz targetSemester → 403', async () => {
        mockFindUnique
            .mockResolvedValueOnce(baseQuiz({ targetSemester: 5 }))
            .mockResolvedValueOnce({ semester: 3, batch: '2023-26', section: '1' })
            .mockResolvedValueOnce(null)
        const res = await startQuiz(req(), params())
        expect(res.status).toBe(403)
    })

    it('semester targeting disabled → targetSemester mismatch allowed', async () => {
        mockGetSettings.mockResolvedValue({ ...ALL_FLAGS, enableSemesterTargeting: false })
        mockFindUnique
            .mockResolvedValueOnce(baseQuiz({ targetSemester: 5 }))
            .mockResolvedValueOnce({ semester: 3, batch: '2023-26', section: '1' })
            .mockResolvedValueOnce(null)
        expect((await startQuiz(req(), params())).status).toBe(200)
    })
})

// ── PART 5: All three dimensions combined ─────────────────────────────────────

describe('Combined targeting — all three dimensions via API', () => {
    const FULLY_TARGETED_QUIZ = {
        assignedBatches: ['2023-26'],
        targetSection: '1',
        targetSemester: 3,
    }

    beforeEach(() => {
        vi.resetAllMocks()
        mockGetSettings.mockResolvedValue(ALL_FLAGS)
        mockCreate.mockResolvedValue({ id: 'a1', questionOrder: '["qs1"]', currentIndex: 0, timeSpent: 0 })
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
    })

    it('perfect match on all three → eligible', async () => {
        mockFindUnique
            .mockResolvedValueOnce(baseQuiz(FULLY_TARGETED_QUIZ))
            .mockResolvedValueOnce({ semester: 3, batch: '2023-26', section: '1' })
            .mockResolvedValueOnce(null)
        expect((await startQuiz(req(), params())).status).toBe(200)
    })

    it('wrong year, correct section and semester → 403', async () => {
        mockFindUnique
            .mockResolvedValueOnce(baseQuiz(FULLY_TARGETED_QUIZ))
            .mockResolvedValueOnce({ semester: 3, batch: '2024-27', section: '1' }) // wrong batch
            .mockResolvedValueOnce(null)
        expect((await startQuiz(req(), params())).status).toBe(403)
    })

    it('correct year, wrong section, correct semester → 403', async () => {
        mockFindUnique
            .mockResolvedValueOnce(baseQuiz(FULLY_TARGETED_QUIZ))
            .mockResolvedValueOnce({ semester: 3, batch: '2023-26', section: '2' }) // wrong section
            .mockResolvedValueOnce(null)
        expect((await startQuiz(req(), params())).status).toBe(403)
    })

    it('correct year, correct section, wrong semester → 403', async () => {
        mockFindUnique
            .mockResolvedValueOnce(baseQuiz(FULLY_TARGETED_QUIZ))
            .mockResolvedValueOnce({ semester: 5, batch: '2023-26', section: '1' }) // wrong semester
            .mockResolvedValueOnce(null)
        expect((await startQuiz(req(), params())).status).toBe(403)
    })

    it('all flags disabled → all restrictions lifted', async () => {
        mockGetSettings.mockResolvedValue(NO_TARGETING)
        mockFindUnique
            .mockResolvedValueOnce(baseQuiz(FULLY_TARGETED_QUIZ))
            .mockResolvedValueOnce({ semester: 3, batch: '2099-99', section: '9' }) // nothing matches
            .mockResolvedValueOnce(null)
        // Note: hard subject-semester check still applies since semester=3 matches subject.semester=3
        expect((await startQuiz(req(), params())).status).toBe(200)
    })
})

// ── PART 6: Student GET quiz visibility ───────────────────────────────────────

describe('Student quiz visibility — GET /api/quizzes/:id', () => {
    const FULL_QUIZ_WITH_QUESTIONS = {
        ...baseQuiz(),
        questions: [
            { id: 'q1', text: 'Q1', type: 'MULTIPLE_CHOICE', options: '["A","B"]', correctIndex: 0, correctIndices: '[]', order: 1, points: 5 },
        ],
        _count: { attempts: 0 },
    }

    beforeEach(() => {
        vi.resetAllMocks()
        mockGetSettings.mockResolvedValue(ALL_FLAGS)
    })

    it('student matching targeting → 200, correct answers hidden', async () => {
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
        mockFindUnique
            .mockResolvedValueOnce(FULL_QUIZ_WITH_QUESTIONS)
            .mockResolvedValueOnce({ semester: 3, batch: '2023-26', section: '1' })
        const res = await getQuiz(new Request('http://localhost'), params())
        expect(res.status).toBe(200)
        const body = await res.json()
        // Correct answers must not be exposed to students
        body.questions.forEach((q: Record<string, unknown>) => {
            expect(q).not.toHaveProperty('correctIndex')
        })
    })

    it('student NOT matching batch → 403', async () => {
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
        mockFindUnique
            .mockResolvedValueOnce({ ...FULL_QUIZ_WITH_QUESTIONS, assignedBatches: ['2023-26'] })
            .mockResolvedValueOnce({ semester: 3, batch: '2024-27', section: '1' }) // wrong batch
        const res = await getQuiz(new Request('http://localhost'), params())
        expect(res.status).toBe(403)
    })

    it('faculty sees correct answers regardless of targeting', async () => {
        mockSession.mockResolvedValue({ user: { id: 'f1', role: 'FACULTY' } })
        mockFindUnique.mockResolvedValueOnce(FULL_QUIZ_WITH_QUESTIONS)
        const res = await getQuiz(new Request('http://localhost'), params())
        expect(res.status).toBe(200)
        const body = await res.json()
        // Faculty should see correctIndex
        expect(body.questions[0]).toHaveProperty('correctIndex')
    })

    it('admin sees any quiz with correct answers', async () => {
        mockSession.mockResolvedValue({ user: { id: 'a1', role: 'ADMIN' } })
        mockFindUnique.mockResolvedValueOnce(FULL_QUIZ_WITH_QUESTIONS)
        const res = await getQuiz(new Request('http://localhost'), params())
        expect(res.status).toBe(200)
    })
})

// ── PART 7: Affected student scenarios (real-world) ───────────────────────────

describe('Real-world student scenarios', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mockGetSettings.mockResolvedValue(ALL_FLAGS)
        mockCreate.mockResolvedValue({ id: 'a1', questionOrder: '["qs1"]', currentIndex: 0, timeSpent: 0 })
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
    })

    it('Scenario: John (3rd sem, 2023-26, batch 1) can access his semester quiz', async () => {
        const JOHNS_QUIZ = baseQuiz({ assignedBatches: ['2023-26'], targetSection: '1' })
        const JOHN = { semester: 3, batch: '2023-26', section: '1' }
        mockFindUnique.mockResolvedValueOnce(JOHNS_QUIZ).mockResolvedValueOnce(JOHN).mockResolvedValueOnce(null)
        expect((await startQuiz(req(), params())).status).toBe(200)
    })

    it('Scenario: Jane (3rd sem, 2023-26, batch 2) is BLOCKED from batch 1 quiz', async () => {
        const JOHNS_QUIZ = baseQuiz({ assignedBatches: ['2023-26'], targetSection: '1' })
        const JANE = { semester: 3, batch: '2023-26', section: '2' } // different batch
        mockFindUnique.mockResolvedValueOnce(JOHNS_QUIZ).mockResolvedValueOnce(JANE).mockResolvedValueOnce(null)
        const res = await startQuiz(req(), params())
        expect(res.status).toBe(403) // Jane can't access John's batch quiz
    })

    it('Scenario: 5th sem student blocked from 3rd sem subject quiz (hard check)', async () => {
        const SEM3_QUIZ = baseQuiz() // subject.semester = 3
        const SEM5_STUDENT = { semester: 5, batch: '2021-24', section: '1' }
        mockFindUnique.mockResolvedValueOnce(SEM3_QUIZ).mockResolvedValueOnce(SEM5_STUDENT).mockResolvedValueOnce(null)
        const res = await startQuiz(req(), params())
        expect(res.status).toBe(403)
    })

    it('Scenario: Open quiz (no restrictions) accessible to any semester 3 student', async () => {
        const OPEN_QUIZ = baseQuiz() // no restrictions
        const ANY_STUDENT = { semester: 3, batch: '2024-27', section: '5' }
        mockFindUnique.mockResolvedValueOnce(OPEN_QUIZ).mockResolvedValueOnce(ANY_STUDENT).mockResolvedValueOnce(null)
        expect((await startQuiz(req(), params())).status).toBe(200)
    })

    it('Scenario: 2022-25 batch student cannot access quiz meant for 2023-26 batch', async () => {
        const QUIZ_FOR_23 = baseQuiz({ assignedBatches: ['2023-26'] })
        const OLD_STUDENT = { semester: 3, batch: '2022-25', section: '1' }
        mockFindUnique.mockResolvedValueOnce(QUIZ_FOR_23).mockResolvedValueOnce(OLD_STUDENT).mockResolvedValueOnce(null)
        expect((await startQuiz(req(), params())).status).toBe(403)
    })

    it('Scenario: Batch-1 only quiz not visible to batch-2 student (GET)', async () => {
        mockSession.mockResolvedValue({ user: { id: 's2', role: 'STUDENT' } })
        mockFindUnique
            .mockResolvedValueOnce({ ...baseQuiz({ targetSection: '1' }), questions: [], _count: { attempts: 0 } })
            .mockResolvedValueOnce({ semester: 3, batch: '2023-26', section: '2' }) // batch 2
        const res = await getQuiz(new Request('http://localhost'), params())
        expect(res.status).toBe(403)
    })

    it('Scenario: Targeting flags all OFF = quiz admin made it accessible to all', async () => {
        mockGetSettings.mockResolvedValue(NO_TARGETING)
        const RESTRICTED_QUIZ = baseQuiz({ assignedBatches: ['2023-26'], targetSection: '1', targetSemester: 3 })
        const MISMATCHING_STUDENT = { semester: 3, batch: '2024-27', section: '9' }
        // Hard check passes (semester 3 = subject semester 3)
        // All soft checks disabled by flags
        mockFindUnique.mockResolvedValueOnce(RESTRICTED_QUIZ).mockResolvedValueOnce(MISMATCHING_STUDENT).mockResolvedValueOnce(null)
        expect((await startQuiz(req(), params())).status).toBe(200)
    })
})
