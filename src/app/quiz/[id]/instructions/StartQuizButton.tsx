'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as Checkbox from '@radix-ui/react-checkbox'
import { motion } from 'framer-motion'

export default function StartQuizButton({
    quizId,
    existingAttemptId
}: {
    quizId: string
    existingAttemptId?: string
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [agreed, setAgreed] = useState(false)

    const enterFullscreen = async () => {
        try {
            const el = document.documentElement
            const webkitEl = el as HTMLElement & {
                webkitRequestFullscreen?: () => Promise<void>
                msRequestFullscreen?: () => Promise<void>
            }
            if (el.requestFullscreen) {
                await el.requestFullscreen()
            } else if (webkitEl.webkitRequestFullscreen) {
                await webkitEl.webkitRequestFullscreen()
            } else if (webkitEl.msRequestFullscreen) {
                await webkitEl.msRequestFullscreen()
            }
        } catch (e) {
            console.warn('Fullscreen request failed:', e)
        }
    }

    const handleStart = async () => {
        setLoading(true)

        // Enter fullscreen before starting quiz
        await enterFullscreen()

        if (existingAttemptId) {
            router.push(`/quiz/${quizId}/attempt`)
            return
        }

        try {
            const res = await fetch(`/api/quizzes/${quizId}/start`, { method: 'POST' })
            if (!res.ok) {
                const data = await res.json()
                alert(data.error || 'Failed to start')
                setLoading(false)
                return
            }
            router.push(`/quiz/${quizId}/attempt`)
        } catch {
            alert('Failed to start')
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox.Root
                    checked={agreed}
                    onCheckedChange={(checked) => setAgreed(checked as boolean)}
                    className="w-5 h-5 rounded border border-[var(--border)] bg-[var(--bg-tertiary)] flex items-center justify-center data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)]"
                >
                    <Checkbox.Indicator>
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </Checkbox.Indicator>
                </Checkbox.Root>
                <span className="text-xs text-[var(--text-muted)]">
                    I agree to follow the quiz rules. The quiz will open in fullscreen mode.
                </span>
            </label>

            <button
                onClick={handleStart}
                disabled={!agreed || loading}
                className="btn btn-primary btn-lg w-full"
            >
                {loading ? (
                    <div className="spinner" />
                ) : existingAttemptId ? (
                    'Continue'
                ) : (
                    'Start Quiz'
                )}
            </button>
        </motion.div>
    )
}
