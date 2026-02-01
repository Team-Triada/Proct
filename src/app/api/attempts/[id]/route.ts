import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Get current question
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    const { id } = await params

    const attempt = await prisma.quizAttempt.findUnique({
        where: { id },
        include: {
            quiz: true
        }
    })

    if (!attempt || attempt.studentId !== user.id) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attempt.status !== 'IN_PROGRESS') {
        return NextResponse.json({ error: 'Quiz already submitted', status: attempt.status }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const indexParam = searchParams.get('index')

    let targetIndex = attempt.currentIndex
    if (indexParam !== null) {
        const idx = parseInt(indexParam)
        if (!isNaN(idx)) targetIndex = idx
    }

    const questionOrder = JSON.parse(attempt.questionOrder) as string[]

    // Bounds check
    if (targetIndex < 0 || targetIndex >= questionOrder.length) {
        return NextResponse.json({ error: 'Index out of bounds' }, { status: 400 })
    }

    const currentQuestionId = questionOrder[targetIndex]

    const question = await prisma.question.findUnique({
        where: { id: currentQuestionId }
    })

    if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Parse and shuffle options while tracking correct answer
    const options = JSON.parse(question.options) as string[]
    // const correctOption = options[question.correctIndex] // Not sending correct answer to client

    // Create shuffled options array with indices
    const shuffledOptions = options
        .map((opt, idx) => ({ text: opt, originalIndex: idx }))
        .sort(() => Math.random() - 0.5)

    return NextResponse.json({
        attemptId: attempt.id,
        questionNumber: targetIndex + 1,
        totalQuestions: questionOrder.length,
        questionId: question.id,
        questionText: question.text,
        options: shuffledOptions.map(o => o.text),
        shuffleMapping: shuffledOptions.map(o => o.originalIndex),
        timePerQuestion: attempt.quiz.timePerQuestion,
        enforcementMode: attempt.quiz.enforcementMode,
        violationCount: attempt.violationCount,
        type: question.type // Added type
    })
}

// Submit answer for current question
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session.user as any
    const { id } = await params
    const body = await request.json()
    const { selectedIndex, selectedIndices, textAnswer, shuffleMapping, timeTaken } = body

    const attempt = await prisma.quizAttempt.findUnique({
        where: { id },
        include: { quiz: true }
    })

    if (!attempt || attempt.studentId !== user.id) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attempt.status !== 'IN_PROGRESS') {
        return NextResponse.json({ error: 'Quiz already submitted' }, { status: 400 })
    }

    const questionOrder = JSON.parse(attempt.questionOrder) as string[]
    const currentQuestionId = questionOrder[attempt.currentIndex]

    const question = await prisma.question.findUnique({
        where: { id: currentQuestionId }
    })

    if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Validating Answer
    let isCorrect = false
    let originalSelectedIndex: number | null = null
    let originalSelectedIndices: number[] = []
    let pointsAwarded: number | null = null

    if (question.type === 'CHECKBOX') {
        const correctIndices = JSON.parse(question.correctIndices || '[]') as number[]
        if (selectedIndices && Array.isArray(selectedIndices)) {
            // Map shuffled indices back to original if mapping exists
            originalSelectedIndices = shuffleMapping
                ? selectedIndices.map((i: number) => shuffleMapping[i])
                : selectedIndices

            // Correct logic: Intersection of selected and correct
            const selectedSet = new Set(originalSelectedIndices)
            const correctSet = new Set(correctIndices)

            let correctMatches = 0
            let incorrectMatches = 0

            selectedSet.forEach(idx => {
                if (correctSet.has(idx)) correctMatches++
                else incorrectMatches++
            })

            // Calculate partial score: (Correct - Incorrect) / TotalCorrect * Points
            // Floor at 0 to avoid negative scores
            // Example: 2 correct options, 10 points. 
            // Select 1 correct = (1 - 0)/2 * 10 = 5
            // Select 1 correct, 1 wrong = (1 - 1)/2 * 10 = 0

            const totalCorrect = correctSet.size
            if (totalCorrect > 0) {
                const rawScore = ((correctMatches - incorrectMatches) / totalCorrect) * question.points
                pointsAwarded = Math.max(0, parseFloat(rawScore.toFixed(2)))
            } else {
                pointsAwarded = 0
            }

            // isCorrect is true only if FULL points awarded (Exact match logic maintained for status)
            isCorrect = pointsAwarded === question.points
        }
    } else if (question.type === 'SHORT_ANSWER' || question.type === 'LONG_ANSWER') {
        // Text answers need manual grading
        isCorrect = false // Default to false
        pointsAwarded = null // Null signifies "Pending Grading"
    } else {
        // Multiple Choice / Dropdown
        originalSelectedIndex = shuffleMapping && selectedIndex !== null ? shuffleMapping[selectedIndex] : selectedIndex
        isCorrect = originalSelectedIndex === question.correctIndex
        // Auto-grade: Full points if correct, 0 if wrong
        pointsAwarded = isCorrect ? question.points : 0
    }

    // Save answer
    await prisma.answer.upsert({
        where: {
            attemptId_questionId: {
                attemptId: id,
                questionId: currentQuestionId
            }
        },
        create: {
            attemptId: id,
            questionId: currentQuestionId,
            selectedIndex: originalSelectedIndex,
            selectedIndices: JSON.stringify(originalSelectedIndices),
            textAnswer: textAnswer || null,
            isCorrect,
            pointsAwarded, // Set points
            timeTaken: timeTaken || 0
        },
        update: {
            selectedIndex: originalSelectedIndex,
            selectedIndices: JSON.stringify(originalSelectedIndices),
            textAnswer: textAnswer || null,
            isCorrect,
            pointsAwarded, // Set points
            timeTaken: timeTaken || 0
        }
    })

    // Check if this was the last question
    const isLastQuestion = attempt.currentIndex >= questionOrder.length - 1

    if (isLastQuestion) {
        // Calculate final score based on available points
        // NOTE: This score might change later when manual grading is done
        const answers = await prisma.answer.findMany({
            where: { attemptId: id },
            include: { question: true }
        })

        // Sum up points from all answers (treating null as 0 for now)
        // Manual grading will update the attempt score later
        let score = 0
        answers.forEach(a => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((a as any).pointsAwarded !== null) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                score += (a as any).pointsAwarded
            }
        })

        // Add current answer's points if not already in DB list (upsert might not have committed visibility yet if processed differently, but here we await upsert so it should be fine. actually let's just use the calculated score)
        // Wait, `answers` fetched above WILL include the upserted one because we awaited upsert.

        await prisma.quizAttempt.update({
            where: { id },
            data: {
                status: 'COMPLETED',
                score,
                submittedAt: new Date()
            }
        })

        return NextResponse.json({
            completed: true,
            score,
            totalPoints: attempt.totalPoints,
            showScore: attempt.quiz.showScore
        })
    }

    // Move to next question
    await prisma.quizAttempt.update({
        where: { id },
        data: { currentIndex: attempt.currentIndex + 1 }
    })

    return NextResponse.json({
        completed: false,
        nextQuestion: attempt.currentIndex + 2
    })
}
