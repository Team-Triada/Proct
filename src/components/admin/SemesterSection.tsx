'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SubjectCard {
    id: string
    code: string
    name: string
    quizCount: number
    facultyCount: number
}

export default function SemesterSection({
    semester,
    subjects,
    defaultOpen = true,
}: {
    semester: number
    subjects: SubjectCard[]
    defaultOpen?: boolean
}) {
    const [open, setOpen] = useState(defaultOpen)

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="flex items-center justify-between w-full mb-3 group"
            >
                <h3 className="text-sm font-medium text-theme-primary flex items-center gap-2">
                    Semester {semester}
                    <span className="text-theme-muted font-normal">({subjects.length})</span>
                </h3>
                <svg
                    className="w-4 h-4 text-theme-muted transition-transform duration-200 group-hover:text-theme-primary"
                    style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {open && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {subjects.map((subject) => (
                        <Link
                            key={subject.id}
                            href={`/admin/subjects/${subject.id}`}
                            className="card card-interactive"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <span className="badge badge-primary mb-2">{subject.code}</span>
                                    <h4 className="font-medium text-theme-primary">{subject.name}</h4>
                                    <p className="text-xs text-theme-muted mt-1">
                                        {subject.quizCount} quizzes • {subject.facultyCount} faculty
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
