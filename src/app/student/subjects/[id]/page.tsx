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

export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user).role !== 'STUDENT') {
        redirect('/login')
    }

    const user = session.user
    const { id } = await params

    // Get student's semester, batch (year), and section (batch number)
    const student = await prisma.user.findUnique({
        where: { id: user.id },
        select: { semester: true, batch: true, section: true }
    })

    if (!student) {
        redirect('/login')
    }

    // Get subject with quizzes
    const subject = await prisma.subject.findUnique({
        where: { id },
        include: {
            quizzes: {
                where: { isPublished: true },
                include: {
                    faculty: { select: { name: true } },
                    _count: { select: { questions: true, attempts: true } }
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    // Security: Only show subjects from student's semester
    if (!subject) {
        redirect('/student')
    }

    // Filter quizzes by assignedBatches (Year) and targetSection (Batch)
    const filteredQuizzes = subject.quizzes.filter(quiz => {
        const yearRestrictions = (quiz.assignedBatches as string[] | null) || []
        const batchRestriction = quiz.targetSection // This is the "Batch" (1-12)

        // Check Year restriction
        const hasYearRestriction = yearRestrictions.length > 0
        let yearMatches = true
        if (hasYearRestriction) {
            if (!student.batch) {
                yearMatches = false
            } else {
                const normalizedStudentBatch = student.batch.trim().toUpperCase()
                const normalizedQuizBatches = yearRestrictions.map(b => b.trim().toUpperCase())
                yearMatches = normalizedQuizBatches.includes(normalizedStudentBatch)
            }
        }

        // Check Section (Batch 1-12) restriction
        let sectionMatches = true
        if (batchRestriction) {
            sectionMatches = student.section === batchRestriction
        }

        // Quiz is visible only if all restrictions are satisfied (or not set)
        return yearMatches && sectionMatches
    })

    // Get student's attempts for this subject's quizzes
    const attempts = await prisma.quizAttempt.findMany({
        where: {
            studentId: user.id,
            quizId: { in: filteredQuizzes.map(q => q.id) }
        },
        include: { quiz: true }
    })

    const attemptMap = new Map(attempts.map(a => [a.quizId, a]))

    return (
        <DashboardLayout user={user} navigation={navigation}>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <Link href="/student" className="text-theme-muted text-sm hover:text-theme-primary mb-2 inline-block">
                        ← Back to subjects
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="badge badge-primary">{subject.code}</span>
                        <span className="badge badge-neutral">Semester {subject.semester}</span>
                    </div>
                    <h1 className="text-2xl font-semibold text-theme-primary">{subject.name}</h1>
                    <p className="text-theme-muted text-sm">{filteredQuizzes.length} quizzes available</p>
                </div>

                {/* Quizzes */}
                {filteredQuizzes.length === 0 ? (
                    <div className="card text-center py-12">
                        <p className="text-theme-muted">No quizzes available for your batch</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredQuizzes.map((quiz) => {
                            const attempt = attemptMap.get(quiz.id)
                            const isCompleted = attempt && attempt.status !== 'IN_PROGRESS'
                            const isInProgress = attempt && attempt.status === 'IN_PROGRESS'

                            return (
                                <div key={quiz.id} className="card">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {isCompleted && (
                                                    <span className="badge badge-success">Completed</span>
                                                )}
                                                {isInProgress && (
                                                    <span className="badge badge-warning">In Progress</span>
                                                )}
                                                {quiz.enforcementMode === 'STRICT' && (
                                                    <span className="badge badge-danger">Strict Mode</span>
                                                )}
                                            </div>
                                            <h3 className="font-medium text-theme-primary">{quiz.title}</h3>
                                            {quiz.description && (
                                                <p className="text-sm text-theme-muted mt-1">{quiz.description}</p>
                                            )}
                                            <div className="flex items-center gap-4 mt-3 text-sm text-theme-muted">
                                                <span>{quiz._count.questions} questions</span>
                                                <span>•</span>
                                                <span>{quiz.timePerQuestion}s per question</span>
                                                <span>•</span>
                                                <span>by {quiz.faculty.name}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {isCompleted ? (
                                                <div>
                                                    <p className="text-2xl font-bold text-accent">{attempt.score}</p>
                                                    <p className="text-xs text-theme-muted">/ {attempt.totalPoints} pts</p>
                                                </div>
                                            ) : (
                                                <Link href={`/quiz/${quiz.id}/instructions`} className="btn btn-primary">
                                                    {isInProgress ? 'Continue' : 'Start Quiz'}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
