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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session.user as any
    const body = await request.json()
    const { questionId, currentQuestionIndex, textAnswer, selectedIndices, selectedIndex } = body

    // Verify Attempt exists and belongs to user
    const attempt = await prisma.quizAttempt.findUnique({
        where: { id },
        select: { studentId: true, status: true }
    })

    if (!attempt) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attempt.studentId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (attempt.status !== 'IN_PROGRESS') {
        return NextResponse.json({ error: 'Attempt is not in progress' }, { status: 400 })
    }

    // Get question details for auto-grading
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: { type: true, correctIndex: true, correctIndices: true, points: true }
    })

    if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Auto-grading logic
    let isCorrect = false
    let pointsAwarded: number | null = null

    if (question.type === 'CHECKBOX') {
        // Checkbox: partial scoring
        const correctIndices = JSON.parse(question.correctIndices || '[]') as number[]
        if (selectedIndices && Array.isArray(selectedIndices)) {
            const selectedSet = new Set(selectedIndices)
            const correctSet = new Set(correctIndices)

            let correctMatches = 0
            let incorrectMatches = 0

            selectedSet.forEach(idx => {
                if (correctSet.has(idx)) correctMatches++
                else incorrectMatches++
            })

            const totalCorrect = correctSet.size
            if (totalCorrect > 0) {
                const rawScore = ((correctMatches - incorrectMatches) / totalCorrect) * question.points
                pointsAwarded = Math.max(0, parseFloat(rawScore.toFixed(2)))
            } else {
                pointsAwarded = 0
            }
            isCorrect = pointsAwarded === question.points
        }
    } else if (question.type === 'SHORT_ANSWER' || question.type === 'LONG_ANSWER') {
        // Text answers need manual grading
        isCorrect = false
        pointsAwarded = null // Pending grading
    } else {
        // Multiple Choice / Dropdown: full points if correct
        if (selectedIndex !== null && selectedIndex !== undefined) {
            isCorrect = selectedIndex === question.correctIndex
            pointsAwarded = isCorrect ? question.points : 0
        }
    }

    // Build answer data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const answerData: any = {
        attemptId: id,
        questionId: questionId,
        isCorrect,
        pointsAwarded,
        answeredAt: new Date()
    }

    if (selectedIndices !== undefined) {
        answerData.selectedIndices = JSON.stringify(selectedIndices)
    } else if (textAnswer !== undefined) {
        answerData.textAnswer = textAnswer
    } else if (selectedIndex !== undefined) {
        answerData.selectedIndex = selectedIndex
    }

    await prisma.answer.upsert({
        where: {
            attemptId_questionId: {
                attemptId: id,
                questionId: questionId
            }
        },
        update: answerData,
        create: answerData
    })

    // Update Attempt Progress
    await prisma.quizAttempt.update({
        where: { id },
        data: {
            currentIndex: currentQuestionIndex !== undefined ? currentQuestionIndex : undefined,
            lastActivityAt: new Date()
        }
    })

    return NextResponse.json({ success: true })
}
