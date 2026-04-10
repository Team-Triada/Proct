import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET single question
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; questionId: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, questionId } = await params
    const user = session.user

    const quiz = await prisma.quiz.findUnique({ where: { id } })
    if (!quiz || (quiz.facultyId !== user.id && user.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const question = await prisma.question.findUnique({
        where: { id: questionId }
    })

    if (!question || question.quizId !== id) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    return NextResponse.json(question)
}

// PUT - Update single question
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; questionId: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, questionId } = await params
    const user = session.user
    const body = await request.json()

    const quiz = await prisma.quiz.findUnique({ where: { id } })
    if (!quiz || (quiz.facultyId !== user.id && user.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const question = await prisma.question.findUnique({
        where: { id: questionId }
    })

    if (!question || question.quizId !== id) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    const { text, options, correctIndex, points } = body

    const updated = await prisma.question.update({
        where: { id: questionId },
        data: {
            ...(text && { text }),
            ...(options && { options }),
            ...(correctIndex !== undefined && { correctIndex }),
            ...(points !== undefined && { points })
        }
    })

    return NextResponse.json(updated)
}

// DELETE - Delete single question
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; questionId: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, questionId } = await params
    const user = session.user

    const quiz = await prisma.quiz.findUnique({ where: { id } })
    if (!quiz || (quiz.facultyId !== user.id && user.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const question = await prisma.question.findUnique({
        where: { id: questionId }
    })

    if (!question || question.quizId !== id) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    await prisma.question.delete({ where: { id: questionId } })

    // Update quiz total count
    const remainingCount = await prisma.question.count({ where: { quizId: id } })
    await prisma.quiz.update({
        where: { id },
        data: { totalQuestions: remainingCount }
    })

    return NextResponse.json({ success: true })
}

// POST - Add new question to quiz
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; questionId: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const user = session.user
    const body = await request.json()

    const quiz = await prisma.quiz.findUnique({ where: { id } })
    if (!quiz || (quiz.facultyId !== user.id && user.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { text, options, correctIndex, points } = body

    // Get max order
    const maxOrder = await prisma.question.aggregate({
        where: { quizId: id },
        _max: { order: true }
    })

    const newQuestion = await prisma.question.create({
        data: {
            quizId: id,
            text,
            options,
            correctIndex,
            points: points || 1,
            order: (maxOrder._max.order || 0) + 1
        }
    })

    // Update quiz total count
    await prisma.quiz.update({
        where: { id },
        data: { totalQuestions: { increment: 1 } }
    })

    return NextResponse.json(newQuestion)
}
