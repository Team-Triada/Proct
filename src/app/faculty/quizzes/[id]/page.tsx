import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'

const navigation = [
    { name: 'Overview', href: '/faculty' },
    { name: 'My Quizzes', href: '/faculty/quizzes' },
    { name: 'Create Quiz', href: '/faculty/quizzes/create' },
]

export default async function QuizDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'FACULTY') {
        redirect('/login')
    }

    const user = session.user as any
    const { id } = await params

    const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: {
            subject: true, // Added subject include
            questions: { orderBy: { order: 'asc' } },
            attempts: {
                include: {
                    student: { select: { name: true, rollNumber: true } },
                    violations: true
                },
                orderBy: { startedAt: 'desc' }
            },
            _count: { select: { questions: true, attempts: true } }
        }
    })

    if (!quiz || quiz.facultyId !== user.id) {
        redirect('/faculty/quizzes')
    }

    const completedAttempts = quiz.attempts.filter((a: any) => a.status !== 'IN_PROGRESS')
    const avgScore = completedAttempts.length > 0
        ? completedAttempts.reduce((acc: number, a: any) => acc + (a.score / a.totalPoints * 100), 0) / completedAttempts.length
        : 0

    return (
        <DashboardLayout user={user} navigation={navigation}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-semibold text-theme-primary">{quiz.title}</h1>
                            <span className={`badge ${quiz.isPublished ? 'badge-success' : 'badge-neutral'}`}>
                                {quiz.isPublished ? 'Published' : 'Draft'}
                            </span>
                        </div>
                        <p className="text-theme-muted">{quiz.subject.code} - {quiz.subject.name}</p>
                    </div>
                    <Link href={`/faculty/quizzes/${id}/edit`} className="btn btn-primary">
                        Edit Quiz
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="card">
                        <div className="stat">
                            <span className="stat-value">{quiz._count.questions}</span>
                            <span className="stat-label">Questions</span>
                        </div>
                    </div>
                    <div className="card">
                        <div className="stat">
                            <span className="stat-value">{quiz._count.attempts}</span>
                            <span className="stat-label">Attempts</span>
                        </div>
                    </div>
                    <div className="card">
                        <div className="stat">
                            <span className="stat-value">{avgScore.toFixed(0)}%</span>
                            <span className="stat-label">Avg Score</span>
                        </div>
                    </div>
                    <div className="card">
                        <div className="stat">
                            <span className="stat-value text-danger">
                                {quiz.attempts.reduce((acc: number, a: any) => acc + a.violations.length, 0)}
                            </span>
                            <span className="stat-label">Violations</span>
                        </div>
                    </div>
                </div>

                {/* Student Attempts */}
                <div>
                    <h2 className="text-sm font-medium text-theme-muted uppercase tracking-wide mb-4">
                        Student Attempts
                    </h2>

                    {quiz.attempts.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-theme-muted">No attempts yet</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Student</th>
                                        <th>Roll No</th>
                                        <th>Score</th>
                                        <th>Violations</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quiz.attempts.map((attempt: any) => (
                                        <tr key={attempt.id}>
                                            <td className="font-medium">{attempt.student.name}</td>
                                            <td className="text-theme-muted">{attempt.student.rollNumber}</td>
                                            <td>
                                                {attempt.status !== 'IN_PROGRESS' ? (
                                                    <span className={attempt.score >= attempt.totalPoints * 0.6 ? 'text-success' : 'text-danger'}>
                                                        {attempt.score}/{attempt.totalPoints}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                {attempt.violations.length > 0 ? (
                                                    <span className="badge badge-danger">{attempt.violations.length}</span>
                                                ) : (
                                                    <span className="text-success">0</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge ${attempt.status === 'SUBMITTED' ? 'badge-success' :
                                                    attempt.status === 'AUTO_SUBMITTED' ? 'badge-warning' :
                                                        'badge-neutral'
                                                    }`}>
                                                    {attempt.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="text-theme-muted text-sm">
                                                {new Date(attempt.startedAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}
