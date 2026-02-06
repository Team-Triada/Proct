'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Invalid credentials')
                setLoading(false)
                return
            }

            const res = await fetch('/api/auth/session')
            const session = await res.json()

            if (session?.user?.role === 'ADMIN') {
                router.push('/admin')
            } else if (session?.user?.role === 'FACULTY') {
                router.push('/faculty')
            } else {
                router.push('/student')
            }
        } catch {
            setError('Something went wrong')
            setLoading(false)
        }
    }



    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300"
            style={{ background: 'var(--bg-primary)' }}>

            {/* Theme Toggle - Fixed Top Right */}
            <div className="fixed top-6 right-6 z-50">
                <div className="p-1.5 rounded-xl backdrop-blur-md transition-colors"
                    style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)'
                    }}>
                    <ThemeToggle />
                </div>
            </div>

            {/* Background glow effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 transition-opacity duration-500"
                style={{ background: 'var(--accent)' }} />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-10 transition-opacity duration-500"
                style={{ background: '#22c55e' }} />

            {/* Main Card */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md relative"
            >
                {/* Glassmorphic card */}
                <div className="rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden transition-colors duration-300"
                    style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>

                    {/* Top accent line */}
                    <div className="absolute top-0 left-8 right-8 h-[2px] rounded-full"
                        style={{ background: 'linear-gradient(90deg, transparent, var(--accent), transparent)' }} />

                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                        >
                            <Logo width={140} height={46} />
                        </motion.div>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                            Welcome back
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            Sign in to continue to your account
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <label className="block text-xs font-medium uppercase tracking-wider"
                                style={{ color: 'var(--text-muted)' }}>
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                    style={{
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="block text-xs font-medium uppercase tracking-wider"
                                style={{ color: 'var(--text-muted)' }}>
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                    style={{
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-xl text-sm text-center badge-danger"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 hover:opacity-90"
                            style={{
                                background: 'var(--accent)',
                                boxShadow: '0 4px 20px rgba(239, 68, 68, 0.25)'
                            }}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign in
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>



                    {/* Register Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="font-medium transition-colors hover:opacity-80" style={{ color: 'var(--accent)' }}>
                                Register
                            </Link>
                        </p>
                    </div>

                    {/* Terms & Privacy */}
                    <div className="mt-4 text-center">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            By signing in, you agree to our{' '}
                            <Link href="/terms" className="transition-colors hover:opacity-80" style={{ color: 'var(--accent)' }}>
                                Terms
                            </Link>
                            {' '}and{' '}
                            <Link href="/privacy" className="transition-colors hover:opacity-80" style={{ color: 'var(--accent)' }}>
                                Privacy Policy
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Bottom glow under card */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 rounded-full blur-3xl opacity-15"
                    style={{ background: 'var(--accent)' }} />
            </motion.div>
        </div>
    )
}
