export interface Session {
    user: {
        id: string
        email: string
        name: string
        role: 'ADMIN' | 'FACULTY' | 'STUDENT'
        rollNumber?: string
    }
}

export interface Quiz {
    id: string
    title: string
    subject: string
    description?: string
    timePerQuestion: number
    totalQuestions: number
    enforcementMode: 'NORMAL' | 'STRICT'
    availableFrom?: Date
    availableUntil?: Date
    showScore: boolean
    showAnswers: boolean
    isPublished: boolean
    createdAt: Date
    updatedAt: Date
    facultyId: string
    faculty?: {
        name: string
        email: string
    }
    questions?: Question[]
    _count?: {
        questions: number
        attempts: number
    }
}

export interface Question {
    id: string
    text: string
    options: string // JSON stringified array
    correctIndex: number
    points: number
    quizId: string
}

export interface QuizAttempt {
    id: string
    questionOrder: string // JSON array of question IDs
    currentIndex: number
    status: 'IN_PROGRESS' | 'COMPLETED' | 'AUTO_SUBMITTED'
    score: number
    totalPoints: number
    violationCount: number
    startedAt: Date
    submittedAt?: Date
    studentId: string
    quizId: string
    student?: {
        name: string
        email: string
        rollNumber?: string
    }
    quiz?: Quiz
}

export interface Answer {
    id: string
    selectedIndex?: number
    isCorrect: boolean
    timeTaken: number
    answeredAt: Date
    attemptId: string
    questionId: string
}

export interface ViolationLog {
    id: string
    type: 'TAB_SWITCH' | 'VISIBILITY_LOSS' | 'BACK_NAVIGATION' | 'COPY_PASTE'
    description?: string
    occurredAt: Date
    attemptId: string
}
