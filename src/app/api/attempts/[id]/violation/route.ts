import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Must stay in sync with the logViolation() calls in src/hooks/useProctoringEngine.ts
const ALLOWED_VIOLATION_TYPES = [
    'APP_SWITCH',
    'APP_SWITCH_IOS',
    'BACK_NAVIGATION',
    'COPY_ATTEMPT',
    'COPY_PASTE_SHORTCUT',
    'DEVTOOLS_ATTEMPT',
    'DEVTOOLS_OPENED',
    'FULLSCREEN_EXIT',
    'MAC_SCREENSHOT',
    'MULTI_TOUCH_GESTURE',
    'PAGE_HIDE_IOS',
    'PRINT_ATTEMPT',
    'QUICK_BLUR_DETECTED',
    'SCREENSHOT_ATTEMPT',
    'SCREENSHOT_DETECTED',
    'SCREEN_CAPTURE_DETECTED',
    'SNIPPING_TOOL',
    'TAB_SWITCH',
    'WINDOW_RESIZE',
]

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

    if (!type || !ALLOWED_VIOLATION_TYPES.includes(type)) {
        return NextResponse.json({ error: 'Invalid violation type' }, { status: 400 })
    }

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
