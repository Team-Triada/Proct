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

    const user = session.user as any
    const { id } = await params

    const attempt = await prisma.quizAttempt.findUnique({
        where: { id }
    })

    if (!attempt || attempt.studentId !== user.id) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    if (attempt.status !== 'IN_PROGRESS') {
        return NextResponse.json({ error: 'Quiz already submitted' }, { status: 400 })
    }

    // Use atomic increment to avoid race conditions
    const RELOAD_THRESHOLD = 2
    const newReloadCount = attempt.reloadCount + 1
    const shouldLogViolation = newReloadCount > RELOAD_THRESHOLD

    // Single consolidated update with atomic increments
    await prisma.quizAttempt.update({
        where: { id },
        data: {
            reloadCount: { increment: 1 },
            ...(shouldLogViolation && { violationCount: { increment: 1 } })
        }
    })

    // Log violation separately
    if (shouldLogViolation) {
        await prisma.violationLog.create({
            data: {
                attemptId: id,
                type: 'PAGE_RELOAD',
                description: `Page reloaded ${newReloadCount} times (threshold: ${RELOAD_THRESHOLD})`
            }
        })
    }

    let message = ''
    if (shouldLogViolation) {
        message = `⚠️ Page reload #${newReloadCount} recorded as violation`
    } else if (newReloadCount === RELOAD_THRESHOLD) {
        message = `⚠️ Next reload will be recorded as a violation`
    }

    return NextResponse.json({
        success: true,
        reloadCount: newReloadCount,
        violationLogged: shouldLogViolation,
        message
    })
}
