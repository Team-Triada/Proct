
import { prisma } from '@/lib/db'

async function debugQuiz() {
    const id = 'cml1t1k5w0001uxtp3xz733c4'
    const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: { subject: true }
    })
    console.log('Quiz:', JSON.stringify(quiz, null, 2))

    const students = await prisma.user.findMany({
        where: { role: 'STUDENT' }
    })
    console.log('Students:', JSON.stringify(students, null, 2))
}

debugQuiz()
