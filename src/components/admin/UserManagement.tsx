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

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return
        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setUsers(users.filter(u => u.id !== id))
                router.refresh()
            }
        } catch (error) {
            console.error(error)
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
                                    <button onClick={() => handleDelete(u.id)} className="btn btn-danger btn-sm">Delete</button>
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
        </div>
    )
}
