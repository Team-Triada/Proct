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

    // Increment reload count
    const newReloadCount = attempt.reloadCount + 1

    await prisma.quizAttempt.update({
        where: { id },
        data: { reloadCount: newReloadCount }
    })

    // Log as violation if more than 2 reloads
    const RELOAD_THRESHOLD = 2
    let violationLogged = false
    let message = ''

    if (newReloadCount > RELOAD_THRESHOLD) {
        await prisma.violationLog.create({
            data: {
                attemptId: id,
                type: 'PAGE_RELOAD',
                description: `Page reloaded ${newReloadCount} times (threshold: ${RELOAD_THRESHOLD})`
            }
        })

        // Update violation count
        await prisma.quizAttempt.update({
            where: { id },
            data: { violationCount: attempt.violationCount + 1 }
        })

        violationLogged = true
        message = `⚠️ Page reload #${newReloadCount} recorded as violation`
    } else if (newReloadCount === RELOAD_THRESHOLD) {
        message = `⚠️ Next reload will be recorded as a violation`
    }

    return NextResponse.json({
        success: true,
        reloadCount: newReloadCount,
        violationLogged,
        message
    })
}
