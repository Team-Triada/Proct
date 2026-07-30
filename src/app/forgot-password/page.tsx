'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail } from 'lucide-react'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'

const LABEL = 'block font-mono text-[10px] font-medium uppercase tracking-[0.15em] mb-1.5'
const INPUT_BASE = 'w-full pl-10 pr-4 py-3 rounded-xl text-base sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-h-[48px]'
const INPUT_STYLE = { background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [devResetUrl, setDevResetUrl] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            const data = await res.json()
            if (data.devResetUrl) setDevResetUrl(data.devResetUrl)
            setSent(true)
        } catch {
            // The endpoint answers generically by design, so a network failure
            // is the only case worth distinguishing here.
            setSent(true)
        } finally {
            setLoading(false)
        }
    }

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
                    {sent ? (
                        <div className="space-y-5 text-center">
                            <div
                                className="w-12 h-12 mx-auto rounded-full flex items-center justify-center"
                                style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}
                            >
                                <Mail size={20} style={{ color: 'var(--accent)' }} />
                            </div>
                            <h1
                                className="font-jakarta font-bold text-lg"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Check your email
                            </h1>
                            <p className="font-mono text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                                If that address is registered, a reset link is on its way. The link expires in one hour
                                and can be used once.
                            </p>

                            {devResetUrl && (
                                <div
                                    className="p-3 rounded-xl text-left space-y-2"
                                    style={{ background: 'var(--bg-tertiary)', border: '1px dashed var(--border)' }}
                                >
                                    <p
                                        className="font-mono text-[9px] uppercase tracking-[0.15em]"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        Development only — no mail provider configured
                                    </p>
                                    <Link
                                        href={devResetUrl}
                                        className="font-mono text-[10px] break-all underline"
                                        style={{ color: 'var(--accent)' }}
                                    >
                                        {devResetUrl}
                                    </Link>
                                </div>
                            )}

                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 font-mono text-[11px] transition-opacity hover:opacity-80"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                <ArrowLeft size={12} /> Back to sign in
                            </Link>
                        </div>
                    ) : (
                        <>
                            <h1
                                className="font-jakarta font-bold text-lg mb-2"
                                style={{ color: 'var(--text-primary)' }}
                            >
                                Reset your password
                            </h1>
                            <p className="font-mono text-[11px] leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
                                Enter the email address on your account and we&apos;ll send you a link to set a new
                                password.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label htmlFor="email" className={LABEL} style={{ color: 'var(--text-muted)' }}>
                                        Email
                                    </label>
                                    <div className="relative">
                                        <span
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                            style={{ color: 'var(--text-muted)' }}
                                        >
                                            <Mail size={16} />
                                        </span>
                                        <input
                                            id="email"
                                            type="email"
                                            autoComplete="email"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            className={INPUT_BASE}
                                            style={INPUT_STYLE}
                                            placeholder="you@yenepoya.edu.in"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full min-h-[48px] py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    style={{ background: 'var(--accent)' }}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'Send reset link'
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
                    )}
                </div>
            </motion.div>
        </div>
    )
}
