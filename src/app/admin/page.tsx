import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
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

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'ADMIN') {
        redirect('/login')
    }

    const user = session.user as any

    // Get all subjects organized by semester
    const subjects = await prisma.subject.findMany({
        include: {
            faculty: { select: { id: true, name: true } },
            _count: { select: { quizzes: true } }
        },
        orderBy: [{ semester: 'asc' }, { code: 'asc' }]
    })

    // Group by semester
    const bySemester = subjects.reduce((acc: Record<number, typeof subjects>, s) => {
        if (!acc[s.semester]) acc[s.semester] = []
        acc[s.semester].push(s)
        return acc
    }, {})

    // Stats
    const totalUsers = await prisma.user.count()
    const totalQuizzes = await prisma.quiz.count()
    const totalAttempts = await prisma.quizAttempt.count()
    const totalViolations = await prisma.violationLog.count()

    return (
        <DashboardLayout user={user} navigation={navigation}>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-semibold text-theme-primary">Admin Dashboard</h1>
                    <p className="text-theme-muted text-sm">Manage subjects, faculty, and monitor activity</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="card">
                        <div className="stat">
                            <span className="stat-value">{subjects.length}</span>
                            <span className="stat-label">Subjects</span>
                        </div>
                    </div>
                    <div className="card">
                        <div className="stat">
                            <span className="stat-value">{totalQuizzes}</span>
                            <span className="stat-label">Quizzes</span>
                        </div>
                    </div>
                    <div className="card">
                        <div className="stat">
                            <span className="stat-value">{totalAttempts}</span>
                            <span className="stat-label">Attempts</span>
                        </div>
                    </div>
                    <div className="card">
                        <div className="stat">
                            <span className="stat-value text-danger">{totalViolations}</span>
                            <span className="stat-label">Violations</span>
                        </div>
                    </div>
                </div>

                {/* Subjects by Semester */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-medium text-theme-muted uppercase tracking-wide">
                            All Subjects
                        </h2>
                        <Link href="/admin/subjects" className="text-sm text-accent hover:underline">
                            Manage →
                        </Link>
                    </div>

                    <div className="space-y-6">
                        {Object.entries(bySemester).map(([sem, subjs]) => (
                            <div key={sem}>
                                <h3 className="text-sm font-medium text-theme-primary mb-3">
                                    Semester {sem}
                                </h3>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {subjs.map((subject: any) => (
                                        <Link
                                            key={subject.id}
                                            href={`/admin/subjects/${subject.id}`}
                                            className="card card-interactive"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className="badge badge-primary mb-2">{subject.code}</span>
                                                    <h4 className="font-medium text-theme-primary">{subject.name}</h4>
                                                    <p className="text-xs text-theme-muted mt-1">
                                                        {subject._count.quizzes} quizzes • {subject.faculty.length} faculty
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
