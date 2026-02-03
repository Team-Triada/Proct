import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { email, password, name, role, department, semester, batch, rollNumber } = body

        if (!email || !password || !name || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
                department: department || null,
                semester: semester ? parseInt(semester) : null,
                batch: batch || null,
                rollNumber: rollNumber || null,
            }
        })

        const { password: _, ...userWithoutPassword } = user
        return NextResponse.json(userWithoutPassword, { status: 201 })
    } catch (error: any) {
        console.error('Error creating user:', error)
        return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 })
    }
}
