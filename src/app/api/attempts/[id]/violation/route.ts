import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

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
    const { type, description } = body

    const attempt = await prisma.quizAttempt.findUnique({
        where: { id }
    })

    if (!attempt || attempt.studentId !== user.id) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attempt.status !== 'IN_PROGRESS') {
        return NextResponse.json({ error: 'Quiz already submitted' }, { status: 400 })
    }

    // Log violation
    await prisma.violationLog.create({
        data: {
            attemptId: id,
            type,
            description
        }
    })

    // Update violation count atomically to prevent race conditions
    const updated = await prisma.quizAttempt.update({
        where: { id },
        data: { violationCount: { increment: 1 } },
        select: { violationCount: true }
    })

    return NextResponse.json({ success: true, violationCount: updated.violationCount })
}
