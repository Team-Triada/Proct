import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import DashboardLayout from '@/components/DashboardLayout'

const navigation = [
    { name: 'Overview', href: '/admin' },
    { name: 'Subjects', href: '/admin/subjects' },
    { name: 'Users', href: '/admin/users' },
]

export default async function AdminSettings() {
    const session = await getServerSession(authOptions)

    if (!session || (session.user).role !== 'ADMIN') {
        redirect('/login')
    }

    const user = session.user

    return (
        <DashboardLayout user={user} navigation={navigation}>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-theme-primary">System Settings</h1>
                    <p className="text-theme-muted text-sm">Global system configuration</p>
                </div>

                <div className="card">
                    <h2 className="text-lg font-medium text-theme-primary mb-4">General</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-theme-tertiary rounded-lg">
                            <div>
                                <h3 className="font-medium text-theme-primary">System Status</h3>
                                <p className="text-sm text-theme-muted">Operational</p>
                            </div>
                            <span className="badge badge-success">Online</span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-theme-tertiary rounded-lg">
                            <div>
                                <h3 className="font-medium text-theme-primary">Version</h3>
                                <p className="text-sm text-theme-muted">v0.1.0 Beta</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
