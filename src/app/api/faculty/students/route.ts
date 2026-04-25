import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET students that belong to faculty's subjects
export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    // Admin can see all students
    if (user.role === 'ADMIN') {
        const students = await prisma.user.findMany({
            where: { role: 'STUDENT' },
            select: {
                id: true,
                name: true,
                email: true,
                rollNumber: true,
                campusId: true,
                semester: true,
                batch: true,
                section: true,
                department: true,
                image: true,
                role: true
            },
            orderBy: [{ batch: 'asc' }, { section: 'asc' }, { name: 'asc' }]
        })
        return NextResponse.json(students)
    }

    // Faculty can only see students from their subjects
    if (user.role !== 'FACULTY') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get faculty's subjects with their semesters
    const facultyWithSubjects = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
            subjects: {
                select: {
                    semester: true
                }
            }
        }
    })

    if (!facultyWithSubjects || facultyWithSubjects.subjects.length === 0) {
        return NextResponse.json([])
    }

    // Get unique semesters from faculty's subjects
    const semesters = [...new Set(facultyWithSubjects.subjects.map(s => s.semester))]

    // Find students with matching semesters
    const students = await prisma.user.findMany({
        where: {
            role: 'STUDENT',
            semester: { in: semesters }
        },
        select: {
            id: true,
            name: true,
            email: true,
            rollNumber: true,
            campusId: true,
            semester: true,
            batch: true,
            section: true,
            department: true,
            image: true,
            role: true
        },
        orderBy: [{ batch: 'asc' }, { section: 'asc' }, { name: 'asc' }]
    })

    return NextResponse.json(students)
}
