import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // Clear existing data
    await prisma.violationLog.deleteMany()
    await prisma.answer.deleteMany()
    await prisma.quizAttempt.deleteMany()
    await prisma.question.deleteMany()
    await prisma.quiz.deleteMany()
    await prisma.subject.deleteMany()
    await prisma.user.deleteMany()

    const hashedPassword = await bcrypt.hash('admin123', 10)

    // Admin
    await prisma.user.create({
        data: {
            email: 'admin@college.edu',
            password: hashedPassword,
            name: 'HOD Admin',
            role: 'ADMIN',
            department: 'Computer Science',
        },
    })

    console.log('✅ Seed completed!')
    console.log('')
    console.log('👤 Admin user created:')
    console.log('   Email: admin@college.edu')
    console.log('   Password: admin123')
    console.log('')
    console.log('ℹ️  Faculty, students, subjects, and quizzes can be created through the application.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
