'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SubjectActions({ id }: { id: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const approve = async () => {
        if (!confirm('Approve this subject?')) return
        setLoading(true)
        try {
            const res = await fetch(`/api/subjects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isApproved: true })
            })
            if (res.ok) router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const reject = async () => {
        if (!confirm('Delete this subject?')) return
        setLoading(true)
        try {
            const res = await fetch(`/api/subjects/${id}`, {
                method: 'DELETE'
            })
            if (res.ok) router.refresh()
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex gap-2">
            <button
                onClick={approve}
                disabled={loading}
                className="btn btn-success btn-sm"
            >
                Approve
            </button>
            <button
                onClick={reject}
                disabled={loading}
                className="btn btn-danger btn-sm"
            >
                Reject
            </button>
        </div>
    )
}
