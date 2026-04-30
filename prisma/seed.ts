import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🔄 Cleaning database...')
    // Clear existing data in reverse order of dependencies
    await prisma.violationLog.deleteMany()
    await prisma.answer.deleteMany()
    await prisma.quizAttempt.deleteMany()
    await prisma.question.deleteMany()
    await prisma.quiz.deleteMany()
    await prisma.subject.deleteMany()
    await prisma.user.deleteMany()

    console.log('🌱 Seeding database...')

    const hashedPassword = await bcrypt.hash('password123', 10)

    // 1. Create Admin
    const admin = await prisma.user.create({
        data: {
            email: 'admin@college.edu',
            password: hashedPassword,
            name: 'HOD Admin',
            role: 'ADMIN',
            department: 'Computer Science',
        },
    })

    // 2. Create Faculty
    const faculty1 = await prisma.user.create({
        data: {
            email: 'alan.turing@college.edu',
            password: hashedPassword,
            name: 'Prof. Alan Turing',
            role: 'FACULTY',
            department: 'Computer Science',
        },
    })

    const faculty2 = await prisma.user.create({
        data: {
            email: 'ada.lovelace@college.edu',
            password: hashedPassword,
            name: 'Dr. Ada Lovelace',
            role: 'FACULTY',
            department: 'Computer Science',
        },
    })

    // 3. Create Subjects (Connecting Faculty)
    const subject1 = await prisma.subject.create({
        data: {
            name: 'Data Structures & Algorithms',
            code: 'CS201',
            semester: 3,
            department: 'Computer Science',
            isApproved: true,
            faculty: {
                connect: [{ id: faculty1.id }]
            }
        },
    })

    const subject2 = await prisma.subject.create({
        data: {
            name: 'Machine Learning',
            code: 'CS405',
            semester: 7,
            department: 'Computer Science',
            isApproved: true,
            faculty: {
                connect: [{ id: faculty2.id }]
            }
        },
    })

    const subject3 = await prisma.subject.create({
        data: {
            name: 'Cyber Security',
            code: 'CS302',
            semester: 5,
            department: 'Computer Science',
            isApproved: false,
            faculty: {
                connect: [{ id: faculty1.id }]
            }
        },
    })

    // 4. Create Students
    // Student 1: Year 2023-26, Batch 1
    await prisma.user.create({
        data: {
            email: 'student1@yenepoya.edu.in',
            password: hashedPassword,
            name: 'John Doe',
            role: 'STUDENT',
            batch: '2023-26',
            semester: 3,
            section: '1',
            rollNumber: '23BBCCED001',
            campusId: '10001',
        },
    })

    // Student 2: Year 2023-26, Batch 2
    await prisma.user.create({
        data: {
            email: 'student2@yenepoya.edu.in',
            password: hashedPassword,
            name: 'Jane Smith',
            role: 'STUDENT',
            batch: '2023-26',
            semester: 3,
            section: '2',
            rollNumber: '23BBCCED002',
            campusId: '10002',
        },
    })

    // 5. Create a Quiz for DSA
    const quiz1 = await prisma.quiz.create({
        data: {
            title: 'Midterm Assessment: Arrays & Linked Lists',
            description: 'Covers linear data structures, complexity analysis, and implementation details.',
            subjectId: subject1.id,
            facultyId: faculty1.id,
            timePerQuestion: 60,
            totalQuestions: 2,
            isPublished: true,
            assignedBatches: ['2023-26'],
            targetSection: null, // Open to all batches of 2023-26
            timingMode: 'PER_QUESTION',
            enforcementMode: 'STRICT',
            availableFrom: new Date(),
            availableUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            questions: {
                create: [
                    {
                        text: 'What is the time complexity of searching in a sorted array using binary search?',
                        type: 'MULTIPLE_CHOICE',
                        options: JSON.stringify(['O(n)', 'O(log n)', 'O(n^2)', 'O(1)']),
                        correctIndex: 1,
                        points: 2,
                        order: 1,
                    },
                    {
                        text: 'Which of the following data structures follows the LIFO principle?',
                        type: 'MULTIPLE_CHOICE',
                        options: JSON.stringify(['Queue', 'Linked List', 'Stack', 'Tree']),
                        correctIndex: 2,
                        points: 2,
                        order: 2,
                    }
                ]
            }
        },
    })

    console.log('✅ Seed completed successfully!')
    console.log('\n--- CREDENTIALS ---')
    console.log('Admin:   admin@college.edu / password123')
    console.log('Faculty: alan.turing@college.edu / password123')
    console.log('Student: student1@yenepoya.edu.in / password123 (Year 2023-26, Batch 1)')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
