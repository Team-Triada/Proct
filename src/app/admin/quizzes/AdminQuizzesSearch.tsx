'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'

export default function AdminQuizzesSearch({
    defaultQ,
    defaultStatus,
}: {
    defaultQ: string
    defaultStatus: string
}) {
    const router = useRouter()
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    function handleChange(value: string) {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => {
            const params = new URLSearchParams()
            if (value.trim()) params.set('q', value.trim())
            if (defaultStatus) params.set('status', defaultStatus)
            const qs = params.toString()
            router.push(`/admin/quizzes${qs ? `?${qs}` : ''}`)
        }, 300)
    }

    return (
        <div className="relative">
            <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
                type="text"
                defaultValue={defaultQ}
                onChange={e => handleChange(e.target.value)}
                placeholder="Search by quiz title or faculty name…"
                className="input pl-9 w-full sm:max-w-sm"
            />
        </div>
    )
}
