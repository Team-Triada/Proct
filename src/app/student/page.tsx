import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'

const navigation = [
    { name: 'Overview', href: '/student' },
    { name: 'My Attempts', href: '/student/attempts' },
]

export default async function StudentDashboard() {
    const session = await getServerSession(authOptions)

    if (!session || (session.user).role !== 'STUDENT') {
        redirect('/login')
    }

    const user = session.user

    // Get student's semester, batch (year), and section (batch number)
    const student = await prisma.user.findUnique({
        where: { id: user.id },
        select: { semester: true, batch: true, section: true }
    })

    const semester = student?.semester || 1
    const studentBatch = student?.batch || null
    const studentSection = student?.section || null


    // Get subjects - fetch all published quizzes, filter in memory
    const rawSubjects = await prisma.subject.findMany({
        // where: { semester }, // Removed semester filtering
        include: {
            quizzes: {
                where: {
                    isPublished: true,
                },
                include: {
                    faculty: { select: { name: true } },
                    _count: { select: { questions: true } }
                }
            },
            _count: { select: { quizzes: true } }
        },
        orderBy: { code: 'asc' }
    })

    // Filter quizzes by assignedBatches (Year) and targetSection (Batch) in memory
    const subjects = rawSubjects.map(subject => ({
        ...subject,
        quizzes: subject.quizzes.filter(quiz => {
            const yearRestrictions = (quiz.assignedBatches as string[] | null) || []
            const batchRestriction = quiz.targetSection // This is the "Batch" (1-12)

            // Check Year restriction
            const hasYearRestriction = yearRestrictions.length > 0
            let yearMatches = true
            if (hasYearRestriction) {
                if (!studentBatch) {
                    yearMatches = false
                } else {
                    const normalizedStudentBatch = studentBatch.trim().toUpperCase()
                    const normalizedQuizBatches = yearRestrictions.map(b => b.trim().toUpperCase())
                    yearMatches = normalizedQuizBatches.includes(normalizedStudentBatch)
                }
            }

            // Check Section (Batch 1-12) restriction
            let sectionMatches = true
            if (batchRestriction) {
                sectionMatches = studentSection === batchRestriction
            }

            // Quiz is visible only if all restrictions are satisfied (or not set)
            return yearMatches && sectionMatches
        })
    }))

    // Get student's attempts
    const attempts = await prisma.quizAttempt.findMany({
        where: { studentId: user.id },
        include: { quiz: true }
    })

    const completedAttempts = attempts.filter(a => a.status !== 'IN_PROGRESS')
    const attemptedQuizIds = attempts.map(a => a.quizId)

    // Stats
    const stats = {
        totalSubjects: subjects.length,
        totalQuizzes: subjects.reduce((acc, s) => acc + s.quizzes.length, 0),
        completed: completedAttempts.length,
        available: subjects.reduce((acc, s) =>
            acc + s.quizzes.filter(q => !attemptedQuizIds.includes(q.id)).length, 0
        )
    }

    return (
        <DashboardLayout user={user} navigation={navigation}>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-semibold text-theme-primary">
                        Welcome back, {user.name.split(' ')[0]}
                    </h1>
                    <p className="text-theme-muted text-sm">
                        Semester {semester} • {stats.totalSubjects} subjects • {stats.available} quizzes available
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="card">
                        <div className="stat">
                            <span className="stat-value">{stats.totalSubjects}</span>
                            <span className="stat-label">Subjects</span>
                        </div>
                    </div>
                    <div className="card">
                        <div className="stat">
                            <span className="stat-value">{stats.totalQuizzes}</span>
                            <span className="stat-label">Total Quizzes</span>
                        </div>
                    </div>
                    <div className="card">
                        <div className="stat">
                            <span className="stat-value">{stats.completed}</span>
                            <span className="stat-label">Completed</span>
                        </div>
                    </div>
                    <div className="card">
                        <div className="stat">
                            <span className="stat-value text-accent">{stats.available}</span>
                            <span className="stat-label">Available</span>
                        </div>
                    </div>
                </div>

                {/* Subjects Grid */}
                <div>
                    <h2 className="text-sm font-medium text-theme-muted uppercase tracking-wide mb-4">
                        Your Subjects
                    </h2>

                    {subjects.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-theme-muted">No subjects found for Semester {semester}</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {subjects.map((subject) => {
                                const availableQuizzes = subject.quizzes.filter(q => !attemptedQuizIds.includes(q.id))

                                return (
                                    <Link
                                        key={subject.id}
                                        href={`/student/subjects/${subject.id}`}
                                        className="card card-interactive"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="badge badge-primary">{subject.code}</span>
                                                    {availableQuizzes.length > 0 && (
                                                        <span className="badge badge-success">
                                                            {availableQuizzes.length} new
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-medium text-theme-primary">{subject.name}</h3>
                                                <p className="text-sm text-theme-muted mt-1">
                                                    {subject.quizzes.length} quiz{subject.quizzes.length !== 1 ? 'zes' : ''}
                                                </p>
                                            </div>
                                            <svg className="w-5 h-5 text-theme-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Recent Quizzes */}
                {subjects.some(s => s.quizzes.length > 0) && (
                    <div>
                        <h2 className="text-sm font-medium text-theme-muted uppercase tracking-wide mb-4">
                            Available Quizzes
                        </h2>
                        <div className="space-y-3">
                            {subjects.flatMap(subject =>
                                subject.quizzes
                                    .filter(q => !attemptedQuizIds.includes(q.id))
                                    .map(quiz => (
                                        <Link
                                            key={quiz.id}
                                            href={`/quiz/${quiz.id}/instructions`}
                                            className="card card-interactive flex items-center justify-between"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="badge badge-neutral">{subject.code}</span>
                                                    {quiz.enforcementMode === 'STRICT' && (
                                                        <span className="badge badge-danger">Strict</span>
                                                    )}
                                                </div>
                                                <h3 className="font-medium text-theme-primary">{quiz.title}</h3>
                                                <p className="text-sm text-theme-muted">
                                                    {quiz._count.questions} questions • {quiz.timePerQuestion}s each • by {quiz.faculty.name}
                                                </p>
                                            </div>
                                            <span className="btn btn-primary text-sm">Start</span>
                                        </Link>
                                    ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
