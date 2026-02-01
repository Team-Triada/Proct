import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import EditQuizClient from './EditQuizClient'

export default async function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== 'FACULTY') {
        redirect('/login')
    }

    const { id } = await params

    return <EditQuizClient quizId={id} />
}
