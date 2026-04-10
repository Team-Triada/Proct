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

export default async function FacultyQuizzesPage() {
    const session = await getServerSession(authOptions)

    if (!session || (session.user).role !== 'FACULTY') {
        redirect('/login')
    }

    const user = session.user

    const quizzes = await prisma.quiz.findMany({
        where: { facultyId: user.id },
        include: {
            subject: true,
            _count: { select: { questions: true, attempts: true } }
        },
        orderBy: { createdAt: 'desc' }
    })

    // Group by subject
    const bySubject = quizzes.reduce((acc: Record<string, typeof quizzes>, q) => {
        const key = q.subject.code
        if (!acc[key]) acc[key] = []
        acc[key].push(q)
        return acc
    }, {})

    return (
        <DashboardLayout user={user} navigation={navigation}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-theme-primary">My Quizzes</h1>
                        <p className="text-theme-muted text-sm">{quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}</p>
                    </div>
                    <Link href="/faculty/quizzes/create" className="btn btn-primary">
                        + New Quiz
                    </Link>
                </div>

                {/* Quiz List */}
                {quizzes.length === 0 ? (
                    <div className="card text-center py-16">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-theme-tertiary flex items-center justify-center">
                            <svg className="w-8 h-8 text-theme-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-theme-muted mb-4">No quizzes created yet</p>
                        <Link href="/faculty/quizzes/create" className="btn btn-primary">
                            Create Your First Quiz
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(bySubject).map(([code, subjectQuizzes]) => (
                            <div key={code}>
                                <h2 className="text-sm font-medium text-theme-muted uppercase tracking-wide mb-3 flex items-center gap-2">
                                    <span className="badge badge-primary">{code}</span>
                                    {subjectQuizzes[0]?.subject.name}
                                </h2>
                                <div className="space-y-3">
                                    {subjectQuizzes.map((quiz: any) => {
                                        const yearBatches = (quiz.assignedBatches as string[] | null) || []
                                        const targetBatch = quiz.targetSection

                                        return (
                                            <div key={quiz.id} className="card card-interactive group">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <h3 className="font-medium text-theme-primary truncate">{quiz.title}</h3>
                                                            <span className={`badge ${quiz.isPublished ? 'badge-success' : 'badge-neutral'}`}>
                                                                {quiz.isPublished ? 'Published' : 'Draft'}
                                                            </span>
                                                            {quiz.enforcementMode === 'STRICT' && (
                                                                <span className="badge badge-danger">Strict</span>
                                                            )}
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
                                                        <div className="flex items-center gap-4 text-sm text-theme-muted">
                                                            <span>{quiz._count.questions} questions</span>
                                                            <span>•</span>
                                                            <span>{quiz._count.attempts} attempts</span>
                                                            <span>•</span>
                                                            <span>{quiz.timePerQuestion}s/question</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link
                                                            href={`/faculty/quizzes/${quiz.id}`}
                                                            className="btn btn-ghost text-sm"
                                                        >
                                                            View
                                                        </Link>
                                                        <Link
                                                            href={`/faculty/quizzes/${quiz.id}/edit`}
                                                            className="btn btn-secondary text-sm"
                                                        >
                                                            Edit
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
