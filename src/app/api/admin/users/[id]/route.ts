import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params
        const body = await request.json()
        const { email, password, name, role, department, semester, batch, section, rollNumber } = body

        const data: any = {}
        if (email) data.email = email
        if (password && password.trim() !== '') {
            data.password = await bcrypt.hash(password, 10)
        }
        if (name) data.name = name
        if (role) data.role = role
        // Allow clearing fields if explicitly passed as empty string or null, or updating to new value
        if (department !== undefined) data.department = department
        if (semester !== undefined) data.semester = semester ? parseInt(semester) : null
        if (batch !== undefined) data.batch = batch
        if (section !== undefined) data.section = section
        if (rollNumber !== undefined) data.rollNumber = rollNumber

        const user = await prisma.user.update({
            where: { id },
            data
        })

        const { password: _, ...userWithoutPassword } = user
        return NextResponse.json(userWithoutPassword)
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params
        await prisma.user.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
}
