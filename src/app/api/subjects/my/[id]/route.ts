import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// PUT - Update a subject
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    if (user.role !== 'FACULTY') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    try {
        // Verify faculty owns this subject
        const faculty = await prisma.user.findUnique({
            where: { id: user.id },
            include: { subjects: { where: { id } } }
        })

        if (!faculty || faculty.subjects.length === 0) {
            return NextResponse.json({ error: 'Subject not found or not assigned to you' }, { status: 404 })
        }

        const body = await request.json()
        const { code, name, semester, department } = body

        // Check if new code conflicts with another subject
        if (code) {
            const existing = await prisma.subject.findFirst({
                where: { code, id: { not: id } }
            })
            if (existing) {
                return NextResponse.json({ error: 'Subject code already exists' }, { status: 400 })
            }
        }

        const updated = await prisma.subject.update({
            where: { id },
            data: {
                ...(code && { code }),
                ...(name && { name }),
                ...(semester && { semester: parseInt(semester) }),
                ...(department && { department })
            }
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error('Error updating subject:', error)
        const message = error instanceof Error ? error.message : 'Failed to update subject'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// DELETE - Remove subject from faculty's assigned subjects
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user

    if (user.role !== 'FACULTY') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    try {
        // Disconnect subject from faculty
        await prisma.user.update({
            where: { id: user.id },
            data: {
                subjects: { disconnect: { id } }
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error removing subject:', error)
        const message = error instanceof Error ? error.message : 'Failed to remove subject'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
