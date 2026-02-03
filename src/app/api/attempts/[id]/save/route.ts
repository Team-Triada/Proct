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
        select: {
            studentId: true,
            status: true,
            currentIndex: true,
            currentQuestionStartTime: true,
            startedAt: true,
            quiz: true // Fetch full quiz details for timing rules
        }
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

    // TIMING ENFORCEMENT
    const now = new Date()
    const { quiz } = attempt

    // 1. Availability Check (Global)
    if (quiz.availableUntil && now > quiz.availableUntil) {
        return NextResponse.json({ error: 'Quiz availability has ended' }, { status: 403 })
    }

    // 2. Mode-Specific Checks

    // Fetch question type first to handle exemptions
    const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: { type: true, correctIndex: true, correctIndices: true, points: true }
    })

    if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    if (quiz.timingMode === 'PER_QUESTION') {
        // Enforce Per-Question Timer ONLY for Objective Questions
        if (question.type !== 'SHORT_ANSWER' && question.type !== 'LONG_ANSWER') {
            const elapsed = Math.floor((now.getTime() - new Date(attempt.currentQuestionStartTime).getTime()) / 1000)
            const limit = quiz.timePerQuestion
            // Allow 10s grace for latency/network
            if (elapsed > limit + 10) {
                // Prompt says "Auto-advance on timeout", implying strictness.
                if (elapsed > limit + 30) {
                    return NextResponse.json({ error: 'Time limit exceeded for this question' }, { status: 403 })
                }
            }
        }
    } else if (quiz.timingMode === 'TOTAL_DURATION' && quiz.totalDuration) {
        // Enforce Global Timer
        const elapsedTotal = Math.floor((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000)
        const limitTotal = quiz.totalDuration * 60
        if (elapsedTotal > limitTotal + 30) {
            return NextResponse.json({ error: 'Total time limit exceeded' }, { status: 403 })
        }
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
    // Prepare Attempt Update Data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
        lastActivityAt: new Date()
    }

    if (currentQuestionIndex !== undefined) {
        // If advancing index
        if (currentQuestionIndex > attempt.currentIndex) {
            updateData.currentIndex = currentQuestionIndex

            // PER_QUESTION: Reset timer for NEXT question
            if (attempt.quiz.timingMode === 'PER_QUESTION') {
                updateData.currentQuestionStartTime = new Date()
            }
        }
    }

    await prisma.quizAttempt.update({
        where: { id },
        data: updateData
    })

    return NextResponse.json({ success: true })
}
