import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PUT update student details (for faculty and admin)
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user
    const { id } = await params

    // Only admin and faculty can access
    if (user.role !== 'ADMIN' && user.role !== 'FACULTY') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Get the target student
        const student = await prisma.user.findUnique({
            where: { id },
            select: { role: true, semester: true }
        })

        if (!student || student.role !== 'STUDENT') {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 })
        }

        // If faculty, verify they can edit this student
        if (user.role === 'FACULTY') {
            const facultyWithSubjects = await prisma.user.findUnique({
                where: { id: user.id },
                include: {
                    subjects: {
                        select: { semester: true }
                    }
                }
            })

            if (!facultyWithSubjects || facultyWithSubjects.subjects.length === 0) {
                return NextResponse.json({ error: 'No subjects assigned' }, { status: 403 })
            }

            const facultySemesters = facultyWithSubjects.subjects.map(s => s.semester)

            if (!student.semester || !facultySemesters.includes(student.semester)) {
                return NextResponse.json({
                    error: 'Not authorized to edit this student. Student is not in your subjects.'
                }, { status: 403 })
            }
        }

        // Parse request body
        const body = await request.json()
        const { name, rollNumber, campusId, semester, batch, section, department, image } = body

        // Update student
        const updatedStudent = await prisma.user.update({
            where: { id },
            data: {
                name: name?.trim() || undefined,
                rollNumber: rollNumber?.trim() || null,
                campusId: campusId?.trim() || null,
                semester: semester ? parseInt(semester) : null,
                batch: batch?.trim() || null,
                section: section?.trim() || null,
                department: department?.trim() || null,
                image: image?.trim() || null
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
            }
        })

        return NextResponse.json(updatedStudent)
    } catch (error) {
        console.error('Error updating student:', error)
        const message = error instanceof Error ? error.message : 'Failed to update student'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
