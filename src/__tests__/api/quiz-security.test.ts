/**
 * Unit tests for Quiz Security Flow
 * Covers:
 * - POST /api/attempts/[id]/violation (Log integrity violations)
 * - POST /api/attempts/[id]/reload (Handle page reloads)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerSession } from 'next-auth'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))

const mockAttemptFindUnique = vi.fn()
const mockAttemptUpdate = vi.fn()
const mockViolationCreate = vi.fn()

vi.mock('@/lib/db', () => ({
    prisma: {
        quizAttempt: {
            findUnique: mockAttemptFindUnique,
            update: mockAttemptUpdate,
        },
        violationLog: {
            create: mockViolationCreate,
        },
    },
}))

// ── Sessions & Base Data ──────────────────────────────────────────────────────

const STUDENT_SESSION = { user: { id: 's1', role: 'STUDENT', email: 's@y.edu.in' } }

const BASE_ATTEMPT = {
    id: 'a1',
    studentId: 's1',
    status: 'IN_PROGRESS',
    violationCount: 0,
    reloadCount: 0,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildParams(id: string) {
    return {
        params: Promise.resolve({ id }),
    }
}

function buildPOSTRequest(url: string, body: any = {}) {
    return new Request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

// ── Import Handlers ───────────────────────────────────────────────────────────

const { POST: logViolation } = await import('@/app/api/attempts/[id]/violation/route')
const { POST: handleReload } = await import('@/app/api/attempts/[id]/reload/route')

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Quiz Security Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getServerSession).mockResolvedValue(STUDENT_SESSION)
        mockAttemptFindUnique.mockResolvedValue(BASE_ATTEMPT)
        mockAttemptUpdate.mockResolvedValue({ violationCount: 1, reloadCount: 1 })
    })

    describe('POST /api/attempts/[id]/violation', () => {
        it('logs violation and increments violationCount', async () => {
            const payload = { type: 'TAB_SWITCH', description: 'User left the tab' }
            const req = buildPOSTRequest('http://localhost', payload)
            const res = await logViolation(req, buildParams('a1') as never)
            
            expect(res.status).toBe(200)
            expect(mockViolationCreate).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ type: 'TAB_SWITCH', attemptId: 'a1' })
            }))
            expect(mockAttemptUpdate).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: 'a1' },
                data: { violationCount: { increment: 1 } }
            }))
        })

        it('400 – attempt already submitted', async () => {
            mockAttemptFindUnique.mockResolvedValue({ ...BASE_ATTEMPT, status: 'COMPLETED' })
            const req = buildPOSTRequest('http://localhost', {})
            const res = await logViolation(req, buildParams('a1') as never)
            expect(res.status).toBe(400)
        })
    })

    describe('POST /api/attempts/[id]/reload', () => {
        it('increments reloadCount', async () => {
            const req = buildPOSTRequest('http://localhost')
            const res = await handleReload(req, buildParams('a1') as never)
            expect(res.status).toBe(200)
            expect(mockAttemptUpdate).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ reloadCount: { increment: 1 } })
            }))
        })

        it('logs violation only after threshold (RELOAD_THRESHOLD = 2)', async () => {
            // Mock attempt with 2 reloads already
            mockAttemptFindUnique.mockResolvedValue({ ...BASE_ATTEMPT, reloadCount: 2 })
            
            const req = buildPOSTRequest('http://localhost')
            const res = await handleReload(req, buildParams('a1') as never)
            expect(res.status).toBe(200)
            
            const body = await res.json()
            expect(body.violationLogged).toBe(true)
            
            expect(mockViolationCreate).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ type: 'PAGE_RELOAD' })
            }))
            expect(mockAttemptUpdate).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ violationCount: { increment: 1 } })
            }))
        })

        it('does not log violation if under threshold', async () => {
            mockAttemptFindUnique.mockResolvedValue({ ...BASE_ATTEMPT, reloadCount: 0 })
            
            const req = buildPOSTRequest('http://localhost')
            const res = await handleReload(req, buildParams('a1') as never)
            expect(res.status).toBe(200)
            
            const body = await res.json()
            expect(body.violationLogged).toBe(false)
            expect(mockViolationCreate).not.toHaveBeenCalled()
        })
    })
})
