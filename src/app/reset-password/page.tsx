'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Lock } from 'lucide-react'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'
import { PASSWORD_REQUIREMENTS } from '@/lib/passwordPolicy'

const LABEL = 'block font-mono text-[10px] font-medium uppercase tracking-[0.15em] mb-1.5'
const INPUT_BASE = 'w-full pl-10 pr-4 py-3 rounded-xl text-base sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-h-[48px]'
const INPUT_STYLE = { background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }

function ResetPasswordForm() {
    const router = useRouter()
    const token = useSearchParams().get('token') ?? ''

    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')

        if (password !== confirm) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            })
            const data = await res.json()
            if (!res.ok) {
                setError(data.error || 'Something went wrong')
                return
            }
            setDone(true)
            setTimeout(() => router.push('/login'), 2000)
        } catch {
            setError('Something went wrong. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (!token) {
        return (
            <div className="space-y-5 text-center">
                <h1 className="font-jakarta font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                    Link incomplete
                </h1>
                <p className="font-mono text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    This page needs a reset token. Request a fresh link and open it directly from your email.
                </p>
                <Link
                    href="/forgot-password"
                    className="inline-flex items-center gap-2 font-mono text-[11px] transition-opacity hover:opacity-80"
                    style={{ color: 'var(--accent)' }}
                >
                    Request a new link
                </Link>
            </div>
        )
    }

    if (done) {
        return (
            <div className="space-y-5 text-center">
                <div
                    className="w-12 h-12 mx-auto rounded-full flex items-center justify-center"
                    style={{ background: 'color-mix(in srgb, var(--success) 12%, transparent)' }}
                >
                    <Check size={20} style={{ color: 'var(--success)' }} />
                </div>
                <h1 className="font-jakarta font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                    Password updated
                </h1>
                <p className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Taking you to the sign-in page…
                </p>
            </div>
        )
    }

    return (
        <>
            <h1 className="font-jakarta font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
                Choose a new password
            </h1>
            <p className="font-mono text-[11px] leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
                This link works once. After saving, use your new password to sign in.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label htmlFor="password" className={LABEL} style={{ color: 'var(--text-muted)' }}>
                        New password
                    </label>
                    <div className="relative">
                        <span
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <Lock size={16} />
                        </span>
                        <input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className={INPUT_BASE}
                            style={INPUT_STYLE}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="confirm" className={LABEL} style={{ color: 'var(--text-muted)' }}>
                        Confirm password
                    </label>
                    <div className="relative">
                        <span
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <Lock size={16} />
                        </span>
                        <input
                            id="confirm"
                            type="password"
                            autoComplete="new-password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            className={INPUT_BASE}
                            style={INPUT_STYLE}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <ul className="space-y-1">
                    {PASSWORD_REQUIREMENTS.map(req => (
                        <li
                            key={req}
                            className="font-mono text-[10px] flex items-center gap-2"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <span
                                className="w-1 h-1 rounded-full shrink-0"
                                style={{ background: 'var(--text-muted)' }}
                            />
                            {req}
                        </li>
                    ))}
                </ul>

                {error && (
                    <div role="alert" className="p-3 rounded-xl font-mono text-xs text-center pill-red">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[48px] py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    style={{ background: 'var(--accent)' }}
                >
                    {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        'Save new password'
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 font-mono text-[11px] transition-opacity hover:opacity-80"
                    style={{ color: 'var(--text-secondary)' }}
                >
                    <ArrowLeft size={12} /> Back to sign in
                </Link>
            </div>
        </>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-primary)' }}>
            <div className="absolute top-6 right-6">
                <ThemeToggle />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm"
            >
                <div className="flex justify-center mb-8">
                    <Logo />
                </div>

                <div
                    className="rounded-2xl p-8"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                >
                    <Suspense fallback={<div className="h-64" />}>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </motion.div>
        </div>
    )
}
