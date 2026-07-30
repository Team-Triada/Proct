import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * Clears a student's attempt so they can sit the quiz again.
 *
 * `QuizAttempt` is unique on (studentId, quizId), so without this a student
 * whose browser crashed or whose power cut out mid-quiz is locked out forever.
 * Only the owning faculty member or an admin may do it, and the old attempt is
 * preserved in the response so the action is reviewable.
 */
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    if (user.role !== 'FACULTY' && user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const attempt = await prisma.quizAttempt.findUnique({
        where: { id },
        include: {
            quiz: { select: { id: true, title: true, facultyId: true } },
            student: { select: { id: true, name: true, rollNumber: true } },
        },
    })

    if (!attempt) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 })
    }

    // Faculty may only reset attempts on their own quizzes.
    if (user.role === 'FACULTY' && attempt.quiz.facultyId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const summary = {
        attemptId: attempt.id,
        student: attempt.student,
        quiz: { id: attempt.quiz.id, title: attempt.quiz.title },
        status: attempt.status,
        score: attempt.score,
        totalPoints: attempt.totalPoints,
        violationCount: attempt.violationCount,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
    }

    // Answers and violation logs cascade from the attempt, but delete them
    // explicitly and inside a transaction so a partial failure cannot leave
    // orphaned rows behind a freed-up unique constraint.
    await prisma.$transaction([
        prisma.answer.deleteMany({ where: { attemptId: id } }),
        prisma.violationLog.deleteMany({ where: { attemptId: id } }),
        prisma.quizAttempt.delete({ where: { id } }),
    ])

    console.warn(
        `[AUDIT] Attempt reset by ${user.role} ${user.id}: ` +
        `attempt=${id} student=${attempt.student.id} quiz=${attempt.quiz.id} ` +
        `discardedScore=${attempt.score}/${attempt.totalPoints}`
    )

    return NextResponse.json({
        message: 'Attempt cleared. The student can now retake this quiz.',
        discarded: summary,
    })
}
