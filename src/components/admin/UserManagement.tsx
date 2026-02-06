'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type User = {
    id: string
    name: string
    email: string
    role: string
    department?: string | null
    semester?: number | null
    batch?: string | null
    section?: string | null
    rollNumber?: string | null
}

export default function UserManagement({ initialUsers }: { initialUsers: User[] }) {
    const router = useRouter()
    const [users, setUsers] = useState(initialUsers)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [deletingUser, setDeletingUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'STUDENT',
        department: '',
        semester: '',
        batch: '',
        section: '',
        rollNumber: ''
    })

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'STUDENT',
            department: '',
            semester: '',
            batch: '',
            section: '',
            rollNumber: ''
        })
        setEditingUser(null)
    }

    const openCreate = () => {
        resetForm()
        setIsModalOpen(true)
    }

    const openEdit = (user: User) => {
        setEditingUser(user)
        setFormData({
            name: user.name,
            email: user.email,
            password: '', // Leave empty to keep unchanged
            role: user.role,
            department: user.department || '',
            semester: user.semester?.toString() || '',
            batch: user.batch || '',
            section: user.section || '',
            rollNumber: user.rollNumber || ''
        })
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const url = editingUser
                ? `/api/admin/users/${editingUser.id}`
                : '/api/admin/users'

            const method = editingUser ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) throw new Error('Failed to save user')

            const savedUser = await res.json()

            if (editingUser) {
                setUsers(users.map(u => u.id === savedUser.id ? savedUser : u))
            } else {
                setUsers([...users, savedUser])
            }

            setIsModalOpen(false)
            resetForm()
            router.refresh()
        } catch (error) {
            alert('Error saving user')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteClick = (user: User) => {
        setDeletingUser(user)
    }

    const confirmDelete = async () => {
        if (!deletingUser) return
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/users/${deletingUser.id}`, { method: 'DELETE' })
            if (res.ok) {
                setUsers(users.filter(u => u.id !== deletingUser.id))
                router.refresh()
                setDeletingUser(null)
            } else {
                const data = await res.json()
                alert(data.error || 'Failed to delete user')
            }
        } catch (error) {
            console.error(error)
            alert('Error deleting user')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-semibold text-theme-primary">User Management</h1>
                    <p className="text-theme-muted text-sm">{users.length} users</p>
                </div>
                <button onClick={openCreate} className="btn btn-primary">
                    + Add User
                </button>
            </div>

            <div className="table-container">
                <table className="w-full">
                    <thead>
                        <tr className="text-left text-sm text-theme-muted border-b border-theme-subtle">
                            <th className="pb-3 pl-2">Name</th>
                            <th className="pb-3">Role</th>
                            <th className="pb-3">Info</th>
                            <th className="pb-3 text-right pr-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-subtle">
                        {users.map((u) => (
                            <tr key={u.id} className="group">
                                <td className="py-3 pl-2">
                                    <div className="font-medium text-theme-primary">{u.name}</div>
                                    <div className="text-xs text-theme-muted">{u.email}</div>
                                </td>
                                <td className="py-3">
                                    <span className={`badge ${u.role === 'ADMIN' ? 'badge-danger' :
                                        u.role === 'FACULTY' ? 'badge-primary' : 'badge-success'
                                        }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="py-3 text-sm text-theme-muted">
                                    {u.role === 'STUDENT' && (
                                        <div>
                                            <div className="font-mono text-xs text-theme-primary bg-theme-subtle inline-block px-1 rounded mb-1">
                                                Year: {u.batch || 'N/A'}
                                            </div>
                                            <div>
                                                {u.semester && <span>Sem {u.semester}</span>}
                                                {u.section && <span> • Batch {u.section}</span>}
                                            </div>
                                        </div>
                                    )}
                                    {u.department && <div>{u.department}</div>}
                                </td>
                                <td className="py-3 text-right pr-2">
                                    <button onClick={() => openEdit(u)} className="btn btn-ghost btn-sm mr-2">Edit</button>
                                    <button onClick={() => handleDeleteClick(u)} className="btn btn-danger btn-sm">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="card w-full max-w-lg bg-theme-surface max-h-[90vh] overflow-y-auto">
                        <h2 className="text-lg font-bold mb-4">{editingUser ? 'Edit User' : 'Add User'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Name</label>
                                    <input required className="input w-full" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="label">Role</label>
                                    <select className="input w-full" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="STUDENT">Student</option>
                                        <option value="FACULTY">Faculty</option>
                                        <option value="ADMIN">Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="label">Email</label>
                                <input type="email" required className="input w-full" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>

                            <div>
                                <label className="label">Password {editingUser && '(Leave blank to stay)'}</label>
                                <input type="password" className="input w-full" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder={editingUser ? 'Unchanged' : 'Required'} required={!editingUser} />
                            </div>

                            {/* Role Specifics */}
                            {(formData.role === 'STUDENT' || formData.role === 'FACULTY') && (
                                <div>
                                    <label className="label">Department</label>
                                    <input className="input w-full" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
                                </div>
                            )}

                            {formData.role === 'STUDENT' && (
                                <div className="space-y-4 border-t border-theme-subtle pt-4 mt-2">
                                    <p className="text-xs font-bold text-theme-muted uppercase">Student Details</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Semester (1-8)</label>
                                            <input type="number" min="1" max="8" className="input w-full" value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Roll Number</label>
                                            <input className="input w-full" value={formData.rollNumber} onChange={e => setFormData({ ...formData, rollNumber: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Year (e.g. 2024-27)</label>
                                            <input placeholder="e.g. 2024-27" className="input w-full" value={formData.batch} onChange={e => setFormData({ ...formData, batch: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="label">Batch (1-12)</label>
                                            <select className="input w-full" value={formData.section} onChange={e => setFormData({ ...formData, section: e.target.value })}>
                                                <option value="">Select Batch</option>
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                                    <option key={n} value={String(n)}>Batch {n}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-ghost flex-1">Cancel</button>
                                <button type="submit" disabled={loading} className="btn btn-primary flex-1">{loading ? 'Saving...' : 'Save User'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Delete Warning Modal */}
            {deletingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="card w-full max-w-md bg-theme-surface border-danger/30 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4 text-danger">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <h2 className="text-xl font-bold">Warning: Irreversible Action</h2>
                        </div>

                        <div className="space-y-4 mb-6">
                            <p className="text-theme-secondary">
                                You are about to delete user <span className="font-bold text-theme-primary">{deletingUser.name}</span>.
                            </p>

                            <div className="bg-danger/10 border border-danger/20 p-3 rounded-lg text-sm text-danger-content">
                                <p className="font-semibold mb-1">This will permanently delete:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    {deletingUser.role === 'FACULTY' ? (
                                        <>
                                            <li>All quizzes created by this faculty</li>
                                            <li>questions, attempts, and grades for those quizzes</li>
                                            <li>Subject assignments</li>
                                        </>
                                    ) : (
                                        <>
                                            <li>All quiz attempts and grades</li>
                                            <li>Verification logs and answers</li>
                                        </>
                                    )}
                                    <li>User account and profile data</li>
                                </ul>
                            </div>

                            <p className="text-sm font-medium text-theme-secondary">
                                This action cannot be undone. Are you sure you want to proceed?
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setDeletingUser(null)}
                                className="btn btn-ghost"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="btn btn-danger"
                                disabled={loading}
                            >
                                {loading ? 'Deleting...' : 'Yes, Delete User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
