import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getPlatformSettings } from '@/lib/settings'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const settings = await getPlatformSettings()
    return NextResponse.json(settings)
}

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const {
        allowedEmailDomains,
        studentIdLabel,
        studentIdFormat,
        studentIdMinLength,
        studentIdMaxLength,
        studentIdRequired,
        rollNumberLabel,
        rollNumberFormat,
        rollNumberMinLength,
        rollNumberMaxLength,
        rollNumberRequired,
        maxSemester,
        availableBatches,
        maxBatchNumber,
        enableYearTargeting,
        enableSemesterTargeting,
        enableBatchTargeting,
    } = body

    const validFormats = ['NUMERIC', 'ALPHA', 'ALPHANUMERIC', 'ANY']
    if (studentIdFormat && !validFormats.includes(studentIdFormat)) {
        return NextResponse.json({ error: 'Invalid studentIdFormat' }, { status: 400 })
    }
    if (rollNumberFormat && !validFormats.includes(rollNumberFormat)) {
        return NextResponse.json({ error: 'Invalid rollNumberFormat' }, { status: 400 })
    }

    const safeEmailDomains = Array.isArray(allowedEmailDomains) ? allowedEmailDomains : []
    const safeBatches = Array.isArray(availableBatches) ? availableBatches : []

    const settings = await prisma.platformSettings.upsert({
        where: { id: 1 },
        update: {
            allowedEmailDomains: JSON.stringify(safeEmailDomains),
            studentIdLabel: studentIdLabel ?? 'Campus ID',
            studentIdFormat: studentIdFormat ?? 'ANY',
            studentIdMinLength: studentIdMinLength ?? 1,
            studentIdMaxLength: studentIdMaxLength ?? 50,
            studentIdRequired: studentIdRequired ?? false,
            rollNumberLabel: rollNumberLabel ?? 'Registration Number',
            rollNumberFormat: rollNumberFormat ?? 'ANY',
            rollNumberMinLength: rollNumberMinLength ?? 1,
            rollNumberMaxLength: rollNumberMaxLength ?? 50,
            rollNumberRequired: rollNumberRequired ?? true,
            maxSemester: maxSemester ?? 8,
            availableBatches: JSON.stringify(safeBatches),
            maxBatchNumber: maxBatchNumber ?? 13,
            enableYearTargeting: enableYearTargeting ?? true,
            enableSemesterTargeting: enableSemesterTargeting ?? true,
            enableBatchTargeting: enableBatchTargeting ?? true,
        },
        create: {
            id: 1,
            allowedEmailDomains: JSON.stringify(allowedEmailDomains ?? []),
            studentIdLabel: studentIdLabel ?? 'Campus ID',
            studentIdFormat: studentIdFormat ?? 'ANY',
            studentIdMinLength: studentIdMinLength ?? 1,
            studentIdMaxLength: studentIdMaxLength ?? 50,
            studentIdRequired: studentIdRequired ?? false,
            rollNumberLabel: rollNumberLabel ?? 'Registration Number',
            rollNumberFormat: rollNumberFormat ?? 'ANY',
            rollNumberMinLength: rollNumberMinLength ?? 1,
            rollNumberMaxLength: rollNumberMaxLength ?? 50,
            rollNumberRequired: rollNumberRequired ?? true,
            maxSemester: maxSemester ?? 8,
            availableBatches: JSON.stringify(safeBatches),
            maxBatchNumber: maxBatchNumber ?? 13,
            enableYearTargeting: enableYearTargeting ?? true,
            enableSemesterTargeting: enableSemesterTargeting ?? true,
            enableBatchTargeting: enableBatchTargeting ?? true,
        },
    })

    return NextResponse.json({
        ...settings,
        allowedEmailDomains: JSON.parse(settings.allowedEmailDomains),
        availableBatches: JSON.parse(settings.availableBatches),
    })
}
