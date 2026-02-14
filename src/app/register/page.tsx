'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Logo from '@/components/Logo'
import ThemeToggle from '@/components/ThemeToggle'

export default function RegisterPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        rollNumber: '',
        campusId: '',
        batch: '',
        semester: '',
        section: ''
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    // Validation functions
    const validateEmail = (email: string): string | null => {
        if (!email.toLowerCase().endsWith('@yenepoya.edu.in')) {
            return 'Email must be a @yenepoya.edu.in address'
        }
        return null
    }

    const validateCampusId = (campusId: string): string | null => {
        if (!/^\d{5}$/.test(campusId)) {
            return 'Campus ID must be exactly 5 digits'
        }
        return null
    }

    const validatePassword = (password: string): string | null => {
        if (password.length < 8) {
            return 'Password must be at least 8 characters'
        }
        if (!/[a-z]/.test(password)) {
            return 'Password must contain at least one lowercase letter'
        }
        if (!/[A-Z]/.test(password)) {
            return 'Password must contain at least one uppercase letter'
        }
        if (!/[0-9]/.test(password)) {
            return 'Password must contain at least one number'
        }
        if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(password)) {
            return 'Password must contain at least one special character'
        }
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        // Client-side validation
        const emailError = validateEmail(formData.email)
        if (emailError) {
            setError(emailError)
            setLoading(false)
            return
        }

        const campusIdError = validateCampusId(formData.campusId)
        if (campusIdError) {
            setError(campusIdError)
            setLoading(false)
            return
        }

        const passwordError = validatePassword(formData.password)
        if (passwordError) {
            setError(passwordError)
            setLoading(false)
            return
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Registration failed')
                setLoading(false)
                return
            }

            // Auto-login after successful registration
            const loginResult = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            })

            if (loginResult?.error) {
                router.push('/login')
            } else {
                router.push('/student')
            }
        } catch {
            setError('Something went wrong')
            setLoading(false)
        }
    }

    // Generate batch options (current year to next 4 years)
    const currentYear = new Date().getFullYear()
    const batchOptions = []
    for (let i = 0; i < 4; i++) {
        const startYear = currentYear - i
        const endYear = startYear + 4
        batchOptions.push(`${startYear}-${endYear.toString().slice(-2)}`)
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
                className="w-full max-w-lg relative my-8"
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
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                            Create Account
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            Register as a student to get started
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Field */}
                        <div className="space-y-2">
                            <label className="block text-xs font-medium uppercase tracking-wider"
                                style={{ color: 'var(--text-muted)' }}>
                                Full Name
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                    style={{
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                        </div>

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
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                    style={{
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder="campusid@yenepoya.edu.in"
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
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-12 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                    style={{
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder="Min 8 chars (A-z, 0-9, special)"
                                    required
                                    minLength={8}
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

                        {/* Registration Number Field */}
                        <div className="space-y-2">
                            <label className="block text-xs font-medium uppercase tracking-wider"
                                style={{ color: 'var(--text-muted)' }}>
                                Registration Number
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    name="rollNumber"
                                    value={formData.rollNumber}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                    style={{
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder="e.g., 23BBCCED009"
                                    required
                                />
                            </div>
                        </div>

                        {/* Campus ID Field */}
                        <div className="space-y-2">
                            <label className="block text-xs font-medium uppercase tracking-wider"
                                style={{ color: 'var(--text-muted)' }}>
                                Campus ID
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    name="campusId"
                                    value={formData.campusId}
                                    onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                    style={{
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border)',
                                        color: 'var(--text-primary)'
                                    }}
                                    placeholder="5 digits (e.g., 12345)"
                                    pattern="\d{5}"
                                    maxLength={5}
                                    required
                                />
                            </div>
                        </div>

                        {/* Row: Year and Semester */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Year Field */}
                            <div className="space-y-2">
                                <label className="block text-xs font-medium uppercase tracking-wider"
                                    style={{ color: 'var(--text-muted)' }}>
                                    Year
                                </label>
                                <select
                                    name="batch"
                                    value={formData.batch}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] appearance-none cursor-pointer"
                                    style={{
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border)',
                                        color: formData.batch ? 'var(--text-primary)' : 'var(--text-muted)'
                                    }}
                                    required
                                >
                                    <option value="">Select Year</option>
                                    <option value="2023-26">2023-26</option>
                                    <option value="2024-27">2024-27</option>
                                    <option value="2025-28">2025-28</option>
                                    <option value="2026-29">2026-29</option>
                                </select>
                            </div>

                            {/* Semester Field */}
                            <div className="space-y-2">
                                <label className="block text-xs font-medium uppercase tracking-wider"
                                    style={{ color: 'var(--text-muted)' }}>
                                    Semester
                                </label>
                                <select
                                    name="semester"
                                    value={formData.semester}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] appearance-none cursor-pointer"
                                    style={{
                                        background: 'var(--bg-tertiary)',
                                        border: '1px solid var(--border)',
                                        color: formData.semester ? 'var(--text-primary)' : 'var(--text-muted)'
                                    }}
                                    required
                                >
                                    <option value="">Select</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                        <option key={sem} value={sem}>Semester {sem}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Batch Field */}
                        <div className="space-y-2">
                            <label className="block text-xs font-medium uppercase tracking-wider"
                                style={{ color: 'var(--text-muted)' }}>
                                Batch
                            </label>
                            <select
                                name="section"
                                value={formData.section}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[var(--accent)] appearance-none cursor-pointer"
                                style={{
                                    background: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border)',
                                    color: formData.section ? 'var(--text-primary)' : 'var(--text-muted)'
                                }}
                                required
                            >
                                <option value="">Select Batch</option>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(num => (
                                    <option key={num} value={String(num)}>Batch {num}</option>
                                ))}
                            </select>
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
                                    Create Account
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            Already have an account?{' '}
                            <Link href="/login" className="font-medium transition-colors hover:opacity-80" style={{ color: 'var(--accent)' }}>
                                Sign in
                            </Link>
                        </p>
                    </div>

                    {/* Terms & Privacy */}
                    <div className="mt-4 text-center">
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            By registering, you agree to our{' '}
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
