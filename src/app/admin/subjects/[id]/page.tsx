import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import SubjectActionsClient from '@/components/admin/SubjectActionsClient'

const navigation = [
    { name: 'Overview', href: '/admin' },
    { name: 'Subjects', href: '/admin/subjects' },
    { name: 'Users', href: '/admin/users' },
    { name: 'All Quizzes', href: '/admin/quizzes' },
    { name: 'Settings', href: '/admin/settings' },
]

export default async function AdminSubjectDetail({
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

    const subject = await prisma.subject.findUnique({
        where: { id },
        include: {
            faculty: { select: { id: true, name: true, email: true } },
            quizzes: {
                include: {
                    _count: { select: { questions: true, attempts: true } }
                }
            },
            _count: { select: { quizzes: true } }
        }
    })

    if (!subject) {
        notFound()
    }

    return (
        <DashboardLayout user={user} navigation={navigation}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link href="/admin/subjects" className="text-sm text-theme-muted hover:text-theme-primary">
                                ← Back to Subjects
                            </Link>
                        </div>
                        <h1 className="text-2xl font-semibold text-theme-primary flex items-center gap-2">
                            {subject.code} - {subject.name}
                            {subject.isApproved ? (
                                <span className="badge badge-success text-sm">Approved</span>
                            ) : (
                                <span className="badge badge-warning text-sm">Pending</span>
                            )}
                        </h1>
                        <p className="text-theme-muted text-sm">
                            {subject.department} • Semester {subject.semester}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Details & Quizzes */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Quizzes */}
                        <div className="card">
                            <h2 className="text-lg font-semibold text-theme-primary mb-4">Quizzes ({subject.quizzes.length})</h2>
                            {subject.quizzes.length === 0 ? (
                                <p className="text-theme-muted text-sm">No quizzes created yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {subject.quizzes.slice(0, 20).map((quiz) => (
                                        <Link
                                            key={quiz.id}
                                            href={`/faculty/quizzes/${quiz.id}`}
                                            className="p-3 bg-theme-tertiary rounded-lg flex justify-between items-center hover:bg-theme-subtle transition-colors"
                                        >
                                            <div className="min-w-0">
                                                <h3 className="font-medium text-theme-primary truncate">{quiz.title}</h3>
                                                <p className="text-xs text-theme-muted">
                                                    {quiz.totalQuestions} qs • {quiz._count.attempts} attempts
                                                </p>
                                            </div>
                                            <span className={`badge shrink-0 ml-3 ${quiz.isPublished ? 'badge-success' : 'badge-neutral'}`}>
                                                {quiz.isPublished ? 'Live' : 'Draft'}
                                            </span>
                                        </Link>
                                    ))}
                                    {subject.quizzes.length > 20 && (
                                        <p className="text-xs text-theme-muted text-center pt-1">
                                            +{subject.quizzes.length - 20} more —{' '}
                                            <Link href="/admin/quizzes" className="text-accent hover:underline">
                                                view all in quizzes page
                                            </Link>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Actions & Faculty */}
                    <div className="space-y-6">
                        {/* Actions */}
                        <SubjectActionsClient subject={{ id: subject.id }} isApproved={subject.isApproved} />

                        {/* Faculty */}
                        <div className="card">
                            <h3 className="font-medium text-theme-primary mb-3">Assigned Faculty</h3>
                            {subject.faculty.length === 0 ? (
                                <p className="text-theme-muted text-sm">No faculty assigned.</p>
                            ) : (
                                <div className="space-y-2">
                                    {subject.faculty.map(f => (
                                        <div key={f.id} className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-theme-subtle flex items-center justify-center text-xs font-bold">
                                                {f.name[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-theme-primary">{f.name}</p>
                                                <p className="text-xs text-theme-muted">{f.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
