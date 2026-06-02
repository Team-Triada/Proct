import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import ResultsClient, { type AttemptRow, type QuizMeta } from './ResultsClient'

export default async function QuizResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session) redirect('/')

    const user = session.user
    if (user.role === 'STUDENT') redirect('/')

    const { id } = await params

    const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: {
            subject: { select: { code: true, name: true } },
            attempts: {
                include: {
                    student: { select: { name: true, email: true, rollNumber: true } },
                    answers: { select: { pointsAwarded: true } },
                    violations: {
                        select: { id: true, type: true, description: true, occurredAt: true },
                        orderBy: { occurredAt: 'asc' },
                    },
                },
                orderBy: { startedAt: 'desc' },
            },
        },
    })

    if (!quiz) return <div className="p-8 text-theme-muted">Quiz not found</div>

    const quizMeta: QuizMeta = {
        id: quiz.id,
        title: quiz.title,
        subjectCode: quiz.subject.code,
        subjectName: quiz.subject.name,
    }

    const attempts: AttemptRow[] = quiz.attempts.map(a => ({
        id: a.id,
        status: a.status,
        score: a.score,
        totalPoints: a.totalPoints,
        startedAt: a.startedAt.toISOString(),
        violationCount: a.violationCount,
        student: {
            name: a.student.name,
            email: a.student.email,
            rollNumber: a.student.rollNumber ?? null,
        },
        violations: a.violations.map(v => ({
            id: v.id,
            type: v.type,
            description: v.description ?? null,
            occurredAt: v.occurredAt.toISOString(),
        })),
        needsGrading: a.answers.some(ans => ans.pointsAwarded === null),
    }))

    return <ResultsClient quiz={quizMeta} attempts={attempts} quizId={id} />
}
