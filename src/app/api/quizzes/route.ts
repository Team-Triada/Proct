import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { normalizeBatches } from '@/lib/utils'

// GET all quizzes for faculty (filtered by their subjects)
export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    if (user.role === 'FACULTY') {
        const quizzes = await prisma.quiz.findMany({
            where: { facultyId: user.id },
            include: {
                subject: true,
                _count: { select: { questions: true, attempts: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(quizzes)
    }

    if (user.role === 'ADMIN') {
        const quizzes = await prisma.quiz.findMany({
            include: {
                faculty: { select: { name: true } },
                subject: true,
                _count: { select: { questions: true, attempts: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(quizzes)
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST create new quiz
export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    if (user.role !== 'FACULTY') {
        return NextResponse.json({ error: 'Only faculty can create quizzes' }, { status: 403 })
    }

    const body = await request.json()
    const { title, subjectId, description, timePerQuestion, totalQuestions, enforcementMode, timingMode, totalDuration, assignedBatches, targetBatch, targetSection, isPublished, questions, availableFrom, availableUntil } = body

    // Validate Timing Modes




    // Verify faculty is assigned to this subject
    const faculty = await prisma.user.findUnique({
        where: { id: user.id },
        include: { subjects: { where: { id: subjectId } } }
    })

    if (!faculty?.subjects.length) {
        return NextResponse.json({ error: 'You are not assigned to this subject' }, { status: 403 })
    }

    // Normalize batches logic
    let finalBatches: string[] = []
    if (assignedBatches && Array.isArray(assignedBatches)) {
        finalBatches = normalizeBatches(assignedBatches)
    } else if (targetBatch) {
        finalBatches = normalizeBatches([targetBatch])
    }

    const quiz = await prisma.quiz.create({
        data: {
            title,
            subjectId,
            description,
            timePerQuestion,
            totalQuestions,
            timingMode: timingMode || 'PER_QUESTION',
            totalDuration: totalDuration || null,
            enforcementMode,

            assignedBatches: finalBatches, // Save as JSON array
            targetSection: targetSection || null,
            isPublished,
            availableFrom: availableFrom ? new Date(availableFrom) : null,
            availableUntil: availableUntil ? new Date(availableUntil) : null,
            facultyId: user.id,
            questions: {
                create: questions.map((q: any, index: number) => ({
                    text: q.text,
                    type: q.type || 'MULTIPLE_CHOICE',
                    options: JSON.stringify(q.options),
                    correctIndex: q.correctIndex,
                    correctIndices: JSON.stringify(q.correctIndices || []),
                    points: q.points || 1,
                    order: index + 1
                }))
            }
        }
    })

    return NextResponse.json(quiz)
}
