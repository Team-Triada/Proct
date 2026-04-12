import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET faculty's assigned subjects
export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    if (user.role !== 'FACULTY') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const faculty = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
            subjects: {
                orderBy: { semester: 'asc' }
            }
        }
    })

    return NextResponse.json(faculty?.subjects || [])
}

// POST - Create a new subject and assign to faculty
export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    if (user.role !== 'FACULTY') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { code, name, semester, department } = body

        if (!code || !name || !semester) {
            return NextResponse.json({ error: 'Code, name, and semester are required' }, { status: 400 })
        }

        // Check if subject with this code already exists
        const existing = await prisma.subject.findUnique({ where: { code } })

        if (existing) {
            // If exists, just connect it to this faculty
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    subjects: { connect: { id: existing.id } }
                },
                include: { subjects: true }
            })
            return NextResponse.json(existing)
        }

        // Create new subject and connect to faculty
        const subject = await prisma.subject.create({
            data: {
                code,
                name,
                semester: parseInt(semester),
                department: department || 'Computer Science',
                isApproved: false // Requires admin approval
            }
        })

        // Connect the subject to the faculty
        await prisma.user.update({
            where: { id: user.id },
            data: {
                subjects: { connect: { id: subject.id } }
            }
        })

        return NextResponse.json(subject, { status: 201 })
    } catch (error) {
        console.error('Error creating subject:', error)
        const message = error instanceof Error ? error.message : 'Failed to create subject'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
