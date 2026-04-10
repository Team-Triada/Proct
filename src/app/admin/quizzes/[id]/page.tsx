import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'

const navigation = [
    { name: 'Overview', href: '/admin' },
    { name: 'Subjects', href: '/admin/subjects' },
    { name: 'Users', href: '/admin/users' },
    { name: 'All Quizzes', href: '/admin/quizzes' },
]

export default async function AdminQuizDetail({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user).role !== 'ADMIN') {
        redirect('/login')
    }

    const { id } = await params
    const user = session.user

    const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: {
            subject: true,
            faculty: { select: { name: true, email: true } },
            questions: { orderBy: { order: 'asc' } },
            _count: { select: { attempts: true } }
        }
    })

    if (!quiz) {
        notFound()
    }

    return (
        <DashboardLayout user={user} navigation={navigation}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link href="/admin/quizzes" className="text-sm text-theme-muted hover:text-theme-primary">
                                ← Back to Quizzes
                            </Link>
                        </div>
                        <h1 className="text-2xl font-semibold text-theme-primary mb-1">
                            {quiz.title}
                        </h1>
                        <p className="text-theme-muted text-sm flex items-center gap-2">
                            Subject: <Link href={`/admin/subjects/${quiz.subjectId}`} className="hover:underline text-accent">{quiz.subject.name}</Link>
                            • By: {quiz.faculty.name}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <span className={`badge ${quiz.isPublished ? 'badge-success' : 'badge-neutral'}`}>
                            {quiz.isPublished ? 'Published' : 'Draft'}
                        </span>
                        <button disabled className="btn btn-danger btn-sm opacity-50">Delete Quiz</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Questions */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="font-semibold text-theme-primary">Questions ({quiz.questions.length})</h2>
                        <div className="space-y-4">
                            {quiz.questions.map((q, i) => (
                                <div key={q.id} className="card">
                                    <div className="flex items-start gap-3">
                                        <span className="badge badge-neutral text-xs">Q{i + 1}</span>
                                        <div className="flex-1">
                                            <p className="font-medium text-theme-primary mb-2">{q.text}</p>
                                            <div className="space-y-1 pl-2 border-l-2 border-theme-subtle">
                                                {JSON.parse(q.options as string).map((opt: string, idx: number) => (
                                                    <div key={idx} className={`text-sm ${idx === q.correctIndex ? 'text-success font-medium' : 'text-theme-muted'}`}>
                                                        {idx === q.correctIndex ? '✓ ' : '• '}{opt}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Stats / Info */}
                    <div className="space-y-6">
                        <div className="card">
                            <h3 className="font-medium text-theme-primary mb-3">Details</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-theme-muted">Time Limit</span>
                                    <span className="text-theme-primary">{quiz.timePerQuestion}s / q</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-theme-muted">Attempts</span>
                                    <span className="text-theme-primary">{quiz._count.attempts}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-theme-muted">Created</span>
                                    <span className="text-theme-primary">{new Date(quiz.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-theme-muted">Assigned Years</span>
                                    {/* @ts-expect-error */}
                                    <span className="text-theme-primary text-right">{quiz.assignedBatches ? JSON.stringify(quiz.assignedBatches) : 'All Years'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
