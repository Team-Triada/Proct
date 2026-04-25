import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

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

    // Validate Time
    const timeLimitSeconds = attempt.quiz.totalQuestions * attempt.quiz.timePerQuestion
    const now = new Date()
    const elapsedSeconds = Math.floor((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000)

    // Allow 60 seconds grace period for latency
    if (elapsedSeconds > timeLimitSeconds + 60) {
        // Log expired but still process
        console.log(`Attempt ${id} submitted after expiration. Elapsed: ${elapsedSeconds}, Limit: ${timeLimitSeconds}`)
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
            submittedAt: new Date(),
            score
        }
    })

    return NextResponse.json({
        completed: true,
        score,
        totalPoints: attempt.totalPoints,
        showScore: attempt.quiz.showScore
    })
}
