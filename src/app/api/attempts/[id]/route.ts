import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
    buildShuffleMapping,
    parseShuffleMappings,
    toOriginalIndex,
    type ShuffleMapping,
} from '@/lib/shuffle'
import { checkTiming, elapsedOnQuestion } from '@/lib/attemptTiming'

// Get current question
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
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

    // Forward lookahead is not allowed. Without this, a student can walk
    // ?index=0..n immediately after starting and read the entire paper before
    // answering anything, which defeats per-question timing entirely.
    // Backward navigation stays open so the client's "Previous" button works
    // for the modes that permit review.
    if (targetIndex > attempt.currentIndex) {
        return NextResponse.json(
            { error: 'Cannot access a question ahead of your current position' },
            { status: 403 }
        )
    }

    const currentQuestionId = questionOrder[targetIndex]

    const question = await prisma.question.findUnique({
        where: { id: currentQuestionId }
    })

    if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    let options: string[] = []
    try {
        options = JSON.parse(question.options || '[]') as string[]
    } catch {
        options = []
    }

    // Option order is decided and stored server-side. It is generated once per
    // question and reused on every later read, so a reload shows the student the
    // same order it will be graded against, and the client never gets a say in
    // how its answer maps back to the original options.
    const storedMappings = parseShuffleMappings(attempt.shuffleMappings)
    let mapping: ShuffleMapping | undefined = storedMappings[question.id]

    if (options.length > 0 && (!mapping || mapping.length !== options.length)) {
        mapping = buildShuffleMapping(options.length)
        storedMappings[question.id] = mapping
        await prisma.quizAttempt.update({
            where: { id: attempt.id },
            data: { shuffleMappings: JSON.stringify(storedMappings) },
        })
    }

    const displayedOptions = mapping ? mapping.map(originalIndex => options[originalIndex]) : options

    return NextResponse.json({
        attemptId: attempt.id,
        questionNumber: targetIndex + 1,
        totalQuestions: questionOrder.length,
        questionId: question.id,
        questionText: question.text,
        options: displayedOptions,
        timePerQuestion: attempt.quiz.timePerQuestion,
        enforcementMode: attempt.quiz.enforcementMode,
        violationCount: attempt.violationCount,
        type: question.type,
        // Server-measured remaining time for this question, so a client that
        // reloads to reset its countdown gains nothing.
        secondsElapsedOnQuestion: elapsedOnQuestion(attempt),
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

    const user = session.user
    const { id } = await params
    const body = await request.json()
    // `shuffleMapping` and `timeTaken` are deliberately not read from the body:
    // the mapping comes from the attempt row and the elapsed time is measured
    // from the server's own `currentQuestionStartTime`.
    const { selectedIndex, selectedIndices, textAnswer } = body

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

    // Server-authoritative timing: reject answers that arrive after the
    // allowance for this question (or the whole attempt) has run out.
    const now = new Date()
    const verdict = checkTiming(attempt.quiz, attempt, question.type, now)
    if (verdict.expired) {
        return NextResponse.json(
            { error: verdict.reason, overageSeconds: verdict.overageSeconds },
            { status: 403 }
        )
    }

    const timeTaken = elapsedOnQuestion(attempt, now)

    let questionOptions: string[] = []
    try {
        questionOptions = JSON.parse(question.options || '[]') as string[]
    } catch {
        questionOptions = []
    }
    const shuffleMapping = parseShuffleMappings(attempt.shuffleMappings)[question.id]

    // Validating Answer
    let isCorrect = false
    let originalSelectedIndex: number | null = null
    let originalSelectedIndices: number[] = []
    let pointsAwarded: number | null = null

    if (question.type === 'CHECKBOX') {
        const correctIndices = JSON.parse(question.correctIndices || '[]') as number[]
        if (selectedIndices && Array.isArray(selectedIndices)) {
            originalSelectedIndices = selectedIndices.map((i: number) =>
                toOriginalIndex(i, shuffleMapping, questionOptions.length)
            )

            // Correct logic: Intersection of selected and correct
            const selectedSet = new Set(originalSelectedIndices)
            const correctSet = new Set(correctIndices)

            let correctMatches = 0
            let incorrectMatches = 0

            selectedSet.forEach((idx: number) => {
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
        originalSelectedIndex =
            selectedIndex === null || selectedIndex === undefined
                ? null
                : toOriginalIndex(selectedIndex, shuffleMapping, questionOptions.length)
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
            if (a.pointsAwarded !== null) {
                score += a.pointsAwarded
            }
        })

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
            score: attempt.quiz.showScore ? score : null,
            totalPoints: attempt.quiz.showScore ? attempt.totalPoints : null,
            showScore: attempt.quiz.showScore
        })
    }

    // Move to next question. The per-question clock has to restart here, or the
    // next question inherits this question's start time and is already expired.
    await prisma.quizAttempt.update({
        where: { id },
        data: {
            currentIndex: attempt.currentIndex + 1,
            currentQuestionStartTime: now,
            lastActivityAt: now,
            timeSpent: attempt.quiz.timingMode === 'PER_QUESTION' ? 0 : attempt.timeSpent + timeTaken,
        }
    })

    return NextResponse.json({
        completed: false,
        nextQuestion: attempt.currentIndex + 2
    })
}
