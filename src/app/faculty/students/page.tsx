'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'

const navigation = [
    { name: 'Overview', href: '/faculty' },
    { name: 'My Quizzes', href: '/faculty/quizzes' },
    { name: 'Students', href: '/faculty/students' },
    { name: 'Create Quiz', href: '/faculty/quizzes/create' },
]

interface Student {
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

interface StudentFormData {
    name: string
    rollNumber: string
    campusId: string
    semester: string
    batch: string
    section: string
    department: string
    image: string
}

export default function FacultyStudentsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [students, setStudents] = useState<Student[]>([])
    const [loading, setLoading] = useState(true)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingStudent, setEditingStudent] = useState<Student | null>(null)
    const [formData, setFormData] = useState<StudentFormData>({
        name: '',
        rollNumber: '',
        campusId: '',
        semester: '',
        batch: '',
        section: '',
        department: '',
        image: ''
    })
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (status === 'authenticated') {
            const user = session?.user as any
            if (user?.role !== 'FACULTY' && user?.role !== 'ADMIN') {
                router.push('/login')
            } else {
                fetchStudents()
            }
        }
    }, [status, session, router])

    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/faculty/students')
            if (res.ok) {
                const data = await res.json()
                setStudents(data || [])
            }
        } catch (err) {
            console.error('Failed to fetch students:', err)
        } finally {
            setLoading(false)
        }
    }

    const openEditModal = (student: Student) => {
        setEditingStudent(student)
        setFormData({
            name: student.name || '',
            rollNumber: student.rollNumber || '',
            campusId: student.campusId || '',
            semester: student.semester?.toString() || '',
            batch: student.batch || '',
            section: student.section || '',
            department: student.department || '',
            image: student.image || ''
        })
        setError('')
        setShowEditModal(true)
    }

    const handleEditStudent = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingStudent) return
        setError('')
        setSaving(true)

        try {
            const res = await fetch(`/api/faculty/students/${editingStudent.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to update student')
            }

            setShowEditModal(false)
            setEditingStudent(null)
            fetchStudents()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    const user = session?.user as any

    // Filter students based on search
    const filteredStudents = students.filter(student => {
        const query = searchQuery.toLowerCase()
        return (
            student.name.toLowerCase().includes(query) ||
            student.email.toLowerCase().includes(query) ||
            (student.rollNumber?.toLowerCase().includes(query) ?? false) ||
            (student.batch?.toLowerCase().includes(query) ?? false) ||
            (student.section?.toLowerCase().includes(query) ?? false)
        )
    })

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-theme-muted">Loading...</div>
            </div>
        )
    }

    if (!user) return null

    return (
        <DashboardLayout user={user} navigation={navigation}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-theme-primary">
                            Students
                        </h1>
                        <p className="text-theme-muted text-sm">
                            {students.length} student{students.length !== 1 ? 's' : ''} in your subjects
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, email, roll number, year, or batch..."
                        className="input w-full pl-10"
                    />
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                {/* Students Table */}
                {filteredStudents.length === 0 ? (
                    <div className="card text-center py-12">
                        <p className="text-theme-muted">
                            {searchQuery ? 'No students match your search' : 'No students found in your subjects'}
                        </p>
                    </div>
                ) : (
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-theme-subtle">
                                        <th className="text-left p-4 text-sm font-medium text-theme-muted">Name</th>
                                        <th className="text-left p-4 text-sm font-medium text-theme-muted">Roll Number</th>
                                        <th className="text-left p-4 text-sm font-medium text-theme-muted">Year</th>
                                        <th className="text-left p-4 text-sm font-medium text-theme-muted">Semester</th>
                                        <th className="text-left p-4 text-sm font-medium text-theme-muted">Batch</th>
                                        <th className="text-right p-4 text-sm font-medium text-theme-muted">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id} className="border-b border-theme-subtle last:border-0 hover:bg-theme-hover">
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-medium text-theme-primary">{student.name}</p>
                                                    <p className="text-sm text-theme-muted">{student.email}</p>
                                                </div>
                                            </td>
                                            <td className="p-4 text-theme-secondary">{student.rollNumber || '-'}</td>
                                            <td className="p-4 text-theme-secondary">{student.batch || '-'}</td>
                                            <td className="p-4">
                                                {student.semester ? (
                                                    <span className="badge badge-primary">Sem {student.semester}</span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4">
                                                {student.section ? (
                                                    <span className="badge badge-neutral">Batch {student.section}</span>
                                                ) : '-'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => openEditModal(student)}
                                                    className="btn btn-secondary text-sm"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Student Modal */}
            {showEditModal && editingStudent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-theme-primary">Edit Student</h2>
                            <button
                                onClick={() => {
                                    setShowEditModal(false)
                                    setEditingStudent(null)
                                }}
                                className="p-2 text-theme-muted hover:text-theme-primary rounded-lg"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4 p-3 bg-theme-tertiary rounded-lg">
                            <p className="text-sm text-theme-muted">
                                Editing: <span className="text-theme-primary font-medium">{editingStudent.email}</span>
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleEditStudent} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-theme-secondary mb-1">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-1">
                                        Roll Number
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.rollNumber}
                                        onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                                        placeholder="e.g., 23BBCCED009"
                                        className="input w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-1">
                                        Campus ID
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.campusId}
                                        onChange={(e) => setFormData({ ...formData, campusId: e.target.value })}
                                        placeholder="e.g., 29849"
                                        className="input w-full"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-1">
                                        Year
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.batch}
                                        onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                                        placeholder="e.g., 2023-2026"
                                        className="input w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-1">
                                        Semester
                                    </label>
                                    <select
                                        value={formData.semester}
                                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                        className="input w-full"
                                    >
                                        <option value="">Select</option>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                            <option key={s} value={s}>Semester {s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-1">
                                        Batch
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.section}
                                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                        placeholder="e.g., 1, 2, 3..."
                                        className="input w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-theme-secondary mb-1">
                                        Department
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        placeholder="e.g., Computer Science"
                                        className="input w-full"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-theme-secondary mb-1">
                                    Profile Image URL
                                </label>
                                <input
                                    type="url"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                    placeholder="https://example.com/photo.jpg"
                                    className="input w-full"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false)
                                        setEditingStudent(null)
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
