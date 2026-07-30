/**
 * Server-authoritative attempt timing.
 *
 * The client's countdown is a display convenience only. Every value used to
 * decide whether an answer is still accepted is derived here from timestamps
 * the server wrote (`startedAt`, `currentQuestionStartTime`). A client-supplied
 * `timeTaken` is never trusted.
 */

export interface TimedQuiz {
    timingMode: string
    timePerQuestion: number
    totalDuration: number | null
    totalQuestions: number
    availableUntil: Date | null
}

export interface TimedAttempt {
    startedAt: Date
    currentQuestionStartTime: Date
    timeSpent: number
}

/** Grace allowed for network latency and clock skew before rejecting, in seconds. */
export const LATENCY_GRACE_SECONDS = 30

/** Subjective questions are exempt from the per-question timer. */
export function isSubjective(questionType: string): boolean {
    return questionType === 'SHORT_ANSWER' || questionType === 'LONG_ANSWER'
}

/** Seconds elapsed on the current question, measured server-side. */
export function elapsedOnQuestion(attempt: TimedAttempt, now: Date = new Date()): number {
    return Math.max(
        0,
        Math.floor((now.getTime() - new Date(attempt.currentQuestionStartTime).getTime()) / 1000)
    )
}

/** Seconds elapsed since the attempt was created, measured server-side. */
export function elapsedOnAttempt(attempt: TimedAttempt, now: Date = new Date()): number {
    return Math.max(0, Math.floor((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000))
}

export type TimingRejection = { expired: true; reason: string; overageSeconds: number }
export type TimingAcceptance = { expired: false }
export type TimingVerdict = TimingRejection | TimingAcceptance

/**
 * Decides whether an answer submitted now is still within the quiz's limits.
 *
 * `NO_TIME_LIMIT` is bounded only by `availableUntil`. `PER_QUESTION` is bounded
 * by the per-question allowance, exempting subjective questions.
 * `TOTAL_DURATION` and the default fall back to a whole-attempt budget.
 */
export function checkTiming(
    quiz: TimedQuiz,
    attempt: TimedAttempt,
    questionType: string,
    now: Date = new Date()
): TimingVerdict {
    if (quiz.availableUntil && now > new Date(quiz.availableUntil)) {
        const overageSeconds = Math.floor((now.getTime() - new Date(quiz.availableUntil).getTime()) / 1000)
        return { expired: true, reason: 'Quiz availability has ended', overageSeconds }
    }

    if (quiz.timingMode === 'NO_TIME_LIMIT') {
        return { expired: false }
    }

    if (quiz.timingMode === 'PER_QUESTION') {
        if (isSubjective(questionType)) return { expired: false }
        const elapsed = elapsedOnQuestion(attempt, now)
        const limit = quiz.timePerQuestion
        if (elapsed > limit + LATENCY_GRACE_SECONDS) {
            return {
                expired: true,
                reason: 'Time limit exceeded for this question',
                overageSeconds: elapsed - limit,
            }
        }
        return { expired: false }
    }

    const limitTotal =
        quiz.timingMode === 'TOTAL_DURATION' && quiz.totalDuration
            ? quiz.totalDuration * 60
            : quiz.totalQuestions * quiz.timePerQuestion

    const elapsedTotal = elapsedOnAttempt(attempt, now)
    if (elapsedTotal > limitTotal + LATENCY_GRACE_SECONDS) {
        return {
            expired: true,
            reason: 'Total time limit exceeded',
            overageSeconds: elapsedTotal - limitTotal,
        }
    }

    return { expired: false }
}
