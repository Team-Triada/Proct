import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import SubjectActions from '@/components/SubjectActions'

const navigation = [
    { name: 'Overview', href: '/admin' },
    { name: 'Subjects', href: '/admin/subjects' },
    { name: 'Users', href: '/admin/users' },
    { name: 'All Quizzes', href: '/admin/quizzes' },
]

export default async function AdminSubjectsPage() {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ADMIN') {
        redirect('/login')
    }

    const user = session.user as any

    const subjects = await prisma.subject.findMany({
        include: {
            faculty: { select: { id: true, name: true, email: true } },
            quizzes: {
                include: {
                    faculty: { select: { name: true } },
                    _count: { select: { attempts: true } }
                }
            },
            _count: { select: { quizzes: true } }
        },
        orderBy: [{ semester: 'asc' }, { code: 'asc' }]
    })

    // Filter pending and approved subjects
    const pendingSubjects = subjects.filter((s: any) => s.isApproved === false)
    const approvedSubjects = subjects.filter((s: any) => s.isApproved !== false)

    // Group approved by semester
    const bySemester = approvedSubjects.reduce((acc: Record<number, typeof subjects>, s) => {
        if (!acc[s.semester]) acc[s.semester] = []
        acc[s.semester].push(s)
        return acc
    }, {})

    return (
        <DashboardLayout user={user} navigation={navigation}>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-semibold text-theme-primary">All Subjects</h1>
                    <p className="text-theme-muted text-sm">{subjects.length} subjects across all semesters</p>
                </div>

                {/* Pending Subjects */}
                {pendingSubjects.length > 0 && (
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-6">
                        <h2 className="text-lg font-bold text-warning mb-4 flex items-center gap-2">
                            <span>⚠️</span> Pending Approval ({pendingSubjects.length})
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {pendingSubjects.map((subject: any) => (
                                <div key={subject.id} className="card bg-theme-surface border-warning/30">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="badge badge-neutral mb-2">{subject.code}</span>
                                            <h3 className="font-medium text-theme-primary">{subject.name}</h3>
                                            <p className="text-xs text-theme-muted">Semester {subject.semester} • {subject.department}</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-theme-subtle">
                                        <div className="text-xs text-theme-muted">
                                            Req. by: {subject.faculty[0]?.name || 'Unknown'}
                                        </div>
                                        <SubjectActions id={subject.id} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Approved Subjects */}
                <div className="space-y-8">
                    {Object.entries(bySemester).map(([sem, subjs]) => (
                        <div key={sem}>
                            <h2 className="text-lg font-medium text-theme-primary mb-4 flex items-center gap-3">
                                <span className="badge badge-primary">Semester {sem}</span>
                                <span className="text-sm text-theme-muted font-normal">
                                    {subjs.length} subjects
                                </span>
                            </h2>

                            <div className="space-y-4">
                                {subjs.map((subject: any) => (
                                    <div key={subject.id} className="card">
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Link href={`/admin/subjects/${subject.id}`} className="hover:underline">
                                                        <span className="font-mono font-medium text-accent">{subject.code}</span>
                                                        <span className="text-theme-muted mx-2">•</span>
                                                        <span className="font-medium text-theme-primary">{subject.name}</span>
                                                    </Link>
                                                    {!subject.isApproved && <span className="badge badge-warning">Pending</span>}
                                                </div>
                                                <p className="text-sm text-theme-muted">
                                                    {subject._count.quizzes} quizzes • {subject.faculty.length} faculty assigned
                                                </p>
                                            </div>
                                            <Link href={`/admin/subjects/${subject.id}`} className="btn btn-ghost btn-sm">
                                                Manage
                                            </Link>
                                        </div>

                                        {/* Faculty */}
                                        <div className="mb-4">
                                            <p className="text-xs text-theme-muted uppercase tracking-wide mb-2">Faculty</p>
                                            <div className="flex flex-wrap gap-2">
                                                {subject.faculty.length === 0 ? (
                                                    <span className="text-sm text-theme-muted italic">No faculty assigned</span>
                                                ) : (
                                                    subject.faculty.map((f: any) => (
                                                        <span key={f.id} className="badge badge-neutral">
                                                            {f.name}
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        {/* Quizzes */}
                                        {subject.quizzes.length > 0 && (
                                            <div className="pt-4 border-t border-theme-subtle">
                                                <p className="text-xs text-theme-muted uppercase tracking-wide mb-2">Quizzes</p>
                                                <div className="space-y-2">
                                                    {subject.quizzes.map((quiz: any) => (
                                                        <div key={quiz.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-sm text-theme-primary">{quiz.title}</span>
                                                                    <span className={`badge text-xs ${quiz.isPublished ? 'badge-success' : 'badge-neutral'}`}>
                                                                        {quiz.isPublished ? 'Live' : 'Draft'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-theme-muted">
                                                                    by {quiz.faculty.name} • {quiz._count.attempts} attempts
                                                                </p>
                                                            </div>
                                                            <Link
                                                                href={`/admin/quizzes/${quiz.id}`}
                                                                className="btn btn-ghost text-xs"
                                                            >
                                                                View
                                                            </Link>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    )
}
