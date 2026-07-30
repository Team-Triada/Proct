import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { matchesQuizTargeting } from '@/lib/quizFilters'
import { getPlatformSettings } from '@/lib/settings'
import { shuffle } from '@/lib/shuffle'

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

    // Hard structural check: student must belong to the subject's semester.
    // This is intentionally outside the targeting flags — the flags control
    // quiz-level targeting, not the subject-semester boundary.
    if (student.semester !== null && quiz.subject.semester !== student.semester) {
        return NextResponse.json({ error: 'You are not eligible for this quiz' }, { status: 403 })
    }

    const settings = await getPlatformSettings()
    const quizTargeting = {
        assignedBatches: quiz.assignedBatches,
        targetSection: quiz.targetSection,
        targetSemester: (quiz as { targetSemester?: number | null }).targetSemester ?? null,
    }

    if (!matchesQuizTargeting(quizTargeting, student, settings)) {
        return NextResponse.json({ error: 'You are not eligible for this quiz' }, { status: 403 })
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
                const currentQ = quiz.questions.find((q: any) => q.id === currentQId)

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
                } catch (e: unknown) {
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
    const shuffledQuestions = shuffle(quiz.questions).slice(0, quiz.totalQuestions)

    const questionOrder = shuffledQuestions.map((q: { id: string }) => q.id)
    const totalPoints = shuffledQuestions.reduce((sum: number, q: { points: number }) => sum + q.points, 0)

    // Calculate total time for new attempt
    // Calculate initial time for new attempt
    // Calculate initial time for new attempt
    let initialTime = 0
    if (quiz.timingMode === 'PER_QUESTION') {
        // Check first question type
        const firstQ = quiz.questions.find((q: any) => q.id === questionOrder[0])
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
