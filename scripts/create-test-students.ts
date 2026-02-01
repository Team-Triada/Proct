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
            batch: '2023-26',
            section: '10'
        },
        {
            name: 'Batch 5 Student 2023',
            email: 'batch5_23@college.edu',
            sem: 5,
            batch: '2023-26',
            section: '5'
        },
        {
            name: 'Batch 2 Student 2024',
            email: 'batch2_24@college.edu',
            sem: 3,
            batch: '2024-27',
            section: '2'
        },
    ]

    for (const s of students) {
        const user = await prisma.user.upsert({
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
        console.log(`✓ Created/Updated: ${user.email} (Year: ${s.batch}, Batch: ${s.section})`)
    }

    console.log('\n=== CREDENTIALS ===')
    console.table(students.map(s => ({
        Email: s.email,
        Password: 'student123',
        Year: s.batch,
        Batch: `Batch ${s.section}`,
        Semester: s.sem
    })))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
