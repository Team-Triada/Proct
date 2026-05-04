import { prisma } from '@/lib/db'

export type FieldFormat = 'NUMERIC' | 'ALPHA' | 'ALPHANUMERIC' | 'ANY'

export interface PlatformSettings {
    allowedEmailDomains: string[]
    studentIdLabel: string
    studentIdFormat: FieldFormat
    studentIdMinLength: number
    studentIdMaxLength: number
    studentIdRequired: boolean
    rollNumberLabel: string
    rollNumberFormat: FieldFormat
    rollNumberMinLength: number
    rollNumberMaxLength: number
    rollNumberRequired: boolean
    maxSemester: number
    availableBatches: string[]
    maxBatchNumber: number
    enableYearTargeting: boolean
    enableSemesterTargeting: boolean
    enableBatchTargeting: boolean
}

export const DEFAULT_SETTINGS: PlatformSettings = {
    allowedEmailDomains: [],
    studentIdLabel: 'Campus ID',
    studentIdFormat: 'ANY',
    studentIdMinLength: 1,
    studentIdMaxLength: 50,
    studentIdRequired: false,
    rollNumberLabel: 'Registration Number',
    rollNumberFormat: 'ANY',
    rollNumberMinLength: 1,
    rollNumberMaxLength: 50,
    rollNumberRequired: true,
    maxSemester: 8,
    availableBatches: [],
    maxBatchNumber: 13,
    enableYearTargeting: true,
    enableSemesterTargeting: true,
    enableBatchTargeting: true,
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
    const row = await prisma.platformSettings.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1 },
    })

    return {
        allowedEmailDomains: JSON.parse(row.allowedEmailDomains || '[]'),
        studentIdLabel: row.studentIdLabel,
        studentIdFormat: row.studentIdFormat as FieldFormat,
        studentIdMinLength: row.studentIdMinLength,
        studentIdMaxLength: row.studentIdMaxLength,
        studentIdRequired: row.studentIdRequired,
        rollNumberLabel: row.rollNumberLabel,
        rollNumberFormat: row.rollNumberFormat as FieldFormat,
        rollNumberMinLength: row.rollNumberMinLength,
        rollNumberMaxLength: row.rollNumberMaxLength,
        rollNumberRequired: row.rollNumberRequired,
        maxSemester: row.maxSemester,
        availableBatches: JSON.parse(row.availableBatches || '[]'),
        maxBatchNumber: row.maxBatchNumber,
        enableYearTargeting: row.enableYearTargeting,
        enableSemesterTargeting: row.enableSemesterTargeting,
        enableBatchTargeting: row.enableBatchTargeting,
    }
}

export function validateFieldFormat(value: string, format: FieldFormat): boolean {
    if (format === 'ANY') return true
    if (format === 'NUMERIC') return /^\d+$/.test(value)
    if (format === 'ALPHA') return /^[a-zA-Z]+$/.test(value)
    if (format === 'ALPHANUMERIC') return /^[a-zA-Z0-9]+$/.test(value)
    return true
}

export function formatHint(format: FieldFormat): string {
    if (format === 'NUMERIC') return 'numbers only'
    if (format === 'ALPHA') return 'letters only'
    if (format === 'ALPHANUMERIC') return 'letters and numbers only'
    return ''
}
