import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- STARTING QUIZ VISIBILITY TEST ---\n')

    // 1. Create a Faculty
    console.log('Creating Faculty...')
    const faculty = await prisma.user.upsert({
        where: { email: 'test.faculty@example.com' },
        update: {},
        create: {
            email: 'test.faculty@example.com',
            name: 'Test Faculty',
            password: 'password123', // Dummy
            role: 'FACULTY'
        }
    })

    // 2. Create a Subject
    console.log('Creating Subject...')
    const subject = await prisma.subject.upsert({
        where: { code: 'TEST101' },
        update: {},
        create: {
            code: 'TEST101',
            name: 'Test Subject',
            semester: 1,
            department: 'CS',
            isApproved: true
        }
    })

    // 3. Create Quizzes with different targets
    console.log('Creating Quizzes...')

    // Quiz 1: Specific Batch (2024-27) & Section (A)
    const quizSpecific = await prisma.quiz.create({
        data: {
            title: 'Quiz 1: Only 2024-27 Sec A',
            subjectId: subject.id,
            facultyId: faculty.id,
            assignedBatches: ['2024-27'],
            targetSection: 'A',
            isPublished: true,
            timePerQuestion: 30,
            totalQuestions: 1
        }
    })

    // Quiz 2: Specific Batch (2024-27) but ALL Sections
    const quizAllSections = await prisma.quiz.create({
        data: {
            title: 'Quiz 2: 2024-27 All Sections',
            subjectId: subject.id,
            facultyId: faculty.id,
            assignedBatches: ['2024-27'],
            targetSection: null, // All sections
            isPublished: true,
            timePerQuestion: 30,
            totalQuestions: 1
        }
    })

    // Quiz 3: ALL Batches & ALL Sections
    const quizAll = await prisma.quiz.create({
        data: {
            title: 'Quiz 3: Everyone',
            subjectId: subject.id,
            facultyId: faculty.id,
            assignedBatches: [],
            targetSection: null,
            isPublished: true,
            timePerQuestion: 30,
            totalQuestions: 1
        }
    })

    // 4. Create Students
    console.log('Creating Students...')

    const studentA = await prisma.user.create({
        data: {
            email: `studentA.${Date.now()}@test.com`,
            name: 'Student A (2024-27, Sec A)',
            password: 'pass',
            role: 'STUDENT',
            batch: '2024-27',
            section: 'A',
            semester: 1
        }
    })

    const studentB = await prisma.user.create({
        data: {
            email: `studentB.${Date.now()}@test.com`,
            name: 'Student B (2024-27, Sec B)',
            password: 'pass',
            role: 'STUDENT',
            batch: '2024-27',
            section: 'B',
            semester: 1
        }
    })

    const studentC = await prisma.user.create({
        data: {
            email: `studentC.${Date.now()}@test.com`,
            name: 'Student C (2025-28, Sec A)',
            password: 'pass',
            role: 'STUDENT',
            batch: '2025-28',
            section: 'A',
            semester: 1
        }
    })

    // 5. Test Visibility Logic
    async function getVisibleQuizzes(student: any) {
        // Note: For JSON array fields, we need to filter in memory
        // Prisma doesn't support "array contains" for SQLite JSON
        const quizzes = await prisma.quiz.findMany({
            where: {
                isPublished: true,
                OR: [
                    { targetSection: null },
                    { targetSection: student.section }
                ]
            },
            orderBy: { title: 'asc' }
        })
        // Filter by assignedBatches in memory
        return quizzes.filter(q => {
            const batches = (q.assignedBatches as string[] | null) || []
            if (batches.length === 0) return true
            return batches.includes(student.batch)
        })
    }

    console.log('\n--- VERIFICATION RESULTS ---\n')

    // Check Student A
    const quizzesA = await getVisibleQuizzes(studentA)
    console.log(`Student A (${studentA.batch}, Sec ${studentA.section}) sees:`)
    quizzesA.forEach(q => console.log(` - ${q.title}`))
    // Expect: All 3 (Specific, All Sections, Open) - WAIT.
    // Quiz 1: Batch matches, Section matches. YES.
    // Quiz 2: Batch matches, Section is null (All). YES.
    // Quiz 3: Batch null, Section null. YES.

    // Check Student B
    const quizzesB = await getVisibleQuizzes(studentB)
    console.log(`\nStudent B (${studentB.batch}, Sec ${studentB.section}) sees:`)
    quizzesB.forEach(q => console.log(` - ${q.title}`))
    // Expect: Quiz 2 and Quiz 3.
    // Quiz 1: Section 'A' != 'B'. NO.

    // Check Student C
    const quizzesC = await getVisibleQuizzes(studentC)
    console.log(`\nStudent C (${studentC.batch}, Sec ${studentC.section}) sees:`)
    quizzesC.forEach(q => console.log(` - ${q.title}`))
    // Expect: Only Quiz 3.
    // Quiz 1: Batch mismatch. NO.
    // Quiz 2: Batch mismatch. NO.

    console.log('\n--- CLEANUP ---')
    await prisma.quiz.deleteMany({ where: { id: { in: [quizSpecific.id, quizAllSections.id, quizAll.id] } } })
    await prisma.user.deleteMany({ where: { id: { in: [studentA.id, studentB.id, studentC.id] } } })
    console.log('Test data cleaned up.')
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
