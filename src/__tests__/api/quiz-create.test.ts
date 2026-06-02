/**
 * Unit tests for POST /api/quizzes (faculty creates quiz with batch assignment)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

const mockFindUnique = vi.fn()
const mockCreate = vi.fn()
const mockFindMany = vi.fn()

vi.mock('@/lib/db', () => ({
    prisma: {
        user: { findUnique: mockFindUnique },
        quiz: { create: mockCreate, findMany: mockFindMany },
    },
}))

vi.mock('@/lib/utils', () => ({
    normalizeBatch: (b: string) => b.toUpperCase().trim(),
    normalizeBatches: (bs: string[]) => bs.map((b: string) => b.toUpperCase().trim()),
}))

// ── Sessions ──────────────────────────────────────────────────────────────────

const FACULTY_SESSION = { user: { id: 'f1', role: 'FACULTY', email: 'f@y.edu.in' } }
const STUDENT_SESSION = { user: { id: 's1', role: 'STUDENT', email: 's@y.edu.in' } }
const ADMIN_SESSION = { user: { id: 'a1', role: 'ADMIN', email: 'a@y.edu.in' } }

// ── Payload builder ────────────────────────────────────────────────────────────

function buildQuizPayload(overrides = {}) {
    return {
        title: 'Data Structures Midterm',
        subjectId: 'sub1',
        description: 'Covers arrays and trees',
        timePerQuestion: 30,
        totalQuestions: 2,
        enforcementMode: 'NORMAL',
        timingMode: 'PER_QUESTION',
        totalDuration: null,
        assignedBatches: ['2023-26'],
        targetSection: '2',
        isPublished: true,
        availableFrom: null,
        availableUntil: null,
        questions: [
            { text: 'What is a stack?', type: 'MULTIPLE_CHOICE', options: ['LIFO', 'FIFO', 'Both', 'None'], correctIndex: 0, correctIndices: [], points: 1 },
            { text: 'Binary tree nodes', type: 'MULTIPLE_CHOICE', options: ['1', '2', '3', '4'], correctIndex: 1, correctIndices: [], points: 1 },
        ],
        ...overrides,
    }
}

function buildRequest(body: Record<string, unknown>) {
    return new Request('http://localhost/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

// ── Import handler after mocks ────────────────────────────────────────────────

const { POST, GET } = await import('@/app/api/quizzes/route')

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('POST /api/quizzes – create quiz', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getServerSession).mockResolvedValue(FACULTY_SESSION)
        // Faculty IS assigned to subject
        mockFindUnique.mockResolvedValue({ id: 'f1', subjects: [{ id: 'sub1' }] })
        mockCreate.mockResolvedValue({ id: 'q1', title: 'Data Structures Midterm' })
    })

    it('201 – faculty creates quiz successfully', async () => {
        const res = await POST(buildRequest(buildQuizPayload()) as never)
        expect(res.status).toBe(201)
        const body = await res.json()
        expect(body.id).toBe('q1')
    })

    it('401 – no session', async () => {
        vi.mocked(getServerSession).mockResolvedValue(null)
        const res = await POST(buildRequest(buildQuizPayload()) as never)
        expect(res.status).toBe(401)
    })

    it('403 – student cannot create quiz', async () => {
        vi.mocked(getServerSession).mockResolvedValue(STUDENT_SESSION)
        const res = await POST(buildRequest(buildQuizPayload()) as never)
        expect(res.status).toBe(403)
        expect((await res.json()).error).toMatch(/only faculty/i)
    })

    it('403 – admin cannot create quiz (faculty-only)', async () => {
        vi.mocked(getServerSession).mockResolvedValue(ADMIN_SESSION)
        const res = await POST(buildRequest(buildQuizPayload()) as never)
        expect(res.status).toBe(403)
    })

    it('403 – faculty not assigned to subject', async () => {
        mockFindUnique.mockResolvedValue({ id: 'f1', subjects: [] }) // not assigned
        const res = await POST(buildRequest(buildQuizPayload()) as never)
        expect(res.status).toBe(403)
        expect((await res.json()).error).toMatch(/not assigned to this subject/i)
    })

    it('stores quiz with normalised assignedBatches', async () => {
        await POST(buildRequest(buildQuizPayload({ assignedBatches: ['2023-26', '2024-27'] })) as never)
        expect(mockCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    assignedBatches: ['2023-26', '2024-27'], // normalizeBatches uppercases
                }),
            })
        )
    })

    it('stores targetSection when provided', async () => {
        await POST(buildRequest(buildQuizPayload({ targetSection: '5' })) as never)
        expect(mockCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ targetSection: '5' }),
            })
        )
    })

    it('targetSection null when not provided', async () => {
        await POST(buildRequest(buildQuizPayload({ targetSection: undefined })) as never)
        expect(mockCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ targetSection: null }),
            })
        )
    })

    it('creates questions with correct order and type', async () => {
        await POST(buildRequest(buildQuizPayload()) as never)
        const callArg = mockCreate.mock.calls[0][0]
        const createdQuestions = callArg.data.questions.create
        expect(createdQuestions[0].order).toBe(1)
        expect(createdQuestions[1].order).toBe(2)
        expect(createdQuestions[0].type).toBe('MULTIPLE_CHOICE')
    })

    it('defaults question type to MULTIPLE_CHOICE when not provided', async () => {
        const payload = buildQuizPayload({
            questions: [{ text: 'Q1', options: ['A', 'B'], correctIndex: 0, correctIndices: [], points: 1 }],
            totalQuestions: 1,
        })
        await POST(buildRequest(payload) as never)
        const callArg = mockCreate.mock.calls[0][0]
        expect(callArg.data.questions.create[0].type).toBe('MULTIPLE_CHOICE')
    })

    it('serialises options as JSON string', async () => {
        await POST(buildRequest(buildQuizPayload()) as never)
        const callArg = mockCreate.mock.calls[0][0]
        const q = callArg.data.questions.create[0]
        expect(typeof q.options).toBe('string')
        expect(JSON.parse(q.options)).toEqual(['LIFO', 'FIFO', 'Both', 'None'])
    })

    it('parses availableFrom/Until to Date objects', async () => {
        const from = '2025-01-01T00:00:00Z'
        const until = '2025-06-01T00:00:00Z'
        await POST(buildRequest(buildQuizPayload({ availableFrom: from, availableUntil: until })) as never)
        const callArg = mockCreate.mock.calls[0][0]
        expect(callArg.data.availableFrom).toBeInstanceOf(Date)
        expect(callArg.data.availableUntil).toBeInstanceOf(Date)
    })

    it('stores timingMode TOTAL_DURATION with totalDuration', async () => {
        await POST(buildRequest(buildQuizPayload({ timingMode: 'TOTAL_DURATION', totalDuration: 60 })) as never)
        expect(mockCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ timingMode: 'TOTAL_DURATION', totalDuration: 60 }),
            })
        )
    })

    it('uses targetBatch as fallback when assignedBatches not provided', async () => {
        await POST(buildRequest(buildQuizPayload({ assignedBatches: undefined, targetBatch: '2024-27' })) as never)
        expect(mockCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ assignedBatches: ['2024-27'] }),
            })
        )
    })
})

describe('GET /api/quizzes', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('401 – no session', async () => {
        vi.mocked(getServerSession).mockResolvedValue(null)
        const res = await GET()
        expect(res.status).toBe(401)
    })

    it('403 – student gets forbidden', async () => {
        vi.mocked(getServerSession).mockResolvedValue(STUDENT_SESSION)
        const res = await GET()
        expect(res.status).toBe(403)
    })
})
