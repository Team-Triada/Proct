import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardLayout from '@/components/DashboardLayout'
import Link from 'next/link'
import AdminQuizzesSearch from './AdminQuizzesSearch'

const navigation = [
    { name: 'Overview', href: '/admin' },
    { name: 'Subjects', href: '/admin/subjects' },
    { name: 'Users', href: '/admin/users' },
    { name: 'All Quizzes', href: '/admin/quizzes' },
    { name: 'Settings', href: '/admin/settings' },
]

const PAGE_SIZE = 25

export default async function AdminQuizzesPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; page?: string; status?: string }>
}) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user).role !== 'ADMIN') {
        redirect('/login')
    }

    const user = session.user
    const { q = '', page = '1', status = '' } = await searchParams
    const currentPage = Math.max(1, parseInt(page, 10) || 1)
    const search = q.trim()

    const where = {
        ...(search && {
            OR: [
                { title: { contains: search } },
                { faculty: { name: { contains: search } } },
            ],
        }),
        ...(status === 'published' && { isPublished: true }),
        ...(status === 'draft' && { isPublished: false }),
    }

    const [quizzes, total] = await Promise.all([
        prisma.quiz.findMany({
            where,
            include: {
                faculty: { select: { name: true } },
                subject: { select: { code: true, name: true } },
                _count: { select: { questions: true, attempts: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip: (currentPage - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
        }),
        prisma.quiz.count({ where }),
    ])

    const totalPages = Math.ceil(total / PAGE_SIZE)

    const buildHref = (p: number, newQ?: string, newStatus?: string) => {
        const params = new URLSearchParams()
        const qVal = newQ !== undefined ? newQ : search
        const sVal = newStatus !== undefined ? newStatus : status
        if (qVal) params.set('q', qVal)
        if (sVal) params.set('status', sVal)
        if (p > 1) params.set('page', String(p))
        const qs = params.toString()
        return `/admin/quizzes${qs ? `?${qs}` : ''}`
    }

    return (
        <DashboardLayout user={user} navigation={navigation}>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-semibold text-theme-primary">All Quizzes</h1>
                        <p className="text-theme-muted text-sm">
                            {total} quiz{total !== 1 ? 'zes' : ''} total
                            {search && ` · "${search}"`}
                        </p>
                    </div>
                </div>

                {/* Search + Filter bar (client component) */}
                <AdminQuizzesSearch defaultQ={search} defaultStatus={status} />

                {/* Status filter pills */}
                <div className="flex gap-2 flex-wrap">
                    {[
                        { label: 'All', val: '' },
                        { label: 'Published', val: 'published' },
                        { label: 'Draft', val: 'draft' },
                    ].map(f => (
                        <Link
                            key={f.val}
                            href={buildHref(1, search, f.val)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                status === f.val
                                    ? 'bg-accent text-white border-accent'
                                    : 'border-theme text-theme-muted hover:border-accent hover:text-accent'
                            }`}
                        >
                            {f.label}
                        </Link>
                    ))}
                </div>

                {/* Table */}
                {quizzes.length === 0 ? (
                    <div className="card text-center py-12">
                        <p className="text-theme-muted">
                            {search || status ? 'No quizzes match your filters' : 'No quizzes created yet'}
                        </p>
                        {(search || status) && (
                            <Link href="/admin/quizzes" className="text-accent text-sm mt-2 inline-block hover:underline">
                                Clear filters
                            </Link>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Subject</th>
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
                                                <td className="font-medium max-w-[180px]">
                                                    <span className="truncate block" title={quiz.title}>
                                                        {quiz.title}
                                                    </span>
                                                </td>
                                                <td className="text-theme-muted text-sm">
                                                    <span className="badge badge-primary">{quiz.subject.code}</span>
                                                </td>
                                                <td className="text-theme-muted">{quiz.faculty.name}</td>
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
                                                        <span className="text-theme-muted text-sm">All</span>
                                                    )}
                                                </td>
                                                <td>{quiz._count?.questions || 0}</td>
                                                <td>{quiz._count?.attempts || 0}</td>
                                                <td>
                                                    <span className={`badge ${quiz.isPublished ? 'badge-success' : 'badge-neutral'}`}>
                                                        {quiz.isPublished ? 'Published' : 'Draft'}
                                                    </span>
                                                </td>
                                                <td className="text-theme-muted text-sm whitespace-nowrap">
                                                    {new Date(quiz.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between gap-4 pt-2">
                                <p className="text-sm text-theme-muted">
                                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)} of {total}
                                </p>
                                <div className="flex gap-2">
                                    {currentPage > 1 && (
                                        <Link href={buildHref(currentPage - 1)} className="btn btn-ghost text-sm">
                                            ← Prev
                                        </Link>
                                    )}
                                    <span className="flex items-center px-3 text-sm text-theme-muted">
                                        Page {currentPage} / {totalPages}
                                    </span>
                                    {currentPage < totalPages && (
                                        <Link href={buildHref(currentPage + 1)} className="btn btn-ghost text-sm">
                                            Next →
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}
