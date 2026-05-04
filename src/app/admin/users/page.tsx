import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import DashboardLayout from '@/components/DashboardLayout'
import UserManagement from '@/components/admin/UserManagement'

const navigation = [
    { name: 'Overview', href: '/admin' },
    { name: 'Subjects', href: '/admin/subjects' },
    { name: 'Users', href: '/admin/users' },
    { name: 'All Quizzes', href: '/admin/quizzes' },
    { name: 'Settings', href: '/admin/settings' },
]

export default async function AdminUsersPage() {
    const session = await getServerSession(authOptions)

    if (!session || (session.user).role !== 'ADMIN') {
        redirect('/login')
    }

    const user = session.user

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            semester: true,
            batch: true,
            section: true,
            rollNumber: true,
        },
        orderBy: [{ role: 'asc' }, { name: 'asc' }]
    })

    return (
        <DashboardLayout user={user} navigation={navigation}>
            <UserManagement initialUsers={users} />
        </DashboardLayout>
    )
}
