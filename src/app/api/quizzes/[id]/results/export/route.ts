import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { buildCsv, safeFilename } from '@/lib/csv'

/**
 * Exports quiz results as CSV for the owning faculty member or an admin.
 *
 * Two shapes, chosen with `?format=`:
 *   summary (default) — one row per student attempt
 *   answers           — one row per answer, for item analysis
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    if (user.role === 'STUDENT') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const format = new URL(request.url).searchParams.get('format') === 'answers' ? 'answers' : 'summary'

    const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: {
            subject: { select: { code: true, name: true } },
            questions: { select: { id: true, text: true, order: true, points: true }, orderBy: { order: 'asc' } },
            attempts: {
                include: {
                    student: { select: { name: true, email: true, rollNumber: true, batch: true, section: true, semester: true } },
                    answers: {
                        select: {
                            questionId: true,
                            selectedIndex: true,
                            selectedIndices: true,
                            textAnswer: true,
                            isCorrect: true,
                            pointsAwarded: true,
                            timeTaken: true,
                            feedback: true,
                        },
                    },
                    violations: { select: { type: true }, orderBy: { occurredAt: 'asc' } },
                },
                orderBy: { startedAt: 'asc' },
            },
        },
    })

    if (!quiz) {
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    if (user.role === 'FACULTY' && quiz.facultyId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const questionNumberById = new Map(quiz.questions.map((q, i) => [q.id, i + 1]))
    let csv: string

    if (format === 'answers') {
        const header = [
            'Registration Number', 'Student Name', 'Email',
            'Question Number', 'Question', 'Question Points',
            'Answer', 'Correct', 'Points Awarded', 'Pending Grading',
            'Seconds Taken', 'Feedback',
        ]

        const rows = quiz.attempts.flatMap(attempt =>
            attempt.answers.map(answer => {
                const question = quiz.questions.find(q => q.id === answer.questionId)
                return [
                    attempt.student.rollNumber ?? '',
                    attempt.student.name,
                    attempt.student.email,
                    questionNumberById.get(answer.questionId) ?? '',
                    question?.text ?? '',
                    question?.points ?? '',
                    describeAnswer(answer),
                    answer.pointsAwarded === null ? '' : answer.isCorrect ? 'Yes' : 'No',
                    answer.pointsAwarded ?? '',
                    answer.pointsAwarded === null ? 'Yes' : 'No',
                    answer.timeTaken,
                    answer.feedback ?? '',
                ]
            })
        )

        csv = buildCsv(header, rows)
    } else {
        const header = [
            'Registration Number', 'Student Name', 'Email',
            'Year', 'Semester', 'Batch',
            'Status', 'Score', 'Total Points', 'Percentage',
            'Pending Grading', 'Violations', 'Violation Types',
            'Submitted Late', 'Overage Seconds', 'Reloads',
            'Started At', 'Submitted At',
        ]

        const rows = quiz.attempts.map(attempt => {
            const pending = attempt.answers.filter(a => a.pointsAwarded === null).length
            const percentage = attempt.totalPoints > 0
                ? ((attempt.score / attempt.totalPoints) * 100).toFixed(1)
                : ''

            return [
                attempt.student.rollNumber ?? '',
                attempt.student.name,
                attempt.student.email,
                attempt.student.batch ?? '',
                attempt.student.semester ?? '',
                attempt.student.section ?? '',
                attempt.status,
                attempt.score,
                attempt.totalPoints,
                percentage,
                pending,
                attempt.violationCount,
                [...new Set(attempt.violations.map(v => v.type))].join('; '),
                attempt.submittedLate ? 'Yes' : 'No',
                attempt.overageSeconds,
                attempt.reloadCount,
                attempt.startedAt.toISOString(),
                attempt.submittedAt?.toISOString() ?? '',
            ]
        })

        csv = buildCsv(header, rows)
    }

    const filename = `${safeFilename(quiz.subject.code)}-${safeFilename(quiz.title, 'quiz')}-${format}.csv`

    return new NextResponse(csv, {
        headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${filename}"`,
            // Results change as grading progresses — never serve a stale copy.
            'Cache-Control': 'no-store',
        },
    })
}

/** Renders an answer of any question type as a single readable cell. */
function describeAnswer(answer: {
    selectedIndex: number | null
    selectedIndices: string | null
    textAnswer: string | null
}): string {
    if (answer.textAnswer) return answer.textAnswer

    if (answer.selectedIndices) {
        try {
            const indices = JSON.parse(answer.selectedIndices) as number[]
            if (Array.isArray(indices) && indices.length > 0) {
                return `Options ${indices.map(i => i + 1).join(', ')}`
            }
        } catch {
            // fall through to selectedIndex
        }
    }

    if (answer.selectedIndex !== null) return `Option ${answer.selectedIndex + 1}`
    return ''
}
