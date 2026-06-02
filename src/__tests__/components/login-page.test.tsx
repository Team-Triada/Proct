/**
 * Component tests for /login page.
 * Tab routing, form rendering, validation feedback, and submit behaviour.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

// ── Helpers ────────────────────────────────────────────────────────────────────

const mockPush = vi.fn()
const mockSignIn = signIn as ReturnType<typeof vi.fn>

function setTab(tab: string | null) {
    vi.mocked(useSearchParams).mockReturnValue(
        { get: (k: string) => (k === 'tab' ? tab : null) } as ReturnType<typeof useSearchParams>
    )
}

function setRouter() {
    vi.mocked(useRouter).mockReturnValue(
        { push: mockPush, replace: vi.fn(), prefetch: vi.fn() } as ReturnType<typeof useRouter>
    )
}

async function renderPage() {
    const { default: LoginPage } = await import('@/app/login/page')
    let result: ReturnType<typeof render>
    await act(async () => {
        result = render(<LoginPage />)
    })
    return result!
}

// ── Setup ──────────────────────────────────────────────────────────────────────

const MOCK_PUBLIC_SETTINGS = {
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
    availableBatches: ['2022-25', '2023-26', '2024-27'],
    maxBatchNumber: 13,
}

beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    setTab(null)
    setRouter()
    global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(MOCK_PUBLIC_SETTINGS),
    })
})

// ── Tab behaviour ──────────────────────────────────────────────────────────────

describe('Login page – tab routing', () => {
    it('defaults to Sign In tab when no ?tab param', async () => {
        setTab(null)
        await renderPage()
        expect(screen.getByRole('heading', { name: /identity verification/i })).toBeInTheDocument()
    })

    it('defaults to Register tab when ?tab=register', async () => {
        setTab('register')
        await renderPage()
        expect(screen.getByRole('heading', { name: /enrollment/i })).toBeInTheDocument()
    })

    it('shows email and password fields on Sign In tab', async () => {
        setTab(null)
        await renderPage()
        expect(screen.getByPlaceholderText(/you@yenepoya\.edu\.in/i)).toBeInTheDocument()
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    })

    it('switches to Register tab when Register button is clicked', async () => {
        setTab(null)
        await renderPage()
        fireEvent.click(screen.getByRole('tab', { name: 'Register' }))
        expect(await screen.findByRole('heading', { name: /enrollment/i })).toBeInTheDocument()
    })

    it('switches back to Sign In tab from Register', async () => {
        setTab('register')
        await renderPage()
        fireEvent.click(screen.getByRole('tab', { name: 'Sign In' }))
        expect(await screen.findByRole('heading', { name: /identity verification/i })).toBeInTheDocument()
    })

    it('register tab shows "Already have an account?" text', async () => {
        setTab('register')
        await renderPage()
        expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
    })

    it('login tab shows "No account yet?" text', async () => {
        setTab(null)
        await renderPage()
        expect(screen.getByText(/no account yet/i)).toBeInTheDocument()
    })

    it('"Create one" link switches to register tab', async () => {
        setTab(null)
        await renderPage()
        fireEvent.click(screen.getByRole('button', { name: /create one/i }))
        expect(await screen.findByRole('heading', { name: /enrollment/i })).toBeInTheDocument()
    })

    it('"Sign in" link on register tab switches to login tab', async () => {
        setTab('register')
        await renderPage()
        // The "Sign in" button inside the form (not the tab button)
        const signInLinks = screen.getAllByRole('button', { name: /sign in/i })
        // The last one is the inline link (tab button is first)
        fireEvent.click(signInLinks[signInLinks.length - 1])
        expect(await screen.findByRole('heading', { name: /identity verification/i })).toBeInTheDocument()
    })
})

// ── Login form ─────────────────────────────────────────────────────────────────

// Tab button = "Sign In" (capital I), form submit = "Sign in" (lowercase i) — exact match distinguishes them
const SUBMIT_BTN_NAME = 'Sign in'

describe('Login form – submit', () => {
    it('calls signIn with credentials on submit', async () => {
        setTab(null)
        mockSignIn.mockResolvedValue({ error: null })
        vi.mocked(global.fetch).mockResolvedValue({ json: async () => ({ user: { role: 'STUDENT' } }) } as Response)

        await renderPage()
        await userEvent.type(screen.getByPlaceholderText(/you@yenepoya\.edu\.in/i), 'a@yenepoya.edu.in')
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'Pass1!')
        fireEvent.click(screen.getByRole('button', { name: SUBMIT_BTN_NAME }))

        await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith('credentials', {
            email: 'a@yenepoya.edu.in',
            password: 'Pass1!',
            redirect: false,
        }))
    })

    it('shows "Invalid email or password" when signIn returns error', async () => {
        setTab(null)
        mockSignIn.mockResolvedValue({ error: 'CredentialsSignin' })

        await renderPage()
        await userEvent.type(screen.getByPlaceholderText(/you@yenepoya\.edu\.in/i), 'x@yenepoya.edu.in')
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrong')
        fireEvent.click(screen.getByRole('button', { name: SUBMIT_BTN_NAME }))

        expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument()
    })

    it.each([
        { role: 'ADMIN', path: '/admin' },
        { role: 'FACULTY', path: '/faculty' },
        { role: 'STUDENT', path: '/student' },
    ])('redirects $role → $path after login', async ({ role, path }) => {
        setTab(null)
        mockSignIn.mockResolvedValue({ error: null })
        vi.mocked(global.fetch).mockResolvedValue({ json: async () => ({ user: { role } }) } as Response)

        await renderPage()
        await userEvent.type(screen.getByPlaceholderText(/you@yenepoya\.edu\.in/i), 'x@yenepoya.edu.in')
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pass')
        fireEvent.click(screen.getByRole('button', { name: SUBMIT_BTN_NAME }))

        await waitFor(() => expect(mockPush).toHaveBeenCalledWith(path))
    })

    it('shows "Something went wrong" on unexpected exception', async () => {
        setTab(null)
        mockSignIn.mockRejectedValue(new Error('network error'))

        await renderPage()
        await userEvent.type(screen.getByPlaceholderText(/you@yenepoya\.edu\.in/i), 'x@yenepoya.edu.in')
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'pass')
        fireEvent.click(screen.getByRole('button', { name: SUBMIT_BTN_NAME }))

        expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument()
    })
})

// ── Register form ──────────────────────────────────────────────────────────────

describe('Register form – submit', () => {
    async function fillAndSubmitRegister(overrides: Partial<{
        name: string; email: string; password: string;
        roll: string; campusId: string;
    }> = {}) {
        setTab('register')
        await renderPage()

        const f = {
            name: 'Test Student',
            email: 'stu@yenepoya.edu.in',
            password: 'SecurePass1!',
            roll: '23BBCCED099',
            campusId: '12345',
            ...overrides,
        }

        await userEvent.type(screen.getByPlaceholderText(/your full name/i), f.name)
        await userEvent.type(screen.getByPlaceholderText(/you@yenepoya\.edu\.in/i), f.email)
        await userEvent.type(screen.getByPlaceholderText(/min 8 chars/i), f.password)
        await userEvent.type(screen.getByPlaceholderText(/e\.g\. 23BBCCED009/i), f.roll)
        await userEvent.type(screen.getByPlaceholderText(/5 digits/i), f.campusId)

        const selects = screen.getAllByRole('combobox')
        await userEvent.selectOptions(selects[0], '2023-26')
        await userEvent.selectOptions(selects[1], '3')
        await userEvent.selectOptions(selects[2], '1')
    }

    it('POSTs to /api/auth/register (not /register page route)', async () => {
        await fillAndSubmitRegister()
        vi.mocked(global.fetch).mockResolvedValue({
            ok: true,
            json: async () => ({ message: 'Registration successful', user: { id: 'u1' } }),
        } as Response)
        mockSignIn.mockResolvedValue({ error: null })

        fireEvent.click(screen.getByRole('button', { name: /create account/i }))

        await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
            '/api/auth/register',
            expect.objectContaining({ method: 'POST' })
        ))
        const fetchedUrls = vi.mocked(global.fetch).mock.calls.map(c => c[0] as string)
        expect(fetchedUrls.some(u => u === '/register')).toBe(false)
    })

    it('client-validates wrong email domain without hitting API', async () => {
        await fillAndSubmitRegister({ email: 'stu@gmail.com' })
        fireEvent.click(screen.getByRole('button', { name: /create account/i }))

        expect(await screen.findByText(/email must use/i)).toBeInTheDocument()
        expect(vi.mocked(global.fetch)).not.toHaveBeenCalledWith('/api/auth/register', expect.anything())
    })

    it('client-validates campus ID < 5 digits without hitting API', async () => {
        await fillAndSubmitRegister({ campusId: '123' })
        fireEvent.click(screen.getByRole('button', { name: /create account/i }))

        expect(await screen.findByText(/campus id must be/i)).toBeInTheDocument()
        expect(vi.mocked(global.fetch)).not.toHaveBeenCalledWith('/api/auth/register', expect.anything())
    })

    it('client-validates password too short without hitting API', async () => {
        await fillAndSubmitRegister({ password: 'Ab1!' })
        fireEvent.click(screen.getByRole('button', { name: /create account/i }))

        expect(await screen.findByText(/8 characters/i)).toBeInTheDocument()
        expect(vi.mocked(global.fetch)).not.toHaveBeenCalledWith('/api/auth/register', expect.anything())
    })

    it('shows API error from backend inline', async () => {
        await fillAndSubmitRegister()
        vi.mocked(global.fetch).mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'Email already registered' }),
        } as Response)

        fireEvent.click(screen.getByRole('button', { name: /create account/i }))

        expect(await screen.findByText(/email already registered/i)).toBeInTheDocument()
    })

    it('auto-signs-in and redirects to /student on success', async () => {
        await fillAndSubmitRegister()
        vi.mocked(global.fetch).mockResolvedValue({
            ok: true,
            json: async () => ({ message: 'Registration successful', user: { id: 'u1' } }),
        } as Response)
        mockSignIn.mockResolvedValue({ error: null })

        fireEvent.click(screen.getByRole('button', { name: /create account/i }))

        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/student'))
    })

    it('shows inline error (no redirect) when auto-login fails post-registration', async () => {
        await fillAndSubmitRegister()
        vi.mocked(global.fetch).mockResolvedValue({
            ok: true,
            json: async () => ({ message: 'Registration successful', user: { id: 'u1' } }),
        } as Response)
        mockSignIn.mockResolvedValue({ error: 'CredentialsSignin' })

        fireEvent.click(screen.getByRole('button', { name: /create account/i }))

        expect(await screen.findByText(/account created but sign-in failed/i)).toBeInTheDocument()
        expect(mockPush).not.toHaveBeenCalled()
    })
})
