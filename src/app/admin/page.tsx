import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import { AttemptsChart, SubjectRanking } from '@/components/admin/AdminCharts'
import SemesterSection from '@/components/admin/SemesterSection'

const navigation = [
    { name: 'Overview', href: '/admin' },
    { name: 'Subjects', href: '/admin/subjects' },
    { name: 'Users', href: '/admin/users' },
    { name: 'All Quizzes', href: '/admin/quizzes' },
    { name: 'Settings', href: '/admin/settings' },
]

export default async function AdminDashboard() {
    const session = await getServerSession(authOptions)
    if (!session || (session.user).role !== 'ADMIN') redirect('/login')

    const user = session.user

    // ── Counts ───────────────────────────────────────────────────────────────
    const [subjects, totalQuizzes, totalAttempts, totalViolations, totalStudents] =
        await Promise.all([
            prisma.subject.findMany({
                include: {
                    faculty: { select: { id: true, name: true } },
                    _count: { select: { quizzes: true } },
                },
                orderBy: [{ semester: 'asc' }, { code: 'asc' }],
            }),
            prisma.quiz.count(),
            prisma.quizAttempt.count(),
            prisma.violationLog.count(),
            prisma.user.count({ where: { role: 'STUDENT' } }),
        ])

    // ── 7-day trend ──────────────────────────────────────────────────────────
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const rawAttempts = await prisma.quizAttempt.findMany({
        where: { startedAt: { gte: sevenDaysAgo } },
        select: { startedAt: true },
    })

    const daySlots: { key: string; label: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        daySlots.push({
            key: d.toISOString().split('T')[0],
            label: d.toLocaleDateString('en-US', { weekday: 'short' }),
            count: 0,
        })
    }
    rawAttempts.forEach(a => {
        const key = new Date(a.startedAt).toISOString().split('T')[0]
        const slot = daySlots.find(s => s.key === key)
        if (slot) slot.count++
    })
    const attemptsOverTime = daySlots.map(s => ({ day: s.label, count: s.count }))
    const todayKey = new Date().toISOString().split('T')[0]
    const todayAttempts = daySlots.find(s => s.key === todayKey)?.count ?? 0
    const weekTotal = daySlots.reduce((n, s) => n + s.count, 0)

    // ── Subject ranking ───────────────────────────────────────────────────────
    const quizzesWithCounts = await prisma.quiz.findMany({
        select: {
            subjectId: true,
            subject: { select: { code: true } },
            _count: { select: { attempts: true } },
        },
    })
    const subjectMap = new Map<string, { code: string; count: number }>()
    quizzesWithCounts.forEach(q => {
        const entry = subjectMap.get(q.subjectId) ?? { code: q.subject.code, count: 0 }
        entry.count += q._count.attempts
        subjectMap.set(q.subjectId, entry)
    })
    const subjectActivity = Array.from(subjectMap.values())
        .filter(s => s.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)

    // ── Recent violations ─────────────────────────────────────────────────────
    const recentViolations = await prisma.violationLog.findMany({
        orderBy: { occurredAt: 'desc' },
        take: 6,
        include: {
            attempt: {
                include: {
                    student: { select: { name: true } },
                    quiz: { select: { title: true } },
                },
            },
        },
    })

    // ── Subjects by semester ──────────────────────────────────────────────────
    const bySemester = subjects.reduce((acc: Record<number, typeof subjects>, s) => {
        if (!acc[s.semester]) acc[s.semester] = []
        acc[s.semester].push(s)
        return acc
    }, {})
    const bySemesterForClient = Object.fromEntries(
        Object.entries(bySemester).map(([sem, subjs]) => [
            sem,
            subjs.map(s => ({
                id: s.id, code: s.code, name: s.name,
                quizCount: s._count.quizzes, facultyCount: s.faculty.length,
            })),
        ])
    )

    return (
        <DashboardLayout user={user} navigation={navigation}>
            <div className="space-y-6">

                {/* ── Header ── */}
                <div>
                    <h1 className="text-2xl font-semibold text-theme-primary">Admin Dashboard</h1>
                    <p className="text-theme-muted text-sm">Platform overview and activity</p>
                </div>

                {/* ── Stats row ── */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                        { value: subjects.length, label: 'Subjects' },
                        { value: totalQuizzes,    label: 'Quizzes' },
                        { value: totalStudents,   label: 'Students' },
                        { value: totalAttempts,   label: 'Attempts', sub: todayAttempts > 0 ? `+${todayAttempts} today` : undefined },
                        { value: totalViolations, label: 'Violations', danger: true },
                    ].map(stat => (
                        <div key={stat.label} className="card">
                            <div className="stat">
                                <span className={`stat-value ${stat.danger ? 'text-danger' : ''}`}>
                                    {stat.value}
                                </span>
                                <span className="stat-label">{stat.label}</span>
                                {stat.sub && (
                                    <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
                                        {stat.sub}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Trend chart (full width) ── */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="text-sm font-semibold text-theme-primary">Attempts This Week</h2>
                            <p className="text-xs text-theme-muted mt-0.5">Last 7 days · today highlighted</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold text-theme-primary leading-none">{weekTotal}</p>
                            <p className="text-xs text-theme-muted mt-0.5">total attempts</p>
                        </div>
                    </div>
                    <AttemptsChart data={attemptsOverTime} />
                </div>

                {/* ── Subject ranking + Violations (two columns) ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Subject ranking */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-theme-primary">Attempts by Subject</h2>
                            {subjectActivity.length > 0 && (
                                <span className="text-xs text-theme-muted">
                                    {subjectActivity.length} active
                                </span>
                            )}
                        </div>
                        <SubjectRanking data={subjectActivity} />
                    </div>

                    {/* Recent violations */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-theme-primary">Recent Violations</h2>
                            {totalViolations > 0 && (
                                <span className="badge badge-danger">{totalViolations} total</span>
                            )}
                        </div>
                        {recentViolations.length === 0 ? (
                            <div className="py-6 text-center">
                                <p className="text-theme-muted text-sm">No violations recorded</p>
                            </div>
                        ) : (
                            <div>
                                {recentViolations.map((v, i) => (
                                    <div
                                        key={v.id}
                                        className={`flex items-center justify-between gap-3 py-2.5 ${
                                            i < recentViolations.length - 1 ? 'border-b border-theme' : ''
                                        }`}
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-theme-primary truncate">
                                                {v.attempt.student.name}
                                            </p>
                                            <p className="text-xs text-theme-muted truncate mt-0.5">
                                                {v.attempt.quiz.title}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <span className="badge badge-danger text-xs">{v.type}</span>
                                            <p className="text-xs text-theme-muted mt-1">
                                                {new Date(v.occurredAt).toLocaleDateString('en-US', {
                                                    month: 'short', day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Subjects by semester (collapsible) ── */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-medium text-theme-muted uppercase tracking-wide">
                            All Subjects
                        </h2>
                        <Link href="/admin/subjects" className="text-sm text-accent hover:underline">
                            Manage →
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(bySemesterForClient).map(([sem, subjs], idx) => (
                            <SemesterSection
                                key={sem}
                                semester={Number(sem)}
                                subjects={subjs}
                                defaultOpen={idx === 0}
                            />
                        ))}
                    </div>
                </div>

            </div>
        </DashboardLayout>
    )
}
