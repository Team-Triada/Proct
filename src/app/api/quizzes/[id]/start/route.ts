import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { normalizeBatch } from '@/lib/utils'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user).role !== 'STUDENT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    const { id } = await params

    // Check if quiz exists and is published
    const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: {
            questions: true,
            subject: { select: { semester: true } }
        }
    })

    if (!quiz) {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    if (!quiz.isPublished) {
        return NextResponse.json({ error: 'Quiz is not available' }, { status: 403 })
    }

    const now = new Date()

    if (quiz.availableFrom && now < quiz.availableFrom) {
        return NextResponse.json({ error: 'Quiz is not yet available' }, { status: 403 })
    }
    if (quiz.availableUntil && now > quiz.availableUntil) {
        return NextResponse.json({ error: 'Quiz is no longer available' }, { status: 403 })
    }

    // Verify Student Access
    const student = await prisma.user.findUnique({
        where: { id: user.id },
        select: { semester: true, batch: true, section: true }
    })

    if (!student) return NextResponse.json({ error: 'Student profile not found' }, { status: 403 })

    // 1. (Semester check removed)
    // if (quiz.subject.semester !== student.semester) { ... }

    // 2. Batch (Year) Check
    const quizBatches = (quiz.assignedBatches as string[] | null) || []
    if (quizBatches.length > 0) {
        const studentBatch = normalizeBatch(student.batch || '')
        if (!studentBatch) {
            console.log(`[Quiz Start Denied] Student has no batch assigned`)
            return NextResponse.json({ error: 'You do not have a year assigned' }, { status: 403 })
        }

        const normalizedQuizBatches = quizBatches.map(b => normalizeBatch(b))
        if (!normalizedQuizBatches.includes(studentBatch)) {
            console.log(`[Quiz Start Denied] Batch Mismatch. Allowed: ${normalizedQuizBatches}, Student: ${studentBatch}`)
            return NextResponse.json({ error: 'Your year is not authorized for this quiz' }, { status: 403 })
        }
    }

    // 3. Section (Batch 1-12) Check
    const targetSection = quiz.targetSection
    if (targetSection && student.section !== targetSection) {
        console.log(`[Quiz Start Denied] Section Mismatch. Quiz: ${targetSection}, Student: ${student.section}`)
        return NextResponse.json({ error: `This quiz is for Batch ${targetSection} only` }, { status: 403 })
    }

    // Check if student already has an attempt
    const existingAttempt = await prisma.quizAttempt.findUnique({
        where: {
            studentId_quizId: {
                studentId: user.id,
                quizId: id
            }
        },
        include: {
            answers: true
        }
    })

    if (existingAttempt) {
        if (existingAttempt.status === 'IN_PROGRESS') {
            // Calculate remaining time using timeSpent (NOT wall-clock)
            // This ensures logout duration doesn't count against the student
            let remainingSeconds = 0

            if (quiz.timingMode === 'PER_QUESTION') {
                const questionOrder = JSON.parse(existingAttempt.questionOrder) as string[]
                const currentQId = questionOrder[existingAttempt.currentIndex]
                const currentQ = quiz.questions.find(q => q.id === currentQId)

                if (currentQ && (currentQ.type === 'SHORT_ANSWER' || currentQ.type === 'LONG_ANSWER')) {
                    remainingSeconds = -1 // Unlimited
                } else {
                    // Use timeSpent (accumulated active seconds) instead of wall-clock
                    remainingSeconds = Math.max(0, quiz.timePerQuestion - existingAttempt.timeSpent)
                }
            } else if (quiz.timingMode === 'TOTAL_DURATION' && quiz.totalDuration) {
                // Use timeSpent instead of wall-clock elapsed
                remainingSeconds = Math.max(0, (quiz.totalDuration * 60) - existingAttempt.timeSpent)
            } else if (quiz.timingMode === 'NO_TIME_LIMIT') {
                if (quiz.availableUntil) {
                    const now = new Date()
                    remainingSeconds = Math.floor((new Date(quiz.availableUntil).getTime() - now.getTime()) / 1000)
                } else {
                    remainingSeconds = 999999
                }
            } else {
                // Fallback: use timeSpent instead of wall-clock
                remainingSeconds = Math.max(0, (quiz.totalQuestions * quiz.timePerQuestion) - existingAttempt.timeSpent)
            }

            // Reset currentQuestionStartTime to NOW on resume
            // This way, the next save will calculate elapsed = now - resumeTime
            // and add it to the existing timeSpent
            // Retry loop: concurrent /reload may modify the record between our read and update
            for (let attempt = 0; attempt < 3; attempt++) {
                try {
                    await prisma.quizAttempt.update({
                        where: { id: existingAttempt.id },
                        data: {
                            currentQuestionStartTime: new Date(),
                            lastActivityAt: new Date()
                        }
                    })
                    break // Success
                } catch (e: any) {
                    if (attempt === 2) throw e // Final retry failed
                    // Otherwise retry after brief delay
                    await new Promise(r => setTimeout(r, 50))
                }
            }

            // Return Resume State
            return NextResponse.json({
                attemptId: existingAttempt.id,
                questionOrder: JSON.parse(existingAttempt.questionOrder),
                timeRemaining: remainingSeconds,
                currentIndex: existingAttempt.currentIndex,
                answers: existingAttempt.answers,
                resume: true,
                timingMode: quiz.timingMode,
                totalDuration: quiz.totalDuration
            })
        }
        return NextResponse.json({ error: 'Quiz already completed' }, { status: 400 })
    }

    // Shuffle questions and select the required number
    const shuffledQuestions = quiz.questions
        .sort(() => Math.random() - 0.5)
        .slice(0, quiz.totalQuestions)

    const questionOrder = shuffledQuestions.map(q => q.id)
    const totalPoints = shuffledQuestions.reduce((sum, q) => sum + q.points, 0)

    // Calculate total time for new attempt
    // Calculate initial time for new attempt
    // Calculate initial time for new attempt
    let initialTime = 0
    if (quiz.timingMode === 'PER_QUESTION') {
        // Check first question type
        const firstQ = quiz.questions.find(q => q.id === questionOrder[0])
        if (firstQ && (firstQ.type === 'SHORT_ANSWER' || firstQ.type === 'LONG_ANSWER')) {
            initialTime = -1 // Unlimited for subjective
        } else {
            initialTime = quiz.timePerQuestion
        }
    } else if (quiz.timingMode === 'TOTAL_DURATION' && quiz.totalDuration) {
        initialTime = quiz.totalDuration * 60
    } else if (quiz.timingMode === 'NO_TIME_LIMIT') {
        if (quiz.availableUntil) {
            const now = new Date()
            initialTime = Math.floor((new Date(quiz.availableUntil).getTime() - now.getTime()) / 1000)
        } else {
            initialTime = 999999
        }
    } else {
        initialTime = quiz.totalQuestions * quiz.timePerQuestion
    }

    // Create attempt
    const attempt = await prisma.quizAttempt.create({
        data: {
            studentId: user.id,
            quizId: id,
            questionOrder: JSON.stringify(questionOrder),
            totalPoints,
            status: 'IN_PROGRESS'
        }
    })

    return NextResponse.json({
        attemptId: attempt.id,
        questionOrder,
        timeRemaining: initialTime,
        currentIndex: 0,
        resume: false,
        timingMode: quiz.timingMode,
        totalDuration: quiz.totalDuration,
        currentQuestionStartTime: new Date()
    })
}
