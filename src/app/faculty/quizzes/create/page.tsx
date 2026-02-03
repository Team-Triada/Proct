'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeToggle from '@/components/ThemeToggle'

type QuestionType = 'MULTIPLE_CHOICE' | 'CHECKBOX' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'DROPDOWN'

interface Question {
    text: string
    type: QuestionType
    options: string[]
    correctIndex: number
    correctIndices: number[]
}

interface Subject {
    id: string
    code: string
    name: string
    semester: number
}

const questionTypes = [
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice', icon: '◉', desc: 'One correct answer' },
    { value: 'CHECKBOX', label: 'Checkboxes', icon: '☑', desc: 'Multiple correct answers' },
    { value: 'DROPDOWN', label: 'Dropdown', icon: '▾', desc: 'One answer from dropdown' },
    { value: 'SHORT_ANSWER', label: 'Short Answer', icon: '—', desc: 'Brief text response' },
    { value: 'LONG_ANSWER', label: 'Long Answer', icon: '¶', desc: 'Detailed text response' },
]

export default function CreateQuizPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const preselectedSubject = searchParams.get('subject')

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loadingSubjects, setLoadingSubjects] = useState(true)

    const [title, setTitle] = useState('')
    const [subjectId, setSubjectId] = useState(preselectedSubject || '')
    const [description, setDescription] = useState('')
    const [timePerQuestion, setTimePerQuestion] = useState(30)

    const [enforcementMode, setEnforcementMode] = useState('NORMAL')

    const [targetYear, setTargetYear] = useState('')
    const [targetSection, setTargetSection] = useState('')
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [pendingPublish, setPendingPublish] = useState(false)

    const [questions, setQuestions] = useState<Question[]>([])
    const [showTypeSelector, setShowTypeSelector] = useState(false)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [currentQ, setCurrentQ] = useState<Question>({
        text: '',
        type: 'MULTIPLE_CHOICE',
        options: ['', '', '', ''],
        correctIndex: 0,
        correctIndices: []
    })

    // Duplicate detection state
    const [warnings, setWarnings] = useState<string[]>([])

    // Helper: Check for similar question text (case-insensitive, normalized)
    const findSimilarQuestions = (text: string, excludeIndex?: number): string[] => {
        const normalized = text.toLowerCase().trim()
        if (normalized.length < 5) return []

        return questions
            .filter((q, i) => excludeIndex !== i)
            .filter(q => {
                const existing = q.text.toLowerCase().trim()
                // Check for exact match or very similar (one contains the other)
                return existing === normalized ||
                    existing.includes(normalized) ||
                    normalized.includes(existing)
            })
            .map(q => q.text.substring(0, 50) + (q.text.length > 50 ? '...' : ''))
    }

    // Helper: Check for duplicate options within a question
    const findDuplicateOptions = (options: string[]): number[] => {
        const seen = new Map<string, number>()
        const duplicates: number[] = []

        options.forEach((opt, i) => {
            const normalized = opt.toLowerCase().trim()
            if (normalized && seen.has(normalized)) {
                duplicates.push(i)
                duplicates.push(seen.get(normalized)!)
            } else if (normalized) {
                seen.set(normalized, i)
            }
        })

        return [...new Set(duplicates)]
    }

    // Validate current question for duplicates
    const validateForDuplicates = () => {
        const newWarnings: string[] = []

        // Check for similar questions
        const similarQ = findSimilarQuestions(currentQ.text, editingIndex ?? undefined)
        if (similarQ.length > 0) {
            newWarnings.push(`⚠️ Similar question exists: "${similarQ[0]}"`)
        }

        // Check for duplicate options
        const dupeOptions = findDuplicateOptions(currentQ.options)
        if (dupeOptions.length > 0) {
            newWarnings.push(`⚠️ Duplicate options detected at positions: ${dupeOptions.map(i => i + 1).join(', ')}`)
        }

        setWarnings(newWarnings)
    }

    // Fetch faculty's assigned subjects
    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await fetch('/api/subjects/my')
                const data = await res.json()
                if (Array.isArray(data)) {
                    setSubjects(data)
                    if (preselectedSubject) {
                        setSubjectId(preselectedSubject)
                    } else if (data.length > 0) {
                        setSubjectId(data[0].id)
                    }
                } else {
                    console.error('Failed to fetch subjects:', data)
                    setSubjects([])
                }
            } catch (err) {
                console.error(err)
                setSubjects([])
            } finally {
                setLoadingSubjects(false)
            }
        }
        fetchSubjects()
    }, [preselectedSubject])

    // Trigger duplicate validation when question text or options change
    useEffect(() => {
        if (currentQ.text.length > 4 || currentQ.options.some(o => o.trim())) {
            validateForDuplicates()
        } else {
            setWarnings([])
        }
    }, [currentQ.text, currentQ.options])

    const startNewQuestion = (type: QuestionType) => {
        setCurrentQ({
            text: '',
            type,
            options: type === 'SHORT_ANSWER' || type === 'LONG_ANSWER' ? [] : ['', '', '', ''],
            correctIndex: 0,
            correctIndices: []
        })
        setEditingIndex(null)
        setShowTypeSelector(false)
    }

    const toggleCorrectIndex = (optionIndex: number) => {
        if (currentQ.type === 'CHECKBOX') {
            const indices = currentQ.correctIndices || []
            const newIndices = indices.includes(optionIndex)
                ? indices.filter(i => i !== optionIndex)
                : [...indices, optionIndex]
            setCurrentQ({ ...currentQ, correctIndices: newIndices })
        } else {
            setCurrentQ({ ...currentQ, correctIndex: optionIndex })
        }
    }

    const addOption = () => {
        setCurrentQ({ ...currentQ, options: [...currentQ.options, ''] })
    }

    const removeOption = (index: number) => {
        if (currentQ.options.length <= 2) return
        const newOptions = currentQ.options.filter((_, i) => i !== index)
        setCurrentQ({
            ...currentQ,
            options: newOptions,
            correctIndex: currentQ.correctIndex >= newOptions.length ? 0 : currentQ.correctIndex,
            correctIndices: currentQ.correctIndices.filter(i => i !== index).map(i => i > index ? i - 1 : i)
        })
    }

    const addQuestion = () => {


        if (!currentQ.text.trim()) {
            setError('Enter question text')
            return
        }

        if (currentQ.type !== 'SHORT_ANSWER' && currentQ.type !== 'LONG_ANSWER') {


            if (currentQ.options.some(o => !o.trim())) {
                setError('Complete all options')
                return
            }
            if (currentQ.type === 'CHECKBOX' && currentQ.correctIndices.length === 0) {
                setError('Select at least one correct answer')
                return
            }
        }

        if (editingIndex !== null) {
            const updated = [...questions]
            updated[editingIndex] = currentQ
            setQuestions(updated)
        } else {
            setQuestions([...questions, currentQ])
        }

        setCurrentQ({
            text: '',
            type: 'MULTIPLE_CHOICE',
            options: ['', '', '', ''],
            correctIndex: 0,
            correctIndices: []
        })
        setEditingIndex(null)
        setError('')
    }

    const editQuestion = (index: number) => {
        setCurrentQ(questions[index])
        setEditingIndex(index)
    }

    const removeQuestion = (index: number) => {
        setQuestions(questions.filter((_, i) => i !== index))
        if (editingIndex === index) {
            setEditingIndex(null)
            setCurrentQ({
                text: '',
                type: 'MULTIPLE_CHOICE',
                options: ['', '', '', ''],
                correctIndex: 0,
                correctIndices: []
            })
        }
    }

    const handleSubmit = async (publish: boolean, force = false) => {
        if (questions.length < 1) {
            setError('Add at least one question')
            return
        }

        // Check for unrestricted access
        if (!force && (targetYear === '' || targetSection === '')) {
            setPendingPublish(publish)
            setShowConfirmation(true)
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch('/api/quizzes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    subjectId,
                    description,
                    timePerQuestion,
                    totalQuestions: questions.length,

                    enforcementMode,

                    assignedBatches: targetYear ? [targetYear] : [], // Send as array
                    targetSection: targetSection || null,
                    isPublished: publish,
                    questions: questions.map(q => ({
                        ...q,
                        points: 1
                    }))
                })
            })

            if (!res.ok) throw new Error('Failed to create quiz')

            router.push('/faculty/quizzes')
            router.refresh()
        } catch {
            setError('Failed to create quiz')
            setLoading(false)
        }
    }

    const selectedSubject = Array.isArray(subjects) ? subjects.find(s => s.id === subjectId) : null

    return (
        <div className="min-h-screen bg-theme">
            {/* Header */}
            <header className="sticky top-0 z-40 border-b border-theme-subtle bg-theme-primary backdrop-blur-xl">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
                    <button onClick={() => router.back()} className="btn btn-ghost text-sm">
                        ← Back
                    </button>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                    </div>
                </div>
                {/* Progress Steps */}
                <div className="max-w-lg mx-auto px-4 pb-4">
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex-1 flex items-center gap-2">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${step >= s
                                        ? 'bg-accent text-white'
                                        : 'bg-theme-tertiary text-theme-muted'
                                        }`}
                                >
                                    {s}
                                </div>
                                {s < 3 && (
                                    <div className={`flex-1 h-0.5 rounded ${step > s ? 'bg-accent' : 'bg-theme-tertiary'}`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex mt-2">
                        <span className="flex-1 text-xs text-theme-muted">Details</span>
                        <span className="flex-1 text-xs text-theme-muted text-center">Questions</span>
                        <span className="flex-1 text-xs text-theme-muted text-right">Review</span>
                    </div>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6">
                <AnimatePresence mode="wait">
                    {/* Step 1 - Details */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h1 className="text-xl font-semibold text-theme-primary">Quiz Details</h1>

                            <div className="space-y-4">
                                {/* Subject Selection */}
                                <div>
                                    <label className="label">Subject *</label>
                                    {loadingSubjects ? (
                                        <div className="input flex items-center">
                                            <div className="spinner" style={{ width: '16px', height: '16px' }} />
                                            <span className="ml-2 text-theme-muted">Loading...</span>
                                        </div>
                                    ) : subjects.length === 0 ? (
                                        <div className="p-4 rounded-lg text-sm text-center" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                                            No subjects assigned. Contact admin.
                                        </div>
                                    ) : (
                                        <select
                                            value={subjectId}
                                            onChange={(e) => setSubjectId(e.target.value)}
                                            className="input"
                                        >
                                            {subjects.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.code} - {s.name} (Sem {s.semester})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <div>
                                    <label className="label">Title *</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="input"
                                        placeholder="Midterm Assessment"
                                    />
                                </div>

                                <div>
                                    <label className="label">Time per Question (seconds)</label>
                                    <input
                                        type="number"
                                        value={timePerQuestion}
                                        onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                                        className="input"
                                        min="10"
                                        max="300"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Year</label>
                                        <select
                                            value={targetYear}
                                            onChange={(e) => setTargetYear(e.target.value)}
                                            className="input"
                                        >
                                            <option value="">All Years</option>
                                            <option value="2023-26">2023-26</option>
                                            <option value="2024-27">2024-27</option>
                                            <option value="2025-28">2025-28</option>
                                            <option value="2026-29">2026-29</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="label">Batch</label>
                                        <select
                                            value={targetSection}
                                            onChange={(e) => setTargetSection(e.target.value)}
                                            className="input"
                                        >
                                            <option value="">All Batches</option>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                                <option key={n} value={String(n)}>Batch {n}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <p className="text-xs text-theme-muted">
                                    Leave as "All" to allow everyone. Be careful with unrestricted quizzes.
                                </p>

                                <div>
                                    <label className="label">Description (optional)</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="input min-h-[80px]"
                                        placeholder="Brief description..."
                                    />
                                </div>

                                <div>
                                    <label className="label">Enforcement Mode *</label>
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setEnforcementMode('NORMAL')}
                                            className={`enforcement-btn ${enforcementMode === 'NORMAL' ? 'selected' : ''}`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${enforcementMode === 'NORMAL'
                                                    ? 'border-accent bg-accent'
                                                    : 'border-theme'
                                                    }`}>
                                                    {enforcementMode === 'NORMAL' && (
                                                        <div className="w-2 h-2 rounded-full bg-white" />
                                                    )}
                                                </div>
                                                <span className="font-medium text-sm text-theme-primary">Normal</span>
                                            </div>
                                            <p className="text-xs text-theme-muted pl-6">
                                                Warning before auto-submit
                                            </p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setEnforcementMode('STRICT')}
                                            className={`enforcement-btn ${enforcementMode === 'STRICT' ? 'selected' : ''}`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${enforcementMode === 'STRICT'
                                                    ? 'border-danger bg-danger'
                                                    : 'border-theme'
                                                    }`}>
                                                    {enforcementMode === 'STRICT' && (
                                                        <div className="w-2 h-2 rounded-full bg-white" />
                                                    )}
                                                </div>
                                                <span className="font-medium text-sm text-theme-primary">Strict</span>
                                            </div>
                                            <p className="text-xs text-theme-muted pl-6">
                                                Immediate auto-submit
                                            </p>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!title.trim() || !subjectId || subjects.length === 0}
                                className="btn btn-primary btn-lg w-full"
                            >
                                Next: Add Questions
                            </button>
                        </motion.div>
                    )}

                    {/* Step 2 - Questions */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between">
                                <h1 className="text-xl font-semibold text-theme-primary">Add Questions</h1>
                                <span className="badge badge-primary">{questions.length} added</span>
                            </div>

                            {/* Added Questions */}
                            {questions.length > 0 && (
                                <div className="space-y-2">
                                    {questions.map((q, i) => (
                                        <div
                                            key={i}
                                            className={`card card-sm flex items-start justify-between gap-3 cursor-pointer ${editingIndex === i ? 'ring-2 ring-accent' : ''}`}
                                            onClick={() => editQuestion(i)}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="badge badge-neutral text-xs">Q{i + 1}</span>
                                                    <span className="text-xs text-theme-muted">
                                                        {questionTypes.find(t => t.value === q.type)?.label}
                                                    </span>
                                                </div>
                                                <p className="font-medium text-sm text-theme-primary truncate">
                                                    {q.text}
                                                </p>
                                                {q.type !== 'SHORT_ANSWER' && q.type !== 'LONG_ANSWER' && (
                                                    <p className="text-xs text-success truncate">
                                                        {q.type === 'CHECKBOX'
                                                            ? `✓ ${q.correctIndices.length} correct`
                                                            : `✓ ${q.options[q.correctIndex]}`
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeQuestion(i) }}
                                                className="text-danger hover:opacity-70 text-xl leading-none"
                                                aria-label="Remove question"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Question Type Selector */}
                            {showTypeSelector && (
                                <div className="card space-y-2">
                                    <p className="label">Select Question Type</p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {questionTypes.map(t => (
                                            <button
                                                key={t.value}
                                                onClick={() => startNewQuestion(t.value as QuestionType)}
                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-theme-tertiary text-left transition-colors"
                                            >
                                                <span className="text-xl">{t.icon}</span>
                                                <div>
                                                    <p className="font-medium text-sm text-theme-primary">{t.label}</p>
                                                    <p className="text-xs text-theme-muted">{t.desc}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Add Question Form */}
                            {(currentQ.text || editingIndex !== null || !showTypeSelector) && !showTypeSelector && (
                                <div className="card space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">
                                                {questionTypes.find(t => t.value === currentQ.type)?.icon}
                                            </span>
                                            <select
                                                value={currentQ.type}
                                                onChange={(e) => {
                                                    const newType = e.target.value as QuestionType
                                                    setCurrentQ({
                                                        ...currentQ,
                                                        type: newType,
                                                        options: newType === 'SHORT_ANSWER' || newType === 'LONG_ANSWER' ? [] : currentQ.options.length ? currentQ.options : ['', '', '', ''],
                                                        correctIndices: []
                                                    })
                                                }}
                                                className="text-sm bg-theme-tertiary border-none rounded px-2 py-1 text-theme-primary"
                                            >
                                                {questionTypes.map(t => (
                                                    <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <span className="text-xs text-theme-muted">
                                            {editingIndex !== null ? 'Editing Q' + (editingIndex + 1) : 'New Question'}
                                        </span>
                                    </div>

                                    <div>
                                        <label className="label">Question</label>
                                        <textarea
                                            value={currentQ.text}
                                            onChange={(e) => setCurrentQ({ ...currentQ, text: e.target.value })}
                                            className="input min-h-[80px]"
                                            placeholder="Enter your question..."
                                        />
                                    </div>

                                    {/* Options for choice-based questions */}
                                    {(currentQ.type === 'MULTIPLE_CHOICE' || currentQ.type === 'CHECKBOX' || currentQ.type === 'DROPDOWN') && (
                                        <div className="space-y-3">
                                            <label className="label">
                                                {currentQ.type === 'CHECKBOX'
                                                    ? 'Options (select ALL correct answers)'
                                                    : 'Options (click letter to mark correct)'
                                                }
                                            </label>
                                            {currentQ.options.map((opt, i) => (
                                                <div key={i} className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleCorrectIndex(i)}
                                                        className={`option-letter ${currentQ.type === 'CHECKBOX'
                                                            ? (currentQ.correctIndices?.includes(i) ? 'selected' : '')
                                                            : (currentQ.correctIndex === i ? 'selected' : '')
                                                            }`}
                                                        aria-label={`Mark option ${String.fromCharCode(65 + i)} as correct`}
                                                    >
                                                        {currentQ.type === 'CHECKBOX'
                                                            ? (currentQ.correctIndices?.includes(i) ? '☑' : '☐')
                                                            : String.fromCharCode(65 + i)
                                                        }
                                                    </button>
                                                    <input
                                                        type="text"
                                                        value={opt}
                                                        onChange={(e) => {
                                                            const newOpts = [...currentQ.options]
                                                            newOpts[i] = e.target.value
                                                            setCurrentQ({ ...currentQ, options: newOpts })
                                                        }}
                                                        className="input flex-1"
                                                        placeholder={`Option ${i + 1}`}
                                                    />
                                                    {currentQ.options.length > 2 && (
                                                        <button
                                                            onClick={() => removeOption(i)}
                                                            className="btn btn-ghost text-danger px-2"
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            <button onClick={addOption} className="btn btn-ghost text-sm w-full">
                                                + Add Option
                                            </button>
                                        </div>
                                    )}

                                    {/* Short/Long answer info */}
                                    {(currentQ.type === 'SHORT_ANSWER' || currentQ.type === 'LONG_ANSWER') && (
                                        <div className="p-4 rounded-lg bg-theme-tertiary text-center">
                                            <p className="text-sm text-theme-muted">
                                                {currentQ.type === 'SHORT_ANSWER'
                                                    ? 'Students will enter a short text answer'
                                                    : 'Students will enter a detailed text answer'
                                                }
                                            </p>
                                            <p className="text-xs text-theme-muted mt-1">
                                                (Requires manual grading)
                                            </p>
                                        </div>
                                    )}

                                    {/* Duplicate Detection Warnings */}
                                    {warnings.length > 0 && (
                                        <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 space-y-1">
                                            {warnings.map((w, i) => (
                                                <p key={i} className="text-sm text-yellow-500">{w}</p>
                                            ))}
                                            <p className="text-xs text-theme-muted mt-2">You can still add this question despite warnings.</p>
                                        </div>
                                    )}

                                    {error && (
                                        <p className="text-sm text-danger">{error}</p>
                                    )}

                                    <div className="flex gap-2">
                                        <button onClick={addQuestion} className="btn btn-secondary flex-1">
                                            {editingIndex !== null ? 'Update Question' : '+ Add Question'}
                                        </button>
                                        <button
                                            onClick={() => setShowTypeSelector(true)}
                                            className="btn btn-ghost"
                                        >
                                            New Type
                                        </button>
                                    </div>
                                </div>
                            )}

                            {!showTypeSelector && questions.length === 0 && !currentQ.text && (
                                <button
                                    onClick={() => setShowTypeSelector(true)}
                                    className="btn btn-secondary w-full"
                                >
                                    + Add First Question
                                </button>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => setStep(1)} className="btn btn-ghost flex-1">
                                    Back
                                </button>
                                <button
                                    onClick={() => setStep(3)}
                                    disabled={questions.length < 1}
                                    className="btn btn-primary flex-1"
                                >
                                    Review ({questions.length})
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3 - Review */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <h1 className="text-xl font-semibold text-theme-primary">Review Quiz</h1>

                            <div className="card space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-theme-muted uppercase tracking-wide">Subject</p>
                                        <p className="font-medium text-theme-primary">{selectedSubject?.code}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-theme-muted uppercase tracking-wide">Title</p>
                                        <p className="font-medium text-theme-primary">{title}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-theme-muted uppercase tracking-wide">Time/Question</p>
                                        <p className="font-medium text-theme-primary">{timePerQuestion}s</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-theme-muted uppercase tracking-wide">Mode</p>
                                        <span className={`badge ${enforcementMode === 'STRICT' ? 'badge-danger' : 'badge-warning'}`}>
                                            {enforcementMode}
                                        </span>
                                    </div>
                                </div>

                                {/* Targeting Info */}
                                <div className="pt-4 border-t border-theme-subtle">
                                    <p className="text-xs text-theme-muted uppercase tracking-wide mb-3">Target Audience</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3 rounded-lg bg-theme-tertiary">
                                            <p className="text-xs text-theme-muted">Semester</p>
                                            <p className="font-semibold text-theme-primary">{selectedSubject?.semester || '-'}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-theme-tertiary">
                                            <p className="text-xs text-theme-muted">Year</p>
                                            <p className="font-semibold text-theme-primary">{targetYear || 'All'}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-theme-tertiary">
                                            <p className="text-xs text-theme-muted">Batch</p>
                                            <p className="font-semibold text-theme-primary">{targetSection ? `Batch ${targetSection}` : 'All'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-theme-subtle">
                                    <p className="text-xs text-theme-muted uppercase tracking-wide">Questions</p>
                                    <p className="text-2xl font-bold text-theme-primary">{questions.length}</p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {questions.map((q, i) => (
                                            <span key={i} className="text-xs text-theme-muted">
                                                {questionTypes.find(t => t.value === q.type)?.icon}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-danger text-center">{error}</p>
                            )}

                            <div className="space-y-3">
                                <button
                                    onClick={() => handleSubmit(true)}
                                    disabled={loading}
                                    className="btn btn-primary btn-lg w-full"
                                >
                                    {loading ? <div className="spinner" /> : 'Publish Quiz'}
                                </button>
                                <button
                                    onClick={() => handleSubmit(false)}
                                    disabled={loading}
                                    className="btn btn-secondary w-full"
                                >
                                    Save as Draft
                                </button>
                                <button onClick={() => setStep(2)} className="btn btn-ghost w-full">
                                    ← Edit Questions
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Hard Confirmation Modal */}
            <AnimatePresence>
                {showConfirmation && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.95 }}
                            className="card w-full max-w-md bg-theme-surface shadow-2xl border-danger/20"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
                                    <span className="text-xl">⚠️</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-theme-primary">Unrestricted Access Warning</h3>
                                    <p className="text-sm text-theme-muted mt-1">
                                        You are about to publish a quiz visible to <strong>ALL</strong> students in:
                                    </p>
                                    <ul className="text-sm text-theme-primary list-disc list-inside mt-2 space-y-1 bg-theme-tertiary p-2 rounded">
                                        {targetYear === '' && <li>All Years</li>}
                                        {targetSection === '' && <li>All Batches</li>}
                                    </ul>
                                </div>
                            </div>

                            <p className="text-sm text-danger font-medium mb-6">
                                Students outside your class may attempt this quiz.<br />
                                This choice cannot be changed after publishing.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmation(false)}
                                    className="btn btn-ghost flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowConfirmation(false)
                                        handleSubmit(pendingPublish, true)
                                    }}
                                    className="btn btn-danger flex-1"
                                >
                                    Confirm & Publish
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
