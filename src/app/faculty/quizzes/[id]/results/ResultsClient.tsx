'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const VIOLATION_LABELS: Record<string, string> = {
    TAB_SWITCH: 'Tab Switch',
    APP_SWITCH: 'App Switch',
    FULLSCREEN_EXIT: 'Exited Fullscreen',
    COPY_PASTE_SHORTCUT: 'Copy/Paste Shortcut',
    COPY_ATTEMPT: 'Copy Attempt',
    SCREENSHOT_ATTEMPT: 'Screenshot Key Pressed',
    SCREENSHOT_DETECTED: 'Screenshot Detected',
    QUICK_BLUR_DETECTED: 'Brief Focus Loss',
    SNIPPING_TOOL: 'Snipping Tool Used',
    MAC_SCREENSHOT: 'Screenshot Key (Mac)',
    PRINT_ATTEMPT: 'Print Attempted',
    DEVTOOLS_ATTEMPT: 'DevTools Key Pressed',
    DEVTOOLS_OPENED: 'DevTools Opened',
    BACK_NAVIGATION: 'Back Navigation',
    WINDOW_RESIZE: 'Window Resized',
    MULTI_TOUCH_GESTURE: 'Multi-touch Gesture',
    SCREEN_CAPTURE_DETECTED: 'Screen Capture Detected',
    PAGE_HIDE_IOS: 'App Backgrounded (iOS)',
    APP_SWITCH_IOS: 'App Switch (iOS)',
}

const VIOLATION_SEVERITY: Record<string, 'high' | 'medium' | 'low'> = {
    TAB_SWITCH: 'high',
    APP_SWITCH: 'medium',
    FULLSCREEN_EXIT: 'high',
    COPY_PASTE_SHORTCUT: 'medium',
    COPY_ATTEMPT: 'medium',
    SCREENSHOT_ATTEMPT: 'high',
    SCREENSHOT_DETECTED: 'high',
    QUICK_BLUR_DETECTED: 'low',
    SNIPPING_TOOL: 'high',
    MAC_SCREENSHOT: 'high',
    PRINT_ATTEMPT: 'high',
    DEVTOOLS_ATTEMPT: 'medium',
    DEVTOOLS_OPENED: 'high',
    BACK_NAVIGATION: 'medium',
    WINDOW_RESIZE: 'low',
    MULTI_TOUCH_GESTURE: 'low',
    SCREEN_CAPTURE_DETECTED: 'high',
    PAGE_HIDE_IOS: 'low',
    APP_SWITCH_IOS: 'medium',
}

export interface AttemptRow {
    id: string
    status: string
    score: number
    totalPoints: number
    startedAt: string
    violationCount: number
    student: { name: string; email: string; rollNumber: string | null }
    violations: { id: string; type: string; description: string | null; occurredAt: string }[]
    needsGrading: boolean
}

export interface QuizMeta {
    id: string
    title: string
    subjectCode: string
    subjectName: string
}

export default function ResultsClient({ quiz, attempts, quizId }: {
    quiz: QuizMeta
    attempts: AttemptRow[]
    quizId: string
}) {
    const router = useRouter()
    const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null)
    const [resettingId, setResettingId] = useState<string | null>(null)
    const [resetError, setResetError] = useState<string | null>(null)

    const handleReset = async (attempt: AttemptRow) => {
        const confirmed = window.confirm(
            `Clear ${attempt.student.name}'s attempt?\n\n` +
            `Their answers, score (${attempt.score}/${attempt.totalPoints}) and ` +
            `${attempt.violationCount} violation log(s) will be permanently deleted, ` +
            `and they will be able to retake this quiz. This cannot be undone.`
        )
        if (!confirmed) return

        setResetError(null)
        setResettingId(attempt.id)
        try {
            const res = await fetch(`/api/attempts/${attempt.id}/reset`, { method: 'POST' })
            const data = await res.json()
            if (!res.ok) {
                setResetError(data.error || 'Could not reset that attempt.')
                return
            }
            router.refresh()
        } catch {
            setResetError('Could not reach the server. Please try again.')
        } finally {
            setResettingId(null)
        }
    }

    const completedCount = attempts.filter(a => a.status === 'COMPLETED').length
    const avgScore = completedCount > 0
        ? attempts.filter(a => a.status === 'COMPLETED').reduce((s, a) => s + (a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0), 0) / completedCount
        : 0
    const totalViolations = attempts.reduce((s, a) => s + a.violationCount, 0)

    return (
        <div className="min-h-screen bg-theme p-6 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <Link href="/faculty/quizzes" className="text-sm text-theme-muted hover:text-theme-primary mb-2 inline-block">
                            ← Back to Quizzes
                        </Link>
                        <h1 className="text-2xl font-bold text-theme-primary">{quiz.title}</h1>
                        <p className="text-theme-muted text-sm">{quiz.subjectCode} · {quiz.subjectName}</p>
                    </div>
                    {/* Exports are generated server-side so they include every
                        column, not just what this page happened to load. */}
                    <div className="flex shrink-0 gap-2">
                        <a
                            href={`/api/quizzes/${quizId}/results/export?format=summary`}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Scores CSV
                        </a>
                        <a
                            href={`/api/quizzes/${quizId}/results/export?format=answers`}
                            className="btn btn-secondary flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Answers CSV
                        </a>
                    </div>
                </div>

                {resetError && (
                    <div role="alert" className="card p-4 border border-danger/30 bg-danger/5 text-sm text-danger">
                        {resetError}
                    </div>
                )}

                {/* Summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Attempts', value: attempts.length },
                        { label: 'Completed', value: completedCount },
                        { label: 'Avg Score', value: completedCount > 0 ? `${avgScore.toFixed(1)}%` : '—' },
                        { label: 'Total Violations', value: totalViolations, danger: totalViolations > 0 },
                    ].map(s => (
                        <div key={s.label} className="card py-3 px-4">
                            <div className={`text-xl font-bold ${s.danger ? 'text-danger' : 'text-theme-primary'}`}>{s.value}</div>
                            <div className="text-xs text-theme-muted mt-0.5">{s.label}</div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="card overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="text-xs text-theme-muted uppercase border-b border-theme-subtle">
                                    <th className="px-5 py-3">Student</th>
                                    <th className="px-5 py-3">Roll No.</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Score</th>
                                    <th className="px-5 py-3">Grading</th>
                                    <th className="px-5 py-3">Violations</th>
                                    <th className="px-5 py-3">Date</th>
                                    <th className="px-5 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-theme-subtle">
                                {attempts.map((attempt) => (
                                    <>
                                        <tr key={attempt.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-5 py-3 font-medium text-theme-primary">{attempt.student.name}</td>
                                            <td className="px-5 py-3 text-theme-muted font-mono text-xs">{attempt.student.rollNumber || '—'}</td>
                                            <td className="px-5 py-3">
                                                <span className={`badge ${attempt.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                                                    {attempt.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 font-mono text-theme-primary">
                                                {attempt.score}/{attempt.totalPoints}
                                                {attempt.totalPoints > 0 && (
                                                    <span className="text-theme-muted ml-1 text-xs">
                                                        ({((attempt.score / attempt.totalPoints) * 100).toFixed(0)}%)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                {attempt.needsGrading ? (
                                                    <span className="text-yellow-500 text-xs font-medium flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />
                                                        Pending
                                                    </span>
                                                ) : (
                                                    <span className="text-green-500 text-xs font-medium flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                                        Graded
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                {attempt.violationCount === 0 ? (
                                                    <span className="text-theme-muted text-xs">None</span>
                                                ) : (
                                                    <button
                                                        onClick={() => setExpandedAttempt(expandedAttempt === attempt.id ? null : attempt.id)}
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                                                            expandedAttempt === attempt.id
                                                                ? 'bg-danger/20 text-danger border-danger/30'
                                                                : 'bg-danger/10 text-danger border-danger/20 hover:bg-danger/20'
                                                        }`}
                                                    >
                                                        {attempt.violationCount} violation{attempt.violationCount !== 1 ? 's' : ''}
                                                        <svg className={`w-3 h-3 transition-transform ${expandedAttempt === attempt.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-theme-muted text-xs">
                                                {new Date(attempt.startedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-1">
                                                    <Link href={`/faculty/quizzes/${quizId}/grade/${attempt.id}`} className="btn btn-ghost btn-sm">
                                                        Grade
                                                    </Link>
                                                    <button
                                                        onClick={() => handleReset(attempt)}
                                                        disabled={resettingId === attempt.id}
                                                        title="Clear this attempt so the student can retake the quiz"
                                                        className="btn btn-ghost btn-sm text-danger disabled:opacity-50"
                                                    >
                                                        {resettingId === attempt.id ? 'Resetting…' : 'Reset'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Violations expansion row */}
                                        {expandedAttempt === attempt.id && attempt.violations.length > 0 && (
                                            <tr key={`${attempt.id}-violations`} className="bg-danger/5">
                                                <td colSpan={8} className="px-5 py-3">
                                                    <p className="text-xs font-semibold text-danger mb-2 uppercase tracking-wide">
                                                        Violation Log — {attempt.student.name}
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {attempt.violations.map((v) => {
                                                            const severity = VIOLATION_SEVERITY[v.type] ?? 'low'
                                                            const label = VIOLATION_LABELS[v.type] ?? v.type
                                                            const time = new Date(v.occurredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                                            return (
                                                                <div
                                                                    key={v.id}
                                                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${
                                                                        severity === 'high'
                                                                            ? 'bg-danger/10 border-danger/25 text-danger'
                                                                            : severity === 'medium'
                                                                            ? 'bg-warning/10 border-warning/25 text-warning'
                                                                            : 'bg-theme-subtle border-theme text-theme-muted'
                                                                    }`}
                                                                >
                                                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                                                        severity === 'high' ? 'bg-danger' : severity === 'medium' ? 'bg-warning' : 'bg-theme-muted'
                                                                    }`} />
                                                                    <span className="font-medium">{label}</span>
                                                                    <span className="opacity-60 font-mono">{time}</span>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                                {attempts.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-10 text-center text-theme-muted">
                                            No attempts yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
