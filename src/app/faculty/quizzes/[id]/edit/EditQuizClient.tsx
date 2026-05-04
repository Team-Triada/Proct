'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import ThemeToggle from '@/components/ThemeToggle'

type QuestionType = 'MULTIPLE_CHOICE' | 'CHECKBOX' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'DROPDOWN'

interface Question {
    id?: string
    text: string
    type: QuestionType
    options: string[]
    correctIndex: number      // For single answer
    correctIndices: number[]  // For multiple answers (checkbox)
    points: number
    isNew?: boolean
    isEditing?: boolean
}

interface Subject {
    id: string
    code: string
    name: string
}

interface Quiz {
    id: string
    title: string
    subjectId: string
    subject: Subject
    description: string | null
    timePerQuestion: number
    enforcementMode: string
    isPublished: boolean
    questions: Question[]
    _count?: { attempts: number }
    targetSection: string | null
    assignedBatches: string[] | null
    targetSemester: number | null
}

const questionTypes = [
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice', icon: '◉' },
    { value: 'CHECKBOX', label: 'Checkboxes', icon: '☑' },
    { value: 'SHORT_ANSWER', label: 'Short Answer', icon: '—' },
    { value: 'LONG_ANSWER', label: 'Long Answer', icon: '¶' },
    { value: 'DROPDOWN', label: 'Dropdown', icon: '▾' },
]

export default function EditQuizClient({ quizId }: { quizId: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [quiz, setQuiz] = useState<Quiz | null>(null)
    const [questions, setQuestions] = useState<Question[]>([])
    const [editingQuestion, setEditingQuestion] = useState<number | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [hasChanges, setHasChanges] = useState(false)
    const [maxSemester, setMaxSemester] = useState(8)
    const [maxBatchNumber, setMaxBatchNumber] = useState(10)
    const [availableBatches, setAvailableBatches] = useState<string[]>([])
    const [enableYearTargeting, setEnableYearTargeting] = useState(true)
    const [enableSemesterTargeting, setEnableSemesterTargeting] = useState(true)
    const [enableBatchTargeting, setEnableBatchTargeting] = useState(true)

    // Fetch quiz data
    const fetchQuiz = useCallback(async () => {
        try {
            const [res, settingsRes] = await Promise.all([
                fetch(`/api/quizzes/${quizId}`),
                fetch('/api/settings/public')
            ])
            if (!res.ok) throw new Error('Failed to fetch quiz')
            const data = await res.json()
            if (settingsRes.ok) {
                const settings = await settingsRes.json()
                setMaxSemester(settings.maxSemester || 8)
                setMaxBatchNumber(settings.maxBatchNumber || 10)
                setAvailableBatches(settings.availableBatches || [])
                if (settings.enableYearTargeting !== undefined) setEnableYearTargeting(settings.enableYearTargeting)
                if (settings.enableSemesterTargeting !== undefined) setEnableSemesterTargeting(settings.enableSemesterTargeting)
                if (settings.enableBatchTargeting !== undefined) setEnableBatchTargeting(settings.enableBatchTargeting)
            }
            setQuiz({ ...data, targetSemester: data.targetSemester ?? null })
            // Parse questions with type handling
            setQuestions(data.questions.map((q: Question) => ({
                ...q,
                type: q.type || 'MULTIPLE_CHOICE',
                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
                correctIndices: q.correctIndices || [q.correctIndex],
                isEditing: false
            })))
        } catch {
            router.push('/faculty/quizzes')
        } finally {
            setLoading(false)
        }
    }, [quizId, router])

    useEffect(() => {
        fetchQuiz()
    }, [fetchQuiz])

    // Auto-save with debounce
    useEffect(() => {
        if (!hasChanges || !quiz) return

        const timer = setTimeout(() => {
            handleSave()
        }, 2000)

        return () => clearTimeout(timer)
    }, [quiz, questions, hasChanges]) // eslint-disable-line react-hooks/exhaustive-deps

    const handleSave = async () => {
        if (!quiz) return
        setSaving(true)

        try {
            const res = await fetch(`/api/quizzes/${quizId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: quiz.title,
                    description: quiz.description,
                    timePerQuestion: quiz.timePerQuestion,
                    enforcementMode: quiz.enforcementMode,
                    isPublished: quiz.isPublished,
                    targetSection: quiz.targetSection,
                    assignedBatches: quiz.assignedBatches || [],
                    targetSemester: quiz.targetSemester,
                    questions: questions.map((q: Question) => ({
                        id: q.id,
                        text: q.text,
                        type: q.type,
                        options: q.options,
                        correctIndex: q.correctIndex,
                        correctIndices: q.correctIndices,
                        points: q.points || 1
                    }))
                })
            })

            if (res.ok) {
                setLastSaved(new Date())
                setHasChanges(false)
                await fetchQuiz()
            }
        } catch (error) {
            console.error('Save failed:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        try {
            const res = await fetch(`/api/quizzes/${quizId}`, { method: 'DELETE' })
            if (res.ok) {
                router.push('/faculty/quizzes')
                router.refresh()
            }
        } catch (error) {
            console.error('Delete failed:', error)
        } finally {
            setDeleting(false)
        }
    }

    const updateQuiz = (updates: Partial<Quiz>) => {
        if (!quiz) return
        setQuiz({ ...quiz, ...updates })
        setHasChanges(true)
    }

    const addQuestion = (type: QuestionType = 'MULTIPLE_CHOICE') => {
        const newQ: Question = {
            text: '',
            type,
            options: type === 'SHORT_ANSWER' || type === 'LONG_ANSWER' ? [] : ['', '', '', ''],
            correctIndex: 0,
            correctIndices: [],
            points: 1,
            isNew: true,
            isEditing: true
        }
        setQuestions([...questions, newQ])
        setEditingQuestion(questions.length)
        setHasChanges(true)
    }

    const updateQuestion = (index: number, updates: Partial<Question>) => {
        const updated = [...questions]
        updated[index] = { ...updated[index], ...updates }
        setQuestions(updated)
        setHasChanges(true)
    }

    const deleteQuestion = (index: number) => {
        setQuestions(questions.filter((_: Question, i: number) => i !== index))
        setEditingQuestion(null)
        setHasChanges(true)
    }

    const duplicateQuestion = (index: number) => {
        const q = questions[index]
        const duplicate: Question = {
            ...q,
            id: undefined,
            isNew: true,
            isEditing: false
        }
        const updated = [...questions]
        updated.splice(index + 1, 0, duplicate)
        setQuestions(updated)
        setHasChanges(true)
    }

    const toggleCorrectIndex = (questionIndex: number, optionIndex: number) => {
        const q = questions[questionIndex]
        if (q.type === 'CHECKBOX') {
            // Toggle in array
            const indices = q.correctIndices || []
            const newIndices = indices.includes(optionIndex)
                ? indices.filter((i: number) => i !== optionIndex)
                : [...indices, optionIndex]
            updateQuestion(questionIndex, { correctIndices: newIndices })
        } else {
            // Single selection
            updateQuestion(questionIndex, { correctIndex: optionIndex })
        }
    }

    const addOption = (questionIndex: number) => {
        const q = questions[questionIndex]
        updateQuestion(questionIndex, { options: [...q.options, ''] })
    }

    const removeOption = (questionIndex: number, optionIndex: number) => {
        const q = questions[questionIndex]
        if (q.options.length <= 2) return // Minimum 2 options
        const newOptions = q.options.filter((_: string, i: number) => i !== optionIndex)
        updateQuestion(questionIndex, {
            options: newOptions,
            correctIndex: q.correctIndex >= newOptions.length ? 0 : q.correctIndex,
            correctIndices: q.correctIndices.filter((i: number) => i !== optionIndex).map((i: number) => i > optionIndex ? i - 1 : i)
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-theme">
                <div className="spinner" style={{ width: '32px', height: '32px' }} />
            </div>
        )
    }

    if (!quiz) return null

    return (
        <div className="min-h-screen bg-theme">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-theme-subtle bg-theme-primary">
                <div className="max-w-4xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <button onClick={() => router.back()} className="btn btn-ghost text-sm">
                            ← Back
                        </button>
                        <div className="flex items-center gap-2">
                            {lastSaved && (
                                <span className="text-xs text-theme-muted">
                                    Saved {lastSaved.toLocaleTimeString()}
                                </span>
                            )}
                            {hasChanges && (
                                <span className="text-xs text-warning">Unsaved changes</span>
                            )}
                            <ThemeToggle />
                            <button
                                onClick={() => handleSave()}
                                disabled={saving || !hasChanges}
                                className="btn btn-primary text-sm"
                            >
                                {saving ? <div className="spinner" /> : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Quiz Details Card */}
                <div className="card space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-medium text-theme-muted uppercase tracking-wide">
                            Quiz Details
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="badge badge-primary">{quiz.subject?.code}</span>
                            {quiz._count && quiz._count.attempts > 0 && (
                                <span className="badge badge-warning">
                                    {quiz._count.attempts} attempts
                                </span>
                            )}
                        </div>
                    </div>

                    <input
                        type="text"
                        value={quiz.title}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuiz({ title: e.target.value })}
                        className="w-full text-xl font-semibold bg-transparent border-none outline-none text-theme-primary placeholder:text-theme-muted"
                        placeholder="Quiz Title"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Subject</label>
                            <div className="input flex items-center" style={{ cursor: 'not-allowed', opacity: 0.7 }}>
                                {quiz.subject?.name}
                            </div>
                        </div>
                        <div>
                            <label className="label">Time per Question (sec)</label>
                            <input
                                type="number"
                                value={quiz.timePerQuestion}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuiz({ timePerQuestion: Number(e.target.value) })}
                                className="input"
                                min="10"
                            />
                        </div>
                    </div>

                    {(enableYearTargeting || enableSemesterTargeting || enableBatchTargeting) && (
                        <div className={`grid gap-4 ${[enableYearTargeting, enableSemesterTargeting, enableBatchTargeting].filter(Boolean).length === 3 ? 'grid-cols-3' : [enableYearTargeting, enableSemesterTargeting, enableBatchTargeting].filter(Boolean).length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            {enableYearTargeting && (
                                <div>
                                    <label className="label">Year</label>
                                    <select
                                        value={(quiz.assignedBatches && quiz.assignedBatches[0]) || ''}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateQuiz({ assignedBatches: e.target.value ? [e.target.value] : [] })}
                                        className="input"
                                    >
                                        <option value="">All Years</option>
                                        {availableBatches.length > 0
                                            ? availableBatches.map(b => <option key={b} value={b}>{b}</option>)
                                            : ['2023-26', '2024-27', '2025-28', '2026-29'].map(b => <option key={b} value={b}>{b}</option>)
                                        }
                                    </select>
                                </div>
                            )}
                            {enableSemesterTargeting && (
                                <div>
                                    <label className="label">Semester</label>
                                    <select
                                        value={quiz.targetSemester !== null && quiz.targetSemester !== undefined ? String(quiz.targetSemester) : ''}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateQuiz({ targetSemester: e.target.value ? parseInt(e.target.value) : null })}
                                        className="input"
                                    >
                                        <option value="">All Semesters</option>
                                        {Array.from({ length: maxSemester }, (_, i) => i + 1).map(n => (
                                            <option key={n} value={String(n)}>Sem {n}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {enableBatchTargeting && (
                                <div>
                                    <label className="label">Batch</label>
                                    <select
                                        value={quiz.targetSection || ''}
                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateQuiz({ targetSection: e.target.value || null })}
                                        className="input"
                                    >
                                        <option value="">All Batches</option>
                                        {Array.from({ length: maxBatchNumber }, (_, i) => i + 1).map(n => (
                                            <option key={n} value={String(n)}>Batch {n}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}
                    {(enableYearTargeting || enableSemesterTargeting || enableBatchTargeting) && (
                        <p className="text-xs text-theme-muted">
                            Leave as &quot;All&quot; to allow everyone. Be careful with unrestricted quizzes.
                        </p>
                    )}

                    <div>
                        <label className="label">Description</label>
                        <textarea
                            value={quiz.description || ''}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateQuiz({ description: e.target.value })}
                            className="input min-h-[60px]"
                            placeholder="Optional description..."
                        />
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-3">
                            <label className="label mb-0">Mode:</label>
                            <select
                                value={quiz.enforcementMode}
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateQuiz({ enforcementMode: e.target.value })}
                                className="input w-auto"
                            >
                                <option value="NORMAL">Normal</option>
                                <option value="STRICT">Strict</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="published"
                                checked={quiz.isPublished}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuiz({ isPublished: e.target.checked })}
                                className="w-4 h-4 accent-accent"
                            />
                            <label htmlFor="published" className="text-sm text-theme-primary">
                                Published
                            </label>
                        </div>
                    </div>
                </div>

                {/* Questions Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-medium text-theme-muted uppercase tracking-wide">
                            Questions ({questions.length})
                        </h2>
                        <div className="flex gap-2">
                            <select
                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => addQuestion(e.target.value as QuestionType)}
                                value=""
                                className="input w-auto text-sm"
                            >
                                <option value="" disabled>+ Add Question</option>
                                {questionTypes.map(t => (
                                    <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <Reorder.Group
                        axis="y"
                        values={questions}
                        onReorder={(newOrder: Question[]) => {
                            setQuestions(newOrder)
                            setHasChanges(true)
                        }}
                        className="space-y-3"
                    >
                        {questions.map((q: Question, index: number) => (
                            <Reorder.Item key={q.id || `new-${index}`} value={q}>
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="card"
                                >
                                    {editingQuestion === index ? (
                                        /* Editing Mode */
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="badge badge-neutral">Q{index + 1}</span>
                                                    <select
                                                        value={q.type}
                                                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateQuestion(index, { type: e.target.value as QuestionType })}
                                                        className="text-xs bg-theme-tertiary border-none rounded px-2 py-1 text-theme-muted"
                                                    >
                                                        {questionTypes.map(t => (
                                                            <option key={t.value} value={t.value}>{t.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <button
                                                    onClick={() => setEditingQuestion(null)}
                                                    className="text-theme-muted hover:text-theme-primary text-xl"
                                                >
                                                    ✕
                                                </button>
                                            </div>

                                            <textarea
                                                value={q.text}
                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateQuestion(index, { text: e.target.value })}
                                                className="input min-h-[80px]"
                                                placeholder="Question text..."
                                                autoFocus
                                            />

                                            {/* Options for choice-based questions */}
                                            {(q.type === 'MULTIPLE_CHOICE' || q.type === 'CHECKBOX' || q.type === 'DROPDOWN') && (
                                                <div className="space-y-2">
                                                    <label className="label">
                                                        {q.type === 'CHECKBOX'
                                                            ? 'Options (select all correct answers)'
                                                            : 'Options (click to mark correct)'
                                                        }
                                                    </label>
                                                    {q.options.map((opt: string, optIdx: number) => (
                                                        <div key={optIdx} className="flex gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleCorrectIndex(index, optIdx)}
                                                                className={`option-letter ${q.type === 'CHECKBOX'
                                                                    ? (q.correctIndices?.includes(optIdx) ? 'selected' : '')
                                                                    : (q.correctIndex === optIdx ? 'selected' : '')
                                                                    }`}
                                                            >
                                                                {q.type === 'CHECKBOX'
                                                                    ? (q.correctIndices?.includes(optIdx) ? '☑' : '☐')
                                                                    : String.fromCharCode(65 + optIdx)
                                                                }
                                                            </button>
                                                            <input
                                                                type="text"
                                                                value={opt}
                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                                    const newOpts = [...q.options]
                                                                    newOpts[optIdx] = e.target.value
                                                                    updateQuestion(index, { options: newOpts })
                                                                }}
                                                                className="input flex-1"
                                                                placeholder={`Option ${optIdx + 1}`}
                                                            />
                                                            {q.options.length > 2 && (
                                                                <button
                                                                    onClick={() => removeOption(index, optIdx)}
                                                                    className="btn btn-ghost text-danger text-sm px-2"
                                                                >
                                                                    ×
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => addOption(index)}
                                                        className="btn btn-ghost text-sm w-full"
                                                    >
                                                        + Add Option
                                                    </button>
                                                </div>
                                            )}

                                            {/* Short/Long answer info */}
                                            {(q.type === 'SHORT_ANSWER' || q.type === 'LONG_ANSWER') && (
                                                <div className="p-4 rounded-lg bg-theme-tertiary text-center">
                                                    <p className="text-sm text-theme-muted">
                                                        {q.type === 'SHORT_ANSWER'
                                                            ? 'Students will enter a short text answer'
                                                            : 'Students will enter a detailed text answer'
                                                        }
                                                    </p>
                                                    <p className="text-xs text-theme-muted mt-1">
                                                        (Manual grading required)
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between pt-2">
                                                <div className="flex items-center gap-2">
                                                    <label className="label mb-0">Points:</label>
                                                    <input
                                                        type="number"
                                                        value={q.points}
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuestion(index, { points: Number(e.target.value) })}
                                                        className="input w-20"
                                                        min="1"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => deleteQuestion(index)}
                                                    className="btn btn-ghost text-danger text-sm"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        /* View Mode */
                                        <div
                                            className="cursor-pointer group"
                                            onClick={() => setEditingQuestion(index)}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="badge badge-neutral">Q{index + 1}</span>
                                                        <span className="text-xs text-theme-muted">
                                                            {questionTypes.find(t => t.value === q.type)?.label || 'Multiple Choice'}
                                                        </span>
                                                        <span className="text-xs text-theme-muted">{q.points} pt{q.points > 1 ? 's' : ''}</span>
                                                    </div>
                                                    <p className="font-medium text-theme-primary mb-2">
                                                        {q.text || <span className="text-theme-muted italic">No question text</span>}
                                                    </p>
                                                    {(q.type === 'MULTIPLE_CHOICE' || q.type === 'DROPDOWN') && (
                                                        <p className="text-sm text-success">
                                                            ✓ {q.options[q.correctIndex] || 'No correct answer set'}
                                                        </p>
                                                    )}
                                                    {q.type === 'CHECKBOX' && (
                                                        <p className="text-sm text-success">
                                                            ✓ {q.correctIndices?.map((i: number) => q.options[i]).join(', ') || 'No correct answers'}
                                                        </p>
                                                    )}
                                                    {(q.type === 'SHORT_ANSWER' || q.type === 'LONG_ANSWER') && (
                                                        <p className="text-sm text-theme-muted italic">Text response</p>
                                                    )}
                                                </div>
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={(e: React.MouseEvent) => {
                                                            e.stopPropagation()
                                                            duplicateQuestion(index)
                                                        }}
                                                        className="btn btn-ghost text-xs"
                                                        title="Duplicate"
                                                    >
                                                        ⧉
                                                    </button>
                                                    <button
                                                        onClick={(e: React.MouseEvent) => {
                                                            e.stopPropagation()
                                                            deleteQuestion(index)
                                                        }}
                                                        className="btn btn-ghost text-danger text-xs"
                                                        title="Delete"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>

                    {questions.length === 0 && (
                        <div className="card text-center py-12">
                            <p className="text-theme-muted mb-4">No questions yet</p>
                            <button onClick={() => addQuestion('MULTIPLE_CHOICE')} className="btn btn-primary">
                                Add First Question
                            </button>
                        </div>
                    )}
                </div>

                {/* Danger Zone */}
                <div className="card border-danger/30">
                    <h3 className="text-sm font-medium text-danger mb-4">Danger Zone</h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-theme-primary font-medium">Delete Quiz</p>
                            <p className="text-sm text-theme-muted">
                                This will delete all questions and attempts
                            </p>
                        </div>
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="btn btn-danger"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            className="card max-w-sm w-full"
                        >
                            <h3 className="text-lg font-semibold text-theme-primary mb-2">
                                Delete Quiz?
                            </h3>
                            <p className="text-theme-muted text-sm mb-6">
                                This will permanently delete &quot;{quiz.title}&quot; including all {questions.length} questions
                                {quiz._count && quiz._count.attempts > 0 && ` and ${quiz._count.attempts} student attempts`}.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="btn btn-danger flex-1"
                                >
                                    {deleting ? <div className="spinner" /> : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
