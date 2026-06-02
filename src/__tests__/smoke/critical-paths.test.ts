/**
 * Smoke tests — 10 critical paths that must not break.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFindUnique  = vi.fn()
const mockFindMany    = vi.fn()
const mockCreate      = vi.fn()
const mockUpdate      = vi.fn()
const mockDeleteMany  = vi.fn()
const mockTransaction = vi.fn()
const mockUpsert      = vi.fn()
const mockGetSettings         = vi.fn()
const mockMatchesTgt          = vi.fn()
const mockValidateFieldFormat = vi.fn()

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/db', () => ({
    prisma: {
        user:             { findUnique: mockFindUnique, findMany: mockFindMany, create: mockCreate, update: mockUpdate },
        quiz:             { findUnique: mockFindUnique, findMany: mockFindMany, create: mockCreate, update: mockUpdate },
        question:         { findUnique: mockFindUnique, create: mockCreate, update: mockUpdate, deleteMany: mockDeleteMany },
        quizAttempt:      { findUnique: mockFindUnique, create: mockCreate, update: mockUpdate, deleteMany: mockDeleteMany },
        answer:           { update: mockUpdate, deleteMany: mockDeleteMany },
        violationLog:     { create: mockCreate, deleteMany: mockDeleteMany },
        subject:          { findUnique: mockFindUnique, create: mockCreate },
        platformSettings: { upsert: mockUpsert },
        $transaction:     mockTransaction,
    },
}))
vi.mock('@/lib/settings', () => ({
    getPlatformSettings: mockGetSettings,
    validateFieldFormat: mockValidateFieldFormat,
}))
vi.mock('@/lib/quizFilters', () => ({ matchesQuizTargeting: mockMatchesTgt }))
vi.mock('bcryptjs', () => ({
    default: { hash: vi.fn(() => 'hashed_pw'), compare: vi.fn().mockResolvedValue(true) },
    hash: vi.fn(() => 'hashed_pw'), compare: vi.fn().mockResolvedValue(true),
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

const { POST: register }        = await import('@/app/api/auth/register/route')
const { GET: publicSettings }   = await import('@/app/api/settings/public/route')
const { POST: createQuiz }      = await import('@/app/api/quizzes/route')
const { GET: listQuizzes }      = await import('@/app/api/quizzes/route')
const { POST: startQuiz }       = await import('@/app/api/quizzes/[id]/start/route')
const { GET: adminSettings }    = await import('@/app/api/admin/settings/route')
const { POST: logViolation }    = await import('@/app/api/attempts/[id]/violation/route')
const { POST: logReload }       = await import('@/app/api/attempts/[id]/reload/route')
const { GET: getProfile }       = await import('@/app/api/profile/route')
const { GET: dashboard }        = await import('@/app/api/faculty/dashboard/route')
const { GET: listStudents }     = await import('@/app/api/faculty/students/route')
const { POST: createAdminUser } = await import('@/app/api/admin/users/route')

function req(body: object, method = 'POST') {
    return new Request('http://localhost', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
}
function params(obj: Record<string, string>) { return { params: Promise.resolve(obj) } as never }

// ── SMOKE 1: Student registration ─────────────────────────────────────────────

describe('SMOKE 1 – Student registration', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mockGetSettings.mockResolvedValue(DEFAULT_SETTINGS)
        mockValidateFieldFormat.mockReturnValue(true)
        mockFindUnique.mockResolvedValue(null)
        mockCreate.mockResolvedValue({ id: 'u1', name: 'Alice', email: 'alice@y.edu', rollNumber: 'R001' })
    })

    it('POST /api/auth/register → 201', async () => {
        const res = await register(req({ name: 'Alice', email: 'alice@y.edu', password: 'Abc@1234', rollNumber: 'R001', batch: '2023-26', semester: '3', section: '1' }))
        expect(res.status).toBe(201)
    })
})

// ── SMOKE 2: Public settings (no auth) ───────────────────────────────────────

describe('SMOKE 2 – Public settings', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mockGetSettings.mockResolvedValue(DEFAULT_SETTINGS)
    })

    it('GET /api/settings/public → 200', async () => {
        expect((await publicSettings()).status).toBe(200)
    })
})

// ── SMOKE 3: Faculty creates quiz ─────────────────────────────────────────────

describe('SMOKE 3 – Faculty creates quiz', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mockSession.mockResolvedValue({ user: { id: 'f1', role: 'FACULTY' } })
        mockFindUnique.mockResolvedValue({ subjects: [{ id: 'sub1' }] })
        mockCreate.mockResolvedValue({ id: 'quiz1', title: 'Midterm' })
    })

    it('POST /api/quizzes → 201', async () => {
        const res = await createQuiz(req({ title: 'Midterm', subjectId: 'sub1', timingMode: 'PER_QUESTION', timePerQuestion: 60, enforcementMode: 'NORMAL', showScore: true, showAnswers: false, questions: [{ text: 'Q?', type: 'MULTIPLE_CHOICE', options: ['A', 'B'], correctIndex: 0, points: 5 }] }) as never)
        expect(res.status).toBe(201)
    })
})

// ── SMOKE 4: Student starts quiz ──────────────────────────────────────────────

describe('SMOKE 4 – Student starts quiz', () => {
    const QUIZ = { id: 'quiz1', isPublished: true, availableFrom: null, availableUntil: null, timingMode: 'PER_QUESTION', timePerQuestion: 60, totalQuestions: 1, assignedBatches: null, targetSection: null, targetSemester: null, subject: { semester: 3 }, questions: [{ id: 'q1' }] }

    beforeEach(() => {
        vi.resetAllMocks()
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
        mockGetSettings.mockResolvedValue(DEFAULT_SETTINGS)
        mockMatchesTgt.mockReturnValue(true)
        mockFindUnique
            .mockResolvedValueOnce(QUIZ)
            .mockResolvedValueOnce({ semester: 3, batch: '2023-26', section: '1' })
            .mockResolvedValueOnce(null)
        mockCreate.mockResolvedValue({ id: 'a1', questionOrder: '["q1"]', currentIndex: 0, timeSpent: 0 })
    })

    it('POST /api/quizzes/:id/start → 200', async () => {
        const res = await startQuiz(req({}), params({ id: 'quiz1' }))
        expect(res.status).toBe(200)
        expect((await res.json()).attemptId).toBe('a1')
    })
})

// ── SMOKE 5: Admin settings ───────────────────────────────────────────────────

describe('SMOKE 5 – Admin settings', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mockSession.mockResolvedValue({ user: { id: 'a1', role: 'ADMIN' } })
        mockGetSettings.mockResolvedValue(DEFAULT_SETTINGS)
    })

    it('GET /api/admin/settings → 200', async () => {
        expect((await adminSettings()).status).toBe(200)
    })
})

// ── SMOKE 6: Violation logging ────────────────────────────────────────────────

describe('SMOKE 6 – Violation logging', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
        mockFindUnique.mockResolvedValue({ id: 'a1', studentId: 's1', status: 'IN_PROGRESS' })
        mockCreate.mockResolvedValue({})
        mockUpdate.mockResolvedValue({ violationCount: 1 })
    })

    it('POST /api/attempts/:id/violation → 200', async () => {
        const res = await logViolation(req({ type: 'TAB_SWITCH' }), params({ id: 'a1' }))
        expect(res.status).toBe(200)
        expect((await res.json()).violationCount).toBe(1)
    })
})

// ── SMOKE 7: Reload tracking ──────────────────────────────────────────────────

describe('SMOKE 7 – Reload tracking', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mockSession.mockResolvedValue({ user: { id: 's1', role: 'STUDENT' } })
        mockFindUnique.mockResolvedValue({ id: 'a1', studentId: 's1', status: 'IN_PROGRESS' })
        mockUpdate.mockResolvedValue({ reloadCount: 1 })
        mockCreate.mockResolvedValue({})
        mockTransaction.mockImplementation(async (ops: unknown[]) => Promise.all(ops))
    })

    it('POST /api/attempts/:id/reload → 200', async () => {
        const res = await logReload(req({}), params({ id: 'a1' }))
        expect(res.status).toBe(200)
        expect((await res.json()).reloadCount).toBeDefined()
    })
})

// ── SMOKE 8: Profile ──────────────────────────────────────────────────────────

describe('SMOKE 8 – Profile', () => {
    beforeEach(() => { vi.resetAllMocks() })

    it('GET /api/profile → 200 authenticated', async () => {
        mockSession.mockResolvedValue({ user: { id: 'u1', role: 'FACULTY' } })
        mockFindUnique.mockResolvedValue({ id: 'u1', name: 'Dr. Smith', email: 'smith@y.edu', role: 'FACULTY', rollNumber: null, campusId: null, semester: null, batch: null, section: null, department: null, image: null })
        expect((await getProfile()).status).toBe(200)
    })

    it('GET /api/profile → 401 unauthenticated', async () => {
        mockSession.mockResolvedValue(null)
        expect((await getProfile()).status).toBe(401)
    })
})

// ── SMOKE 9: Faculty dashboard ────────────────────────────────────────────────

describe('SMOKE 9 – Faculty dashboard', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        mockSession.mockResolvedValue({ user: { id: 'f1', role: 'FACULTY' } })
        mockFindUnique.mockResolvedValue({ subjects: [] })
    })

    it('GET /api/faculty/dashboard → 200', async () => {
        expect((await dashboard()).status).toBe(200)
    })
})

// ── SMOKE 10: Auth blocks all protected routes ────────────────────────────────

describe('SMOKE 10 – Unauthenticated blocks', () => {
    beforeEach(() => { vi.resetAllMocks(); mockSession.mockResolvedValue(null) })

    it('GET /api/quizzes → 401', async () => {
        expect((await listQuizzes()).status).toBe(401)
    })

    it('GET /api/faculty/students → 401', async () => {
        expect((await listStudents()).status).toBe(401)
    })

    it('POST /api/admin/users → 401', async () => {
        expect((await createAdminUser(req({ email: 'x', password: 'pw', name: 'X', role: 'STUDENT' }))).status).toBe(401)
    })

    it('GET /api/admin/settings → 401', async () => {
        expect((await adminSettings()).status).toBe(401)
    })

    it('GET /api/faculty/dashboard → 401', async () => {
        expect((await dashboard()).status).toBe(401)
    })
})
