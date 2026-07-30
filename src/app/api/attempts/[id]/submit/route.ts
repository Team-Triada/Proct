import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { LATENCY_GRACE_SECONDS } from '@/lib/attemptTiming'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const user = session.user

    const attempt = await prisma.quizAttempt.findUnique({
        where: { id },
        include: { quiz: true }
    })

    if (!attempt || attempt.studentId !== user.id) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attempt.status !== 'IN_PROGRESS') {
        return NextResponse.json({ error: 'Quiz already submitted', completed: true }, { status: 200 })
    }

    // Validate time. A submit is never rejected — refusing it would leave the
    // attempt stuck IN_PROGRESS with no way for the student to finish. Late
    // *answers* are already rejected by the save path, so what matters here is
    // recording the overage durably so faculty can see it, rather than emitting
    // a console warning nobody reads.
    const now = new Date()
    const totalBudgetSeconds =
        attempt.quiz.timingMode === 'TOTAL_DURATION' && attempt.quiz.totalDuration
            ? attempt.quiz.totalDuration * 60
            : attempt.quiz.totalQuestions * attempt.quiz.timePerQuestion

    const elapsedSeconds = Math.floor((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000)
    const isUnbounded = attempt.quiz.timingMode === 'NO_TIME_LIMIT'
    const overageSeconds = isUnbounded ? 0 : Math.max(0, elapsedSeconds - totalBudgetSeconds)
    const submittedLate = overageSeconds > LATENCY_GRACE_SECONDS

    if (submittedLate) {
        await prisma.violationLog.create({
            data: {
                attemptId: id,
                type: 'LATE_SUBMISSION',
                description: `Submitted ${overageSeconds}s past the ${totalBudgetSeconds}s limit`,
            },
        })
    }

    // Calculate Score (Synchronous)
    const answers = await prisma.answer.findMany({
        where: { attemptId: id },
        include: { question: true }
    })

    let score = 0
    answers.forEach(a => {
        if (a.pointsAwarded !== null) {
            score += a.pointsAwarded
        }
    })

    // Update Attempt
    await prisma.quizAttempt.update({
        where: { id },
        data: {
            status: 'COMPLETED',
            submittedAt: now,
            score,
            submittedLate,
            overageSeconds
        }
    })

    // Never return the score when faculty hid it — the client cannot be trusted
    // to honour the flag, so withhold the value itself.
    return NextResponse.json({
        completed: true,
        score: attempt.quiz.showScore ? score : null,
        totalPoints: attempt.quiz.showScore ? attempt.totalPoints : null,
        showScore: attempt.quiz.showScore
    })
}
