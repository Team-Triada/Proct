import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { getPlatformSettings, validateFieldFormat } from "@/lib/settings"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, email, password, rollNumber, campusId, batch, semester, section } = body

        const settings = await getPlatformSettings()

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 })
        }

        if (!batch || !semester || !section) {
            return NextResponse.json({ error: "Year, semester and batch are required" }, { status: 400 })
        }

        if (settings.rollNumberRequired && !rollNumber) {
            return NextResponse.json({ error: `${settings.rollNumberLabel} is required` }, { status: 400 })
        }

        if (settings.studentIdRequired && !campusId) {
            return NextResponse.json({ error: `${settings.studentIdLabel} is required` }, { status: 400 })
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
        }

        if (settings.allowedEmailDomains.length > 0) {
            const emailLower = email.toLowerCase()
            const allowed = settings.allowedEmailDomains.some((domain: string) =>
                emailLower.endsWith(domain.startsWith('@') ? domain.toLowerCase() : `@${domain.toLowerCase()}`)
            )
            if (!allowed) {
                const domainList = settings.allowedEmailDomains.join(', ')
                return NextResponse.json(
                    { error: `Email must be from an allowed domain: ${domainList}` },
                    { status: 400 }
                )
            }
        }

        if (campusId) {
            if (campusId.length < settings.studentIdMinLength || campusId.length > settings.studentIdMaxLength) {
                return NextResponse.json(
                    { error: `${settings.studentIdLabel} must be between ${settings.studentIdMinLength} and ${settings.studentIdMaxLength} characters` },
                    { status: 400 }
                )
            }
            if (!validateFieldFormat(campusId, settings.studentIdFormat)) {
                const hints: Record<string, string> = { NUMERIC: 'numbers only', ALPHA: 'letters only', ALPHANUMERIC: 'letters and numbers only' }
                return NextResponse.json(
                    { error: `${settings.studentIdLabel} must contain ${hints[settings.studentIdFormat]}` },
                    { status: 400 }
                )
            }
        }

        if (rollNumber) {
            if (rollNumber.length < settings.rollNumberMinLength || rollNumber.length > settings.rollNumberMaxLength) {
                return NextResponse.json(
                    { error: `${settings.rollNumberLabel} must be between ${settings.rollNumberMinLength} and ${settings.rollNumberMaxLength} characters` },
                    { status: 400 }
                )
            }
            if (!validateFieldFormat(rollNumber, settings.rollNumberFormat)) {
                const hints: Record<string, string> = { NUMERIC: 'numbers only', ALPHA: 'letters only', ALPHANUMERIC: 'letters and numbers only' }
                return NextResponse.json(
                    { error: `${settings.rollNumberLabel} must contain ${hints[settings.rollNumberFormat]}` },
                    { status: 400 }
                )
            }
        }

        if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
        if (!/[a-z]/.test(password)) return NextResponse.json({ error: "Password must contain at least one lowercase letter" }, { status: 400 })
        if (!/[A-Z]/.test(password)) return NextResponse.json({ error: "Password must contain at least one uppercase letter" }, { status: 400 })
        if (!/[0-9]/.test(password)) return NextResponse.json({ error: "Password must contain at least one number" }, { status: 400 })
        if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(password)) return NextResponse.json({ error: "Password must contain at least one special character" }, { status: 400 })

        const semesterNum = parseInt(semester)
        if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > settings.maxSemester) {
            return NextResponse.json(
                { error: `Semester must be between 1 and ${settings.maxSemester}` },
                { status: 400 }
            )
        }

        const batchNum = parseInt(section)
        if (isNaN(batchNum) || batchNum < 1 || batchNum > settings.maxBatchNumber) {
            return NextResponse.json(
                { error: `Batch must be between 1 and ${settings.maxBatchNumber}` },
                { status: 400 }
            )
        }

        const existingEmail = await prisma.user.findUnique({ where: { email } })
        if (existingEmail) {
            return NextResponse.json({ error: "Email already registered" }, { status: 409 })
        }

        if (rollNumber) {
            const existingRollNumber = await prisma.user.findUnique({ where: { rollNumber } })
            if (existingRollNumber) {
                return NextResponse.json({ error: `${settings.rollNumberLabel} already exists` }, { status: 409 })
            }
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                rollNumber: rollNumber || null,
                campusId: campusId || null,
                batch,
                semester: semesterNum,
                section,
                role: "STUDENT",
            }
        })

        return NextResponse.json(
            { message: "Registration successful", user: { id: user.id, name: user.name, email: user.email, rollNumber: user.rollNumber } },
            { status: 201 }
        )

    } catch (error) {
        console.error("Registration error:", error)
        return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
    }
}
