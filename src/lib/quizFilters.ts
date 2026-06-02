import { normalizeBatch } from '@/lib/utils'

interface QuizTargeting {
    assignedBatches: unknown
    targetSection: string | null
    targetSemester: number | null
}

interface StudentProfile {
    batch: string | null
    section: string | null
    semester: number | null
}

export interface TargetingFlags {
    enableYearTargeting?: boolean
    enableSemesterTargeting?: boolean
    enableBatchTargeting?: boolean
}

/**
 * Returns true if the student matches all active targeting restrictions on the quiz.
 * A null/empty restriction means "all" — no filter applied for that dimension.
 * Flags control which dimensions are evaluated at all (admin-configurable).
 * Applied identically in: student dashboard, subject detail page, quiz GET, quiz start.
 */
export function matchesQuizTargeting(
    quiz: QuizTargeting,
    student: StudentProfile,
    flags: TargetingFlags = {}
): boolean {
    const {
        enableYearTargeting = true,
        enableSemesterTargeting = true,
        enableBatchTargeting = true,
    } = flags

    // 1. Year (batch) check
    if (enableYearTargeting) {
        const yearRestrictions = Array.isArray(quiz.assignedBatches) ? quiz.assignedBatches as string[] : []
        if (yearRestrictions.length > 0) {
            if (!student.batch) return false
            const studentYear = normalizeBatch(student.batch)
            const quizYears = yearRestrictions.map(b => normalizeBatch(b))
            if (!quizYears.includes(studentYear)) return false
        }
    }

    // 2. Batch number (section) check
    if (enableBatchTargeting) {
        if (quiz.targetSection && student.section !== quiz.targetSection) return false
    }

    // 3. Semester check
    if (enableSemesterTargeting) {
        if (quiz.targetSemester !== null && quiz.targetSemester !== undefined) {
            if (student.semester !== quiz.targetSemester) return false
        }
    }

    return true
}
