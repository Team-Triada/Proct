import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import GradingClient from './GradingClient'

export default async function GradingPage({ params }: { params: Promise<{ id: string; attemptId: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session) {
        redirect('/')
    }
    const user = session.user

    if (user.role === 'STUDENT') {
        redirect('/')
    }

    const { id, attemptId } = await params

    const attempt = await prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        include: {
            quiz: true,
            student: true,
            answers: {
                include: {
                    question: true
                }
            }
        }
    })

    if (!attempt) {
        return <div>Attempt not found</div>
    }

    // Sort answers by question order
    const questionOrder = JSON.parse(attempt.questionOrder) as string[]
    const answersMap = new Map(attempt.answers.map(a => [a.question.id, a]))

    // We also need full question details even if unanswered? 
    // Usually attempts create Answer records only when answered, but let's assume we grade what exists.
    // Ideally we fetch all questions to show unanswered ones too?
    // For now, let's just grade based on answers present.

    // Actually, to display properly in order, we should fetch questions.
    const questions = await prisma.question.findMany({
        where: { quizId: id }
    })
    const questionsMap = new Map(questions.map(q => [q.id, q]))

    const fullData = questionOrder.map((qId, index) => {
        const question = questionsMap.get(qId)
        const answer = answersMap.get(qId)
        return {
            questionNumber: index + 1,
            question,
            answer
        }
    }).filter((item): item is { questionNumber: number; question: NonNullable<typeof item.question>; answer: typeof item.answer } => item.question !== undefined)

    return (
        <GradingClient
            attemptId={attempt.id}
            studentName={attempt.student.name}
            quizTitle={attempt.quiz.title}
            data={fullData}
        />
    )
}
