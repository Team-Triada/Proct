'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import Link from 'next/link'

export default function AdminSubjectsSearch({
    defaultQ,
    defaultSemester,
    availableSemesters,
}: {
    defaultQ: string
    defaultSemester: string
    availableSemesters: number[]
}) {
    const router = useRouter()
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    function push(q: string, sem: string) {
        const p = new URLSearchParams()
        if (q.trim()) p.set('q', q.trim())
        if (sem) p.set('semester', sem)
        const qs = p.toString()
        router.push(`/admin/subjects${qs ? `?${qs}` : ''}`)
    }

    function handleSearch(value: string) {
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => push(value, defaultSemester), 300)
    }

    return (
        <div className="space-y-3">
            {/* Search input */}
            <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted pointer-events-none"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    defaultValue={defaultQ}
                    onChange={e => handleSearch(e.target.value)}
                    placeholder="Search by code, name, or department…"
                    className="input pl-9 w-full sm:max-w-sm"
                />
            </div>

            {/* Semester pills */}
            <div className="flex gap-2 flex-wrap">
                <Link
                    href={`/admin/subjects${defaultQ ? `?q=${defaultQ}` : ''}`}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        !defaultSemester
                            ? 'bg-accent text-white border-accent'
                            : 'border-theme text-theme-muted hover:border-accent hover:text-accent'
                    }`}
                >
                    All
                </Link>
                {availableSemesters.map(sem => {
                    const p = new URLSearchParams()
                    if (defaultQ) p.set('q', defaultQ)
                    p.set('semester', String(sem))
                    return (
                        <Link
                            key={sem}
                            href={`/admin/subjects?${p.toString()}`}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                defaultSemester === String(sem)
                                    ? 'bg-accent text-white border-accent'
                                    : 'border-theme text-theme-muted hover:border-accent hover:text-accent'
                            }`}
                        >
                            Sem {sem}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
