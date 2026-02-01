'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import ThemeToggle from '@/components/ThemeToggle'
import Logo from '@/components/Logo'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

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

    const fillDemo = (type: 'admin' | 'faculty' | 'student') => {
        const creds = {
            admin: { email: 'admin@college.edu', password: 'admin123' },
            faculty: { email: 'prof.kumar@college.edu', password: 'faculty123' },
            student: { email: 'rahul@college.edu', password: 'student123' }
        }
        setEmail(creds[type].email)
        setPassword(creds[type].password)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-theme">
            {/* Theme Toggle - Top Right */}
            <div className="fixed top-4 right-4">
                <ThemeToggle />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm"
            >
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-4">
                        <Logo width={150} height={50} />
                    </div>
                    <p className="text-sm text-theme-secondary">Integrity-first online quizzes</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="input"
                            placeholder="you@college.edu"
                            required
                        />
                    </div>

                    <div>
                        <label className="label">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 rounded-lg text-sm text-center badge-danger"
                        >
                            {error}
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary btn-lg w-full mt-2"
                    >
                        {loading ? <div className="spinner" /> : 'Sign In'}
                    </button>
                </form>

                {/* Demo */}
                <div className="mt-8 pt-6 border-t border-theme-subtle">
                    <p className="text-xs text-center mb-3 text-theme-muted">Demo accounts</p>
                    <div className="flex gap-2">
                        {(['admin', 'faculty', 'student'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => fillDemo(type)}
                                className="btn btn-ghost flex-1 text-xs capitalize"
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
