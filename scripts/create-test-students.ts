import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('=== CREATING TEST STUDENTS ===\n')

    const studentPass = await bcrypt.hash('student123', 10)

    const students = [
        {
            name: 'Batch 10 Student 2023',
            email: 'batch10_23@college.edu',
            sem: 5,
            batch: '2023-26'
        },
        {
            name: 'Batch 5 Student 2023',
            email: 'batch5_23@college.edu',
            sem: 5,
            batch: '2023-26'
        },
        {
            name: 'Batch 2 Student 2024',
            email: 'batch2_24@college.edu',
            sem: 3,
            batch: '2024-27'
        },
    ]

    for (const s of students) {
        const user = await prisma.user.upsert({
            where: { email: s.email },
            update: { semester: s.sem, batch: s.batch },
            create: {
                email: s.email,
                password: studentPass,
                name: s.name,
                role: 'STUDENT',
                department: 'Computer Science',
                semester: s.sem,
                batch: s.batch
            }
        })
        console.log(`✓ Created/Updated: ${user.email} (Year: ${s.batch})`)
    }

    console.log('\n=== CREDENTIALS ===')
    console.table(students.map(s => ({
        Email: s.email,
        Password: 'student123',
        Year: s.batch,
        Semester: s.sem
    })))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
