import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { matchesQuizTargeting } from '@/lib/quizFilters'
import { getPlatformSettings } from '@/lib/settings'

interface QuestionPayload {
    id?: string
    text: string
    type?: string
    options?: string | string[]
    correctIndex?: number
    correctIndices?: string | number[]
    points?: number
}

// GET single quiz with questions
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const user = session.user

    const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: {
            subject: { select: { semester: true } },
            questions: {
                orderBy: { order: 'asc' },
                select: {
                    id: true,
                    text: true,
                    type: true,
                    options: true,
                    correctIndex: true, // Will filter this out for students below
                    correctIndices: true, // Will filter this out for students below
                    order: true,
                    points: true
                }
            },
            _count: { select: { attempts: true } }
        }
    })

    if (!quiz) {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Access Control Logic
    if (user.role === 'STUDENT') {
        // Fetch student details to verify eligibility
        const student = await prisma.user.findUnique({
            where: { id: user.id },
            select: { semester: true, batch: true, section: true }
        })

        if (!student) return NextResponse.json({ error: 'Student profile not found' }, { status: 403 })

        const settings = await getPlatformSettings()
        const quizTargeting = {
            assignedBatches: quiz.assignedBatches,
            targetSection: quiz.targetSection,
            targetSemester: (quiz as { targetSemester?: number | null }).targetSemester ?? null,
        }

        if (!matchesQuizTargeting(quizTargeting, student, settings)) {
            return NextResponse.json({ error: 'You are not eligible for this quiz' }, { status: 403 })
        }

        // 4. Hide correct answers for students
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const safeQuestions = quiz.questions.map(({ correctIndex: _correctIndex, ...q }: any) => q)
        return NextResponse.json({ ...quiz, questions: safeQuestions })
    }

    // Faculty/Admin Access
    if (quiz.facultyId !== user.id && user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(quiz)
}

// PUT - Update quiz
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const user = session.user
    const body = await request.json()

    const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: { _count: { select: { attempts: true } } }
    })

    if (!quiz) {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    if (quiz.facultyId !== user.id && user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { title, subject, description, timePerQuestion, enforcementMode, isPublished, questions, targetSection, assignedBatches, targetSemester } = body

    // Update quiz details
    const updatedQuiz = await prisma.quiz.update({
        where: { id },
        data: {
            ...(title && { title }),
            ...(subject && { subject }),
            ...(description !== undefined && { description }),
            ...(timePerQuestion && { timePerQuestion }),
            ...(enforcementMode && { enforcementMode }),
            ...(isPublished !== undefined && { isPublished }),
            ...(questions && { totalQuestions: questions.length }),
            ...(targetSection !== undefined && { targetSection: targetSection || null }),
            ...(assignedBatches !== undefined && { assignedBatches }),
            ...(targetSemester !== undefined && { targetSemester: targetSemester || null }),
        }
    })

    // If questions are provided, update them
    if (questions && Array.isArray(questions)) {
        // Get existing questions to determine what to preserve
        const existingQuestions = await prisma.question.findMany({
            where: { quizId: id },
            select: { id: true, options: true }
        })
        const existingMap = new Map(existingQuestions.map((q: { id: string, options: string | null }) => [q.id, q.options]))
        const existingIds = existingQuestions.map((q: { id: string }) => q.id)

        // Identify which IDs are present in the new payload
        const payloadIds = (questions as QuestionPayload[])
            .filter((q: QuestionPayload) => q.id)
            .map((q: QuestionPayload) => q.id as string)

        // Delete questions that are no longer in the payload
        const toDelete = existingIds.filter((eid: string) => !payloadIds.includes(eid))
        if (toDelete.length > 0) {
            // Must delete answers referencing these questions first (FK constraint)
            await prisma.answer.deleteMany({
                where: { questionId: { in: toDelete } }
            })
            await prisma.question.deleteMany({
                where: { id: { in: toDelete } }
            })
        }

        // Upsert each question
        for (let index = 0; index < questions.length; index++) {
            const q = questions[index] as QuestionPayload

            // Determine options string with preservation logic
            let optionsStr: string

            // Check if options has actual content (not just empty strings)
            const hasValidOptions = Array.isArray(q.options) &&
                q.options.length > 0 &&
                q.options.some((opt: string) => opt && opt.trim() !== '')

            if (typeof q.options === 'string' && q.options.length > 2) {
                // Already a JSON string with content (not just "[]")
                optionsStr = q.options
            } else if (hasValidOptions) {
                optionsStr = JSON.stringify(q.options)
            } else {
                // Options is undefined, null, empty array, or array of empty strings
                // For existing questions, preserve their current options
                if (q.id && existingMap.has(q.id)) {
                    optionsStr = (existingMap.get(q.id) as string) || '[]'
                } else {
                    // New question with no options
                    optionsStr = '[]'
                }
            }

            const questionData = {
                text: q.text,
                type: q.type || 'MULTIPLE_CHOICE',
                options: optionsStr,
                correctIndex: q.correctIndex,
                correctIndices: typeof q.correctIndices === 'string' ? q.correctIndices : JSON.stringify(q.correctIndices || []),
                order: index + 1,
                points: q.points || 1
            }

            if (q.id && existingIds.includes(q.id)) {
                await prisma.question.update({
                    where: { id: q.id },
                    data: questionData
                })
            } else {
                await prisma.question.create({
                    data: { ...questionData, quizId: id }
                })
            }
        }
    }

    return NextResponse.json({ success: true, quiz: updatedQuiz })
}

// DELETE - Delete quiz
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const user = session.user

    const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: { _count: { select: { attempts: true } } }
    })

    if (!quiz) {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    if (quiz.facultyId !== user.id && user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete in correct order due to foreign key constraints
    // First delete violation logs
    await prisma.violationLog.deleteMany({
        where: { attempt: { quizId: id } }
    })

    // Delete answers
    await prisma.answer.deleteMany({
        where: { attempt: { quizId: id } }
    })

    // Delete attempts
    await prisma.quizAttempt.deleteMany({
        where: { quizId: id }
    })

    // Delete questions
    await prisma.question.deleteMany({
        where: { quizId: id }
    })

    // Finally delete the quiz
    await prisma.quiz.delete({ where: { id } })

    return NextResponse.json({ success: true })
}
