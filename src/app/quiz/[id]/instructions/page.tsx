import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import StartQuizButton from './StartQuizButton'

export default async function QuizInstructionsPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'STUDENT') {
        redirect('/login')
    }

    const user = session.user as any
    const { id } = await params

    const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: {
            subject: true, // Added subject include
            faculty: { select: { name: true } },
            _count: { select: { questions: true } }
        }
    })

    if (!quiz || !quiz.isPublished) {
        redirect('/student')
    }

    const existingAttempt = await prisma.quizAttempt.findUnique({
        where: {
            studentId_quizId: {
                studentId: user.id,
                quizId: id
            }
        }
    })

    if (existingAttempt && existingAttempt.status !== 'IN_PROGRESS') {
        redirect('/student')
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <Link href="/student" className="text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] mb-6 block">
                    ← Back
                </Link>

                <div className="card">
                    <div className="text-center mb-8">
                        <h1 className="text-xl font-semibold mb-1">{quiz.title}</h1>
                        <p className="text-sm text-[var(--text-muted)]">{quiz.subject.name} • {quiz.faculty?.name}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-8">
                        <div className="card card-sm text-center">
                            <p className="text-xl font-semibold">{quiz.totalQuestions}</p>
                            <p className="text-xs text-[var(--text-muted)]">Questions</p>
                        </div>
                        <div className="card card-sm text-center">
                            <p className="text-xl font-semibold">{quiz.timePerQuestion}s</p>
                            <p className="text-xs text-[var(--text-muted)]">Each</p>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm text-[var(--text-muted)] mb-8">
                        <p className="flex items-start gap-3">
                            <span className="text-[var(--danger)]">•</span>
                            Timer auto-locks answer when time expires
                        </p>
                        <p className="flex items-start gap-3">
                            <span className="text-[var(--danger)]">•</span>
                            Cannot go back to previous questions
                        </p>
                        <p className="flex items-start gap-3">
                            <span className="text-[var(--danger)]">•</span>
                            Tab switching triggers violation
                        </p>
                        <p className="flex items-start gap-3">
                            <span className="text-[var(--warning)]">•</span>
                            {quiz.enforcementMode === 'STRICT' ? 'First violation auto-submits' : '2nd violation auto-submits'}
                        </p>
                        <p className="flex items-start gap-3">
                            <span className="text-[var(--success)]">•</span>
                            No camera or microphone required
                        </p>
                    </div>

                    <StartQuizButton quizId={quiz.id} existingAttemptId={existingAttempt?.id} />
                </div>
            </div>
        </div>
    )
}
