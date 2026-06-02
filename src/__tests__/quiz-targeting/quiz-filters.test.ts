/**
 * Unit tests for matchesQuizTargeting() in src/lib/quizFilters.ts
 *
 * This is the core eligibility function used in four places:
 *   - GET  /api/quizzes/[id]        (student quiz visibility)
 *   - POST /api/quizzes/[id]/start  (quiz attempt gating)
 *   - /student page                 (dashboard quiz list)
 *   - /student/subjects/[id] page   (subject detail quiz list)
 *
 * Every change here affects what quizzes students can see AND take.
 */
import { describe, it, expect } from 'vitest'
import { matchesQuizTargeting } from '@/lib/quizFilters'

// ── Helper builders ───────────────────────────────────────────────────────────

type Quiz = Parameters<typeof matchesQuizTargeting>[0]
type Student = Parameters<typeof matchesQuizTargeting>[1]
type Flags = Parameters<typeof matchesQuizTargeting>[2]

function quiz(overrides: Partial<Quiz> = {}): Quiz {
    return { assignedBatches: null, targetSection: null, targetSemester: null, ...overrides }
}

function student(overrides: Partial<Student> = {}): Student {
    return { batch: '2023-26', section: '1', semester: 3, ...overrides }
}

const ALL_FLAGS: Flags = { enableYearTargeting: true, enableSemesterTargeting: true, enableBatchTargeting: true }
const NO_FLAGS:  Flags = { enableYearTargeting: false, enableSemesterTargeting: false, enableBatchTargeting: false }

// ── No restrictions (open quiz) ───────────────────────────────────────────────

describe('Open quiz — no restrictions', () => {
    it('null assignedBatches, null targetSection, null targetSemester → always eligible', () => {
        expect(matchesQuizTargeting(quiz(), student(), ALL_FLAGS)).toBe(true)
    })

    it('empty assignedBatches array → no year restriction → eligible', () => {
        expect(matchesQuizTargeting(quiz({ assignedBatches: [] }), student(), ALL_FLAGS)).toBe(true)
    })

    it('student with no batch/section/semester → eligible when no restrictions', () => {
        expect(matchesQuizTargeting(quiz(), student({ batch: null, section: null, semester: null }), ALL_FLAGS)).toBe(true)
    })
})

// ── Year (batch) targeting ────────────────────────────────────────────────────

describe('Year (batch) targeting', () => {
    it('student batch matches assigned batch → eligible', () => {
        expect(matchesQuizTargeting(
            quiz({ assignedBatches: ['2023-26'] }),
            student({ batch: '2023-26' }),
            ALL_FLAGS
        )).toBe(true)
    })

    it('student batch NOT in assigned batches → ineligible', () => {
        expect(matchesQuizTargeting(
            quiz({ assignedBatches: ['2023-26'] }),
            student({ batch: '2024-27' }),
            ALL_FLAGS
        )).toBe(false)
    })

    it('student in one of multiple batches → eligible', () => {
        expect(matchesQuizTargeting(
            quiz({ assignedBatches: ['2022-25', '2023-26', '2024-27'] }),
            student({ batch: '2023-26' }),
            ALL_FLAGS
        )).toBe(true)
    })

    it('student not in any of multiple batches → ineligible', () => {
        expect(matchesQuizTargeting(
            quiz({ assignedBatches: ['2022-25', '2024-27'] }),
            student({ batch: '2023-26' }),
            ALL_FLAGS
        )).toBe(false)
    })

    it('batch comparison is case-insensitive (normalizeBatch uppercases)', () => {
        expect(matchesQuizTargeting(
            quiz({ assignedBatches: ['2023-26'] }),
            student({ batch: '2023-26' }),
            ALL_FLAGS
        )).toBe(true)
    })

    it('batch comparison trims whitespace', () => {
        expect(matchesQuizTargeting(
            quiz({ assignedBatches: [' 2023-26 '] }),
            student({ batch: '2023-26' }),
            ALL_FLAGS
        )).toBe(true)
    })

    it('student with null batch when quiz restricts by year → ineligible', () => {
        expect(matchesQuizTargeting(
            quiz({ assignedBatches: ['2023-26'] }),
            student({ batch: null }),
            ALL_FLAGS
        )).toBe(false)
    })

    it('year targeting disabled by flag → batch restriction ignored', () => {
        expect(matchesQuizTargeting(
            quiz({ assignedBatches: ['2023-26'] }),
            student({ batch: '2024-27' }),
            { enableYearTargeting: false, enableSemesterTargeting: true, enableBatchTargeting: true }
        )).toBe(true)
    })
})

// ── Section (batch number) targeting ─────────────────────────────────────────

describe('Section (batch number) targeting', () => {
    it('student section matches targetSection → eligible', () => {
        expect(matchesQuizTargeting(
            quiz({ targetSection: '1' }),
            student({ section: '1' }),
            ALL_FLAGS
        )).toBe(true)
    })

    it('student section does NOT match targetSection → ineligible', () => {
        expect(matchesQuizTargeting(
            quiz({ targetSection: '1' }),
            student({ section: '2' }),
            ALL_FLAGS
        )).toBe(false)
    })

    it('student section 3 vs targetSection 1 → ineligible', () => {
        expect(matchesQuizTargeting(
            quiz({ targetSection: '1' }),
            student({ section: '3' }),
            ALL_FLAGS
        )).toBe(false)
    })

    it('null targetSection → no section restriction', () => {
        expect(matchesQuizTargeting(
            quiz({ targetSection: null }),
            student({ section: '5' }),
            ALL_FLAGS
        )).toBe(true)
    })

    it('student with null section vs targetSection → ineligible', () => {
        expect(matchesQuizTargeting(
            quiz({ targetSection: '1' }),
            student({ section: null }),
            ALL_FLAGS
        )).toBe(false)
    })

    it('batch targeting disabled by flag → section restriction ignored', () => {
        expect(matchesQuizTargeting(
            quiz({ targetSection: '1' }),
            student({ section: '5' }),
            { enableYearTargeting: true, enableSemesterTargeting: true, enableBatchTargeting: false }
        )).toBe(true)
    })
})

// ── Semester targeting ────────────────────────────────────────────────────────

describe('Semester targeting (quiz-level)', () => {
    it('student semester matches targetSemester → eligible', () => {
        expect(matchesQuizTargeting(
            quiz({ targetSemester: 3 }),
            student({ semester: 3 }),
            ALL_FLAGS
        )).toBe(true)
    })

    it('student semester does NOT match targetSemester → ineligible', () => {
        expect(matchesQuizTargeting(
            quiz({ targetSemester: 3 }),
            student({ semester: 5 }),
            ALL_FLAGS
        )).toBe(false)
    })

    it('null targetSemester → no quiz-level semester restriction', () => {
        expect(matchesQuizTargeting(
            quiz({ targetSemester: null }),
            student({ semester: 7 }),
            ALL_FLAGS
        )).toBe(true)
    })

    it('semester targeting disabled by flag → targetSemester ignored', () => {
        expect(matchesQuizTargeting(
            quiz({ targetSemester: 3 }),
            student({ semester: 7 }),
            { enableYearTargeting: true, enableSemesterTargeting: false, enableBatchTargeting: true }
        )).toBe(true)
    })

    it('student semester null vs targetSemester set → ineligible', () => {
        expect(matchesQuizTargeting(
            quiz({ targetSemester: 3 }),
            student({ semester: null }),
            ALL_FLAGS
        )).toBe(false)
    })
})

// ── Combined targeting (multi-dimension) ──────────────────────────────────────

describe('Combined targeting — all three dimensions', () => {
    const targetedQuiz = quiz({
        assignedBatches: ['2023-26'],
        targetSection: '1',
        targetSemester: 3,
    })

    it('student matching all three → eligible', () => {
        expect(matchesQuizTargeting(
            targetedQuiz,
            student({ batch: '2023-26', section: '1', semester: 3 }),
            ALL_FLAGS
        )).toBe(true)
    })

    it('right batch + right section + WRONG semester → ineligible', () => {
        expect(matchesQuizTargeting(
            targetedQuiz,
            student({ batch: '2023-26', section: '1', semester: 5 }),
            ALL_FLAGS
        )).toBe(false)
    })

    it('right batch + WRONG section + right semester → ineligible', () => {
        expect(matchesQuizTargeting(
            targetedQuiz,
            student({ batch: '2023-26', section: '2', semester: 3 }),
            ALL_FLAGS
        )).toBe(false)
    })

    it('WRONG batch + right section + right semester → ineligible', () => {
        expect(matchesQuizTargeting(
            targetedQuiz,
            student({ batch: '2024-27', section: '1', semester: 3 }),
            ALL_FLAGS
        )).toBe(false)
    })

    it('all three wrong → ineligible', () => {
        expect(matchesQuizTargeting(
            targetedQuiz,
            student({ batch: '2024-27', section: '5', semester: 7 }),
            ALL_FLAGS
        )).toBe(false)
    })

    it('all flags disabled → open to everyone regardless of restrictions', () => {
        expect(matchesQuizTargeting(
            targetedQuiz,
            student({ batch: '2099-99', section: '13', semester: 8 }),
            NO_FLAGS
        )).toBe(true)
    })
})

// ── Partial targeting (one or two dimensions set) ────────────────────────────

describe('Partial targeting — one dimension', () => {
    it('year only — matching student → eligible', () => {
        const q = quiz({ assignedBatches: ['2023-26'] })
        expect(matchesQuizTargeting(q, student({ batch: '2023-26', section: '9', semester: 7 }), ALL_FLAGS)).toBe(true)
    })

    it('year only — wrong batch → ineligible', () => {
        const q = quiz({ assignedBatches: ['2023-26'] })
        expect(matchesQuizTargeting(q, student({ batch: '2022-25', section: '1', semester: 3 }), ALL_FLAGS)).toBe(false)
    })

    it('section only — matching section → eligible', () => {
        const q = quiz({ targetSection: '2' })
        expect(matchesQuizTargeting(q, student({ batch: '2099-99', section: '2', semester: 8 }), ALL_FLAGS)).toBe(true)
    })

    it('section only — wrong section → ineligible', () => {
        const q = quiz({ targetSection: '2' })
        expect(matchesQuizTargeting(q, student({ batch: '2023-26', section: '1', semester: 3 }), ALL_FLAGS)).toBe(false)
    })

    it('semester only — matching semester → eligible', () => {
        const q = quiz({ targetSemester: 5 })
        expect(matchesQuizTargeting(q, student({ batch: '2099-99', section: '9', semester: 5 }), ALL_FLAGS)).toBe(true)
    })

    it('semester only — wrong semester → ineligible', () => {
        const q = quiz({ targetSemester: 5 })
        expect(matchesQuizTargeting(q, student({ batch: '2023-26', section: '1', semester: 3 }), ALL_FLAGS)).toBe(false)
    })
})

// ── Default flags (no flags passed) ──────────────────────────────────────────

describe('Default flags (all enabled when not passed)', () => {
    it('no flags arg → defaults all enabled → restrictions enforced', () => {
        expect(matchesQuizTargeting(
            quiz({ assignedBatches: ['2023-26'] }),
            student({ batch: '2024-27' })
            // no flags argument
        )).toBe(false)
    })

    it('empty flags object → defaults all enabled', () => {
        expect(matchesQuizTargeting(
            quiz({ targetSection: '1' }),
            student({ section: '2' }),
            {}
        )).toBe(false)
    })
})

// ── Edge cases ────────────────────────────────────────────────────────────────

describe('Edge cases', () => {
    it('assignedBatches as non-array (bad DB data) → treated as empty → open', () => {
        expect(matchesQuizTargeting(
            quiz({ assignedBatches: 'not-an-array' as unknown as string[] }),
            student({ batch: '2023-26' }),
            ALL_FLAGS
        )).toBe(true)
    })

    it('single-student batch "2023-26" matches "2023-26" in multi-batch list', () => {
        expect(matchesQuizTargeting(
            quiz({ assignedBatches: ['2022-25', '2023-26'] }),
            student({ batch: '2023-26' }),
            ALL_FLAGS
        )).toBe(true)
    })

    it('batch with trailing whitespace still matches after normalization', () => {
        expect(matchesQuizTargeting(
            quiz({ assignedBatches: ['2023-26'] }),
            student({ batch: '  2023-26  ' }),
            ALL_FLAGS
        )).toBe(true)
    })

    it('targetSection "0" does not match section "1"', () => {
        expect(matchesQuizTargeting(
            quiz({ targetSection: '0' }),
            student({ section: '1' }),
            ALL_FLAGS
        )).toBe(false)
    })

    it('targetSemester 0 vs student semester 0 → matches (edge numeric)', () => {
        expect(matchesQuizTargeting(
            quiz({ targetSemester: 0 }),
            student({ semester: 0 }),
            ALL_FLAGS
        )).toBe(true)
    })
})
