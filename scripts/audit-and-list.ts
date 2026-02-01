import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('=== SYSTEM AUDIT & VERIFICATION ===\n')

    // 1. List All Users
    console.log('--- 1. CURRENT USERS ---')
    const users = await prisma.user.findMany({
        orderBy: { role: 'asc' }
    })

    console.table(users.map(u => ({
        Role: u.role,
        Name: u.name,
        Email: u.email,
        Department: u.department || '-',
        Semester: u.semester || '-',
        Batch: u.batch || '-',
        Section: u.section || '-'
    })))

    // 2. Integration Test
    console.log('\n--- 2. RUNNING INTEGRATION TEST ---')
    const timestamp = Date.now()

    // A. Create Admin, Faculty, Student
    console.log('Creating Test Users...')
    const admin = await prisma.user.create({
        data: { email: `admin.${timestamp}@test.com`, password: 'hash', name: 'Test Admin', role: 'ADMIN' }
    })
    const faculty = await prisma.user.create({
        data: { email: `faculty.${timestamp}@test.com`, password: 'hash', name: 'Test Faculty', role: 'FACULTY' }
    })
    const studentOk = await prisma.user.create({
        data: { email: `studentk.${timestamp}@test.com`, password: 'hash', name: 'Student OK', role: 'STUDENT', semester: 1, batch: '2025-28', section: '1' }
    })
    const studentFailBatch = await prisma.user.create({
        data: { email: `studentfb.${timestamp}@test.com`, password: 'hash', name: 'Student Fail Batch', role: 'STUDENT', semester: 1, batch: '2024-27', section: '1' }
    })
    const studentFailSec = await prisma.user.create({
        data: { email: `studentfs.${timestamp}@test.com`, password: 'hash', name: 'Student Fail Sec', role: 'STUDENT', semester: 1, batch: '2025-28', section: '2' }
    })
    const studentFailSem = await prisma.user.create({
        data: { email: `studentfsem.${timestamp}@test.com`, password: 'hash', name: 'Student Fail Sem', role: 'STUDENT', semester: 2, batch: '2025-28', section: '1' }
    })

    // B. Create Subject (Pending -> Approved)
    console.log('Testing Subject Approval...')
    const subject = await prisma.subject.create({
        data: {
            code: `TEST${timestamp}`,
            name: 'Test Subject',
            semester: 1,
            isApproved: false, // Pending
            faculty: { connect: { id: faculty.id } }
        }
    })

    // Verify Pending
    let subjCheck = await prisma.subject.findUnique({ where: { id: subject.id } })
    if (subjCheck?.isApproved) console.error('❌ ERROR: Subject should be pending')
    else console.log('✅ Subject created as Pending')

    // Admin Approves
    await prisma.subject.update({ where: { id: subject.id }, data: { isApproved: true } })
    console.log('✅ Admin approved subject')

    // C. Create Quiz (Target: 2025-28, Sec 1)
    console.log('Testing Quiz Targeting...')
    const quiz = await prisma.quiz.create({
        data: {
            title: 'Strict Quiz',
            subjectId: subject.id,
            facultyId: faculty.id,
            totalQuestions: 1,
            assignedBatches: ['2025-28'],
            targetSection: '1',
            isPublished: true,
            questions: { create: { text: 'Q1', options: '[]', correctIndex: 0 } }
        }
    })

    // D. Function to check visibility logic (mimicking backend logic)
    const checkVisibility = (student: any) => {
        // 1. Sem Check
        if (student.semester !== subject.semester) return false
        // 2. Batch Check
        // @ts-ignore
        const batches = (quiz.assignedBatches as string[]) || []
        if (batches.length > 0 && !batches.includes(student.batch)) return false
        // 3. Section Check
        if (student.section !== quiz.targetSection) return false
        return true
    }

    if (checkVisibility(studentOk)) console.log('✅ Student OK sees quiz')
    else console.error('❌ ERROR: Student OK should see quiz')

    if (!checkVisibility(studentFailBatch)) console.log('✅ Student Fail Batch blocked')
    else console.error('❌ ERROR: Student Fail Batch should be blocked')

    if (!checkVisibility(studentFailSec)) console.log('✅ Student Fail Section blocked')
    else console.error('❌ ERROR: Student Fail Section should be blocked')

    if (!checkVisibility(studentFailSem)) console.log('✅ Student Fail Semester blocked')
    else console.error('❌ ERROR: Student Fail Semester should be blocked')

    // Cleanup
    console.log('\n--- CLEANUP ---')
    await prisma.quiz.delete({ where: { id: quiz.id } })
    await prisma.subject.delete({ where: { id: subject.id } })
    await prisma.user.deleteMany({ where: { id: { in: [admin.id, faculty.id, studentOk.id, studentFailBatch.id, studentFailSec.id, studentFailSem.id] } } })
    console.log('Cleanup complete.')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
