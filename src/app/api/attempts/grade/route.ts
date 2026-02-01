import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { attemptId, grades } = await request.json()

    if (!attemptId || !grades || !Array.isArray(grades)) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const user = session.user as any

    // Verify faculty owns the quiz for this attempt
    const attempt = await prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        include: { quiz: true }
    })

    if (!attempt) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attempt.quiz.facultyId !== user.id && user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Process all grades in a transaction
    await prisma.$transaction(async (tx) => {
        // 1. Update individual answers
        for (const grade of grades) {
            await tx.answer.update({
                where: {
                    attemptId_questionId: {
                        attemptId: attemptId,
                        questionId: grade.questionId
                    }
                },
                data: {
                    pointsAwarded: grade.points,
                    feedback: grade.feedback,
                    isCorrect: grade.points > 0 // Heuristic: >0 points is "correct" or partially correct
                }
            })
        }

        // 2. Recalculate total score
        const allAnswers = await tx.answer.findMany({
            where: { attemptId: attemptId }
        })

        let totalScore = 0
        allAnswers.forEach(a => {
            if (a.pointsAwarded !== null) {
                totalScore += a.pointsAwarded
            }
        })

        // 3. Update attempt score
        await tx.quizAttempt.update({
            where: { id: attemptId },
            data: { score: totalScore }
        })
    })

    return NextResponse.json({ success: true })
}
