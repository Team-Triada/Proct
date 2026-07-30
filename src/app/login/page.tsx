'use client'

import { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Shield, Lock, FileText, Quote } from 'lucide-react'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'

// ─── Shared style tokens ──────────────────────────────────────────────────────

// Eyebrow label: matches .eyebrow system class — JetBrains Mono, 10px, 0.15em tracking
const LABEL = 'block font-mono text-[10px] font-medium uppercase tracking-[0.15em] mb-1.5'
const LABEL_COLOR = { color: 'var(--text-muted)' }

// Input: consistent across login + register; 16px font on all viewports prevents iOS auto-zoom
const INPUT_BASE = 'w-full pl-10 pr-4 py-3 rounded-xl text-base sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] min-h-[48px]'
const INPUT_STYLE = { background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }

// Select: same as input but no leading icon padding
const SELECT_BASE = 'w-full px-3 py-3 rounded-xl text-base sm:text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] appearance-none cursor-pointer min-h-[48px]'

// ─── Left Panel ───────────────────────────────────────────────────────────────

function BrandPanel() {
    const highlights = [
        {
            icon: Shield,
            label: 'Structural Integrity',
            desc: 'Linear navigation and strict timing prevent student collaboration.',
        },
        {
            icon: Lock,
            label: 'Granular Control',
            desc: 'Target specific batches and academic years with surgical precision.',
        },
        {
            icon: FileText,
            label: 'Audit Readiness',
            desc: 'Comprehensive logs and anomaly detection for every attempt.',
        },
    ]

    return (
        <div className="relative flex flex-col justify-between h-full p-12 xl:p-16 overflow-hidden select-none bg-gradient-to-br from-[var(--bg-secondary)] via-[var(--bg-secondary)] to-[var(--bg-primary)] border-r border-[var(--border-subtle)]">
            {/* Ambient glows */}
            <div className="absolute -top-24 -left-24 w-[400px] h-[400px] bg-[var(--accent)] opacity-[0.07] blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[var(--neon-blue)] opacity-[0.05] blur-[100px] rounded-full pointer-events-none" />

            {/* Logo */}
            <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 relative shrink-0">
                    <Image src="/icon.png" alt="Proct logo" fill className="object-contain" sizes="40px" />
                </div>
                <span className="font-jakarta font-black text-2xl tracking-tighter uppercase" style={{ color: 'var(--text-primary)' }}>
                    Proct<span style={{ color: 'var(--accent)' }}>.</span>
                </span>
            </div>

            {/* Main content */}
            <div className="relative z-10 space-y-12">
                {/* Eyebrow + hero heading */}
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 border border-[var(--accent)]/30 bg-[var(--accent)]/5" style={{ color: 'var(--accent)' }}>
                        <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-none" />
                        <span className="font-mono font-bold text-[10px] tracking-[0.2em] uppercase">Integrity Engine</span>
                    </div>
                    <h1 className="font-jakarta font-extrabold text-4xl xl:text-5xl leading-[1.1] tracking-tight uppercase" style={{ color: 'var(--text-primary)' }}>
                        FAIR ASSESSMENTS,<br />
                        <span style={{ color: 'var(--text-muted)' }}>BY DESIGN.</span>
                    </h1>
                </div>

                {/* Feature list */}
                <div className="space-y-7">
                    {highlights.map((h, i) => (
                        <div key={i} className="flex gap-5 group">
                            <div className="w-10 h-10 shrink-0 border border-[var(--border-subtle)] bg-[var(--bg-primary)] flex items-center justify-center transition-colors group-hover:border-[var(--accent)]/30">
                                <h.icon size={18} className="transition-colors" style={{ color: 'var(--text-secondary)' }} />
                            </div>
                            <div>
                                {/* Feature label: font-jakarta, 13px, medium weight — NOT mono */}
                                <p className="font-jakarta font-semibold text-[13px] uppercase tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
                                    {h.label}
                                </p>
                                <p className="font-mono text-[11px] leading-relaxed max-w-xs" style={{ color: 'var(--text-muted)' }}>
                                    {h.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quote */}
                <div className="pt-8 border-t border-[var(--border-subtle)] relative">
                    <Quote className="absolute -top-3 left-6 opacity-40" size={22} style={{ color: 'var(--border-subtle)' }} />
                    <blockquote className="space-y-3">
                        <p className="font-mono text-[13px] leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>
                            &ldquo;The measure of intelligence is the ability to change.&rdquo;
                        </p>
                        <footer className="flex items-center gap-2">
                            <div className="w-4 h-px" style={{ background: 'var(--accent)' }} />
                            <cite className="font-mono text-[10px] uppercase tracking-[0.15em] not-italic" style={{ color: 'var(--text-muted)' }}>
                                Albert Einstein
                            </cite>
                        </footer>
                    </blockquote>
                </div>
            </div>

            {/* Footer */}
            <div className="relative z-10 flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
                    v1.0.0 &copy; {new Date().getFullYear()}
                </p>
                <div className="h-px flex-1 mx-6" style={{ background: 'var(--border-subtle)' }} />
                <p className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: 'var(--text-muted)' }}>
                    TRIADA SYSTEMS
                </p>
            </div>
        </div>
    )
}

// ─── Login Form ───────────────────────────────────────────────────────────────

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const result = await signIn('credentials', { email, password, redirect: false })
            if (result?.error) { setError('Invalid email or password'); setLoading(false); return }
            const res = await fetch('/api/auth/session')
            const session = await res.json()
            if (session?.user?.role === 'ADMIN') router.push('/admin')
            else if (session?.user?.role === 'FACULTY') router.push('/faculty')
            else router.push('/student')
        } catch {
            setError('Something went wrong')
            setLoading(false)
        }
    }

    return (
        <motion.div key="login" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                    <label htmlFor="login-email" className={LABEL} style={LABEL_COLOR}>Email</label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </span>
                        <input
                            id="login-email"
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

                {/* Password */}
                <div>
                    <label htmlFor="login-password" className={LABEL} style={LABEL_COLOR}>Password</label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </span>
                        <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className={`${INPUT_BASE} pr-12`}
                            style={INPUT_STYLE}
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-0 top-0 h-full w-11 flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            {showPassword
                                ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            }
                        </button>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Link
                        href="/forgot-password"
                        className="font-mono text-[11px] transition-opacity hover:opacity-80"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        Forgot password?
                    </Link>
                </div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            role="alert"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="p-3 rounded-xl font-mono text-xs text-center pill-red"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[48px] py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    style={{ background: 'var(--accent)', boxShadow: '0 0 24px -4px rgba(224,62,62,0.35)' }}
                >
                    {loading
                        ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <>Sign in <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>
                    }
                </button>
            </form>

            <p className="mt-5 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                No account yet?{' '}
                <button onClick={onSwitch} className="font-semibold cursor-pointer transition-opacity hover:opacity-80" style={{ color: 'var(--accent)' }}>
                    Create one
                </button>
            </p>
        </motion.div>
    )
}

// ─── Register Form ────────────────────────────────────────────────────────────

type FieldFormat = 'NUMERIC' | 'ALPHA' | 'ALPHANUMERIC' | 'ANY'
interface RegSettings {
    allowedEmailDomains: string[]
    studentIdLabel: string; studentIdFormat: FieldFormat; studentIdMinLength: number; studentIdMaxLength: number; studentIdRequired: boolean
    rollNumberLabel: string; rollNumberFormat: FieldFormat; rollNumberMinLength: number; rollNumberMaxLength: number; rollNumberRequired: boolean
    maxSemester: number; availableBatches: string[]; maxBatchNumber: number
}
const REG_DEFAULTS: RegSettings = {
    allowedEmailDomains: [], studentIdLabel: 'Campus ID', studentIdFormat: 'ANY', studentIdMinLength: 1, studentIdMaxLength: 50, studentIdRequired: false,
    rollNumberLabel: 'Registration Number', rollNumberFormat: 'ANY', rollNumberMinLength: 1, rollNumberMaxLength: 50, rollNumberRequired: true,
    maxSemester: 8, availableBatches: [], maxBatchNumber: 13,
}

const IconUser = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
const IconEmail = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
const IconLock = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
const IconId = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" /></svg>

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
    const router = useRouter()
    const [formData, setFormData] = useState({ name: '', email: '', password: '', rollNumber: '', campusId: '', batch: '', semester: '', section: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [settings, setSettings] = useState<RegSettings>(REG_DEFAULTS)

    useEffect(() => {
        fetch('/api/settings/public').then(r => r.json()).then(setSettings).catch(() => {})
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))

    const emailPlaceholder = settings.allowedEmailDomains.length > 0
        ? `you${settings.allowedEmailDomains[0]}`
        : 'you@institution.edu'

    const validate = () => {
        if (settings.allowedEmailDomains.length > 0) {
            const emailLower = formData.email.toLowerCase()
            const allowed = settings.allowedEmailDomains.some((d: string) =>
                emailLower.endsWith(d.startsWith('@') ? d.toLowerCase() : `@${d.toLowerCase()}`)
            )
            if (!allowed) return `Email must use: ${settings.allowedEmailDomains.join(', ')}`
        }
        if (settings.studentIdRequired && formData.campusId) {
            if (formData.campusId.length < settings.studentIdMinLength || formData.campusId.length > settings.studentIdMaxLength) {
                return `${settings.studentIdLabel} must be ${settings.studentIdMinLength}–${settings.studentIdMaxLength} characters`
            }
        }
        if (formData.password.length < 8) return 'Password must be at least 8 characters'
        if (!/[a-z]/.test(formData.password)) return 'Password needs a lowercase letter'
        if (!/[A-Z]/.test(formData.password)) return 'Password needs an uppercase letter'
        if (!/[0-9]/.test(formData.password)) return 'Password needs a number'
        if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(formData.password)) return 'Password needs a special character'
        return null
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        const err = validate()
        if (err) { setError(err); return }
        setLoading(true)
        try {
            const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
            const data = await res.json()
            if (!res.ok) { setError(data.error || 'Registration failed'); setLoading(false); return }
            const loginResult = await signIn('credentials', { email: formData.email, password: formData.password, redirect: false })
            if (loginResult?.error) { setError('Account created but sign-in failed. Please sign in manually.'); setLoading(false); return }
            router.push('/student')
        } catch {
            setError('Something went wrong')
            setLoading(false)
        }
    }

    const semesterOptions = Array.from({ length: settings.maxSemester }, (_, i) => i + 1)
    const batchOptions = Array.from({ length: settings.maxBatchNumber }, (_, i) => i + 1)
    const yearOptions = settings.availableBatches.length > 0 ? settings.availableBatches : []

    return (
        <motion.div key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            <form onSubmit={handleSubmit} className="space-y-3">
                {/* Name */}
                <div>
                    <label htmlFor="reg-name" className={LABEL} style={LABEL_COLOR}>Full Name</label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}><IconUser /></span>
                        <input id="reg-name" type="text" name="name" autoComplete="name" value={formData.name} onChange={handleChange} className={INPUT_BASE} style={INPUT_STYLE} placeholder="Your full name" required />
                    </div>
                </div>

                {/* Email */}
                <div>
                    <label htmlFor="reg-email" className={LABEL} style={LABEL_COLOR}>Email</label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}><IconEmail /></span>
                        <input id="reg-email" type="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} className={INPUT_BASE} style={INPUT_STYLE} placeholder={emailPlaceholder} required />
                    </div>
                    {settings.allowedEmailDomains.length > 0 && (
                        <p className="mt-1 font-mono text-[10px] tracking-[0.05em]" style={{ color: 'var(--text-muted)' }}>
                            Allowed: {settings.allowedEmailDomains.join(', ')}
                        </p>
                    )}
                </div>

                {/* Password */}
                <div>
                    <label htmlFor="reg-password" className={LABEL} style={LABEL_COLOR}>Password</label>
                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}><IconLock /></span>
                        <input
                            id="reg-password"
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={handleChange}
                            className={`${INPUT_BASE} pr-12`}
                            style={INPUT_STYLE}
                            placeholder="Min 8 chars — A-z 0-9 symbol"
                            required
                            minLength={8}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-0 top-0 h-full w-11 flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            {showPassword
                                ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            }
                        </button>
                    </div>
                </div>

                {/* Roll Number */}
                {settings.rollNumberRequired && (
                    <div>
                        <label htmlFor="reg-roll" className={LABEL} style={LABEL_COLOR}>{settings.rollNumberLabel}</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}><IconId /></span>
                            <input
                                id="reg-roll"
                                type="text"
                                name="rollNumber"
                                autoComplete="off"
                                value={formData.rollNumber}
                                onChange={handleChange}
                                className={INPUT_BASE}
                                style={INPUT_STYLE}
                                placeholder={settings.rollNumberFormat === 'NUMERIC' ? 'Numbers only' : settings.rollNumberFormat === 'ALPHA' ? 'Letters only' : 'e.g. 23BBCCED009'}
                                required={settings.rollNumberRequired}
                            />
                        </div>
                    </div>
                )}

                {/* Campus ID */}
                {settings.studentIdRequired && (
                    <div>
                        <label htmlFor="reg-campus" className={LABEL} style={LABEL_COLOR}>{settings.studentIdLabel}</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" /></svg>
                            </span>
                            <input
                                id="reg-campus"
                                type="text"
                                name="campusId"
                                autoComplete="off"
                                value={formData.campusId}
                                onChange={handleChange}
                                className={INPUT_BASE}
                                style={INPUT_STYLE}
                                placeholder={settings.studentIdFormat === 'NUMERIC' ? `${settings.studentIdMinLength}–${settings.studentIdMaxLength} digits` : settings.studentIdLabel}
                                maxLength={settings.studentIdMaxLength}
                                required={settings.studentIdRequired}
                            />
                        </div>
                    </div>
                )}

                {/* Year + Semester — forced 2-col on all screen sizes */}
                <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div>
                        <label htmlFor="reg-batch" className={LABEL} style={LABEL_COLOR}>Year</label>
                        {yearOptions.length > 0 ? (
                            <select
                                id="reg-batch"
                                name="batch"
                                value={formData.batch}
                                onChange={handleChange}
                                className={SELECT_BASE}
                                style={{ ...INPUT_STYLE, color: formData.batch ? 'var(--text-primary)' : 'var(--text-muted)' }}
                                required
                            >
                                <option value="">Year</option>
                                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        ) : (
                            <input
                                id="reg-batch"
                                type="text"
                                name="batch"
                                autoComplete="off"
                                value={formData.batch}
                                onChange={handleChange}
                                className={SELECT_BASE}
                                style={INPUT_STYLE}
                                placeholder="2024-27"
                                required
                            />
                        )}
                    </div>
                    <div>
                        <label htmlFor="reg-semester" className={LABEL} style={LABEL_COLOR}>Semester</label>
                        <select
                            id="reg-semester"
                            name="semester"
                            value={formData.semester}
                            onChange={handleChange}
                            className={SELECT_BASE}
                            style={{ ...INPUT_STYLE, color: formData.semester ? 'var(--text-primary)' : 'var(--text-muted)' }}
                            required
                        >
                            <option value="">Sem</option>
                            {semesterOptions.map(s => <option key={s} value={s}>Sem {s}</option>)}
                        </select>
                    </div>
                </div>

                {/* Batch */}
                <div>
                    <label htmlFor="reg-section" className={LABEL} style={LABEL_COLOR}>Batch</label>
                    <select
                        id="reg-section"
                        name="section"
                        value={formData.section}
                        onChange={handleChange}
                        className={SELECT_BASE}
                        style={{ ...INPUT_STYLE, color: formData.section ? 'var(--text-primary)' : 'var(--text-muted)' }}
                        required
                    >
                        <option value="">Select Batch</option>
                        {batchOptions.map(n => <option key={n} value={String(n)}>Batch {n}</option>)}
                    </select>
                </div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            role="alert"
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="p-3 rounded-xl font-mono text-xs text-center pill-red"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[48px] py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    style={{ background: 'var(--accent)', boxShadow: '0 0 24px -4px rgba(224,62,62,0.35)' }}
                >
                    {loading
                        ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <>Create Account <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>
                    }
                </button>
            </form>

            <p className="mt-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <button onClick={onSwitch} className="font-semibold cursor-pointer transition-opacity hover:opacity-80" style={{ color: 'var(--accent)' }}>
                    Sign in
                </button>
            </p>
        </motion.div>
    )
}

// ─── Page inner ───────────────────────────────────────────────────────────────

function LoginPageInner() {
    const searchParams = useSearchParams()
    const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login'
    const [tab, setTab] = useState<'login' | 'register'>(initialTab as 'login' | 'register')

    return (
        <div className="min-h-dvh flex" style={{ background: 'var(--bg-primary)' }}>

            {/* Theme toggle */}
            <div className="fixed top-4 right-4 z-50">
                <div className="p-1.5 rounded-xl backdrop-blur-xl transition-colors"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                    <ThemeToggle />
                </div>
            </div>

            {/* Left branded panel — desktop only */}
            <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col">
                <BrandPanel />
            </div>

            {/* Vertical divider — desktop only */}
            <div className="hidden lg:block w-px shrink-0" style={{ background: 'var(--border-subtle)' }} />

            {/* Right auth panel */}
            <div className="flex-1 flex items-center justify-center px-5 py-8 sm:p-10 lg:p-12 overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="w-full max-w-md"
                >
                    {/* Mobile brand strip — replaces bare logo for context */}
                    <div className="flex flex-col items-center gap-2 mb-7 lg:hidden">
                        <Logo width={110} height={36} />
                        {/* Tagline — gives mobile users product context the left panel normally provides */}
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-center" style={{ color: 'var(--text-muted)' }}>
                            Integrity-first assessment engine
                        </p>
                    </div>

                    {/* Tab toggle */}
                    <div
                        className="flex rounded-xl p-1 mb-7 gap-1"
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                        role="tablist"
                        aria-label="Authentication options"
                    >
                        {(['login', 'register'] as const).map(t => (
                            <button
                                key={t}
                                role="tab"
                                aria-selected={tab === t}
                                onClick={() => setTab(t)}
                                className="flex-1 min-h-[44px] rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
                                style={{
                                    background: tab === t ? 'var(--accent)' : 'transparent',
                                    color: tab === t ? 'white' : 'var(--text-muted)',
                                    boxShadow: tab === t ? '0 0 16px -4px rgba(224,62,62,0.4)' : 'none',
                                }}
                            >
                                {t === 'login' ? 'Sign In' : 'Register'}
                            </button>
                        ))}
                    </div>

                    {/* Section heading */}
                    <div className="mb-6">
                        <h2
                            className="font-jakarta font-bold tracking-tight uppercase"
                            style={{ fontSize: 'clamp(18px, 4vw, 24px)', color: 'var(--text-primary)', lineHeight: 1.15 }}
                        >
                            {tab === 'login' ? 'Identity Verification' : 'Enrollment'}
                        </h2>
                        <p className="font-mono text-[11px] mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                            {tab === 'login'
                                ? 'Authorized personnel only. Please sign in.'
                                : 'Register for the integrity-first assessment engine.'}
                        </p>
                    </div>

                    {/* Forms */}
                    <AnimatePresence mode="wait">
                        {tab === 'login'
                            ? <LoginForm key="login" onSwitch={() => setTab('register')} />
                            : <RegisterForm key="register" onSwitch={() => setTab('login')} />
                        }
                    </AnimatePresence>

                    {/* Legal */}
                    <p className="mt-6 text-center font-mono text-[10px] tracking-[0.12em] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        By continuing, you agree to our{' '}
                        <Link href="/terms" className="transition-opacity hover:opacity-80" style={{ color: 'var(--accent)' }}>Terms</Link>
                        {' & '}
                        <Link href="/privacy" className="transition-opacity hover:opacity-80" style={{ color: 'var(--accent)' }}>Privacy Policy</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
                <div className="w-6 h-6 border-2 border-t-[var(--accent)] rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
            </div>
        }>
            <LoginPageInner />
        </Suspense>
    )
}
