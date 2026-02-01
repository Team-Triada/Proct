import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET faculty dashboard data including subjects with quizzes
export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any

    if (user.role !== 'FACULTY') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const faculty = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
            subjects: {
                include: {
                    quizzes: {
                        where: { facultyId: user.id },
                        include: {
                            _count: { select: { attempts: true, questions: true } }
                        }
                    },
                    _count: { select: { quizzes: true } }
                },
                orderBy: { semester: 'asc' }
            }
        }
    })

    return NextResponse.json({
        subjects: faculty?.subjects || []
    })
}
