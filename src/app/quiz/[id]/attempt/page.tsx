import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import QuizAttemptClient from './QuizAttemptClient'

export default async function QuizAttemptPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user).role !== 'STUDENT') {
        redirect('/login')
    }

    const { id } = await params

    return <QuizAttemptClient quizId={id} />
}
