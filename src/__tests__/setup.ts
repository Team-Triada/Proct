import '@testing-library/jest-dom'
import { vi } from 'vitest'
import React from 'react'

vi.spyOn(console, 'error').mockImplementation(() => {})

// next/navigation – all hooks are vi.fn() so tests can override per-case
vi.mock('next/navigation', () => ({
    useRouter: vi.fn(() => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() })),
    useSearchParams: vi.fn(() => ({ get: (_k: string) => null })),
    usePathname: vi.fn(() => '/'),
    redirect: vi.fn(),
}))

// next/image – lightweight stub
vi.mock('next/image', () => ({
    default: ({ src, alt }: { src: string; alt: string }) =>
        React.createElement('img', { src, alt }),
}))

// next-auth/react – vi.fn() stubs, overridden per-test
vi.mock('next-auth/react', () => ({
    signIn: vi.fn(),
    signOut: vi.fn(),
    useSession: vi.fn(() => ({ data: null, status: 'unauthenticated' })),
    SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// ThemeProvider – provide a working context so ThemeToggle doesn't throw
vi.mock('@/components/ThemeProvider', () => ({
    ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
    useTheme: vi.fn(() => ({ theme: 'dark', toggleTheme: vi.fn() })),
}))

// ThemeToggle – stub to a simple button so tests don't need theme context
vi.mock('@/components/ThemeToggle', () => ({
    default: () => React.createElement('button', { 'aria-label': 'Toggle theme' }),
}))

// Logo – stub to avoid image optimisation complexity
vi.mock('@/components/Logo', () => ({
    default: () => React.createElement('div', { 'data-testid': 'logo' }),
}))
