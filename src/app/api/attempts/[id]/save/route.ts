import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { parseShuffleMappings, toOriginalIndex } from '@/lib/shuffle'
import { checkTiming } from '@/lib/attemptTiming'

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
    const body = await request.json()
    // `shuffleMapping` is intentionally not read from the body — it is looked up
    // from the attempt row so the client cannot choose how its answer maps back
    // to the original option order.
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
            timeSpent: true,
            questionOrder: true,
            shuffleMappings: true,
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

    const now = new Date()
    const { quiz } = attempt

    // The question must belong to this attempt's own question order. Without
    // this an answer could be saved against any question id in the database,
    // including questions from another faculty member's quiz.
    const attemptQuestionOrder = JSON.parse(attempt.questionOrder) as string[]
    if (typeof questionId !== 'string' || !attemptQuestionOrder.includes(questionId)) {
        return NextResponse.json({ error: 'Question is not part of this attempt' }, { status: 400 })
    }

    const question = await prisma.question.findUnique({
        where: { id: questionId },
        select: { type: true, correctIndex: true, correctIndices: true, points: true, options: true }
    })

    if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // TIMING ENFORCEMENT — measured entirely from server-written timestamps.
    const verdict = checkTiming(quiz, attempt, question.type, now)
    if (verdict.expired) {
        return NextResponse.json(
            { error: verdict.reason, overageSeconds: verdict.overageSeconds },
            { status: 403 }
        )
    }

    let questionOptions: string[] = []
    try {
        questionOptions = JSON.parse(question.options || '[]') as string[]
    } catch {
        questionOptions = []
    }
    const shuffleMapping = parseShuffleMappings(attempt.shuffleMappings)[questionId]

    // Auto-grading logic
    let isCorrect = false
    let pointsAwarded: number | null = null

    if (question.type === 'CHECKBOX') {
        // Checkbox: partial scoring
        const correctIndices = JSON.parse(question.correctIndices || '[]') as number[]
        if (selectedIndices && Array.isArray(selectedIndices)) {
            const originalSelectedIndices = selectedIndices.map((idx: number) =>
                toOriginalIndex(idx, shuffleMapping, questionOptions.length)
            )
            const selectedSet = new Set(originalSelectedIndices)
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
            const originalSelectedIndex = toOriginalIndex(selectedIndex, shuffleMapping, questionOptions.length)
            isCorrect = originalSelectedIndex === question.correctIndex
            pointsAwarded = isCorrect ? question.points : 0
        }
    }

    // Build answer data
    const baseAnswerData = {
        isCorrect,
        pointsAwarded,
        answeredAt: new Date(),
        selectedIndices: selectedIndices !== undefined
            ? JSON.stringify(
                (selectedIndices as number[]).map((idx: number) =>
                    toOriginalIndex(idx, shuffleMapping, questionOptions.length)
                )
            )
            : undefined,
        textAnswer: textAnswer !== undefined ? textAnswer : undefined,
        selectedIndex: selectedIndex !== undefined && selectedIndex !== null
            ? toOriginalIndex(selectedIndex, shuffleMapping, questionOptions.length)
            : selectedIndex,
    }

    await prisma.answer.upsert({
        where: {
            attemptId_questionId: {
                attemptId: id,
                questionId: questionId
            }
        },
        update: baseAnswerData,
        create: {
            attemptId: id,
            questionId: questionId,
            ...baseAnswerData
        }
    })

    // Prepare Attempt Update Data
    // Calculate elapsed time since last checkpoint (currentQuestionStartTime)
    const elapsedSinceCheckpoint = Math.floor((now.getTime() - new Date(attempt.currentQuestionStartTime).getTime()) / 1000)

    const updateData: Prisma.QuizAttemptUpdateInput = {
        lastActivityAt: new Date(),
        // Accumulate active time
        timeSpent: attempt.timeSpent + elapsedSinceCheckpoint,
        // Reset checkpoint so next save doesn't double-count
        currentQuestionStartTime: new Date()
    }

    if (currentQuestionIndex !== undefined) {
        // If advancing index
        if (currentQuestionIndex > attempt.currentIndex) {
            updateData.currentIndex = currentQuestionIndex

            // PER_QUESTION: Reset timer for NEXT question
            if (attempt.quiz.timingMode === 'PER_QUESTION') {
                updateData.currentQuestionStartTime = new Date()
                updateData.timeSpent = 0 // Reset accumulator for new question
            }
        }
    }

    await prisma.quizAttempt.update({
        where: { id },
        data: updateData
    })

    return NextResponse.json({ success: true })
}
