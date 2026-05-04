/**
 * Unit tests for POST /api/auth/register
 * Prisma and bcrypt are mocked – no real DB required.
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

vi.mock('bcryptjs', () => ({
    default: { hash: vi.fn(() => 'hashed_pw') },
    hash: vi.fn(() => 'hashed_pw'),
}))

vi.mock('@/lib/settings', () => ({
    getPlatformSettings: vi.fn().mockResolvedValue({
        allowedEmailDomains: ['@yenepoya.edu.in'],
        studentIdLabel: 'Campus ID',
        studentIdFormat: 'NUMERIC',
        studentIdMinLength: 5,
        studentIdMaxLength: 5,
        studentIdRequired: true,
        rollNumberLabel: 'Registration Number',
        rollNumberFormat: 'ANY',
        rollNumberMinLength: 1,
        rollNumberMaxLength: 50,
        rollNumberRequired: true,
        maxSemester: 8,
        availableBatches: [],
        maxBatchNumber: 13,
        enableYearTargeting: true,
        enableSemesterTargeting: true,
        enableBatchTargeting: true,
    }),
    validateFieldFormat: (value: string, format: string) => {
        if (format === 'ANY') return true
        if (format === 'NUMERIC') return /^\d+$/.test(value)
        if (format === 'ALPHA') return /^[a-zA-Z]+$/.test(value)
        if (format === 'ALPHANUMERIC') return /^[a-zA-Z0-9]+$/.test(value)
        return true
    },
}))

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildRequest(body: Record<string, unknown>) {
    return new Request('http://localhost/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
}

const VALID_BODY = {
    name: 'Test Student',
    email: 'test@yenepoya.edu.in',
    password: 'SecurePass1!',
    rollNumber: '23BBCCED001',
    campusId: '12345',
    batch: '2023-26',
    semester: '3',
    section: '1',
}

// ── Import handler (after mocks) ───────────────────────────────────────────────

const { POST } = await import('@/app/api/auth/register/route')

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('POST /api/auth/register', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Default: no existing users
        mockFindUnique.mockResolvedValue(null)
        mockCreate.mockResolvedValue({
            id: 'cuid_1',
            name: VALID_BODY.name,
            email: VALID_BODY.email,
            rollNumber: VALID_BODY.rollNumber,
        })
    })

    // ── Happy path ─────────────────────────────────────────────────────────────

    it('201 – creates user with valid payload', async () => {
        const res = await POST(buildRequest(VALID_BODY))
        const body = await res.json()
        expect(res.status).toBe(201)
        expect(body.message).toBe('Registration successful')
        expect(body.user.email).toBe(VALID_BODY.email)
        expect(body.user).not.toHaveProperty('password')
    })

    it('stores hashed password, not plain text', async () => {
        await POST(buildRequest(VALID_BODY))
        expect(mockCreate).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ password: 'hashed_pw' }) })
        )
    })

    it('assigns STUDENT role by default', async () => {
        await POST(buildRequest(VALID_BODY))
        expect(mockCreate).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ role: 'STUDENT' }) })
        )
    })

    it('converts semester string to integer', async () => {
        await POST(buildRequest({ ...VALID_BODY, semester: '5' }))
        expect(mockCreate).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ semester: 5 }) })
        )
    })

    // ── Missing fields ─────────────────────────────────────────────────────────

    it.each([
        'name', 'email', 'password', 'rollNumber', 'campusId', 'batch', 'semester', 'section',
    ])('400 – missing field: %s', async (field) => {
        const body = { ...VALID_BODY, [field]: '' }
        const res = await POST(buildRequest(body))
        expect(res.status).toBe(400)
        const json = await res.json()
        expect(json.error).toBeTruthy()
    })

    // ── Email validation ───────────────────────────────────────────────────────

    it('400 – invalid email format', async () => {
        const res = await POST(buildRequest({ ...VALID_BODY, email: 'not-an-email' }))
        expect(res.status).toBe(400)
        expect((await res.json()).error).toMatch(/invalid email/i)
    })

    it('400 – wrong email domain (gmail)', async () => {
        const res = await POST(buildRequest({ ...VALID_BODY, email: 'test@gmail.com' }))
        expect(res.status).toBe(400)
        expect((await res.json()).error).toMatch(/yenepoya\.edu\.in/)
    })

    it('400 – wrong email domain (other edu)', async () => {
        const res = await POST(buildRequest({ ...VALID_BODY, email: 'test@other.edu.in' }))
        expect(res.status).toBe(400)
    })

    it('200 range – yenepoya.edu.in email accepted', async () => {
        const res = await POST(buildRequest({ ...VALID_BODY, email: 'student@yenepoya.edu.in' }))
        expect(res.status).toBe(201)
    })

    // ── Campus ID validation ───────────────────────────────────────────────────

    it('400 – campus ID less than 5 digits', async () => {
        const res = await POST(buildRequest({ ...VALID_BODY, campusId: '1234' }))
        expect(res.status).toBe(400)
        expect((await res.json()).error).toMatch(/campus id/i)
    })

    it('400 – campus ID more than 5 digits', async () => {
        const res = await POST(buildRequest({ ...VALID_BODY, campusId: '123456' }))
        expect(res.status).toBe(400)
    })

    it('400 – campus ID with letters', async () => {
        const res = await POST(buildRequest({ ...VALID_BODY, campusId: '1234a' }))
        expect(res.status).toBe(400)
    })

    it('201 – campus ID exactly 5 digits', async () => {
        const res = await POST(buildRequest({ ...VALID_BODY, campusId: '00001' }))
        expect(res.status).toBe(201)
    })

    // ── Password validation ────────────────────────────────────────────────────

    it('400 – password too short (< 8 chars)', async () => {
        const res = await POST(buildRequest({ ...VALID_BODY, password: 'Ab1!' }))
        expect(res.status).toBe(400)
        expect((await res.json()).error).toMatch(/8 characters/i)
    })

    it('400 – password missing lowercase', async () => {
        const res = await POST(buildRequest({ ...VALID_BODY, password: 'UPPERCASE1!' }))
        expect(res.status).toBe(400)
        expect((await res.json()).error).toMatch(/lowercase/i)
    })

    it('400 – password missing uppercase', async () => {
        const res = await POST(buildRequest({ ...VALID_BODY, password: 'lowercase1!' }))
        expect(res.status).toBe(400)
        expect((await res.json()).error).toMatch(/uppercase/i)
    })

    it('400 – password missing number', async () => {
        const res = await POST(buildRequest({ ...VALID_BODY, password: 'NoNumbers!' }))
        expect(res.status).toBe(400)
        expect((await res.json()).error).toMatch(/number/i)
    })

    it('400 – password missing special character', async () => {
        const res = await POST(buildRequest({ ...VALID_BODY, password: 'NoSpecial1' }))
        expect(res.status).toBe(400)
        expect((await res.json()).error).toMatch(/special/i)
    })

    // ── Semester validation ────────────────────────────────────────────────────

    it('400 – semester 0 (out of range)', async () => {
        const res = await POST(buildRequest({ ...VALID_BODY, semester: '0' }))
        expect(res.status).toBe(400)
        expect((await res.json()).error).toMatch(/semester/i)
    })

    it('400 – semester 9 (out of range)', async () => {
        const res = await POST(buildRequest({ ...VALID_BODY, semester: '9' }))
        expect(res.status).toBe(400)
    })

    it('400 – semester NaN', async () => {
        const res = await POST(buildRequest({ ...VALID_BODY, semester: 'abc' }))
        expect(res.status).toBe(400)
    })

    it.each(['1', '4', '8'])('201 – semester %s (in range)', async (sem) => {
        const res = await POST(buildRequest({ ...VALID_BODY, semester: sem }))
        expect(res.status).toBe(201)
    })

    // ── Conflict checks ────────────────────────────────────────────────────────

    it('409 – email already registered', async () => {
        mockFindUnique.mockResolvedValueOnce({ id: 'existing', email: VALID_BODY.email })
        const res = await POST(buildRequest(VALID_BODY))
        expect(res.status).toBe(409)
        expect((await res.json()).error).toMatch(/already registered/i)
    })

    it('409 – roll number already exists', async () => {
        mockFindUnique
            .mockResolvedValueOnce(null)                              // email check passes
            .mockResolvedValueOnce({ id: 'existing', rollNumber: VALID_BODY.rollNumber }) // roll check fails
        const res = await POST(buildRequest(VALID_BODY))
        expect(res.status).toBe(409)
        expect((await res.json()).error).toMatch(/registration number/i)
    })

    // ── Database error ─────────────────────────────────────────────────────────

    it('500 – database failure returns friendly error', async () => {
        mockCreate.mockRejectedValue(new Error('DB connection refused'))
        const res = await POST(buildRequest(VALID_BODY))
        expect(res.status).toBe(500)
        const json = await res.json()
        expect(json.error).toBeTruthy()
        expect(json.error).not.toMatch(/connection refused/i) // no raw DB error leaked
    })
})
