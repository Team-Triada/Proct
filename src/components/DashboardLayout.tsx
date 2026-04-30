'use client'

import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import ThemeToggle from './ThemeToggle'
import Logo from './Logo'

interface DashboardLayoutProps {
    children: React.ReactNode
    user: {
        name: string
        email: string
        role: string
        rollNumber?: string | null
    }
    navigation: { name: string; href: string }[]
}

export default function DashboardLayout({ children, user, navigation }: DashboardLayoutProps) {
    const pathname = usePathname()

    return (
        <div className="min-h-screen bg-theme">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-xl">
                <div className="page-container">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center">
                            <Logo width={100} height={32} />
                        </Link>

                        {/* Navigation - Center */}
                        <nav className="hidden sm:flex items-center gap-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all ${isActive
                                            ? 'text-theme-primary bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]'
                                            : 'text-theme-muted hover:text-theme-secondary hover:bg-[var(--bg-secondary)]'
                                            }`}
                                    >
                                        {isActive && (
                                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-full bg-[var(--accent)]" />
                                        )}
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* User + Theme Toggle */}
                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <Link href="/profile" className="text-right hidden sm:block hover:opacity-80 transition-opacity">
                                <p className="text-sm font-medium text-theme-primary">{user.name}</p>
                                <p className="eyebrow">{user.rollNumber || user.role}</p>
                            </Link>
                            <button
                                onClick={() => signOut({ callbackUrl: '/login' })}
                                className="btn btn-secondary btn-sm"
                                title="Sign Out"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    <nav className="sm:hidden flex gap-1 pb-3 overflow-x-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-all ${isActive
                                        ? 'text-theme-primary bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]'
                                        : 'text-theme-muted hover:text-theme-secondary'
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            )
                        })}
                    </nav>
                </div>
            </header>

            {/* Content */}
            <main className="page-container py-8">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {children}
                </motion.div>
            </main>
        </div>
    )
}
