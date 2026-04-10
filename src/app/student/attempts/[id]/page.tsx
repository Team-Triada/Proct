import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/DashboardLayout'

export default async function StudentAttemptResultPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    const user = session?.user

    if (!session || user.role !== 'STUDENT') {
        redirect('/login')
    }

    const { id } = await params

    const attempt = await prisma.quizAttempt.findUnique({
        where: { id },
        include: {
            quiz: true,
            answers: {
                include: {
                    question: true
                }
            }
        }
    })

    if (!attempt || attempt.studentId !== user.id) {
        redirect('/student/attempts')
    }

    // Sort answers by question order
    const questionOrder = JSON.parse(attempt.questionOrder) as string[]
    const answersMap = new Map(attempt.answers.map(a => [a.questionId, a]))
    const questions = await prisma.question.findMany({
        where: { quizId: attempt.quizId }
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
    }).filter(item => item.question)

    return (
        <DashboardLayout user={user} navigation={[
            { name: 'Overview', href: '/student' },
            { name: 'My Attempts', href: '/student/attempts' },
        ]}>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold mb-2">{attempt.quiz.title} - Results</h1>
                        <p className="text-theme-muted">
                            Attempted on {new Date(attempt.startedAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto p-4 rounded-xl bg-theme-surface border border-theme-subtle sm:border-none sm:bg-transparent sm:p-0">
                        <div className="text-3xl font-bold text-accent">
                            {attempt.score} <span className="text-lg text-theme-muted font-normal">/ {attempt.totalPoints}</span>
                        </div>
                        <div className={`badge ${attempt.score >= attempt.totalPoints * 0.6 ? 'badge-success' : 'badge-danger'} mt-2`}>
                            {((attempt.score / attempt.totalPoints) * 100).toFixed(0)}% Score
                        </div>
                    </div>
                </div>

                {fullData.map((item: any) => (
                    <div key={item.question.id} className="card p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-medium">Question {item.questionNumber}</h3>
                            <span className="badge badge-neutral">{item.question.points} pts</span>
                        </div>

                        <p className="text-theme-primary mb-6 text-lg">{item.question.text}</p>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-semibold text-theme-muted uppercase tracking-wider mb-2">Your Answer</p>
                                <div className={`p-4 rounded-lg bg-theme-tertiary border ${item.answer?.pointsAwarded === null
                                    ? 'border-warning/30 bg-warning/5'
                                    : item.answer?.isCorrect
                                        ? 'border-success/30 bg-success/5'
                                        : 'border-danger/30 bg-danger/5'
                                    }`}>
                                    {RenderAnswer(item.question, item.answer)}
                                </div>
                            </div>

                            {item.answer?.feedback && (
                                <div className="bg-theme-tertiary p-4 rounded-lg border border-theme-subtle">
                                    <p className="text-xs font-semibold text-theme-muted uppercase tracking-wider mb-1">Feedback</p>
                                    <p className="text-sm">{item.answer.feedback}</p>
                                </div>
                            )}

                            <div className="flex items-center gap-2 mt-2">
                                {item.answer?.pointsAwarded === null ? (
                                    <span className="text-sm font-medium text-warning flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-warning"></span>
                                        Submitted for Evaluation
                                    </span>
                                ) : (
                                    <span className={`text-sm font-medium ${(item.answer?.pointsAwarded && item.answer.pointsAwarded > 0) ? 'text-success' : 'text-danger'}`}>
                                        Awarded: {item.answer?.pointsAwarded ?? 0} / {item.question.points}
                                    </span>
                                )}
                            </div>

                            {item.answer && item.answer.pointsAwarded !== null && item.answer.pointsAwarded < item.question.points && (
                                <div className="mt-4 pt-4 border-t border-theme-subtle">
                                    <p className="text-xs font-semibold text-success uppercase tracking-wider mb-2">Correct Answer</p>
                                    <div className="p-3 rounded-lg bg-success/10 border border-success/30 text-success">
                                        {RenderCorrectAnswer(item.question)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </DashboardLayout >
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RenderAnswer(question: any, answer: any) {
    if (!answer) return <span className="text-theme-muted text-sm italic">Not answered</span>

    if (question.type === 'MULTIPLE_CHOICE' || question.type === 'DROPDOWN') {
        const options = JSON.parse(question.options)
        return <span className="font-medium">{options[answer.selectedIndex] || '-'}</span>
    }

    if (question.type === 'CHECKBOX') {
        const options = JSON.parse(question.options)
        const selected = JSON.parse(answer.selectedIndices || '[]')
        return (
            <div className="flex flex-wrap gap-2">
                {selected.map((idx: number) => (
                    <span key={idx} className="badge badge-neutral border border-theme-subtle">
                        {options[idx]}
                    </span>
                ))}
            </div>
        )
    }

    return <span className="whitespace-pre-wrap font-serif">{answer.textAnswer}</span>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RenderCorrectAnswer(question: any) {
    if (question.type === 'MULTIPLE_CHOICE' || question.type === 'DROPDOWN') {
        const options = JSON.parse(question.options)
        return <span className="font-medium">{options[question.correctIndex]}</span>
    }

    if (question.type === 'CHECKBOX') {
        const options = JSON.parse(question.options)
        const correctIndices = JSON.parse(question.correctIndices || '[]')
        return (
            <div className="flex flex-wrap gap-2">
                {correctIndices.map((idx: number) => (
                    <span key={idx} className="badge badge-success border border-success/30">
                        {options[idx]}
                    </span>
                ))}
            </div>
        )
    }

    return <span className="italic text-sm">Refer to course materials or faculty feedback</span>
}
