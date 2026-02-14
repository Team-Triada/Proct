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

        // Check user role to determine cleanup strategy
        const userToDelete = await prisma.user.findUnique({
            where: { id },
            include: {
                quizzes: { select: { id: true } } // For faculty
            }
        })

        if (!userToDelete) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        await prisma.$transaction(async (tx) => {
            // 1. Cleanup for Students: Delete their quiz attempts
            // We do this for all users just in case a faculty took a quiz (though unlikely/unsupported)
            // or if the role check isn't sufficient.
            await tx.quizAttempt.deleteMany({
                where: { studentId: id }
            })

            // 2. Cleanup for Faculty: Delete their quizzes and related data
            if (userToDelete.role === 'FACULTY' || userToDelete.quizzes.length > 0) {
                // Get all quiz IDs created by this faculty
                const quizIds = userToDelete.quizzes.map(q => q.id)

                if (quizIds.length > 0) {
                    // Delete related data for these quizzes
                    // A. Delete ViolationLogs for attempts on these quizzes
                    // We need to find attempts first
                    const attempts = await tx.quizAttempt.findMany({
                        where: { quizId: { in: quizIds } },
                        select: { id: true }
                    })
                    const attemptIds = attempts.map(a => a.id)

                    if (attemptIds.length > 0) {
                        await tx.violationLog.deleteMany({
                            where: { attemptId: { in: attemptIds } }
                        })

                        await tx.answer.deleteMany({
                            where: { attemptId: { in: attemptIds } }
                        })

                        // B. Delete Attempts
                        await tx.quizAttempt.deleteMany({
                            where: { quizId: { in: quizIds } }
                        })
                    }

                    // C. Delete Questions (will cascade answers if not already done, but we did attempts)
                    await tx.question.deleteMany({
                        where: { quizId: { in: quizIds } }
                    })

                    // D. Delete Quizzes
                    await tx.quiz.deleteMany({
                        where: { id: { in: quizIds } }
                    })
                }
            }

            // 3. Finally delete the user (Implicitly handles Subject relation removal)
            await tx.user.delete({
                where: { id }
            })
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Delete error:', error)
        return NextResponse.json({ error: 'Failed to delete user: ' + error.message }, { status: 500 })
    }
}
