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
    const MAX_RETRIES = 3

    let updatedAttempt: { reloadCount: number } | null = null
    for (let attemptIndex = 0; attemptIndex < MAX_RETRIES; attemptIndex += 1) {
        try {
            updatedAttempt = await prisma.quizAttempt.update({
                where: { id },
                data: { reloadCount: { increment: 1 } },
                select: { reloadCount: true }
            })
            break
        } catch (error) {
            const message = error instanceof Error ? error.message : ''
            const isRetryable = message.includes('Record has changed since last read')
            if (!isRetryable || attemptIndex === MAX_RETRIES - 1) {
                throw error
            }
        }
    }

    if (!updatedAttempt) {
        return NextResponse.json({ error: 'Unable to update reload count' }, { status: 500 })
    }

    const newReloadCount = updatedAttempt.reloadCount
    const shouldLogViolation = newReloadCount > RELOAD_THRESHOLD

    if (shouldLogViolation) {
        await prisma.$transaction([
            prisma.quizAttempt.update({
                where: { id },
                data: { violationCount: { increment: 1 } }
            }),
            prisma.violationLog.create({
                data: {
                    attemptId: id,
                    type: 'PAGE_RELOAD',
                    description: `Page reloaded ${newReloadCount} times (threshold: ${RELOAD_THRESHOLD})`
                }
            })
        ])
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
