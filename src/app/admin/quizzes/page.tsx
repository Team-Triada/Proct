import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardLayout from '@/components/DashboardLayout'

const navigation = [
    { name: 'Overview', href: '/admin' },
    { name: 'Subjects', href: '/admin/subjects' },
    { name: 'Users', href: '/admin/users' },
    { name: 'All Quizzes', href: '/admin/quizzes' },
]

export default async function AdminQuizzesPage() {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ADMIN') {
        redirect('/login')
    }

    const user = session.user as any

    const quizzes = await prisma.quiz.findMany({
        include: {
            faculty: { select: { name: true } },
            _count: { select: { questions: true, attempts: true } }
        },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <DashboardLayout user={user} navigation={navigation}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-semibold mb-1">All Quizzes</h1>
                    <p className="text-[var(--text-muted)] text-sm">{quizzes.length} quizzes across all faculty</p>
                </div>

                {quizzes.length === 0 ? (
                    <div className="card text-center py-12">
                        <p className="text-[var(--text-muted)]">No quizzes created yet</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Faculty</th>
                                    <th>Target</th>
                                    <th>Questions</th>
                                    <th>Attempts</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quizzes.map((quiz) => {
                                    const yearBatches = (quiz.assignedBatches as string[] | null) || []
                                    const targetBatch = quiz.targetSection
                                    const hasRestrictions = yearBatches.length > 0 || targetBatch

                                    return (
                                        <tr key={quiz.id}>
                                            <td className="font-medium">{quiz.title}</td>
                                            <td className="text-[var(--text-muted)]">{quiz.faculty.name}</td>
                                            <td>
                                                {hasRestrictions ? (
                                                    <div className="flex flex-col gap-1">
                                                        {yearBatches.length > 0 && (
                                                            <span className="badge badge-neutral text-xs">
                                                                Year: {yearBatches.join(', ')}
                                                            </span>
                                                        )}
                                                        {targetBatch && (
                                                            <span className="badge badge-primary text-xs">
                                                                Batch {targetBatch}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[var(--text-muted)] text-sm">All</span>
                                                )}
                                            </td>
                                            <td>{quiz._count?.questions || 0}</td>
                                            <td>{quiz._count?.attempts || 0}</td>
                                            <td>
                                                <span className={`badge ${quiz.isPublished ? 'badge-success' : 'badge-neutral'}`}>
                                                    {quiz.isPublished ? 'Published' : 'Draft'}
                                                </span>
                                            </td>
                                            <td className="text-[var(--text-muted)] text-sm">
                                                {new Date(quiz.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
