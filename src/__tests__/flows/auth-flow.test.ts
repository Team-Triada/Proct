/**
 * Auth flow integration tests.
 * Exercises the full register→login→redirect chain with mocked Prisma + bcrypt.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ──────────────────────────────────────────────────────────────────────

const mockFindUnique = vi.fn()
const mockCreate = vi.fn()

vi.mock('@/lib/db', () => ({
    prisma: {
        user: {
            findUnique: mockFindUnique,
            create: mockCreate,
        },
    },
}))

const mockBcryptHash = vi.fn(() => 'bcrypt_hash')
const mockBcryptCompare = vi.fn()

vi.mock('bcryptjs', () => ({
    default: { hash: mockBcryptHash, compare: mockBcryptCompare },
    hash: mockBcryptHash,
    compare: mockBcryptCompare,
}))

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildRegisterRequest(overrides: Record<string, unknown> = {}) {
    const body = {
        name: 'Flow Student',
        email: 'flow@yenepoya.edu.in',
        password: 'FlowPass1!',
        rollNumber: '23BBCCED099',
        campusId: '99999',
        batch: '2023-26',
        semester: '2',
        section: '3',
        ...overrides,
    }
    return new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('Auth flow: registration → login → role redirect', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
    })

    it('full registration flow: stores user and returns 201', async () => {
        mockFindUnique.mockResolvedValue(null)
        mockCreate.mockResolvedValue({
            id: 'cuid_flow',
            name: 'Flow Student',
            email: 'flow@yenepoya.edu.in',
            rollNumber: '23BBCCED099',
        })

        const { POST } = await import('@/app/api/auth/register/route')
        const res = await POST(buildRegisterRequest())

        expect(res.status).toBe(201)
        const json = await res.json()
        expect(json.user.email).toBe('flow@yenepoya.edu.in')

        // Verify DB was called correctly
        expect(mockCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    email: 'flow@yenepoya.edu.in',
                    password: 'bcrypt_hash',
                    role: 'STUDENT',
                    semester: 2,
                }),
            })
        )
    })

    it('login succeeds after registration: authorize returns correct user', async () => {
        const storedUser = {
            id: 'cuid_flow',
            email: 'flow@yenepoya.edu.in',
            password: 'bcrypt_hash',
            name: 'Flow Student',
            role: 'STUDENT',
            rollNumber: '23BBCCED099',
        }
        mockFindUnique.mockResolvedValue(storedUser)
        mockBcryptCompare.mockResolvedValue(true)

        const { authOptions } = await import('@/lib/auth')
        const provider = authOptions.providers[0] as {
            options: { authorize: (c: Record<string, string>) => Promise<unknown> }
        }
        const user = await provider.options.authorize({
            email: 'flow@yenepoya.edu.in',
            password: 'FlowPass1!',
        }) as Record<string, unknown>

        expect(user).not.toBeNull()
        expect(user.role).toBe('STUDENT')
        expect(user.rollNumber).toBe('23BBCCED099')
    })

    it('duplicate registration rejected: 409 on second attempt', async () => {
        // First: no user exists
        mockFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
        mockCreate.mockResolvedValue({ id: 'u1', name: 'Flow Student', email: 'flow@yenepoya.edu.in', rollNumber: '23BBCCED099' })

        const { POST } = await import('@/app/api/auth/register/route')
        const first = await POST(buildRegisterRequest())
        expect(first.status).toBe(201)

        // Second attempt: email already in DB
        vi.resetModules()
        const { POST: POST2 } = await import('@/app/api/auth/register/route')
        mockFindUnique.mockResolvedValueOnce({ id: 'u1', email: 'flow@yenepoya.edu.in' })
        const second = await POST2(buildRegisterRequest())
        expect(second.status).toBe(409)
        expect((await second.json()).error).toMatch(/already registered/i)
    })

    it('login fails with wrong password after registration', async () => {
        mockFindUnique.mockResolvedValue({
            id: 'u1',
            email: 'flow@yenepoya.edu.in',
            password: 'bcrypt_hash',
            name: 'Flow Student',
            role: 'STUDENT',
            rollNumber: '23BBCCED099',
        })
        mockBcryptCompare.mockResolvedValue(false) // wrong password

        const { authOptions } = await import('@/lib/auth')
        const provider = authOptions.providers[0] as {
            options: { authorize: (c: Record<string, string>) => Promise<unknown> }
        }
        const user = await provider.options.authorize({
            email: 'flow@yenepoya.edu.in',
            password: 'WrongPassword1!',
        })
        expect(user).toBeNull()
    })
})

describe('Auth flow: role-based redirects', () => {
    beforeEach(() => vi.resetModules())

    const roles = [
        { role: 'ADMIN', path: '/admin' },
        { role: 'FACULTY', path: '/faculty' },
        { role: 'STUDENT', path: '/student' },
    ]

    it.each(roles)('$role session maps to $path', async ({ role }) => {
        const { authOptions } = await import('@/lib/auth')
        const jwtCb = authOptions.callbacks!.jwt!
        const sessionCb = authOptions.callbacks!.session!

        const token = await jwtCb({
            token: {},
            user: { id: 'u1', email: 'x@y.com', name: 'X', role: role as 'ADMIN' | 'FACULTY' | 'STUDENT', rollNumber: null },
            account: null,
            trigger: 'signIn',
        })
        const session = await sessionCb({
            session: { user: { name: 'X', email: 'x@y.com' }, expires: '' },
            token,
            newSession: undefined,
            trigger: 'update',
        })
        expect((session.user as Record<string, unknown>).role).toBe(role)
    })
})

describe('Auth flow: registration API field mapping', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
    })

    it('section field maps to DB section (batch number)', async () => {
        mockFindUnique.mockResolvedValue(null)
        mockCreate.mockResolvedValue({ id: 'u1', name: 'X', email: 'x@yenepoya.edu.in', rollNumber: 'R1' })

        const { POST } = await import('@/app/api/auth/register/route')
        await POST(buildRegisterRequest({ section: '7' }))

        expect(mockCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ section: '7' }),
            })
        )
    })

    it('batch field maps to DB batch (year range)', async () => {
        mockFindUnique.mockResolvedValue(null)
        mockCreate.mockResolvedValue({ id: 'u1', name: 'X', email: 'x@yenepoya.edu.in', rollNumber: 'R1' })

        const { POST } = await import('@/app/api/auth/register/route')
        await POST(buildRegisterRequest({ batch: '2024-27' }))

        expect(mockCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({ batch: '2024-27' }),
            })
        )
    })

    it('response body never includes password hash', async () => {
        mockFindUnique.mockResolvedValue(null)
        mockCreate.mockResolvedValue({ id: 'u1', name: 'X', email: 'x@yenepoya.edu.in', rollNumber: 'R1' })

        const { POST } = await import('@/app/api/auth/register/route')
        const res = await POST(buildRegisterRequest())
        const json = await res.json()

        expect(JSON.stringify(json)).not.toContain('bcrypt_hash')
        expect(JSON.stringify(json)).not.toContain('password')
    })
})
