import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET current user profile
export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session.user as any

    const profile = await prisma.user.findUnique({
        where: { id: user.id },
        select: {
            id: true,
            name: true,
            email: true,
            rollNumber: true,
            campusId: true,
            semester: true,
            batch: true,
            department: true,
            image: true,
            role: true
        }
    })

    if (!profile) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(profile)
}

// PUT update user profile
export async function PUT(request: Request) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session.user as any
    const body = await request.json()

    const { name, rollNumber, campusId, semester, batch, department, image } = body

    // Validate required fields
    if (!name || name.trim().length === 0) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    try {
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                name: name.trim(),
                rollNumber: rollNumber?.trim() || null,
                campusId: campusId?.trim() || null,
                semester: semester ? parseInt(semester) : null,
                batch: batch?.trim() || null,
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
                department: true,
                image: true,
                role: true
            }
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error('Profile update error:', error)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }
}
