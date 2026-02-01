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

    if (!session || (session.user as any).role !== 'STUDENT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
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

    // 1. Semester Check
    if (quiz.subject.semester !== student.semester) {
        console.log(`[Quiz Start Denied] Semester Mismatch. Quiz: ${quiz.subject.semester}, Student: ${student.semester}`)
        return NextResponse.json({ error: `This quiz is for Semester ${quiz.subject.semester}` }, { status: 403 })
    }

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

    // 3. Section (Class) Check
    if (quiz.targetSection && quiz.targetSection !== student.section) {
        console.log(`[Quiz Start Denied] Section Mismatch. Required: ${quiz.targetSection}, Student: ${student.section}`)
        return NextResponse.json({ error: `This quiz is restricted to Batch ${quiz.targetSection}` }, { status: 403 })
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
            // Calculate remaining time server-side
            // Time Limit in Seconds
            const timeLimitSeconds = quiz.totalQuestions * quiz.timePerQuestion

            // Elapsed Time
            const now = new Date()
            const elapsedSeconds = Math.floor((now.getTime() - new Date(existingAttempt.startedAt).getTime()) / 1000)
            const remainingSeconds = timeLimitSeconds - elapsedSeconds

            // If time expired, auto-submit
            if (remainingSeconds <= 0) {
                await prisma.quizAttempt.update({
                    where: { id: existingAttempt.id },
                    data: {
                        status: 'SUBMITTED',
                        submittedAt: new Date()
                    }
                })
                return NextResponse.json({ error: 'Time expired', status: 'SUBMITTED' }, { status: 400 })
            }

            // Return Resume State
            return NextResponse.json({
                attemptId: existingAttempt.id,
                questionOrder: JSON.parse(existingAttempt.questionOrder),
                timeRemaining: remainingSeconds,
                currentIndex: existingAttempt.currentIndex,
                answers: existingAttempt.answers,
                resume: true
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
    const totalTime = quiz.totalQuestions * quiz.timePerQuestion

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
        timeRemaining: totalTime,
        currentIndex: 0,
        resume: false
    })
}
