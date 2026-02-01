import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('=== SETTING UP DEMO USERS & VERIFYING ===\n')

    const studentPass = await bcrypt.hash('student123', 10)
    const facultyPass = await bcrypt.hash('faculty123', 10)

    // 1. Create Faculty
    const faculty = await prisma.user.upsert({
        where: { email: 'demo.faculty@college.edu' },
        update: {},
        create: {
            email: 'demo.faculty@college.edu',
            password: facultyPass,
            name: 'Demo Faculty',
            role: 'FACULTY',
            department: 'Computer Science'
        }
    })

    // 2. Create Subject (Approved)
    const subject = await prisma.subject.upsert({
        where: { code: 'DEMO101' },
        update: {},
        create: {
            code: 'DEMO101',
            name: 'Demo Subject',
            semester: 1, // Doesn't perfectly match all sems but used for linking
            isApproved: true,
            faculty: { connect: { id: faculty.id } }
        }
    })

    // 3. Create Students (One for each Batch)
    const students = [
        { name: 'Student Sem1', email: 'student.sem1@college.edu', sem: 1, batch: '2025-28', section: '1' },
        { name: 'Student Sem3', email: 'student.sem3@college.edu', sem: 3, batch: '2024-27', section: '1' },
        { name: 'Student Sem5', email: 'student.sem5@college.edu', sem: 5, batch: '2023-26', section: '1' },
        { name: 'Student Section2', email: 'student.sec2@college.edu', sem: 1, batch: '2025-28', section: '2' },
    ]

    for (const s of students) {
        await prisma.user.upsert({
            where: { email: s.email },
            update: { semester: s.sem, batch: s.batch, section: s.section },
            create: {
                email: s.email,
                password: studentPass,
                name: s.name,
                role: 'STUDENT',
                department: 'Computer Science',
                semester: s.sem,
                batch: s.batch,
                section: s.section
            }
        })
    }

    // 4. Create Quizzes targeting different Batches
    // Note: To bypass backend "Semester Check" (Student.Sem == Quiz.Subject.Sem), 
    // we strictly need subjects for each semester if we want perfect simulation.
    // For this demo, we'll create separate subjects for each sem.

    // Helper to create subject & quiz
    const createQuizForInfo = async (sem: number, batch: string, title: string) => {
        const sub = await prisma.subject.upsert({
            where: { code: `DEMO_S${sem}` },
            update: {},
            create: {
                code: `DEMO_S${sem}`,
                name: `Subject Sem ${sem}`,
                semester: sem,
                isApproved: true,
                faculty: { connect: { id: faculty.id } }
            }
        })

        return prisma.quiz.create({
            data: {
                title,
                timePerQuestion: 30,
                subjectId: sub.id,
                facultyId: faculty.id,
                assignedBatches: [batch],
                isPublished: true,
                questions: { create: { text: 'Q1', options: '[]', correctIndex: 0 } }
            }
        })
    }

    // Clean old demo quizzes
    await prisma.quiz.deleteMany({ where: { title: { startsWith: 'Demo Quiz' } } })

    const quizSem1 = await createQuizForInfo(1, '2025-28', 'Demo Quiz Sem1 (Batch 2025-28)')
    const quizSem3 = await createQuizForInfo(3, '2024-27', 'Demo Quiz Sem3 (Batch 2024-27)')
    const quizSem5 = await createQuizForInfo(5, '2023-26', 'Demo Quiz Sem5 (Batch 2023-26)')

    // 5. Check Visibility
    console.log('--- VISIBILITY CHECK ---')
    const allStudents = await prisma.user.findMany({ where: { email: { contains: 'student.' } } })

    // Simulate Backend Logic
    const canSee = (student: any, quiz: any, subjectSem: number) => {
        if (student.semester !== subjectSem) return false
        if (quiz.targetBatch && quiz.targetBatch !== student.batch) return false
        if (quiz.targetSection && quiz.targetSection !== student.section) return false
        return true
    }

    const quizzes = [
        { q: quizSem1, sem: 1, name: 'Quiz Sem1' },
        { q: quizSem3, sem: 3, name: 'Quiz Sem3' },
        { q: quizSem5, sem: 5, name: 'Quiz Sem5' }
    ]

    for (const s of allStudents) {
        console.log(`\nuser: ${s.email} (Sem ${s.semester}, Batch ${s.batch})`)
        for (const { q, sem, name } of quizzes) {
            const visible = canSee(s, q, sem)
            console.log(`   - ${name}: ${visible ? '✅ VISIBLE' : '❌ HIDDEN'}`)
        }
    }

    // 6. Output Table
    console.log('\n\n=== CREDENTIALS ===')
    console.table(allStudents.map(s => ({
        Email: s.email,
        Password: 'student123',
        Role: s.role,
        Batch: s.batch,
        Sem: s.semester
    })))
    console.log(`Faculty: demo.faculty@college.edu / faculty123`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
