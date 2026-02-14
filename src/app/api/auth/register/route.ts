import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, email, password, rollNumber, campusId, batch, semester, section } = body

        // Validate required fields
        if (!name || !email || !password || !rollNumber || !campusId || !batch || !semester || !section) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            )
        }

        // Validate email format and domain
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            )
        }

        // Validate email domain
        if (!email.toLowerCase().endsWith('@yenepoya.edu.in')) {
            return NextResponse.json(
                { error: "Email must be a @yenepoya.edu.in address" },
                { status: 400 }
            )
        }

        // Validate campus ID (5 digits)
        if (!/^\d{5}$/.test(campusId)) {
            return NextResponse.json(
                { error: "Campus ID must be exactly 5 digits" },
                { status: 400 }
            )
        }

        // Validate password strength
        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            )
        }
        if (!/[a-z]/.test(password)) {
            return NextResponse.json(
                { error: "Password must contain at least one lowercase letter" },
                { status: 400 }
            )
        }
        if (!/[A-Z]/.test(password)) {
            return NextResponse.json(
                { error: "Password must contain at least one uppercase letter" },
                { status: 400 }
            )
        }
        if (!/[0-9]/.test(password)) {
            return NextResponse.json(
                { error: "Password must contain at least one number" },
                { status: 400 }
            )
        }
        if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(password)) {
            return NextResponse.json(
                { error: "Password must contain at least one special character" },
                { status: 400 }
            )
        }

        // Validate semester
        const semesterNum = parseInt(semester)
        if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
            return NextResponse.json(
                { error: "Semester must be between 1 and 8" },
                { status: 400 }
            )
        }

        // Check if email already exists
        const existingEmail = await prisma.user.findUnique({
            where: { email }
        })

        if (existingEmail) {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 409 }
            )
        }

        // Check if roll number already exists
        const existingRollNumber = await prisma.user.findUnique({
            where: { rollNumber }
        })

        if (existingRollNumber) {
            return NextResponse.json(
                { error: "Registration number already exists" },
                { status: 409 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                rollNumber,
                campusId,
                batch,
                semester: semesterNum,
                section,
                role: "STUDENT",
                department: "Computer Science" // Default department
            }
        })

        return NextResponse.json(
            {
                message: "Registration successful",
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    rollNumber: user.rollNumber
                }
            },
            { status: 201 }
        )

    } catch (error) {
        console.error("Registration error:", error)
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        )
    }
}
