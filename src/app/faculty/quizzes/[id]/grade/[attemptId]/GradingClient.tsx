'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface GradeItem {
    questionId: string
    points: number
    feedback: string
}

interface Question {
    id: string
    quizId: string // Added quizId
    text: string
    type: string
    points: number
    options: string // JSON string
}

interface Answer {
    selectedIndex: number | null
    selectedIndices: string | null // JSON string
    textAnswer: string | null
    pointsAwarded: number | null
    feedback: string | null
}

interface GradingData {
    questionNumber: number
    question: Question
    answer: Answer | undefined | null
}

export default function GradingClient({
    attemptId,
    studentName,
    quizTitle,
    data
}: {
    attemptId: string
    studentName: string
    quizTitle: string
    data: GradingData[]
}) {
    const router = useRouter()
    const [grades, setGrades] = useState<Record<string, GradeItem>>(() => {
        const initial: Record<string, GradeItem> = {}
        data.forEach(item => {
            if (item.question && item.answer) {
                initial[item.question.id] = {
                    questionId: item.question.id,
                    points: item.answer.pointsAwarded ?? 0,
                    feedback: item.answer.feedback ?? ''
                }
            }
        })
        return initial
    })
    const [saving, setSaving] = useState(false)

    const handleGradeChange = (questionId: string, field: 'points' | 'feedback', value: any) => {
        setGrades(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId] || { questionId, points: 0, feedback: '' },
                [field]: value
            }
        }))
    }

    const saveGrades = async () => {
        setSaving(true)
        try {
            const payload = {
                attemptId,
                grades: Object.values(grades)
            }

            const res = await fetch('/api/attempts/grade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) throw new Error('Failed to save')

            router.push(`/faculty/quizzes/${data[0]?.question.quizId}/results`)
            router.refresh()
        } catch (err) {
            console.error(err)
            alert('Error saving grades')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-theme p-8 pb-32">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between sticky top-0 bg-theme/95 backdrop-blur z-10 py-4 border-b border-theme-subtle gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-theme-primary">Grading: {studentName}</h1>
                        <p className="text-theme-muted">{quizTitle}</p>
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                        <Link href={`/faculty/quizzes/${data[0]?.question.quizId}/results`} className="btn btn-ghost flex-1 sm:flex-none text-center">
                            Cancel
                        </Link>
                        <button
                            onClick={saveGrades}
                            disabled={saving}
                            className="btn btn-primary flex-1 sm:flex-none"
                        >
                            {saving ? 'Saving...' : 'Save Grades'}
                        </button>
                    </div>
                </div>

                <div className="space-y-6">
                    {data.map((item) => {
                        const { question, answer, questionNumber } = item
                        if (!question) return null

                        const grade = grades[question.id] || { points: 0, feedback: '' }
                        const isAutoGraded = ['MULTIPLE_CHOICE', 'CHECKBOX', 'DROPDOWN'].includes(question.type)

                        return (
                            <div key={question.id} className="card p-6 space-y-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                    <div className="flex gap-3">
                                        <span className="badge badge-neutral h-fit mt-1">Q{questionNumber}</span>
                                        <div>
                                            <p className="text-theme-primary font-medium text-lg">{question.text}</p>
                                            <p className="text-xs text-theme-muted uppercase mt-1">{question.type.replace('_', ' ')} • {question.points} Points</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                        <label className="text-sm text-theme-muted">Points:</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max={question.points}
                                            value={grade.points}
                                            onChange={(e) => handleGradeChange(question.id, 'points', Number(e.target.value))}
                                            className="input input-sm w-20 text-right font-mono"
                                        />
                                        <span className="text-theme-muted">/ {question.points}</span>
                                    </div>
                                </div>

                                <div className="p-4 rounded-lg bg-theme-surface border border-theme-subtle">
                                    <p className="text-xs text-theme-muted mb-2 uppercase font-bold">Student Answer</p>
                                    {isAutoGraded ? (
                                        <div>
                                            {question.type === 'CHECKBOX' ? (
                                                <div className="flex gap-2">
                                                    {Array.isArray(JSON.parse(answer?.selectedIndices ?? '[]')) &&
                                                        JSON.parse(answer?.selectedIndices ?? '[]').map((idx: number) => (
                                                            <span key={idx} className="badge badge-neutral">
                                                                {JSON.parse(question.options)[idx]}
                                                            </span>
                                                        ))}
                                                </div>
                                            ) : (
                                                <p className="text-theme-primary">
                                                    {answer?.selectedIndex !== null && answer?.selectedIndex !== undefined ? JSON.parse(question.options)[answer.selectedIndex] : '<No Answer>'}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-theme-primary whitespace-pre-wrap font-serif text-lg">
                                            {answer?.textAnswer || '<No Answer>'}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm text-theme-muted block mb-2">Feedback</label>
                                    <textarea
                                        value={grade.feedback}
                                        onChange={(e) => handleGradeChange(question.id, 'feedback', e.target.value)}
                                        placeholder="Add feedback for the student..."
                                        className="textarea w-full"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div >
        </div >
    )
}
