/**
 * E2E Integration Test (Real Database, Real API Handlers)
 * This test executes the full lifecycle of a quiz without mocking the database.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'

// We ONLY mock the session to provide the ID of the real user in the DB.
// The database itself (Prisma) is NOT mocked.
vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}))

describe('E2E Platform Flow', () => {
    let facultyId: string
    let studentId: string
    let subjectId: string
    let quizId: string
    let attemptId: string

    const TIMESTAMP = Date.now()
    const PASSWORD = 'Password@123' // Meets all strength requirements

    beforeAll(async () => {
        // Clear previous E2E test data
        await prisma.violationLog.deleteMany({ where: { attempt: { student: { email: { contains: 'e2e-test' } } } } })
        await prisma.answer.deleteMany({ where: { attempt: { student: { email: { contains: 'e2e-test' } } } } })
        await prisma.quizAttempt.deleteMany({ where: { student: { email: { contains: 'e2e-test' } } } })
        await prisma.quiz.deleteMany({ where: { title: { contains: 'E2E' } } })
        await prisma.subject.deleteMany({ where: { name: { contains: 'E2E' } } })
        await prisma.user.deleteMany({ where: { email: { contains: 'e2e-test' } } })
    })

    it('1. Create Faculty (Direct DB)', async () => {
        const faculty = await prisma.user.create({
            data: {
                email: `faculty-${TIMESTAMP}-e2e-test@yenepoya.edu.in`,
                password: PASSWORD,
                name: 'E2E Faculty',
                role: 'FACULTY',
                department: 'Computer Science'
            }
        })
        facultyId = faculty.id
        expect(facultyId).toBeDefined()
    })

    it('2. Real Student Registration (API)', async () => {
        const { POST: register } = await import('@/app/api/auth/register/route')
        const email = `student-${TIMESTAMP}-e2e-test@yenepoya.edu.in`
        
        const req = new Request('http://localhost/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({
                name: 'E2E Student',
                email,
                password: PASSWORD,
                rollNumber: `E2E-${TIMESTAMP.toString().slice(-6)}`,
                campusId: '99999',
                batch: '2023-26',
                semester: '3',
                section: '1'
            })
        })

        const res = await register(req)
        const data = await res.json()
        if (res.status !== 201) console.error('Registration Error:', data)
        
        expect(res.status).toBe(201)
        studentId = data.user.id
        expect(studentId).toBeDefined()
    })

    it('3. Real Subject Creation & Admin Approval', async () => {
        // Create as Faculty
        vi.mocked(getServerSession).mockResolvedValue({ user: { id: facultyId, role: 'FACULTY' } })
        
        const subject = await prisma.subject.create({
            data: {
                name: 'E2E Web Security',
                code: `SEC-${TIMESTAMP.toString().slice(-4)}`,
                semester: 3,
                faculty: { connect: [{ id: facultyId }] }
            }
        })
        subjectId = subject.id
        expect(subject.isApproved).toBe(false)

        // Approve as Admin
        const { PUT: approveSubject } = await import('@/app/api/subjects/[id]/route')
        vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'admin-id', role: 'ADMIN' } })
        
        const req = new Request(`http://localhost/api/subjects/${subjectId}`, {
            method: 'PUT',
            body: JSON.stringify({ isApproved: true })
        })
        const res = await approveSubject(req, { params: Promise.resolve({ id: subjectId }) } as any)
        expect(res.status).toBe(200)
        
        const updated = await prisma.subject.findUnique({ where: { id: subjectId } })
        expect(updated?.isApproved).toBe(true)
    })

    it('4. Real Quiz Creation', async () => {
        const { POST: createQuiz } = await import('@/app/api/quizzes/route')
        vi.mocked(getServerSession).mockResolvedValue({ user: { id: facultyId, role: 'FACULTY' } })

        const req = new Request('http://localhost/api/quizzes', {
            method: 'POST',
            body: JSON.stringify({
                title: 'E2E Final Exam',
                subjectId,
                timePerQuestion: 60,
                totalQuestions: 1,
                isPublished: true,
                assignedBatches: ['2023-26'],
                questions: [
                    {
                        text: 'What is CSRF?',
                        type: 'MULTIPLE_CHOICE',
                        options: ['Cross-Site Request Forgery', 'Cross-Site Research', 'None'],
                        correctIndex: 0,
                        points: 5
                    }
                ]
            })
        })

        const res = await createQuiz(req)
        const data = await res.json()
        if (res.status !== 201) console.error('Quiz Create Error:', data)

        expect(res.status).toBe(201)
        quizId = data.id
    })

    it('5. Real Student Attempt & Completion', async () => {
        // Start Attempt
        const { POST: startQuiz } = await import('@/app/api/quizzes/[id]/start/route')
        const student = await prisma.user.findUnique({ where: { id: studentId } })
        vi.mocked(getServerSession).mockResolvedValue({ user: { id: studentId, role: 'STUDENT', email: student?.email } })
        
        const startRes = await startQuiz(new Request('http://localhost'), { params: Promise.resolve({ id: quizId }) } as any)
        expect(startRes.status).toBe(200)
        const startData = await startRes.json()
        attemptId = startData.attemptId

        // Save Answer
        const { POST: saveAnswer } = await import('@/app/api/attempts/[id]/save/route')
        const questionId = (await prisma.question.findFirst({ where: { quizId } }))!.id
        
        const saveReq = new Request(`http://localhost/api/attempts/${attemptId}/save`, {
            method: 'POST',
            body: JSON.stringify({
                questionId,
                selectedIndex: 0,
                currentQuestionIndex: 0
            })
        })
        const saveRes = await saveAnswer(saveReq, { params: Promise.resolve({ id: attemptId }) } as any)
        expect(saveRes.status).toBe(200)

        // Submit Quiz
        const { POST: submitQuiz } = await import('@/app/api/attempts/[id]/submit/route')
        const submitRes = await submitQuiz(new Request('http://localhost', { method: 'POST' }), { params: Promise.resolve({ id: attemptId }) } as any)
        expect(submitRes.status).toBe(200)
        const submitData = await submitRes.json()
        expect(submitData.score).toBe(5)
    })
})
