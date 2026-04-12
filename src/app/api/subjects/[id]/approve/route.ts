import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    try {
        const subject = await prisma.subject.update({
            where: { id },
            data: { isApproved: true }
        })

        return NextResponse.json(subject)
    } catch {
        return NextResponse.json({ error: 'Failed to approve subject' }, { status: 500 })
    }
}
