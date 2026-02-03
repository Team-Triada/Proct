import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { normalizeBatch } from '@/lib/utils'

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
    const user = session.user as any

    const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: {
            subject: { select: { semester: true } },
            questions: {
                orderBy: { order: 'asc' },
                select: {
                    id: true,
                    text: true,
                    options: true,
                    correctIndex: true, // Will filter this out for students below
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

        // 1. (Semester Check removed)
        // if (student.semester !== quiz.subject.semester) { ... }

        // 2. Batch (Year) Check
        const assignedBatches = (quiz.assignedBatches as string[] | null) || []
        if (assignedBatches.length > 0) {
            const studentBatch = normalizeBatch(student.batch || '')
            const normalizedAssigned = assignedBatches.map(b => normalizeBatch(b))

            if (!studentBatch || !normalizedAssigned.includes(studentBatch)) {
                return NextResponse.json({ error: 'This quiz is not for your year' }, { status: 403 })
            }
        }

        // 3. Section (Batch 1-12) Check
        const targetSection = quiz.targetSection
        if (targetSection && student.section !== targetSection) {
            return NextResponse.json({ error: `This quiz is for Batch ${targetSection} only` }, { status: 403 })
        }

        // 4. Hide correct answers for students
        const safeQuestions = quiz.questions.map(({ correctIndex, ...q }) => q)
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
    const user = session.user as any
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

    const { title, subject, description, timePerQuestion, enforcementMode, isPublished, questions, targetSection, assignedBatches } = body

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
            ...(assignedBatches !== undefined && { assignedBatches })
        }
    })

    // If questions are provided, update them
    if (questions && Array.isArray(questions)) {
        // Delete existing questions and create new ones (simpler than diffing)
        await prisma.question.deleteMany({ where: { quizId: id } })

        await prisma.question.createMany({
            data: questions.map((q: any, index: number) => ({
                quizId: id,
                text: q.text,
                type: q.type || 'MULTIPLE_CHOICE',
                options: JSON.stringify(q.options),
                correctIndex: q.correctIndex,
                correctIndices: JSON.stringify(q.correctIndices || []),
                order: index + 1,
                points: q.points || 1
            }))
        })
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
    const user = session.user as any

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
