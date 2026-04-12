import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function QuizResultsPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect('/')
    }
    const user = session.user

    if (user.role === 'STUDENT') {
        redirect('/')
    }

    const { id } = await params
    const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: {
            subject: true,
            attempts: {
                include: {
                    student: true,
                    answers: true
                },
                orderBy: { startedAt: 'desc' }
            }
        }
    })

    if (!quiz) {
        return <div>Quiz not found</div>
    }

    return (
        <div className="min-h-screen bg-theme p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link href="/faculty/quizzes" className="text-sm text-theme-muted hover:text-theme-primary mb-2 inline-block">
                            ← Back to Quizzes
                        </Link>
                        <h1 className="text-3xl font-bold text-theme-primary">{quiz.title} Results</h1>
                        <p className="text-theme-muted">{quiz.subject.code} - {quiz.subject.name}</p>
                    </div>
                </div>

                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-theme-secondary text-theme-muted text-sm uppercase">
                                <tr>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Roll Number</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Score</th>
                                    <th className="px-6 py-4">Grading Status</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-theme-subtle">
                                {quiz.attempts.map((attempt) => {
                                    // Check if any answer needs grading (pointsAwarded is null)
                                    const needsGrading = attempt.answers.some(a => a.pointsAwarded === null)

                                    return (<tr key={attempt.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-medium text-theme-primary">{attempt.student.name}</td>
                                        <td className="px-6 py-4 text-theme-muted">{attempt.student.rollNumber || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`badge ${attempt.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'
                                                }`}>
                                                {attempt.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-theme-primary font-mono">
                                            {attempt.score} / {attempt.totalPoints}
                                        </td>
                                        <td className="px-6 py-4">
                                            {needsGrading ? (
                                                <span className="text-yellow-500 font-medium flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                                    Pending
                                                </span>
                                            ) : (
                                                <span className="text-green-500 font-medium flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                    Graded
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-theme-muted text-sm">
                                            {new Date(attempt.startedAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                href={`/faculty/quizzes/${id}/grade/${attempt.id}`}
                                                className="btn btn-secondary text-sm"
                                            >
                                                Grade
                                            </Link>
                                        </td>
                                    </tr>
                                    )
                                })}
                                {quiz.attempts.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-theme-muted">
                                            No attempts yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
