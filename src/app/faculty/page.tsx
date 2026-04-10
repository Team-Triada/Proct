'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'

const navigation = [
    { name: 'Overview', href: '/faculty' },
    { name: 'My Quizzes', href: '/faculty/quizzes' },
    { name: 'Students', href: '/faculty/students' },
    { name: 'Create Quiz', href: '/faculty/quizzes/create' },
]

interface Subject {
    id: string
    code: string
    name: string
    semester: number
    department: string
    quizzes: {
        id: string
        title: string
        isPublished: boolean
        _count: { attempts: number; questions: number }
    }[]
    _count: { quizzes: number }
}

interface SubjectFormData {
    code: string
    name: string
    semester: string
    department: string
}

export default function FacultyDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
    const [formData, setFormData] = useState<SubjectFormData>({
        code: '',
        name: '',
        semester: '1',
        department: 'Computer Science'
    })
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (status === 'authenticated') {
            const user = session?.user
            if (user?.role !== 'FACULTY') {
                router.push('/login')
            } else {
                fetchSubjects()
            }
        }
    }, [status, session, router])

    const fetchSubjects = async () => {
        try {
            const res = await fetch('/api/faculty/dashboard')
            if (res.ok) {
                const data = await res.json()
                setSubjects(data.subjects || [])
            }
        } catch (err) {
            console.error('Failed to fetch subjects:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSaving(true)

        try {
            const res = await fetch('/api/subjects/my', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to add subject')
            }

            setShowAddModal(false)
            setFormData({ code: '', name: '', semester: '1', department: 'Computer Science' })
            fetchSubjects()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const handleEditSubject = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingSubject) return
        setError('')
        setSaving(true)

        try {
            const res = await fetch(`/api/subjects/my/${editingSubject.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to update subject')
            }

            setShowEditModal(false)
            setEditingSubject(null)
            setFormData({ code: '', name: '', semester: '1', department: 'Computer Science' })
            fetchSubjects()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const openEditModal = (subject: Subject) => {
        setEditingSubject(subject)
        setFormData({
            code: subject.code,
            name: subject.name,
            semester: subject.semester.toString(),
            department: subject.department
        })
        setError('')
        setShowEditModal(true)
    }

    const user = session?.user

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-theme-muted">Loading...</div>
            </div>
        )
    }

    if (!user) return null

    // Stats
    const totalQuizzes = subjects.reduce((acc, s) => acc + s.quizzes.length, 0)
    const publishedQuizzes = subjects.reduce((acc, s) =>
        acc + s.quizzes.filter(q => q.isPublished).length, 0
    )
    const totalAttempts = subjects.reduce((acc, s) =>
        acc + s.quizzes.reduce((a, q) => a + q._count.attempts, 0), 0
    )

    return (
        <DashboardLayout user={user} navigation={navigation}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-theme-primary">
                            Welcome, {user.name}
                        </h1>
                        <p className="text-theme-muted text-sm">
                            {subjects.length} assigned subject{subjects.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Link href="/faculty/quizzes/create" className="btn btn-primary">
                        + New Quiz
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="card">
                        <div className="stat">
                            <span className="stat-value">{subjects.length}</span>
                            <span className="stat-label">Subjects</span>
                        </div>
                    </div>
                    <div className="card">
                        <div className="stat">
                            <span className="stat-value">{totalQuizzes}</span>
                            <span className="stat-label">Total Quizzes</span>
                        </div>
                    </div>
                    <div className="card">
                        <div className="stat">
                            <span className="stat-value text-success">{publishedQuizzes}</span>
                            <span className="stat-label">Published</span>
                        </div>
                    </div>
                    <div className="card">
                        <div className="stat">
                            <span className="stat-value text-accent">{totalAttempts}</span>
                            <span className="stat-label">Attempts</span>
                        </div>
                    </div>
                </div>

                {/* Subjects */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-medium text-theme-muted uppercase tracking-wide">
                            Your Subjects
                        </h2>
                        <button
                            onClick={() => {
                                setFormData({ code: '', name: '', semester: '1', department: 'Computer Science' })
                                setError('')
                                setShowAddModal(true)
                            }}
                            className="btn btn-secondary text-sm"
                        >
                            + Add Subject
                        </button>
                    </div>

                    {subjects.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-theme-muted">No subjects assigned to you yet</p>
                            <p className="text-sm text-theme-muted mt-2">Click &quot;Add Subject&quot; to add your first subject</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {subjects.map((subject) => (
                                <div key={subject.id} className="card">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="badge badge-primary">{subject.code}</span>
                                                <span className="badge badge-neutral">Sem {subject.semester}</span>
                                            </div>
                                            <h3 className="font-medium text-theme-primary">{subject.name}</h3>
                                        </div>
                                        <button
                                            onClick={() => openEditModal(subject)}
                                            className="p-2 text-theme-muted hover:text-theme-primary hover:bg-theme-hover rounded-lg transition-colors"
                                            title="Edit subject"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-theme-subtle">
                                        <span className="text-sm text-theme-muted">
                                            {subject.quizzes.length} quiz{subject.quizzes.length !== 1 ? 'zes' : ''}
                                        </span>
                                        <Link
                                            href={`/faculty/quizzes/create?subject=${subject.id}`}
                                            className="btn btn-secondary text-sm"
                                        >
                                            + Add Quiz
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Quizzes */}
                {totalQuizzes > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-medium text-theme-muted uppercase tracking-wide">
                                Recent Quizzes
                            </h2>
                            <Link href="/faculty/quizzes" className="text-sm text-accent hover:underline">
                                View all →
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {subjects.flatMap(s => s.quizzes).slice(0, 5).map((quiz) => {
                                const subject = subjects.find(s => s.quizzes.some(q => q.id === quiz.id))
                                return (
                                    <Link
                                        key={quiz.id}
                                        href={`/faculty/quizzes/${quiz.id}`}
                                        className="card card-interactive flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="badge badge-neutral">{subject?.code}</span>
                                                <span className={`badge ${quiz.isPublished ? 'badge-success' : 'badge-warning'}`}>
                                                    {quiz.isPublished ? 'Published' : 'Draft'}
                                                </span>
                                            </div>
                                            <h3 className="font-medium text-theme-primary">{quiz.title}</h3>
                                            <p className="text-sm text-theme-muted">
                                                {quiz._count.questions} questions • {quiz._count.attempts} attempts
                                            </p>
                                        </div>
                                        <svg className="w-5 h-5 text-theme-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Add Subject Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card max-w-md w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-theme-primary">Add Subject</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 text-theme-muted hover:text-theme-primary rounded-lg"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleAddSubject} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-theme-secondary mb-1">
                                    Subject Code *
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="e.g., CS101"
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-secondary mb-1">
                                    Subject Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Data Structures"
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-1">
                                        Semester *
                                    </label>
                                    <select
                                        value={formData.semester}
                                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                        className="input w-full"
                                        required
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                            <option key={s} value={s}>Semester {s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-1">
                                        Department
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="input w-full"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn btn-primary flex-1"
                                >
                                    {saving ? 'Adding...' : 'Add Subject'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Subject Modal */}
            {showEditModal && editingSubject && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card max-w-md w-full">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-theme-primary">Edit Subject</h2>
                            <button
                                onClick={() => {
                                    setShowEditModal(false)
                                    setEditingSubject(null)
                                }}
                                className="p-2 text-theme-muted hover:text-theme-primary rounded-lg"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleEditSubject} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-theme-secondary mb-1">
                                    Subject Code *
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="e.g., CS101"
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-secondary mb-1">
                                    Subject Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Data Structures"
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-1">
                                        Semester *
                                    </label>
                                    <select
                                        value={formData.semester}
                                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                        className="input w-full"
                                        required
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                            <option key={s} value={s}>Semester {s}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-1">
                                        Department
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="input w-full"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false)
                                        setEditingSubject(null)
                                    }}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn btn-primary flex-1"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}
