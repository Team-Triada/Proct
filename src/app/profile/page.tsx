'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

interface ProfileData {
    id: string
    name: string
    email: string
    rollNumber: string | null
    campusId: string | null
    semester: number | null
    batch: string | null
    section: string | null
    department: string | null
    image: string | null
    role: string
}

export default function ProfilePage() {
    const { status } = useSession()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [formData, setFormData] = useState<ProfileData>({
        id: '',
        name: '',
        email: '',
        rollNumber: null,
        campusId: null,
        semester: null,
        batch: null,
        section: null,
        department: null,
        image: null,
        role: ''
    })

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
            return
        }

        if (status === 'authenticated') {
            fetchProfile()
        }
    }, [status, router])

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile')
            if (res.ok) {
                const data = await res.json()
                setFormData(data)
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                const updated = await res.json()
                setFormData(updated)
                setMessage({ type: 'success', text: 'Profile updated successfully!' })
            } else {
                const error = await res.json()
                setMessage({ type: 'error', text: error.error || 'Failed to update profile' })
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error. Please try again.' })
        } finally {
            setSaving(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value || null
        }))
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-theme">
                <div className="spinner" style={{ width: '32px', height: '32px' }} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-theme">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-theme-subtle bg-theme-primary">
                <div className="max-w-3xl mx-auto px-6">
                    <div className="flex items-center justify-between h-16">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-theme-muted hover:text-theme-primary transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back
                        </button>
                        <h1 className="text-lg font-semibold">My Profile</h1>
                        <div className="w-16"></div>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                >
                    {/* Profile Header */}
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-theme-tertiary border-2 border-theme-subtle overflow-hidden flex items-center justify-center">
                                {formData.image ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={formData.image}
                                        alt={formData.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-3xl font-semibold text-theme-muted">
                                        {formData.name?.charAt(0)?.toUpperCase() || '?'}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold text-theme-primary">{formData.name}</h2>
                            <p className="text-theme-muted">{formData.email}</p>
                            <span className="badge badge-primary mt-2">{formData.role}</span>
                        </div>
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`p-4 rounded-xl border ${message.type === 'success'
                            ? 'bg-success/10 border-success/30 text-success'
                            : 'bg-danger/10 border-danger/30 text-danger'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="card p-6 space-y-6">
                            <div className="flex items-center justify-between border-b border-theme-subtle pb-4">
                                <h3 className="text-lg font-medium">Personal Information</h3>
                                {formData.role === 'STUDENT' && (
                                    <span className="text-xs text-theme-muted bg-theme-tertiary px-3 py-1 rounded-full">
                                        Read Only - Contact admin/faculty to make changes
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`input ${formData.role === 'STUDENT' ? 'opacity-60' : ''}`}
                                        disabled={formData.role === 'STUDENT'}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="label">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        className="input opacity-60"
                                        disabled
                                    />
                                </div>

                                <div>
                                    <label className="label">Registration Number</label>
                                    <input
                                        type="text"
                                        name="rollNumber"
                                        value={formData.rollNumber || ''}
                                        onChange={handleChange}
                                        className={`input ${formData.role === 'STUDENT' ? 'opacity-60' : ''}`}
                                        placeholder="e.g. REG2024001"
                                        disabled={formData.role === 'STUDENT'}
                                    />
                                </div>

                                <div>
                                    <label className="label">Campus ID</label>
                                    <input
                                        type="text"
                                        name="campusId"
                                        value={formData.campusId || ''}
                                        onChange={handleChange}
                                        className={`input ${formData.role === 'STUDENT' ? 'opacity-60' : ''}`}
                                        placeholder="e.g. BLR-123"
                                        disabled={formData.role === 'STUDENT'}
                                    />
                                </div>

                                <div>
                                    <label className="label">Current Semester</label>
                                    <select
                                        name="semester"
                                        value={formData.semester || ''}
                                        onChange={handleChange}
                                        className={`input ${formData.role === 'STUDENT' ? 'opacity-60' : ''}`}
                                        disabled={formData.role === 'STUDENT'}
                                    >
                                        <option value="">Select Semester</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                            <option key={sem} value={sem}>Semester {sem}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="label">Year</label>
                                    <input
                                        type="text"
                                        name="batch"
                                        value={formData.batch || ''}
                                        onChange={handleChange}
                                        className={`input ${formData.role === 'STUDENT' ? 'opacity-60' : ''}`}
                                        placeholder="e.g. 2023-2026"
                                        disabled={formData.role === 'STUDENT'}
                                    />
                                </div>

                                <div>
                                    <label className="label">Batch</label>
                                    <input
                                        type="text"
                                        name="section"
                                        value={formData.section || ''}
                                        onChange={handleChange}
                                        className={`input ${formData.role === 'STUDENT' ? 'opacity-60' : ''}`}
                                        placeholder="e.g. 1, 2, 3..."
                                        disabled={formData.role === 'STUDENT'}
                                    />
                                </div>

                                <div>
                                    <label className="label">Department</label>
                                    <input
                                        type="text"
                                        name="department"
                                        value={formData.department || ''}
                                        onChange={handleChange}
                                        className={`input ${formData.role === 'STUDENT' ? 'opacity-60' : ''}`}
                                        placeholder="e.g. Computer Science"
                                        disabled={formData.role === 'STUDENT'}
                                    />
                                </div>

                                <div>
                                    <label className="label">Profile Image URL</label>
                                    <input
                                        type="url"
                                        name="image"
                                        value={formData.image || ''}
                                        onChange={handleChange}
                                        className={`input ${formData.role === 'STUDENT' ? 'opacity-60' : ''}`}
                                        placeholder="https://example.com/photo.jpg"
                                        disabled={formData.role === 'STUDENT'}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="btn btn-secondary"
                            >
                                {formData.role === 'STUDENT' ? 'Back' : 'Cancel'}
                            </button>
                            {formData.role !== 'STUDENT' && (
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn btn-primary"
                                >
                                    {saving ? (
                                        <>
                                            <div className="spinner" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </motion.div>
            </main>
        </div>
    )
}
