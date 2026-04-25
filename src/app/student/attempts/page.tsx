import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'

const navigation = [
    { name: 'Overview', href: '/student' },
    { name: 'My Attempts', href: '/student/attempts' },
]

export default async function StudentAttemptsPage() {
    const session = await getServerSession(authOptions)

    if (!session || (session.user).role !== 'STUDENT') {
        redirect('/login')
    }

    const user = session.user

    const attempts = await prisma.quizAttempt.findMany({
        where: { studentId: user.id },
        include: {
            quiz: { select: { title: true, subject: true, showScore: true } }
        },
        orderBy: { startedAt: 'desc' }
    })

    return (
        <DashboardLayout user={user} navigation={navigation}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold mb-1">My Attempts</h1>
                    <p className="text-[var(--text-muted)] text-sm">Your quiz history</p>
                </div>

                {attempts.length === 0 ? (
                    <div className="card text-center py-12">
                        <p className="text-[var(--text-muted)]">No attempts yet</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Quiz</th>
                                    <th>Subject</th>
                                    <th>Score</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attempts.map((attempt) => (
                                    <tr key={attempt.id}>
                                        <td className="font-medium">{attempt.quiz.title}</td>
                                        <td className="text-[var(--text-muted)]">{attempt.quiz.subject.name}</td>
                                        <td>
                                            {attempt.status !== 'IN_PROGRESS' && attempt.quiz.showScore
                                                ? `${attempt.score}/${attempt.totalPoints}`
                                                : '—'}
                                        </td>
                                        <td>
                                            <span className={`badge ${attempt.status === 'COMPLETED' ? 'badge-success' :
                                                attempt.status === 'AUTO_SUBMITTED' ? 'badge-warning' : 'badge-neutral'
                                                }`}>
                                                {attempt.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="text-[var(--text-muted)] text-sm">
                                            {new Date(attempt.startedAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            {attempt.status !== 'IN_PROGRESS' && (
                                                <Link href={`/student/attempts/${attempt.id}`} className="btn btn-ghost btn-sm text-xs">
                                                    View
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
